export declare class PdfExportService {
    private readonly logger;
    generateAnalyticsPDF(data: any): Promise<Buffer>;
    private addHeader;
    private addSummary;
    private addTaskAnalytics;
    private addAgentAnalytics;
    private addDomainAnalytics;
    private addMetricsBox;
    private addTable;
    private addFooter;
    private formatDateRange;
}
