import { LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
export interface LogMetadata {
    correlationId?: string;
    requestId?: string;
    userId?: string;
    operation?: string;
    duration?: number;
    error?: Error;
    [key: string]: any;
}
/**
 * Enhanced Logger Service with correlation ID tracking and structured logging
 *
 * Features:
 * - Automatic correlation ID injection
 * - Request context tracking
 * - Sensitive data sanitization
 * - Structured logging format
 * - Performance monitoring
 * - Error tracking with stack traces
 */
export declare class EnhancedLoggerService implements LoggerService {
    private readonly pinoLogger;
    private context?;
    constructor(pinoLogger: PinoLogger);
    setContext(context: string): void;
    /**
     * Log informational messages
     */
    log(message: string, metadata?: LogMetadata): void;
    /**
     * Log error messages with stack traces
     */
    error(message: string, trace?: string | Error, metadata?: LogMetadata): void;
    /**
     * Log warning messages
     */
    warn(message: string, metadata?: LogMetadata): void;
    /**
     * Log debug messages (disabled in production by default)
     */
    debug(message: string, metadata?: LogMetadata): void;
    /**
     * Log verbose/trace messages
     */
    verbose(message: string, metadata?: LogMetadata): void;
    /**
     * Log fatal errors (will typically exit the process)
     */
    fatal(message: string, metadata?: LogMetadata): void;
    /**
     * Log the start of an operation for performance tracking
     */
    startOperation(operation: string, metadata?: LogMetadata): () => void;
    /**
     * Log performance metrics
     */
    logPerformance(operation: string, duration: number, metadata?: LogMetadata): void;
    /**
     * Log database query performance
     */
    logQuery(query: string, duration: number, metadata?: LogMetadata): void;
    /**
     * Log HTTP client requests
     */
    logHttpRequest(method: string, url: string, statusCode: number, duration: number, metadata?: LogMetadata): void;
    /**
     * Log business events for audit trail
     */
    logAuditEvent(event: string, action: string, resourceType: string, resourceId: string, metadata?: LogMetadata): void;
    /**
     * Log security events
     */
    logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: LogMetadata): void;
    /**
     * Log external service integration events
     */
    logIntegration(service: string, operation: string, success: boolean, duration: number, metadata?: LogMetadata): void;
    /**
     * Enrich metadata with request context and correlation ID
     */
    private enrichMetadata;
    /**
     * Get the underlying Pino logger instance for advanced usage
     */
    getPinoLogger(): PinoLogger;
}
