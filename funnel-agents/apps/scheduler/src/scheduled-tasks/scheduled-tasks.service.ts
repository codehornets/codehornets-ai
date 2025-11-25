import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { CronExpression, parseExpression } from 'cron-parser';
import {
  ScheduledTask,
  TaskType,
  TaskStatus,
} from './entities/scheduled-task.entity';
import {
  TaskExecution,
  ExecutionStatus,
} from './entities/task-execution.entity';
import { CreateScheduledTaskDto } from './dto/create-scheduled-task.dto';
import { UpdateScheduledTaskDto } from './dto/update-scheduled-task.dto';
import {
  CreateTaskExecutionDto,
  UpdateTaskExecutionDto,
  TaskExecutionFilterDto,
} from './dto/task-execution.dto';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectRepository(ScheduledTask)
    private readonly scheduledTaskRepository: Repository<ScheduledTask>,
    @InjectRepository(TaskExecution)
    private readonly taskExecutionRepository: Repository<TaskExecution>,
  ) {}

  /**
   * Create a new scheduled task
   */
  async create(createDto: CreateScheduledTaskDto): Promise<ScheduledTask> {
    this.logger.log(`Creating scheduled task: ${createDto.name}`);

    // Validate cron expression
    this.validateCronExpression(createDto.cron_expression);

    // Calculate next run time
    const nextRunAt = this.calculateNextRun(createDto.cron_expression);

    const task = this.scheduledTaskRepository.create({
      ...createDto,
      enabled: createDto.enabled ?? true,
      status: TaskStatus.ACTIVE,
      next_run_at: nextRunAt,
      run_count: 0,
      failure_count: 0,
    });

    const savedTask = await this.scheduledTaskRepository.save(task);
    this.logger.log(`Created scheduled task: ${savedTask.id}`);

    return savedTask;
  }

  /**
   * Find all scheduled tasks
   */
  async findAll(filters?: {
    enabled?: boolean;
    task_type?: TaskType;
    status?: TaskStatus;
  }): Promise<ScheduledTask[]> {
    const query = this.scheduledTaskRepository.createQueryBuilder('task');

    if (filters?.enabled !== undefined) {
      query.andWhere('task.enabled = :enabled', { enabled: filters.enabled });
    }

    if (filters?.task_type) {
      query.andWhere('task.task_type = :task_type', {
        task_type: filters.task_type,
      });
    }

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    query.orderBy('task.created_at', 'DESC');

    return query.getMany();
  }

  /**
   * Find a single scheduled task by ID
   */
  async findOne(id: string): Promise<ScheduledTask> {
    const task = await this.scheduledTaskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Scheduled task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Update a scheduled task
   */
  async update(
    id: string,
    updateDto: UpdateScheduledTaskDto,
  ): Promise<ScheduledTask> {
    this.logger.log(`Updating scheduled task: ${id}`);

    const task = await this.findOne(id);

    // Validate cron expression if it's being updated
    if (updateDto.cron_expression) {
      this.validateCronExpression(updateDto.cron_expression);
      (updateDto as any)['next_run_at'] = this.calculateNextRun(
        updateDto.cron_expression,
      );
    }

    Object.assign(task, updateDto);
    const updatedTask = await this.scheduledTaskRepository.save(task);

    this.logger.log(`Updated scheduled task: ${id}`);
    return updatedTask;
  }

  /**
   * Delete a scheduled task
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting scheduled task: ${id}`);

    const task = await this.findOne(id);
    await this.scheduledTaskRepository.remove(task);

    this.logger.log(`Deleted scheduled task: ${id}`);
  }

  /**
   * Enable a scheduled task
   */
  async enable(id: string): Promise<ScheduledTask> {
    this.logger.log(`Enabling scheduled task: ${id}`);

    const task = await this.findOne(id);
    task.enabled = true;
    task.status = TaskStatus.ACTIVE;
    task.next_run_at = this.calculateNextRun(task.cron_expression);

    const updatedTask = await this.scheduledTaskRepository.save(task);
    this.logger.log(`Enabled scheduled task: ${id}`);

    return updatedTask;
  }

  /**
   * Disable a scheduled task
   */
  async disable(id: string): Promise<ScheduledTask> {
    this.logger.log(`Disabling scheduled task: ${id}`);

    const task = await this.findOne(id);
    task.enabled = false;
    task.status = TaskStatus.PAUSED;

    const updatedTask = await this.scheduledTaskRepository.save(task);
    this.logger.log(`Disabled scheduled task: ${id}`);

    return updatedTask;
  }

  /**
   * Get upcoming scheduled tasks
   */
  async getNextRuns(limit = 10): Promise<ScheduledTask[]> {
    return this.scheduledTaskRepository.find({
      where: {
        enabled: true,
        next_run_at: MoreThan(new Date()),
      },
      order: {
        next_run_at: 'ASC',
      },
      take: limit,
    });
  }

  /**
   * Get tasks that are due to run
   */
  async getDueTasks(): Promise<ScheduledTask[]> {
    return this.scheduledTaskRepository.find({
      where: {
        enabled: true,
        next_run_at: LessThan(new Date()),
      },
      order: {
        next_run_at: 'ASC',
      },
    });
  }

  /**
   * Update task after execution
   */
  async updateAfterExecution(
    id: string,
    success: boolean,
    error?: string,
  ): Promise<ScheduledTask> {
    const task = await this.findOne(id);

    task.last_run_at = new Date();
    task.run_count += 1;

    if (success) {
      task.failure_count = 0;
      task.status = TaskStatus.ACTIVE;
      task.last_error = undefined;
    } else {
      task.failure_count += 1;
      task.last_error = error;

      // Disable task if it exceeds max retries
      if (task.failure_count >= task.max_retries) {
        task.enabled = false;
        task.status = TaskStatus.FAILED;
        this.logger.warn(
          `Task ${task.id} disabled after ${task.failure_count} failures`,
        );
      }
    }

    // Calculate next run time if still enabled
    if (task.enabled) {
      task.next_run_at = this.calculateNextRun(task.cron_expression);
    }

    return this.scheduledTaskRepository.save(task);
  }

  /**
   * Create task execution record
   */
  async createExecution(
    dto: CreateTaskExecutionDto,
  ): Promise<TaskExecution> {
    const execution = this.taskExecutionRepository.create({
      ...dto,
      status: dto.status ?? ExecutionStatus.PENDING,
      started_at: new Date(),
    });

    return this.taskExecutionRepository.save(execution);
  }

  /**
   * Update task execution
   */
  async updateExecution(
    id: string,
    dto: UpdateTaskExecutionDto,
  ): Promise<TaskExecution> {
    const execution = await this.taskExecutionRepository.findOne({
      where: { id },
    });

    if (!execution) {
      throw new NotFoundException(`Task execution with ID ${id} not found`);
    }

    if (dto.status) {
      execution.status = dto.status;

      if (
        dto.status === ExecutionStatus.SUCCESS ||
        dto.status === ExecutionStatus.FAILED ||
        dto.status === ExecutionStatus.TIMEOUT
      ) {
        execution.completed_at = new Date();
        execution.duration_ms =
          execution.completed_at.getTime() - execution.started_at.getTime();
      }
    }

    if (dto.error_message) {
      execution.error_message = dto.error_message;
    }

    if (dto.error_details) {
      execution.error_details = dto.error_details;
    }

    if (dto.result) {
      execution.result = dto.result;
    }

    return this.taskExecutionRepository.save(execution);
  }

  /**
   * Get task executions
   */
  async getExecutions(
    filters?: TaskExecutionFilterDto,
    limit = 50,
  ): Promise<TaskExecution[]> {
    const query = this.taskExecutionRepository.createQueryBuilder('execution');

    if (filters?.task_id) {
      query.andWhere('execution.task_id = :task_id', {
        task_id: filters.task_id,
      });
    }

    if (filters?.status) {
      query.andWhere('execution.status = :status', { status: filters.status });
    }

    query.orderBy('execution.created_at', 'DESC').take(limit);

    return query.getMany();
  }

  /**
   * Get recent executions for a task
   */
  async getTaskExecutions(
    taskId: string,
    limit = 20,
  ): Promise<TaskExecution[]> {
    return this.taskExecutionRepository.find({
      where: { task_id: taskId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(taskId?: string): Promise<{
    total: number;
    success: number;
    failed: number;
    running: number;
    avgDuration: number;
  }> {
    const query = this.taskExecutionRepository.createQueryBuilder('execution');

    if (taskId) {
      query.where('execution.task_id = :task_id', { task_id: taskId });
    }

    const executions = await query.getMany();

    const stats = {
      total: executions.length,
      success: executions.filter((e) => e.status === ExecutionStatus.SUCCESS)
        .length,
      failed: executions.filter((e) => e.status === ExecutionStatus.FAILED)
        .length,
      running: executions.filter((e) => e.status === ExecutionStatus.RUNNING)
        .length,
      avgDuration: 0,
    };

    const completedExecutions = executions.filter((e) => e.duration_ms !== null);
    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce(
        (sum, e) => sum + (e.duration_ms || 0),
        0,
      );
      stats.avgDuration = Math.round(totalDuration / completedExecutions.length);
    }

    return stats;
  }

  /**
   * Validate cron expression
   */
  private validateCronExpression(cronExpression: string): void {
    try {
      parseExpression(cronExpression);
    } catch (error) {
      throw new BadRequestException(
        `Invalid cron expression: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  private calculateNextRun(cronExpression: string): Date {
    try {
      const interval = parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error calculating next run: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to calculate next run: ${errorMessage}`,
      );
    }
  }
}
