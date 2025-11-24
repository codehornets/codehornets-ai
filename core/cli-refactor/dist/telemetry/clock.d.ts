/**
 * Clock Module
 *
 * Provides time synchronization utilities for telemetry.
 * The AnchoredClock combines wall-clock time with monotonic time for accurate
 * duration measurements while maintaining epoch-based timestamps.
 *
 * This is particularly important for distributed tracing where:
 * 1. Span timestamps need to be comparable across services
 * 2. Duration calculations must be accurate even if system clock changes
 */
import type { Clock, MonotonicClock, AnchoredClockConfig } from './types.js';
/**
 * Default implementation of a wall clock using Date.now().
 */
export declare const defaultWallClock: Clock;
/**
 * Default implementation of a monotonic clock using performance.now().
 * Falls back to Date.now() if performance API is unavailable.
 */
export declare const defaultMonotonicClock: MonotonicClock;
/**
 * AnchoredClock provides time synchronization for distributed tracing.
 *
 * It anchors a wall-clock reading to a monotonic clock reading at construction time,
 * then uses the monotonic clock for subsequent readings. This ensures:
 *
 * 1. Timestamps are based on wall-clock time (comparable across services)
 * 2. Duration measurements are accurate even if system clock is adjusted
 * 3. Time only moves forward (monotonic guarantee)
 *
 * @example
 * ```typescript
 * const clock = new AnchoredClock();
 *
 * // Get current timestamp in milliseconds
 * const timestamp = clock.now();
 *
 * // Get high-resolution time in nanoseconds
 * const nanoTime = clock.nanoTime();
 * ```
 */
export declare class AnchoredClock implements Clock {
    private readonly _monotonicClock;
    private readonly _epochMillis;
    private readonly _performanceMillis;
    /**
     * Creates an AnchoredClock with the given configuration.
     *
     * @param config - Optional configuration for wall and monotonic clocks
     */
    constructor(config?: Partial<AnchoredClockConfig>);
    /**
     * Returns the current time in milliseconds since Unix epoch.
     *
     * The time is calculated by adding the elapsed monotonic time to the
     * anchored epoch time, ensuring monotonic progression while maintaining
     * wall-clock relevance.
     *
     * @returns Current time in milliseconds since Unix epoch
     */
    now(): number;
    /**
     * Returns the current time in nanoseconds since Unix epoch.
     *
     * This provides higher precision for trace timestamps that use
     * nanosecond resolution (as per OpenTelemetry spec).
     *
     * @returns Current time in nanoseconds since Unix epoch as bigint
     */
    nanoTime(): bigint;
    /**
     * Returns the current time in nanoseconds as a number.
     *
     * Note: JavaScript numbers can safely represent nanosecond timestamps
     * until approximately year 2255. For timestamps beyond that, use nanoTime().
     *
     * @returns Current time in nanoseconds since Unix epoch
     */
    nanoTimeNumber(): number;
    /**
     * Returns the high-resolution time elapsed since the anchor point.
     *
     * Useful for measuring durations without the overhead of epoch calculations.
     *
     * @returns Elapsed time in milliseconds since clock creation
     */
    elapsed(): number;
}
/**
 * Utility functions for time conversion.
 */
export declare const TimeUtils: {
    /**
     * Converts milliseconds to nanoseconds.
     */
    millisToNanos(millis: number): bigint;
    /**
     * Converts nanoseconds to milliseconds.
     */
    nanosToMillis(nanos: bigint): number;
    /**
     * Converts seconds to nanoseconds.
     */
    secondsToNanos(seconds: number): bigint;
    /**
     * Converts nanoseconds to seconds.
     */
    nanosToSeconds(nanos: bigint): number;
    /**
     * Gets current time in nanoseconds using high-resolution timer.
     */
    hrTimeToNanos(hrTime: [number, number]): bigint;
    /**
     * Converts a Date to nanoseconds since epoch.
     */
    dateToNanos(date: Date): bigint;
};
/**
 * Gets or creates the shared clock instance.
 *
 * @returns The shared AnchoredClock instance
 */
export declare function getSharedClock(): AnchoredClock;
/**
 * Resets the shared clock instance.
 * Primarily useful for testing.
 */
export declare function resetSharedClock(): void;
//# sourceMappingURL=clock.d.ts.map