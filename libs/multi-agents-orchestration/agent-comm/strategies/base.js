/**
 * Base Strategy Interface
 *
 * Abstract base class defining the interface for all communication strategies.
 * Each strategy must implement these methods for sending messages to Claude Code agents.
 *
 * @module agent-comm/strategies/base
 */

const EventEmitter = require('events');

/**
 * @typedef {Object} AgentStatus
 * @property {boolean} available - Whether the agent is available
 * @property {string} state - Current state: 'running', 'stopped', 'unknown'
 * @property {number} [lastSeen] - Timestamp of last activity
 * @property {string} [error] - Error message if unavailable
 */

/**
 * @typedef {Object} SendResult
 * @property {boolean} success - Whether the send was successful
 * @property {string} [response] - Response text if available
 * @property {string} [error] - Error message if failed
 * @property {number} duration - Time taken in milliseconds
 */

/**
 * Base class for communication strategies.
 * All strategy implementations must extend this class.
 *
 * @abstract
 * @extends EventEmitter
 */
class BaseStrategy extends EventEmitter {
  /**
   * Create a new strategy instance
   *
   * @param {Object} options - Strategy options
   * @param {string} [options.sharedDir] - Shared directory path
   * @param {boolean} [options.debug] - Enable debug logging
   * @param {number} [options.timeout] - Default timeout in milliseconds
   * @param {Object} [options.logger] - Custom logger instance
   */
  constructor(options = {}) {
    super();

    this.options = {
      sharedDir: options.sharedDir || '/shared',
      debug: options.debug || false,
      timeout: options.timeout || 30000,
      ...options
    };

    this.logger = options.logger || console;
    this.name = 'base';
    this.initialized = false;
  }

  /**
   * Initialize the strategy
   *
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Check if this strategy is available for use
   *
   * @abstract
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('isAvailable() must be implemented by subclass');
  }

  /**
   * Send a message to an agent and wait for response
   *
   * @abstract
   * @param {string} agentName - Target agent name (e.g., 'anga', 'marie', 'fabien')
   * @param {string} message - Message to send
   * @param {Object} [options] - Send options
   * @param {number} [options.timeout] - Timeout in milliseconds
   * @param {boolean} [options.waitForResponse] - Whether to wait for response
   * @returns {Promise<SendResult>}
   */
  async send(agentName, message, options = {}) {
    throw new Error('send() must be implemented by subclass');
  }

  /**
   * Send a message without waiting for response
   *
   * @abstract
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @returns {Promise<void>}
   */
  async sendAsync(agentName, message) {
    throw new Error('sendAsync() must be implemented by subclass');
  }

  /**
   * Get current output from an agent
   *
   * @abstract
   * @param {string} agentName - Target agent name
   * @param {Object} [options] - Options
   * @param {number} [options.lines] - Number of lines to retrieve
   * @returns {Promise<string>}
   */
  async getOutput(agentName, options = {}) {
    throw new Error('getOutput() must be implemented by subclass');
  }

  /**
   * Get the status of an agent
   *
   * @abstract
   * @param {string} agentName - Target agent name
   * @returns {Promise<AgentStatus>}
   */
  async getStatus(agentName) {
    throw new Error('getStatus() must be implemented by subclass');
  }

  /**
   * Clean up resources
   *
   * @abstract
   * @returns {Promise<void>}
   */
  async cleanup() {
    throw new Error('cleanup() must be implemented by subclass');
  }

  /**
   * Log a debug message
   *
   * @protected
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (this.options.debug) {
      this.logger.log(`[${this.name}] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   *
   * @protected
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    this.logger.log(`[${this.name}] ${message}`, ...args);
  }

  /**
   * Log an error message
   *
   * @protected
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    this.logger.error(`[${this.name}] ERROR: ${message}`, ...args);
  }

  /**
   * Get the container name for an agent
   *
   * @protected
   * @param {string} agentName - Agent name
   * @returns {string} Container name
   */
  getContainerName(agentName) {
    // Handle both short names and full container names
    if (agentName.startsWith('codehornets-') || agentName.startsWith('multi-agents-')) {
      return agentName;
    }

    // Map agent names to container names
    const mapping = {
      'orchestrator': 'multi-agents-orchestration-orchestrator-1',
      'marie': 'multi-agents-orchestration-marie-1',
      'anga': 'multi-agents-orchestration-anga-1',
      'fabien': 'multi-agents-orchestration-fabien-1',
      'worker-marie': 'multi-agents-orchestration-marie-1',
      'worker-anga': 'multi-agents-orchestration-anga-1',
      'worker-fabien': 'multi-agents-orchestration-fabien-1'
    };

    return mapping[agentName] || `multi-agents-orchestration-${agentName}-1`;
  }

  /**
   * Get the tmux session name for an agent
   *
   * @protected
   * @param {string} agentName - Agent name
   * @returns {string} tmux session name
   */
  getTmuxSessionName(agentName) {
    // Normalize agent name
    const normalized = agentName.replace(/^(worker-|codehornets-|multi-agents-orchestration-)/, '');
    return `claude-${normalized}`;
  }

  /**
   * Sleep utility
   *
   * @protected
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with timeout
   *
   * @protected
   * @param {Promise} promise - Promise to execute
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} [message] - Timeout error message
   * @returns {Promise}
   */
  async withTimeout(promise, timeout, message = 'Operation timed out') {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }
}

module.exports = BaseStrategy;
