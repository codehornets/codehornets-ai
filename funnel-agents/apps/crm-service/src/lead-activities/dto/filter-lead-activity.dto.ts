import { IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';

export class FilterLeadActivityDto {
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @IsOptional()
  @IsEnum(['call', 'email', 'meeting', 'note', 'ai_action', 'status_change'])
  type?: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
