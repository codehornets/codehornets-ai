/**
 * Worker Agent Communication Module
 *
 * Base class for worker agent communication
 */

const AgentCommunicator = require('../utils/agent-bridge');

class WorkerCommunicator extends AgentCommunicator {
  constructor(workerName, role, expertise, options = {}) {
    super(`worker-${workerName}`, {
      debug: options.debug !== undefined ? options.debug : true,
      strategy: options.strategy || 'auto'
    });

    this.workerName = workerName;
    this.role = role;
    this.expertise = expertise;
    this.currentTask = null;
    this.taskHistory = [];
    this.isAvailable = true;
  }

  /**
   * Initialize worker communication
   */
  async initialize() {
    await super.initialize();

    // Register message handlers
    this.on('task', this.handleTask.bind(this));
    this.on('announcement', this.handleAnnouncement.bind(this));
    this.on('request', this.handleRequest.bind(this));

    console.log(`[${this.workerName}] 🎯 ${this.role} ready to work`);
    console.log(`[${this.workerName}] 💡 Expertise:`, this.expertise.join(', '));

    // Notify orchestrator that we're ready
    await this.notifyReady();
  }

  /**
   * Notify orchestrator that worker is ready
   */
  async notifyReady() {
    try {
      await this.sendToAgent('orchestrator', {
        type: 'worker_status',
        status: 'ready',
        role: this.role,
        expertise: this.expertise,
        available: true
      });
    } catch (error) {
      // Orchestrator might not be running yet, that's ok
      console.log(`[${this.workerName}] ⚠️  Could not notify orchestrator (may not be running)`);
    }
  }

  /**
   * Handle incoming task
   */
  async handleTask(payload, message) {
    const { taskId, request, details } = payload;

    console.log(`\n[${this.workerName}] 📥 New task received: ${taskId}`);
    console.log(`[${this.workerName}] 📝 Request: ${request}`);

    if (!this.isAvailable) {
      console.log(`[${this.workerName}] ⚠️  Currently busy, queuing task...`);
      await this.sendTaskError(taskId, 'Worker is busy with another task');
      return;
    }

    this.isAvailable = false;
    this.currentTask = {
      taskId,
      request,
      details,
      startedAt: new Date().toISOString()
    };

    try {
      // Send acknowledgment
      await this.sendTaskProgress(taskId, 0, 'Task received, starting work...');

      // Process the task
      const result = await this.processTask(request, details);

      // Send result back to orchestrator
      await this.sendTaskResult(taskId, result);

      console.log(`[${this.workerName}] ✅ Task ${taskId} completed`);

      // Move to history
      this.taskHistory.push({
        ...this.currentTask,
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`[${this.workerName}] ❌ Task ${taskId} failed:`, error.message);
      await this.sendTaskError(taskId, error.message);

      // Move to history with error
      this.taskHistory.push({
        ...this.currentTask,
        status: 'error',
        error: error.message,
        errorAt: new Date().toISOString()
      });
    } finally {
      this.currentTask = null;
      this.isAvailable = true;
    }
  }

  /**
   * Process the task (to be overridden by specific workers)
   */
  async processTask(request, details) {
    // This should be overridden by each specific worker
    console.log(`[${this.workerName}] ⚙️  Processing: ${request}`);

    // Simulate work
    await this.sleep(2000);

    return {
      status: 'completed',
      message: `Task processed by ${this.role}`,
      data: { request, details }
    };
  }

  /**
   * Handle announcement from orchestrator
   */
  handleAnnouncement(payload, message) {
    console.log(`\n[${this.workerName}] 📢 Announcement from ${message.from}:`);
    console.log(`[${this.workerName}] ${payload.message}`);
  }

  /**
   * Handle request from orchestrator or other agents
   */
  async handleRequest(payload, message) {
    const { action, data } = payload;

    console.log(`[${this.workerName}] 🔍 Request: ${action}`);

    switch (action) {
      case 'get_status':
        return await this.respond(payload, this.getStatus());

      case 'get_capabilities':
        return await this.respond(payload, this.getCapabilities());

      case 'cancel_task':
        return await this.respond(payload, this.cancelCurrentTask());

      default:
        return await this.respond(payload, null, `Unknown action: ${action}`);
    }
  }

  /**
   * Send task progress update
   */
  async sendTaskProgress(taskId, progress, message) {
    await this.sendToAgent('orchestrator', {
      type: 'task_progress',
      taskId,
      progress,
      message
    });
  }

  /**
   * Send task result
   */
  async sendTaskResult(taskId, result) {
    await this.sendToAgent('orchestrator', {
      type: 'task_result',
      taskId,
      result,
      status: 'completed'
    });
  }

  /**
   * Send task error
   */
  async sendTaskError(taskId, error) {
    await this.sendToAgent('orchestrator', {
      type: 'task_error',
      taskId,
      error
    });
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      worker: this.workerName,
      role: this.role,
      available: this.isAvailable,
      currentTask: this.currentTask,
      tasksCompleted: this.taskHistory.filter(t => t.status === 'completed').length,
      tasksTotal: this.taskHistory.length
    };
  }

  /**
   * Get worker capabilities
   */
  getCapabilities() {
    return {
      role: this.role,
      expertise: this.expertise,
      supportedActions: this.getSupportedActions()
    };
  }

  /**
   * Get supported actions (to be overridden)
   */
  getSupportedActions() {
    return ['process_task', 'get_status', 'get_capabilities'];
  }

  /**
   * Cancel current task
   */
  cancelCurrentTask() {
    if (this.currentTask) {
      console.log(`[${this.workerName}] 🛑 Canceling current task: ${this.currentTask.taskId}`);
      this.currentTask = null;
      this.isAvailable = true;
      return { success: true, message: 'Task canceled' };
    }

    return { success: false, message: 'No active task to cancel' };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WorkerCommunicator;
