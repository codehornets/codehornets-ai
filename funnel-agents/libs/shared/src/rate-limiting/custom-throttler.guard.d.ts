import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
/**
 * Custom Throttler Guard with enhanced error messages
 * and support for different rate limits per IP
 */
export declare class CustomThrottlerGuard extends ThrottlerGuard {
    protected throwThrottlingException(context: ExecutionContext): Promise<void>;
    protected getTracker(req: Record<string, any>): Promise<string>;
    protected getTrackerKey(tracker: string): string;
}
/**
 * Strict Throttler Guard for sensitive endpoints
 */
export declare class StrictThrottlerGuard extends CustomThrottlerGuard {
    protected throwThrottlingException(context: ExecutionContext): Promise<void>;
}
