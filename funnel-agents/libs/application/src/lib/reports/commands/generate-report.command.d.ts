import { ReportData } from '@funnelagents/domain';
export declare class GenerateReportCommand {
    readonly reportId: string;
    constructor(reportId: string);
}
export declare class CompleteReportGenerationCommand {
    readonly reportId: string;
    readonly data: ReportData;
    readonly fileUrl?: string | undefined;
    constructor(reportId: string, data: ReportData, fileUrl?: string | undefined);
}
export interface GenerateReportResult {
    id: string;
    status: string;
    fileUrl?: string;
    generatedAt?: Date;
}
