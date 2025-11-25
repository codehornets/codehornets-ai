import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledReportEntity, ReportType, ReportFormat } from '../entities/scheduled-report.entity';
import { AnalyticsService } from '../analytics.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { EmailService } from './email.service';
import { parseExpression } from 'cron-parser';

@Injectable()
export class ReportSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    @InjectRepository(ScheduledReportEntity)
    private readonly scheduledReportRepository: Repository<ScheduledReportEntity>,
    private readonly analyticsService: AnalyticsService,
    private readonly pdfExportService: PdfExportService,
    private readonly excelExportService: ExcelExportService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    this.logger.log('Report Scheduler Service initialized');
    await this.updateNextSendTimes();
  }

  /**
   * Check and send scheduled reports every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledReports(): Promise<void> {
    const now = new Date();

    const dueReports = await this.scheduledReportRepository.find({
      where: {
        isActive: true,
        nextSendAt: LessThanOrEqual(now),
      },
    });

    if (dueReports.length > 0) {
      this.logger.log(`Found ${dueReports.length} reports due for sending`);

      for (const report of dueReports) {
        await this.processScheduledReport(report);
      }
    }
  }

  /**
   * Process and send a scheduled report
   */
  async processScheduledReport(report: ScheduledReportEntity): Promise<void> {
    this.logger.log(`Processing scheduled report: ${report.id} - ${report.name}`);

    try {
      // Generate report data
      const reportData = await this.generateReportData(report);

      // Generate report in requested format
      const buffer = await this.generateReportBuffer(reportData, report.format);

      // Send via email
      const filename = this.generateFilename(report);
      await this.emailService.sendReportEmail(
        report.recipients,
        report.name,
        filename,
        buffer,
        report.format,
      );

      // Update report record
      const nextSendAt = this.calculateNextSendTime(report.schedule);

      await this.scheduledReportRepository.update(report.id, {
        lastSentAt: new Date(),
        nextSendAt,
        sendCount: report.sendCount + 1,
        lastError: null,
      });

      this.logger.log(`Successfully sent report: ${report.id}. Next send: ${nextSendAt}`);
    } catch (error) {
      this.logger.error(`Failed to process report ${report.id}:`, error);

      // Update with error
      await this.scheduledReportRepository.update(report.id, {
        lastError: error.message,
      });
    }
  }

  /**
   * Generate report data based on report type
   */
  private async generateReportData(report: ScheduledReportEntity): Promise<any> {
    const query = {
      workspace_id: report.workspaceId,
      ...report.config,
    };

    let data: any = {
      generated_at: new Date().toISOString(),
      filters: query,
    };

    switch (report.reportType) {
      case ReportType.TASK_ANALYTICS:
        data.tasks = await this.analyticsService.getTaskAnalytics(query);
        break;

      case ReportType.AGENT_ANALYTICS:
        data.agents = await this.analyticsService.getAgentAnalytics(query);
        break;

      case ReportType.DOMAIN_ANALYTICS:
        data.domains = await this.analyticsService.getDomainAnalytics(query);
        break;

      case ReportType.CUSTOM:
      case ReportType.TEMPLATE:
        // Fetch all analytics for comprehensive reports
        const [tasks, agents, domains] = await Promise.all([
          this.analyticsService.getTaskAnalytics(query),
          this.analyticsService.getAgentAnalytics(query),
          this.analyticsService.getDomainAnalytics(query),
        ]);
        data = { ...data, tasks, agents, domains };
        break;
    }

    return data;
  }

  /**
   * Generate report buffer in requested format
   */
  private async generateReportBuffer(data: any, format: ReportFormat): Promise<Buffer> {
    switch (format) {
      case ReportFormat.PDF:
        return this.pdfExportService.generateAnalyticsPDF(data);

      case ReportFormat.EXCEL:
        return this.excelExportService.generateAnalyticsExcel(data);

      case ReportFormat.CSV:
        return Buffer.from(this.convertToCSV(data));

      case ReportFormat.JSON:
        return Buffer.from(JSON.stringify(data, null, 2));

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Task Analytics
    if (data.tasks) {
      lines.push('TASK ANALYTICS');
      lines.push('Metric,Value');
      lines.push(`Total,${data.tasks.total}`);
      lines.push(`Completed,${data.tasks.completed}`);
      lines.push(`Failed,${data.tasks.failed}`);
      lines.push(`Success Rate,${data.tasks.success_rate}%`);
      lines.push('');
    }

    // Agent Analytics
    if (data.agents?.agents) {
      lines.push('AGENT ANALYTICS');
      lines.push('ID,Name,Domain,Tasks Completed,Success Rate,Avg Feedback');
      data.agents.agents.forEach((agent: any) => {
        lines.push(
          `${agent.id},${agent.name},${agent.domain},${agent.tasks_completed},${agent.success_rate}%,${agent.avg_feedback_rating}`,
        );
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Calculate next send time based on cron expression
   */
  private calculateNextSendTime(cronExpression: string): Date {
    try {
      const interval = parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      this.logger.error(`Invalid cron expression: ${cronExpression}`, error);
      // Default to next day if parsing fails
      const next = new Date();
      next.setDate(next.getDate() + 1);
      return next;
    }
  }

  /**
   * Generate filename for report
   */
  private generateFilename(report: ScheduledReportEntity): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = report.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${sanitizedName}-${timestamp}.${report.format}`;
  }

  /**
   * Update next send times for all active reports
   */
  private async updateNextSendTimes(): Promise<void> {
    const reports = await this.scheduledReportRepository.find({
      where: { isActive: true },
    });

    for (const report of reports) {
      if (!report.nextSendAt) {
        const nextSendAt = this.calculateNextSendTime(report.schedule);
        await this.scheduledReportRepository.update(report.id, { nextSendAt });
      }
    }
  }

  /**
   * Manually trigger a report
   */
  async triggerReport(reportId: string): Promise<void> {
    const report = await this.scheduledReportRepository.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    await this.processScheduledReport(report);
  }
}
