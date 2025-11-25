import { Controller, Get, Query, Param, BadRequestException, Res, HttpStatus } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';
import { PdfExportService } from './services/pdf-export.service';
import { ExcelExportService } from './services/excel-export.service';
import { CacheService } from './services/cache.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly pdfExportService: PdfExportService,
    private readonly excelExportService: ExcelExportService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('tasks')
  @MessagePattern({ cmd: 'get_task_analytics' })
  async getTaskAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTaskAnalytics(query);
  }

  @Get('agents')
  @MessagePattern({ cmd: 'get_agent_analytics' })
  async getAgentAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getAgentAnalytics(query);
  }

  @Get('domains')
  @MessagePattern({ cmd: 'get_domain_analytics' })
  async getDomainAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDomainAnalytics(query);
  }

  @Get('cache/stats')
  async getCacheStats() {
    return this.cacheService.getStats();
  }

  @Get('cache/clear')
  async clearCache(@Query('workspace_id') workspaceId?: string) {
    if (workspaceId) {
      await this.cacheService.invalidateWorkspace(workspaceId);
      return { message: `Cache cleared for workspace: ${workspaceId}` };
    }

    await this.cacheService.clear();
    return { message: 'All cache cleared' };
  }

  @Get('export/:format')
  async exportAnalytics(
    @Param('format') format: string,
    @Query() query: AnalyticsQueryDto,
    @Res() res: Response,
  ) {
    const supportedFormats = ['csv', 'pdf', 'json', 'excel'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      throw new BadRequestException(`Supported formats: ${supportedFormats.join(', ')}`);
    }

    const [taskAnalytics, agentAnalytics, domainAnalytics] = await Promise.all([
      this.analyticsService.getTaskAnalytics(query),
      this.analyticsService.getAgentAnalytics(query),
      this.analyticsService.getDomainAnalytics(query),
    ]);

    const data = {
      tasks: taskAnalytics,
      agents: agentAnalytics,
      domains: domainAnalytics,
      generated_at: new Date().toISOString(),
      filters: query,
    };

    const timestamp = Date.now();

    switch (format.toLowerCase()) {
      case 'csv':
        const csvData = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timestamp}.csv`);
        return res.send(csvData);

      case 'pdf':
        const pdfBuffer = await this.pdfExportService.generateAnalyticsPDF(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timestamp}.pdf`);
        return res.send(pdfBuffer);

      case 'excel':
        const excelBuffer = await this.excelExportService.generateAnalyticsExcel(data);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timestamp}.xlsx`);
        return res.send(excelBuffer);

      case 'json':
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${timestamp}.json`);
        return res.send(data);
    }
  }

  @MessagePattern({ cmd: 'export_analytics' })
  async exportAnalyticsMicroservice(data: { format: string; query: AnalyticsQueryDto }) {
    const { format, query } = data;

    if (!['csv', 'pdf', 'json', 'excel'].includes(format.toLowerCase())) {
      throw new BadRequestException('Supported formats: csv, pdf, json, excel');
    }

    const [taskAnalytics, agentAnalytics, domainAnalytics] = await Promise.all([
      this.analyticsService.getTaskAnalytics(query),
      this.analyticsService.getAgentAnalytics(query),
      this.analyticsService.getDomainAnalytics(query),
    ]);

    const reportData = {
      tasks: taskAnalytics,
      agents: agentAnalytics,
      domains: domainAnalytics,
      generated_at: new Date().toISOString(),
      filters: query,
    };

    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await this.pdfExportService.generateAnalyticsPDF(reportData);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;

      case 'excel':
        buffer = await this.excelExportService.generateAnalyticsExcel(reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;

      case 'csv':
        buffer = Buffer.from(this.convertToCSV(reportData));
        contentType = 'text/csv';
        extension = 'csv';
        break;

      case 'json':
      default:
        buffer = Buffer.from(JSON.stringify(reportData, null, 2));
        contentType = 'application/json';
        extension = 'json';
        break;
    }

    return {
      format,
      buffer: buffer.toString('base64'),
      contentType,
      filename: `analytics-${Date.now()}.${extension}`,
    };
  }

  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Task Analytics
    lines.push('TASK ANALYTICS');
    lines.push('Metric,Value');
    lines.push(`Total,${data.tasks.total}`);
    lines.push(`Completed,${data.tasks.completed}`);
    lines.push(`Failed,${data.tasks.failed}`);
    lines.push(`Pending,${data.tasks.pending}`);
    lines.push(`Running,${data.tasks.running}`);
    lines.push(`Success Rate,${data.tasks.success_rate}%`);
    lines.push(`Avg Completion Time,${data.tasks.avg_completion_time}s`);
    lines.push('');

    // Tasks by Day
    lines.push('TASKS BY DAY');
    lines.push('Date,Total,Completed,Failed');
    data.tasks.tasks_by_day.forEach((day: any) => {
      lines.push(`${day.date},${day.count},${day.completed},${day.failed}`);
    });
    lines.push('');

    // Agent Analytics
    lines.push('AGENT ANALYTICS');
    lines.push('ID,Name,Domain,Status,Tasks Completed,Tasks Failed,Success Rate,Avg Completion Time,Avg Feedback');
    data.agents.agents.forEach((agent: any) => {
      lines.push(
        `${agent.id},${agent.name},${agent.domain},${agent.status},${agent.tasks_completed},${agent.tasks_failed},${agent.success_rate}%,${agent.avg_completion_time}s,${agent.avg_feedback_rating}`,
      );
    });
    lines.push('');

    // Domain Analytics
    lines.push('DOMAIN ANALYTICS');
    lines.push('Domain,Agent Count,Active Count,Total Tasks,Completed Tasks,Success Rate,Avg Completion Time');
    data.domains.domains.forEach((domain: any) => {
      lines.push(
        `${domain.domain},${domain.agent_count},${domain.active_count},${domain.total_tasks},${domain.completed_tasks},${domain.success_rate}%,${domain.avg_completion_time}s`,
      );
    });

    return lines.join('\n');
  }
}
