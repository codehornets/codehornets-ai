const Docker = require('dockerode');
const EventEmitter = require('eventemitter3');
const chalk = require('chalk');
const NamedPipeStrategy = require('./strategies/named-pipe');
const TTYStrategy = require('./strategies/tty-injection');
const SharedVolumeStrategy = require('./strategies/shared-volume');
const SignalStrategy = require('./strategies/signal');
const ExecStrategy = require('./strategies/exec');

class AgentBridge extends EventEmitter {
  constructor(options = {}) {
    super();

    this.docker = options.docker || new Docker(options.dockerOptions);
    this.strategy = options.strategy || 'auto';
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.debug = options.debug || false;

    // Initialize all strategies
    this.strategies = {
      'named-pipe': new NamedPipeStrategy(this.docker, options),
      'tty': new TTYStrategy(this.docker, options),
      'shared-volume': new SharedVolumeStrategy(this.docker, options),
      'signal': new SignalStrategy(this.docker, options),
      'exec': new ExecStrategy(this.docker, options)
    };

    // Set up strategy order for auto mode
    this.strategyOrder = ['named-pipe', 'tty', 'signal', 'exec', 'shared-volume'];
  }

  /**
   * Send a message to a target container
   * @param {string} targetContainer - Container name or ID
   * @param {string|object} payload - Message payload
   * @param {object} options - Send options
   * @returns {Promise<object>} Result
   */
  async send(targetContainer, payload, options = {}) {
    const message = {
      from: options.from || 'orchestrator',
      to: targetContainer,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      timestamp: Date.now(),
      id: options.id || this._generateId()
    };

    if (this.debug) {
      console.log(chalk.blue(`📤 Sending message to ${targetContainer}:`), message);
    }

    let lastError;

    if (this.strategy === 'auto') {
      // Try strategies in order until one succeeds
      for (const strategyName of this.strategyOrder) {
        try {
          const result = await this._sendWithRetry(strategyName, targetContainer, message, options);
          if (this.debug) {
            console.log(chalk.green(`✅ Success with ${strategyName} strategy`));
          }
          return result;
        } catch (error) {
          lastError = error;
          if (this.debug) {
            console.log(chalk.yellow(`⚠️  ${strategyName} failed: ${error.message}`));
          }
        }
      }
      throw new Error(`All strategies failed. Last error: ${lastError.message}`);
    } else {
      // Use specific strategy
      return await this._sendWithRetry(this.strategy, targetContainer, message, options);
    }
  }

  /**
   * Send with retry logic
   */
  async _sendWithRetry(strategyName, targetContainer, message, options) {
    const strategy = this.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await strategy.send(targetContainer, message, options);
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          if (this.debug) {
            console.log(chalk.yellow(`Retry ${attempt}/${this.retryAttempts} after ${this.retryDelay}ms`));
          }
          await this._sleep(this.retryDelay);
        }
      }
    }
    throw lastError;
  }

  /**
   * Broadcast message to multiple containers
   * @param {string[]} targets - Array of container names/IDs
   * @param {string|object} payload - Message payload
   * @param {object} options - Send options
   * @returns {Promise<object[]>} Results
   */
  async broadcast(targets, payload, options = {}) {
    if (this.debug) {
      console.log(chalk.blue(`📡 Broadcasting to ${targets.length} containers`));
    }

    const results = await Promise.allSettled(
      targets.map(target => this.send(target, payload, options))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (this.debug) {
      console.log(chalk.green(`✅ Broadcast complete: ${success} succeeded, ${failed} failed`));
    }

    return results;
  }

  /**
   * Listen for incoming messages
   * @param {string} containerName - This container's name (optional)
   * @param {object} options - Listen options
   */
  async listen(containerName, options = {}) {
    if (this.debug) {
      console.log(chalk.blue(`👂 Starting listener${containerName ? ` for ${containerName}` : ''}`));
    }

    // Start listeners for all strategies that support it
    const listeners = Object.entries(this.strategies)
      .filter(([_, strategy]) => typeof strategy.listen === 'function');

    for (const [name, strategy] of listeners) {
      try {
        strategy.on('message', (message) => {
          if (this.debug) {
            console.log(chalk.green(`📨 Received via ${name}:`), message);
          }
          this.emit('message', message);
        });

        await strategy.listen(containerName, options);

        if (this.debug) {
          console.log(chalk.green(`✅ ${name} listener started`));
        }
      } catch (error) {
        if (this.debug) {
          console.log(chalk.yellow(`⚠️  ${name} listener failed: ${error.message}`));
        }
      }
    }
  }

  /**
   * Stop all listeners
   */
  async stop() {
    if (this.debug) {
      console.log(chalk.blue('🛑 Stopping all listeners'));
    }

    for (const strategy of Object.values(this.strategies)) {
      if (typeof strategy.stop === 'function') {
        await strategy.stop();
      }
    }

    this.removeAllListeners();
  }

  /**
   * Get container info
   * @param {string} containerName - Container name or ID
   * @returns {Promise<object>} Container info
   */
  async getContainerInfo(containerName) {
    const container = this.docker.getContainer(containerName);
    return await container.inspect();
  }

  /**
   * Check if container is running
   * @param {string} containerName - Container name or ID
   * @returns {Promise<boolean>}
   */
  async isContainerRunning(containerName) {
    try {
      const info = await this.getContainerInfo(containerName);
      return info.State.Running;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique message ID
   */
  _generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format message for display
   */
  formatMessage(message, options = {}) {
    const prefix = options.prefix || '📨';
    const color = options.color || 'cyan';

    return chalk[color](`${prefix} [${message.from} → ${message.to}] ${message.payload}`);
  }
}

module.exports = AgentBridge;
