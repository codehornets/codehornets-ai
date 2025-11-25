import { IsString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateLeadActivityDto {
  @IsUUID()
  lead_id: string;

  @IsEnum(['call', 'email', 'meeting', 'note', 'ai_action', 'status_change'])
  type: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
