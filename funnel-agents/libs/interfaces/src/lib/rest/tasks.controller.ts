import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from '@funnelagents/application';
import { BaseController } from './base.controller';
import {
  CreateTaskDto,
  UpdateTaskDto,
  ExecuteTaskDto,
  CompleteTaskDto,
  FailTaskDto,
  CancelTaskDto,
  TaskQueryDto,
} from '../dto/task.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController extends BaseController<any, CreateTaskDto, UpdateTaskDto> {
  protected readonly service: any;

  constructor(private readonly tasksService: TasksService) {
    super();
    this.service = tasksService;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(@Body(ValidationPipe) dto: CreateTaskDto) {
    const result = await this.tasksService.createTask({
      title: dto.title,
      type: dto.type,
      priority: dto.priority,
      agentId: dto.agentId,
      description: dto.description,
      inputData: dto.inputData,
      metadata: dto.metadata,
      config: dto.config,
      scheduledFor: dto.scheduledFor,
    });

    return this.success(result);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks with filters' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async findAll(@Query(ValidationPipe) query: TaskQueryDto) {
    const result = await this.tasksService.listTasks(query);
    return this.paginated(result.data, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.getTask(id);
    return this.success(task);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateTaskDto
  ) {
    const result = await this.tasksService.updateTask(id, {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      agentId: dto.agentId,
      inputData: dto.inputData,
      metadata: dto.metadata,
      config: dto.config,
      scheduledFor: dto.scheduledFor,
    });

    return this.success(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string) {
    await this.tasksService.deleteTask(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute task' })
  @ApiResponse({ status: 200, description: 'Task execution started' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Task cannot be executed in current state' })
  async execute(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: ExecuteTaskDto
  ) {
    const result = await this.tasksService.executeTask(id, dto.agentId);
    return this.success(result);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Task cannot be completed in current state' })
  async complete(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CompleteTaskDto
  ) {
    await this.tasksService.completeTask(id, dto.outputData);
    return this.success({ message: 'Task completed successfully' });
  }

  @Post(':id/fail')
  @ApiOperation({ summary: 'Mark task as failed' })
  @ApiResponse({ status: 200, description: 'Task marked as failed' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async fail(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: FailTaskDto
  ) {
    await this.tasksService.failTask(id, dto.error);
    return this.success({ message: 'Task marked as failed' });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel task' })
  @ApiResponse({ status: 200, description: 'Task cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Task cannot be cancelled in current state' })
  async cancel(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: CancelTaskDto
  ) {
    await this.tasksService.cancelTask(id, dto.reason, dto.cancelledBy);
    return this.success({ message: 'Task cancelled successfully' });
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed task' })
  @ApiResponse({ status: 200, description: 'Task queued for retry' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Task cannot be retried' })
  async retry(@Param('id') id: string) {
    await this.tasksService.retryTask(id);
    return this.success({ message: 'Task queued for retry' });
  }
}
