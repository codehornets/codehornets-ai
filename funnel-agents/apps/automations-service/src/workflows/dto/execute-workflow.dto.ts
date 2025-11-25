import { IsOptional, IsObject } from 'class-validator';

export class ExecuteWorkflowDto {
  @IsOptional()
  @IsObject()
  trigger_data?: Record<string, any>;
}
