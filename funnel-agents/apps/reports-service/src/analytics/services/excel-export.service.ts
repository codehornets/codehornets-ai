import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExportService {
  private readonly logger = new Logger(ExcelExportService.name);

  async generateAnalyticsExcel(data: any): Promise<Buffer> {
    this.logger.log('Generating Excel report');

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'FunnelAgents';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = 'FunnelAgents Reports Service';

    // Summary Sheet
    this.addSummarySheet(workbook, data);

    // Task Analytics Sheet
    if (data.tasks) {
      this.addTaskAnalyticsSheet(workbook, data.tasks);
    }

    // Agent Analytics Sheet
    if (data.agents) {
      this.addAgentAnalyticsSheet(workbook, data.agents);
    }

    // Domain Analytics Sheet
    if (data.domains) {
      this.addDomainAnalyticsSheet(workbook, data.domains);
    }

    // Daily Trends Sheet
    if (data.tasks?.tasks_by_day) {
      this.addDailyTrendsSheet(workbook, data.tasks.tasks_by_day);
    }

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  private addSummarySheet(workbook: ExcelJS.Workbook, data: any): void {
    const sheet = workbook.addWorksheet('Summary', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Title
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'FunnelAgents Analytics Report';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Report Info
    sheet.addRow([]);
    sheet.addRow(['Generated At', new Date(data.generated_at).toLocaleString()]);
    sheet.addRow(['Workspace ID', data.filters?.workspace_id || 'All Workspaces']);
    sheet.addRow(['Date Range', this.formatDateRange(data.filters)]);
    sheet.addRow([]);

    // Key Metrics
    if (data.tasks) {
      sheet.addRow(['KEY METRICS']).font = { bold: true, size: 12 };
      sheet.addRow(['Total Tasks', data.tasks.total]);
      sheet.addRow(['Completed Tasks', data.tasks.completed]);
      sheet.addRow(['Failed Tasks', data.tasks.failed]);
      sheet.addRow(['Success Rate', `${data.tasks.success_rate}%`]);
      sheet.addRow(['Avg Completion Time', `${data.tasks.avg_completion_time}s`]);
    }

    if (data.agents) {
      sheet.addRow([]);
      sheet.addRow(['AGENT SUMMARY']).font = { bold: true, size: 12 };
      sheet.addRow(['Total Agents', data.agents.total_agents]);
      sheet.addRow(['Active Agents', data.agents.active_agents]);
    }

    // Style columns
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 30;

    // Add borders and colors
    this.styleHeaderRows(sheet, [3, 7, 14]);
  }

  private addTaskAnalyticsSheet(workbook: ExcelJS.Workbook, tasks: any): void {
    const sheet = workbook.addWorksheet('Task Analytics');

    // Headers
    sheet.addRow(['Metric', 'Value']).font = { bold: true, size: 12 };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };

    // Data
    sheet.addRow(['Total Tasks', tasks.total]);
    sheet.addRow(['Completed', tasks.completed]);
    sheet.addRow(['Failed', tasks.failed]);
    sheet.addRow(['Pending', tasks.pending]);
    sheet.addRow(['Running', tasks.running]);
    sheet.addRow(['Success Rate (%)', tasks.success_rate]);
    sheet.addRow(['Avg Completion Time (s)', tasks.avg_completion_time]);

    // Tasks by Status
    if (tasks.tasks_by_status) {
      sheet.addRow([]);
      sheet.addRow(['Status', 'Count']).font = { bold: true };
      Object.entries(tasks.tasks_by_status).forEach(([status, count]) => {
        sheet.addRow([status, count]);
      });
    }

    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;

    // Add conditional formatting for success rate
    sheet.addConditionalFormatting({
      ref: 'B7',
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: [90],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FF10B981' },
            },
          },
        },
        {
          type: 'cellIs',
          operator: 'lessThan',
          formulae: [70],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFEF4444' },
            },
          },
        },
      ],
    });
  }

  private addAgentAnalyticsSheet(workbook: ExcelJS.Workbook, agents: any): void {
    const sheet = workbook.addWorksheet('Agent Performance');

    // Headers
    const headers = [
      'Agent ID',
      'Name',
      'Domain',
      'Status',
      'Tasks Completed',
      'Tasks Failed',
      'Success Rate (%)',
      'Avg Completion Time (s)',
      'Avg Feedback Rating',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Data
    if (agents.agents && agents.agents.length > 0) {
      agents.agents.forEach((agent: any) => {
        sheet.addRow([
          agent.id,
          agent.name,
          agent.domain,
          agent.status,
          agent.tasks_completed,
          agent.tasks_failed,
          agent.success_rate,
          agent.avg_completion_time,
          agent.avg_feedback_rating,
        ]);
      });
    }

    // Auto-fit columns
    sheet.columns.forEach((column, index) => {
      if (index === 0) column.width = 36; // UUID
      else if (index === 1) column.width = 20; // Name
      else if (index === 2) column.width = 15; // Domain
      else column.width = 18;
    });

    // Add conditional formatting for success rate
    const dataRowCount = agents.agents?.length || 0;
    if (dataRowCount > 0) {
      sheet.addConditionalFormatting({
        ref: `G2:G${dataRowCount + 1}`,
        rules: [
          {
            type: 'colorScale',
            cfvo: [
              { type: 'num', value: 0 },
              { type: 'num', value: 100 },
            ],
            color: [{ argb: 'FFEF4444' }, { argb: 'FF10B981' }],
          },
        ],
      });

      // Rating stars conditional formatting
      sheet.addConditionalFormatting({
        ref: `I2:I${dataRowCount + 1}`,
        rules: [
          {
            type: 'colorScale',
            cfvo: [
              { type: 'num', value: 1 },
              { type: 'num', value: 5 },
            ],
            color: [{ argb: 'FFFBBF24' }, { argb: 'FF10B981' }],
          },
        ],
      });
    }

    // Add filters
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  private addDomainAnalyticsSheet(workbook: ExcelJS.Workbook, domains: any): void {
    const sheet = workbook.addWorksheet('Domain Analytics');

    // Headers
    const headers = [
      'Domain',
      'Agent Count',
      'Active Count',
      'Total Tasks',
      'Completed Tasks',
      'Success Rate (%)',
      'Avg Completion Time (s)',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Data
    if (domains.domains && domains.domains.length > 0) {
      domains.domains.forEach((domain: any) => {
        sheet.addRow([
          domain.domain,
          domain.agent_count,
          domain.active_count,
          domain.total_tasks,
          domain.completed_tasks,
          domain.success_rate,
          domain.avg_completion_time,
        ]);
      });
    }

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Add filters
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  private addDailyTrendsSheet(workbook: ExcelJS.Workbook, tasksBy Day: any[]): void {
    const sheet = workbook.addWorksheet('Daily Trends');

    // Headers
    const headers = ['Date', 'Total Tasks', 'Completed', 'Failed', 'Success Rate (%)'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
    });

    // Data
    tasksByDay.forEach((day: any) => {
      const successRate = day.count > 0 ? ((day.completed / day.count) * 100).toFixed(2) : 0;
      sheet.addRow([day.date, day.count, day.completed, day.failed, successRate]);
    });

    // Column widths
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 18;

    // Add chart (sparkline-like visualization using conditional formatting)
    const dataRowCount = tasksByDay.length;
    if (dataRowCount > 0) {
      sheet.addConditionalFormatting({
        ref: `B2:B${dataRowCount + 1}`,
        rules: [
          {
            type: 'dataBar',
            cfvo: [
              { type: 'min' },
              { type: 'max' },
            ],
            color: { argb: 'FF3B82F6' },
          },
        ],
      });
    }
  }

  private styleHeaderRows(sheet: ExcelJS.Worksheet, rowNumbers: number[]): void {
    rowNumbers.forEach((rowNum) => {
      const row = sheet.getRow(rowNum);
      row.font = { bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    });
  }

  private formatDateRange(filters: any): string {
    if (!filters) return 'All Time';

    const start = filters.start_date ? new Date(filters.start_date).toLocaleDateString() : 'Start';
    const end = filters.end_date ? new Date(filters.end_date).toLocaleDateString() : 'Now';

    if (!filters.start_date && !filters.end_date) return 'All Time';

    return `${start} - ${end}`;
  }
}
