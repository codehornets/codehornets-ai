import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ScheduledTasksService } from './scheduled-tasks/scheduled-tasks.service';
import { CronJobsService } from './cron-jobs/cron-jobs.service';
import { CreateScheduledTaskDto } from './scheduled-tasks/dto/create-scheduled-task.dto';
import { UpdateScheduledTaskDto } from './scheduled-tasks/dto/update-scheduled-task.dto';
import { TaskExecutionFilterDto } from './scheduled-tasks/dto/task-execution.dto';
import { TaskType, TaskStatus } from './scheduled-tasks/entities/scheduled-task.entity';

@Controller('scheduler')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);

  constructor(
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly cronJobsService: CronJobsService,
  ) {}

  /**
   * Create a new scheduled task
   */
  @Post('tasks')
  async createTask(@Body() createDto: CreateScheduledTaskDto) {
    this.logger.log(`Creating scheduled task: ${createDto.name}`);
    const task = await this.scheduledTasksService.create(createDto);

    // Register the cron job
    await this.cronJobsService.registerDynamicCron(task);

    return {
      success: true,
      data: task,
      message: 'Scheduled task created successfully',
    };
  }

  /**
   * Get all scheduled tasks
   */
  @Get('tasks')
  async getTasks(
    @Query('enabled') enabled?: string,
    @Query('task_type') taskType?: TaskType,
    @Query('status') status?: TaskStatus,
  ) {
    const filters: any = {};

    if (enabled !== undefined) {
      filters.enabled = enabled === 'true';
    }

    if (taskType) {
      filters.task_type = taskType;
    }

    if (status) {
      filters.status = status;
    }

    const tasks = await this.scheduledTasksService.findAll(filters);

    return {
      success: true,
      data: tasks,
      count: tasks.length,
    };
  }

  /**
   * Get a specific scheduled task
   */
  @Get('tasks/:id')
  async getTask(@Param('id', ParseUUIDPipe) id: string) {
    const task = await this.scheduledTasksService.findOne(id);

    return {
      success: true,
      data: task,
    };
  }

  /**
   * Update a scheduled task
   */
  @Put('tasks/:id')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateScheduledTaskDto,
  ) {
    this.logger.log(`Updating scheduled task: ${id}`);
    const task = await this.scheduledTasksService.update(id, updateDto);

    // Reload the cron job with new settings
    await this.cronJobsService.reloadTask(id);

    return {
      success: true,
      data: task,
      message: 'Scheduled task updated successfully',
    };
  }

  /**
   * Delete a scheduled task
   */
  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Deleting scheduled task: ${id}`);

    // Unregister the cron job first
    this.cronJobsService.unregisterDynamicCron(id);

    await this.scheduledTasksService.remove(id);
  }

  /**
   * Enable a scheduled task
   */
  @Post('tasks/:id/enable')
  async enableTask(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Enabling scheduled task: ${id}`);
    const task = await this.scheduledTasksService.enable(id);

    // Register the cron job
    await this.cronJobsService.registerDynamicCron(task);

    return {
      success: true,
      data: task,
      message: 'Scheduled task enabled successfully',
    };
  }

  /**
   * Disable a scheduled task
   */
  @Post('tasks/:id/disable')
  async disableTask(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Disabling scheduled task: ${id}`);
    const task = await this.scheduledTasksService.disable(id);

    // Unregister the cron job
    this.cronJobsService.unregisterDynamicCron(id);

    return {
      success: true,
      data: task,
      message: 'Scheduled task disabled successfully',
    };
  }

  /**
   * Manually trigger a scheduled task
   */
  @Post('tasks/:id/trigger')
  async triggerTask(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Manually triggering scheduled task: ${id}`);
    await this.cronJobsService.triggerTask(id);

    return {
      success: true,
      message: 'Task execution triggered successfully',
    };
  }

  /**
   * Get upcoming scheduled runs
   */
  @Get('next-runs')
  async getNextRuns(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const tasks = await this.scheduledTasksService.getNextRuns(parsedLimit);

    return {
      success: true,
      data: tasks,
      count: tasks.length,
    };
  }

  /**
   * Get task executions
   */
  @Get('executions')
  async getExecutions(
    @Query() filters: TaskExecutionFilterDto,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const executions = await this.scheduledTasksService.getExecutions(
      filters,
      parsedLimit,
    );

    return {
      success: true,
      data: executions,
      count: executions.length,
    };
  }

  /**
   * Get executions for a specific task
   */
  @Get('tasks/:id/executions')
  async getTaskExecutions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const executions = await this.scheduledTasksService.getTaskExecutions(
      id,
      parsedLimit,
    );

    return {
      success: true,
      data: executions,
      count: executions.length,
    };
  }

  /**
   * Get execution statistics
   */
  @Get('tasks/:id/stats')
  async getTaskStats(@Param('id', ParseUUIDPipe) id: string) {
    const stats = await this.scheduledTasksService.getExecutionStats(id);

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get overall execution statistics
   */
  @Get('stats')
  async getOverallStats() {
    const stats = await this.scheduledTasksService.getExecutionStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async health() {
    const tasks = await this.scheduledTasksService.findAll();
    const enabledTasks = tasks.filter((t) => t.enabled);
    const nextRuns = await this.scheduledTasksService.getNextRuns(5);
    const activeCronJobs = this.cronJobsService.getActiveCronJobs();
    const stats = await this.scheduledTasksService.getExecutionStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      scheduler: {
        total_tasks: tasks.length,
        enabled_tasks: enabledTasks.length,
        disabled_tasks: tasks.length - enabledTasks.length,
        active_cron_jobs: activeCronJobs.length,
        dynamic_cron_jobs: this.cronJobsService.getDynamicCronJobsCount(),
      },
      next_scheduled_runs: nextRuns.map((task) => ({
        id: task.id,
        name: task.name,
        next_run_at: task.next_run_at,
        task_type: task.task_type,
      })),
      execution_stats: stats,
    };
  }

  // ==================== Microservice Message Patterns ====================

  /**
   * Create scheduled task via microservice
   */
  @MessagePattern('scheduler.task.create')
  async handleCreateTask(@Payload() data: CreateScheduledTaskDto) {
    this.logger.log(`[MSG] Creating scheduled task: ${data.name}`);
    const task = await this.scheduledTasksService.create(data);
    await this.cronJobsService.registerDynamicCron(task);
    return { success: true, data: task };
  }

  /**
   * Update scheduled task via microservice
   */
  @MessagePattern('scheduler.task.update')
  async handleUpdateTask(
    @Payload() data: { id: string; updates: UpdateScheduledTaskDto },
  ) {
    this.logger.log(`[MSG] Updating scheduled task: ${data.id}`);
    const task = await this.scheduledTasksService.update(data.id, data.updates);
    await this.cronJobsService.reloadTask(data.id);
    return { success: true, data: task };
  }

  /**
   * Delete scheduled task via microservice
   */
  @MessagePattern('scheduler.task.delete')
  async handleDeleteTask(@Payload() data: { id: string }) {
    this.logger.log(`[MSG] Deleting scheduled task: ${data.id}`);
    this.cronJobsService.unregisterDynamicCron(data.id);
    await this.scheduledTasksService.remove(data.id);
    return { success: true };
  }

  /**
   * Trigger task execution via microservice
   */
  @MessagePattern('scheduler.task.trigger')
  async handleTriggerTask(@Payload() data: { id: string }) {
    this.logger.log(`[MSG] Triggering scheduled task: ${data.id}`);
    await this.cronJobsService.triggerTask(data.id);
    return { success: true };
  }

  /**
   * Get scheduled tasks via microservice
   */
  @MessagePattern('scheduler.tasks.list')
  async handleListTasks(@Payload() data: any) {
    this.logger.log('[MSG] Listing scheduled tasks');
    const tasks = await this.scheduledTasksService.findAll(data.filters);
    return { success: true, data: tasks, count: tasks.length };
  }

  /**
   * Get task details via microservice
   */
  @MessagePattern('scheduler.task.get')
  async handleGetTask(@Payload() data: { id: string }) {
    this.logger.log(`[MSG] Getting scheduled task: ${data.id}`);
    const task = await this.scheduledTasksService.findOne(data.id);
    return { success: true, data: task };
  }

  /**
   * Health check via microservice
   */
  @MessagePattern('scheduler.health.check')
  async handleHealthCheck() {
    return this.health();
  }
}
