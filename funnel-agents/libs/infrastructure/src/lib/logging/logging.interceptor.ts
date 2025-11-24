import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const correlationId = headers['x-correlation-id'] ?? uuidv4();
    const startTime = Date.now();

    // Add correlation ID to request
    request.correlationId = correlationId;

    this.logger.log(`Incoming ${method} ${url}`, {
      correlationId,
      method,
      url,
      body: this.sanitizeBody(body),
      userAgent: headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.logger.log(`Completed ${method} ${url}`, {
            correlationId,
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          this.logger.error(`Failed ${method} ${url}`, error.stack, {
            correlationId,
            method,
            url,
            error: error.message,
            statusCode: error.status ?? 500,
            duration: `${duration}ms`,
          });
        },
      })
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
