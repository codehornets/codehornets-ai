import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ContentChannel } from '../entities/content.entity';
import { AnalyticsEventType } from '../entities/content-analytics.entity';

export class TrackAnalyticsDto {
  @IsUUID()
  content_id: string;

  @IsEnum(AnalyticsEventType)
  event_type: AnalyticsEventType;

  @IsOptional()
  @IsEnum(ContentChannel)
  channel?: ContentChannel;

  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class QueryAnalyticsDto {
  @IsOptional()
  @IsUUID()
  content_id?: string;

  @IsOptional()
  @IsEnum(AnalyticsEventType)
  event_type?: AnalyticsEventType;

  @IsOptional()
  @IsEnum(ContentChannel)
  channel?: ContentChannel;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class ContentPerformanceDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(ContentChannel)
  channel?: ContentChannel;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
