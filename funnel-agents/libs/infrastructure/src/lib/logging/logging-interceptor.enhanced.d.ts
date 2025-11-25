import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { EnhancedLoggerService } from './enhanced-logger.service';
/**
 * Enhanced Logging Interceptor with automatic request/response logging
 *
 * Features:
 * - Logs all incoming requests with metadata
 * - Logs all outgoing responses with status and duration
 * - Logs all errors with stack traces
 * - Automatically includes correlation ID
 * - Sanitizes sensitive data
 * - Tracks request duration
 * - Supports both HTTP and RPC contexts
 */
export declare class EnhancedLoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: EnhancedLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private handleHttpRequest;
    private handleRpcRequest;
}
