import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

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

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private provider: 'smtp' | 'sendgrid' | 'none' = 'none';
  private isConfigured = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * Initialize the email transporter based on available configuration
   * Supports both SMTP and SendGrid
   */
  private async initializeTransporter(): Promise<void> {
    try {
      // Check for SendGrid configuration first
      const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (sendgridApiKey) {
        await this.initializeSendGrid(sendgridApiKey);
        return;
      }

      // Fall back to SMTP configuration
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        await this.initializeSMTP(smtpHost, smtpPort, smtpUser, smtpPass);
        return;
      }

      // No email configuration found
      this.logger.warn(
        'No email configuration found (neither SMTP nor SendGrid). Email functionality will be simulated.',
      );
      this.logger.warn(
        'Please configure SMTP_* or SENDGRID_API_KEY environment variables to enable email sending.',
      );
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
      this.isConfigured = false;
    }
  }

  /**
   * Initialize SMTP transporter with detailed configuration
   */
  private async initializeSMTP(
    host: string,
    port: number,
    user: string,
    pass: string,
  ): Promise<void> {
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const requireTLS = this.configService.get<boolean>(
      'SMTP_REQUIRE_TLS',
      true,
    );
    const rejectUnauthorized = this.configService.get<boolean>(
      'SMTP_REJECT_UNAUTHORIZED',
      true,
    );

    const config: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      requireTLS,
      tls: {
        rejectUnauthorized,
      },
      // Connection pool for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Timeout configuration
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 30000,
    };

    this.transporter = nodemailer.createTransport(config);
    this.provider = 'smtp';

    // Verify the connection configuration
    try {
      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.log(
        `SMTP email transporter initialized successfully (${host}:${port})`,
      );
    } catch (error) {
      this.logger.error('SMTP connection verification failed', error);
      this.transporter = null;
      this.isConfigured = false;
      throw error;
    }
  }

  /**
   * Initialize SendGrid transporter using nodemailer-sendgrid transport
   */
  private async initializeSendGrid(apiKey: string): Promise<void> {
    try {
      // SendGrid uses their API, but we can configure it via nodemailer
      // For SendGrid, we use SMTP relay as it's more compatible with nodemailer
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: apiKey,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      this.provider = 'sendgrid';

      // Verify the connection
      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.log('SendGrid email transporter initialized successfully');
    } catch (error) {
      this.logger.error('SendGrid connection verification failed', error);
      this.transporter = null;
      this.isConfigured = false;
      throw error;
    }
  }

  /**
   * Send an email using the configured transporter
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM') ||
      'noreply@funnelagents.ai';

    const replyTo = this.configService.get<string>('EMAIL_REPLY_TO');

    if (!this.transporter || !this.isConfigured) {
      this.logger.warn(
        `[SIMULATED EMAIL] Provider: ${this.provider}, To: ${options.to}, Subject: ${options.subject}`,
      );
      this.logger.debug(
        `[SIMULATED EMAIL] From: ${from}, Body Preview: ${options.text.substring(0, 100)}...`,
      );
      return;
    }

    try {
      const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
        ...(replyTo && { replyTo }),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to ${options.to} via ${this.provider} (Message ID: ${info.messageId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} via ${this.provider}`,
        error.stack,
      );
      throw new Error(
        `Email delivery failed: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Send password reset email with a secure token link
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    customResetUrl?: string,
  ): Promise<void> {
    const baseUrl =
      customResetUrl ||
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const expiryMinutes = 60; // 1 hour

    const subject = 'Password Reset Request - FunnelAgents';
    const text = `
Hello,

You requested a password reset for your FunnelAgents account.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiryMinutes} minutes.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, password reset links can only be used once.

Best regards,
The FunnelAgents Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .url-box {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #667eea;
      word-break: break-all;
      font-size: 12px;
      color: #666;
      margin: 16px 0;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      color: #856404;
    }
    .warning strong {
      display: block;
      margin-bottom: 8px;
      color: #856404;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
    .security-notice {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-notice strong {
      color: #1976D2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You requested a password reset for your <strong>FunnelAgents</strong> account.</p>
      <p>Click the button below to reset your password:</p>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset My Password</a>
      </div>

      <p style="font-size: 14px; color: #888;">Or copy and paste this link into your browser:</p>
      <div class="url-box">${resetUrl}</div>

      <div class="warning">
        <strong>⏱️ Time Sensitive</strong>
        This link will expire in ${expiryMinutes} minutes for your security.
      </div>

      <div class="security-notice">
        <strong>🛡️ Security Notice</strong>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>This link can only be used once</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will remain unchanged</li>
        </ul>
      </div>

      <p style="margin-top: 32px; color: #666;">
        If you have any questions or concerns, please contact our support team.
      </p>

      <p style="color: #666;">
        Best regards,<br>
        <strong>The FunnelAgents Team</strong>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
      <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} FunnelAgents. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send account locked notification email
   */
  async sendAccountLockedEmail(
    email: string,
    unlockUrl?: string,
  ): Promise<void> {
    const lockoutMinutes = 15;
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      'support@funnelagents.ai';

    const subject = '⚠️ Account Locked - Security Alert - FunnelAgents';
    const text = `
Security Alert: Account Locked

Your FunnelAgents account has been temporarily locked due to multiple failed login attempts.

For your security, your account will be automatically unlocked in ${lockoutMinutes} minutes.

What happened?
We detected several unsuccessful login attempts on your account. This is a security measure to protect your account from unauthorized access.

What should you do?
- Wait ${lockoutMinutes} minutes for automatic unlock
- Ensure you're using the correct password
- If you forgot your password, use the "Forgot Password" option
${unlockUrl ? `- Or unlock your account immediately: ${unlockUrl}` : ''}

Didn't attempt to log in?
If you didn't try to access your account, your credentials may be compromised. Please contact our security team immediately at ${supportEmail}.

Best regards,
The FunnelAgents Security Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Locked - Security Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .alert {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 6px;
      margin: 24px 0;
    }
    .alert strong {
      display: block;
      font-size: 18px;
      color: #856404;
      margin-bottom: 12px;
    }
    .alert p {
      margin: 0;
      color: #856404;
    }
    .info-box {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box h3 {
      margin: 0 0 12px 0;
      color: #1976D2;
      font-size: 16px;
    }
    .info-box ul {
      margin: 0;
      padding-left: 20px;
      color: #555;
    }
    .info-box li {
      margin: 8px 0;
    }
    .danger-box {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .danger-box strong {
      color: #c62828;
      display: block;
      margin-bottom: 8px;
    }
    .danger-box p {
      margin: 0;
      color: #c62828;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
    .time-info {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      text-align: center;
      margin: 20px 0;
      font-weight: 600;
      color: #555;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Security Alert: Account Locked</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>🔒 Your Account Has Been Temporarily Locked</strong>
        <p>We've detected multiple failed login attempts on your FunnelAgents account.</p>
      </div>

      <div class="time-info">
        ⏱️ Automatic unlock in ${lockoutMinutes} minutes
      </div>

      <div class="info-box">
        <h3>📋 What Happened?</h3>
        <p>This is an automated security measure to protect your account from unauthorized access attempts.</p>
      </div>

      <div class="info-box">
        <h3>✅ What Should You Do?</h3>
        <ul>
          <li>Wait ${lockoutMinutes} minutes for automatic unlock</li>
          <li>Ensure you're using the correct password</li>
          <li>Use the "Forgot Password" option if needed</li>
          ${unlockUrl ? `<li>Or unlock your account immediately using the button below</li>` : ''}
        </ul>
      </div>

      ${
        unlockUrl
          ? `
      <div style="text-align: center;">
        <a href="${unlockUrl}" class="button">Unlock My Account Now</a>
      </div>
      `
          : ''
      }

      <div class="danger-box">
        <strong>🚨 Didn't Attempt to Log In?</strong>
        <p>If you didn't try to access your account, your credentials may be compromised. Please contact our security team immediately at <a href="mailto:${supportEmail}" style="color: #c62828; font-weight: 600;">${supportEmail}</a></p>
      </div>

      <p style="margin-top: 32px; color: #666;">
        Best regards,<br>
        <strong>The FunnelAgents Security Team</strong>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated security notification.</p>
      <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} FunnelAgents. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const dashboardUrl =
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') +
      '/dashboard';
    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      'support@funnelagents.ai';
    const docsUrl =
      this.configService.get<string>('DOCS_URL') || 'https://docs.funnelagents.ai';

    const subject = `Welcome to FunnelAgents, ${name}! 🎉`;
    const text = `
Welcome to FunnelAgents!

Hi ${name},

Thank you for joining FunnelAgents! We're excited to have you on board.

Your account has been successfully created, and you're ready to start building powerful AI-driven automation workflows.

Getting Started:
1. Log in to your dashboard: ${dashboardUrl}
2. Explore our documentation: ${docsUrl}
3. Create your first agent or workflow
4. Connect with your favorite tools and platforms

What You Can Do:
- Create intelligent AI agents for various tasks
- Build automated workflows to streamline your processes
- Manage leads, contacts, and deals efficiently
- Track performance with comprehensive analytics
- Integrate with your existing tools

Need Help?
Our team is here to support you:
- Documentation: ${docsUrl}
- Support Email: ${supportEmail}
- We typically respond within 24 hours

We can't wait to see what you'll build with FunnelAgents!

Best regards,
The FunnelAgents Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FunnelAgents</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #555;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 24px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .feature-box {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .feature-box h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
    }
    .feature-box ul {
      margin: 0;
      padding-left: 20px;
      color: #555;
    }
    .feature-box li {
      margin: 10px 0;
    }
    .steps-box {
      background: linear-gradient(135deg, #e0f7fa 0%, #e1bee7 100%);
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .steps-box h3 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
    }
    .steps-box ol {
      margin: 0;
      padding-left: 20px;
      color: #555;
    }
    .steps-box li {
      margin: 10px 0;
      font-weight: 500;
    }
    .support-box {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 20px;
      border-radius: 6px;
      margin: 24px 0;
    }
    .support-box h3 {
      margin: 0 0 12px 0;
      color: #1976D2;
      font-size: 16px;
    }
    .support-box p {
      margin: 8px 0;
      color: #555;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
      border-top: 1px solid #e9ecef;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to FunnelAgents!</h1>
      <p>Your journey to intelligent automation starts here</p>
    </div>
    <div class="content">
      <p class="greeting">Hi ${name},</p>

      <p>Thank you for joining <strong>FunnelAgents</strong>! We're thrilled to have you on board.</p>

      <p>Your account has been successfully created, and you're ready to start building powerful AI-driven automation workflows.</p>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>

      <div class="steps-box">
        <h3>🚀 Getting Started</h3>
        <ol>
          <li>Log in to your dashboard</li>
          <li>Explore our comprehensive documentation</li>
          <li>Create your first agent or workflow</li>
          <li>Connect with your favorite tools and platforms</li>
        </ol>
      </div>

      <div class="feature-box">
        <h3>✨ What You Can Do</h3>
        <ul>
          <li><strong>Create Intelligent AI Agents</strong> for various automation tasks</li>
          <li><strong>Build Automated Workflows</strong> to streamline your processes</li>
          <li><strong>Manage Leads & Contacts</strong> efficiently with our CRM</li>
          <li><strong>Track Performance</strong> with comprehensive analytics</li>
          <li><strong>Integrate Seamlessly</strong> with your existing tools</li>
        </ul>
      </div>

      <div class="support-box">
        <h3>💬 Need Help?</h3>
        <p>Our team is here to support you every step of the way:</p>
        <p>📚 <strong>Documentation:</strong> <a href="${docsUrl}" style="color: #1976D2;">${docsUrl}</a></p>
        <p>📧 <strong>Support Email:</strong> <a href="mailto:${supportEmail}" style="color: #1976D2;">${supportEmail}</a></p>
        <p><em>We typically respond within 24 hours</em></p>
      </div>

      <p style="margin-top: 32px;">We can't wait to see what you'll build with FunnelAgents!</p>

      <p style="color: #666;">
        Best regards,<br>
        <strong>The FunnelAgents Team</strong>
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">You're receiving this email because you signed up for FunnelAgents.</p>
      <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} FunnelAgents. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    await this.sendEmail({ to: email, subject, text, html });
  }

  /**
   * Perform a health check on the email service
   * Returns configuration status and verifies connectivity
   */
  async healthCheck(): Promise<EmailHealthCheck> {
    const result: EmailHealthCheck = {
      configured: this.isConfigured,
      provider: this.provider,
      healthy: false,
    };

    if (!this.transporter || !this.isConfigured) {
      result.error = 'Email service not configured';
      return result;
    }

    try {
      // Verify the transporter connection
      await this.transporter.verify();
      result.healthy = true;
      this.logger.log(
        `Email service health check passed (${this.provider} provider)`,
      );
    } catch (error) {
      result.healthy = false;
      result.error = error.message || 'Connection verification failed';
      this.logger.error(
        `Email service health check failed (${this.provider} provider)`,
        error.stack,
      );
    }

    return result;
  }

  /**
   * Get current email service configuration status
   */
  getStatus(): {
    configured: boolean;
    provider: string;
    simulationMode: boolean;
  } {
    return {
      configured: this.isConfigured,
      provider: this.provider,
      simulationMode: !this.isConfigured || !this.transporter,
    };
  }

  /**
   * Close the email transporter connection pool
   * Should be called when shutting down the service
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('Email transporter connection pool closed');
    }
  }
}
