import { ThrottlerModuleOptions } from '@nestjs/throttler';
// import { ThrottlerStorageRedisService } from '@nestjs/throttler/dist/throttler-storage-redis.service';
// import Redis from 'ioredis';

/**
 * Rate Limiting Configurations
 *
 * Default: 100 requests per minute
 * Auth endpoints (login, register): 10 requests per minute
 * Password reset: 5 requests per hour
 * Public endpoints: 60 requests per minute
 */

export const RATE_LIMITS = {
  // Default global limit
  DEFAULT: {
    ttl: 60000, // 1 minute in milliseconds
    limit: 100,
  },

  // Auth endpoints - strict limits
  AUTH_LOGIN: {
    ttl: 60000, // 1 minute
    limit: 10,
  },

  AUTH_REGISTER: {
    ttl: 60000, // 1 minute
    limit: 10,
  },

  // Password reset - very strict
  PASSWORD_RESET: {
    ttl: 3600000, // 1 hour
    limit: 5,
  },

  // Public endpoints - moderate limits
  PUBLIC: {
    ttl: 60000, // 1 minute
    limit: 60,
  },

  // Protected API endpoints
  API_PROTECTED: {
    ttl: 60000, // 1 minute
    limit: 100,
  },

  // High-throughput endpoints
  API_HIGH_TRAFFIC: {
    ttl: 60000, // 1 minute
    limit: 200,
  },
} as const;

/**
 * Create throttler configuration with optional Redis storage
 */
export function createThrottlerConfig(
  useRedis = true,
  redisUrl?: string
): ThrottlerModuleOptions {
  const baseConfig: ThrottlerModuleOptions = {
    throttlers: [RATE_LIMITS.DEFAULT],
  };

  // Redis storage is not available in @nestjs/throttler v5
  // To use Redis, install @nestjs/throttler-storage-redis separately
  // if (useRedis && redisUrl) {
  //   try {
  //     const redis = new Redis(redisUrl, {
  //       maxRetriesPerRequest: 3,
  //       retryStrategy: (times) => {
  //         if (times > 3) {
  //           console.warn('Redis connection failed, falling back to memory storage');
  //           return null;
  //         }
  //         return Math.min(times * 100, 3000);
  //       },
  //     });

  //     return {
  //       ...baseConfig,
  //       storage: new ThrottlerStorageRedisService(redis),
  //     };
  //   } catch (error) {
  //     console.warn('Failed to initialize Redis throttler storage, using memory:', error);
  //     return baseConfig;
  //   }
  // }

  return baseConfig;
}

/**
 * Get Redis URL from environment
 */
export function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL ||
         (process.env.REDIS_HOST
           ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
           : undefined);
}
