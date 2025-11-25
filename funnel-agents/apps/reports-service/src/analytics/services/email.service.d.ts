import { ReportFormat } from '../entities/scheduled-report.entity';
/**
 * Email service for sending reports
 * NOTE: This is a stub implementation. In production, integrate with:
 * - SendGrid (@sendgrid/mail)
 * - AWS SES (aws-sdk)
 * - Nodemailer (nodemailer)
 * - Postmark (postmark)
 */
export declare class EmailService {
    private readonly logger;
    sendReportEmail(recipients: string[], reportName: string, filename: string, buffer: Buffer, format: ReportFormat): Promise<void>;
    private getContentType;
    /**
     * Send test email to verify configuration
     */
    sendTestEmail(recipient: string): Promise<void>;
}
