import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledTasksService } from '../scheduled-tasks/scheduled-tasks.service';
import { ScheduledTask, TaskType } from '../scheduled-tasks/entities/scheduled-task.entity';
import { ExecutionStatus } from '../scheduled-tasks/entities/task-execution.entity';
import { WorkflowDispatcherService } from '../dispatchers/workflow-dispatcher.service';
import { ReportDispatcherService } from '../dispatchers/report-dispatcher.service';
import { AgentDispatcherService } from '../dispatchers/agent-dispatcher.service';
import { CustomDispatcherService } from '../dispatchers/custom-dispatcher.service';
import { DistributedLockService } from '@funnelagents/infrastructure';

@Injectable()
export class CronJobsService implements OnModuleInit {
  private readonly logger = new Logger(CronJobsService.name);
  private readonly activeCronJobs = new Map<string, CronJob>();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly workflowDispatcher: WorkflowDispatcherService,
    private readonly reportDispatcher: ReportDispatcherService,
    private readonly agentDispatcher: AgentDispatcherService,
    private readonly customDispatcher: CustomDispatcherService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Initialize module - load all enabled tasks
   */
  async onModuleInit() {
    this.logger.log('Initializing CronJobsService...');
    await this.loadActiveTasks();
    this.logger.log('CronJobsService initialized');
  }

  /**
   * System cron job - Check for due tasks every minute
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'check-due-tasks',
  })
  async checkDueTasks() {
    // Acquire distributed lock to prevent multiple instances from processing
    const lockKey = 'scheduler:check-due-tasks';
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: 50000, // 50 seconds (less than 1 minute interval)
      retryCount: 0, // Don't retry - if lock is held, skip this run
    });

    if (!lockResult.acquired) {
      this.logger.debug(
        'Skipping due tasks check - another instance is processing'
      );
      return;
    }

    this.logger.debug('Checking for due tasks...');

    try {
      const dueTasks = await this.scheduledTasksService.getDueTasks();

      if (dueTasks.length > 0) {
        this.logger.log(`Found ${dueTasks.length} due tasks`);

        for (const task of dueTasks) {
          await this.executeTask(task);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error checking due tasks: ${err.message}`, err.stack);
    } finally {
      // Release lock
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * System cron job - Cleanup old execution records (daily at 2 AM)
   */
  @Cron('0 2 * * *', {
    name: 'cleanup-executions',
  })
  async cleanupOldExecutions() {
    // Acquire distributed lock
    const lockKey = 'scheduler:cleanup-executions';
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: 600000, // 10 minutes
      retryCount: 0,
    });

    if (!lockResult.acquired) {
      this.logger.debug('Skipping cleanup - another instance is running');
      return;
    }

    try {
      this.logger.log('Running cleanup of old execution records...');
      // TODO: Implement cleanup logic - delete executions older than 30 days
      // This would be added to ScheduledTasksService
    } finally {
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * System cron job - Health check (every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'health-check',
  })
  async performHealthCheck() {
    this.logger.debug('Performing health check...');

    const stats = {
      activeCronJobs: this.activeCronJobs.size,
      systemJobs: this.schedulerRegistry.getCronJobs().size,
      timestamp: new Date().toISOString(),
    };

    this.logger.debug(`Health check: ${JSON.stringify(stats)}`);
  }

  /**
   * Execute a scheduled task with distributed locking
   */
  async executeTask(task: ScheduledTask): Promise<void> {
    // Acquire distributed lock for this specific task
    const lockKey = `scheduler:task:${task.id}`;
    const lockTtl = Math.max(task.timeout_seconds * 1000 + 10000, 60000); // Task timeout + 10s buffer, min 60s

    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: lockTtl,
      retryCount: 0, // Don't retry - if task is already executing, skip
      extendThreshold: Math.min(lockTtl / 3, 20000), // Auto-extend when 1/3 of TTL remains
    });

    if (!lockResult.acquired) {
      this.logger.debug(
        `Skipping task ${task.id} - already executing in another instance`
      );
      return;
    }

    this.logger.log(`Executing task: ${task.id} (${task.name})`);

    try {
      // Create execution record
      const execution = await this.scheduledTasksService.createExecution({
        task_id: task.id,
        status: ExecutionStatus.RUNNING,
      });

      const startTime = Date.now();

      try {
        // Dispatch to appropriate service based on task type
        let result: any;

        switch (task.task_type) {
          case TaskType.WORKFLOW:
            result = await this.workflowDispatcher.dispatch(task);
            break;
          case TaskType.REPORT:
            result = await this.reportDispatcher.dispatch(task);
            break;
          case TaskType.AGENT:
            result = await this.agentDispatcher.dispatch(task);
            break;
          case TaskType.CUSTOM:
            result = await this.customDispatcher.dispatch(task);
            break;
          default:
            throw new Error(`Unknown task type: ${task.task_type}`);
        }

        // Update execution as successful
        await this.scheduledTasksService.updateExecution(execution.id, {
          status: ExecutionStatus.SUCCESS,
          result,
        });

        // Update task
        await this.scheduledTasksService.updateAfterExecution(task.id, true);

        const duration = Date.now() - startTime;
        this.logger.log(
          `Task ${task.id} executed successfully in ${duration}ms`,
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        const err = error instanceof Error ? error : new Error(String(error));

        // Check if timeout
        const isTimeout = duration > task.timeout_seconds * 1000;
        const status = isTimeout
          ? ExecutionStatus.TIMEOUT
          : ExecutionStatus.FAILED;

        // Update execution as failed
        await this.scheduledTasksService.updateExecution(execution.id, {
          status,
          error_message: err.message,
          error_details: {
            stack: err.stack,
            duration,
          },
        });

        // Update task
        await this.scheduledTasksService.updateAfterExecution(
          task.id,
          false,
          err.message,
        );

        this.logger.error(
          `Task ${task.id} execution failed: ${err.message}`,
          err.stack,
        );
      }
    } finally {
      // Release lock
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * Manually trigger a task execution
   */
  async triggerTask(taskId: string): Promise<void> {
    this.logger.log(`Manually triggering task: ${taskId}`);

    const task = await this.scheduledTasksService.findOne(taskId);
    await this.executeTask(task);
  }

  /**
   * Register a dynamic cron job from database
   */
  async registerDynamicCron(task: ScheduledTask): Promise<void> {
    if (!task.enabled) {
      this.logger.debug(`Task ${task.id} is disabled, skipping registration`);
      return;
    }

    // Remove existing job if any
    if (this.activeCronJobs.has(task.id)) {
      this.unregisterDynamicCron(task.id);
    }

    try {
      const job = new CronJob(task.cron_expression, async () => {
        await this.executeTask(task);
      });

      this.activeCronJobs.set(task.id, job);
      this.schedulerRegistry.addCronJob(task.id, job);
      job.start();

      this.logger.log(
        `Registered dynamic cron job: ${task.id} (${task.cron_expression})`,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to register cron job for task ${task.id}: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Unregister a dynamic cron job
   */
  unregisterDynamicCron(taskId: string): void {
    if (this.activeCronJobs.has(taskId)) {
      const job = this.activeCronJobs.get(taskId);
      if (job) {
        job.stop();
      }
      this.activeCronJobs.delete(taskId);

      try {
        this.schedulerRegistry.deleteCronJob(taskId);
      } catch (error) {
        // Job might not be in scheduler registry
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.debug(
          `Could not delete cron job ${taskId} from registry: ${err.message}`,
        );
      }

      this.logger.log(`Unregistered dynamic cron job: ${taskId}`);
    }
  }

  /**
   * Load all active tasks from database and register them
   */
  async loadActiveTasks(): Promise<void> {
    this.logger.log('Loading active tasks from database...');

    const tasks = await this.scheduledTasksService.findAll({ enabled: true });

    this.logger.log(`Found ${tasks.length} active tasks`);

    for (const task of tasks) {
      await this.registerDynamicCron(task);
    }
  }

  /**
   * Reload a specific task
   */
  async reloadTask(taskId: string): Promise<void> {
    const task = await this.scheduledTasksService.findOne(taskId);
    await this.registerDynamicCron(task);
  }

  /**
   * Get active cron jobs info
   */
  getActiveCronJobs(): Array<{ id: string; name: string }> {
    const jobs: Array<{ id: string; name: string; type?: string }> = [];

    // System jobs
    const cronJobs = this.schedulerRegistry.getCronJobs();
    cronJobs.forEach((job, name) => {
      jobs.push({ id: name, name, type: 'system' });
    });

    return jobs;
  }

  /**
   * Get dynamic cron jobs count
   */
  getDynamicCronJobsCount(): number {
    return this.activeCronJobs.size;
  }
}
