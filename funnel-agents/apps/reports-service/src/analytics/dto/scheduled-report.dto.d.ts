import { ReportFormat, ReportType } from '../entities/scheduled-report.entity';
export declare class CreateScheduledReportDto {
    name: string;
    reportType: ReportType;
    workspaceId: string;
    schedule: string;
    recipients: string[];
    format: ReportFormat;
    config?: Record<string, any>;
    templateId?: string;
}
export declare class UpdateScheduledReportDto {
    name?: string;
    schedule?: string;
    recipients?: string[];
    format?: ReportFormat;
    config?: Record<string, any>;
    isActive?: boolean;
}
export declare class ScheduledReportResponseDto {
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
