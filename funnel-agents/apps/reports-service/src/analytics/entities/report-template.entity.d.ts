import { ReportType } from './scheduled-report.entity';
export declare class ReportTemplateEntity {
    id: string;
    name: string;
    description: string;
    reportType: ReportType;
    workspaceId: string;
    isPublic: boolean;
    metrics: string[];
    filters: Record<string, any>;
    groupBy: string[];
    charts: Record<string, any>;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
