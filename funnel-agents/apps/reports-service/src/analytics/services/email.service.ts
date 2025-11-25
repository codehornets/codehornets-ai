import { Injectable, Logger } from '@nestjs/common';
import { ReportFormat } from '../entities/scheduled-report.entity';

/**
 * Email service for sending reports
 * NOTE: This is a stub implementation. In production, integrate with:
 * - SendGrid (@sendgrid/mail)
 * - AWS SES (aws-sdk)
 * - Nodemailer (nodemailer)
 * - Postmark (postmark)
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendReportEmail(
    recipients: string[],
    reportName: string,
    filename: string,
    buffer: Buffer,
    format: ReportFormat,
  ): Promise<void> {
    this.logger.log(`Sending report to ${recipients.length} recipients`);
    this.logger.log(`Report: ${reportName} (${filename})`);
    this.logger.log(`Format: ${format}, Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // TODO: Implement actual email sending
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: recipients,
      from: 'reports@funnelagents.com',
      subject: `FunnelAgents Report: ${reportName}`,
      text: `Please find attached your ${reportName} report.`,
      html: `<p>Please find attached your <strong>${reportName}</strong> report.</p>`,
      attachments: [
        {
          content: buffer.toString('base64'),
          filename: filename,
          type: this.getContentType(format),
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.sendMultiple(msg);
    */

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Report email sent successfully to: ${recipients.join(', ')}`);
  }

  private getContentType(format: ReportFormat): string {
    const contentTypes: Record<ReportFormat, string> = {
      [ReportFormat.PDF]: 'application/pdf',
      [ReportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [ReportFormat.CSV]: 'text/csv',
      [ReportFormat.JSON]: 'application/json',
    };

    return contentTypes[format] || 'application/octet-stream';
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(recipient: string): Promise<void> {
    this.logger.log(`Sending test email to: ${recipient}`);

    // TODO: Implement actual test email
    /*
    const sgMail = require('@sendgrid/mail');
    const msg = {
      to: recipient,
      from: 'reports@funnelagents.com',
      subject: 'FunnelAgents Email Configuration Test',
      text: 'This is a test email to verify your email configuration.',
      html: '<p>This is a test email to verify your email configuration.</p>',
    };

    await sgMail.send(msg);
    */

    this.logger.log(`Test email sent to: ${recipient}`);
  }
}
