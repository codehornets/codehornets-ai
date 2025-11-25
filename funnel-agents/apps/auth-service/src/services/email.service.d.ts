import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}
export interface EmailHealthCheck {
    configured: boolean;
    provider: 'smtp' | 'sendgrid' | 'none';
    healthy: boolean;
    error?: string;
}
export declare class EmailService implements OnModuleInit {
    private configService;
    private readonly logger;
    private transporter;
    private provider;
    private isConfigured;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    /**
     * Initialize the email transporter based on available configuration
     * Supports both SMTP and SendGrid
     */
    private initializeTransporter;
    /**
     * Initialize SMTP transporter with detailed configuration
     */
    private initializeSMTP;
    /**
     * Initialize SendGrid transporter using nodemailer-sendgrid transport
     */
    private initializeSendGrid;
    /**
     * Send an email using the configured transporter
     */
    sendEmail(options: EmailOptions): Promise<void>;
    /**
     * Send password reset email with a secure token link
     */
    sendPasswordResetEmail(email: string, resetToken: string, customResetUrl?: string): Promise<void>;
    /**
     * Send account locked notification email
     */
    sendAccountLockedEmail(email: string, unlockUrl?: string): Promise<void>;
    /**
     * Send welcome email to new users
     */
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    /**
     * Perform a health check on the email service
     * Returns configuration status and verifies connectivity
     */
    healthCheck(): Promise<EmailHealthCheck>;
    /**
     * Get current email service configuration status
     */
    getStatus(): {
        configured: boolean;
        provider: string;
        simulationMode: boolean;
    };
    /**
     * Close the email transporter connection pool
     * Should be called when shutting down the service
     */
    close(): Promise<void>;
}
