import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface ChartData {
  labels: string[];
  data: number[];
  type: 'bar' | 'line' | 'pie';
}

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  async generateAnalyticsPDF(data: any): Promise<Buffer> {
    this.logger.log('Generating PDF report');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.addHeader(doc);

      // Executive Summary
      this.addSummary(doc, data);

      // Task Analytics
      if (data.tasks) {
        doc.addPage();
        this.addTaskAnalytics(doc, data.tasks);
      }

      // Agent Analytics
      if (data.agents) {
        doc.addPage();
        this.addAgentAnalytics(doc, data.agents);
      }

      // Domain Analytics
      if (data.domains) {
        doc.addPage();
        this.addDomainAnalytics(doc, data.domains);
      }

      // Footer on all pages
      this.addFooter(doc, data.generated_at);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(24)
      .fillColor('#2563eb')
      .text('FunnelAgents Analytics Report', { align: 'center' })
      .moveDown(0.5);

    doc
      .strokeColor('#e5e7eb')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown(1);
  }

  private addSummary(doc: PDFKit.PDFDocument, data: any): void {
    doc.fontSize(18).fillColor('#1f2937').text('Executive Summary').moveDown(0.5);

    const summary = [
      { label: 'Report Generated', value: new Date(data.generated_at).toLocaleString() },
      { label: 'Workspace', value: data.filters?.workspace_id || 'All Workspaces' },
      { label: 'Date Range', value: this.formatDateRange(data.filters) },
    ];

    summary.forEach(({ label, value }) => {
      doc
        .fontSize(12)
        .fillColor('#6b7280')
        .text(label, { continued: true })
        .fillColor('#1f2937')
        .text(`: ${value}`)
        .moveDown(0.3);
    });

    doc.moveDown(1);
  }

  private addTaskAnalytics(doc: PDFKit.PDFDocument, tasks: any): void {
    doc.fontSize(18).fillColor('#1f2937').text('Task Analytics').moveDown(0.5);

    // Key Metrics Box
    this.addMetricsBox(doc, [
      { label: 'Total Tasks', value: tasks.total.toString(), color: '#3b82f6' },
      { label: 'Completed', value: tasks.completed.toString(), color: '#10b981' },
      { label: 'Failed', value: tasks.failed.toString(), color: '#ef4444' },
      { label: 'Success Rate', value: `${tasks.success_rate}%`, color: '#8b5cf6' },
    ]);

    doc.moveDown(1);

    // Performance Metrics
    doc.fontSize(14).text('Performance Metrics').moveDown(0.5);

    const metrics = [
      ['Pending Tasks', tasks.pending],
      ['Running Tasks', tasks.running],
      ['Avg Completion Time', `${tasks.avg_completion_time}s`],
    ];

    this.addTable(doc, metrics);

    // Tasks by Status
    if (tasks.tasks_by_status) {
      doc.moveDown(1);
      doc.fontSize(14).text('Tasks by Status').moveDown(0.5);

      const statusData = Object.entries(tasks.tasks_by_status).map(([status, count]) => [
        status,
        count.toString(),
      ]);

      this.addTable(doc, statusData);
    }

    // Daily Trend
    if (tasks.tasks_by_day && tasks.tasks_by_day.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).text('Daily Task Trend (Last 7 Days)').moveDown(0.5);

      const trendData = tasks.tasks_by_day.slice(-7).map((day: any) => [
        day.date,
        day.count.toString(),
        day.completed.toString(),
        day.failed.toString(),
      ]);

      this.addTable(doc, [['Date', 'Total', 'Completed', 'Failed'], ...trendData], true);
    }
  }

  private addAgentAnalytics(doc: PDFKit.PDFDocument, agents: any): void {
    doc.fontSize(18).fillColor('#1f2937').text('Agent Analytics').moveDown(0.5);

    // Summary
    this.addMetricsBox(doc, [
      { label: 'Total Agents', value: agents.total_agents.toString(), color: '#3b82f6' },
      { label: 'Active Agents', value: agents.active_agents.toString(), color: '#10b981' },
    ]);

    doc.moveDown(1);

    // Top Performers
    if (agents.agents && agents.agents.length > 0) {
      doc.fontSize(14).text('Agent Performance').moveDown(0.5);

      const topAgents = agents.agents
        .sort((a: any, b: any) => b.success_rate - a.success_rate)
        .slice(0, 10);

      const agentData = topAgents.map((agent: any) => [
        agent.name,
        agent.domain,
        agent.tasks_completed.toString(),
        `${agent.success_rate}%`,
        `${agent.avg_completion_time}s`,
        agent.avg_feedback_rating.toFixed(1),
      ]);

      this.addTable(
        doc,
        [['Name', 'Domain', 'Completed', 'Success%', 'Avg Time', 'Rating'], ...agentData],
        true,
      );
    }
  }

  private addDomainAnalytics(doc: PDFKit.PDFDocument, domains: any): void {
    doc.fontSize(18).fillColor('#1f2937').text('Domain Analytics').moveDown(0.5);

    if (domains.domains && domains.domains.length > 0) {
      const domainData = domains.domains.map((domain: any) => [
        domain.domain,
        domain.agent_count.toString(),
        domain.active_count.toString(),
        domain.total_tasks.toString(),
        `${domain.success_rate}%`,
        `${domain.avg_completion_time}s`,
      ]);

      this.addTable(
        doc,
        [['Domain', 'Agents', 'Active', 'Tasks', 'Success%', 'Avg Time'], ...domainData],
        true,
      );
    }
  }

  private addMetricsBox(
    doc: PDFKit.PDFDocument,
    metrics: Array<{ label: string; value: string; color: string }>,
  ): void {
    const boxWidth = 120;
    const boxHeight = 60;
    const spacing = 15;
    const startX = 50;
    const startY = doc.y;

    metrics.forEach((metric, index) => {
      const x = startX + (boxWidth + spacing) * (index % 4);
      const y = startY + Math.floor(index / 4) * (boxHeight + spacing);

      // Box background
      doc.rect(x, y, boxWidth, boxHeight).fillAndStroke('#f9fafb', '#e5e7eb');

      // Value
      doc
        .fontSize(20)
        .fillColor(metric.color)
        .text(metric.value, x + 10, y + 10, {
          width: boxWidth - 20,
          align: 'center',
        });

      // Label
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(metric.label, x + 10, y + 38, {
          width: boxWidth - 20,
          align: 'center',
        });
    });

    doc.y = startY + boxHeight + spacing;
  }

  private addTable(doc: PDFKit.PDFDocument, data: string[][], hasHeader = false): void {
    const tableTop = doc.y;
    const cellPadding = 5;
    const rowHeight = 20;
    const tableWidth = 495;
    const colWidth = tableWidth / data[0].length;

    data.forEach((row, rowIndex) => {
      const y = tableTop + rowIndex * rowHeight;

      // Check if we need a new page
      if (y > 700) {
        doc.addPage();
        return;
      }

      // Draw row background for header
      if (hasHeader && rowIndex === 0) {
        doc.rect(50, y, tableWidth, rowHeight).fillAndStroke('#f3f4f6', '#e5e7eb');
      }

      // Draw cells
      row.forEach((cell, colIndex) => {
        const x = 50 + colIndex * colWidth;

        doc
          .fontSize(9)
          .fillColor(hasHeader && rowIndex === 0 ? '#1f2937' : '#374151')
          .text(cell, x + cellPadding, y + cellPadding, {
            width: colWidth - cellPadding * 2,
            height: rowHeight - cellPadding * 2,
            align: colIndex === 0 ? 'left' : 'right',
            ellipsis: true,
          });
      });

      // Draw row border
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(50, y + rowHeight)
        .lineTo(545, y + rowHeight)
        .stroke();
    });

    doc.y = tableTop + data.length * rowHeight + 10;
  }

  private addFooter(doc: PDFKit.PDFDocument, generatedAt: string): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Generated by FunnelAgents | ${new Date(generatedAt).toLocaleString()}`,
          50,
          doc.page.height - 50,
          {
            align: 'center',
            width: 495,
          },
        );

      doc.text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 35, {
        align: 'right',
        width: 495,
      });
    }
  }

  private formatDateRange(filters: any): string {
    if (!filters) return 'All Time';

    const start = filters.start_date ? new Date(filters.start_date).toLocaleDateString() : 'Start';
    const end = filters.end_date ? new Date(filters.end_date).toLocaleDateString() : 'Now';

    if (!filters.start_date && !filters.end_date) return 'All Time';

    return `${start} - ${end}`;
  }
}
