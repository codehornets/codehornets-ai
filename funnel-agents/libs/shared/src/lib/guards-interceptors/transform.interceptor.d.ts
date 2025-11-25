import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
export declare const SKIP_TRANSFORM_KEY = "skipTransform";
/**
 * Decorator to skip response transformation
 */
export declare const SkipTransform: () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
/**
 * Response transformation interceptor
 * Wraps all responses in a standard format
 */
export declare class TransformInterceptor<T> implements NestInterceptor<T, any> {
    private readonly reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any>;
}
/**
 * Cache interceptor for GET requests
 */
export declare class CacheInterceptor implements NestInterceptor {
    private readonly reflector;
    private cache;
    private readonly defaultTtl;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private generateCacheKey;
    clearCache(pattern?: string): void;
}
/**
 * Serialization interceptor to exclude sensitive fields
 */
export declare class SerializeInterceptor implements NestInterceptor {
    private readonly sensitiveFields;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitize;
}
