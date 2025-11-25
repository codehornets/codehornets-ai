import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { getRequestContext, getCorrelationId } from './correlation-id.middleware';
import { sanitizeObject } from './logger.config';

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
@Injectable({ scope: Scope.TRANSIENT })
export class EnhancedLoggerService implements LoggerService {
  private context?: string;

  constructor(private readonly pinoLogger: PinoLogger) {}

  setContext(context: string): void {
    this.context = context;
    this.pinoLogger.setContext(context);
  }

  /**
   * Log informational messages
   */
  log(message: string, metadata?: LogMetadata): void {
    this.pinoLogger.info(this.enrichMetadata(metadata), message);
  }

  /**
   * Log error messages with stack traces
   */
  error(message: string, trace?: string | Error, metadata?: LogMetadata): void {
    const enriched = this.enrichMetadata(metadata);

    if (trace instanceof Error) {
      enriched.error = {
        name: trace.name,
        message: trace.message,
        stack: trace.stack,
        code: (trace as any).code,
        statusCode: (trace as any).statusCode,
      };
    } else if (trace) {
      enriched.stack = trace;
    }

    this.pinoLogger.error(enriched, message);
  }

  /**
   * Log warning messages
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.pinoLogger.warn(this.enrichMetadata(metadata), message);
  }

  /**
   * Log debug messages (disabled in production by default)
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.pinoLogger.debug(this.enrichMetadata(metadata), message);
  }

  /**
   * Log verbose/trace messages
   */
  verbose(message: string, metadata?: LogMetadata): void {
    this.pinoLogger.trace(this.enrichMetadata(metadata), message);
  }

  /**
   * Log fatal errors (will typically exit the process)
   */
  fatal(message: string, metadata?: LogMetadata): void {
    this.pinoLogger.fatal(this.enrichMetadata(metadata), message);
  }

  /**
   * Log the start of an operation for performance tracking
   */
  startOperation(operation: string, metadata?: LogMetadata): () => void {
    const startTime = Date.now();
    this.debug(`Starting ${operation}`, { ...metadata, operation });

    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Completed ${operation}`, {
        ...metadata,
        operation,
        duration,
      });
    };
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: LogMetadata): void {
    const level = duration > 1000 ? 'warn' : 'info';
    const message = `${operation} took ${duration}ms`;

    if (level === 'warn') {
      this.warn(message, { ...metadata, operation, duration, slow: true });
    } else {
      this.log(message, { ...metadata, operation, duration });
    }
  }

  /**
   * Log database query performance
   */
  logQuery(query: string, duration: number, metadata?: LogMetadata): void {
    const sanitizedQuery = query.length > 200 ? `${query.substring(0, 200)}...` : query;

    this.debug('Database query executed', {
      ...metadata,
      query: sanitizedQuery,
      duration,
      slow: duration > 100,
    });
  }

  /**
   * Log HTTP client requests
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: LogMetadata
  ): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const message = `HTTP ${method} ${url} -> ${statusCode} (${duration}ms)`;

    if (level === 'warn') {
      this.warn(message, { ...metadata, method, url, statusCode, duration });
    } else {
      this.log(message, { ...metadata, method, url, statusCode, duration });
    }
  }

  /**
   * Log business events for audit trail
   */
  logAuditEvent(
    event: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: LogMetadata
  ): void {
    this.log(`Audit: ${action} ${resourceType}`, {
      ...metadata,
      event,
      action,
      resourceType,
      resourceId,
      audit: true,
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: LogMetadata
  ): void {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    const message = `Security Event: ${event}`;

    if (level === 'error') {
      this.error(message, undefined, { ...metadata, event, severity, security: true });
    } else {
      this.warn(message, { ...metadata, event, severity, security: true });
    }
  }

  /**
   * Log external service integration events
   */
  logIntegration(
    service: string,
    operation: string,
    success: boolean,
    duration: number,
    metadata?: LogMetadata
  ): void {
    const message = `Integration: ${service} ${operation} ${success ? 'succeeded' : 'failed'}`;

    if (success) {
      this.log(message, { ...metadata, service, operation, success, duration });
    } else {
      this.warn(message, { ...metadata, service, operation, success, duration });
    }
  }

  /**
   * Enrich metadata with request context and correlation ID
   */
  private enrichMetadata(metadata?: LogMetadata): any {
    const context = getRequestContext();
    const correlationId = getCorrelationId() || metadata?.correlationId;

    const enriched: any = {
      context: this.context,
      correlationId,
      ...context,
      ...metadata,
    };

    // Sanitize sensitive data
    return sanitizeObject(enriched);
  }

  /**
   * Get the underlying Pino logger instance for advanced usage
   */
  getPinoLogger() {
    return this.pinoLogger;
  }
}
