import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { CampaignStatus, CampaignPriority } from '../entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name', example: 'Q1 Lead Generation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace/client reference ID' })
  @IsOptional()
  @IsString()
  workspace_id?: string;

  @ApiPropertyOptional({
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
    description: 'Campaign status',
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    enum: CampaignPriority,
    default: CampaignPriority.MEDIUM,
    description: 'Campaign priority',
  })
  @IsOptional()
  @IsEnum(CampaignPriority)
  priority?: CampaignPriority;

  @ApiPropertyOptional({ description: 'Campaign goal' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ description: 'Start date', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Team member IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  team_members?: string[];

  @ApiPropertyOptional({ description: 'Agent IDs assigned to campaign', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agent_ids?: string[];

  @ApiPropertyOptional({ description: 'Custom settings', type: Object })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}

export class CampaignResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  workspace_id?: string;

  @ApiProperty({ enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ enum: CampaignPriority })
  priority: CampaignPriority;

  @ApiPropertyOptional()
  goal?: string;

  @ApiPropertyOptional()
  start_date?: Date;

  @ApiPropertyOptional()
  end_date?: Date;

  @ApiPropertyOptional({ type: [String] })
  team_members?: string[];

  @ApiPropertyOptional({ type: [String] })
  agent_ids?: string[];

  @ApiPropertyOptional({ type: Object })
  settings?: Record<string, any>;

  @ApiPropertyOptional()
  progress?: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CreateFromTemplateDto {
  @ApiProperty({ description: 'Template ID to use' })
  @IsUUID()
  template_id: string;

  @ApiProperty({ description: 'Campaign name', example: 'Q1 Lead Generation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace/client reference ID' })
  @IsOptional()
  @IsString()
  workspace_id?: string;

  @ApiPropertyOptional({ description: 'Override template settings', type: Object })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Create default tasks from template', default: true })
  @IsOptional()
  create_default_tasks?: boolean;
}
