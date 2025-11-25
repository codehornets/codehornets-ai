/**
 * Agent Communication Module
 *
 * Unified API for communicating with Claude Code agents in the CodeHornets AI
 * orchestration system. Supports multiple strategies: tmux send-keys, pty-wrapper,
 * and file-based messaging.
 *
 * @module agent-comm
 */

const EventEmitter = require('events');
const TmuxStrategy = require('./strategies/tmux');
const PtyWrapperStrategy = require('./strategies/pty-wrapper');
const FileBasedStrategy = require('./strategies/file-based');

/**
 * @typedef {Object} AgentConfig
 * @property {string} name - Agent name
 * @property {string} role - Agent role description
 * @property {string[]} [expertise] - Areas of expertise
 */

/**
 * @typedef {'auto'|'tmux'|'pty-wrapper'|'file-based'} StrategyType
 */

/**
 * @typedef {Object} CommunicatorOptions
 * @property {StrategyType} [strategy='auto'] - Communication strategy
 * @property {string[]} [agents] - List of agent names
 * @property {string} [sharedDir='/shared'] - Shared directory path
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {number} [timeout=30000] - Default timeout in milliseconds
 * @property {Object} [tmuxOptions] - Options for tmux strategy
 * @property {Object} [ptyOptions] - Options for pty-wrapper strategy
 * @property {Object} [fileOptions] - Options for file-based strategy
 */

/**
 * Default agent configurations
 */
const DEFAULT_AGENTS = {
  orchestrator: {
    name: 'orchestrator',
    role: 'Task Coordinator',
    expertise: ['coordination', 'task-management', 'routing']
  },
  marie: {
    name: 'marie',
    role: 'Dance Teacher Assistant',
    expertise: ['dance', 'students', 'choreography', 'performance']
  },
  anga: {
    name: 'anga',
    role: 'Coding Assistant',
    expertise: ['code', 'programming', 'review', 'architecture', 'debug']
  },
  fabien: {
    name: 'fabien',
    role: 'Marketing Assistant',
    expertise: ['marketing', 'campaign', 'content', 'seo', 'social']
  }
};

/**
 * Worker agent names (excluding orchestrator)
 */
const WORKER_AGENTS = ['marie', 'anga', 'fabien'];

/**
 * AgentCommunicator - Unified interface for agent communication
 *
 * @extends EventEmitter
 *
 * @example
 * const comm = new AgentCommunicator({
 *   strategy: 'auto',
 *   agents: ['orchestrator', 'marie', 'anga', 'fabien']
 * });
 *
 * await comm.initialize();
 *
 * // Send message and wait for response
 * const response = await comm.send('anga', 'analyze this code');
 *
 * // Send without waiting
 * await comm.sendAsync('marie', 'start task');
 *
 * // Broadcast to all workers
 * await comm.broadcast('workers', 'system update');
 */
class AgentCommunicator extends EventEmitter {
  /**
   * Create a new AgentCommunicator instance
   *
   * @param {CommunicatorOptions} options - Configuration options
   */
  constructor(options = {}) {
    super();

    this.options = {
      strategy: options.strategy || 'auto',
      agents: options.agents || Object.keys(DEFAULT_AGENTS),
      sharedDir: options.sharedDir || '/shared',
      debug: options.debug || false,
      timeout: options.timeout || 30000,
      ...options
    };

    // Initialize agent configurations
    this.agentConfigs = { ...DEFAULT_AGENTS };
    if (options.agentConfigs) {
      Object.assign(this.agentConfigs, options.agentConfigs);
    }

    // Strategy instances
    this.strategies = {
      'tmux': new TmuxStrategy({
        ...this.options,
        ...(options.tmuxOptions || {})
      }),
      'pty-wrapper': new PtyWrapperStrategy({
        ...this.options,
        socketDir: options.socketDir || '/shared/sockets',
        ...(options.ptyOptions || {})
      }),
      'file-based': new FileBasedStrategy({
        ...this.options,
        ...(options.fileOptions || {})
      })
    };

    // Strategy priority for auto mode
    this.strategyPriority = ['pty-wrapper', 'tmux', 'file-based'];

    // Active strategy per agent (for caching)
    this.activeStrategies = new Map();

    // Logger
    this.logger = options.logger || console;

    // State
    this.initialized = false;
    this.activeStrategy = null;
  }

  /**
   * Initialize the communicator and detect best strategy
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    this.debug('Initializing AgentCommunicator');

    // Initialize all strategies
    for (const [name, strategy] of Object.entries(this.strategies)) {
      try {
        await strategy.initialize();
        this.debug(`Strategy '${name}' initialized`);
      } catch (error) {
        this.debug(`Strategy '${name}' failed to initialize: ${error.message}`);
      }
    }

    // Detect best strategy if auto mode
    if (this.options.strategy === 'auto') {
      this.activeStrategy = await this.detectBestStrategy();
      this.info(`Auto-detected strategy: ${this.activeStrategy}`);
    } else {
      this.activeStrategy = this.options.strategy;
      this.info(`Using configured strategy: ${this.activeStrategy}`);
    }

    this.initialized = true;
    this.emit('initialized', { strategy: this.activeStrategy });
  }

  /**
   * Send message to an agent and wait for response
   *
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @param {Object} [options] - Send options
   * @param {number} [options.timeout] - Timeout in milliseconds
   * @param {StrategyType} [options.strategy] - Override strategy for this request
   * @returns {Promise<Object>} Result with success, response, and duration
   */
  async send(agentName, message, options = {}) {
    this.ensureInitialized();

    const strategyName = options.strategy || this.activeStrategy;
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    this.debug(`Sending to ${agentName} via ${strategyName}: ${message.substring(0, 50)}...`);

    const result = await strategy.send(agentName, message, {
      timeout: options.timeout || this.options.timeout,
      waitForResponse: true,
      ...options
    });

    if (result.success) {
      this.emit('messageSent', { agent: agentName, strategy: strategyName, result });
    } else {
      this.emit('sendError', { agent: agentName, strategy: strategyName, error: result.error });
    }

    return result;
  }

  /**
   * Send message without waiting for response
   *
   * @param {string} agentName - Target agent name
   * @param {string} message - Message to send
   * @param {Object} [options] - Send options
   * @returns {Promise<void>}
   */
  async sendAsync(agentName, message, options = {}) {
    this.ensureInitialized();

    const strategyName = options.strategy || this.activeStrategy;
    const strategy = this.strategies[strategyName];

    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    this.debug(`Sending async to ${agentName} via ${strategyName}`);

    await strategy.sendAsync(agentName, message);
    this.emit('messageSent', { agent: agentName, strategy: strategyName, async: true });
  }

  /**
   * Get current output from an agent
   *
   * @param {string} agentName - Target agent name
   * @param {Object} [options] - Options
   * @param {number} [options.lines] - Number of lines to retrieve
   * @returns {Promise<string>}
   */
  async getOutput(agentName, options = {}) {
    this.ensureInitialized();

    const strategy = this.strategies[this.activeStrategy];
    return strategy.getOutput(agentName, options);
  }

  /**
   * Get status of an agent
   *
   * @param {string} agentName - Target agent name
   * @returns {Promise<Object>}
   */
  async getStatus(agentName) {
    this.ensureInitialized();

    const strategy = this.strategies[this.activeStrategy];
    const status = await strategy.getStatus(agentName);

    return {
      agent: agentName,
      strategy: this.activeStrategy,
      ...status
    };
  }

  /**
   * Get status of all agents
   *
   * @returns {Promise<Object>}
   */
  async getAllStatuses() {
    this.ensureInitialized();

    const statuses = {};

    for (const agentName of this.options.agents) {
      statuses[agentName] = await this.getStatus(agentName);
    }

    return statuses;
  }

  /**
   * Broadcast message to multiple agents
   *
   * @param {string|string[]} targets - Target specification: 'all', 'workers', or array of names
   * @param {string} message - Message to broadcast
   * @param {Object} [options] - Broadcast options
   * @returns {Promise<Object>} Results per agent
   */
  async broadcast(targets, message, options = {}) {
    this.ensureInitialized();

    // Resolve target agents
    let agentList;

    if (targets === 'all') {
      agentList = this.options.agents;
    } else if (targets === 'workers') {
      agentList = WORKER_AGENTS.filter(a => this.options.agents.includes(a));
    } else if (Array.isArray(targets)) {
      agentList = targets;
    } else {
      throw new Error(`Invalid broadcast target: ${targets}`);
    }

    this.info(`Broadcasting to ${agentList.length} agents: ${agentList.join(', ')}`);

    const results = {};

    // Send to all agents in parallel
    const promises = agentList.map(async (agentName) => {
      try {
        const result = await this.send(agentName, message, options);
        results[agentName] = result;
      } catch (error) {
        results[agentName] = {
          success: false,
          error: error.message
        };
      }
    });

    await Promise.allSettled(promises);

    const successful = Object.values(results).filter(r => r.success).length;
    this.info(`Broadcast complete: ${successful}/${agentList.length} successful`);

    return results;
  }

  /**
   * Send a task to the most appropriate agent based on expertise
   *
   * @param {string} taskDescription - Task description
   * @param {Object} [options] - Options
   * @returns {Promise<Object>} Result including assigned agent
   */
  async delegateTask(taskDescription, options = {}) {
    this.ensureInitialized();

    // Find best agent for the task
    const agent = this.findBestAgent(taskDescription, options);

    if (!agent) {
      throw new Error('No suitable agent found for task');
    }

    this.info(`Delegating task to ${agent.name}`);

    const result = await this.send(agent.name, taskDescription, options);

    return {
      assignedTo: agent.name,
      assignedRole: agent.role,
      ...result
    };
  }

  /**
   * Clean up and shutdown
   *
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.info('Shutting down AgentCommunicator');

    for (const strategy of Object.values(this.strategies)) {
      try {
        await strategy.cleanup();
      } catch (error) {
        this.debug(`Error cleaning up strategy: ${error.message}`);
      }
    }

    this.activeStrategies.clear();
    this.initialized = false;
    this.emit('shutdown');
  }

  // -------------- Private Methods --------------

  /**
   * Ensure communicator is initialized
   *
   * @private
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('AgentCommunicator not initialized. Call initialize() first.');
    }
  }

  /**
   * Detect the best available strategy
   *
   * @private
   * @returns {Promise<string>}
   */
  async detectBestStrategy() {
    for (const strategyName of this.strategyPriority) {
      const strategy = this.strategies[strategyName];

      try {
        const available = await strategy.isAvailable();

        if (available) {
          this.debug(`Strategy '${strategyName}' is available`);
          return strategyName;
        }
      } catch (error) {
        this.debug(`Strategy '${strategyName}' check failed: ${error.message}`);
      }
    }

    // Default to file-based as last resort
    this.debug('No strategy available, falling back to file-based');
    return 'file-based';
  }

  /**
   * Find the best agent for a task based on expertise matching
   *
   * @private
   * @param {string} taskDescription - Task description
   * @param {Object} [options] - Options
   * @returns {AgentConfig|null}
   */
  findBestAgent(taskDescription, options = {}) {
    // If explicit agent specified, use it
    if (options.agent) {
      return this.agentConfigs[options.agent];
    }

    const taskLower = taskDescription.toLowerCase();

    // Score each agent based on keyword matches
    let bestAgent = null;
    let bestScore = 0;

    for (const agentName of WORKER_AGENTS) {
      const agent = this.agentConfigs[agentName];

      if (!agent || !agent.expertise) continue;

      let score = 0;
      for (const expertise of agent.expertise) {
        if (taskLower.includes(expertise.toLowerCase())) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    // Default to marie if no match
    return bestAgent || this.agentConfigs['marie'];
  }

  /**
   * Get agent configuration
   *
   * @param {string} agentName - Agent name
   * @returns {AgentConfig}
   */
  getAgentConfig(agentName) {
    return this.agentConfigs[agentName];
  }

  /**
   * Log a debug message
   *
   * @private
   */
  debug(message, ...args) {
    if (this.options.debug) {
      this.logger.log(`[AgentCommunicator] ${message}`, ...args);
    }
  }

  /**
   * Log an info message
   *
   * @private
   */
  info(message, ...args) {
    this.logger.log(`[AgentCommunicator] ${message}`, ...args);
  }

  /**
   * Log an error message
   *
   * @private
   */
  error(message, ...args) {
    this.logger.error(`[AgentCommunicator] ERROR: ${message}`, ...args);
  }
}

// Export the main class and strategies
module.exports = AgentCommunicator;
module.exports.AgentCommunicator = AgentCommunicator;
module.exports.TmuxStrategy = TmuxStrategy;
module.exports.PtyWrapperStrategy = PtyWrapperStrategy;
module.exports.FileBasedStrategy = FileBasedStrategy;
module.exports.DEFAULT_AGENTS = DEFAULT_AGENTS;
module.exports.WORKER_AGENTS = WORKER_AGENTS;
