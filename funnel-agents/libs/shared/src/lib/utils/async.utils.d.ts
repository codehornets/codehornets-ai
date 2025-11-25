/**
 * Async utility functions
 */
/**
 * Sleep/delay for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry an async operation with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: unknown) => void;
}): Promise<T>;
/**
 * Execute promises with concurrency limit
 */
export declare function parallelLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
/**
 * Execute promises in batches
 */
export declare function batch<T, R>(items: T[], batchSize: number, fn: (batch: T[]) => Promise<R[]>): Promise<R[]>;
/**
 * Timeout wrapper for promises
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
/**
 * Debounce async function
 */
export declare function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, delayMs: number): T;
/**
 * Throttle async function
 */
export declare function throttleAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, limitMs: number): T;
/**
 * Memoize async function with optional TTL
 */
export declare function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, options?: {
    ttlMs?: number;
    keyFn?: (...args: unknown[]) => string;
}): T;
