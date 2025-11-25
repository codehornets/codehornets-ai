import { Repository } from 'typeorm';
import { ScheduledTask, TaskType, TaskStatus } from './entities/scheduled-task.entity';
import { TaskExecution } from './entities/task-execution.entity';
import { CreateScheduledTaskDto } from './dto/create-scheduled-task.dto';
import { UpdateScheduledTaskDto } from './dto/update-scheduled-task.dto';
import { CreateTaskExecutionDto, UpdateTaskExecutionDto, TaskExecutionFilterDto } from './dto/task-execution.dto';
export declare class ScheduledTasksService {
    private readonly scheduledTaskRepository;
    private readonly taskExecutionRepository;
    private readonly logger;
    constructor(scheduledTaskRepository: Repository<ScheduledTask>, taskExecutionRepository: Repository<TaskExecution>);
    /**
     * Create a new scheduled task
     */
    create(createDto: CreateScheduledTaskDto): Promise<ScheduledTask>;
    /**
     * Find all scheduled tasks
     */
    findAll(filters?: {
        enabled?: boolean;
        task_type?: TaskType;
        status?: TaskStatus;
    }): Promise<ScheduledTask[]>;
    /**
     * Find a single scheduled task by ID
     */
    findOne(id: string): Promise<ScheduledTask>;
    /**
     * Update a scheduled task
     */
    update(id: string, updateDto: UpdateScheduledTaskDto): Promise<ScheduledTask>;
    /**
     * Delete a scheduled task
     */
    remove(id: string): Promise<void>;
    /**
     * Enable a scheduled task
     */
    enable(id: string): Promise<ScheduledTask>;
    /**
     * Disable a scheduled task
     */
    disable(id: string): Promise<ScheduledTask>;
    /**
     * Get upcoming scheduled tasks
     */
    getNextRuns(limit?: number): Promise<ScheduledTask[]>;
    /**
     * Get tasks that are due to run
     */
    getDueTasks(): Promise<ScheduledTask[]>;
    /**
     * Update task after execution
     */
    updateAfterExecution(id: string, success: boolean, error?: string): Promise<ScheduledTask>;
    /**
     * Create task execution record
     */
    createExecution(dto: CreateTaskExecutionDto): Promise<TaskExecution>;
    /**
     * Update task execution
     */
    updateExecution(id: string, dto: UpdateTaskExecutionDto): Promise<TaskExecution>;
    /**
     * Get task executions
     */
    getExecutions(filters?: TaskExecutionFilterDto, limit?: number): Promise<TaskExecution[]>;
    /**
     * Get recent executions for a task
     */
    getTaskExecutions(taskId: string, limit?: number): Promise<TaskExecution[]>;
    /**
     * Get execution statistics
     */
    getExecutionStats(taskId?: string): Promise<{
        total: number;
        success: number;
        failed: number;
        running: number;
        avgDuration: number;
    }>;
    /**
     * Validate cron expression
     */
    private validateCronExpression;
    /**
     * Calculate next run time from cron expression
     */
    private calculateNextRun;
}
