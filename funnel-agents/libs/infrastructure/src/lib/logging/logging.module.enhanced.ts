import { Module, Global, DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { EnhancedLoggerService } from './enhanced-logger.service';
import { EnhancedLoggingInterceptor } from './logging-interceptor.enhanced';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { HttpClientLoggerInterceptor } from './http-client-logger.interceptor';
import { createPinoConfig } from './logger.config';

export interface EnhancedLoggingModuleOptions {
  serviceName: string;
  level?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  format?: 'json' | 'pretty';
}

/**
 * Enhanced Logging Module with comprehensive logging infrastructure
 *
 * Features:
 * - Structured logging with Pino
 * - Correlation ID tracking across all requests
 * - Request/Response logging with sanitization
 * - HTTP client request logging
 * - Performance monitoring
 * - Error tracking with stack traces
 * - Support for JSON and pretty formats
 * - Compatible with log aggregation tools (ELK, CloudWatch, Datadog)
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [
 *     EnhancedLoggingModule.forRoot({
 *       serviceName: 'auth-service',
 *       level: 'info',
 *       format: 'json'
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class EnhancedLoggingModule implements NestModule {
  static forRoot(options: EnhancedLoggingModuleOptions): DynamicModule {
    const { serviceName, level, format } = options;

    // Set environment variables if provided
    if (level) {
      process.env['LOG_LEVEL'] = level;
    }
    if (format) {
      process.env['LOG_FORMAT'] = format;
    }

    return {
      module: EnhancedLoggingModule,
      imports: [
        LoggerModule.forRoot(createPinoConfig(serviceName)),
      ],
      providers: [
        EnhancedLoggerService,
        EnhancedLoggingInterceptor,
        HttpClientLoggerInterceptor,
        CorrelationIdMiddleware,
      ],
      exports: [
        EnhancedLoggerService,
        EnhancedLoggingInterceptor,
        HttpClientLoggerInterceptor,
        LoggerModule,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
