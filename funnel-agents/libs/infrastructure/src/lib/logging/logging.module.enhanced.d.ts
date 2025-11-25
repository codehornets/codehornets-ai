import { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
export declare class EnhancedLoggingModule implements NestModule {
    static forRoot(options: EnhancedLoggingModuleOptions): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
