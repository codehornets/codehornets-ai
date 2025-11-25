import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TaskTemplateDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Suggested agent domain' })
  @IsOptional()
  @IsString()
  agent_domain?: string;

  @ApiPropertyOptional({ description: 'Task priority' })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class CreateCampaignTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Lead Generation Campaign' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Template category',
    example: 'lead_generation',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Default settings for campaigns', type: Object })
  @IsOptional()
  @IsObject()
  default_settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Suggested agent types/domains',
    type: [String],
    example: ['sales', 'marketing'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  default_agents?: string[];

  @ApiPropertyOptional({
    description: 'Default task templates',
    type: [TaskTemplateDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskTemplateDto)
  default_tasks?: TaskTemplateDto[];

  @ApiPropertyOptional({ description: 'Is template public', default: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class UpdateCampaignTemplateDto extends PartialType(CreateCampaignTemplateDto) {}

export class CampaignTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional({ type: Object })
  default_settings?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  default_agents?: string[];

  @ApiPropertyOptional({ type: [TaskTemplateDto] })
  default_tasks?: TaskTemplateDto[];

  @ApiProperty()
  is_public: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
