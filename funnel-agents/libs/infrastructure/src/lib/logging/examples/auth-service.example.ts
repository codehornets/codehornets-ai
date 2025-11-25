/**
 * Example: How to integrate enhanced logging in auth-service
 *
 * This file demonstrates how to integrate the enhanced logging infrastructure
 * into a NestJS microservice. Copy and adapt these examples to your services.
 *
 * File: apps/auth-service/src/app.module.ts
 */

/*
import { Module } from '@nestjs/common';
import { EnhancedLoggingModule } from '@funnelagents/infrastructure';

@Module({
  imports: [
    // Add enhanced logging as the first import
    EnhancedLoggingModule.forRoot({
      serviceName: 'auth-service',
      level: process.env['LOG_LEVEL'] as any || 'info',
      format: process.env['LOG_FORMAT'] as any || 'json',
    }),
    // ... other imports
  ],
})
export class AppModule {}
*/

/**
 * File: apps/auth-service/src/main.ts
 *
 * Replace NestJS default logger with EnhancedLoggerService
 */

/*
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnhancedLoggerService } from '@funnelagents/infrastructure';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is attached
  });

  // Get the enhanced logger service
  const logger = app.get(EnhancedLoggerService);
  logger.setContext('Bootstrap');

  // Use enhanced logger for application
  app.useLogger(logger);

  // Add global interceptor for request/response logging
  const { EnhancedLoggingInterceptor } = await import('@funnelagents/infrastructure');
  app.useGlobalInterceptors(new EnhancedLoggingInterceptor(logger));

  await app.listen(3001);
  logger.log('Auth Service started on port 3001');
}

bootstrap();
*/

/**
 * File: apps/auth-service/src/auth.service.ts
 *
 * Example service using enhanced logger
 */

/*
import { Injectable } from '@nestjs/common';
import { EnhancedLoggerService, LogMethod } from '@funnelagents/infrastructure';

@Injectable()
export class AuthService {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger.setContext('AuthService');
  }

  @LogMethod({ slowThreshold: 500 })
  async login(email: string, password: string) {
    this.logger.log('User login attempt', { email });

    try {
      // Login logic here
      const user = await this.validateUser(email, password);

      this.logger.logAuditEvent(
        'user_login',
        'login',
        'user',
        user.id,
        { email, ip: '127.0.0.1' }
      );

      return user;
    } catch (error: any) {
      this.logger.logSecurityEvent(
        'Failed login attempt',
        'medium',
        { email, reason: error?.message || 'Unknown error' }
      );
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    const startOperation = this.logger.startOperation('validateUser');

    try {
      // Validation logic
      const user = { id: '1', email };

      startOperation(); // Logs completion with duration
      return user;
    } catch (error) {
      startOperation(); // Still logs even on error
      throw error;
    }
  }
}
*/

/**
 * File: apps/auth-service/.env
 *
 * Environment variables for logging configuration
 */

// LOG_LEVEL=debug
// LOG_FORMAT=pretty
// NODE_ENV=development
