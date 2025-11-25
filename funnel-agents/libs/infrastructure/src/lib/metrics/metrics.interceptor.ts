import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const startTime = Date.now();
    const method = request.method;
    const path = request.route?.path || request.url;

    // Get request size
    const requestSize = request.headers['content-length']
      ? parseInt(request.headers['content-length'], 10)
      : 0;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        const responseSize = parseInt(response.get('content-length') || '0', 10);

        // Record HTTP metrics
        this.metricsService.recordHttpRequest(
          method,
          path,
          statusCode,
          duration,
          requestSize,
          responseSize,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Record HTTP metrics for errors
        this.metricsService.recordHttpRequest(method, path, statusCode, duration, requestSize, 0);

        return throwError(() => error);
      }),
    );
  }
}
