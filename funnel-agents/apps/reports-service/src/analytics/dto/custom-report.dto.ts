import { IsArray, IsOptional, IsObject, IsString, IsEnum, ArrayMinSize } from 'class-validator';

export enum CustomReportEntity {
  TASKS = 'tasks',
  AGENTS = 'agents',
  LEADS = 'leads',
  CAMPAIGNS = 'campaigns',
  DEALS = 'deals',
}

export class CustomReportDto {
  @IsEnum(CustomReportEntity)
  entity: CustomReportEntity;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  metrics: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CustomReportResultDto {
  entity: string;
  metrics: Record<string, any>;
  data: any[];
  summary: Record<string, any>;
  generatedAt: string;
}
