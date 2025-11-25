/**
 * Telemetry Module
 *
 * Provides observability capabilities for the Claude Code CLI including:
 * - Distributed tracing with OpenTelemetry
 * - Metrics collection (histograms, counters, gauges)
 * - Context propagation (W3C Baggage)
 * - Telemetry export (OTLP)
 *
 * @example
 * ```typescript
 * import { initializeTelemetry, withSpan, createHistogram } from './telemetry.js';
 *
 * // Initialize telemetry
 * await initializeTelemetry({
 *   serviceName: 'claude-code-cli',
 *   tracing: { enabled: true },
 *   metrics: { enabled: true },
 * });
 *
 * // Create a span
 * withSpan('my-operation', (span) => {
 *   span.setAttribute('custom.attribute', 'value');
 *   // ... do work
 * });
 *
 * // Record metrics
 * const requestDuration = createHistogram({
 *   name: 'request.duration',
 *   unit: 'ms',
 * });
 * requestDuration.record(150);
 * ```
 *
 * @module telemetry
 */
import type { TelemetryConfig, Resource } from './types.js';
export type { Clock, MonotonicClock, AnchoredClockConfig, HistogramConfig, ExponentialHistogramConfig, CounterConfig, GaugeConfig, MetricDataPoint, HistogramData, ExponentialHistogramBuckets, ExponentialHistogramData, SpanOptions, SpanLink, SpanEvent, SpanStatus, SpanData, BaggageEntry, BaggageEntries, TextMapCarrier, TextMapGetter, TextMapSetter, AttributeValidationResult, Resource, InstrumentationScope, OTLPExporterConfig, SpanExportBatch, MetricExportBatch, TelemetryConfig, } from './types.js';
export { AggregationTemporality, ExportResult, TelemetryEnvVars } from './types.js';
export { AnchoredClock, TimeUtils, defaultWallClock, defaultMonotonicClock, getSharedClock, resetSharedClock, } from './clock.js';
export { isAttributeKey, isAttributeValue, validateAttribute, sanitizeAttributes, HttpAttributes, DbAttributes, RpcAttributes, NetAttributes, ExceptionAttributes, CodeAttributes, ThreadAttributes, MessagingAttributes, FaasAttributes, AwsAttributes, PeerAttributes, EnduserAttributes, SemanticAttributes, DbSystemValues, NetTransportValues, HttpFlavorValues, RpcGrpcStatusCodeValues, } from './attributes.js';
export { BAGGAGE_HEADER, BAGGAGE_MAX_PER_NAME_VALUE_PAIRS, BAGGAGE_MAX_NAME_VALUE_PAIRS, BAGGAGE_MAX_TOTAL_LENGTH, W3CBaggagePropagator, encodeBaggageValue, decodeBaggageValue, serializeBaggageEntry, getKeyPairs, serializeKeyPairs, parsePairKeyValue, parseKeyPairsIntoRecord, defaultTextMapGetter, defaultTextMapSetter, isTracingSuppressed, suppressTracing, unsuppressTracing, getBaggageValue, setBaggageValue, removeBaggageValue, getAllBaggage, } from './propagation.js';
export { getMeter, getNamedMeter, DEFAULT_LATENCY_BOUNDARIES, DEFAULT_SIZE_BOUNDARIES, createHistogram, createCounter, createUpDownCounter, createGauge, HistogramRecorder, ExponentialHistogramAccumulation, ExponentialHistogramAggregator, CounterRecorder, GaugeRecorder, CLIMetrics, } from './metrics.js';
export { getTracer, getNamedTracer, startSpan, withSpan, withSpanAsync, getActiveSpan, getSpanContext, setSpanAttributes, setSpanAttribute, addSpanEvent, setSpanStatus, recordException, runWithSpanContext, createDetachedSpan, SpanBuilder, buildSpan, traceCommand, traceApiCall, traceTool, } from './tracing.js';
export { ExportResultCode, createSuccessResult, createFailedResult, attributesToOTLP, hexToBytes, spanToOTLP, createTraceExportRequest, createMetricsExportRequest, DEFAULT_BATCH_CONFIG, OTLPExporter, OTLPTraceExporter, OTLPMetricsExporter, ConsoleSpanExporter, NoOpExporter, createTraceExporter, createMetricsExporter, } from './exporter.js';
export { SpanKind, SpanStatusCode } from '@opentelemetry/api';
export type { Span, Tracer, Meter, Counter, Histogram, Context, Attributes } from '@opentelemetry/api';
/**
 * Initializes the telemetry SDK with the given configuration.
 *
 * This sets up:
 * - Trace provider with configured exporters
 * - Meter provider with configured exporters
 * - Context propagation (W3C Baggage)
 * - Diagnostic logging
 *
 * @param config - Telemetry configuration
 * @returns Promise that resolves when initialization is complete
 *
 * @example
 * ```typescript
 * await initializeTelemetry({
 *   serviceName: 'claude-code-cli',
 *   serviceVersion: '2.0.0',
 *   environment: 'production',
 *   tracing: {
 *     enabled: true,
 *     exporter: {
 *       url: 'http://localhost:4318/v1/traces',
 *     },
 *   },
 *   metrics: {
 *     enabled: true,
 *     exporter: {
 *       url: 'http://localhost:4318/v1/metrics',
 *     },
 *   },
 * });
 * ```
 */
export declare function initializeTelemetry(config: TelemetryConfig): Promise<void>;
/**
 * Shuts down the telemetry SDK gracefully.
 *
 * This flushes any pending exports and releases resources.
 */
export declare function shutdownTelemetry(): Promise<void>;
/**
 * Checks if telemetry is initialized.
 */
export declare function isTelemetryInitialized(): boolean;
/**
 * Gets the current telemetry configuration.
 */
export declare function getTelemetryConfig(): TelemetryConfig | null;
/**
 * Gets the current resource.
 */
export declare function getTelemetryResource(): Resource | null;
/**
 * Checks if tracing is enabled.
 */
export declare function isTracingEnabled(): boolean;
/**
 * Checks if metrics are enabled.
 */
export declare function isMetricsEnabled(): boolean;
/**
 * Creates telemetry configuration from environment variables.
 *
 * Reads:
 * - OTEL_SERVICE_NAME
 * - OTEL_RESOURCE_ATTRIBUTES
 * - OTEL_EXPORTER_OTLP_ENDPOINT
 * - OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
 * - OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
 * - OTEL_SDK_DISABLED
 *
 * @param defaults - Default values to use when env vars are not set
 * @returns Telemetry configuration
 */
export declare function createConfigFromEnv(defaults?: Partial<TelemetryConfig>): TelemetryConfig;
/**
 * Gets the global trace API.
 */
export declare function getTraceApi(): import("@opentelemetry/api").TraceAPI;
/**
 * Gets the global metrics API.
 */
export declare function getMetricsApi(): import("@opentelemetry/api").MetricsAPI;
/**
 * Gets the global context API.
 */
export declare function getContextApi(): import("@opentelemetry/api").ContextAPI;
/**
 * Gets the global propagation API.
 */
export declare function getPropagationApi(): import("@opentelemetry/api").PropagationAPI;
//# sourceMappingURL=index.d.ts.map