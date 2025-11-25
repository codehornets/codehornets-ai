import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheEntry {
  data: any;
  expiry: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from workspace ID and filters
   */
  generateKey(prefix: string, workspaceId: string, filters: Record<string, any>): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `${prefix}:${workspaceId}:${hash}`;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.logger.debug(`Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const ttlMs = ttl || this.defaultTTL;
    const expiry = Date.now() + ttlMs;

    this.cache.set(key, { data: value, expiry });
    this.logger.debug(`Cached: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Deleted cache: ${key}`);
    }
  }

  /**
   * Delete all cache entries matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`Deleted ${deletedCount} cache entries matching: ${pattern}`);
    }
  }

  /**
   * Invalidate workspace cache
   */
  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.delPattern(`*:${workspaceId}:*`);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }
}
