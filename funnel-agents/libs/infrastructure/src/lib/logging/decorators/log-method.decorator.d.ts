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
export declare function LogMethod(options?: {
    slowThreshold?: number;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
