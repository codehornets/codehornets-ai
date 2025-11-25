import { ScheduledTasksService } from './scheduled-tasks/scheduled-tasks.service';
import { CronJobsService } from './cron-jobs/cron-jobs.service';
import { CreateScheduledTaskDto } from './scheduled-tasks/dto/create-scheduled-task.dto';
import { UpdateScheduledTaskDto } from './scheduled-tasks/dto/update-scheduled-task.dto';
import { TaskExecutionFilterDto } from './scheduled-tasks/dto/task-execution.dto';
import { TaskType, TaskStatus } from './scheduled-tasks/entities/scheduled-task.entity';
export declare class SchedulerController {
    private readonly scheduledTasksService;
    private readonly cronJobsService;
    private readonly logger;
    constructor(scheduledTasksService: ScheduledTasksService, cronJobsService: CronJobsService);
    /**
     * Create a new scheduled task
     */
    createTask(createDto: CreateScheduledTaskDto): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
        message: string;
    }>;
    /**
     * Get all scheduled tasks
     */
    getTasks(enabled?: string, taskType?: TaskType, status?: TaskStatus): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask[];
        count: number;
    }>;
    /**
     * Get a specific scheduled task
     */
    getTask(id: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
    }>;
    /**
     * Update a scheduled task
     */
    updateTask(id: string, updateDto: UpdateScheduledTaskDto): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
        message: string;
    }>;
    /**
     * Delete a scheduled task
     */
    deleteTask(id: string): Promise<void>;
    /**
     * Enable a scheduled task
     */
    enableTask(id: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
        message: string;
    }>;
    /**
     * Disable a scheduled task
     */
    disableTask(id: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
        message: string;
    }>;
    /**
     * Manually trigger a scheduled task
     */
    triggerTask(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get upcoming scheduled runs
     */
    getNextRuns(limit?: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask[];
        count: number;
    }>;
    /**
     * Get task executions
     */
    getExecutions(filters: TaskExecutionFilterDto, limit?: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks").TaskExecution[];
        count: number;
    }>;
    /**
     * Get executions for a specific task
     */
    getTaskExecutions(id: string, limit?: string): Promise<{
        success: boolean;
        data: import("./scheduled-tasks").TaskExecution[];
        count: number;
    }>;
    /**
     * Get execution statistics
     */
    getTaskStats(id: string): Promise<{
        success: boolean;
        data: {
            total: number;
            success: number;
            failed: number;
            running: number;
            avgDuration: number;
        };
    }>;
    /**
     * Get overall execution statistics
     */
    getOverallStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            success: number;
            failed: number;
            running: number;
            avgDuration: number;
        };
    }>;
    /**
     * Health check endpoint
     */
    health(): Promise<{
        status: string;
        timestamp: string;
        scheduler: {
            total_tasks: number;
            enabled_tasks: number;
            disabled_tasks: number;
            active_cron_jobs: number;
            dynamic_cron_jobs: number;
        };
        next_scheduled_runs: {
            id: string;
            name: string;
            next_run_at: Date | undefined;
            task_type: TaskType;
        }[];
        execution_stats: {
            total: number;
            success: number;
            failed: number;
            running: number;
            avgDuration: number;
        };
    }>;
    /**
     * Create scheduled task via microservice
     */
    handleCreateTask(data: CreateScheduledTaskDto): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
    }>;
    /**
     * Update scheduled task via microservice
     */
    handleUpdateTask(data: {
        id: string;
        updates: UpdateScheduledTaskDto;
    }): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
    }>;
    /**
     * Delete scheduled task via microservice
     */
    handleDeleteTask(data: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Trigger task execution via microservice
     */
    handleTriggerTask(data: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Get scheduled tasks via microservice
     */
    handleListTasks(data: any): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask[];
        count: number;
    }>;
    /**
     * Get task details via microservice
     */
    handleGetTask(data: {
        id: string;
    }): Promise<{
        success: boolean;
        data: import("./scheduled-tasks/entities/scheduled-task.entity").ScheduledTask;
    }>;
    /**
     * Health check via microservice
     */
    handleHealthCheck(): Promise<{
        status: string;
        timestamp: string;
        scheduler: {
            total_tasks: number;
            enabled_tasks: number;
            disabled_tasks: number;
            active_cron_jobs: number;
            dynamic_cron_jobs: number;
        };
        next_scheduled_runs: {
            id: string;
            name: string;
            next_run_at: Date | undefined;
            task_type: TaskType;
        }[];
        execution_stats: {
            total: number;
            success: number;
            failed: number;
            running: number;
            avgDuration: number;
        };
    }>;
}
