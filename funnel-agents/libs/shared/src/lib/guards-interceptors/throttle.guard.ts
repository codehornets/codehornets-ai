import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT } from '../constants';

export const THROTTLE_KEY = 'throttle';
export const SKIP_THROTTLE_KEY = 'skipThrottle';

export interface ThrottleOptions {
  ttl: number; // Time window in seconds
  limit: number; // Max requests in time window
}

export const Throttle = (options: ThrottleOptions) =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(THROTTLE_KEY, options, descriptor?.value ?? target);
    return descriptor ?? target;
  };

export const SkipThrottle = () =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_THROTTLE_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };

/**
 * In-memory rate limiter storage (replace with Redis for production)
 */
interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Rate limiting guard
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if throttling should be skipped
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    // Get throttle options from decorator or use defaults
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? {
      ttl: RATE_LIMIT.DEFAULT_TTL,
      limit: RATE_LIMIT.DEFAULT_LIMIT,
    };

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const key = this.generateKey(request);

    const { allowed, remaining, resetTime } = this.checkRateLimit(key, options);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', options.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', resetTime);

    if (!allowed) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds.`,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private generateKey(request: any): string {
    // Use IP address and optionally user ID for rate limiting
    const ip = request.ip || request.connection.remoteAddress;
    const userId = request.user?.sub ?? request.user?.id ?? 'anonymous';
    const path = request.route?.path ?? request.path;
    return `rate_limit:${ip}:${userId}:${path}`;
  }

  private checkRateLimit(
    key: string,
    options: ThrottleOptions
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = options.ttl * 1000;
    const record = rateLimitStore.get(key);

    if (!record || now - record.firstRequest >= windowMs) {
      // Start new window
      rateLimitStore.set(key, { count: 1, firstRequest: now });
      return {
        allowed: true,
        remaining: options.limit - 1,
        resetTime: now + windowMs,
      };
    }

    if (record.count >= options.limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.firstRequest + windowMs,
      };
    }

    // Increment counter
    record.count++;
    return {
      allowed: true,
      remaining: options.limit - record.count,
      resetTime: record.firstRequest + windowMs,
    };
  }
}

// Cleanup old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.firstRequest > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Run every minute
