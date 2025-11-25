#!/usr/bin/env node
/**
 * Batch Commands Example
 *
 * Demonstrates how to send commands to multiple agents simultaneously
 * using the unified communication API.
 *
 * Usage:
 *   node examples/batch-commands.js
 *   node examples/batch-commands.js --config batch-config.json
 *   node examples/batch-commands.js --parallel
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  config: null,
  parallel: false,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--config':
      options.config = args[++i];
      break;
    case '--parallel':
      options.parallel = true;
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Batch Commands - Send commands to multiple agents

Usage: node batch-commands.js [options]

Options:
  --config <file>   Load batch configuration from JSON file
  --parallel        Execute all commands in parallel
  --dry-run         Show what would be executed without sending
  --verbose, -v     Show detailed output
  --help, -h        Show this help

Configuration File Format:
  {
    "commands": [
      {
        "target": "anga",
        "action": "review code",
        "data": { "pr": 123 }
      },
      {
        "target": "marie",
        "action": "evaluate students"
      }
    ]
  }

Examples:
  node batch-commands.js --parallel
  node batch-commands.js --config my-batch.json --dry-run
`);
      process.exit(0);
  }
}

// Default batch commands for demonstration
const DEFAULT_BATCH = {
  commands: [
    {
      target: 'anga',
      action: 'review',
      description: 'Review latest pull requests',
      priority: 'high'
    },
    {
      target: 'marie',
      action: 'evaluate',
      description: 'Evaluate student progress for recital',
      priority: 'normal'
    },
    {
      target: 'fabien',
      action: 'analyze',
      description: 'Analyze Q4 marketing metrics',
      priority: 'normal'
    },
    {
      target: ['anga', 'marie', 'fabien'],
      action: 'status',
      description: 'Report current status',
      isBroadcast: true
    }
  ]
};

// Mock AgentComm for demonstration
class MockAgentComm extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.verbose = opts.verbose || false;
  }

  async initialize() {
    if (this.verbose) {
      console.log('[comm] Initializing communication...');
    }
    await sleep(100);
  }

  async send(target, message) {
    if (this.verbose) {
      console.log(`[comm] Sending to ${target}:`, message.action);
    }

    await sleep(Math.random() * 100 + 50);

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      target,
      strategy: 'pty-wrapper'
    };
  }

  async broadcast(targets, message) {
    if (this.verbose) {
      console.log(`[comm] Broadcasting to ${targets.join(', ')}:`, message.action);
    }

    const results = await Promise.allSettled(
      targets.map(t => this.send(t, message))
    );

    return {
      total: targets.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        target: targets[i],
        success: r.status === 'fulfilled',
        messageId: r.value?.messageId,
        error: r.reason?.message
      }))
    };
  }

  async stop() {
    if (this.verbose) {
      console.log('[comm] Disconnecting...');
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateCommandId() {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadConfig(configPath) {
  if (!configPath) return DEFAULT_BATCH;

  try {
    const fullPath = path.resolve(configPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    process.exit(1);
  }
}

async function executeSequential(comm, commands) {
  const results = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    console.log(`\n[${i + 1}/${commands.length}] Executing: ${cmd.description || cmd.action}`);

    try {
      let result;

      if (cmd.isBroadcast && Array.isArray(cmd.target)) {
        result = await comm.broadcast(cmd.target, {
          type: 'command',
          action: cmd.action,
          data: cmd.data,
          priority: cmd.priority
        });
        console.log(`  Broadcast: ${result.success}/${result.total} successful`);
      } else {
        result = await comm.send(cmd.target, {
          type: 'command',
          action: cmd.action,
          data: cmd.data,
          priority: cmd.priority
        });
        console.log(`  Sent to ${cmd.target}: ${result.messageId}`);
      }

      results.push({ command: cmd, result, success: true });
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      results.push({ command: cmd, error: error.message, success: false });
    }
  }

  return results;
}

async function executeParallel(comm, commands) {
  console.log(`\nExecuting ${commands.length} commands in parallel...`);

  const promises = commands.map(async (cmd) => {
    try {
      let result;

      if (cmd.isBroadcast && Array.isArray(cmd.target)) {
        result = await comm.broadcast(cmd.target, {
          type: 'command',
          action: cmd.action,
          data: cmd.data,
          priority: cmd.priority
        });
      } else {
        result = await comm.send(cmd.target, {
          type: 'command',
          action: cmd.action,
          data: cmd.data,
          priority: cmd.priority
        });
      }

      return { command: cmd, result, success: true };
    } catch (error) {
      return { command: cmd, error: error.message, success: false };
    }
  });

  return Promise.all(promises);
}

function printSummary(results, duration) {
  console.log('\n' + '='.repeat(60));
  console.log('  BATCH EXECUTION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n  Total commands:    ${results.length}`);
  console.log(`  Successful:        ${successful.length}`);
  console.log(`  Failed:            ${failed.length}`);
  console.log(`  Duration:          ${duration}ms`);

  if (failed.length > 0) {
    console.log('\n  Failed commands:');
    failed.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.command.description || r.command.action}`);
      console.log(`       Target: ${r.command.target}`);
      console.log(`       Error: ${r.error}`);
    });
  }

  console.log('\n  Results by target:');
  const byTarget = {};
  results.forEach(r => {
    const targets = Array.isArray(r.command.target) ? r.command.target : [r.command.target];
    targets.forEach(t => {
      if (!byTarget[t]) byTarget[t] = { success: 0, failed: 0 };
      if (r.success) byTarget[t].success++;
      else byTarget[t].failed++;
    });
  });

  Object.entries(byTarget).forEach(([target, stats]) => {
    const icon = stats.failed > 0 ? '⚠️' : '✅';
    console.log(`    ${icon} ${target}: ${stats.success} success, ${stats.failed} failed`);
  });

  console.log('\n' + '='.repeat(60));
}

function printDryRun(batch) {
  console.log('\n' + '='.repeat(60));
  console.log('  DRY RUN - Commands to be executed');
  console.log('='.repeat(60));

  batch.commands.forEach((cmd, i) => {
    console.log(`\n  [${i + 1}] ${cmd.description || cmd.action}`);
    console.log(`      Target: ${Array.isArray(cmd.target) ? cmd.target.join(', ') : cmd.target}`);
    console.log(`      Action: ${cmd.action}`);
    console.log(`      Priority: ${cmd.priority || 'normal'}`);
    if (cmd.data) {
      console.log(`      Data: ${JSON.stringify(cmd.data)}`);
    }
    if (cmd.isBroadcast) {
      console.log(`      Type: Broadcast`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`  Total: ${batch.commands.length} commands`);
  console.log('  Run without --dry-run to execute');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  CODEHORNETS BATCH COMMAND EXECUTOR');
  console.log('='.repeat(60));

  // Load configuration
  const batch = loadConfig(options.config);
  console.log(`\n  Commands to execute: ${batch.commands.length}`);
  console.log(`  Execution mode: ${options.parallel ? 'Parallel' : 'Sequential'}`);

  // Dry run mode
  if (options.dryRun) {
    printDryRun(batch);
    process.exit(0);
  }

  // Initialize communication
  const comm = new MockAgentComm({ verbose: options.verbose });

  try {
    await comm.initialize();

    const startTime = Date.now();

    // Execute commands
    let results;
    if (options.parallel) {
      results = await executeParallel(comm, batch.commands);
    } else {
      results = await executeSequential(comm, batch.commands);
    }

    const duration = Date.now() - startTime;

    // Print summary
    printSummary(results, duration);

    await comm.stop();

    // Exit with error if any failed
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error(`\nFatal error: ${error.message}`);
    await comm.stop();
    process.exit(1);
  }
}

main().catch(console.error);
