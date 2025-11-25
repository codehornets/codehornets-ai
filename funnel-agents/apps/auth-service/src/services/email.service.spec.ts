import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                SMTP_HOST: 'smtp.test.com',
                SMTP_PORT: 587,
                SMTP_USER: 'test@test.com',
                SMTP_PASS: 'test-password',
                SMTP_FROM: 'noreply@test.com',
                SMTP_SECURE: false,
                SMTP_REQUIRE_TLS: true,
                SMTP_REJECT_UNAUTHORIZED: true,
                FRONTEND_URL: 'http://localhost:3000',
                SUPPORT_EMAIL: 'support@test.com',
                DOCS_URL: 'https://docs.test.com',
              };
              return config[key] !== undefined ? config[key] : defaultValue;
            }),
          },
        },
      ],
    }).compile();

    // Suppress logger output during tests
    Logger.overrideLogger(['error', 'warn']);

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize SMTP transporter on module init', async () => {
      await service.onModuleInit();
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should initialize SendGrid when SENDGRID_API_KEY is provided', async () => {
      const sendGridModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'SENDGRID_API_KEY') return 'test-api-key';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      const sendGridService =
        sendGridModule.get<EmailService>(EmailService);
      await sendGridService.onModuleInit();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: 'test-api-key',
          },
        }),
      );
    });

    it('should handle initialization failure gracefully', async () => {
      mockTransporter.verify.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      const failModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  SMTP_HOST: 'invalid.smtp.com',
                  SMTP_PORT: 587,
                  SMTP_USER: 'test@test.com',
                  SMTP_PASS: 'test-password',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const failService = failModule.get<EmailService>(EmailService);
      await expect(failService.onModuleInit()).resolves.not.toThrow();

      const status = failService.getStatus();
      expect(status.simulationMode).toBe(true);
    });

    it('should run in simulation mode when no config provided', async () => {
      const noConfigModule: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const noConfigService =
        noConfigModule.get<EmailService>(EmailService);
      await noConfigService.onModuleInit();

      const status = noConfigService.getStatus();
      expect(status.simulationMode).toBe(true);
      expect(status.provider).toBe('none');
    });
  });

  describe('sendEmail', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should send email successfully with configured transporter', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test body',
        html: '<p>Test body</p>',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@test.com',
          to: 'recipient@test.com',
          subject: 'Test Subject',
          text: 'Test body',
          html: '<p>Test body</p>',
        }),
      );
    });

    it('should use text as html if html is not provided', async () => {
      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test body',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: 'Test body',
        }),
      );
    });

    it('should include replyTo when configured', async () => {
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          if (key === 'EMAIL_REPLY_TO') return 'reply@test.com';
          const config: Record<string, any> = {
            SMTP_FROM: 'noreply@test.com',
          };
          return config[key] !== undefined ? config[key] : defaultValue;
        });

      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test body',
      };

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@test.com',
        }),
      );
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('SMTP error'),
      );

      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test body',
      };

      await expect(service.sendEmail(emailOptions)).rejects.toThrow(
        'Email delivery failed',
      );
    });

    it('should simulate email when transporter not configured', async () => {
      const noConfigService = new EmailService(configService);
      // Don't call onModuleInit to leave transporter null

      const emailOptions = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test body',
      };

      await expect(
        noConfigService.sendEmail(emailOptions),
      ).resolves.not.toThrow();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should send password reset email with correct content', async () => {
      const email = 'user@test.com';
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Password Reset'),
        }),
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(token);
      expect(callArgs.html).toContain(token);
      expect(callArgs.text).toContain('http://localhost:3000/reset-password');
    });

    it('should use custom reset URL when provided', async () => {
      const email = 'user@test.com';
      const token = 'reset-token-123';
      const customUrl = 'https://custom.com';

      await service.sendPasswordResetEmail(email, token, customUrl);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('https://custom.com/reset-password');
      expect(callArgs.html).toContain('https://custom.com/reset-password');
    });

    it('should include security information in reset email', async () => {
      const email = 'user@test.com';
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(email, token);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('60 minutes');
      expect(callArgs.text).toContain('only be used once');
      expect(callArgs.html).toContain('60 minutes');
    });
  });

  describe('sendAccountLockedEmail', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should send account locked email with correct content', async () => {
      const email = 'user@test.com';

      await service.sendAccountLockedEmail(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Account Locked'),
        }),
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('15 minutes');
      expect(callArgs.text).toContain('failed login attempts');
    });

    it('should include unlock URL when provided', async () => {
      const email = 'user@test.com';
      const unlockUrl = 'http://localhost:3000/unlock-account?token=abc123';

      await service.sendAccountLockedEmail(email, unlockUrl);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(unlockUrl);
      expect(callArgs.html).toContain(unlockUrl);
    });

    it('should include support contact information', async () => {
      const email = 'user@test.com';

      await service.sendAccountLockedEmail(email);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('support@test.com');
      expect(callArgs.html).toContain('support@test.com');
    });
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should send welcome email with correct content', async () => {
      const email = 'newuser@test.com';
      const name = 'John Doe';

      await service.sendWelcomeEmail(email, name);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Welcome'),
        }),
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain(name);
      expect(callArgs.html).toContain(name);
    });

    it('should include dashboard and documentation links', async () => {
      const email = 'newuser@test.com';
      const name = 'John Doe';

      await service.sendWelcomeEmail(email, name);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('dashboard');
      expect(callArgs.text).toContain('https://docs.test.com');
      expect(callArgs.html).toContain('/dashboard');
      expect(callArgs.html).toContain('https://docs.test.com');
    });

    it('should include getting started information', async () => {
      const email = 'newuser@test.com';
      const name = 'John Doe';

      await service.sendWelcomeEmail(email, name);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('Getting Started');
      expect(callArgs.text).toContain('support@test.com');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when transporter is configured', async () => {
      await service.onModuleInit();

      const result = await service.healthCheck();

      expect(result.configured).toBe(true);
      expect(result.healthy).toBe(true);
      expect(result.provider).toBe('smtp');
      expect(result.error).toBeUndefined();
    });

    it('should return unhealthy status when transporter verification fails', async () => {
      await service.onModuleInit();
      mockTransporter.verify.mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      const result = await service.healthCheck();

      expect(result.configured).toBe(true);
      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should return not configured status when no transporter', async () => {
      const noConfigService = new EmailService(configService);

      const result = await noConfigService.healthCheck();

      expect(result.configured).toBe(false);
      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Email service not configured');
    });
  });

  describe('getStatus', () => {
    it('should return correct status when configured', async () => {
      await service.onModuleInit();

      const status = service.getStatus();

      expect(status.configured).toBe(true);
      expect(status.provider).toBe('smtp');
      expect(status.simulationMode).toBe(false);
    });

    it('should return simulation mode when not configured', () => {
      const noConfigService = new EmailService(configService);

      const status = noConfigService.getStatus();

      expect(status.configured).toBe(false);
      expect(status.provider).toBe('none');
      expect(status.simulationMode).toBe(true);
    });
  });

  describe('close', () => {
    it('should close transporter connection pool', async () => {
      await service.onModuleInit();

      await service.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should not throw when closing without transporter', async () => {
      const noConfigService = new EmailService(configService);

      await expect(noConfigService.close()).resolves.not.toThrow();
    });
  });
});
