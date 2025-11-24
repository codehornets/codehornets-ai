/**
 * Test Utilities for Multi-Agent Orchestration
 *
 * Common test utilities, fixtures, and helpers for testing
 * the agent communication system.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Test configuration constants
 */
const TEST_CONFIG = {
  TIMEOUT_SHORT: 5000,
  TIMEOUT_MEDIUM: 15000,
  TIMEOUT_LONG: 30000,
  RETRY_DELAY: 100,
  MAX_RETRIES: 3,
  MESSAGE_DELAY: 50,
  PIPE_DIR: '/tmp/test-pipes',
  MESSAGES_DIR: '/tmp/test-messages'
};

/**
 * Generate a unique test ID
 * @returns {string} Unique identifier
 */
function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a test message with standard format
 * @param {object} options - Message options
 * @returns {object} Formatted message
 */
function createTestMessage(options = {}) {
  return {
    id: options.id || generateTestId(),
    from: options.from || 'test-sender',
    to: options.to || 'test-receiver',
    payload: options.payload || 'test message',
    timestamp: options.timestamp || Date.now(),
    type: options.type || 'message',
    ...options.extra
  };
}

/**
 * Create multiple test messages
 * @param {number} count - Number of messages to create
 * @param {object} baseOptions - Base options for messages
 * @returns {object[]} Array of messages
 */
function createTestMessages(count, baseOptions = {}) {
  return Array.from({ length: count }, (_, index) =>
    createTestMessage({
      ...baseOptions,
      id: `${baseOptions.id || 'msg'}_${index}`,
      payload: baseOptions.payload || `Test message ${index + 1}`
    })
  );
}

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to become true
 * @param {Function} condition - Function returning boolean
 * @param {number} timeout - Maximum wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<boolean>}
 */
async function waitFor(condition, timeout = TEST_CONFIG.TIMEOUT_MEDIUM, interval = TEST_CONFIG.RETRY_DELAY) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }

  return false;
}

/**
 * Retry a function until it succeeds or max retries reached
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>}
 */
async function retry(fn, maxRetries = TEST_CONFIG.MAX_RETRIES, delay = TEST_CONFIG.RETRY_DELAY) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Create a promise that resolves after receiving an event
 * @param {EventEmitter} emitter - Event emitter to listen on
 * @param {string} eventName - Event name to wait for
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<any>}
 */
function waitForEvent(emitter, eventName, timeout = TEST_CONFIG.TIMEOUT_MEDIUM) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    emitter.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });

    emitter.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Collect events into an array
 * @param {EventEmitter} emitter - Event emitter to listen on
 * @param {string} eventName - Event name to collect
 * @param {number} count - Number of events to collect
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise<any[]>}
 */
function collectEvents(emitter, eventName, count, timeout = TEST_CONFIG.TIMEOUT_LONG) {
  return new Promise((resolve, reject) => {
    const events = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timeout collecting events. Got ${events.length}/${count}`));
    }, timeout);

    const handler = (data) => {
      events.push(data);
      if (events.length >= count) {
        clearTimeout(timer);
        emitter.off(eventName, handler);
        resolve(events);
      }
    };

    emitter.on(eventName, handler);
  });
}

/**
 * Generate test payload with special characters
 * @returns {string}
 */
function generateSpecialCharsPayload() {
  return `Test with special chars: "quotes" 'apostrophes' \`backticks\` $dollars \\backslashes
  Newlines and\ttabs included
  Unicode: Hello World Japanese Emoticons
  JSON-like: {"key": "value", "nested": {"arr": [1, 2, 3]}}
  Shell special: $(echo test) && || ; | < > >> 2>&1`;
}

/**
 * Generate large payload for stress testing
 * @param {number} sizeKB - Size in kilobytes
 * @returns {string}
 */
function generateLargePayload(sizeKB = 1) {
  const targetSize = sizeKB * 1024;
  const baseText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
  let result = '';

  while (result.length < targetSize) {
    result += baseText;
  }

  return result.substring(0, targetSize);
}

/**
 * Assert with timeout helper
 * @param {Function} assertFn - Assertion function to call
 * @param {number} timeout - Timeout in ms
 * @param {string} message - Failure message
 * @returns {Promise<void>}
 */
async function assertEventually(assertFn, timeout = TEST_CONFIG.TIMEOUT_MEDIUM, message = 'Assertion failed') {
  const result = await waitFor(async () => {
    try {
      await assertFn();
      return true;
    } catch {
      return false;
    }
  }, timeout);

  if (!result) {
    throw new Error(message);
  }
}

/**
 * Create temporary directory for tests
 * @param {string} prefix - Directory prefix
 * @returns {Promise<string>}
 */
async function createTempDir(prefix = 'test') {
  const dirPath = path.join('/tmp', `${prefix}_${generateTestId()}`);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Clean up temporary directory
 * @param {string} dirPath - Directory to remove
 * @returns {Promise<void>}
 */
async function cleanupTempDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Measure execution time of an async function
 * @param {Function} fn - Async function to measure
 * @returns {Promise<{result: any, duration: number}>}
 */
async function measureTime(fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1e6; // Convert to milliseconds

  return { result, duration };
}

/**
 * Run function multiple times and collect statistics
 * @param {Function} fn - Async function to benchmark
 * @param {number} iterations - Number of iterations
 * @returns {Promise<object>}
 */
async function benchmark(fn, iterations = 100) {
  const durations = [];

  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureTime(fn);
    durations.push(duration);
  }

  durations.sort((a, b) => a - b);

  return {
    iterations,
    min: Math.min(...durations),
    max: Math.max(...durations),
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    median: durations[Math.floor(durations.length / 2)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)]
  };
}

/**
 * Format benchmark results for display
 * @param {object} stats - Benchmark statistics
 * @returns {string}
 */
function formatBenchmarkResults(stats) {
  return `
Benchmark Results (${stats.iterations} iterations):
  Min:    ${stats.min.toFixed(2)}ms
  Max:    ${stats.max.toFixed(2)}ms
  Avg:    ${stats.avg.toFixed(2)}ms
  Median: ${stats.median.toFixed(2)}ms
  P95:    ${stats.p95.toFixed(2)}ms
  P99:    ${stats.p99.toFixed(2)}ms
`.trim();
}

/**
 * Check if running inside Docker container
 * @returns {boolean}
 */
function isRunningInDocker() {
  try {
    require('fs').accessSync('/.dockerenv');
    return true;
  } catch {
    return false;
  }
}

/**
 * Skip test if condition is true
 * @param {boolean} condition - Condition to check
 * @param {string} reason - Reason for skipping
 */
function skipIf(condition, reason) {
  if (condition) {
    console.log(`SKIPPED: ${reason}`);
    return true;
  }
  return false;
}

/**
 * Create a test spy function
 * @returns {object} Spy object with call tracking
 */
function createSpy() {
  const calls = [];

  const spy = (...args) => {
    calls.push({ args, timestamp: Date.now() });
    if (spy.implementation) {
      return spy.implementation(...args);
    }
  };

  spy.calls = calls;
  spy.callCount = () => calls.length;
  spy.wasCalledWith = (...expected) => calls.some(call =>
    JSON.stringify(call.args) === JSON.stringify(expected)
  );
  spy.reset = () => { calls.length = 0; };
  spy.mockImplementation = (fn) => { spy.implementation = fn; };

  return spy;
}

/**
 * Assert arrays are equal (order-independent for objects)
 * @param {any[]} actual - Actual array
 * @param {any[]} expected - Expected array
 * @returns {boolean}
 */
function arraysEqual(actual, expected) {
  if (actual.length !== expected.length) return false;

  const sortedActual = [...actual].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );
  const sortedExpected = [...expected].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );

  return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
}

module.exports = {
  TEST_CONFIG,
  generateTestId,
  createTestMessage,
  createTestMessages,
  sleep,
  waitFor,
  retry,
  waitForEvent,
  collectEvents,
  generateSpecialCharsPayload,
  generateLargePayload,
  assertEventually,
  createTempDir,
  cleanupTempDir,
  measureTime,
  benchmark,
  formatBenchmarkResults,
  isRunningInDocker,
  skipIf,
  createSpy,
  arraysEqual
};
