import { IsOptional, IsDateString, IsUUID, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsUUID()
  workspace_id?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsUUID()
  agent_id?: string;
}
