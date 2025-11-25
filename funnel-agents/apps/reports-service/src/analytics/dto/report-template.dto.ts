import { IsString, IsEnum, IsArray, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ReportType } from '../entities/scheduled-report.entity';

export class CreateReportTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsArray()
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
  @IsObject()
  charts?: Record<string, any>;
}

export class UpdateReportTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @IsOptional()
  @IsObject()
  charts?: Record<string, any>;
}

export class ReportTemplateResponseDto {
  id: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  isPublic: boolean;
  metrics: string[];
  filters: Record<string, any> | null;
  groupBy: string[] | null;
  charts: Record<string, any> | null;
  createdAt: Date;
}

export class CloneTemplateDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
