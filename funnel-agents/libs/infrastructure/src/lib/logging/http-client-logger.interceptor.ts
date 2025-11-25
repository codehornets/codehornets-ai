import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';
import { EnhancedLoggerService } from './enhanced-logger.service';

/**
 * HTTP Client Logger Interceptor for outgoing HTTP requests
 *
 * This interceptor logs all outgoing HTTP requests made via HttpService (Axios)
 * - Logs request method, URL, and headers
 * - Logs response status, duration, and size
 * - Logs errors with details
 * - Includes correlation ID in outgoing requests
 */
@Injectable()
export class HttpClientLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger.setContext('HttpClient');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((response: AxiosResponse) => {
        const { config, status, statusText, data } = response;
        const duration = Date.now() - (config as any).metadata?.startTime || 0;

        this.logger.logHttpRequest(
          config.method?.toUpperCase() || 'GET',
          config.url || '',
          status,
          duration,
          {
            statusText,
            responseSize: data ? JSON.stringify(data).length : 0,
            headers: this.sanitizeHeaders(config.headers),
          }
        );
      }),
      catchError((error: AxiosError) => {
        const { config, response } = error;
        const duration = Date.now() - (config as any)?.metadata?.startTime || 0;

        this.logger.error(
          `HTTP request failed: ${config?.method?.toUpperCase()} ${config?.url}`,
          error,
          {
            method: config?.method?.toUpperCase(),
            url: config?.url,
            statusCode: response?.status,
            duration,
            errorMessage: error.message,
            errorCode: error.code,
          }
        );

        throw error;
      })
    );
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
