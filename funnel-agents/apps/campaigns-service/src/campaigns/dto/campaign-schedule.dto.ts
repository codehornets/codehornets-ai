import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import {
  RecurrenceType,
  ScheduleStatus,
} from '../entities/campaign-schedule.entity';

export class CreateCampaignScheduleDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaign_id: string;

  @ApiProperty({ description: 'Schedule start date' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'Schedule end date' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    enum: RecurrenceType,
    default: RecurrenceType.NONE,
    description: 'Recurrence pattern',
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrence?: RecurrenceType;

  @ApiPropertyOptional({ description: 'Cron expression for custom recurrence' })
  @IsOptional()
  @IsString()
  cron_expression?: string;

  @ApiPropertyOptional({ description: 'Recurrence configuration', type: Object })
  @IsOptional()
  @IsObject()
  recurrence_config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Maximum run count (null = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_runs?: number;

  @ApiPropertyOptional({ description: 'Timezone', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateCampaignScheduleDto extends PartialType(CreateCampaignScheduleDto) {
  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'Schedule status' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}

export class CampaignScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  campaign_id: string;

  @ApiProperty()
  start_date: Date;

  @ApiPropertyOptional()
  end_date?: Date;

  @ApiProperty({ enum: RecurrenceType })
  recurrence: RecurrenceType;

  @ApiPropertyOptional()
  cron_expression?: string;

  @ApiPropertyOptional({ type: Object })
  recurrence_config?: Record<string, any>;

  @ApiProperty({ enum: ScheduleStatus })
  status: ScheduleStatus;

  @ApiPropertyOptional()
  next_run_at?: Date;

  @ApiPropertyOptional()
  last_run_at?: Date;

  @ApiProperty()
  run_count: number;

  @ApiPropertyOptional()
  max_runs?: number;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
