import { IsUUID, IsEnum, IsOptional, IsObject, IsString } from 'class-validator';
import { ExecutionStatus } from '../entities/task-execution.entity';

export class CreateTaskExecutionDto {
  @IsUUID()
  task_id: string;

  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTaskExecutionDto {
  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;

  @IsString()
  @IsOptional()
  error_message?: string;

  @IsObject()
  @IsOptional()
  error_details?: Record<string, any>;

  @IsObject()
  @IsOptional()
  result?: Record<string, any>;
}

export class TaskExecutionFilterDto {
  @IsUUID()
  @IsOptional()
  task_id?: string;

  @IsEnum(ExecutionStatus)
  @IsOptional()
  status?: ExecutionStatus;
}
