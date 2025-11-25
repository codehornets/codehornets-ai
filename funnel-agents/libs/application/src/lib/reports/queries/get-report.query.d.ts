import { ReportType, ReportStatus, ReportFormat, ReportConfig, ReportData, ReportSchedule } from '@funnelagents/domain';
export declare class GetReportQuery {
    readonly id: string;
    constructor(id: string);
}
export interface ReportDto {
    id: string;
    name: string;
    description?: string;
    type: ReportType;
    status: ReportStatus;
    format: ReportFormat;
    clientId?: string;
    config: ReportConfig;
    data?: ReportData;
    schedule?: ReportSchedule;
    fileUrl?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
