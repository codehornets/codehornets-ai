import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsUUID,
} from 'class-validator';
import { AnalyticEventType } from '../entities/campaign-analytics.entity';

export class CreateAnalyticEventDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaign_id: string;

  @ApiProperty({ enum: AnalyticEventType, description: 'Event type' })
  @IsEnum(AnalyticEventType)
  event_type: AnalyticEventType;

  @ApiPropertyOptional({ description: 'Event metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Related entity ID (lead, task, agent)' })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional({ description: 'Entity type (lead, task, agent)' })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Workspace ID' })
  @IsOptional()
  @IsString()
  workspace_id?: string;

  @ApiPropertyOptional({ description: 'Event timestamp' })
  @IsOptional()
  @IsDateString()
  event_timestamp?: string;
}

export class CampaignAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsOptional()
  @IsUUID()
  campaign_id?: string;

  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Workspace ID' })
  @IsOptional()
  @IsString()
  workspace_id?: string;

  @ApiPropertyOptional({ enum: AnalyticEventType, description: 'Filter by event type' })
  @IsOptional()
  @IsEnum(AnalyticEventType)
  event_type?: AnalyticEventType;
}

export class CampaignPerformanceDto {
  @ApiProperty()
  campaign_id: string;

  @ApiProperty()
  campaign_name: string;

  @ApiProperty({ description: 'Total leads generated' })
  total_leads: number;

  @ApiProperty({ description: 'Converted leads count' })
  converted_leads: number;

  @ApiProperty({ description: 'Conversion rate percentage' })
  conversion_rate: number;

  @ApiProperty({ description: 'Total emails sent' })
  emails_sent: number;

  @ApiProperty({ description: 'Email open count' })
  emails_opened: number;

  @ApiProperty({ description: 'Email open rate percentage' })
  open_rate: number;

  @ApiProperty({ description: 'Email click count' })
  emails_clicked: number;

  @ApiProperty({ description: 'Click-through rate percentage' })
  click_rate: number;

  @ApiProperty({ description: 'Total tasks completed' })
  tasks_completed: number;

  @ApiProperty({ description: 'Agent executions' })
  agent_executions: number;

  @ApiProperty({ type: Object, description: 'Agent performance breakdown' })
  agent_performance?: Record<string, any>;

  @ApiProperty({ type: Object, description: 'Daily performance metrics' })
  daily_metrics?: Array<{
    date: string;
    leads: number;
    conversions: number;
    emails_sent: number;
    emails_opened: number;
  }>;
}
