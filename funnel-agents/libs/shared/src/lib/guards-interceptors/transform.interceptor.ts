import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Decorator to skip response transformation
 */
export const SkipTransform = () =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };

/**
 * Response transformation interceptor
 * Wraps all responses in a standard format
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard format, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap data in standard response format
        return {
          success: true,
          data,
        };
      })
    );
  }
}

/**
 * Cache interceptor for GET requests
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly defaultTtl = 60000; // 1 minute

  constructor(private readonly reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < this.defaultTtl) {
      return new Observable((subscriber) => {
        subscriber.next(cachedResponse.data);
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      map((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      })
    );
  }

  private generateCacheKey(request: any): string {
    const { url, user } = request;
    const userId = user?.sub ?? user?.id ?? 'anonymous';
    return `cache:${url}:${userId}`;
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Serialization interceptor to exclude sensitive fields
 */
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  private readonly sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.sanitize(data))
    );
  }

  private sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {};

      for (const key in data) {
        if (this.sensitiveFields.includes(key.toLowerCase())) {
          continue; // Skip sensitive fields
        }

        const value = data[key];

        if (value instanceof Date) {
          sanitized[key] = value.toISOString();
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    }

    return data;
  }
}
