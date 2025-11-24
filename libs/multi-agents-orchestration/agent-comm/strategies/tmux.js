/**
 * tmux Strategy Implementation
 *
 * Uses tmux send-keys to communicate with Claude Code agents running in tmux sessions.
 * This is the simpler, more immediate approach for sending commands.
 *
 * @module agent-comm/strategies/tmux
 */

const BaseStrategy = require('./base');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

/**
 * tmux-based communication strategy.
 *
 * This strategy works by:
 * 1. Checking if a tmux session exists for the target agent
 * 2. Using `tmux send-keys` to inject commands
 * 3. Optionally capturing output via `tmux capture-pane`
 *
 * @extends BaseStrategy
 */
class TmuxStrategy extends BaseStrategy {
  /**
   * Create a new tmux strategy instance
   *
   * @param {Object} options - Strategy options
   * @param {boolean} [options.useDockerExec] - Execute tmux commands via docker exec
   * @param {string} [options.tmuxPath] - Path to tmux binary
   * @param {number} [options.captureLines] - Default lines to capture from pane
   */
  constructor(options = {}) {
    super(options);

    this.name = 'tmux';
    this.useDockerExec = options.useDockerExec !== false;
    this.tmuxPath = options.tmuxPath || 'tmux';
    this.captureLines = options.captureLines || 100;

    // Track known sessions
    this.knownSessions = new Map();
  }

  /**
   * Initialize the tmux strategy
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    this.debug('Initializing tmux strategy');

    try {
      // Check if tmux is available
      const available = await this.isAvailable();

      if (!available) {
        throw new Error('tmux is not available');
      }

      this.initialized = true;
      this.debug('tmux strategy initialized successfully');
    } catch (error) {
      this.error('Failed to initialize tmux strategy:', error.message);
      throw error;
    }
  }

  /**
   * Check if tmux strategy is available
   *
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      if (this.useDockerExec) {
        // Check if docker is available
        await execAsync('docker version --format "{{.Server.Version}}"');
        return true;
      } else {
        // Check if tmux is available locally
        await execAsync(`${this.tmuxPath} -V`);
        return true;
      }
    } catch (error) {
      this.debug('tmux not available:', error.message);
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
   * @param {number} [options.responseDelay] - Delay before capturing response
   * @returns {Promise<SendResult>}
   */
  async send(agentName, message, options = {}) {
    const startTime = Date.now();
    const timeout = options.timeout || this.options.timeout;
    const waitForResponse = options.waitForResponse !== false;
    const responseDelay = options.responseDelay || 2000;

    try {
      const containerName = this.getContainerName(agentName);
      const sessionName = this.getTmuxSessionName(agentName);

      this.debug(`Sending to ${agentName} (session: ${sessionName}, container: ${containerName})`);

      // Check if session exists
      const sessionExists = await this.sessionExists(containerName, sessionName);

      if (!sessionExists) {
        return {
          success: false,
          error: `tmux session '${sessionName}' not found in container '${containerName}'`,
          duration: Date.now() - startTime
        };
      }

      // Capture output before sending (for diff comparison)
      let outputBefore = '';
      if (waitForResponse) {
        outputBefore = await this.capturePane(containerName, sessionName);
      }

      // Send the message using send-keys
      await this.sendKeys(containerName, sessionName, message);

      let response = '';
      if (waitForResponse) {
        // Wait for response
        await this.sleep(responseDelay);

        // Capture output after sending
        const outputAfter = await this.capturePane(containerName, sessionName);

        // Get the new output (diff)
        response = this.getOutputDiff(outputBefore, outputAfter);
      }

      return {
        success: true,
        response,
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
    const containerName = this.getContainerName(agentName);
    const sessionName = this.getTmuxSessionName(agentName);

    await this.sendKeys(containerName, sessionName, message);
  }

  /**
   * Get current output from an agent's tmux pane
   *
   * @param {string} agentName - Target agent name
   * @param {Object} [options] - Options
   * @param {number} [options.lines] - Number of lines to capture
   * @returns {Promise<string>}
   */
  async getOutput(agentName, options = {}) {
    const containerName = this.getContainerName(agentName);
    const sessionName = this.getTmuxSessionName(agentName);
    const lines = options.lines || this.captureLines;

    return this.capturePane(containerName, sessionName, lines);
  }

  /**
   * Get agent status via tmux
   *
   * @param {string} agentName - Target agent name
   * @returns {Promise<AgentStatus>}
   */
  async getStatus(agentName) {
    const containerName = this.getContainerName(agentName);
    const sessionName = this.getTmuxSessionName(agentName);

    try {
      // Check if container is running
      const containerRunning = await this.isContainerRunning(containerName);

      if (!containerRunning) {
        return {
          available: false,
          state: 'stopped',
          error: 'Container not running'
        };
      }

      // Check if tmux session exists
      const sessionExists = await this.sessionExists(containerName, sessionName);

      if (!sessionExists) {
        return {
          available: false,
          state: 'running',
          error: 'tmux session not found'
        };
      }

      return {
        available: true,
        state: 'running',
        lastSeen: Date.now()
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
    this.debug('Cleaning up tmux strategy');
    this.knownSessions.clear();
    this.initialized = false;
  }

  // -------------- Private Methods --------------

  /**
   * Check if a tmux session exists
   *
   * @private
   * @param {string} containerName - Container name
   * @param {string} sessionName - tmux session name
   * @returns {Promise<boolean>}
   */
  async sessionExists(containerName, sessionName) {
    try {
      const cmd = this.useDockerExec
        ? `docker exec ${containerName} ${this.tmuxPath} has-session -t ${sessionName}`
        : `${this.tmuxPath} has-session -t ${sessionName}`;

      await execAsync(cmd);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all tmux sessions in a container
   *
   * @private
   * @param {string} containerName - Container name
   * @returns {Promise<string[]>}
   */
  async listSessions(containerName) {
    try {
      const cmd = this.useDockerExec
        ? `docker exec ${containerName} ${this.tmuxPath} list-sessions -F "#{session_name}"`
        : `${this.tmuxPath} list-sessions -F "#{session_name}"`;

      const { stdout } = await execAsync(cmd);
      return stdout.trim().split('\n').filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  /**
   * Send keys to a tmux session
   *
   * @private
   * @param {string} containerName - Container name
   * @param {string} sessionName - tmux session name
   * @param {string} message - Text to send
   * @returns {Promise<void>}
   */
  async sendKeys(containerName, sessionName, message) {
    // Escape special characters for tmux
    const escapedMessage = this.escapeTmuxString(message);

    // Build the command
    const tmuxCmd = `${this.tmuxPath} send-keys -t ${sessionName} "${escapedMessage}" Enter`;

    const cmd = this.useDockerExec
      ? `docker exec ${containerName} ${tmuxCmd}`
      : tmuxCmd;

    this.debug(`Executing: ${cmd}`);

    await execAsync(cmd);
  }

  /**
   * Capture pane content from tmux session
   *
   * @private
   * @param {string} containerName - Container name
   * @param {string} sessionName - tmux session name
   * @param {number} [lines] - Number of lines to capture
   * @returns {Promise<string>}
   */
  async capturePane(containerName, sessionName, lines = this.captureLines) {
    try {
      const tmuxCmd = `${this.tmuxPath} capture-pane -t ${sessionName} -p -S -${lines}`;

      const cmd = this.useDockerExec
        ? `docker exec ${containerName} ${tmuxCmd}`
        : tmuxCmd;

      const { stdout } = await execAsync(cmd);
      return stdout;
    } catch (error) {
      this.debug('Failed to capture pane:', error.message);
      return '';
    }
  }

  /**
   * Check if a container is running
   *
   * @private
   * @param {string} containerName - Container name
   * @returns {Promise<boolean>}
   */
  async isContainerRunning(containerName) {
    try {
      const { stdout } = await execAsync(
        `docker inspect -f "{{.State.Running}}" ${containerName}`
      );
      return stdout.trim() === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Escape special characters for tmux send-keys
   *
   * @private
   * @param {string} str - String to escape
   * @returns {string}
   */
  escapeTmuxString(str) {
    // Escape double quotes, backslashes, and dollar signs
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  /**
   * Get the difference between two output captures
   *
   * @private
   * @param {string} before - Output before sending
   * @param {string} after - Output after sending
   * @returns {string}
   */
  getOutputDiff(before, after) {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    // Find new lines that appear after the previous content
    const newLines = [];
    let foundDiff = false;

    for (let i = 0; i < afterLines.length; i++) {
      if (foundDiff) {
        newLines.push(afterLines[i]);
      } else if (i >= beforeLines.length || afterLines[i] !== beforeLines[i]) {
        foundDiff = true;
        newLines.push(afterLines[i]);
      }
    }

    return newLines.join('\n').trim();
  }
}

module.exports = TmuxStrategy;
