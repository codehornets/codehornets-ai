import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ContentChannel } from '../entities/content.entity';
import { PublishStatus } from '../entities/content-publish.entity';

export class SchedulePublishDto {
  @IsUUID()
  content_id: string;

  @IsEnum(ContentChannel)
  channel: ContentChannel;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  channel_content?: string;

  @IsOptional()
  @IsObject()
  channel_metadata?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  published_by?: string;
}

export class UpdatePublishStatusDto {
  @IsEnum(PublishStatus)
  status: PublishStatus;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  @IsObject()
  channel_metadata?: Record<string, any>;
}

export class CancelPublishDto {
  @IsOptional()
  @IsString()
  cancellation_reason?: string;
}
