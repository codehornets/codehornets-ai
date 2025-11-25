import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduledTasksService } from '../scheduled-tasks/scheduled-tasks.service';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { WorkflowDispatcherService } from '../dispatchers/workflow-dispatcher.service';
import { ReportDispatcherService } from '../dispatchers/report-dispatcher.service';
import { AgentDispatcherService } from '../dispatchers/agent-dispatcher.service';
import { CustomDispatcherService } from '../dispatchers/custom-dispatcher.service';
import { DistributedLockService } from '@funnelagents/infrastructure';
export declare class CronJobsService implements OnModuleInit {
    private readonly schedulerRegistry;
    private readonly scheduledTasksService;
    private readonly workflowDispatcher;
    private readonly reportDispatcher;
    private readonly agentDispatcher;
    private readonly customDispatcher;
    private readonly lockService;
    private readonly logger;
    private readonly activeCronJobs;
    constructor(schedulerRegistry: SchedulerRegistry, scheduledTasksService: ScheduledTasksService, workflowDispatcher: WorkflowDispatcherService, reportDispatcher: ReportDispatcherService, agentDispatcher: AgentDispatcherService, customDispatcher: CustomDispatcherService, lockService: DistributedLockService);
    /**
     * Initialize module - load all enabled tasks
     */
    onModuleInit(): Promise<void>;
    /**
     * System cron job - Check for due tasks every minute
     */
    checkDueTasks(): Promise<void>;
    /**
     * System cron job - Cleanup old execution records (daily at 2 AM)
     */
    cleanupOldExecutions(): Promise<void>;
    /**
     * System cron job - Health check (every 5 minutes)
     */
    performHealthCheck(): Promise<void>;
    /**
     * Execute a scheduled task with distributed locking
     */
    executeTask(task: ScheduledTask): Promise<void>;
    /**
     * Manually trigger a task execution
     */
    triggerTask(taskId: string): Promise<void>;
    /**
     * Register a dynamic cron job from database
     */
    registerDynamicCron(task: ScheduledTask): Promise<void>;
    /**
     * Unregister a dynamic cron job
     */
    unregisterDynamicCron(taskId: string): void;
    /**
     * Load all active tasks from database and register them
     */
    loadActiveTasks(): Promise<void>;
    /**
     * Reload a specific task
     */
    reloadTask(taskId: string): Promise<void>;
    /**
     * Get active cron jobs info
     */
    getActiveCronJobs(): Array<{
        id: string;
        name: string;
    }>;
    /**
     * Get dynamic cron jobs count
     */
    getDynamicCronJobsCount(): number;
}
