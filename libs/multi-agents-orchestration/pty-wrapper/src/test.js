#!/usr/bin/env node
/**
 * PTY Wrapper Test Suite
 *
 * Tests the completion detector and basic wrapper functionality.
 */

import { CompletionDetector, createCompletionPromise } from './completion-detector.js';

/**
 * Test the completion detector
 */
async function testCompletionDetector() {
  console.log('Testing CompletionDetector...\n');

  // Test 1: Basic detection
  console.log('Test 1: Basic completion pattern detection');
  {
    const detector = new CompletionDetector({
      silenceThresholdMs: 500,
      minOutputLength: 5
    });

    detector.addOutput('Processing your request...\n');
    detector.addOutput('Here is the result:\n');
    detector.addOutput('Hello World!\n');
    detector.addOutput('> ');  // Prompt pattern

    if (detector.checkCompletionPatterns()) {
      console.log('  PASS: Detected completion pattern\n');
    } else {
      console.log('  FAIL: Did not detect completion pattern\n');
    }
  }

  // Test 2: Promise-based completion
  console.log('Test 2: Promise-based completion');
  {
    const { detector, promise } = createCompletionPromise({
      silenceThresholdMs: 100,
      minOutputLength: 5
    });

    // Simulate output
    setTimeout(() => detector.addOutput('Line 1\n'), 10);
    setTimeout(() => detector.addOutput('Line 2\n'), 20);
    setTimeout(() => detector.addOutput('> '), 30);

    detector.startChecking(50);

    const result = await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);

    if (result.includes('Line 1') && result.includes('Line 2')) {
      console.log('  PASS: Promise resolved with correct content\n');
    } else {
      console.log('  FAIL: Promise content incorrect\n');
    }
  }

  // Test 3: Silence-based completion
  console.log('Test 3: Silence-based completion');
  {
    const { detector, promise } = createCompletionPromise({
      silenceThresholdMs: 200,
      minOutputLength: 5
    });

    detector.addOutput('Some output without prompt pattern\n');
    detector.startChecking(50);

    const start = Date.now();
    await promise;
    const elapsed = Date.now() - start;

    if (elapsed >= 150 && elapsed < 500) {
      console.log(`  PASS: Completed after silence (${elapsed}ms)\n`);
    } else {
      console.log(`  FAIL: Unexpected timing (${elapsed}ms)\n`);
    }
  }

  // Test 4: Reset functionality
  console.log('Test 4: Reset functionality');
  {
    const detector = new CompletionDetector();
    detector.addOutput('First session output\n');
    detector.markComplete();

    if (detector.isResponseComplete()) {
      detector.reset();

      if (!detector.isResponseComplete() && detector.getBuffer() === '') {
        console.log('  PASS: Reset cleared state\n');
      } else {
        console.log('  FAIL: Reset did not clear state\n');
      }
    } else {
      console.log('  FAIL: markComplete did not work\n');
    }
  }

  // Test 5: ANSI stripping
  console.log('Test 5: ANSI code stripping');
  {
    const detector = new CompletionDetector();
    detector.addOutput('\x1b[32mGreen text\x1b[0m\n');
    detector.addOutput('\x1b[1;34mBold blue\x1b[0m\n');

    const clean = detector.getCleanBuffer();
    if (!clean.includes('\x1b') && clean.includes('Green text') && clean.includes('Bold blue')) {
      console.log('  PASS: ANSI codes stripped correctly\n');
    } else {
      console.log('  FAIL: ANSI codes not stripped\n');
    }
  }

  console.log('All tests completed!\n');
}

/**
 * Main entry point
 */
async function main() {
  console.log('========================================');
  console.log('PTY Wrapper Test Suite');
  console.log('========================================\n');

  try {
    await testCompletionDetector();
  } catch (error) {
    console.error('Test error:', error.message);
    process.exit(1);
  }
}

main();
