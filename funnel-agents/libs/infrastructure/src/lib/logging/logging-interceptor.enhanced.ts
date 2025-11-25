import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { EnhancedLoggerService } from './enhanced-logger.service';
import { getCorrelationId, getRequestId } from './correlation-id.middleware';

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
@Injectable()
export class EnhancedLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    if (contextType === 'http') {
      return this.handleHttpRequest(context, next);
    } else if (contextType === 'rpc') {
      return this.handleRpcRequest(context, next);
    }

    return next.handle();
  }

  private handleHttpRequest(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, headers } = request;
    const correlationId = getCorrelationId();
    const requestId = getRequestId();
    const startTime = Date.now();

    // Extract user information if available
    const userId = request.user?.id;
    const userEmail = request.user?.email;

    // Log incoming request
    this.logger.log(`Incoming request: ${method} ${url}`, {
      correlationId,
      requestId,
      method,
      url,
      params,
      query,
      bodySize: body ? JSON.stringify(body).length : 0,
      userAgent: headers['user-agent'],
      userId,
      userEmail,
      ip: request.ip,
      type: 'request',
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.log(`Request completed: ${method} ${url}`, {
            correlationId,
            requestId,
            method,
            url,
            statusCode,
            duration,
            userId,
            userEmail,
            responseSize: data ? JSON.stringify(data).length : 0,
            type: 'response',
            success: true,
          });

          // Log performance warning for slow requests
          if (duration > 1000) {
            this.logger.warn(`Slow request detected: ${method} ${url}`, {
              correlationId,
              requestId,
              method,
              url,
              duration,
              threshold: 1000,
              type: 'performance',
            });
          }
        },
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;

        // Log error
        this.logger.error(
          `Request failed: ${method} ${url}`,
          error,
          {
            correlationId,
            requestId,
            method,
            url,
            statusCode,
            duration,
            userId,
            userEmail,
            errorName: error.name,
            errorMessage: error.message,
            type: 'error',
            success: false,
          }
        );

        return throwError(() => error);
      })
    );
  }

  private handleRpcRequest(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();
    const pattern = context.getHandler().name;
    const startTime = Date.now();

    // Log incoming RPC request
    this.logger.log(`Incoming RPC request: ${pattern}`, {
      pattern,
      dataSize: data ? JSON.stringify(data).length : 0,
      type: 'rpc-request',
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          // Log successful RPC response
          this.logger.log(`RPC request completed: ${pattern}`, {
            pattern,
            duration,
            type: 'rpc-response',
            success: true,
          });
        },
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log RPC error
        this.logger.error(
          `RPC request failed: ${pattern}`,
          error,
          {
            pattern,
            duration,
            errorName: error.name,
            errorMessage: error.message,
            type: 'rpc-error',
            success: false,
          }
        );

        return throwError(() => error);
      })
    );
  }
}
