/**
 * TmuxController - Node.js controller for sending commands to Claude Code TUI
 * running in Docker containers via tmux sessions.
 *
 * Usage:
 *   const TmuxController = require('./tmux-controller');
 *   const controller = new TmuxController();
 *
 *   // Send a message to an agent
 *   await controller.sendMessage('anga', 'Create a Python function');
 *
 *   // Get current screen output
 *   const output = await controller.getOutput('anga');
 *
 *   // Check if session is active
 *   const isActive = await controller.isSessionActive('anga');
 */

const { execSync, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Agent configuration
const AGENTS = {
  orchestrator: {
    name: 'orchestrator',
    container: 'codehornets-orchestrator',
    role: 'orchestrator',
    tmuxSession: 'claude-orchestrator'
  },
  marie: {
    name: 'marie',
    container: 'codehornets-worker-marie',
    role: 'worker',
    tmuxSession: 'claude-marie'
  },
  anga: {
    name: 'anga',
    container: 'codehornets-worker-anga',
    role: 'worker',
    tmuxSession: 'claude-anga'
  },
  fabien: {
    name: 'fabien',
    container: 'codehornets-worker-fabien',
    role: 'worker',
    tmuxSession: 'claude-fabien'
  }
};

const DEFAULT_TMUX_SESSION = 'claude-session';

class TmuxController {
  /**
   * Create a new TmuxController instance
   * @param {Object} options - Configuration options
   * @param {string} options.tmuxSession - tmux session name (default: 'claude')
   * @param {number} options.defaultTimeout - Default command timeout in ms (default: 30000)
   * @param {boolean} options.verbose - Enable verbose logging (default: false)
   */
  constructor(options = {}) {
    this.tmuxSession = options.tmuxSession || DEFAULT_TMUX_SESSION;
    this.defaultTimeout = options.defaultTimeout || 30000;
    this.verbose = options.verbose || false;
  }

  /**
   * Log message if verbose mode is enabled
   * @private
   */
  _log(...args) {
    if (this.verbose) {
      console.log('[TmuxController]', ...args);
    }
  }

  /**
   * Get agent configuration
   * @param {string} agent - Agent name
   * @returns {Object} Agent configuration
   * @throws {Error} If agent is unknown
   */
  getAgentConfig(agent) {
    const agentLower = agent.toLowerCase();
    if (!AGENTS[agentLower]) {
      throw new Error(`Unknown agent: ${agent}. Valid agents: ${Object.keys(AGENTS).join(', ')}`);
    }
    return AGENTS[agentLower];
  }

  /**
   * Get tmux session name for an agent
   * @param {string} agent - Agent name
   * @returns {string} tmux session name
   */
  getTmuxSession(agent) {
    const config = this.getAgentConfig(agent);
    return config.tmuxSession || this.tmuxSession;
  }

  /**
   * Execute a docker command
   * @private
   * @param {string} container - Container name
   * @param {string} command - Command to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async _dockerExec(container, command, timeout = this.defaultTimeout) {
    const fullCommand = `docker exec ${container} ${command}`;
    this._log('Executing:', fullCommand);

    try {
      const result = await execAsync(fullCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      });
      return result;
    } catch (error) {
      if (error.killed) {
        throw new Error(`Command timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Execute a docker command synchronously
   * @private
   * @param {string} container - Container name
   * @param {string} command - Command to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {string} Command output
   */
  _dockerExecSync(container, command, timeout = this.defaultTimeout) {
    const fullCommand = `docker exec ${container} ${command}`;
    this._log('Executing (sync):', fullCommand);

    try {
      return execSync(fullCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf-8'
      });
    } catch (error) {
      if (error.killed) {
        throw new Error(`Command timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Check if a container is running
   * @param {string} agent - Agent name
   * @returns {Promise<boolean>}
   */
  async isContainerRunning(agent) {
    const config = this.getAgentConfig(agent);

    try {
      const { stdout } = await execAsync(`docker ps --format "{{.Names}}" --filter "name=${config.container}"`);
      return stdout.trim().includes(config.container);
    } catch (error) {
      this._log('Error checking container:', error.message);
      return false;
    }
  }

  /**
   * Check if tmux session is active for an agent
   * @param {string} agent - Agent name
   * @returns {Promise<boolean>}
   */
  async isSessionActive(agent) {
    const config = this.getAgentConfig(agent);
    const session = this.getTmuxSession(agent);

    if (!(await this.isContainerRunning(agent))) {
      return false;
    }

    try {
      await this._dockerExec(config.container, `tmux has-session -t ${session}`, 5000);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Send a message to an agent's Claude TUI
   * @param {string} agent - Agent name
   * @param {string} message - Message to send
   * @param {Object} options - Options
   * @param {boolean} options.pressEnter - Press Enter after message (default: true)
   * @param {number} options.timeout - Command timeout in ms
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendMessage(agent, message, options = {}) {
    const { pressEnter = true, timeout = this.defaultTimeout } = options;
    const config = this.getAgentConfig(agent);
    const session = this.getTmuxSession(agent);

    this._log(`Sending message to ${agent}: ${message.substring(0, 50)}...`);

    // Verify container is running
    if (!(await this.isContainerRunning(agent))) {
      return {
        success: false,
        message: `Container ${config.container} is not running`
      };
    }

    // Verify tmux session is active
    if (!(await this.isSessionActive(agent))) {
      return {
        success: false,
        message: `tmux session '${session}' not found in ${config.container}`
      };
    }

    try {
      // Escape special characters for shell
      const escapedMessage = message
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "'\\''")
        .replace(/"/g, '\\"');

      // Build tmux send-keys command
      let tmuxCommand = `tmux send-keys -t ${session} '${escapedMessage}'`;
      if (pressEnter) {
        tmuxCommand += ' Enter';
      }

      await this._dockerExec(config.container, tmuxCommand, timeout);

      return {
        success: true,
        message: `Message sent to ${agent}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send message: ${error.message}`
      };
    }
  }

  /**
   * Send a special key to an agent's Claude TUI
   * @param {string} agent - Agent name
   * @param {string} key - Key to send (e.g., 'Enter', 'C-c', 'Escape', 'Up', 'Down')
   * @param {Object} options - Options
   * @param {number} options.timeout - Command timeout in ms
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendKey(agent, key, options = {}) {
    const { timeout = this.defaultTimeout } = options;
    const config = this.getAgentConfig(agent);
    const session = this.getTmuxSession(agent);

    this._log(`Sending key to ${agent}: ${key}`);

    // Verify container and session
    if (!(await this.isContainerRunning(agent))) {
      return {
        success: false,
        message: `Container ${config.container} is not running`
      };
    }

    if (!(await this.isSessionActive(agent))) {
      return {
        success: false,
        message: `tmux session '${session}' not found`
      };
    }

    try {
      const tmuxCommand = `tmux send-keys -t ${session} ${key}`;
      await this._dockerExec(config.container, tmuxCommand, timeout);

      return {
        success: true,
        message: `Key '${key}' sent to ${agent}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send key: ${error.message}`
      };
    }
  }

  /**
   * Get current screen output from an agent's Claude TUI
   * @param {string} agent - Agent name
   * @param {Object} options - Options
   * @param {number} options.lines - Number of history lines to capture (default: 100)
   * @param {number} options.timeout - Command timeout in ms
   * @returns {Promise<{success: boolean, output: string, message: string}>}
   */
  async getOutput(agent, options = {}) {
    const { lines = 100, timeout = this.defaultTimeout } = options;
    const config = this.getAgentConfig(agent);
    const session = this.getTmuxSession(agent);

    this._log(`Getting output from ${agent} (${lines} lines)`);

    // Verify container and session
    if (!(await this.isContainerRunning(agent))) {
      return {
        success: false,
        output: '',
        message: `Container ${config.container} is not running`
      };
    }

    if (!(await this.isSessionActive(agent))) {
      return {
        success: false,
        output: '',
        message: `tmux session '${session}' not found`
      };
    }

    try {
      // Capture pane content with scrollback history
      const tmuxCommand = `tmux capture-pane -t ${session} -p -S -${lines}`;
      const { stdout } = await this._dockerExec(config.container, tmuxCommand, timeout);

      return {
        success: true,
        output: stdout,
        message: 'Output captured successfully'
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        message: `Failed to get output: ${error.message}`
      };
    }
  }

  /**
   * Get status of all agents
   * @returns {Promise<Object>} Status object for all agents
   */
  async getAllStatus() {
    const status = {};

    for (const agentName of Object.keys(AGENTS)) {
      const config = AGENTS[agentName];
      const containerRunning = await this.isContainerRunning(agentName);
      const sessionActive = containerRunning ? await this.isSessionActive(agentName) : false;

      status[agentName] = {
        name: agentName,
        container: config.container,
        role: config.role,
        containerRunning,
        sessionActive,
        status: sessionActive ? 'active' : containerRunning ? 'running (no tmux)' : 'offline'
      };
    }

    return status;
  }

  /**
   * Wait for agent to become ready (container running + tmux session active)
   * @param {string} agent - Agent name
   * @param {Object} options - Options
   * @param {number} options.timeout - Maximum wait time in ms (default: 60000)
   * @param {number} options.interval - Check interval in ms (default: 2000)
   * @returns {Promise<boolean>} True if agent is ready, false if timeout
   */
  async waitForReady(agent, options = {}) {
    const { timeout = 60000, interval = 2000 } = options;
    const startTime = Date.now();

    this._log(`Waiting for ${agent} to be ready (timeout: ${timeout}ms)`);

    while (Date.now() - startTime < timeout) {
      if (await this.isSessionActive(agent)) {
        this._log(`${agent} is ready`);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    this._log(`Timeout waiting for ${agent}`);
    return false;
  }

  /**
   * Send Ctrl+C to interrupt current operation
   * @param {string} agent - Agent name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async interrupt(agent) {
    return this.sendKey(agent, 'C-c');
  }

  /**
   * Send /exit command to quit Claude
   * @param {string} agent - Agent name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async exitClaude(agent) {
    return this.sendMessage(agent, '/exit');
  }

  /**
   * Clear the Claude conversation
   * @param {string} agent - Agent name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async clearConversation(agent) {
    return this.sendMessage(agent, '/clear');
  }
}

// Export the class and convenience functions
module.exports = TmuxController;
module.exports.TmuxController = TmuxController;
module.exports.AGENTS = AGENTS;

// CLI support - run directly with node
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('TmuxController CLI');
    console.log('');
    console.log('Usage: node index.js <command> <agent> [args...]');
    console.log('');
    console.log('Commands:');
    console.log('  send <agent> <message>  - Send message to agent');
    console.log('  output <agent> [lines]  - Get screen output');
    console.log('  key <agent> <key>       - Send special key');
    console.log('  status [agent]          - Check status');
    console.log('  wait <agent>            - Wait for agent to be ready');
    console.log('');
    console.log('Agents: orchestrator, marie, anga, fabien');
    console.log('');
    console.log('Examples:');
    console.log('  node index.js send anga "Create a hello world script"');
    console.log('  node index.js output anga 50');
    console.log('  node index.js key anga C-c');
    console.log('  node index.js status');
    process.exit(1);
  }

  const command = args[0];
  const controller = new TmuxController({ verbose: true });

  (async () => {
    try {
      switch (command) {
        case 'send': {
          const agent = args[1];
          const message = args.slice(2).join(' ');
          const result = await controller.sendMessage(agent, message);
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          break;
        }

        case 'output': {
          const agent = args[1];
          const lines = parseInt(args[2]) || 100;
          const result = await controller.getOutput(agent, { lines });
          if (result.success) {
            console.log(result.output);
          } else {
            console.error(result.message);
          }
          process.exit(result.success ? 0 : 1);
          break;
        }

        case 'key': {
          const agent = args[1];
          const key = args[2];
          const result = await controller.sendKey(agent, key);
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          break;
        }

        case 'status': {
          const agent = args[1];
          if (agent) {
            const isActive = await controller.isSessionActive(agent);
            const isRunning = await controller.isContainerRunning(agent);
            console.log(JSON.stringify({
              agent,
              containerRunning: isRunning,
              sessionActive: isActive,
              status: isActive ? 'active' : isRunning ? 'running (no tmux)' : 'offline'
            }, null, 2));
          } else {
            const status = await controller.getAllStatus();
            console.log(JSON.stringify(status, null, 2));
          }
          break;
        }

        case 'wait': {
          const agent = args[1];
          const timeout = parseInt(args[2]) || 60000;
          const ready = await controller.waitForReady(agent, { timeout });
          console.log(JSON.stringify({ agent, ready }, null, 2));
          process.exit(ready ? 0 : 1);
          break;
        }

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
