/**
 * File-Based Strategy Implementation
 *
 * Uses shared file system for communication as a fallback mechanism.
 * This is the most portable but least interactive approach.
 *
 * @module agent-comm/strategies/file-based
 */

const BaseStrategy = require('./base');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * File-based communication strategy.
 *
 * This strategy works by:
 * 1. Writing messages to shared task files
 * 2. Watching for result files
 * 3. Reading responses from result files
 *
 * Compatible with the existing CodeHornets orchestration file structure.
 *
 * @extends BaseStrategy
 */
class FileBasedStrategy extends BaseStrategy {
  /**
   * Create a new file-based strategy instance
   *
   * @param {Object} options - Strategy options
   * @param {string} [options.tasksDir] - Directory for task files
   * @param {string} [options.resultsDir] - Directory for result files
   * @param {string} [options.heartbeatsDir] - Directory for heartbeat files
   * @param {number} [options.pollInterval] - Interval for polling results
   * @param {number} [options.maxWaitTime] - Maximum time to wait for response
   */
  constructor(options = {}) {
    super(options);

    this.name = 'file-based';
    this.tasksDir = options.tasksDir || path.join(this.options.sharedDir, 'tasks');
    this.resultsDir = options.resultsDir || path.join(this.options.sharedDir, 'results');
    this.heartbeatsDir = options.heartbeatsDir || path.join(this.options.sharedDir, 'heartbeats');
    this.pollInterval = options.pollInterval || 500;
    this.maxWaitTime = options.maxWaitTime || 60000;

    // Track pending tasks
    this.pendingTasks = new Map();
  }

  /**
   * Initialize the file-based strategy
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    this.debug('Initializing file-based strategy');

    try {
      // Create required directories
      await fs.mkdir(this.tasksDir, { recursive: true });
      await fs.mkdir(this.resultsDir, { recursive: true });
      await fs.mkdir(this.heartbeatsDir, { recursive: true });

      this.initialized = true;
      this.debug('File-based strategy initialized');
    } catch (error) {
      this.error('Failed to initialize file-based strategy:', error.message);
      throw error;
    }
  }

  /**
   * Check if file-based strategy is available
   *
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      // Check if shared directory is accessible
      await fs.access(this.options.sharedDir);
      return true;
    } catch (error) {
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
    const timeout = options.timeout || this.maxWaitTime;
    const waitForResponse = options.waitForResponse !== false;

    try {
      // Generate task ID
      const taskId = this.generateTaskId();

      // Create task file
      const taskPath = await this.createTaskFile(agentName, taskId, message);
      this.debug(`Created task file: ${taskPath}`);

      if (!waitForResponse) {
        return {
          success: true,
          response: '',
          duration: Date.now() - startTime
        };
      }

      // Wait for result file
      const response = await this.waitForResult(agentName, taskId, timeout);

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
    const taskId = this.generateTaskId();
    await this.createTaskFile(agentName, taskId, message);
  }

  /**
   * Get current output from an agent (via result files)
   *
   * @param {string} agentName - Target agent name
   * @param {Object} [options] - Options
   * @param {number} [options.limit] - Maximum number of results to read
   * @returns {Promise<string>}
   */
  async getOutput(agentName, options = {}) {
    const limit = options.limit || 10;
    const agentResultsDir = this.getAgentResultsDir(agentName);

    try {
      const files = await fs.readdir(agentResultsDir);

      // Sort by modification time (newest first)
      const sortedFiles = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(agentResultsDir, file);
          const stats = await fs.stat(filePath);
          return { file, mtime: stats.mtime };
        })
      );

      sortedFiles.sort((a, b) => b.mtime - a.mtime);

      // Read the latest result files
      const results = [];
      for (const { file } of sortedFiles.slice(0, limit)) {
        const content = await fs.readFile(
          path.join(agentResultsDir, file),
          'utf8'
        );
        results.push(content);
      }

      return results.join('\n---\n');
    } catch (error) {
      this.debug('Failed to get output:', error.message);
      return '';
    }
  }

  /**
   * Get agent status via heartbeat file
   *
   * @param {string} agentName - Target agent name
   * @returns {Promise<AgentStatus>}
   */
  async getStatus(agentName) {
    const heartbeatPath = this.getHeartbeatPath(agentName);

    try {
      const stats = await fs.stat(heartbeatPath);
      const content = await fs.readFile(heartbeatPath, 'utf8');

      // Check if heartbeat is recent (within last 60 seconds)
      const isRecent = Date.now() - stats.mtime.getTime() < 60000;

      // Try to parse heartbeat content
      let heartbeatData = {};
      try {
        heartbeatData = JSON.parse(content);
      } catch (e) {
        // Content might not be JSON
        heartbeatData = { raw: content };
      }

      return {
        available: isRecent,
        state: isRecent ? 'running' : 'stale',
        lastSeen: stats.mtime.getTime(),
        ...heartbeatData
      };
    } catch (error) {
      return {
        available: false,
        state: 'unknown',
        error: error.code === 'ENOENT' ? 'No heartbeat file' : error.message
      };
    }
  }

  /**
   * Clean up resources
   *
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.debug('Cleaning up file-based strategy');
    this.pendingTasks.clear();
    this.initialized = false;
  }

  // -------------- Private Methods --------------

  /**
   * Generate a unique task ID
   *
   * @private
   * @returns {string}
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the task directory for an agent
   *
   * @private
   * @param {string} agentName - Agent name
   * @returns {string}
   */
  getAgentTasksDir(agentName) {
    const normalized = agentName.replace(/^(worker-|codehornets-)/, '');
    return path.join(this.tasksDir, normalized);
  }

  /**
   * Get the results directory for an agent
   *
   * @private
   * @param {string} agentName - Agent name
   * @returns {string}
   */
  getAgentResultsDir(agentName) {
    const normalized = agentName.replace(/^(worker-|codehornets-)/, '');
    return path.join(this.resultsDir, normalized);
  }

  /**
   * Get the heartbeat file path for an agent
   *
   * @private
   * @param {string} agentName - Agent name
   * @returns {string}
   */
  getHeartbeatPath(agentName) {
    const normalized = agentName.replace(/^(worker-|codehornets-)/, '');
    return path.join(this.heartbeatsDir, `${normalized}.json`);
  }

  /**
   * Create a task file for an agent
   *
   * @private
   * @param {string} agentName - Agent name
   * @param {string} taskId - Task ID
   * @param {string} message - Message content
   * @returns {Promise<string>} Task file path
   */
  async createTaskFile(agentName, taskId, message) {
    const agentTasksDir = this.getAgentTasksDir(agentName);

    // Ensure directory exists
    await fs.mkdir(agentTasksDir, { recursive: true });

    const taskPath = path.join(agentTasksDir, `${taskId}.json`);

    const task = {
      id: taskId,
      type: 'message',
      message,
      createdAt: new Date().toISOString(),
      from: 'orchestrator'
    };

    await fs.writeFile(taskPath, JSON.stringify(task, null, 2));

    return taskPath;
  }

  /**
   * Wait for a result file to appear
   *
   * @private
   * @param {string} agentName - Agent name
   * @param {string} taskId - Task ID
   * @param {number} timeout - Maximum wait time
   * @returns {Promise<string>}
   */
  async waitForResult(agentName, taskId, timeout) {
    const agentResultsDir = this.getAgentResultsDir(agentName);
    const resultPath = path.join(agentResultsDir, `${taskId}.json`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const content = await fs.readFile(resultPath, 'utf8');
        const result = JSON.parse(content);

        // Clean up result file
        await fs.unlink(resultPath).catch(() => {});

        return result.response || result.result || JSON.stringify(result);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }

        // Result not ready, wait and retry
        await this.sleep(this.pollInterval);
      }
    }

    throw new Error(`Timeout waiting for result from ${agentName}`);
  }

  /**
   * Watch for new task files (for receiving messages)
   *
   * @param {string} agentName - This agent's name
   * @param {Function} callback - Callback for new tasks
   * @returns {Function} Unwatch function
   */
  watchTasks(agentName, callback) {
    const agentTasksDir = this.getAgentTasksDir(agentName);
    let lastCheck = Date.now();

    const poll = async () => {
      try {
        const files = await fs.readdir(agentTasksDir);

        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const filePath = path.join(agentTasksDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime.getTime() > lastCheck) {
            const content = await fs.readFile(filePath, 'utf8');
            const task = JSON.parse(content);

            callback(task, filePath);

            // Mark as processed (rename or delete)
            await fs.rename(filePath, filePath + '.processed').catch(() => {});
          }
        }

        lastCheck = Date.now();
      } catch (error) {
        this.debug('Error watching tasks:', error.message);
      }
    };

    const intervalId = setInterval(poll, this.pollInterval);

    // Return unwatch function
    return () => clearInterval(intervalId);
  }
}

module.exports = FileBasedStrategy;
