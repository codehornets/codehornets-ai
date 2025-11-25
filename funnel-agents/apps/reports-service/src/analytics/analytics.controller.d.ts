import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';
import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { CacheService } from './services/cache.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly cacheService;
    constructor(analyticsService: AnalyticsService, pdfExportService: PdfExportService, excelExportService: ExcelExportService, cacheService: CacheService);
    getTaskAnalytics(query: AnalyticsQueryDto): Promise<import("./dto").TaskAnalyticsDto>;
    getAgentAnalytics(query: AnalyticsQueryDto): Promise<import("./dto").AgentAnalyticsDto>;
    getDomainAnalytics(query: AnalyticsQueryDto): Promise<import("./dto").DomainAnalyticsDto>;
    getCacheStats(): Promise<{
        size: number;
        keys: string[];
    }>;
    clearCache(workspaceId?: string): Promise<{
        message: string;
    }>;
    exportAnalytics(format: string, query: AnalyticsQueryDto, res: Response): Promise<Response<any, Record<string, any>>>;
    exportAnalyticsMicroservice(data: {
        format: string;
        query: AnalyticsQueryDto;
    }): Promise<{
        format: string;
        buffer: string;
        contentType: string;
        filename: string;
    }>;
    private convertToCSV;
}
