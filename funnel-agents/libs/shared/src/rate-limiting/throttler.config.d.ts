import { ThrottlerModuleOptions } from '@nestjs/throttler';
/**
 * Rate Limiting Configurations
 *
 * Default: 100 requests per minute
 * Auth endpoints (login, register): 10 requests per minute
 * Password reset: 5 requests per hour
 * Public endpoints: 60 requests per minute
 */
export declare const RATE_LIMITS: {
    readonly DEFAULT: {
        readonly ttl: 60000;
        readonly limit: 100;
    };
    readonly AUTH_LOGIN: {
        readonly ttl: 60000;
        readonly limit: 10;
    };
    readonly AUTH_REGISTER: {
        readonly ttl: 60000;
        readonly limit: 10;
    };
    readonly PASSWORD_RESET: {
        readonly ttl: 3600000;
        readonly limit: 5;
    };
    readonly PUBLIC: {
        readonly ttl: 60000;
        readonly limit: 60;
    };
    readonly API_PROTECTED: {
        readonly ttl: 60000;
        readonly limit: 100;
    };
    readonly API_HIGH_TRAFFIC: {
        readonly ttl: 60000;
        readonly limit: 200;
    };
};
/**
 * Create throttler configuration with optional Redis storage
 */
export declare function createThrottlerConfig(useRedis?: boolean, redisUrl?: string): ThrottlerModuleOptions;
/**
 * Get Redis URL from environment
 */
export declare function getRedisUrl(): string | undefined;
