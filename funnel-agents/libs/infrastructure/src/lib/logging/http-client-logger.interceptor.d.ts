import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
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
export declare class HttpClientLoggerInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: EnhancedLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitizeHeaders;
}
