#!/usr/bin/env node
/**
 * PTY Wrapper Client Library
 *
 * Provides a client interface to connect to PTY wrapper sockets
 * and send commands to Claude CLI instances.
 */

import net from 'net';
import path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const DEFAULT_SOCKET_DIR = process.env.SOCKET_DIR || '/shared/sockets';
const DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT || '60000', 10);
const RECONNECT_DELAY = parseInt(process.env.RECONNECT_DELAY || '2000', 10);
const MAX_RECONNECT_ATTEMPTS = parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5', 10);

/**
 * Logger utility
 */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };
const currentLogLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] [client] ${message}${metaStr}`);
  }
}

/**
 * PTY Client Class
 *
 * Connects to a PTY wrapper socket and provides methods
 * for sending commands and receiving output.
 */
export class PtyClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agentName = options.agentName || 'worker';
    this.socketDir = options.socketDir || DEFAULT_SOCKET_DIR;
    this.socketPath = options.socketPath || path.join(this.socketDir, `${this.agentName}.sock`);
    this.defaultTimeout = options.defaultTimeout || DEFAULT_TIMEOUT;
    this.autoReconnect = options.autoReconnect !== false;
    this.maxReconnectAttempts = options.maxReconnectAttempts || MAX_RECONNECT_ATTEMPTS;

    this.socket = null;
    this.clientId = null;
    this.isConnected = false;
    this.isReady = false;
    this.reconnectAttempts = 0;
    this.pendingRequests = new Map();
    this.buffer = '';
  }

  /**
   * Connect to the PTY wrapper socket
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) {
      log('debug', 'Already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      log('info', `Connecting to ${this.socketPath}`);

      this.socket = net.createConnection(this.socketPath);

      this.socket.on('connect', () => {
        log('info', 'Connected to PTY wrapper');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connect');
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('close', () => {
        log('info', 'Connection closed');
        this.isConnected = false;
        this.isReady = false;
        this.emit('close');

        // Reject pending requests
        for (const [id, req] of this.pendingRequests) {
          req.reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();

        // Auto reconnect
        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          log('info', `Reconnecting in ${RECONNECT_DELAY}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect().catch(() => {}), RECONNECT_DELAY);
        }
      });

      this.socket.on('error', (error) => {
        log('error', 'Socket error', { error: error.message });
        this.emit('error', error);

        if (!this.isConnected) {
          reject(error);
        }
      });

      // Wait for initial connected message
      const connectTimeout = setTimeout(() => {
        if (!this.clientId) {
          reject(new Error('Connection timeout - no welcome message received'));
        }
      }, 5000);

      this.once('connected', (data) => {
        clearTimeout(connectTimeout);
        this.clientId = data.clientId;
        this.isReady = data.ready;
        resolve();
      });
    });
  }

  /**
   * Handle incoming data from socket
   * @param {Buffer} data - Incoming data
   */
  handleData(data) {
    this.buffer += data.toString();

    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const message = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (message.trim()) {
        this.handleMessage(message);
      }
    }
  }

  /**
   * Handle parsed message
   * @param {string} messageStr - JSON message string
   */
  handleMessage(messageStr) {
    let message;
    try {
      message = JSON.parse(messageStr);
    } catch (error) {
      log('warn', 'Failed to parse message', { message: messageStr });
      return;
    }

    log('debug', 'Received message', { type: message.type });

    // Emit message type event
    this.emit(message.type, message);

    // Handle pending request responses
    if (message.id && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id);

      if (message.type === 'output') {
        pending.output += message.data;
        pending.onOutput?.(message.data);
      } else if (message.type === 'complete') {
        this.pendingRequests.delete(message.id);
        pending.resolve({
          id: message.id,
          output: pending.output + (message.output || ''),
          timestamp: message.timestamp
        });
      } else if (message.type === 'error') {
        this.pendingRequests.delete(message.id);
        pending.reject(new Error(message.error));
      }
    }

    // Emit generic message event
    this.emit('message', message);
  }

  /**
   * Send a command and wait for completion
   * @param {string} input - Command input text
   * @param {object} options - Command options
   * @returns {Promise<object>} - Command result
   */
  async sendCommand(input, options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    const id = options.id || uuidv4();
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      // Track pending request
      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        output: '',
        onOutput: options.onOutput
      });

      // Send command
      this.send({
        type: 'command',
        id,
        input,
        timeout
      });
    });
  }

  /**
   * Send raw input (not queued, immediate)
   * @param {string} data - Input data
   */
  sendInput(data) {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    this.send({
      type: 'input',
      data
    });
  }

  /**
   * Resize the PTY
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   */
  resize(cols, rows) {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    this.send({
      type: 'resize',
      cols,
      rows
    });
  }

  /**
   * Get wrapper status
   * @returns {Promise<object>}
   */
  async getStatus() {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Status request timeout'));
      }, 5000);

      this.once('status', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });

      this.send({ type: 'status' });
    });
  }

  /**
   * Ping the wrapper
   * @returns {Promise<number>} - Round trip time in ms
   */
  async ping() {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    const start = Date.now();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);

      this.once('pong', () => {
        clearTimeout(timeout);
        resolve(Date.now() - start);
      });

      this.send({ type: 'ping' });
    });
  }

  /**
   * Subscribe to output stream
   */
  subscribe() {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    this.send({ type: 'subscribe' });
  }

  /**
   * Unsubscribe from output stream
   */
  unsubscribe() {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    this.send({ type: 'unsubscribe' });
  }

  /**
   * Send message to wrapper
   * @param {object} message - Message object
   */
  send(message) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.write(JSON.stringify(message) + '\n');
  }

  /**
   * Close the connection
   */
  close() {
    this.autoReconnect = false;

    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }

    this.isConnected = false;
    this.isReady = false;
    this.clientId = null;
    this.pendingRequests.clear();
  }
}

/**
 * Create a client and connect
 * @param {string} agentName - Agent name
 * @param {object} options - Client options
 * @returns {Promise<PtyClient>}
 */
export async function createClient(agentName, options = {}) {
  const client = new PtyClient({ agentName, ...options });
  await client.connect();
  return client;
}

/**
 * CLI entry point for testing
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node client.js <agent> [command]');
    console.log('');
    console.log('Examples:');
    console.log('  node client.js anga "hello"');
    console.log('  node client.js marie status');
    console.log('  node client.js orchestrator ping');
    process.exit(1);
  }

  const agentName = args[0];
  const command = args.slice(1).join(' ') || 'status';

  try {
    log('info', `Connecting to ${agentName}...`);
    const client = await createClient(agentName, { autoReconnect: false });

    if (command === 'status') {
      const status = await client.getStatus();
      console.log('Status:', JSON.stringify(status, null, 2));
    } else if (command === 'ping') {
      const rtt = await client.ping();
      console.log(`Pong! RTT: ${rtt}ms`);
    } else {
      log('info', `Sending command: ${command}`);
      const result = await client.sendCommand(command, {
        onOutput: (data) => process.stdout.write(data)
      });
      console.log('\n\nCommand complete:', result.id);
    }

    client.close();

  } catch (error) {
    log('error', 'Failed', { error: error.message });
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PtyClient;
