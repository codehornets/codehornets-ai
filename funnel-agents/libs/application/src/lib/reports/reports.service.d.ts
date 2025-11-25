import { Report, IReportRepository, ReportFilters, ReportType, ReportFormat, ReportConfig, ReportData, ReportSchedule } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class ReportsService {
    private readonly reportRepository;
    constructor(reportRepository: IReportRepository);
    findById(id: string): Promise<Report | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Report>>;
    findScheduled(): Promise<Report[]>;
    findWithFilters(filters: ReportFilters, params?: PaginationParams): Promise<PaginatedResult<Report>>;
    create(data: {
        name: string;
        description?: string;
        type: ReportType;
        format: ReportFormat;
        clientId?: string;
        config: ReportConfig;
        schedule?: ReportSchedule;
    }): Promise<Report>;
    generate(id: string): Promise<Report>;
    complete(id: string, data: ReportData, fileUrl?: string): Promise<Report>;
    fail(id: string, error: string): Promise<Report>;
    setSchedule(id: string, schedule: ReportSchedule): Promise<Report>;
    removeSchedule(id: string): Promise<Report>;
    delete(id: string): Promise<void>;
}
