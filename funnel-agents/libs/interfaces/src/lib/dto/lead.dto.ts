import { IsString, IsEnum, IsOptional, IsObject, IsEmail, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LeadStatus {
  NEW = 'new',
  QUALIFIED = 'qualified',
  CONTACTED = 'contacted',
  NURTURING = 'nurturing',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  COLD_OUTREACH = 'cold_outreach',
  EVENT = 'event',
  OTHER = 'other',
}

export class CreateLeadDto {
  @ApiProperty({ description: 'Lead first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Lead last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Lead email', example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Lead phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ enum: LeadSource, description: 'Lead source' })
  @IsEnum(LeadSource)
  source: LeadSource;

  @ApiPropertyOptional({ enum: LeadStatus, description: 'Lead status', default: LeadStatus.NEW })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Lead score (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  score?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Campaign ID' })
  @IsString()
  @IsOptional()
  campaignId?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ description: 'Lead first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Lead last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Lead email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Lead phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ enum: LeadStatus, description: 'Lead status' })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Lead score (0-100)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  score?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Mark as qualified' })
  @IsBoolean()
  @IsOptional()
  isQualified?: boolean;
}

export class LeadQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ enum: LeadStatus, description: 'Filter by status' })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadSource, description: 'Filter by source' })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @ApiPropertyOptional({ description: 'Filter by campaign ID' })
  @IsString()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum score' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class QualifyLeadDto {
  @ApiProperty({ description: 'Qualification score (0-100)' })
  @IsNumber()
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional({ description: 'Qualification notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Qualified by agent ID' })
  @IsString()
  @IsOptional()
  qualifiedBy?: string;
}
