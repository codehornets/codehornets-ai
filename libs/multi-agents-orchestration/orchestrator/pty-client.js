#!/usr/bin/env node
/**
 * Orchestrator PTY Client
 *
 * Specialized client for the orchestrator to communicate with worker agents
 * via their PTY wrapper sockets. Provides connection pooling, automatic
 * reconnection, and high-level task delegation methods.
 */

import net from 'net';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SOCKET_DIR = process.env.SOCKET_DIR || '/shared/sockets';
const DEFAULT_TIMEOUT = parseInt(process.env.DEFAULT_TIMEOUT || '120000', 10);
const RECONNECT_DELAY = parseInt(process.env.RECONNECT_DELAY || '3000', 10);
const MAX_RECONNECT_ATTEMPTS = parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '10', 10);
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10);

// Available workers
const WORKERS = ['marie', 'anga', 'fabien'];

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
    console.log(`[${timestamp}] [${level.toUpperCase()}] [orchestrator-client] ${message}${metaStr}`);
  }
}

/**
 * Worker Connection Class
 *
 * Manages a single connection to a worker's PTY wrapper
 */
class WorkerConnection extends EventEmitter {
  constructor(workerName, options = {}) {
    super();

    this.workerName = workerName;
    this.socketPath = options.socketPath || path.join(SOCKET_DIR, `${workerName}.sock`);
    this.defaultTimeout = options.defaultTimeout || DEFAULT_TIMEOUT;
    this.maxReconnectAttempts = options.maxReconnectAttempts || MAX_RECONNECT_ATTEMPTS;

    this.socket = null;
    this.clientId = null;
    this.isConnected = false;
    this.isReady = false;
    this.reconnectAttempts = 0;
    this.reconnecting = false;
    this.pendingRequests = new Map();
    this.buffer = '';
    this.lastActivity = Date.now();
    this.queueLength = 0;
  }

  /**
   * Check if socket exists
   * @returns {boolean}
   */
  socketExists() {
    return fs.existsSync(this.socketPath);
  }

  /**
   * Connect to worker socket
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) {
      return;
    }

    if (!this.socketExists()) {
      throw new Error(`Socket not found: ${this.socketPath}`);
    }

    return new Promise((resolve, reject) => {
      log('debug', `Connecting to ${this.workerName}...`, { socket: this.socketPath });

      this.socket = net.createConnection(this.socketPath);

      const connectTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.socket?.destroy();
      }, 10000);

      this.socket.on('connect', () => {
        log('info', `Connected to ${this.workerName}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        this.lastActivity = Date.now();
        this.emit('connect');
      });

      this.socket.on('data', (data) => {
        this.lastActivity = Date.now();
        this.handleData(data);
      });

      this.socket.on('close', () => {
        log('info', `Connection to ${this.workerName} closed`);
        clearTimeout(connectTimeout);
        this.handleDisconnect();
      });

      this.socket.on('error', (error) => {
        log('error', `Socket error for ${this.workerName}`, { error: error.message });
        this.emit('error', error);

        if (!this.isConnected) {
          clearTimeout(connectTimeout);
          reject(error);
        }
      });

      // Wait for welcome message
      this.once('connected', (data) => {
        clearTimeout(connectTimeout);
        this.clientId = data.clientId;
        this.isReady = data.ready;
        this.queueLength = data.queueLength || 0;
        resolve();
      });
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnect() {
    this.isConnected = false;
    this.isReady = false;
    this.clientId = null;

    // Reject all pending requests
    for (const [id, req] of this.pendingRequests) {
      req.reject(new Error('Connection lost'));
    }
    this.pendingRequests.clear();

    this.emit('disconnect');

    // Auto reconnect
    if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnecting) return;

    this.reconnecting = true;
    this.reconnectAttempts++;

    const delay = RECONNECT_DELAY * Math.min(this.reconnectAttempts, 5);
    log('info', `Scheduling reconnect to ${this.workerName} in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
        log('info', `Reconnected to ${this.workerName}`);
        this.emit('reconnect');
      } catch (error) {
        log('warn', `Reconnect to ${this.workerName} failed`, { error: error.message });
        this.reconnecting = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          log('error', `Max reconnect attempts reached for ${this.workerName}`);
          this.emit('maxReconnectFailed');
        }
      }
    }, delay);
  }

  /**
   * Handle incoming data
   * @param {Buffer} data
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
   * @param {string} messageStr
   */
  handleMessage(messageStr) {
    let message;
    try {
      message = JSON.parse(messageStr);
    } catch (error) {
      log('warn', `Failed to parse message from ${this.workerName}`, { message: messageStr });
      return;
    }

    log('trace', `Received from ${this.workerName}`, { type: message.type });

    // Emit message type event
    this.emit(message.type, message);
    this.emit('message', message);

    // Update status info
    if (message.type === 'status') {
      this.isReady = message.ready;
      this.queueLength = message.queueLength || 0;
    }

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
          timestamp: message.timestamp,
          worker: this.workerName
        });
      } else if (message.type === 'error') {
        this.pendingRequests.delete(message.id);
        pending.reject(new Error(message.error));
      }
    }
  }

  /**
   * Send command and wait for response
   * @param {string} input - Command input
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async sendCommand(input, options = {}) {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.workerName}`);
    }

    const id = options.id || uuidv4();
    const timeout = options.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

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

      this.send({
        type: 'command',
        id,
        input,
        timeout
      });
    });
  }

  /**
   * Get worker status
   * @returns {Promise<object>}
   */
  async getStatus() {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.workerName}`);
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
   * Ping worker
   * @returns {Promise<number>}
   */
  async ping() {
    if (!this.isConnected) {
      throw new Error(`Not connected to ${this.workerName}`);
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
   * Send message to worker
   * @param {object} message
   */
  send(message) {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    this.socket.write(JSON.stringify(message) + '\n');
  }

  /**
   * Close connection
   */
  close() {
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
 * OrchestratorPtyClient Class
 *
 * Manages connections to all worker agents
 */
export class OrchestratorPtyClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.workers = options.workers || WORKERS;
    this.socketDir = options.socketDir || SOCKET_DIR;
    this.defaultTimeout = options.defaultTimeout || DEFAULT_TIMEOUT;
    this.healthCheckInterval = options.healthCheckInterval || HEALTH_CHECK_INTERVAL;

    this.connections = new Map();
    this.healthCheckTimer = null;
  }

  /**
   * Initialize connections to all available workers
   * @returns {Promise<object>} - Connection results per worker
   */
  async initialize() {
    log('info', 'Initializing orchestrator PTY client...');

    const results = {};

    for (const worker of this.workers) {
      results[worker] = await this.connectToWorker(worker);
    }

    // Start health checks
    this.startHealthChecks();

    log('info', 'Orchestrator PTY client initialized', { results });
    return results;
  }

  /**
   * Connect to a specific worker
   * @param {string} workerName - Worker name
   * @returns {Promise<object>} - Connection result
   */
  async connectToWorker(workerName) {
    const connection = new WorkerConnection(workerName, {
      socketPath: path.join(this.socketDir, `${workerName}.sock`),
      defaultTimeout: this.defaultTimeout
    });

    // Forward events
    connection.on('message', (msg) => {
      this.emit('worker:message', { worker: workerName, message: msg });
    });

    connection.on('disconnect', () => {
      this.emit('worker:disconnect', { worker: workerName });
    });

    connection.on('reconnect', () => {
      this.emit('worker:reconnect', { worker: workerName });
    });

    connection.on('error', (error) => {
      this.emit('worker:error', { worker: workerName, error });
    });

    this.connections.set(workerName, connection);

    try {
      await connection.connect();
      return { success: true, ready: connection.isReady };
    } catch (error) {
      log('warn', `Failed to connect to ${workerName}`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection to a worker
   * @param {string} workerName - Worker name
   * @returns {WorkerConnection|null}
   */
  getConnection(workerName) {
    return this.connections.get(workerName) || null;
  }

  /**
   * Send command to a worker
   * @param {string} workerName - Worker name
   * @param {string} input - Command input
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async sendCommand(workerName, input, options = {}) {
    const connection = this.getConnection(workerName);

    if (!connection) {
      throw new Error(`Unknown worker: ${workerName}`);
    }

    if (!connection.isConnected) {
      // Try to reconnect
      try {
        await connection.connect();
      } catch (error) {
        throw new Error(`Cannot connect to ${workerName}: ${error.message}`);
      }
    }

    return connection.sendCommand(input, options);
  }

  /**
   * Delegate a task to the best available worker
   * @param {object} task - Task object
   * @param {object} options - Options
   * @returns {Promise<object>}
   */
  async delegateTask(task, options = {}) {
    const { workerName, prompt, timeout } = task;

    if (!workerName) {
      throw new Error('Task must specify workerName');
    }

    if (!prompt) {
      throw new Error('Task must specify prompt');
    }

    log('info', `Delegating task to ${workerName}`, { taskId: task.id });

    const result = await this.sendCommand(workerName, prompt, {
      timeout: timeout || this.defaultTimeout,
      onOutput: options.onOutput
    });

    log('info', `Task completed by ${workerName}`, { taskId: task.id });

    return result;
  }

  /**
   * Get status of all workers
   * @returns {Promise<object>}
   */
  async getAllStatus() {
    const status = {};

    for (const [workerName, connection] of this.connections) {
      try {
        if (connection.isConnected) {
          status[workerName] = await connection.getStatus();
        } else {
          status[workerName] = { connected: false, socketExists: connection.socketExists() };
        }
      } catch (error) {
        status[workerName] = { error: error.message };
      }
    }

    return status;
  }

  /**
   * Get list of available (connected and ready) workers
   * @returns {string[]}
   */
  getAvailableWorkers() {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.isConnected && conn.isReady)
      .map(([name]) => name);
  }

  /**
   * Check if a worker is available
   * @param {string} workerName - Worker name
   * @returns {boolean}
   */
  isWorkerAvailable(workerName) {
    const connection = this.getConnection(workerName);
    return connection?.isConnected && connection?.isReady;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      log('debug', 'Running health checks...');

      for (const [workerName, connection] of this.connections) {
        try {
          if (connection.isConnected) {
            const rtt = await connection.ping();
            log('debug', `Health check ${workerName}: OK (${rtt}ms)`);
          } else if (connection.socketExists() && !connection.reconnecting) {
            log('debug', `Attempting to reconnect to ${workerName}`);
            connection.scheduleReconnect();
          }
        } catch (error) {
          log('warn', `Health check failed for ${workerName}`, { error: error.message });
        }
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Close all connections
   */
  close() {
    this.stopHealthChecks();

    for (const [workerName, connection] of this.connections) {
      connection.close();
    }

    this.connections.clear();
    log('info', 'Orchestrator PTY client closed');
  }
}

/**
 * Create and initialize orchestrator client
 * @param {object} options - Options
 * @returns {Promise<OrchestratorPtyClient>}
 */
export async function createOrchestratorClient(options = {}) {
  const client = new OrchestratorPtyClient(options);
  await client.initialize();
  return client;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node pty-client.js <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  status                    - Get status of all workers');
    console.log('  send <worker> <message>   - Send command to worker');
    console.log('  ping <worker>             - Ping a worker');
    console.log('  list                      - List available workers');
    process.exit(1);
  }

  const command = args[0];

  try {
    const client = await createOrchestratorClient();

    switch (command) {
      case 'status': {
        const status = await client.getAllStatus();
        console.log('Worker Status:');
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'send': {
        const worker = args[1];
        const message = args.slice(2).join(' ');

        if (!worker || !message) {
          console.error('Usage: send <worker> <message>');
          process.exit(1);
        }

        console.log(`Sending to ${worker}: ${message}`);
        const result = await client.sendCommand(worker, message, {
          onOutput: (data) => process.stdout.write(data)
        });
        console.log('\n\nResult:', JSON.stringify(result, null, 2));
        break;
      }

      case 'ping': {
        const worker = args[1] || 'all';

        if (worker === 'all') {
          for (const w of client.getAvailableWorkers()) {
            const conn = client.getConnection(w);
            const rtt = await conn.ping();
            console.log(`${w}: ${rtt}ms`);
          }
        } else {
          const conn = client.getConnection(worker);
          if (!conn) {
            console.error(`Unknown worker: ${worker}`);
            process.exit(1);
          }
          const rtt = await conn.ping();
          console.log(`${worker}: ${rtt}ms`);
        }
        break;
      }

      case 'list': {
        const available = client.getAvailableWorkers();
        console.log('Available workers:', available.join(', ') || 'none');
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    client.close();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default OrchestratorPtyClient;
