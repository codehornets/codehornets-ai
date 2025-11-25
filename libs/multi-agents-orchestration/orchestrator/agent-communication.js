/**
 * Orchestrator Agent Communication Module
 *
 * Handles communication between the orchestrator and worker agents
 */

const AgentCommunicator = require('../utils/agent-bridge');

class OrchestratorCommunicator extends AgentCommunicator {
  constructor(options = {}) {
    super('orchestrator', {
      debug: options.debug !== undefined ? options.debug : true,
      strategy: options.strategy || 'auto'
    });

    // Worker agent mappings
    this.workers = {
      marie: {
        name: 'worker-marie',
        role: 'Dance Teacher Assistant',
        expertise: ['dance', 'students', 'choreography', 'performance']
      },
      anga: {
        name: 'worker-anga',
        role: 'Coding Assistant',
        expertise: ['code', 'programming', 'review', 'architecture', 'debug']
      },
      fabien: {
        name: 'worker-fabien',
        role: 'Marketing Assistant',
        expertise: ['marketing', 'campaign', 'content', 'seo', 'social']
      }
    };

    // Task tracking
    this.activeTasks = new Map();
    this.completedTasks = new Map();
  }

  /**
   * Initialize orchestrator communication
   */
  async initialize() {
    await super.initialize();

    // Register message handlers
    this.on('task_result', this.handleTaskResult.bind(this));
    this.on('task_progress', this.handleTaskProgress.bind(this));
    this.on('task_error', this.handleTaskError.bind(this));
    this.on('worker_status', this.handleWorkerStatus.bind(this));

    // Check worker statuses
    await this.checkWorkerStatuses();

    console.log('[orchestrator] 🎯 Orchestrator ready to coordinate tasks');
  }

  /**
   * Check status of all workers
   */
  async checkWorkerStatuses() {
    console.log('[orchestrator] 🔍 Checking worker statuses...');

    for (const [key, worker] of Object.entries(this.workers)) {
      const isRunning = await this.isAgentRunning(worker.name);
      console.log(`  ${worker.role}: ${isRunning ? '✅ Running' : '❌ Stopped'}`);
    }
  }

  /**
   * Delegate a task to the appropriate worker
   */
  async delegateTask(userRequest, taskDetails = {}) {
    console.log('[orchestrator] 📋 Delegating task:', userRequest);

    // Analyze the request to determine best worker
    const targetWorker = this.analyzeAndSelectWorker(userRequest, taskDetails);

    if (!targetWorker) {
      console.error('[orchestrator] ❌ Could not determine appropriate worker');
      return { success: false, error: 'No suitable worker found' };
    }

    // Check if worker is available
    const isRunning = await this.isAgentRunning(targetWorker.name);
    if (!isRunning) {
      console.error(`[orchestrator] ❌ Worker ${targetWorker.name} is not running`);
      return { success: false, error: `Worker ${targetWorker.name} is not available` };
    }

    // Create task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      type: 'task',
      taskId,
      request: userRequest,
      details: taskDetails,
      assignedTo: targetWorker.name,
      assignedAt: new Date().toISOString(),
      priority: taskDetails.priority || 'normal'
    };

    // Track task
    this.activeTasks.set(taskId, {
      ...task,
      status: 'assigned',
      worker: targetWorker.name
    });

    // Send to worker
    try {
      await this.sendToAgent(targetWorker.name, task);
      console.log(`[orchestrator] ✅ Task ${taskId} assigned to ${targetWorker.name}`);

      return { success: true, taskId, worker: targetWorker.name };
    } catch (error) {
      console.error(`[orchestrator] ❌ Failed to assign task:`, error.message);
      this.activeTasks.delete(taskId);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze request and select best worker
   */
  analyzeAndSelectWorker(request, details = {}) {
    const requestLower = request.toLowerCase();

    // Check explicit worker assignment in details
    if (details.worker) {
      return this.workers[details.worker];
    }

    // Analyze request keywords
    for (const [key, worker] of Object.entries(this.workers)) {
      for (const expertise of worker.expertise) {
        if (requestLower.includes(expertise.toLowerCase())) {
          console.log(`[orchestrator] 🎯 Selected ${worker.name} based on expertise: ${expertise}`);
          return worker;
        }
      }
    }

    // Default to marie for general queries
    console.log('[orchestrator] 🎯 Using default worker: marie');
    return this.workers.marie;
  }

  /**
   * Broadcast announcement to all workers
   */
  async announceToWorkers(message, options = {}) {
    console.log('[orchestrator] 📢 Broadcasting announcement...');

    const announcement = {
      type: 'announcement',
      message,
      timestamp: new Date().toISOString(),
      priority: options.priority || 'normal'
    };

    return await this.broadcast(announcement, options);
  }

  /**
   * Request status from a worker
   */
  async requestWorkerStatus(workerKey) {
    const worker = this.workers[workerKey];
    if (!worker) {
      throw new Error(`Unknown worker: ${workerKey}`);
    }

    console.log(`[orchestrator] 🔍 Requesting status from ${worker.name}...`);

    try {
      const status = await this.request(worker.name, 'get_status', {});
      console.log(`[orchestrator] ✅ Status from ${worker.name}:`, status);
      return status;
    } catch (error) {
      console.error(`[orchestrator] ❌ Failed to get status from ${worker.name}:`, error.message);
      return { error: error.message, available: false };
    }
  }

  /**
   * Handle task result from worker
   */
  handleTaskResult(payload, message) {
    const { taskId, result, status } = payload;

    console.log(`[orchestrator] ✅ Task ${taskId} completed by ${message.from}`);
    console.log(`[orchestrator] Result:`, result);

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

    console.log(`[orchestrator] 📊 Task ${taskId} progress: ${progress}% - ${progressMsg}`);

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

    console.error(`[orchestrator] ❌ Task ${taskId} error from ${message.from}:`, error);

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
    console.log(`[orchestrator] 📊 Status from ${message.from}:`, payload);
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
      total: this.activeTasks.size + this.completedTasks.size
    };
  }
}

// Export for use in orchestrator
module.exports = OrchestratorCommunicator;

// If run directly, start the communicator
if (require.main === module) {
  (async () => {
    const communicator = new OrchestratorCommunicator({ debug: true });

    try {
      await communicator.initialize();

      console.log('\n=== Orchestrator Communication System Started ===\n');

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
