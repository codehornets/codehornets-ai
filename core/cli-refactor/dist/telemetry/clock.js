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
/**
 * Default implementation of a wall clock using Date.now().
 */
export const defaultWallClock = {
    now() {
        return Date.now();
    },
};
/**
 * Default implementation of a monotonic clock using performance.now().
 * Falls back to Date.now() if performance API is unavailable.
 */
export const defaultMonotonicClock = {
    now() {
        // Use performance.now() for monotonic timing
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        // Fallback for environments without performance API
        return Date.now();
    },
};
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
export class AnchoredClock {
    _monotonicClock;
    _epochMillis;
    _performanceMillis;
    /**
     * Creates an AnchoredClock with the given configuration.
     *
     * @param config - Optional configuration for wall and monotonic clocks
     */
    constructor(config) {
        const wallClock = config?.wallClock ?? defaultWallClock;
        this._monotonicClock = config?.monotonicClock ?? defaultMonotonicClock;
        // Anchor the clocks at construction time
        this._epochMillis = wallClock.now();
        this._performanceMillis = this._monotonicClock.now();
    }
    /**
     * Returns the current time in milliseconds since Unix epoch.
     *
     * The time is calculated by adding the elapsed monotonic time to the
     * anchored epoch time, ensuring monotonic progression while maintaining
     * wall-clock relevance.
     *
     * @returns Current time in milliseconds since Unix epoch
     */
    now() {
        const elapsed = this._monotonicClock.now() - this._performanceMillis;
        return this._epochMillis + elapsed;
    }
    /**
     * Returns the current time in nanoseconds since Unix epoch.
     *
     * This provides higher precision for trace timestamps that use
     * nanosecond resolution (as per OpenTelemetry spec).
     *
     * @returns Current time in nanoseconds since Unix epoch as bigint
     */
    nanoTime() {
        const millis = this.now();
        // Convert milliseconds to nanoseconds (1ms = 1,000,000ns)
        return BigInt(Math.floor(millis * 1_000_000));
    }
    /**
     * Returns the current time in nanoseconds as a number.
     *
     * Note: JavaScript numbers can safely represent nanosecond timestamps
     * until approximately year 2255. For timestamps beyond that, use nanoTime().
     *
     * @returns Current time in nanoseconds since Unix epoch
     */
    nanoTimeNumber() {
        return this.now() * 1_000_000;
    }
    /**
     * Returns the high-resolution time elapsed since the anchor point.
     *
     * Useful for measuring durations without the overhead of epoch calculations.
     *
     * @returns Elapsed time in milliseconds since clock creation
     */
    elapsed() {
        return this._monotonicClock.now() - this._performanceMillis;
    }
}
/**
 * Utility functions for time conversion.
 */
export const TimeUtils = {
    /**
     * Converts milliseconds to nanoseconds.
     */
    millisToNanos(millis) {
        return BigInt(Math.floor(millis * 1_000_000));
    },
    /**
     * Converts nanoseconds to milliseconds.
     */
    nanosToMillis(nanos) {
        return Number(nanos) / 1_000_000;
    },
    /**
     * Converts seconds to nanoseconds.
     */
    secondsToNanos(seconds) {
        return BigInt(Math.floor(seconds * 1_000_000_000));
    },
    /**
     * Converts nanoseconds to seconds.
     */
    nanosToSeconds(nanos) {
        return Number(nanos) / 1_000_000_000;
    },
    /**
     * Gets current time in nanoseconds using high-resolution timer.
     */
    hrTimeToNanos(hrTime) {
        return BigInt(hrTime[0]) * BigInt(1_000_000_000) + BigInt(hrTime[1]);
    },
    /**
     * Converts a Date to nanoseconds since epoch.
     */
    dateToNanos(date) {
        return BigInt(date.getTime()) * BigInt(1_000_000);
    },
};
/**
 * Creates a shared AnchoredClock instance for the application.
 * This ensures consistent time measurements across all telemetry.
 */
let sharedClock = null;
/**
 * Gets or creates the shared clock instance.
 *
 * @returns The shared AnchoredClock instance
 */
export function getSharedClock() {
    if (!sharedClock) {
        sharedClock = new AnchoredClock();
    }
    return sharedClock;
}
/**
 * Resets the shared clock instance.
 * Primarily useful for testing.
 */
export function resetSharedClock() {
    sharedClock = null;
}
//# sourceMappingURL=clock.js.map