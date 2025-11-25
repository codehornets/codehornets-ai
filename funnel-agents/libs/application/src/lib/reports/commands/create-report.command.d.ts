import { ReportType, ReportFormat, ReportConfig, ReportSchedule } from '@funnelagents/domain';
export declare class CreateReportCommand {
    readonly name: string;
    readonly type: ReportType;
    readonly format: ReportFormat;
    readonly config: ReportConfig;
    readonly description?: string | undefined;
    readonly clientId?: string | undefined;
    readonly schedule?: ReportSchedule | undefined;
    constructor(name: string, type: ReportType, format: ReportFormat, config: ReportConfig, description?: string | undefined, clientId?: string | undefined, schedule?: ReportSchedule | undefined);
}
export interface CreateReportResult {
    id: string;
    name: string;
    type: ReportType;
    format: ReportFormat;
    status: string;
    createdAt: Date;
}
