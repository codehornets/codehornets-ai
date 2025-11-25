import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const THROTTLE_KEY = "throttle";
export declare const SKIP_THROTTLE_KEY = "skipThrottle";
export interface ThrottleOptions {
    ttl: number;
    limit: number;
}
export declare const Throttle: (options: ThrottleOptions) => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
export declare const SkipThrottle: () => (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => any;
/**
 * Rate limiting guard
 */
export declare class ThrottleGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private generateKey;
    private checkRateLimit;
}
