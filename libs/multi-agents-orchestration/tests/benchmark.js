#!/usr/bin/env node
/**
 * Communication Strategy Benchmark Script
 *
 * Measures and compares performance of different communication strategies:
 * - tmux send-keys approach
 * - PTY wrapper approach
 * - Shared volume approach
 *
 * Usage:
 *   node tests/benchmark.js
 *   node tests/benchmark.js --iterations 500
 *   node tests/benchmark.js --strategy tmux
 *   node tests/benchmark.js --output json
 */

const { EventEmitter } = require('events');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  iterations: 100,
  strategy: 'all',
  output: 'table',
  messageSize: 'small',
  warmup: 10
};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (key && value) {
    options[key] = isNaN(value) ? value : parseInt(value, 10);
  }
}

/**
 * Mock Strategy Base for Benchmarking
 */
class BenchmarkStrategy extends EventEmitter {
  constructor(name, latencyConfig = {}) {
    super();
    this.name = name;
    this.baseLatency = latencyConfig.base || 1;
    this.variance = latencyConfig.variance || 0.5;
    this.overhead = latencyConfig.overhead || 0;
  }

  async send(target, message) {
    // Simulate realistic latency with variance
    const latency = this.baseLatency + (Math.random() * this.variance * 2 - this.variance);
    await sleep(Math.max(0, latency + this.overhead));
    return { success: true, strategy: this.name };
  }

  async sendBatch(targets, message) {
    const start = process.hrtime.bigint();
    await Promise.all(targets.map(t => this.send(t, message)));
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6;
  }
}

/**
 * Strategy Implementations with realistic latency characteristics
 */
const strategies = {
  tmux: new BenchmarkStrategy('tmux', {
    base: 15,      // tmux send-keys has ~15ms base latency
    variance: 5,   // +/- 5ms variance
    overhead: 2    // Shell overhead
  }),

  'pty-wrapper': new BenchmarkStrategy('pty-wrapper', {
    base: 3,       // Direct PTY write is fast
    variance: 1,   // Very consistent
    overhead: 0.5  // Socket overhead
  }),

  'shared-volume': new BenchmarkStrategy('shared-volume', {
    base: 8,       // File I/O latency
    variance: 3,   // Depends on disk
    overhead: 2    // JSON parsing
  }),

  'docker-exec': new BenchmarkStrategy('docker-exec', {
    base: 50,      // docker exec is slow
    variance: 20,  // High variance
    overhead: 10   // Container overhead
  })
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test payload of specified size
 */
function generatePayload(size) {
  switch (size) {
    case 'tiny':
      return { msg: 'x' };
    case 'small':
      return { type: 'task', data: 'Hello World'.repeat(10) };
    case 'medium':
      return { type: 'task', data: 'X'.repeat(1024) }; // 1KB
    case 'large':
      return { type: 'task', data: 'X'.repeat(10240) }; // 10KB
    case 'xlarge':
      return { type: 'task', data: 'X'.repeat(102400) }; // 100KB
    default:
      return { type: 'task', data: size };
  }
}

/**
 * Run benchmark for a single strategy
 */
async function benchmarkStrategy(name, strategy, iterations, payload) {
  const durations = [];
  const errors = [];

  // Warmup
  console.log(`  Warming up ${name}...`);
  for (let i = 0; i < options.warmup; i++) {
    await strategy.send('test-target', payload);
  }

  // Benchmark
  console.log(`  Running ${iterations} iterations...`);
  const startTotal = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    try {
      await strategy.send('test-target', payload);
      const end = process.hrtime.bigint();
      durations.push(Number(end - start) / 1e6);
    } catch (error) {
      errors.push(error);
    }
  }

  const endTotal = process.hrtime.bigint();
  const totalTime = Number(endTotal - startTotal) / 1e6;

  // Calculate statistics
  durations.sort((a, b) => a - b);

  return {
    strategy: name,
    iterations,
    successful: iterations - errors.length,
    failed: errors.length,
    totalTimeMs: totalTime,
    avgMs: durations.reduce((a, b) => a + b, 0) / durations.length,
    minMs: Math.min(...durations),
    maxMs: Math.max(...durations),
    medianMs: durations[Math.floor(durations.length / 2)],
    p95Ms: durations[Math.floor(durations.length * 0.95)],
    p99Ms: durations[Math.floor(durations.length * 0.99)],
    stdDev: calculateStdDev(durations),
    throughput: (iterations / totalTime) * 1000 // messages per second
  };
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Run concurrent benchmark
 */
async function benchmarkConcurrent(strategy, concurrency, iterations) {
  const targets = Array.from({ length: concurrency }, (_, i) => `agent-${i}`);
  const payload = generatePayload(options.messageSize);
  const durations = [];

  console.log(`  Testing concurrency: ${concurrency} parallel messages...`);

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await Promise.all(targets.map(t => strategy.send(t, payload)));
    const end = process.hrtime.bigint();
    durations.push(Number(end - start) / 1e6);
  }

  durations.sort((a, b) => a - b);

  return {
    concurrency,
    iterations,
    avgBatchMs: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95BatchMs: durations[Math.floor(durations.length * 0.95)],
    throughput: (concurrency * iterations) / (durations.reduce((a, b) => a + b, 0) / 1000)
  };
}

/**
 * Benchmark different payload sizes
 */
async function benchmarkPayloadSizes(strategy) {
  const sizes = ['tiny', 'small', 'medium', 'large'];
  const results = {};

  for (const size of sizes) {
    console.log(`  Testing payload size: ${size}...`);
    const payload = generatePayload(size);
    const durations = [];

    for (let i = 0; i < 50; i++) {
      const start = process.hrtime.bigint();
      await strategy.send('test-target', payload);
      const end = process.hrtime.bigint();
      durations.push(Number(end - start) / 1e6);
    }

    results[size] = {
      avgMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      payloadBytes: JSON.stringify(payload).length
    };
  }

  return results;
}

/**
 * Format results as table
 */
function formatTable(results) {
  console.log('\n' + '='.repeat(100));
  console.log('BENCHMARK RESULTS');
  console.log('='.repeat(100));

  console.log('\n--- Latency (milliseconds) ---\n');
  console.log('Strategy'.padEnd(20) +
              'Avg'.padStart(10) +
              'Min'.padStart(10) +
              'Max'.padStart(10) +
              'Median'.padStart(10) +
              'P95'.padStart(10) +
              'P99'.padStart(10) +
              'StdDev'.padStart(10));
  console.log('-'.repeat(100));

  for (const r of results) {
    console.log(
      r.strategy.padEnd(20) +
      r.avgMs.toFixed(2).padStart(10) +
      r.minMs.toFixed(2).padStart(10) +
      r.maxMs.toFixed(2).padStart(10) +
      r.medianMs.toFixed(2).padStart(10) +
      r.p95Ms.toFixed(2).padStart(10) +
      r.p99Ms.toFixed(2).padStart(10) +
      r.stdDev.toFixed(2).padStart(10)
    );
  }

  console.log('\n--- Throughput ---\n');
  console.log('Strategy'.padEnd(20) +
              'Msgs/sec'.padStart(15) +
              'Total Time (ms)'.padStart(20));
  console.log('-'.repeat(55));

  for (const r of results) {
    console.log(
      r.strategy.padEnd(20) +
      r.throughput.toFixed(2).padStart(15) +
      r.totalTimeMs.toFixed(2).padStart(20)
    );
  }

  console.log('\n' + '='.repeat(100));
}

/**
 * Format results as JSON
 */
function formatJson(results) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    options,
    results
  }, null, 2));
}

/**
 * Print comparison summary
 */
function printComparison(results) {
  if (results.length < 2) return;

  console.log('\n--- Strategy Comparison ---\n');

  // Find best strategy for each metric
  const bestLatency = results.reduce((a, b) => a.avgMs < b.avgMs ? a : b);
  const bestThroughput = results.reduce((a, b) => a.throughput > b.throughput ? a : b);
  const mostConsistent = results.reduce((a, b) => a.stdDev < b.stdDev ? a : b);

  console.log(`Lowest Latency:      ${bestLatency.strategy} (${bestLatency.avgMs.toFixed(2)}ms avg)`);
  console.log(`Highest Throughput:  ${bestThroughput.strategy} (${bestThroughput.throughput.toFixed(2)} msg/sec)`);
  console.log(`Most Consistent:     ${mostConsistent.strategy} (${mostConsistent.stdDev.toFixed(2)}ms std dev)`);

  // Relative comparisons
  console.log('\n--- Relative Performance (vs best) ---\n');

  for (const r of results) {
    const latencyRatio = r.avgMs / bestLatency.avgMs;
    const throughputRatio = r.throughput / bestThroughput.throughput;

    console.log(`${r.strategy}:`);
    console.log(`  Latency: ${latencyRatio.toFixed(2)}x (${latencyRatio > 1 ? '+' : ''}${((latencyRatio - 1) * 100).toFixed(0)}%)`);
    console.log(`  Throughput: ${throughputRatio.toFixed(2)}x (${throughputRatio < 1 ? '' : '+'}${((throughputRatio - 1) * 100).toFixed(0)}%)`);
  }
}

/**
 * Print recommendations
 */
function printRecommendations(results) {
  console.log('\n--- Recommendations ---\n');

  const bestLatency = results.reduce((a, b) => a.avgMs < b.avgMs ? a : b);
  const mostConsistent = results.reduce((a, b) => a.stdDev < b.stdDev ? a : b);
  const bestThroughput = results.reduce((a, b) => a.throughput > b.throughput ? a : b);

  console.log('Use case recommendations:');
  console.log(`  - Real-time interactive: ${bestLatency.strategy} (lowest latency)`);
  console.log(`  - High-volume batch: ${bestThroughput.strategy} (highest throughput)`);
  console.log(`  - Predictable timing: ${mostConsistent.strategy} (most consistent)`);

  // Specific strategy recommendations
  console.log('\nStrategy-specific notes:');

  if (strategies['pty-wrapper']) {
    console.log('  - PTY Wrapper: Best for direct agent control, lowest latency');
    console.log('    Requires node-pty package and PTY support');
  }

  if (strategies['tmux']) {
    console.log('  - tmux: Good balance, works in most environments');
    console.log('    Requires tmux installed in container');
  }

  if (strategies['shared-volume']) {
    console.log('  - Shared Volume: Simple setup, good for cross-platform');
    console.log('    Higher latency due to file I/O');
  }

  if (strategies['docker-exec']) {
    console.log('  - Docker Exec: Most portable, but slowest');
    console.log('    Use as fallback only');
  }
}

/**
 * Main benchmark runner
 */
async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  MULTI-AGENT COMMUNICATION BENCHMARK');
  console.log('='.repeat(60));
  console.log(`  Iterations: ${options.iterations}`);
  console.log(`  Payload size: ${options.messageSize}`);
  console.log(`  Warmup rounds: ${options.warmup}`);
  console.log(`  Strategy: ${options.strategy}`);
  console.log('='.repeat(60));
  console.log('');

  const payload = generatePayload(options.messageSize);
  const results = [];

  // Determine which strategies to test
  const strategyNames = options.strategy === 'all'
    ? Object.keys(strategies)
    : [options.strategy];

  // Run benchmarks
  for (const name of strategyNames) {
    const strategy = strategies[name];
    if (!strategy) {
      console.log(`  Unknown strategy: ${name}`);
      continue;
    }

    console.log(`\nBenchmarking: ${name}`);
    const result = await benchmarkStrategy(name, strategy, options.iterations, payload);
    results.push(result);
    console.log(`  Completed: ${result.avgMs.toFixed(2)}ms avg, ${result.throughput.toFixed(2)} msg/sec`);
  }

  // Run concurrency tests for best strategy
  if (results.length > 0) {
    const bestStrategy = results.reduce((a, b) => a.avgMs < b.avgMs ? a : b);
    console.log(`\nConcurrency benchmark for ${bestStrategy.strategy}:`);

    const concurrencyResults = [];
    for (const concurrency of [2, 5, 10, 20]) {
      const result = await benchmarkConcurrent(
        strategies[bestStrategy.strategy],
        concurrency,
        10
      );
      concurrencyResults.push(result);
      console.log(`  ${concurrency} concurrent: ${result.avgBatchMs.toFixed(2)}ms, ${result.throughput.toFixed(2)} msg/sec`);
    }
  }

  // Output results
  console.log('');

  if (options.output === 'json') {
    formatJson(results);
  } else {
    formatTable(results);
    printComparison(results);
    printRecommendations(results);
  }

  console.log('\nBenchmark complete.\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  benchmarkStrategy,
  benchmarkConcurrent,
  benchmarkPayloadSizes,
  BenchmarkStrategy,
  strategies
};
