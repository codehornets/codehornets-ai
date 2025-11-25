import { EnhancedLoggerService } from '../enhanced-logger.service';

/**
 * Decorator to automatically log method execution with performance tracking
 *
 * Usage:
 * ```typescript
 * @LogMethod()
 * async createUser(data: CreateUserDto) {
 *   // method implementation
 * }
 * ```
 *
 * Logs:
 * - Method start (debug level)
 * - Method completion with duration (debug level)
 * - Method errors with stack traces (error level)
 * - Performance warnings for slow methods
 */
export function LogMethod(options: { slowThreshold?: number } = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const slowThreshold = options.slowThreshold || 1000;

    descriptor.value = async function (...args: any[]) {
      // Get logger instance from the class
      const logger: EnhancedLoggerService | undefined = (this as any).logger;

      if (!logger) {
        // If no logger available, just execute the method
        return originalMethod.apply(this, args);
      }

      const className = target.constructor.name;
      const methodName = propertyKey;
      const operation = `${className}.${methodName}`;
      const startTime = Date.now();

      logger.debug(`Starting ${operation}`, { operation, args: sanitizeArgs(args) });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > slowThreshold) {
          logger.warn(`Slow method execution: ${operation}`, {
            operation,
            duration,
            threshold: slowThreshold,
            slow: true,
          });
        } else {
          logger.debug(`Completed ${operation}`, { operation, duration });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error(
          `Method failed: ${operation}`,
          error as Error,
          {
            operation,
            duration,
            args: sanitizeArgs(args),
          }
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Sanitize method arguments for logging
 * Remove sensitive data and limit size
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (arg && typeof arg === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(arg)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret')
        ) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'string' && value.length > 100) {
          sanitized[key] = `${value.substring(0, 100)}... (truncated)`;
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return arg;
  });
}
