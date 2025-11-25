import { IsString, IsEnum, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AgentType {
  LEAD_QUALIFIER = 'lead_qualifier',
  CONTENT_CREATOR = 'content_creator',
  EMAIL_MARKETER = 'email_marketer',
  SOCIAL_MEDIA = 'social_media',
  ANALYST = 'analyst',
  CUSTOM = 'custom',
}

export enum AgentDomain {
  SALES = 'sales',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  AUTOMATION = 'automation',
  CUSTOMER_SERVICE = 'customer_service',
}

export enum AgentStatus {
  OFFLINE = 'offline',
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
}

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'Lead Qualification Agent' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: AgentType, description: 'Agent type' })
  @IsEnum(AgentType)
  type: AgentType;

  @ApiProperty({ enum: AgentDomain, description: 'Agent domain' })
  @IsEnum(AgentDomain)
  domain: AgentDomain;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [Object] })
  @IsArray()
  @IsOptional()
  capabilities?: Array<{
    name: string;
    description: string;
    parameters?: Record<string, any>;
  }>;

  @ApiPropertyOptional({ description: 'Agent configuration', type: 'object' })
  @IsObject()
  @IsOptional()
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: string[];
  };

  @ApiPropertyOptional({ description: 'List of tool names the agent can use', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Agent name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Agent description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: AgentStatus, description: 'Agent status' })
  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [Object] })
  @IsArray()
  @IsOptional()
  capabilities?: Array<{
    name: string;
    description: string;
    parameters?: Record<string, any>;
  }>;

  @ApiPropertyOptional({ description: 'Agent configuration', type: 'object' })
  @IsObject()
  @IsOptional()
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: string[];
  };

  @ApiPropertyOptional({ description: 'List of tool names', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];
}

export class AgentQueryDto {
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

  @ApiPropertyOptional({ enum: AgentStatus, description: 'Filter by status' })
  @IsEnum(AgentStatus)
  @IsOptional()
  status?: AgentStatus;

  @ApiPropertyOptional({ enum: AgentType, description: 'Filter by type' })
  @IsEnum(AgentType)
  @IsOptional()
  type?: AgentType;

  @ApiPropertyOptional({ enum: AgentDomain, description: 'Filter by domain' })
  @IsEnum(AgentDomain)
  @IsOptional()
  domain?: AgentDomain;
}
