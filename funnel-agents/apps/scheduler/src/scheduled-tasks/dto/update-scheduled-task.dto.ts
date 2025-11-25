import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduledTaskDto } from './create-scheduled-task.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../entities/scheduled-task.entity';

export class UpdateScheduledTaskDto extends PartialType(CreateScheduledTaskDto) {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
