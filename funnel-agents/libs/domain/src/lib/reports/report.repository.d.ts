import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Report } from './report.entity';
import { ReportType, ReportStatus } from './report.types';
export interface ReportFilters {
    type?: ReportType;
    status?: ReportStatus;
    clientId?: string;
    scheduled?: boolean;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export interface IReportRepository extends IRepository<Report> {
    findByType(type: ReportType, params?: PaginationParams): Promise<PaginatedResult<Report>>;
    findByStatus(status: ReportStatus, params?: PaginationParams): Promise<PaginatedResult<Report>>;
    findByClientId(clientId: string, params?: PaginationParams): Promise<PaginatedResult<Report>>;
    findScheduledReports(): Promise<Report[]>;
    findWithFilters(filters: ReportFilters, params?: PaginationParams): Promise<PaginatedResult<Report>>;
}
