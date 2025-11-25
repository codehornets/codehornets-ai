import { PaginationParams, ReportType, ReportStatus } from '@funnelagents/domain';
export declare class ListReportsQuery {
    readonly filters?: {
        type?: ReportType;
        status?: ReportStatus;
        clientId?: string;
        scheduled?: boolean;
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        type?: ReportType;
        status?: ReportStatus;
        clientId?: string;
        scheduled?: boolean;
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface ReportListDto {
    id: string;
    name: string;
    type: ReportType;
    status: ReportStatus;
    format: string;
    isScheduled: boolean;
    createdAt: Date;
}
