import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis: Redis | null = null;
  private readonly defaultTTL = 3600; // 1 hour
  private readonly globalPrefix = 'funnel-agents:';

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

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
        console.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl ?? this.defaultTTL;

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      await this.redis.del(fullKey);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullPattern = this.buildKey(pattern, options?.prefix);
      const keys = await this.redis.keys(fullPattern);
      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(...keys);
      return deleted;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, by: number = 1, options?: CacheOptions): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.incrby(fullKey, by);

      if (options?.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }

      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1, options?: CacheOptions): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.decrby(fullKey, by);

      if (options?.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }

      return value;
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  async setWithExpiry(key: string, value: any, seconds: number, options?: CacheOptions): Promise<boolean> {
    return this.set(key, value, { ...options, ttl: seconds });
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T | null> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await factory();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      return null;
    }
  }

  async clear(prefix?: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const pattern = prefix ? this.buildKey('*', prefix) : `${this.globalPrefix}*`;
      await this.deletePattern(pattern);
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const parts = [this.globalPrefix];
    if (prefix) parts.push(prefix);
    parts.push(key);
    return parts.join(':');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
