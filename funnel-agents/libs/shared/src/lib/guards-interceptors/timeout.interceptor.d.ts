import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
export declare const TIMEOUT_KEY = "timeout";
/**
 * Decorator to set custom timeout for a route
 */
export declare const SetTimeout: (ms: number) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
/**
 * Request timeout interceptor
 */
export declare class TimeoutInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly defaultTimeout;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
