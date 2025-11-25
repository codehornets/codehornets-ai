# Email Service - Usage Examples

This guide provides practical examples for using the Email Service in the auth-service.

## Table of Contents
- [Basic Configuration](#basic-configuration)
- [Sending Emails](#sending-emails)
- [Health Checks](#health-checks)
- [Integration Examples](#integration-examples)
- [Testing](#testing)

## Basic Configuration

### Environment Setup

Create a `.env` file with your email provider configuration:

**Option 1: Gmail SMTP**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@funnelagents.ai
EMAIL_REPLY_TO=support@funnelagents.ai
SUPPORT_EMAIL=support@funnelagents.ai
FRONTEND_URL=http://localhost:3000
```

**Option 2: SendGrid**
```bash
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=noreply@funnelagents.ai
EMAIL_REPLY_TO=support@funnelagents.ai
SUPPORT_EMAIL=support@funnelagents.ai
FRONTEND_URL=http://localhost:3000
```

**Option 3: Development (Simulation Mode)**
```bash
# Leave email config empty for simulation mode
FRONTEND_URL=http://localhost:3000
```

## Sending Emails

### 1. Password Reset Email

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { PasswordResetService } from './services/password-reset.service';

@Injectable()
export class AuthService {
  constructor(
    private emailService: EmailService,
    private passwordResetService: PasswordResetService,
  ) {}

  async forgotPassword(email: string): Promise<void> {
    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = await this.passwordResetService.createResetToken(user.id);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }
}
```

### 2. Account Locked Email

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Injectable()
export class AccountLockoutService {
  constructor(private emailService: EmailService) {}

  async notifyAccountLocked(email: string, userId: string): Promise<void> {
    // Optional: Generate unlock token
    const unlockToken = await this.generateUnlockToken(userId);
    const unlockUrl = `${process.env.FRONTEND_URL}/unlock-account?token=${unlockToken}`;

    // Send account locked notification
    await this.emailService.sendAccountLockedEmail(email, unlockUrl);
  }

  async notifyAccountLockedSimple(email: string): Promise<void> {
    // Send without unlock URL (auto-unlock after timeout)
    await this.emailService.sendAccountLockedEmail(email);
  }
}
```

### 3. Welcome Email

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Injectable()
export class AuthService {
  constructor(private emailService: EmailService) {}

  async register(registerDto: RegisterDto): Promise<void> {
    // Create user
    const user = await this.createUser(registerDto);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return user;
  }
}
```

### 4. Custom Email

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Injectable()
export class NotificationService {
  constructor(private emailService: EmailService) {}

  async sendCustomNotification(email: string): Promise<void> {
    await this.emailService.sendEmail({
      to: email,
      subject: 'Important Notification',
      text: 'This is a plain text message',
      html: '<h1>This is HTML</h1><p>This is a plain text message</p>',
    });
  }

  async sendBulkEmails(emails: string[]): Promise<void> {
    // Send emails in parallel (connection pooling handles concurrency)
    await Promise.all(
      emails.map((email) =>
        this.emailService.sendEmail({
          to: email,
          subject: 'Bulk Notification',
          text: 'This is a bulk message',
        }),
      ),
    );
  }
}
```

## Health Checks

### Adding Health Check Endpoint

```typescript
import { Controller, Get } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('health')
export class HealthController {
  constructor(private emailService: EmailService) {}

  @Get('email')
  async checkEmailHealth() {
    const health = await this.emailService.healthCheck();
    return {
      status: health.healthy ? 'up' : 'down',
      details: health,
    };
  }

  @Get('email/status')
  getEmailStatus() {
    return this.emailService.getStatus();
  }
}
```

### Health Check Response Examples

**Healthy (Configured)**
```json
{
  "status": "up",
  "details": {
    "configured": true,
    "provider": "smtp",
    "healthy": true
  }
}
```

**Unhealthy (Connection Error)**
```json
{
  "status": "down",
  "details": {
    "configured": true,
    "provider": "smtp",
    "healthy": false,
    "error": "Connection timeout"
  }
}
```

**Simulation Mode**
```json
{
  "status": "down",
  "details": {
    "configured": false,
    "provider": "none",
    "healthy": false,
    "error": "Email service not configured"
  }
}
```

## Integration Examples

### With Error Handling

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private emailService: EmailService) {}

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return { success: true, message: 'If the email exists, a reset link has been sent.' };
      }

      const resetToken = await this.passwordResetService.createResetToken(user.id);

      await this.emailService.sendPasswordResetEmail(email, resetToken);

      this.logger.log(`Password reset email sent to ${email}`);
      return { success: true, message: 'Password reset email sent successfully.' };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);

      // Don't expose internal errors to client
      return {
        success: false,
        message: 'Unable to send email at this time. Please try again later.'
      };
    }
  }
}
```

### With Retry Logic

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './services/email.service';

@Injectable()
export class RobustEmailService {
  private readonly logger = new Logger(RobustEmailService.name);

  constructor(private emailService: EmailService) {}

  async sendWithRetry(
    emailFn: () => Promise<void>,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await emailFn();
        return; // Success
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Email send attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw new Error(
      `Failed to send email after ${maxRetries} attempts: ${lastError.message}`,
    );
  }

  async sendPasswordResetWithRetry(email: string, token: string): Promise<void> {
    await this.sendWithRetry(
      () => this.emailService.sendPasswordResetEmail(email, token),
    );
  }
}
```

### With Queue (BullMQ)

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async queuePasswordResetEmail(email: string, token: string): Promise<void> {
    await this.emailQueue.add('password-reset', {
      email,
      token,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async queueWelcomeEmail(email: string, name: string): Promise<void> {
    await this.emailQueue.add('welcome', {
      email,
      name,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}

// Email Queue Processor
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './services/email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'password-reset':
        await this.emailService.sendPasswordResetEmail(
          job.data.email,
          job.data.token,
        );
        break;
      case 'welcome':
        await this.emailService.sendWelcomeEmail(
          job.data.email,
          job.data.name,
        );
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }
}
```

## Testing

### Unit Testing with Mock

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { EmailService } from './services/email.service';

describe('AuthService', () => {
  let authService: AuthService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
            sendAccountLockedEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should send password reset email', async () => {
    await authService.forgotPassword('user@test.com');

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@test.com',
      expect.any(String),
    );
  });
});
```

### Integration Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';

describe('EmailService Integration', () => {
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [EmailService],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    await emailService.onModuleInit();
  });

  it('should send actual email (requires valid SMTP config)', async () => {
    // Skip in CI/CD unless SMTP is configured
    if (process.env.CI && !process.env.SMTP_HOST) {
      return;
    }

    await expect(
      emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test',
      }),
    ).resolves.not.toThrow();
  }, 30000); // 30 second timeout
});
```

## Best Practices

1. **Error Handling**: Always wrap email sends in try-catch blocks
2. **Async Operations**: Use async/await for all email operations
3. **Don't Block**: Consider using queues for non-critical emails
4. **Privacy**: Never log full email addresses in production
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Monitoring**: Monitor email delivery success rates
7. **Testing**: Use simulation mode in development/testing
8. **Graceful Degradation**: Don't fail critical flows if email fails

## Troubleshooting

### Email not sending
1. Check environment variables are set correctly
2. Verify SMTP credentials with `healthCheck()`
3. Check firewall/network allows outbound connections on SMTP port
4. Review logs for error messages

### Gmail "Less secure app access"
- Use App Passwords instead of account password
- Enable 2FA first, then generate App Password

### SendGrid not working
- Verify API key has "Mail Send" permission
- Check sender email is verified in SendGrid dashboard
- Review SendGrid activity log for errors

### Emails going to spam
- Configure SPF, DKIM, and DMARC records
- Use a verified sender domain
- Include unsubscribe link in marketing emails
- Maintain good sender reputation
