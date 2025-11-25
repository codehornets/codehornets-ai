import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { WorkflowRunStatus } from '../entities/workflow-run.entity';

export class CreateWorkflowRunDto {
  @IsString()
  workflow_id!: string;

  @IsOptional()
  @IsEnum(['pending', 'running', 'completed', 'failed', 'cancelled'])
  status?: WorkflowRunStatus;

  @IsString()
  trigger_type!: string;

  @IsOptional()
  @IsObject()
  trigger_data?: Record<string, any>;
}
