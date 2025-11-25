export declare class ExcelExportService {
    private readonly logger;
    generateAnalyticsExcel(data: any): Promise<Buffer>;
    private addSummarySheet;
    private addTaskAnalyticsSheet;
    private addAgentAnalyticsSheet;
    private addDomainAnalyticsSheet;
    private addDailyTrendsSheet;
    private styleHeaderRows;
    private formatDateRange;
}
