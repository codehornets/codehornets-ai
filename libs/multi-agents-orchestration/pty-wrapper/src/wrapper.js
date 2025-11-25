#!/usr/bin/env node
/**
 * PTY Wrapper for Claude CLI
 *
 * Spawns Claude CLI using node-pty and exposes a Unix socket interface
 * for bidirectional communication. Supports multiple clients, command
 * queueing, and graceful shutdown.
 */

import * as pty from 'node-pty';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { CompletionDetector, createCompletionPromise } from './completion-detector.js';

// Configuration from environment
const AGENT_NAME = process.env.AGENT_NAME || 'worker';
const SOCKET_DIR = process.env.SOCKET_DIR || '/shared/sockets';
const SOCKET_PATH = process.env.SOCKET_PATH || path.join(SOCKET_DIR, `${AGENT_NAME}.sock`);
const CLAUDE_CLI = process.env.CLAUDE_CLI || 'claude';
const CLAUDE_ARGS = (process.env.CLAUDE_ARGS || '--permission-mode bypassPermissions').split(' ').filter(Boolean);
const DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT || '60000', 10);
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Logger
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };
const currentLogLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${AGENT_NAME}] ${message}${metaStr}`);
  }
}

/**
 * Command Queue for sequential execution
 */
class CommandQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Add command to queue
   * @param {object} command - Command object with handler
   * @returns {Promise} - Resolves when command completes
   */
  enqueue(command) {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...command, resolve, reject });
      this.process();
    });
  }

  /**
   * Process next command in queue
   */
  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const command = this.queue.shift();

    try {
      const result = await command.handler();
      command.resolve(result);
    } catch (error) {
      command.reject(error);
    } finally {
      this.processing = false;
      this.process(); // Process next
    }
  }

  /**
   * Get queue length
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear() {
    const pending = this.queue;
    this.queue = [];
    pending.forEach(cmd => cmd.reject(new Error('Queue cleared')));
  }
}

/**
 * PTY Wrapper Class
 */
class PtyWrapper extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agentName = options.agentName || AGENT_NAME;
    this.socketPath = options.socketPath || SOCKET_PATH;
    this.claudeCli = options.claudeCli || CLAUDE_CLI;
    this.claudeArgs = options.claudeArgs || CLAUDE_ARGS;
    this.defaultTimeout = options.defaultTimeout || DEFAULT_TIMEOUT;

    this.ptyProcess = null;
    this.server = null;
    this.clients = new Map();
    this.commandQueue = new CommandQueue();
    this.outputBuffer = '';
    this.isReady = false;
    this.isShuttingDown = false;
    this.currentCommandId = null;
    this.completionDetector = null;
  }

  /**
   * Start the PTY wrapper
   */
  async start() {
    log('info', 'Starting PTY wrapper...');

    // Ensure socket directory exists
    await this.ensureSocketDir();

    // Clean up old socket file
    await this.cleanupSocket();

    // Spawn Claude CLI
    await this.spawnClaude();

    // Start Unix socket server
    await this.startServer();

    // Setup signal handlers
    this.setupSignalHandlers();

    log('info', 'PTY wrapper started successfully', {
      socket: this.socketPath,
      agent: this.agentName
    });
  }

  /**
   * Ensure socket directory exists
   */
  async ensureSocketDir() {
    const dir = path.dirname(this.socketPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log('debug', `Created socket directory: ${dir}`);
    }
  }

  /**
   * Clean up old socket file
   */
  async cleanupSocket() {
    if (fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath);
      log('debug', 'Removed old socket file');
    }
  }

  /**
   * Spawn Claude CLI using node-pty
   */
  async spawnClaude() {
    return new Promise((resolve, reject) => {
      const cols = parseInt(process.env.COLS || '120', 10);
      const rows = parseInt(process.env.ROWS || '40', 10);

      log('info', 'Spawning Claude CLI', {
        command: this.claudeCli,
        args: this.claudeArgs.join(' '),
        cols,
        rows
      });

      try {
        this.ptyProcess = pty.spawn(this.claudeCli, this.claudeArgs, {
          name: 'xterm-256color',
          cols,
          rows,
          cwd: process.env.HOME || '/home/agent',
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8'
          }
        });

        // Handle PTY output
        this.ptyProcess.onData((data) => {
          this.handlePtyOutput(data);
        });

        // Handle PTY exit
        this.ptyProcess.onExit(({ exitCode, signal }) => {
          log('warn', 'Claude CLI exited', { exitCode, signal });
          this.emit('exit', { exitCode, signal });

          if (!this.isShuttingDown) {
            log('info', 'Attempting to restart Claude CLI...');
            setTimeout(() => this.spawnClaude(), 2000);
          }
        });

        // Wait for initial output to confirm startup
        const startupTimeout = setTimeout(() => {
          this.isReady = true;
          this.emit('ready');
          resolve();
        }, 3000);

        // Clear timeout if we get early ready signal
        const checkReady = (data) => {
          if (data.includes('>') || data.includes('$') || data.includes('claude')) {
            clearTimeout(startupTimeout);
            this.isReady = true;
            this.emit('ready');
            resolve();
          }
        };

        this.once('output', checkReady);
        setTimeout(() => this.removeListener('output', checkReady), 5000);

      } catch (error) {
        log('error', 'Failed to spawn Claude CLI', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Handle output from PTY
   * @param {string} data - Output data
   */
  handlePtyOutput(data) {
    this.outputBuffer += data;

    // Emit output event
    this.emit('output', data);

    // Feed to completion detector if active
    if (this.completionDetector) {
      this.completionDetector.addOutput(data);
    }

    // Broadcast to all connected clients
    this.broadcastOutput(data);
  }

  /**
   * Broadcast output to all clients
   * @param {string} data - Output data
   */
  broadcastOutput(data) {
    const message = JSON.stringify({
      type: 'output',
      id: this.currentCommandId,
      data,
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients) {
      try {
        if (client.subscribed) {
          client.socket.write(message + '\n');
        }
      } catch (error) {
        log('warn', `Failed to send to client ${clientId}`, { error: error.message });
      }
    }
  }

  /**
   * Start Unix socket server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleClientConnection(socket);
      });

      this.server.on('error', (error) => {
        log('error', 'Server error', { error: error.message });
        reject(error);
      });

      this.server.listen(this.socketPath, () => {
        // Set socket permissions
        fs.chmodSync(this.socketPath, 0o666);
        log('info', `Socket server listening at ${this.socketPath}`);
        resolve();
      });
    });
  }

  /**
   * Handle new client connection
   * @param {net.Socket} socket - Client socket
   */
  handleClientConnection(socket) {
    const clientId = uuidv4();

    const client = {
      id: clientId,
      socket,
      subscribed: true,
      connectedAt: new Date().toISOString()
    };

    this.clients.set(clientId, client);
    log('info', `Client connected: ${clientId}`, { total: this.clients.size });

    // Send welcome message
    socket.write(JSON.stringify({
      type: 'connected',
      clientId,
      agent: this.agentName,
      ready: this.isReady,
      queueLength: this.commandQueue.length
    }) + '\n');

    // Handle incoming data
    let buffer = '';
    socket.on('data', (data) => {
      buffer += data.toString();

      // Process complete JSON messages (newline-delimited)
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const message = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (message.trim()) {
          this.handleClientMessage(clientId, message);
        }
      }
    });

    // Handle client disconnect
    socket.on('close', () => {
      this.clients.delete(clientId);
      log('info', `Client disconnected: ${clientId}`, { total: this.clients.size });
    });

    socket.on('error', (error) => {
      log('warn', `Client error: ${clientId}`, { error: error.message });
      this.clients.delete(clientId);
    });
  }

  /**
   * Handle message from client
   * @param {string} clientId - Client ID
   * @param {string} message - JSON message string
   */
  async handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    let request;
    try {
      request = JSON.parse(message);
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Invalid JSON message',
        message
      });
      return;
    }

    log('debug', 'Received message', { clientId, type: request.type });

    switch (request.type) {
      case 'command':
        await this.handleCommand(clientId, request);
        break;

      case 'input':
        this.handleInput(clientId, request);
        break;

      case 'resize':
        this.handleResize(clientId, request);
        break;

      case 'subscribe':
        client.subscribed = true;
        this.sendToClient(clientId, { type: 'subscribed' });
        break;

      case 'unsubscribe':
        client.subscribed = false;
        this.sendToClient(clientId, { type: 'unsubscribed' });
        break;

      case 'status':
        this.sendToClient(clientId, {
          type: 'status',
          agent: this.agentName,
          ready: this.isReady,
          queueLength: this.commandQueue.length,
          currentCommand: this.currentCommandId,
          clients: this.clients.size
        });
        break;

      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
        break;

      default:
        this.sendToClient(clientId, {
          type: 'error',
          error: `Unknown message type: ${request.type}`
        });
    }
  }

  /**
   * Handle command request (queued)
   * @param {string} clientId - Client ID
   * @param {object} request - Command request
   */
  async handleCommand(clientId, request) {
    const commandId = request.id || uuidv4();
    const timeout = request.timeout || this.defaultTimeout;

    // Acknowledge command queued
    this.sendToClient(clientId, {
      type: 'queued',
      id: commandId,
      position: this.commandQueue.length + 1
    });

    try {
      const result = await this.commandQueue.enqueue({
        handler: () => this.executeCommand(clientId, commandId, request.input, timeout)
      });

      this.sendToClient(clientId, {
        type: 'complete',
        id: commandId,
        output: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendToClient(clientId, {
        type: 'error',
        id: commandId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Execute command and wait for completion
   * @param {string} clientId - Client ID
   * @param {string} commandId - Command ID
   * @param {string} input - Input text
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<string>} - Output text
   */
  async executeCommand(clientId, commandId, input, timeout) {
    return new Promise((resolve, reject) => {
      this.currentCommandId = commandId;

      // Setup completion detector
      const { detector, promise } = createCompletionPromise({
        silenceThresholdMs: 3000,
        minOutputLength: 5
      });

      this.completionDetector = detector;
      detector.startChecking(500);

      // Setup timeout
      const timeoutId = setTimeout(() => {
        detector.forceComplete();
      }, timeout);

      // Wait for completion
      promise.then((output) => {
        clearTimeout(timeoutId);
        this.completionDetector = null;
        this.currentCommandId = null;
        resolve(output);
      });

      // Send input to PTY
      log('debug', 'Sending input to PTY', { commandId, inputLength: input.length });
      this.ptyProcess.write(input + '\n');
    });
  }

  /**
   * Handle direct input (not queued)
   * @param {string} clientId - Client ID
   * @param {object} request - Input request
   */
  handleInput(clientId, request) {
    if (!this.ptyProcess) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'PTY not running'
      });
      return;
    }

    const input = request.data || '';
    this.ptyProcess.write(input);

    this.sendToClient(clientId, {
      type: 'input_sent',
      length: input.length
    });
  }

  /**
   * Handle resize request
   * @param {string} clientId - Client ID
   * @param {object} request - Resize request
   */
  handleResize(clientId, request) {
    if (!this.ptyProcess) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'PTY not running'
      });
      return;
    }

    const cols = request.cols || 120;
    const rows = request.rows || 40;

    this.ptyProcess.resize(cols, rows);

    this.sendToClient(clientId, {
      type: 'resized',
      cols,
      rows
    });
  }

  /**
   * Send message to specific client
   * @param {string} clientId - Client ID
   * @param {object} message - Message object
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.socket.write(JSON.stringify(message) + '\n');
      } catch (error) {
        log('warn', `Failed to send to client ${clientId}`, { error: error.message });
      }
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      log('info', `Received ${signal}, shutting down...`);

      // Clear command queue
      this.commandQueue.clear();

      // Close all client connections
      for (const [clientId, client] of this.clients) {
        try {
          client.socket.end(JSON.stringify({ type: 'shutdown' }) + '\n');
        } catch (e) {}
      }
      this.clients.clear();

      // Close socket server
      if (this.server) {
        this.server.close();
      }

      // Terminate PTY
      if (this.ptyProcess) {
        this.ptyProcess.kill();
      }

      // Cleanup socket file
      if (fs.existsSync(this.socketPath)) {
        fs.unlinkSync(this.socketPath);
      }

      log('info', 'Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
  }

  /**
   * Stop the wrapper
   */
  async stop() {
    this.isShuttingDown = true;
    process.emit('SIGTERM');
  }
}

/**
 * Main entry point
 */
async function main() {
  const wrapper = new PtyWrapper();

  try {
    await wrapper.start();
    log('info', 'PTY wrapper running. Waiting for connections...');
  } catch (error) {
    log('error', 'Failed to start PTY wrapper', { error: error.message });
    process.exit(1);
  }
}

// Run if executed directly
main();

export { PtyWrapper, CommandQueue };
export default PtyWrapper;
