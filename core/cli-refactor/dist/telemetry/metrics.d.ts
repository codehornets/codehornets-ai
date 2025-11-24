/**
 * Metrics Module
 *
 * Provides metric collection utilities including histograms, counters, and gauges.
 * Built on OpenTelemetry for standardized, exportable metrics.
 *
 * Key features:
 * - Histogram with configurable bucket boundaries
 * - Exponential histogram with automatic bucket scaling
 * - Monotonic and non-monotonic counters
 * - Gauges for current value measurements
 */
import type { Attributes } from '@opentelemetry/api';
import { type Meter, type Counter, type Histogram as OTELHistogram, type ObservableGauge, type UpDownCounter } from '@opentelemetry/api';
import type { HistogramConfig, ExponentialHistogramConfig, CounterConfig, GaugeConfig, ExponentialHistogramData } from './types.js';
/**
 * Gets the default meter instance.
 *
 * @returns The default meter
 */
export declare function getMeter(): Meter;
/**
 * Gets a meter with a custom name.
 *
 * @param name - The meter name
 * @param version - Optional version
 * @returns The meter instance
 */
export declare function getNamedMeter(name: string, version?: string): Meter;
/**
 * Default histogram bucket boundaries for latency measurements (in milliseconds).
 */
export declare const DEFAULT_LATENCY_BOUNDARIES: number[];
/**
 * Default histogram bucket boundaries for size measurements (in bytes).
 */
export declare const DEFAULT_SIZE_BOUNDARIES: number[];
/**
 * Creates a histogram metric.
 *
 * @param config - Histogram configuration
 * @returns The histogram instrument
 */
export declare function createHistogram(config: HistogramConfig): OTELHistogram;
/**
 * Helper class for histogram recording with automatic timing.
 */
export declare class HistogramRecorder {
    private readonly histogram;
    private readonly clock;
    constructor(config: HistogramConfig);
    /**
     * Records a value directly.
     *
     * @param value - The value to record
     * @param attributes - Optional attributes
     */
    record(value: number, attributes?: Attributes): void;
    /**
     * Creates a timer that records duration when stopped.
     *
     * @param attributes - Optional attributes
     * @returns Timer object with stop() method
     */
    startTimer(attributes?: Attributes): {
        stop: () => number;
    };
    /**
     * Times an async operation and records the duration.
     *
     * @param operation - The async operation to time
     * @param attributes - Optional attributes
     * @returns The operation result
     */
    time<T>(operation: () => Promise<T>, attributes?: Attributes): Promise<T>;
    /**
     * Times a sync operation and records the duration.
     *
     * @param operation - The sync operation to time
     * @param attributes - Optional attributes
     * @returns The operation result
     */
    timeSync<T>(operation: () => T, attributes?: Attributes): T;
}
/**
 * Exponential histogram accumulation for a single series.
 *
 * Uses base-2 exponential bucket boundaries for efficient representation
 * of distributions with wide value ranges.
 */
export declare class ExponentialHistogramAccumulation {
    private startTime;
    private readonly maxSize;
    private readonly recordMinMax;
    private sum;
    private count;
    private zeroCount;
    private min;
    private max;
    private scale;
    private positive;
    private negative;
    constructor(config: ExponentialHistogramConfig, startTime?: number);
    /**
     * Records a value in the histogram.
     *
     * @param value - The value to record
     */
    record(value: number): void;
    /**
     * Maps a value to a bucket index based on the current scale.
     */
    private mapToIndex;
    /**
     * Reduces the scale by the given amount, merging buckets.
     */
    private downscale;
    /**
     * Sets the start time for the accumulation.
     */
    setStartTime(time: number): void;
    /**
     * Creates a deep clone of this accumulation.
     */
    clone(): ExponentialHistogramAccumulation;
    /**
     * Exports the histogram data.
     */
    toData(): ExponentialHistogramData;
}
/**
 * Exponential histogram aggregator for collecting metrics.
 */
export declare class ExponentialHistogramAggregator {
    private readonly config;
    private accumulations;
    constructor(config: ExponentialHistogramConfig);
    /**
     * Records a value with the given attributes.
     *
     * @param value - The value to record
     * @param attributes - Optional attributes for series identification
     */
    record(value: number, attributes?: Attributes): void;
    /**
     * Gets all histogram data for export.
     */
    collect(): Array<{
        attributes?: Attributes;
        data: ExponentialHistogramData;
    }>;
    /**
     * Resets all accumulations.
     */
    reset(): void;
    private serializeAttributes;
}
/**
 * Creates a monotonic counter (only increases).
 *
 * @param config - Counter configuration
 * @returns The counter instrument
 */
export declare function createCounter(config: CounterConfig): Counter;
/**
 * Creates an up-down counter (can increase or decrease).
 *
 * @param config - Counter configuration
 * @returns The up-down counter instrument
 */
export declare function createUpDownCounter(config: CounterConfig): UpDownCounter;
/**
 * Helper class for counter operations with automatic attribute handling.
 */
export declare class CounterRecorder {
    private readonly counter;
    constructor(config: CounterConfig);
    /**
     * Adds a value to the counter.
     *
     * @param value - The value to add (must be non-negative)
     * @param attributes - Optional attributes
     */
    add(value: number, attributes?: Attributes): void;
    /**
     * Increments the counter by 1.
     *
     * @param attributes - Optional attributes
     */
    increment(attributes?: Attributes): void;
}
/**
 * Creates an observable gauge.
 *
 * @param config - Gauge configuration
 * @param callback - Callback to get current value
 * @returns The gauge instrument
 */
export declare function createGauge(config: GaugeConfig, callback: () => number | Promise<number>): ObservableGauge;
/**
 * Helper class for manual gauge reporting.
 */
export declare class GaugeRecorder {
    private currentValue;
    private readonly attributes?;
    constructor(config: GaugeConfig, attributes?: Attributes);
    /**
     * Sets the current gauge value.
     *
     * @param value - The new value
     */
    set(value: number): void;
    /**
     * Gets the current gauge value.
     *
     * @returns The current value
     */
    get(): number;
    /**
     * Increments the gauge value.
     *
     * @param delta - Amount to increment (default: 1)
     */
    increment(delta?: number): void;
    /**
     * Decrements the gauge value.
     *
     * @param delta - Amount to decrement (default: 1)
     */
    decrement(delta?: number): void;
}
/**
 * Common CLI metrics.
 */
export declare const CLIMetrics: {
    /**
     * Creates a request duration histogram.
     */
    requestDuration(): HistogramRecorder;
    /**
     * Creates a command execution counter.
     */
    commandExecutions(): CounterRecorder;
    /**
     * Creates a token usage counter.
     */
    tokenUsage(): CounterRecorder;
    /**
     * Creates an API call histogram.
     */
    apiCallDuration(): HistogramRecorder;
    /**
     * Creates an error counter.
     */
    errors(): CounterRecorder;
};
//# sourceMappingURL=metrics.d.ts.map