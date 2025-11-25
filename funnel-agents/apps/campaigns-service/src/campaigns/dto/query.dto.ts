import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationDto } from '@funnelagents/interfaces';
import { CampaignStatus, CampaignPriority } from '../entities/campaign.entity';

export class CampaignQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsString()
  workspace_id?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ enum: CampaignPriority, description: 'Filter by priority' })
  @IsOptional()
  @IsEnum(CampaignPriority)
  priority?: CampaignPriority;

  @ApiPropertyOptional({ description: 'Search in name and description' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CampaignTemplateQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by public status' })
  @IsOptional()
  is_public?: boolean;

  @ApiPropertyOptional({ description: 'Search in name and description' })
  @IsOptional()
  @IsString()
  search?: string;
}
