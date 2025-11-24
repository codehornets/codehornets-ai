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
import {
  metrics,
  type Meter,
  type Counter,
  type Histogram as OTELHistogram,
  type ObservableGauge,
  type UpDownCounter,
  ValueType,
} from '@opentelemetry/api';
import type {
  HistogramConfig,
  ExponentialHistogramConfig,
  CounterConfig,
  GaugeConfig,
  HistogramData,
  ExponentialHistogramData,
  AggregationTemporality,
} from './types.js';
import { getSharedClock } from './clock.js';

// =============================================================================
// Meter Provider
// =============================================================================

/**
 * Default meter name for CLI telemetry.
 */
const DEFAULT_METER_NAME = '@anthropic-ai/claude-code';

/**
 * Default meter version.
 */
const DEFAULT_METER_VERSION = '1.0.0';

/**
 * Gets the default meter instance.
 *
 * @returns The default meter
 */
export function getMeter(): Meter {
  return metrics.getMeter(DEFAULT_METER_NAME, DEFAULT_METER_VERSION);
}

/**
 * Gets a meter with a custom name.
 *
 * @param name - The meter name
 * @param version - Optional version
 * @returns The meter instance
 */
export function getNamedMeter(name: string, version?: string): Meter {
  return metrics.getMeter(name, version);
}

// =============================================================================
// Histogram Utilities
// =============================================================================

/**
 * Default histogram bucket boundaries for latency measurements (in milliseconds).
 */
export const DEFAULT_LATENCY_BOUNDARIES = [
  0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000,
];

/**
 * Default histogram bucket boundaries for size measurements (in bytes).
 */
export const DEFAULT_SIZE_BOUNDARIES = [
  0, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576,
];

/**
 * Creates a histogram metric.
 *
 * @param config - Histogram configuration
 * @returns The histogram instrument
 */
export function createHistogram(config: HistogramConfig): OTELHistogram {
  const meter = getMeter();
  return meter.createHistogram(config.name, {
    description: config.description,
    unit: config.unit,
    valueType: ValueType.DOUBLE,
    advice: {
      explicitBucketBoundaries: config.boundaries ?? DEFAULT_LATENCY_BOUNDARIES,
    },
  });
}

/**
 * Helper class for histogram recording with automatic timing.
 */
export class HistogramRecorder {
  private readonly histogram: OTELHistogram;
  private readonly clock = getSharedClock();

  constructor(config: HistogramConfig) {
    this.histogram = createHistogram(config);
  }

  /**
   * Records a value directly.
   *
   * @param value - The value to record
   * @param attributes - Optional attributes
   */
  record(value: number, attributes?: Attributes): void {
    this.histogram.record(value, attributes);
  }

  /**
   * Creates a timer that records duration when stopped.
   *
   * @param attributes - Optional attributes
   * @returns Timer object with stop() method
   */
  startTimer(attributes?: Attributes): { stop: () => number } {
    const start = this.clock.now();
    return {
      stop: () => {
        const duration = this.clock.now() - start;
        this.histogram.record(duration, attributes);
        return duration;
      },
    };
  }

  /**
   * Times an async operation and records the duration.
   *
   * @param operation - The async operation to time
   * @param attributes - Optional attributes
   * @returns The operation result
   */
  async time<T>(operation: () => Promise<T>, attributes?: Attributes): Promise<T> {
    const timer = this.startTimer(attributes);
    try {
      return await operation();
    } finally {
      timer.stop();
    }
  }

  /**
   * Times a sync operation and records the duration.
   *
   * @param operation - The sync operation to time
   * @param attributes - Optional attributes
   * @returns The operation result
   */
  timeSync<T>(operation: () => T, attributes?: Attributes): T {
    const timer = this.startTimer(attributes);
    try {
      return operation();
    } finally {
      timer.stop();
    }
  }
}

// =============================================================================
// Exponential Histogram (Manual Implementation)
// =============================================================================

/**
 * Bucket storage for exponential histogram.
 * Uses a circular buffer for efficient index-based access.
 */
class Buckets {
  private backing: number[];
  private indexBase: number;
  private indexStart: number;
  private indexEnd: number;

  constructor(
    backing: number[] = [0],
    indexBase = 0,
    indexStart = 0,
    indexEnd = 0
  ) {
    this.backing = backing;
    this.indexBase = indexBase;
    this.indexStart = indexStart;
    this.indexEnd = indexEnd;
  }

  get offset(): number {
    return this.indexStart;
  }

  get length(): number {
    if (this.backing.length === 0) return 0;
    if (this.indexEnd === this.indexStart && this.at(0) === 0) return 0;
    return this.indexEnd - this.indexStart + 1;
  }

  counts(): number[] {
    return Array.from({ length: this.length }, (_, i) => this.at(i));
  }

  at(index: number): number { if (index < 0 || index >= this.backing.length) return 0;
    let adjustedIndex = this.indexBase - this.indexStart;
    if (index < adjustedIndex) index += this.backing.length;
    adjustedIndex = index - adjustedIndex;
    return (this.backing[adjustedIndex] ?? 0);
  }

  incrementBucket(index: number, delta: number): void {
    this.backing[index] = (this.backing[index] ?? 0) + delta;
  }

  grow(newSize: number): void {
    const oldSize = this.backing.length;
    if (newSize <= oldSize) return;

    // Double the size
    const targetSize = Math.max(newSize, oldSize * 2);
    this.backing.length = targetSize;
    this.backing.fill(0, oldSize);
  }

  updateRange(index: number): void {
    if (this.length === 0) {
      this.indexStart = index;
      this.indexEnd = index;
      this.indexBase = index;
    } else if (index < this.indexStart) {
      this.indexStart = index;
    } else if (index > this.indexEnd) {
      this.indexEnd = index;
    }
  }

  downscale(amount: number): void {
    if (amount <= 0) return;

    const factor = 1 << amount;
    const newStart = Math.floor(this.indexStart / factor);
    const newEnd = Math.floor(this.indexEnd / factor);

    // Merge buckets
    const newBacking: number[] = new Array(newEnd - newStart + 1).fill(0);

    for (let i = this.indexStart; i <= this.indexEnd; i++) {
      const newIndex = Math.floor(i / factor) - newStart;
      newBacking[newIndex] = (newBacking[newIndex] ?? 0) + this.at(i - this.indexStart);
    }

    this.backing = newBacking;
    this.indexStart = newStart;
    this.indexEnd = newEnd;
    this.indexBase = newStart;
  }

  clone(): Buckets {
    return new Buckets([...this.backing], this.indexBase, this.indexStart, this.indexEnd);
  }
}

/**
 * Exponential histogram accumulation for a single series.
 *
 * Uses base-2 exponential bucket boundaries for efficient representation
 * of distributions with wide value ranges.
 */
export class ExponentialHistogramAccumulation {
  private startTime: number;
  private readonly maxSize: number;
  private readonly recordMinMax: boolean;

  private sum = 0;
  private count = 0;
  private zeroCount = 0;
  private min = Infinity;
  private max = -Infinity;
  private scale: number;
  private positive: Buckets;
  private negative: Buckets;

  constructor(config: ExponentialHistogramConfig, startTime?: number) {
    this.maxSize = config.maxSize ?? 160;
    this.recordMinMax = config.recordMinMax ?? true;
    this.scale = config.maxScale ?? 20;
    this.startTime = startTime ?? getSharedClock().now();
    this.positive = new Buckets();
    this.negative = new Buckets();
  }

  /**
   * Records a value in the histogram.
   *
   * @param value - The value to record
   */
  record(value: number): void {
    this.count++;
    this.sum += value;

    if (this.recordMinMax) {
      if (value < this.min) this.min = value;
      if (value > this.max) this.max = value;
    }

    if (value === 0) {
      this.zeroCount++;
      return;
    }

    // Determine bucket index based on scale
    const index = this.mapToIndex(Math.abs(value));
    const buckets = value > 0 ? this.positive : this.negative;

    // Grow buckets if needed
    const neededSize = index - buckets.offset + 1;
    if (neededSize > this.maxSize) {
      // Need to downscale
      this.downscale(1);
      this.record(value); // Re-record with new scale
      return;
    }

    buckets.updateRange(index);
    buckets.grow(neededSize);
    buckets.incrementBucket(index - buckets.offset, 1);
  }

  /**
   * Maps a value to a bucket index based on the current scale.
   */
  private mapToIndex(value: number): number {
    if (value <= 0) return 0;

    // Use logarithmic mapping
    const scaleFactor = Math.pow(2, this.scale) / Math.LN2;
    return Math.floor(Math.log(value) * scaleFactor);
  }

  /**
   * Reduces the scale by the given amount, merging buckets.
   */
  private downscale(amount: number): void {
    this.scale -= amount;
    this.positive.downscale(amount);
    this.negative.downscale(amount);
  }

  /**
   * Sets the start time for the accumulation.
   */
  setStartTime(time: number): void {
    this.startTime = time;
  }

  /**
   * Creates a deep clone of this accumulation.
   */
  clone(): ExponentialHistogramAccumulation {
    const clone = new ExponentialHistogramAccumulation(
      { name: "", maxSize: this.maxSize, recordMinMax: this.recordMinMax, maxScale: this.scale },
      this.startTime
    );
    clone.sum = this.sum;
    clone.count = this.count;
    clone.zeroCount = this.zeroCount;
    clone.min = this.min;
    clone.max = this.max;
    clone.scale = this.scale;
    clone.positive = this.positive.clone();
    clone.negative = this.negative.clone();
    return clone;
  }

  /**
   * Exports the histogram data.
   */
  toData(): ExponentialHistogramData {
    const clock = getSharedClock();
    return {
      startTime: this.startTime,
      endTime: clock.now(),
      count: this.count,
      sum: this.sum,
      scale: this.scale,
      zeroCount: this.zeroCount,
      positive: {
        offset: this.positive.offset,
        bucketCounts: this.positive.counts(),
      },
      negative: {
        offset: this.negative.offset,
        bucketCounts: this.negative.counts(),
      },
      min: this.recordMinMax && this.count > 0 ? this.min : undefined,
      max: this.recordMinMax && this.count > 0 ? this.max : undefined,
    };
  }
}

/**
 * Exponential histogram aggregator for collecting metrics.
 */
export class ExponentialHistogramAggregator {
  private readonly config: ExponentialHistogramConfig;
  private accumulations: Map<string, ExponentialHistogramAccumulation> = new Map();

  constructor(config: ExponentialHistogramConfig) {
    this.config = config;
  }

  /**
   * Records a value with the given attributes.
   *
   * @param value - The value to record
   * @param attributes - Optional attributes for series identification
   */
  record(value: number, attributes?: Attributes): void {
    const key = this.serializeAttributes(attributes);
    let accumulation = this.accumulations.get(key);

    if (!accumulation) {
      accumulation = new ExponentialHistogramAccumulation(this.config);
      this.accumulations.set(key, accumulation);
    }

    accumulation.record(value);
  }

  /**
   * Gets all histogram data for export.
   */
  collect(): Array<{ attributes?: Attributes; data: ExponentialHistogramData }> {
    const results: Array<{ attributes?: Attributes; data: ExponentialHistogramData }> = [];

    for (const [key, accumulation] of this.accumulations) {
      results.push({
        attributes: key ? JSON.parse(key) : undefined,
        data: accumulation.toData(),
      });
    }

    return results;
  }

  /**
   * Resets all accumulations.
   */
  reset(): void {
    this.accumulations.clear();
  }

  private serializeAttributes(attributes?: Attributes): string {
    if (!attributes || Object.keys(attributes).length === 0) return '';
    return JSON.stringify(attributes);
  }
}

// =============================================================================
// Counter Utilities
// =============================================================================

/**
 * Creates a monotonic counter (only increases).
 *
 * @param config - Counter configuration
 * @returns The counter instrument
 */
export function createCounter(config: CounterConfig): Counter {
  const meter = getMeter();
  return meter.createCounter(config.name, {
    description: config.description,
    unit: config.unit,
    valueType: ValueType.DOUBLE,
  });
}

/**
 * Creates an up-down counter (can increase or decrease).
 *
 * @param config - Counter configuration
 * @returns The up-down counter instrument
 */
export function createUpDownCounter(config: CounterConfig): UpDownCounter {
  const meter = getMeter();
  return meter.createUpDownCounter(config.name, {
    description: config.description,
    unit: config.unit,
    valueType: ValueType.DOUBLE,
  });
}

/**
 * Helper class for counter operations with automatic attribute handling.
 */
export class CounterRecorder {
  private readonly counter: Counter;

  constructor(config: CounterConfig) {
    this.counter = createCounter(config);
  }

  /**
   * Adds a value to the counter.
   *
   * @param value - The value to add (must be non-negative)
   * @param attributes - Optional attributes
   */
  add(value: number, attributes?: Attributes): void {
    if (value < 0) {
      throw new Error('Counter values must be non-negative');
    }
    this.counter.add(value, attributes);
  }

  /**
   * Increments the counter by 1.
   *
   * @param attributes - Optional attributes
   */
  increment(attributes?: Attributes): void {
    this.counter.add(1, attributes);
  }
}

// =============================================================================
// Gauge Utilities
// =============================================================================

/**
 * Creates an observable gauge.
 *
 * @param config - Gauge configuration
 * @param callback - Callback to get current value
 * @returns The gauge instrument
 */
export function createGauge(
  config: GaugeConfig,
  callback: () => number | Promise<number>
): ObservableGauge {
  const meter = getMeter();
  const gauge = meter.createObservableGauge(config.name, {
    description: config.description,
    unit: config.unit,
    valueType: ValueType.DOUBLE,
  });

  gauge.addCallback(async (result) => {
    const value = await callback();
    result.observe(value);
  });

  return gauge;
}

/**
 * Helper class for manual gauge reporting.
 */
export class GaugeRecorder {
  private currentValue = 0;
  private readonly attributes?: Attributes;

  constructor(config: GaugeConfig, attributes?: Attributes) {
    this.attributes = attributes;

    createGauge(config, () => this.currentValue);
  }

  /**
   * Sets the current gauge value.
   *
   * @param value - The new value
   */
  set(value: number): void {
    this.currentValue = value;
  }

  /**
   * Gets the current gauge value.
   *
   * @returns The current value
   */
  get(): number {
    return this.currentValue;
  }

  /**
   * Increments the gauge value.
   *
   * @param delta - Amount to increment (default: 1)
   */
  increment(delta = 1): void {
    this.currentValue += delta;
  }

  /**
   * Decrements the gauge value.
   *
   * @param delta - Amount to decrement (default: 1)
   */
  decrement(delta = 1): void {
    this.currentValue -= delta;
  }
}

// =============================================================================
// Pre-built Metrics
// =============================================================================

/**
 * Common CLI metrics.
 */
export const CLIMetrics = {
  /**
   * Creates a request duration histogram.
   */
  requestDuration(): HistogramRecorder {
    return new HistogramRecorder({
      name: 'cli.request.duration',
      description: 'Duration of CLI requests',
      unit: 'ms',
      boundaries: DEFAULT_LATENCY_BOUNDARIES,
    });
  },

  /**
   * Creates a command execution counter.
   */
  commandExecutions(): CounterRecorder {
    return new CounterRecorder({
      name: 'cli.command.executions',
      description: 'Number of CLI commands executed',
      unit: '1',
    });
  },

  /**
   * Creates a token usage counter.
   */
  tokenUsage(): CounterRecorder {
    return new CounterRecorder({
      name: 'cli.tokens.used',
      description: 'Number of tokens used',
      unit: '1',
    });
  },

  /**
   * Creates an API call histogram.
   */
  apiCallDuration(): HistogramRecorder {
    return new HistogramRecorder({
      name: 'cli.api.duration',
      description: 'Duration of API calls',
      unit: 'ms',
      boundaries: DEFAULT_LATENCY_BOUNDARIES,
    });
  },

  /**
   * Creates an error counter.
   */
  errors(): CounterRecorder {
    return new CounterRecorder({
      name: 'cli.errors',
      description: 'Number of errors encountered',
      unit: '1',
    });
  },
};
