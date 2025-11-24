/**
 * PTY Wrapper Strategy Implementation
 *
 * Uses a node-pty wrapper with Unix socket communication for robust bidirectional
 * interaction with Claude Code agents. This approach provides full PTY semantics.
 *
 * @module agent-comm/strategies/pty-wrapper
 */

const BaseStrategy = require('./base');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const net = require('net');

const execAsync = promisify(exec);

/**
 * PTY Wrapper communication strategy.
 *
 * This strategy works by:
 * 1. Connecting to a Unix socket exposed by the pty-wrapper service
 * 2. Sending messages through the socket
 * 3. Receiving responses bidirectionally
 *
 * The pty-wrapper service should be running alongside each agent container
 * and provides proper PTY semantics for interactive TUI applications.
 *
 * @extends BaseStrategy
 */
class PtyWrapperStrategy extends BaseStrategy {
  /**
   * Create a new PTY wrapper strategy instance
   *
   * @param {Object} options - Strategy options
   * @param {string} [options.socketDir] - Directory containing agent sockets
   * @param {string} [options.socketPattern] - Pattern for socket file names
   * @param {number} [options.connectTimeout] - Socket connection timeout
   * @param {number} [options.readTimeout] - Read response timeout
   */
  constructor(options = {}) {
    super(options);

    this.name = 'pty-wrapper';
    this.socketDir = options.socketDir || '/shared/sockets';
    this.socketPattern = options.socketPattern || '{agent}.sock';
    this.connectTimeout = options.connectTimeout || 5000;
    this.readTimeout = options.readTimeout || 10000;

    // Active socket connections
    this.connections = new Map();
  }

  /**
   * Initialize the PTY wrapper strategy
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    this.debug('Initializing PTY wrapper strategy');

    try {
      // Ensure socket directory exists
      await fs.mkdir(this.socketDir, { recursive: true }).catch(() => {});

      const available = await this.isAvailable();

      if (!available) {
        this.debug('PTY wrapper sockets not found, strategy may not be active');
      }

      this.initialized = true;
      this.debug('PTY wrapper strategy initialized');
    } catch (error) {
      this.error('Failed to initialize PTY wrapper strategy:', error.message);
      throw error;
    }
  }

  /**
   * Check if PTY wrapper strategy is available
   *
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      // Check if socket directory exists and has at least one socket
      const files = await fs.readdir(this.socketDir);
      const sockets = files.filter(f => f.endsWith('.sock'));

      return sockets.length > 0;
    } catch (error) {
      this.debug('Socket directory not accessible:', error.message);
      return false;
    }
  }

  /**
   * Send a message to an agent
   *
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @param {Object} [options] - Send options
   * @param {number} [options.timeout] - Timeout in milliseconds
   * @param {boolean} [options.waitForResponse] - Wait for response
   * @returns {Promise<SendResult>}
   */
  async send(agentName, message, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || this.options.timeout;
    const waitForResponse = options.waitForResponse !== false;

    try {
      const socketPath = this.getSocketPath(agentName);

      this.debug(`Sending to ${agentName} via socket: ${socketPath}`);

      // Check if socket exists
      const exists = await this.socketExists(socketPath);

      if (!exists) {
        return {
          success: false,
          error: `Socket not found: ${socketPath}`,
          duration: Date.now() - startTime
        };
      }

      // Send message and optionally wait for response
      const response = await this.withTimeout(
        this.sendViaSocket(socketPath, message, waitForResponse),
        timeout,
        `Timeout waiting for response from ${agentName}`
      );

      return {
        success: true,
        response: response || '',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Send a message without waiting for response
   *
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @returns {Promise<void>}
   */
  async sendAsync(agentName, message) {
    const socketPath = this.getSocketPath(agentName);

    await this.sendViaSocket(socketPath, message, false);
  }

  /**
   * Get current output from an agent
   *
   * @param {string} agentName - Target agent name
   * @param {Object} [options] - Options
   * @returns {Promise<string>}
   */
  async getOutput(agentName, options = {}) {
    const socketPath = this.getSocketPath(agentName);

    // Send a special command to get current output
    // This depends on the pty-wrapper supporting a query protocol
    try {
      return await this.sendViaSocket(socketPath, '\x04', true); // Ctrl-D to query
    } catch (error) {
      this.debug('Failed to get output:', error.message);
      return '';
    }
  }

  /**
   * Get agent status
   *
   * @param {string} agentName - Target agent name
   * @returns {Promise<AgentStatus>}
   */
  async getStatus(agentName) {
    const socketPath = this.getSocketPath(agentName);

    try {
      const exists = await this.socketExists(socketPath);

      if (!exists) {
        return {
          available: false,
          state: 'stopped',
          error: 'Socket not found'
        };
      }

      // Try to connect to verify socket is alive
      const isAlive = await this.testConnection(socketPath);

      return {
        available: isAlive,
        state: isAlive ? 'running' : 'stopped',
        lastSeen: isAlive ? Date.now() : undefined,
        error: isAlive ? undefined : 'Socket not responding'
      };
    } catch (error) {
      return {
        available: false,
        state: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Clean up resources
   *
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.debug('Cleaning up PTY wrapper strategy');

    // Close all active connections
    for (const [socketPath, socket] of this.connections.entries()) {
      try {
        socket.destroy();
      } catch (error) {
        this.debug(`Failed to close socket ${socketPath}:`, error.message);
      }
    }

    this.connections.clear();
    this.initialized = false;
  }

  // -------------- Private Methods --------------

  /**
   * Get socket path for an agent
   *
   * @private
   * @param {string} agentName - Agent name
   * @returns {string}
   */
  getSocketPath(agentName) {
    // Normalize agent name
    const normalized = agentName
      .replace(/^(worker-|codehornets-|multi-agents-orchestration-)/, '')
      .replace(/-1$/, '');

    const socketFile = this.socketPattern.replace('{agent}', normalized);
    return path.join(this.socketDir, socketFile);
  }

  /**
   * Check if a socket file exists
   *
   * @private
   * @param {string} socketPath - Socket path
   * @returns {Promise<boolean>}
   */
  async socketExists(socketPath) {
    try {
      const stats = await fs.stat(socketPath);
      return stats.isSocket();
    } catch (error) {
      return false;
    }
  }

  /**
   * Test if a socket connection is alive
   *
   * @private
   * @param {string} socketPath - Socket path
   * @returns {Promise<boolean>}
   */
  async testConnection(socketPath) {
    return new Promise((resolve) => {
      const socket = net.createConnection(socketPath, () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.setTimeout(this.connectTimeout, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Send message via Unix socket
   *
   * @private
   * @param {string} socketPath - Socket path
   * @param {string} message - Message to send
   * @param {boolean} waitForResponse - Whether to wait for response
   * @returns {Promise<string>}
   */
  async sendViaSocket(socketPath, message, waitForResponse) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(socketPath);
      let response = '';
      let timeoutHandle;

      socket.on('connect', () => {
        this.debug(`Connected to socket: ${socketPath}`);

        // Send the message with newline
        socket.write(message + '\n');

        if (!waitForResponse) {
          socket.end();
          resolve('');
          return;
        }

        // Set read timeout
        timeoutHandle = setTimeout(() => {
          socket.destroy();
          resolve(response);
        }, this.readTimeout);
      });

      socket.on('data', (data) => {
        response += data.toString();

        // Check for end of response markers
        if (this.isResponseComplete(response)) {
          clearTimeout(timeoutHandle);
          socket.destroy();
          resolve(response);
        }
      });

      socket.on('end', () => {
        clearTimeout(timeoutHandle);
        resolve(response);
      });

      socket.on('error', (error) => {
        clearTimeout(timeoutHandle);
        socket.destroy();
        reject(error);
      });

      socket.setTimeout(this.connectTimeout, () => {
        clearTimeout(timeoutHandle);
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  /**
   * Check if response is complete
   *
   * @private
   * @param {string} response - Response text
   * @returns {boolean}
   */
  isResponseComplete(response) {
    // Check for common prompt patterns indicating response is complete
    const promptPatterns = [
      /\n>\s*$/,           // Claude prompt
      /\n\$\s*$/,          // Shell prompt
      /\n#\s*$/,           // Root prompt
      /\nclaudeuser@/,     // User prompt
      /\n\[.*\]\s*$/       // Bracketed prompt
    ];

    return promptPatterns.some(pattern => pattern.test(response));
  }

  /**
   * Get or create a persistent connection
   *
   * @private
   * @param {string} socketPath - Socket path
   * @returns {Promise<net.Socket>}
   */
  async getConnection(socketPath) {
    if (this.connections.has(socketPath)) {
      const socket = this.connections.get(socketPath);

      if (!socket.destroyed) {
        return socket;
      }

      this.connections.delete(socketPath);
    }

    // Create new connection
    const socket = await this.createConnection(socketPath);
    this.connections.set(socketPath, socket);

    return socket;
  }

  /**
   * Create a new socket connection
   *
   * @private
   * @param {string} socketPath - Socket path
   * @returns {Promise<net.Socket>}
   */
  createConnection(socketPath) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(socketPath, () => {
        resolve(socket);
      });

      socket.on('error', (error) => {
        this.connections.delete(socketPath);
        reject(error);
      });

      socket.setTimeout(this.connectTimeout, () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }
}

module.exports = PtyWrapperStrategy;
