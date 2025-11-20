#!/usr/bin/env node

/**
 * Sandbox Service - Secure code execution service
 * Watches for sandbox requests and executes them in isolated Docker containers
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REQUESTS_DIR = path.resolve('/workspace/shared/sandbox-requests');
const RESULTS_DIR = path.resolve('/workspace/shared/sandbox-results');
const PROCESSING_DIR = path.resolve('/workspace/shared/sandbox-processing');
const LOG_FILE = path.resolve('/workspace/shared/watcher-logs/sandbox-service.log');

// Default limits
const DEFAULT_TIMEOUT = 300; // 5 minutes (in seconds)
const DEFAULT_MEMORY = '512m';
const DEFAULT_CPU = '1.0';

// Allowed base images (whitelist)
const ALLOWED_IMAGES = new Set([
  'python:3.8', 'python:3.9', 'python:3.10', 'python:3.11', 'python:3.12',
  'node:14', 'node:16', 'node:18', 'node:20',
  'ruby:3.0', 'ruby:3.1', 'ruby:3.2',
  'golang:1.19', 'golang:1.20', 'golang:1.21',
  'openjdk:11', 'openjdk:17', 'openjdk:21',
  'alpine:latest', 'ubuntu:20.04', 'ubuntu:22.04'
]);

/**
 * Log message with timestamp
 * @param {string} message - Message to log
 */
async function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMsg = `[${timestamp}] ${message}`;
  console.log(logMsg);

  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, logMsg + '\n', 'utf8');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Validate sandbox request
 * @param {object} request - Request object
 * @returns {{valid: boolean, error: string|null}}
 */
function validateRequest(request) {
  const requiredFields = ['request_id', 'image', 'command'];

  for (const field of requiredFields) {
    if (!(field in request)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  if (!ALLOWED_IMAGES.has(request.image)) {
    return {
      valid: false,
      error: `Image not allowed: ${request.image}. Allowed: ${Array.from(ALLOWED_IMAGES).join(', ')}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Execute command with timeout using child_process
 * @param {string[]} command - Command array
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function executeWithTimeout(command, timeout) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command;
    const process = spawn(cmd, args);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      process.kill('SIGTERM');

      // Force kill after 5 seconds if not terminated
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    process.on('close', (exitCode) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        reject(new Error('TIMEOUT'));
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: exitCode || 0
        });
      }
    });
  });
}

/**
 * Recursively remove directory
 * @param {string} dirPath - Directory path
 */
async function removeDirectory(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      await fs.unlink(dirPath);
      return;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await removeDirectory(fullPath);
        } else {
          await fs.unlink(fullPath);
        }
      })
    );

    await fs.rmdir(dirPath);
  } catch (error) {
    // Ignore errors if directory doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Execute code in sandbox container
 * @param {object} request - Request object
 * @returns {Promise<object>} Execution result
 */
async function executeSandbox(request) {
  const requestId = request.request_id;
  const image = request.image;
  const command = request.command;
  const timeout = request.timeout || DEFAULT_TIMEOUT;
  const memory = request.memory_limit || DEFAULT_MEMORY;
  const cpu = request.cpu_limit || DEFAULT_CPU;
  const workingDir = request.working_dir || '/workspace';
  const files = request.files || {};

  await log(`Executing sandbox request ${requestId}`);
  await log(`  Image: ${image}`);
  await log(`  Command: ${command}`);
  await log(`  Timeout: ${timeout}s`);

  // Create temporary directory for files
  const tempDir = path.join(PROCESSING_DIR, requestId);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Write files to temp directory
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(tempDir, filename);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf8');
      await log(`  Created file: ${filename}`);
    }

    // Build docker command
    const dockerCmd = [
      'docker', 'run',
      '--rm',
      '--network', 'none', // No network access
      '--memory', memory,
      '--cpus', cpu,
      '-v', `${tempDir}:${workingDir}`,
      '-w', workingDir,
      image,
      'sh', '-c', command
    ];

    await log(`  Running: ${dockerCmd.join(' ')}`);

    // Execute with timeout
    const startTime = Date.now();

    try {
      const result = await executeWithTimeout(dockerCmd, timeout * 1000);
      const executionTime = (Date.now() - startTime) / 1000;

      await log(`  Completed in ${executionTime.toFixed(2)}s`);
      await log(`  Exit code: ${result.exitCode}`);

      return {
        success: result.exitCode === 0,
        exit_code: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        execution_time: executionTime
      };

    } catch (error) {
      if (error.message === 'TIMEOUT') {
        await log(`  Timeout after ${timeout}s`);
        return {
          success: false,
          error: `Execution timed out after ${timeout} seconds`,
          stdout: '',
          stderr: '',
          execution_time: timeout
        };
      }
      throw error;
    }

  } catch (error) {
    await log(`  Error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      stdout: '',
      stderr: '',
      execution_time: 0
    };

  } finally {
    // Cleanup temp directory
    try {
      await removeDirectory(tempDir);
      await log('  Cleaned up temp directory');
    } catch (error) {
      await log(`  Warning: Could not cleanup temp directory: ${error.message}`);
    }
  }
}

/**
 * Process a sandbox request
 * @param {string} requestFile - Path to request file
 */
async function processRequest(requestFile) {
  try {
    // Read request
    const content = await fs.readFile(requestFile, 'utf8');
    const request = JSON.parse(content);

    const requestId = request.request_id || path.basename(requestFile, '.json');
    await log(`Processing request: ${requestId}`);

    let result;

    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      await log(`  Invalid request: ${validation.error}`);
      result = {
        request_id: requestId,
        success: false,
        error: validation.error,
        timestamp: new Date().toISOString()
      };
    } else {
      // Execute sandbox
      const execResult = await executeSandbox(request);
      result = {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        ...execResult
      };
    }

    // Write result
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    const resultFile = path.join(RESULTS_DIR, `${requestId}.json`);
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2), 'utf8');

    await log(`  Result written to ${resultFile}`);

    // Delete request file
    await fs.unlink(requestFile);
    await log('  Request file deleted');

  } catch (error) {
    await log(`Error processing request: ${error.message}`);
    await log(error.stack);
  }
}

/**
 * Main service loop
 */
async function main() {
  await log('='.repeat(60));
  await log('Sandbox Service Starting');
  await log('='.repeat(60));

  // Create directories
  await fs.mkdir(REQUESTS_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.mkdir(PROCESSING_DIR, { recursive: true });

  await log(`Requests directory: ${REQUESTS_DIR}`);
  await log(`Results directory: ${RESULTS_DIR}`);
  await log(`Allowed images: ${Array.from(ALLOWED_IMAGES).join(', ')}`);

  // Process any existing requests
  await log('Processing existing requests...');
  try {
    const files = await fs.readdir(REQUESTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const requestFile = path.join(REQUESTS_DIR, file);
      await log(`Found existing request: ${file}`);
      await processRequest(requestFile);
    }
  } catch (error) {
    await log(`Error processing existing requests: ${error.message}`);
  }

  // Start watching for new requests
  await log('Starting file watcher...');

  const watcher = chokidar.watch(REQUESTS_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // don't trigger on existing files
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  watcher.on('add', async (filePath) => {
    if (!filePath.endsWith('.json')) {
      return;
    }

    await processRequest(filePath);
  });

  watcher.on('error', async (error) => {
    await log(`Watcher error: ${error.message}`);
  });

  await log('Sandbox Service Ready - Waiting for requests...');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await log('Shutting down...');
    await watcher.close();
    await log('Sandbox Service Stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await log('Shutting down...');
    await watcher.close();
    await log('Sandbox Service Stopped');
    process.exit(0);
  });
}

// Run the service
main().catch(async (error) => {
  await log(`Fatal error: ${error.message}`);
  await log(error.stack);
  process.exit(1);
});
