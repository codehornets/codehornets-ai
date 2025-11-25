import { IsString, IsEnum, IsOptional, IsObject, IsDate, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TaskType, TaskPriority, TaskStatus } from '@funnelagents/domain';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Generate marketing email' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskType, description: 'Task type' })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({ enum: TaskPriority, description: 'Task priority', default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ description: 'Agent ID to execute the task' })
  @IsUUID()
  agentId: string;

  @ApiPropertyOptional({ description: 'Task input data', type: 'object' })
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Task metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: {
    workspaceId?: string;
    campaignId?: string;
    clientId?: string;
    tags?: string[];
    source?: string;
  };

  @ApiPropertyOptional({ description: 'Task configuration', type: 'object' })
  @IsObject()
  @IsOptional()
  config?: {
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier?: number;
    };
    requiresApproval?: boolean;
    notifyOnCompletion?: boolean;
    notificationChannels?: string[];
  };

  @ApiPropertyOptional({ description: 'Scheduled execution time' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledFor?: Date;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Task priority' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Reassign to different agent' })
  @IsUUID()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Update task input data', type: 'object' })
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Update task metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: {
    workspaceId?: string;
    campaignId?: string;
    clientId?: string;
    tags?: string[];
  };

  @ApiPropertyOptional({ description: 'Update task configuration', type: 'object' })
  @IsObject()
  @IsOptional()
  config?: {
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      retryDelay: number;
      backoffMultiplier?: number;
    };
    requiresApproval?: boolean;
    notifyOnCompletion?: boolean;
  };

  @ApiPropertyOptional({ description: 'Reschedule execution time' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledFor?: Date;
}

export class ExecuteTaskDto {
  @ApiPropertyOptional({ description: 'Override agent ID for execution' })
  @IsUUID()
  @IsOptional()
  agentId?: string;
}

export class CompleteTaskDto {
  @ApiProperty({ description: 'Task output data', type: 'object' })
  @IsObject()
  outputData: Record<string, any>;
}

export class FailTaskDto {
  @ApiProperty({ description: 'Error message or reason for failure' })
  @IsString()
  error: string;
}

export class CancelTaskDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'User or agent who cancelled the task' })
  @IsString()
  @IsOptional()
  cancelledBy?: string;
}

export class TaskQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by priority' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskType, description: 'Filter by type' })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ description: 'Filter by agent ID' })
  @IsUUID()
  @IsOptional()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by campaign ID' })
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Filter by client ID' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
