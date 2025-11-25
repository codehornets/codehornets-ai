import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ChannelType, ChannelStatus } from '../entities/campaign-channel.entity';

export class CreateCampaignChannelDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaign_id: string;

  @ApiProperty({ enum: ChannelType, description: 'Channel type' })
  @IsEnum(ChannelType)
  channel_type: ChannelType;

  @ApiPropertyOptional({ description: 'Channel description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Channel-specific configuration', type: Object })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scheduled start time' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}

export class UpdateCampaignChannelDto extends PartialType(CreateCampaignChannelDto) {
  @ApiPropertyOptional({ enum: ChannelStatus, description: 'Channel status' })
  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;
}

export class CampaignChannelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  campaign_id: string;

  @ApiProperty({ enum: ChannelType })
  channel_type: ChannelType;

  @ApiProperty({ enum: ChannelStatus })
  status: ChannelStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: Object })
  configuration?: Record<string, any>;

  @ApiProperty()
  send_count: number;

  @ApiProperty()
  success_count: number;

  @ApiProperty()
  failure_count: number;

  @ApiPropertyOptional()
  scheduled_at?: Date;

  @ApiPropertyOptional()
  started_at?: Date;

  @ApiPropertyOptional()
  completed_at?: Date;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class EmailChannelConfigDto {
  @ApiProperty({ description: 'Email template ID' })
  template_id: string;

  @ApiProperty({ description: 'Sender email address' })
  from_email: string;

  @ApiProperty({ description: 'Sender name' })
  from_name: string;

  @ApiProperty({ description: 'Email subject' })
  subject: string;

  @ApiPropertyOptional({ description: 'Reply-to email' })
  reply_to?: string;

  @ApiPropertyOptional({ description: 'CC emails', type: [String] })
  cc?: string[];

  @ApiPropertyOptional({ description: 'BCC emails', type: [String] })
  bcc?: string[];

  @ApiPropertyOptional({ description: 'Track opens', default: true })
  track_opens?: boolean;

  @ApiPropertyOptional({ description: 'Track clicks', default: true })
  track_clicks?: boolean;
}

export class SmsChannelConfigDto {
  @ApiProperty({ description: 'SMS provider' })
  provider: string;

  @ApiProperty({ description: 'Sender phone number' })
  from_number: string;

  @ApiProperty({ description: 'SMS message template' })
  message_template: string;

  @ApiPropertyOptional({ description: 'Character limit', default: 160 })
  character_limit?: number;
}

export class SocialMediaChannelConfigDto {
  @ApiProperty({ description: 'Platform (facebook, twitter, linkedin)' })
  platform: string;

  @ApiProperty({ description: 'Account ID' })
  account_id: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiPropertyOptional({ description: 'Media URLs', type: [String] })
  media_urls?: string[];

  @ApiPropertyOptional({ description: 'Hashtags', type: [String] })
  hashtags?: string[];
}
