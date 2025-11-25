import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { TaskType } from '../entities/scheduled-task.entity';

export class CreateScheduledTaskDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'Invalid cron expression format (must be: minute hour day month weekday)',
    },
  )
  cron_expression: string;

  @IsEnum(TaskType)
  task_type: TaskType;

  @IsString()
  @IsOptional()
  target_id?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsString()
  @IsOptional()
  created_by?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  max_retries?: number;

  @IsNumber()
  @Min(10)
  @Max(3600)
  @IsOptional()
  timeout_seconds?: number;
}
