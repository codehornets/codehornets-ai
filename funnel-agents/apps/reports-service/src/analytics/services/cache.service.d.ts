export declare class CacheService {
    private readonly logger;
    private cache;
    private readonly defaultTTL;
    /**
     * Generate cache key from workspace ID and filters
     */
    generateKey(prefix: string, workspaceId: string, filters: Record<string, any>): string;
    /**
     * Get cached value
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached value
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    /**
     * Delete cached value
     */
    del(key: string): Promise<void>;
    /**
     * Delete all cache entries matching a pattern
     */
    delPattern(pattern: string): Promise<void>;
    /**
     * Invalidate workspace cache
     */
    invalidateWorkspace(workspaceId: string): Promise<void>;
    /**
     * Clear all cache
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Cleanup expired entries (should be called periodically)
     */
    cleanup(): void;
}
