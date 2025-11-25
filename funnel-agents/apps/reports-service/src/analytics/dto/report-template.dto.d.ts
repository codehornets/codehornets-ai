import { ReportType } from '../entities/scheduled-report.entity';
export declare class CreateReportTemplateDto {
    name: string;
    description?: string;
    reportType: ReportType;
    workspaceId?: string;
    isPublic?: boolean;
    metrics: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
    charts?: Record<string, any>;
}
export declare class UpdateReportTemplateDto {
    name?: string;
    description?: string;
    metrics?: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
    charts?: Record<string, any>;
}
export declare class ReportTemplateResponseDto {
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
export declare class CloneTemplateDto {
    templateId: string;
    name?: string;
    workspaceId?: string;
}
