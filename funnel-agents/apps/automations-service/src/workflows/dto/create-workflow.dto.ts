import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { WorkflowStatus, TriggerType, WorkflowNode, WorkflowEdge } from '../entities/workflow.entity';

export class CreateWorkflowDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'paused', 'archived'])
  status?: WorkflowStatus;

  @IsEnum(['manual', 'webhook', 'event', 'scheduled'])
  trigger_type!: TriggerType;

  @IsOptional()
  @IsObject()
  trigger_config?: Record<string, any>;

  @IsOptional()
  @IsArray()
  nodes?: WorkflowNode[];

  @IsOptional()
  @IsArray()
  edges?: WorkflowEdge[];

  @IsOptional()
  @IsString()
  workspace_id?: string;
}
