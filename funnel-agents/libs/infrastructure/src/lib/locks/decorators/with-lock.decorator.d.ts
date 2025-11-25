/**
 * Method decorator for automatic distributed lock management
 *
 * Usage:
 * @WithLock('my-lock-key', { ttl: 30000 })
 * async myMethod() { ... }
 *
 * @param lockKey Lock key identifier
 * @param options Lock options
 */
export declare function WithLock(lockKey: string | ((args: any[]) => string), options?: any): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
