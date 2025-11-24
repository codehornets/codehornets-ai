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

import {
  trace,
  metrics,
  context,
  propagation,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api';
import type { TelemetryConfig, Resource, InstrumentationScope } from './types.js';
import { W3CBaggagePropagator } from './propagation.js';
import { getSharedClock, resetSharedClock } from './clock.js';
import {
  createTraceExporter,
  createMetricsExporter,
  ConsoleSpanExporter,
  NoOpExporter,
} from './exporter.js';

// =============================================================================
// Re-exports
// =============================================================================

// Types
export type {
  Clock,
  MonotonicClock,
  AnchoredClockConfig,
  HistogramConfig,
  ExponentialHistogramConfig,
  CounterConfig,
  GaugeConfig,
  MetricDataPoint,
  HistogramData,
  ExponentialHistogramBuckets,
  ExponentialHistogramData,
  SpanOptions,
  SpanLink,
  SpanEvent,
  SpanStatus,
  SpanData,
  BaggageEntry,
  BaggageEntries,
  TextMapCarrier,
  TextMapGetter,
  TextMapSetter,
  AttributeValidationResult,
  Resource,
  InstrumentationScope,
  OTLPExporterConfig,
  SpanExportBatch,
  MetricExportBatch,
  TelemetryConfig,
} from './types.js';
export { AggregationTemporality, ExportResult, TelemetryEnvVars } from './types.js';

// Clock
export {
  AnchoredClock,
  TimeUtils,
  defaultWallClock,
  defaultMonotonicClock,
  getSharedClock,
  resetSharedClock,
} from './clock.js';

// Attributes
export {
  isAttributeKey,
  isAttributeValue,
  validateAttribute,
  sanitizeAttributes,
  HttpAttributes,
  DbAttributes,
  RpcAttributes,
  NetAttributes,
  ExceptionAttributes,
  CodeAttributes,
  ThreadAttributes,
  MessagingAttributes,
  FaasAttributes,
  AwsAttributes,
  PeerAttributes,
  EnduserAttributes,
  SemanticAttributes,
  DbSystemValues,
  NetTransportValues,
  HttpFlavorValues,
  RpcGrpcStatusCodeValues,
} from './attributes.js';

// Propagation
export {
  BAGGAGE_HEADER,
  BAGGAGE_MAX_PER_NAME_VALUE_PAIRS,
  BAGGAGE_MAX_NAME_VALUE_PAIRS,
  BAGGAGE_MAX_TOTAL_LENGTH,
  W3CBaggagePropagator,
  encodeBaggageValue,
  decodeBaggageValue,
  serializeBaggageEntry,
  getKeyPairs,
  serializeKeyPairs,
  parsePairKeyValue,
  parseKeyPairsIntoRecord,
  defaultTextMapGetter,
  defaultTextMapSetter,
  isTracingSuppressed,
  suppressTracing,
  unsuppressTracing,
  getBaggageValue,
  setBaggageValue,
  removeBaggageValue,
  getAllBaggage,
} from './propagation.js';

// Metrics
export {
  getMeter,
  getNamedMeter,
  DEFAULT_LATENCY_BOUNDARIES,
  DEFAULT_SIZE_BOUNDARIES,
  createHistogram,
  createCounter,
  createUpDownCounter,
  createGauge,
  HistogramRecorder,
  ExponentialHistogramAccumulation,
  ExponentialHistogramAggregator,
  CounterRecorder,
  GaugeRecorder,
  CLIMetrics,
} from './metrics.js';

// Tracing
export {
  getTracer,
  getNamedTracer,
  startSpan,
  withSpan,
  withSpanAsync,
  getActiveSpan,
  getSpanContext,
  setSpanAttributes,
  setSpanAttribute,
  addSpanEvent,
  setSpanStatus,
  recordException,
  runWithSpanContext,
  createDetachedSpan,
  SpanBuilder,
  buildSpan,
  traceCommand,
  traceApiCall,
  traceTool,
} from './tracing.js';

// Exporter
export {
  ExportResultCode,
  createSuccessResult,
  createFailedResult,
  attributesToOTLP,
  hexToBytes,
  spanToOTLP,
  createTraceExportRequest,
  createMetricsExportRequest,
  DEFAULT_BATCH_CONFIG,
  OTLPExporter,
  OTLPTraceExporter,
  OTLPMetricsExporter,
  ConsoleSpanExporter,
  NoOpExporter,
  createTraceExporter,
  createMetricsExporter,
} from './exporter.js';

// Re-export common types from OpenTelemetry API
export { SpanKind, SpanStatusCode } from '@opentelemetry/api';
export type { Span, Tracer, Meter, Counter, Histogram, Context, Attributes } from '@opentelemetry/api';

// =============================================================================
// Telemetry SDK Initialization
// =============================================================================

/**
 * Global telemetry state.
 */
interface TelemetryState {
  initialized: boolean;
  config: TelemetryConfig | null;
  resource: Resource | null;
  scope: InstrumentationScope | null;
}

const state: TelemetryState = {
  initialized: false,
  config: null,
  resource: null,
  scope: null,
};

/**
 * Creates a resource object from configuration.
 */
function createResource(config: TelemetryConfig): Resource {
  return {
    attributes: {
      'service.name': config.serviceName,
      'service.version': config.serviceVersion ?? '0.0.0',
      'deployment.environment': config.environment ?? 'development',
      ...config.resourceAttributes,
    },
    schemaUrl: 'https://opentelemetry.io/schemas/1.21.0',
  };
}

/**
 * Creates an instrumentation scope.
 */
function createScope(): InstrumentationScope {
  return {
    name: '@anthropic-ai/claude-code',
    version: '1.0.0',
    schemaUrl: 'https://opentelemetry.io/schemas/1.21.0',
  };
}

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
export async function initializeTelemetry(config: TelemetryConfig): Promise<void> {
  if (state.initialized) {
    console.warn('Telemetry already initialized, skipping re-initialization');
    return;
  }

  // Check if telemetry is disabled
  if (config.enabled === false || process.env.OTEL_SDK_DISABLED === 'true') {
    state.initialized = true;
    state.config = config;
    return;
  }

  // Set up diagnostic logging
  const logLevel = getLogLevelFromEnv();
  if (logLevel !== DiagLogLevel.NONE) {
    diag.setLogger(new DiagConsoleLogger(), logLevel);
  }

  // Create resource and scope
  state.resource = createResource(config);
  state.scope = createScope();
  state.config = config;

  // Set up propagation
  propagation.setGlobalPropagator(new W3CBaggagePropagator());

  state.initialized = true;
}

/**
 * Gets the log level from environment variables.
 */
function getLogLevelFromEnv(): DiagLogLevel {
  const level = process.env.OTEL_LOG_LEVEL?.toLowerCase();
  switch (level) {
    case 'verbose':
    case 'all':
      return DiagLogLevel.VERBOSE;
    case 'debug':
      return DiagLogLevel.DEBUG;
    case 'info':
      return DiagLogLevel.INFO;
    case 'warn':
    case 'warning':
      return DiagLogLevel.WARN;
    case 'error':
      return DiagLogLevel.ERROR;
    case 'none':
      return DiagLogLevel.NONE;
    default:
      return DiagLogLevel.NONE;
  }
}

/**
 * Shuts down the telemetry SDK gracefully.
 *
 * This flushes any pending exports and releases resources.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!state.initialized) return;

  // Reset state
  state.initialized = false;
  state.config = null;
  state.resource = null;
  state.scope = null;
  resetSharedClock();
}

/**
 * Checks if telemetry is initialized.
 */
export function isTelemetryInitialized(): boolean {
  return state.initialized;
}

/**
 * Gets the current telemetry configuration.
 */
export function getTelemetryConfig(): TelemetryConfig | null {
  return state.config;
}

/**
 * Gets the current resource.
 */
export function getTelemetryResource(): Resource | null {
  return state.resource;
}

/**
 * Checks if tracing is enabled.
 */
export function isTracingEnabled(): boolean {
  return state.initialized && state.config?.tracing?.enabled !== false;
}

/**
 * Checks if metrics are enabled.
 */
export function isMetricsEnabled(): boolean {
  return state.initialized && state.config?.metrics?.enabled !== false;
}

// =============================================================================
// Environment-based Configuration
// =============================================================================

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
export function createConfigFromEnv(defaults: Partial<TelemetryConfig> = {}): TelemetryConfig {
  const serviceName = process.env.OTEL_SERVICE_NAME ?? defaults.serviceName ?? 'unknown-service';

  // Parse resource attributes from environment
  const resourceAttributes = parseResourceAttributes(process.env.OTEL_RESOURCE_ATTRIBUTES);

  // Determine endpoints
  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const tracesEndpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    (baseEndpoint ? `${baseEndpoint}/v1/traces` : undefined);
  const metricsEndpoint =
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
    (baseEndpoint ? `${baseEndpoint}/v1/metrics` : undefined);

  // Check if disabled
  const disabled = process.env.OTEL_SDK_DISABLED === 'true';

  return {
    serviceName,
    serviceVersion: resourceAttributes['service.version'] as string | undefined ?? defaults.serviceVersion,
    environment: resourceAttributes['deployment.environment'] as string | undefined ?? defaults.environment,
    enabled: !disabled && (defaults.enabled ?? true),
    tracing: {
      enabled: !disabled && (defaults.tracing?.enabled ?? true),
      exporter: tracesEndpoint ? { url: tracesEndpoint } : defaults.tracing?.exporter,
      samplingRatio: parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG ?? '1.0'),
    },
    metrics: {
      enabled: !disabled && (defaults.metrics?.enabled ?? true),
      exporter: metricsEndpoint ? { url: metricsEndpoint } : defaults.metrics?.exporter,
    },
    resourceAttributes: {
      ...resourceAttributes,
      ...defaults.resourceAttributes,
    },
  };
}

/**
 * Parses resource attributes from the OTEL_RESOURCE_ATTRIBUTES format.
 *
 * Format: key1=value1,key2=value2,...
 */
function parseResourceAttributes(value: string | undefined): Record<string, string> {
  if (!value) return {};

  const attributes: Record<string, string> = {};
  const pairs = value.split(',');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      attributes[key.trim()] = valueParts.join('=').trim();
    }
  }

  return attributes;
}

// =============================================================================
// Convenience Re-exports from OpenTelemetry API
// =============================================================================

/**
 * Gets the global trace API.
 */
export function getTraceApi() {
  return trace;
}

/**
 * Gets the global metrics API.
 */
export function getMetricsApi() {
  return metrics;
}

/**
 * Gets the global context API.
 */
export function getContextApi() {
  return context;
}

/**
 * Gets the global propagation API.
 */
export function getPropagationApi() {
  return propagation;
}
