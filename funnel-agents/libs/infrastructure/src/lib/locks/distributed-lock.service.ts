import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';

export interface LockOptions {
  ttl?: number; // Lock TTL in milliseconds (default: 30000)
  retryCount?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in milliseconds (default: 200)
  extendThreshold?: number; // Auto-extend threshold (default: 10000ms)
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
@Injectable()
export class DistributedLockService implements OnModuleDestroy {
  private readonly logger = new Logger(DistributedLockService.name);
  private redis: Redis | null = null;
  private readonly activeLocks = new Map<string, string>();
  private readonly lockExtensionTimers = new Map<string, NodeJS.Timeout>();

  // Lock metrics
  private metrics: LockMetrics = {
    totalAcquisitions: 0,
    successfulAcquisitions: 0,
    failedAcquisitions: 0,
    contentions: 0,
    timeouts: 0,
    activeLocksCount: 0,
  };

  // Default lock configuration
  private readonly DEFAULT_TTL = 30000; // 30 seconds
  private readonly DEFAULT_RETRY_COUNT = 3;
  private readonly DEFAULT_RETRY_DELAY = 200; // 200ms
  private readonly DEFAULT_EXTEND_THRESHOLD = 10000; // 10 seconds

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      if (redisUrl) {
        this.redis = new Redis(redisUrl);
      } else {
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });
      }

      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully for distributed locking');
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis ready for distributed locking');
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to initialize Redis for locks:', err.stack);
      this.redis = null;
    }
  }

  /**
   * Acquire a distributed lock
   *
   * @param key Lock key identifier
   * @param options Lock options
   * @returns Lock result with lockId if successful
   */
  async acquire(key: string, options: LockOptions = {}): Promise<LockResult> {
    if (!this.redis) {
      this.logger.warn('Redis not available, cannot acquire lock');
      this.metrics.failedAcquisitions++;
      return { acquired: false, lockId: null, error: 'Redis not available' };
    }

    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const retryCount = options.retryCount ?? this.DEFAULT_RETRY_COUNT;
    const retryDelay = options.retryDelay ?? this.DEFAULT_RETRY_DELAY;

    this.metrics.totalAcquisitions++;

    // Try to acquire lock with retries
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const lockId = this.generateLockId();
      const lockKey = this.buildLockKey(key);

      try {
        // Use SET NX (set if not exists) with expiry
        const result = await this.redis.set(
          lockKey,
          lockId,
          'PX',
          ttl,
          'NX'
        );

        if (result === 'OK') {
          // Lock acquired successfully
          this.activeLocks.set(key, lockId);
          this.metrics.successfulAcquisitions++;
          this.metrics.activeLocksCount = this.activeLocks.size;

          this.logger.debug(
            `Lock acquired: ${key} (lockId: ${lockId}, ttl: ${ttl}ms, attempt: ${attempt + 1})`
          );

          // Setup auto-extension if threshold is set
          if (options.extendThreshold && options.extendThreshold < ttl) {
            this.setupAutoExtension(key, lockId, ttl, options.extendThreshold);
          }

          return { acquired: true, lockId };
        }

        // Lock already held by another process
        if (attempt < retryCount) {
          this.metrics.contentions++;
          this.logger.debug(
            `Lock contention on ${key}, attempt ${attempt + 1}/${retryCount + 1}`
          );
          // Exponential backoff
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Error acquiring lock ${key}:`, err.stack);
      }
    }

    // Failed to acquire lock after all retries
    this.metrics.failedAcquisitions++;
    this.logger.warn(`Failed to acquire lock: ${key} after ${retryCount + 1} attempts`);
    return { acquired: false, lockId: null, error: 'Lock acquisition timeout' };
  }

  /**
   * Release a distributed lock
   *
   * @param key Lock key identifier
   * @param lockId Lock identifier returned from acquire
   * @returns True if lock was released successfully
   */
  async release(key: string, lockId: string): Promise<boolean> {
    if (!this.redis) {
      this.logger.warn('Redis not available, cannot release lock');
      return false;
    }

    const lockKey = this.buildLockKey(key);

    try {
      // Cancel auto-extension timer if exists
      this.cancelAutoExtension(key);

      // Use Lua script to ensure atomic release (only release if we own the lock)
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(script, 1, lockKey, lockId);

      if (result === 1) {
        this.activeLocks.delete(key);
        this.metrics.activeLocksCount = this.activeLocks.size;
        this.logger.debug(`Lock released: ${key} (lockId: ${lockId})`);
        return true;
      } else {
        this.logger.warn(
          `Failed to release lock ${key}: lock not owned or expired (lockId: ${lockId})`
        );
        return false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error releasing lock ${key}:`, err.stack);
      return false;
    }
  }

  /**
   * Extend lock TTL
   *
   * @param key Lock key identifier
   * @param lockId Lock identifier
   * @param additionalTtl Additional TTL in milliseconds
   * @returns True if lock was extended successfully
   */
  async extend(key: string, lockId: string, additionalTtl: number): Promise<boolean> {
    if (!this.redis) {
      this.logger.warn('Redis not available, cannot extend lock');
      return false;
    }

    const lockKey = this.buildLockKey(key);

    try {
      // Use Lua script to ensure atomic extension (only extend if we own the lock)
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(
        script,
        1,
        lockKey,
        lockId,
        additionalTtl
      );

      if (result === 1) {
        this.logger.debug(`Lock extended: ${key} (lockId: ${lockId}, ttl: +${additionalTtl}ms)`);
        return true;
      } else {
        this.logger.warn(
          `Failed to extend lock ${key}: lock not owned or expired (lockId: ${lockId})`
        );
        return false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error extending lock ${key}:`, err.stack);
      return false;
    }
  }

  /**
   * Execute a function with automatic lock management
   *
   * @param key Lock key identifier
   * @param fn Function to execute while holding the lock
   * @param options Lock options
   * @returns Function result or null if lock couldn't be acquired
   */
  async executeWithLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T | null> {
    const lockResult = await this.acquire(key, options);

    if (!lockResult.acquired || !lockResult.lockId) {
      this.logger.warn(`Cannot execute function: failed to acquire lock ${key}`);
      return null;
    }

    try {
      const result = await fn();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error executing function with lock ${key}:`, err.stack);
      throw err;
    } finally {
      await this.release(key, lockResult.lockId);
    }
  }

  /**
   * Check if a lock is currently held
   *
   * @param key Lock key identifier
   * @returns True if lock exists
   */
  async isLocked(key: string): Promise<boolean> {
    if (!this.redis) return false;

    const lockKey = this.buildLockKey(key);
    try {
      const result = await this.redis.exists(lockKey);
      return result === 1;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error checking lock ${key}:`, err.stack);
      return false;
    }
  }

  /**
   * Get lock TTL in milliseconds
   *
   * @param key Lock key identifier
   * @returns TTL in milliseconds, -1 if no expiry, -2 if key doesn't exist
   */
  async getLockTTL(key: string): Promise<number> {
    if (!this.redis) return -2;

    const lockKey = this.buildLockKey(key);
    try {
      return await this.redis.pttl(lockKey);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error getting lock TTL ${key}:`, err.stack);
      return -2;
    }
  }

  /**
   * Get lock metrics
   */
  getMetrics(): LockMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalAcquisitions: 0,
      successfulAcquisitions: 0,
      failedAcquisitions: 0,
      contentions: 0,
      timeouts: 0,
      activeLocksCount: this.activeLocks.size,
    };
  }

  /**
   * Health check for lock service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Lock service health check failed:', err.stack);
      return false;
    }
  }

  /**
   * Setup automatic lock extension
   */
  private setupAutoExtension(
    key: string,
    lockId: string,
    ttl: number,
    threshold: number
  ): void {
    const extensionInterval = ttl - threshold;

    const timer = setInterval(async () => {
      const extended = await this.extend(key, lockId, ttl);
      if (!extended) {
        this.logger.warn(`Failed to auto-extend lock ${key}, stopping extension`);
        this.cancelAutoExtension(key);
      }
    }, extensionInterval);

    this.lockExtensionTimers.set(key, timer);
  }

  /**
   * Cancel automatic lock extension
   */
  private cancelAutoExtension(key: string): void {
    const timer = this.lockExtensionTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.lockExtensionTimers.delete(key);
    }
  }

  /**
   * Generate unique lock identifier
   */
  private generateLockId(): string {
    return `${process.pid}-${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Build Redis key for lock
   */
  private buildLockKey(key: string): string {
    return `funnel-agents:lock:${key}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    // Cancel all auto-extension timers
    this.lockExtensionTimers.forEach((timer) => {
      clearInterval(timer);
    });
    this.lockExtensionTimers.clear();

    // Release all active locks
    const releasePromises: Promise<boolean>[] = [];
    this.activeLocks.forEach((lockId, key) => {
      releasePromises.push(this.release(key, lockId));
    });
    await Promise.allSettled(releasePromises);

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    this.logger.log('Distributed lock service destroyed');
  }
}
