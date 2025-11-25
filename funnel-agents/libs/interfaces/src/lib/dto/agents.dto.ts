import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export enum AgentDomain {
  OFFER = 'Offer',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  FULFILLMENT = 'Fulfillment',
  FEEDBACK_LOOP = 'Feedback Loop',
  OPERATIONS = 'Operations',
  CUSTOMER_SUPPORT = 'Customer Support',
  LEADERSHIP = 'Leadership',
  INNOVATION = 'Innovation',
  ENABLEMENT = 'Enablement',
  BUSINESS_DEVELOPMENT = 'Business Development',
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
}

export enum AgentType {
  MARKET_RESEARCHER = 'market_researcher',
  CONTENT_CREATOR = 'content_creator',
  LEAD_QUALIFIER = 'lead_qualifier',
  SEO_SPECIALIST = 'seo_specialist',
  EMAIL_MARKETER = 'email_marketer',
  REPORTING_ANALYST = 'reporting_analyst',
  SOCIAL_MEDIA_MANAGER = 'social_media_manager',
  COMPETITOR_ANALYST = 'competitor_analyst',
  ORCHESTRATOR = 'orchestrator',
  CUSTOM = 'custom',
}

export enum AgentTool {
  WEB_SEARCH = 'Web search',
  CLIENT_DOCS = 'Client docs',
  CRM = 'CRM',
  AD_PLATFORMS = 'Ad platforms',
  EMAIL_DRAFTS = 'Email drafts',
  ANALYTICS = 'Analytics',
}

export const AGENT_SKILLS = [
  'Market Research',
  'Copywriting',
  'Data Analysis',
  'SEO',
  'Social Media',
  'Email Marketing',
  'Content Strategy',
  'Lead Generation',
  'Competitor Analysis',
  'Ad Management',
  'Web Analytics',
  'CRM Management',
  'Sales Outreach',
  'Customer Service',
  'Project Management',
  'Creative Design',
  'Video Production',
] as const;

export class CreateAgentDto {
  @ApiProperty({ example: 'Content Generator Agent' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Generates marketing content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AgentType, example: AgentType.CONTENT_CREATOR })
  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @ApiProperty({ enum: AgentDomain, example: AgentDomain.MARKETING })
  @IsEnum(AgentDomain)
  domain: AgentDomain;

  @ApiProperty({ enum: AgentStatus, example: AgentStatus.ACTIVE })
  @IsEnum(AgentStatus)
  status: AgentStatus;

  @ApiProperty({ example: ['Market Research', 'Competitor Analysis'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({ example: ['Web search', 'CRM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiPropertyOptional({ example: { model: 'gpt-4', temperature: 0.7 } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ example: 'You are a helpful marketing assistant...' })
  @IsOptional()
  @IsString()
  prompt_template?: string;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Updated Agent Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AgentType })
  @IsOptional()
  @IsEnum(AgentType)
  type?: AgentType;

  @ApiPropertyOptional({ enum: AgentDomain })
  @IsOptional()
  @IsEnum(AgentDomain)
  domain?: AgentDomain;

  @ApiPropertyOptional({ enum: AgentStatus })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ example: ['Market Research', 'Competitor Analysis'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: ['Web search', 'CRM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiPropertyOptional({ example: { model: 'gpt-4', temperature: 0.7 } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ example: 'You are a helpful marketing assistant...' })
  @IsOptional()
  @IsString()
  prompt_template?: string;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class AgentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ enum: AgentType })
  type?: AgentType;

  @ApiProperty({ enum: AgentDomain })
  domain: AgentDomain;

  @ApiProperty({ enum: AgentStatus })
  status: AgentStatus;

  @ApiProperty()
  skills: string[];

  @ApiPropertyOptional()
  tools?: string[];

  @ApiPropertyOptional()
  success_rate?: number;

  @ApiPropertyOptional()
  tasks_completed?: number;

  @ApiPropertyOptional()
  avg_completion_time?: number;

  @ApiPropertyOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional()
  prompt_template?: string;

  @ApiPropertyOptional()
  model?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class AgentFilterDto {
  @ApiPropertyOptional({ enum: AgentDomain })
  @IsOptional()
  @IsEnum(AgentDomain)
  domain?: AgentDomain;

  @ApiPropertyOptional({ enum: AgentStatus })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ example: 'content-writing' })
  @IsOptional()
  @IsString()
  skill?: string;
}
