import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PersonaDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Chen' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Market Analyst' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'SC' })
  @IsString()
  initials: string;
}

export class CreateAgentTemplateDto {
  @ApiProperty({ example: 'Marketing Assistant Template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A template for marketing assistants' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'market_researcher' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'Marketing' })
  @IsString()
  domain: string;

  @ApiProperty({ example: ['Market Research', 'Competitor Analysis'] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({ example: ['Web search', 'CRM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiPropertyOptional({ example: 'You are a marketing expert...' })
  @IsOptional()
  @IsString()
  prompt_template?: string;

  @ApiPropertyOptional({ example: { model: 'gpt-4', temperature: 0.7 } })
  @IsOptional()
  @IsObject()
  default_settings?: Record<string, any>;

  @ApiPropertyOptional({ example: 'content-generation' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ type: PersonaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaDto)
  persona?: PersonaDto;

  @ApiPropertyOptional({ example: ['Research', 'Top-of-funnel', 'B2B'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  use_cases?: string[];

  @ApiPropertyOptional({ example: ['Audience research', 'Competitor scan'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  typical_tasks?: string[];

  @ApiPropertyOptional({ example: ['Research audience pains for a new offer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  example_tasks?: string[];

  @ApiPropertyOptional({ example: ['Researches target audiences'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overview?: string[];

  @ApiPropertyOptional({ example: ['Lead Qualifier', 'Content Writer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commonly_used_with?: string[];

  @ApiPropertyOptional({ example: 'Popular' })
  @IsOptional()
  @IsString()
  popularity_label?: string;
}

export class UpdateAgentTemplateDto {
  @ApiPropertyOptional({ example: 'Updated Template Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'market_researcher' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Sales' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: ['Lead Generation', 'Sales Outreach'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ example: ['Web search', 'CRM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiPropertyOptional({ example: 'You are a sales expert...' })
  @IsOptional()
  @IsString()
  prompt_template?: string;

  @ApiPropertyOptional({ example: { model: 'gpt-4-turbo', temperature: 0.8 } })
  @IsOptional()
  @IsObject()
  default_settings?: Record<string, any>;

  @ApiPropertyOptional({ example: 'sales-automation' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: PersonaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaDto)
  persona?: PersonaDto;

  @ApiPropertyOptional({ example: ['Research', 'Top-of-funnel'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  use_cases?: string[];

  @ApiPropertyOptional({ example: ['Lead scoring', 'BANT qualification'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  typical_tasks?: string[];

  @ApiPropertyOptional({ example: ['Score new leads from website form'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  example_tasks?: string[];

  @ApiPropertyOptional({ example: ['Evaluates leads based on BANT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overview?: string[];

  @ApiPropertyOptional({ example: ['Sales Agent', 'Account Manager'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commonly_used_with?: string[];

  @ApiPropertyOptional({ example: 'Recommended' })
  @IsOptional()
  @IsString()
  popularity_label?: string;
}

export class AgentTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiProperty()
  domain: string;

  @ApiProperty()
  skills: string[];

  @ApiPropertyOptional()
  tools?: string[];

  @ApiPropertyOptional()
  prompt_template?: string;

  @ApiPropertyOptional()
  default_settings?: Record<string, any>;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  is_public: boolean;

  @ApiPropertyOptional()
  persona?: PersonaDto;

  @ApiPropertyOptional()
  use_cases?: string[];

  @ApiPropertyOptional()
  typical_tasks?: string[];

  @ApiPropertyOptional()
  example_tasks?: string[];

  @ApiPropertyOptional()
  overview?: string[];

  @ApiPropertyOptional()
  commonly_used_with?: string[];

  @ApiPropertyOptional()
  popularity_label?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class AgentTemplateFilterDto {
  @ApiPropertyOptional({ example: 'Marketing' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'content-generation' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ example: 'seo-optimization' })
  @IsOptional()
  @IsString()
  skill?: string;
}
