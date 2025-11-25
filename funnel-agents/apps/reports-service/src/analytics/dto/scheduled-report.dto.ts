import { IsString, IsEnum, IsArray, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ReportFormat, ReportType } from '../entities/scheduled-report.entity';

export class CreateScheduledReportDto {
  @IsString()
  name: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsString()
  workspaceId: string;

  @IsString()
  schedule: string; // Cron expression

  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateScheduledReportDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ScheduledReportResponseDto {
  id: string;
  name: string;
  reportType: ReportType;
  schedule: string;
  recipients: string[];
  format: ReportFormat;
  isActive: boolean;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
  sendCount: number;
  createdAt: Date;
}
