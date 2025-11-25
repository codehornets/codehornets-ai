import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Custom Throttler Guard with enhanced error messages
 * and support for different rate limits per IP
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = `${request.method} ${request.path}`;
    const ip = await this.getTracker(request);

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded',
        error: 'Too Many Requests',
        details: {
          message: 'You have exceeded the rate limit for this endpoint. Please try again later.',
          endpoint,
          ip,
          retryAfter: '60 seconds',
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected getTrackerKey(tracker: string): string {
    // Override to add custom prefix
    return `throttle:${tracker}`;
  }
}

/**
 * Strict Throttler Guard for sensitive endpoints
 */
@Injectable()
export class StrictThrottlerGuard extends CustomThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = `${request.method} ${request.path}`;

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many authentication attempts',
        error: 'Too Many Requests',
        details: {
          message:
            'You have made too many attempts. For security reasons, please wait before trying again.',
          endpoint,
          retryAfter: '60 seconds',
        },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
