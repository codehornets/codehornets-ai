/**
 * Orchestrator Agent Communication Module (Unified Version)
 *
 * Handles communication between the orchestrator and worker agents.
 * Uses the unified AgentCommunicator from agent-comm module which supports
 * multiple strategies: tmux send-keys, pty-wrapper, and file-based messaging.
 *
 * This is the updated version that uses the new agent-comm module.
 * Use this instead of agent-communication.js for new implementations.
 */

const UnifiedAgentCommunicator = require('../agent-comm');
const EventEmitter = require('events');

/**
 * OrchestratorCommunicator - Enhanced orchestrator communication with strategy support
 *
 * @example
 * // Use new unified communicator (default)
 * const comm = new OrchestratorCommunicator({ strategy: 'auto' });
 *
 * // Force specific strategy
 * const comm = new OrchestratorCommunicator({ strategy: 'tmux' });
 */
class OrchestratorCommunicator extends EventEmitter {
  /**
   * Create a new OrchestratorCommunicator
   *
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=true] - Enable debug logging
   * @param {string} [options.strategy='auto'] - Communication strategy
   */
  constructor(options = {}) {
    super();

    this.options = {
      debug: options.debug !== undefined ? options.debug : true,
      strategy: options.strategy || 'auto',
      ...options
    };

    // Worker agent mappings
    this.workers = {
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

    // Initialize the unified communicator
    this.communicator = new UnifiedAgentCommunicator({
      strategy: this.options.strategy,
      agents: ['orchestrator', 'marie', 'anga', 'fabien'],
      debug: this.options.debug,
      agentConfigs: {
        marie: this.workers.marie,
        anga: this.workers.anga,
        fabien: this.workers.fabien
      }
    });

    // Task tracking
    this.activeTasks = new Map();
    this.completedTasks = new Map();
  }

  /**
   * Initialize orchestrator communication
   */
  async initialize() {
    this.log('Initializing orchestrator communication...');

    await this.communicator.initialize();

    // Forward events from communicator
    this.communicator.on('messageSent', (data) => this.emit('messageSent', data));
    this.communicator.on('sendError', (data) => this.emit('sendError', data));

    // Register internal message handlers
    this.on('task_result', this.handleTaskResult.bind(this));
    this.on('task_progress', this.handleTaskProgress.bind(this));
    this.on('task_error', this.handleTaskError.bind(this));
    this.on('worker_status', this.handleWorkerStatus.bind(this));

    // Check worker statuses
    await this.checkWorkerStatuses();

    this.log('Orchestrator ready to coordinate tasks');
  }

  /**
   * Check status of all workers
   */
  async checkWorkerStatuses() {
    this.log('Checking worker statuses...');

    for (const [key, worker] of Object.entries(this.workers)) {
      try {
        const status = await this.communicator.getStatus(worker.name);
        const statusIcon = status.available ? 'Running' : 'Stopped';
        console.log(`  ${worker.role}: ${status.available ? '[OK]' : '[--]'} ${statusIcon}`);
      } catch (error) {
        console.log(`  ${worker.role}: [--] Error: ${error.message}`);
      }
    }
  }

  /**
   * Get status of a specific worker
   */
  async getWorkerStatus(workerKey) {
    const worker = this.workers[workerKey];
    if (!worker) {
      throw new Error(`Unknown worker: ${workerKey}`);
    }

    return this.communicator.getStatus(worker.name);
  }

  /**
   * Check if a worker agent is running
   */
  async isAgentRunning(agentName) {
    const status = await this.communicator.getStatus(agentName);
    return status.available;
  }

  /**
   * Send message to a specific agent
   */
  async sendToAgent(agentName, payload) {
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return this.communicator.send(agentName, message);
  }

  /**
   * Delegate a task to the appropriate worker
   */
  async delegateTask(userRequest, taskDetails = {}) {
    this.log(`Delegating task: ${userRequest.substring(0, 50)}...`);

    try {
      const result = await this.communicator.delegateTask(userRequest, taskDetails);

      // Track the task
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.activeTasks.set(taskId, {
        taskId,
        request: userRequest,
        assignedTo: result.assignedTo,
        assignedAt: new Date().toISOString(),
        status: 'assigned'
      });

      this.log(`Task ${taskId} assigned to ${result.assignedTo}`);
      return { success: result.success, taskId, worker: result.assignedTo, ...result };
    } catch (error) {
      this.error(`Delegation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Broadcast announcement to all workers
   */
  async announceToWorkers(message, options = {}) {
    this.log('Broadcasting announcement...');
    return this.communicator.broadcast('workers', message, options);
  }

  /**
   * Broadcast to specific targets
   */
  async broadcast(targets, message, options = {}) {
    return this.communicator.broadcast(targets, message, options);
  }

  /**
   * Request status from a worker
   */
  async requestWorkerStatus(workerKey) {
    const worker = this.workers[workerKey];
    if (!worker) {
      throw new Error(`Unknown worker: ${workerKey}`);
    }

    this.log(`Requesting status from ${worker.name}...`);

    try {
      const status = await this.getWorkerStatus(workerKey);
      this.log(`Status from ${worker.name}:`, status);
      return status;
    } catch (error) {
      this.error(`Failed to get status from ${worker.name}: ${error.message}`);
      return { error: error.message, available: false };
    }
  }

  /**
   * Get all worker statuses
   */
  async getAllWorkerStatuses() {
    return this.communicator.getAllStatuses();
  }

  /**
   * Handle task result from worker
   */
  handleTaskResult(payload, message) {
    const { taskId, result } = payload;

    this.log(`Task ${taskId} completed by ${message?.from || 'worker'}`);

    const task = this.activeTasks.get(taskId);
    if (task) {
      this.completedTasks.set(taskId, {
        ...task,
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      });
      this.activeTasks.delete(taskId);
    }
  }

  /**
   * Handle task progress update from worker
   */
  handleTaskProgress(payload, message) {
    const { taskId, progress, message: progressMsg } = payload;

    this.log(`Task ${taskId} progress: ${progress}% - ${progressMsg}`);

    const task = this.activeTasks.get(taskId);
    if (task) {
      task.progress = progress;
      task.lastUpdate = new Date().toISOString();
    }
  }

  /**
   * Handle task error from worker
   */
  handleTaskError(payload, message) {
    const { taskId, error } = payload;

    this.error(`Task ${taskId} error from ${message?.from || 'worker'}: ${error}`);

    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'error';
      task.error = error;
      task.errorAt = new Date().toISOString();
    }
  }

  /**
   * Handle worker status update
   */
  handleWorkerStatus(payload, message) {
    this.log(`Status from ${message?.from || 'worker'}:`, payload);
  }

  /**
   * Get all active tasks
   */
  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks() {
    return Array.from(this.completedTasks.values());
  }

  /**
   * Get task statistics
   */
  getStatistics() {
    return {
      active: this.activeTasks.size,
      completed: this.completedTasks.size,
      total: this.activeTasks.size + this.completedTasks.size,
      strategy: this.communicator.activeStrategy
    };
  }

  /**
   * Shutdown the communicator
   */
  async shutdown() {
    this.log('Shutting down...');

    await this.communicator.shutdown();

    this.removeAllListeners();
    this.log('Shutdown complete');
  }

  /**
   * Log a message
   */
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[orchestrator] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   */
  error(message, ...args) {
    console.error(`[orchestrator] ERROR: ${message}`, ...args);
  }
}

// Export for use in orchestrator
module.exports = OrchestratorCommunicator;

// If run directly, start the communicator
if (require.main === module) {
  (async () => {
    const strategy = process.argv[2] || 'auto';
    const communicator = new OrchestratorCommunicator({
      debug: true,
      strategy
    });

    try {
      await communicator.initialize();

      console.log('\n=== Orchestrator Communication System Started ===');
      console.log(`Strategy: ${communicator.communicator.activeStrategy}`);
      console.log('');

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n[orchestrator] Shutting down...');
        await communicator.shutdown();
        process.exit(0);
      });
    } catch (error) {
      console.error('[orchestrator] Failed to initialize:', error);
      process.exit(1);
    }
  })();
}
