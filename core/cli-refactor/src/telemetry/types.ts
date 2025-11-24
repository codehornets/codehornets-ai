/**
 * Telemetry Types Module
 *
 * TypeScript interfaces and types for telemetry/observability functionality.
 * These types align with OpenTelemetry specifications and provide strong typing
 * for metrics, traces, and context propagation.
 */

import type { Attributes, AttributeValue, SpanKind, SpanStatusCode } from '@opentelemetry/api';

// =============================================================================
// Clock Types
// =============================================================================

/**
 * Interface for a clock that provides current time in milliseconds.
 * Used for wall-clock time (Date.now() style).
 */
export interface Clock {
  /**
   * Returns the current time in milliseconds since Unix epoch.
   */
  now(): number;
}

/**
 * Interface for a monotonic clock that provides high-resolution time.
 * Used for duration measurements and performance timing.
 */
export interface MonotonicClock {
  /**
   * Returns monotonically increasing time in milliseconds.
   * Typically backed by performance.now().
   */
  now(): number;
}

/**
 * Configuration for the AnchoredClock.
 */
export interface AnchoredClockConfig {
  /** Wall clock for epoch time reference */
  wallClock: Clock;
  /** Monotonic clock for duration measurements */
  monotonicClock: MonotonicClock;
}

// =============================================================================
// Metrics Types
// =============================================================================

/**
 * Configuration for histogram metrics.
 */
export interface HistogramConfig {
  /** Name of the histogram metric */
  name: string;
  /** Optional description */
  description?: string;
  /** Unit of measurement (e.g., 'ms', 'bytes') */
  unit?: string;
  /** Custom bucket boundaries (optional, uses default if not provided) */
  boundaries?: number[];
  /** Whether to record min/max values */
  recordMinMax?: boolean;
}

/**
 * Configuration for exponential histogram metrics.
 * Uses base-2 exponential bucket boundaries.
 */
export interface ExponentialHistogramConfig {
  /** Name of the histogram metric */
  name: string;
  /** Optional description */
  description?: string;
  /** Unit of measurement */
  unit?: string;
  /** Maximum number of buckets */
  maxSize?: number;
  /** Maximum scale for bucket mapping */
  maxScale?: number;
  /** Whether to record min/max values */
  recordMinMax?: boolean;
}

/**
 * Configuration for counter metrics.
 */
export interface CounterConfig {
  /** Name of the counter metric */
  name: string;
  /** Optional description */
  description?: string;
  /** Unit of measurement */
  unit?: string;
  /** Whether the counter is monotonic (only increases) */
  monotonic?: boolean;
}

/**
 * Configuration for gauge metrics.
 */
export interface GaugeConfig {
  /** Name of the gauge metric */
  name: string;
  /** Optional description */
  description?: string;
  /** Unit of measurement */
  unit?: string;
}

/**
 * Data point for a metric observation.
 */
export interface MetricDataPoint {
  /** Timestamp of the observation in milliseconds */
  timestamp: number;
  /** Observed value */
  value: number;
  /** Attributes associated with this data point */
  attributes?: Attributes;
}

/**
 * Histogram data structure for export.
 */
export interface HistogramData {
  /** Start time of the collection interval */
  startTime: number;
  /** End time of the collection interval */
  endTime: number;
  /** Total count of observations */
  count: number;
  /** Sum of all observations */
  sum: number;
  /** Minimum observed value (if recordMinMax is true) */
  min?: number;
  /** Maximum observed value (if recordMinMax is true) */
  max?: number;
  /** Bucket boundaries */
  boundaries: number[];
  /** Bucket counts */
  counts: number[];
  /** Associated attributes */
  attributes?: Attributes;
}

/**
 * Exponential histogram bucket structure.
 */
export interface ExponentialHistogramBuckets {
  /** Offset of the first bucket */
  offset: number;
  /** Counts for each bucket */
  bucketCounts: number[];
}

/**
 * Exponential histogram data structure.
 */
export interface ExponentialHistogramData {
  /** Start time of the collection interval */
  startTime: number;
  /** End time of the collection interval */
  endTime: number;
  /** Total count of observations */
  count: number;
  /** Sum of all observations */
  sum: number;
  /** Scale factor for bucket boundaries */
  scale: number;
  /** Zero count (observations exactly at zero) */
  zeroCount: number;
  /** Positive value buckets */
  positive: ExponentialHistogramBuckets;
  /** Negative value buckets */
  negative: ExponentialHistogramBuckets;
  /** Minimum observed value */
  min?: number;
  /** Maximum observed value */
  max?: number;
  /** Associated attributes */
  attributes?: Attributes;
}

/**
 * Aggregation temporality for metrics.
 */
export enum AggregationTemporality {
  UNSPECIFIED = 0,
  DELTA = 1,
  CUMULATIVE = 2,
}

// =============================================================================
// Tracing Types
// =============================================================================

/**
 * Options for creating a new span.
 */
export interface SpanOptions {
  /** Span kind (CLIENT, SERVER, INTERNAL, PRODUCER, CONSUMER) */
  kind?: SpanKind;
  /** Initial attributes for the span */
  attributes?: Attributes;
  /** Links to other spans */
  links?: SpanLink[];
  /** Custom start time (defaults to current time) */
  startTime?: number;
  /** Root span flag (ignores parent context) */
  root?: boolean;
}

/**
 * Link to another span for distributed tracing.
 */
export interface SpanLink {
  /** Trace ID of the linked span */
  traceId: string;
  /** Span ID of the linked span */
  spanId: string;
  /** Attributes associated with the link */
  attributes?: Attributes;
}

/**
 * Span event for recording notable moments.
 */
export interface SpanEvent {
  /** Name of the event */
  name: string;
  /** Timestamp of the event in milliseconds */
  timestamp?: number;
  /** Attributes associated with the event */
  attributes?: Attributes;
}

/**
 * Span status information.
 */
export interface SpanStatus {
  /** Status code (OK, ERROR, UNSET) */
  code: SpanStatusCode;
  /** Optional status message */
  message?: string;
}

/**
 * Serializable span data for export.
 */
export interface SpanData {
  /** Unique trace ID (16 bytes as hex string) */
  traceId: string;
  /** Unique span ID (8 bytes as hex string) */
  spanId: string;
  /** Parent span ID (if any) */
  parentSpanId?: string;
  /** Trace state (W3C trace-context) */
  traceState?: string;
  /** Span name */
  name: string;
  /** Span kind */
  kind: SpanKind;
  /** Start time in nanoseconds */
  startTimeUnixNano: bigint;
  /** End time in nanoseconds */
  endTimeUnixNano: bigint;
  /** Span attributes */
  attributes: Attributes;
  /** Count of dropped attributes */
  droppedAttributesCount: number;
  /** Span events */
  events: SpanEvent[];
  /** Count of dropped events */
  droppedEventsCount: number;
  /** Span links */
  links: SpanLink[];
  /** Count of dropped links */
  droppedLinksCount: number;
  /** Span status */
  status: SpanStatus;
}

// =============================================================================
// Propagation Types
// =============================================================================

/**
 * Baggage entry with value and optional metadata.
 */
export interface BaggageEntry {
  /** The value of the baggage entry */
  value: string;
  /** Optional metadata string */
  metadata?: string;
}

/**
 * Collection of baggage entries for context propagation.
 */
export interface BaggageEntries {
  [key: string]: BaggageEntry;
}

/**
 * Text map carrier for context propagation.
 */
export interface TextMapCarrier {
  [key: string]: string | string[] | undefined;
}

/**
 * Getter interface for extracting values from a carrier.
 */
export interface TextMapGetter<Carrier = TextMapCarrier> {
  /** Get all keys from the carrier */
  keys(carrier: Carrier): string[];
  /** Get a value by key from the carrier */
  get(carrier: Carrier, key: string): string | string[] | undefined;
}

/**
 * Setter interface for injecting values into a carrier.
 */
export interface TextMapSetter<Carrier = TextMapCarrier> {
  /** Set a key-value pair in the carrier */
  set(carrier: Carrier, key: string, value: string): void;
}

// =============================================================================
// Attribute Types
// =============================================================================

/**
 * Valid types for attribute values.
 */
export type AttributeValueType =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | undefined
  | null;

/**
 * Result of attribute validation.
 */
export interface AttributeValidationResult {
  /** Whether the attribute is valid */
  valid: boolean;
  /** Sanitized value (if valid) */
  value?: AttributeValue;
  /** Error message (if invalid) */
  error?: string;
}

// =============================================================================
// Resource Types
// =============================================================================

/**
 * Resource identifying the entity producing telemetry.
 */
export interface Resource {
  /** Resource attributes */
  attributes: Attributes;
  /** Schema URL for semantic conventions */
  schemaUrl?: string;
}

/**
 * Instrumentation scope (library/module) producing telemetry.
 */
export interface InstrumentationScope {
  /** Name of the instrumentation library */
  name: string;
  /** Version of the instrumentation library */
  version?: string;
  /** Schema URL for semantic conventions */
  schemaUrl?: string;
}

// =============================================================================
// Exporter Types
// =============================================================================

/**
 * Export result status.
 */
export enum ExportResult {
  SUCCESS = 0,
  FAILED = 1,
}

/**
 * Configuration for OTLP exporter.
 */
export interface OTLPExporterConfig {
  /** Endpoint URL for the collector */
  url: string;
  /** Headers to include in requests */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Compression type ('gzip' or 'none') */
  compression?: 'gzip' | 'none';
}

/**
 * Batch of spans for export.
 */
export interface SpanExportBatch {
  /** Resource for the batch */
  resource: Resource;
  /** Instrumentation scope */
  scope: InstrumentationScope;
  /** Spans to export */
  spans: SpanData[];
}

/**
 * Batch of metrics for export.
 */
export interface MetricExportBatch {
  /** Resource for the batch */
  resource: Resource;
  /** Instrumentation scope */
  scope: InstrumentationScope;
  /** Metric data to export */
  metrics: Array<{
    name: string;
    description?: string;
    unit?: string;
    data: HistogramData | ExponentialHistogramData | MetricDataPoint[];
  }>;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Global telemetry configuration.
 */
export interface TelemetryConfig {
  /** Service name for resource identification */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** Environment (e.g., 'production', 'development') */
  environment?: string;
  /** Whether telemetry is enabled */
  enabled?: boolean;
  /** Trace exporter configuration */
  tracing?: {
    enabled?: boolean;
    exporter?: OTLPExporterConfig;
    samplingRatio?: number;
  };
  /** Metrics configuration */
  metrics?: {
    enabled?: boolean;
    exporter?: OTLPExporterConfig;
    exportInterval?: number;
  };
  /** Additional resource attributes */
  resourceAttributes?: Attributes;
}

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Environment variable names for telemetry configuration.
 */
export const TelemetryEnvVars = {
  /** Service name */
  SERVICE_NAME: 'OTEL_SERVICE_NAME',
  /** Resource attributes */
  RESOURCE_ATTRIBUTES: 'OTEL_RESOURCE_ATTRIBUTES',
  /** Traces exporter endpoint */
  TRACES_ENDPOINT: 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT',
  /** Metrics exporter endpoint */
  METRICS_ENDPOINT: 'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
  /** General OTLP endpoint */
  OTLP_ENDPOINT: 'OTEL_EXPORTER_OTLP_ENDPOINT',
  /** Sampling ratio */
  TRACES_SAMPLER_ARG: 'OTEL_TRACES_SAMPLER_ARG',
  /** Enable/disable SDK */
  SDK_DISABLED: 'OTEL_SDK_DISABLED',
  /** Log level for diagnostics */
  LOG_LEVEL: 'OTEL_LOG_LEVEL',
} as const;
