import { Logger } from '@nestjs/common';

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
export function WithLock(lockKey: string | ((args: any[]) => string), options: any = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      // Get lock service from instance
      const lockService = (this as any).lockService || (this as any).distributedLockService;

      if (!lockService) {
        logger.warn(
          `@WithLock decorator used on ${target.constructor.name}.${propertyName} but no lock service found. ` +
          'Ensure DistributedLockService is injected as "lockService" or "distributedLockService".'
        );
        return originalMethod.apply(this, args);
      }

      // Resolve lock key (can be string or function)
      const resolvedKey = typeof lockKey === 'function' ? lockKey(args) : lockKey;

      // Execute with lock
      return lockService.executeWithLock(
        resolvedKey,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}
