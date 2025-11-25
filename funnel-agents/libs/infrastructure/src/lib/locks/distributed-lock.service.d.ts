import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface LockOptions {
    ttl?: number;
    retryCount?: number;
    retryDelay?: number;
    extendThreshold?: number;
}
export interface LockResult {
    acquired: boolean;
    lockId: string | null;
    error?: string;
}
export interface LockMetrics {
    totalAcquisitions: number;
    successfulAcquisitions: number;
    failedAcquisitions: number;
    contentions: number;
    timeouts: number;
    activeLocksCount: number;
}
/**
 * Distributed Lock Service using Redis
 * Implements the Redlock algorithm for distributed locking
 *
 * Features:
 * - Automatic lock expiration to prevent deadlocks
 * - Lock extension for long-running tasks
 * - Retry mechanism with exponential backoff
 * - Comprehensive metrics and monitoring
 * - Graceful degradation when Redis is unavailable
 */
export declare class DistributedLockService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    private readonly activeLocks;
    private readonly lockExtensionTimers;
    private metrics;
    private readonly DEFAULT_TTL;
    private readonly DEFAULT_RETRY_COUNT;
    private readonly DEFAULT_RETRY_DELAY;
    private readonly DEFAULT_EXTEND_THRESHOLD;
    constructor(configService: ConfigService);
    /**
     * Initialize Redis connection
     */
    private initializeRedis;
    /**
     * Acquire a distributed lock
     *
     * @param key Lock key identifier
     * @param options Lock options
     * @returns Lock result with lockId if successful
     */
    acquire(key: string, options?: LockOptions): Promise<LockResult>;
    /**
     * Release a distributed lock
     *
     * @param key Lock key identifier
     * @param lockId Lock identifier returned from acquire
     * @returns True if lock was released successfully
     */
    release(key: string, lockId: string): Promise<boolean>;
    /**
     * Extend lock TTL
     *
     * @param key Lock key identifier
     * @param lockId Lock identifier
     * @param additionalTtl Additional TTL in milliseconds
     * @returns True if lock was extended successfully
     */
    extend(key: string, lockId: string, additionalTtl: number): Promise<boolean>;
    /**
     * Execute a function with automatic lock management
     *
     * @param key Lock key identifier
     * @param fn Function to execute while holding the lock
     * @param options Lock options
     * @returns Function result or null if lock couldn't be acquired
     */
    executeWithLock<T>(key: string, fn: () => Promise<T>, options?: LockOptions): Promise<T | null>;
    /**
     * Check if a lock is currently held
     *
     * @param key Lock key identifier
     * @returns True if lock exists
     */
    isLocked(key: string): Promise<boolean>;
    /**
     * Get lock TTL in milliseconds
     *
     * @param key Lock key identifier
     * @returns TTL in milliseconds, -1 if no expiry, -2 if key doesn't exist
     */
    getLockTTL(key: string): Promise<number>;
    /**
     * Get lock metrics
     */
    getMetrics(): LockMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Health check for lock service
     */
    healthCheck(): Promise<boolean>;
    /**
     * Setup automatic lock extension
     */
    private setupAutoExtension;
    /**
     * Cancel automatic lock extension
     */
    private cancelAutoExtension;
    /**
     * Generate unique lock identifier
     */
    private generateLockId;
    /**
     * Build Redis key for lock
     */
    private buildLockKey;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Cleanup on module destroy
     */
    onModuleDestroy(): Promise<void>;
}
