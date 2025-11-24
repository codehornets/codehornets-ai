/**
 * Telemetry Types Module
 *
 * TypeScript interfaces and types for telemetry/observability functionality.
 * These types align with OpenTelemetry specifications and provide strong typing
 * for metrics, traces, and context propagation.
 */
/**
 * Aggregation temporality for metrics.
 */
export var AggregationTemporality;
(function (AggregationTemporality) {
    AggregationTemporality[AggregationTemporality["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    AggregationTemporality[AggregationTemporality["DELTA"] = 1] = "DELTA";
    AggregationTemporality[AggregationTemporality["CUMULATIVE"] = 2] = "CUMULATIVE";
})(AggregationTemporality || (AggregationTemporality = {}));
// =============================================================================
// Exporter Types
// =============================================================================
/**
 * Export result status.
 */
export var ExportResult;
(function (ExportResult) {
    ExportResult[ExportResult["SUCCESS"] = 0] = "SUCCESS";
    ExportResult[ExportResult["FAILED"] = 1] = "FAILED";
})(ExportResult || (ExportResult = {}));
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
};
//# sourceMappingURL=types.js.map