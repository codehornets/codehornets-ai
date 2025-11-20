#!/usr/bin/env node
/**
 * Helper script for agents to submit sandbox requests
 * Usage: node sandbox_request.js --image python:3.11 --command "python script.py"
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Command } from 'commander';

// Directories (relative to agent workspace)
const REQUESTS_DIR = existsSync('/workspace/shared')
  ? '/workspace/shared/sandbox-requests'
  : './shared/sandbox-requests';
const RESULTS_DIR = existsSync('/workspace/shared')
  ? '/workspace/shared/sandbox-results'
  : './shared/sandbox-results';

/**
 * Submit a sandbox execution request
 *
 * @param {Object} options
 * @param {string} options.image - Docker image to use (e.g., "python:3.11", "node:18")
 * @param {string} options.command - Command to execute
 * @param {Object} [options.files={}] - Dict of filename -> content to create in sandbox
 * @param {number} [options.timeout=300] - Maximum execution time in seconds
 * @param {string} [options.memory="512m"] - Memory limit (e.g., "512m", "1g")
 * @param {string} [options.cpu="1.0"] - CPU limit (e.g., "0.5", "1.0")
 * @param {boolean} [options.wait=true] - Wait for result if true
 * @returns {Promise<Object|string>} Result object if wait=true, else request_id
 */
async function submitRequest({ image, command, files = {}, timeout = 300, memory = '512m', cpu = '1.0', wait = true }) {
  const requestId = `sandbox-${randomUUID()}`;

  const request = {
    request_id: requestId,
    image,
    command,
    files,
    timeout,
    memory_limit: memory,
    cpu_limit: cpu,
    submitted_at: new Date().toISOString()
  };

  // Create directories if they don't exist
  await fs.mkdir(REQUESTS_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });

  // Write request
  const requestFile = path.join(REQUESTS_DIR, `${requestId}.json`);
  await fs.writeFile(requestFile, JSON.stringify(request, null, 2));

  console.log(`✓ Sandbox request submitted: ${requestId}`);
  console.log(`  Image: ${image}`);
  console.log(`  Command: ${command}`);

  if (!wait) {
    return requestId;
  }

  // Wait for result
  process.stdout.write('  Waiting for result...');
  const resultFile = path.join(RESULTS_DIR, `${requestId}.json`);

  const maxWait = timeout + 30; // Extra 30 seconds for overhead
  const startTime = Date.now();

  while ((Date.now() - startTime) / 1000 < maxWait) {
    if (existsSync(resultFile)) {
      console.log(' Done!');
      const resultData = await fs.readFile(resultFile, 'utf8');
      const result = JSON.parse(resultData);

      // Clean up result file
      await fs.unlink(resultFile);

      return result;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    process.stdout.write('.');
  }

  console.log(' Timeout!');
  return {
    success: false,
    error: `No result received after ${maxWait} seconds`
  };
}

/**
 * Main CLI entry point
 */
async function main() {
  const program = new Command();

  program
    .name('sandbox_request')
    .description('Submit sandbox execution request')
    .requiredOption('--image <image>', 'Docker image (e.g., python:3.11)')
    .requiredOption('--command <command>', 'Command to execute')
    .option('--file <name> <content...>', 'Add file: --file script.py "print(42)"', (name, content, previous = []) => {
      // Collect file pairs
      previous.push({ name, content: content.join(' ') });
      return previous;
    })
    .option('--timeout <seconds>', 'Timeout in seconds', parseInt, 300)
    .option('--memory <limit>', 'Memory limit (e.g., 512m, 1g)', '512m')
    .option('--cpu <limit>', 'CPU limit (e.g., 0.5, 1.0)', '1.0')
    .option('--no-wait', "Don't wait for result")
    .option('--json', 'Output JSON result');

  program.parse(process.argv);
  const options = program.opts();

  // Build files dict
  const files = {};
  if (options.file && Array.isArray(options.file)) {
    for (const file of options.file) {
      files[file.name] = file.content;
    }
  }

  // Submit request
  const result = await submitRequest({
    image: options.image,
    command: options.command,
    files,
    timeout: options.timeout,
    memory: options.memory,
    cpu: options.cpu,
    wait: options.wait
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (typeof result === 'string') {
    // request_id (no-wait mode)
    console.log(`\nRequest ID: ${result}`);
    console.log(`Check result at: ${RESULTS_DIR}/${result}.json`);
  } else {
    // Full result
    console.log('\n' + '='.repeat(60));
    console.log(`Sandbox Result: ${result.request_id}`);
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✓ Success');
    } else {
      console.log(`✗ Failed: ${result.error || 'Unknown error'}`);
    }

    if ('exit_code' in result) {
      console.log(`\nExit Code: ${result.exit_code}`);
    }

    if (result.stdout) {
      console.log('\n--- STDOUT ---');
      console.log(result.stdout);
    }

    if (result.stderr) {
      console.log('\n--- STDERR ---');
      console.log(result.stderr);
    }

    if ('execution_time' in result) {
      console.log(`\nExecution Time: ${result.execution_time.toFixed(2)}s`);
    }
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

// Export for use as a module
export { submitRequest };
