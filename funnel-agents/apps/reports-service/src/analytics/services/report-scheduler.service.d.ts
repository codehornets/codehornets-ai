import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ScheduledReportEntity } from '../entities/scheduled-report.entity';
import { AnalyticsService } from '../analytics.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { EmailService } from './email.service';
export declare class ReportSchedulerService implements OnModuleInit {
    private readonly scheduledReportRepository;
    private readonly analyticsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly emailService;
    private readonly logger;
    constructor(scheduledReportRepository: Repository<ScheduledReportEntity>, analyticsService: AnalyticsService, pdfExportService: PdfExportService, excelExportService: ExcelExportService, emailService: EmailService);
    onModuleInit(): Promise<void>;
    /**
     * Check and send scheduled reports every minute
     */
    checkScheduledReports(): Promise<void>;
    /**
     * Process and send a scheduled report
     */
    processScheduledReport(report: ScheduledReportEntity): Promise<void>;
    /**
     * Generate report data based on report type
     */
    private generateReportData;
    /**
     * Generate report buffer in requested format
     */
    private generateReportBuffer;
    /**
     * Convert data to CSV format
     */
    private convertToCSV;
    /**
     * Calculate next send time based on cron expression
     */
    private calculateNextSendTime;
    /**
     * Generate filename for report
     */
    private generateFilename;
    /**
     * Update next send times for all active reports
     */
    private updateNextSendTimes;
    /**
     * Manually trigger a report
     */
    triggerReport(reportId: string): Promise<void>;
}
