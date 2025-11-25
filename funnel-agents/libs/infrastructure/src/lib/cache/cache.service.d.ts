import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}
export declare class CacheService implements OnModuleDestroy {
    private readonly configService;
    private redis;
    private readonly defaultTTL;
    private readonly globalPrefix;
    constructor(configService: ConfigService);
    private initializeRedis;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string, options?: CacheOptions): Promise<boolean>;
    deletePattern(pattern: string, options?: CacheOptions): Promise<number>;
    exists(key: string, options?: CacheOptions): Promise<boolean>;
    increment(key: string, by?: number, options?: CacheOptions): Promise<number>;
    decrement(key: string, by?: number, options?: CacheOptions): Promise<number>;
    setWithExpiry(key: string, value: any, seconds: number, options?: CacheOptions): Promise<boolean>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T | null>;
    clear(prefix?: string): Promise<boolean>;
    healthCheck(): Promise<boolean>;
    private buildKey;
    onModuleDestroy(): Promise<void>;
}
