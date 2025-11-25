import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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

  @Get('export/:format')
  @MessagePattern({ cmd: 'export_analytics' })
  async exportAnalytics(
    @Param('format') format: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    if (!['csv', 'pdf', 'json'].includes(format.toLowerCase())) {
      throw new BadRequestException('Supported formats: csv, pdf, json');
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

    switch (format.toLowerCase()) {
      case 'csv':
        return {
          format: 'csv',
          data: this.convertToCSV(data),
          contentType: 'text/csv',
          filename: `analytics-${Date.now()}.csv`,
        };
      case 'pdf':
        // For now, return JSON. Client can generate PDF or implement pdfkit later
        return {
          format: 'pdf',
          data,
          message: 'PDF generation to be implemented. Use JSON data for client-side generation.',
        };
      case 'json':
      default:
        return {
          format: 'json',
          data,
          contentType: 'application/json',
          filename: `analytics-${Date.now()}.json`,
        };
    }
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
