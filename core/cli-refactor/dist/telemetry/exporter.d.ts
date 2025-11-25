/**
 * Telemetry Exporter Module
 *
 * Provides export functionality for traces and metrics using OTLP protocol.
 * Supports both HTTP and gRPC transports with configurable batching.
 */
import type { Attributes } from '@opentelemetry/api';
import type { Resource, InstrumentationScope, SpanData, OTLPExporterConfig, ExportResult, SpanExportBatch, MetricExportBatch } from './types.js';
/**
 * Export result status codes.
 */
export declare const ExportResultCode: {
    readonly SUCCESS: ExportResult;
    readonly FAILED: ExportResult;
};
/**
 * Creates a successful export result.
 */
export declare function createSuccessResult(): ExportResult;
/**
 * Creates a failed export result.
 */
export declare function createFailedResult(): ExportResult;
/**
 * Converts attributes to OTLP key-value format.
 */
export declare function attributesToOTLP(attributes: Attributes): Array<{
    key: string;
    value: {
        stringValue?: string;
        intValue?: number;
        boolValue?: boolean;
        arrayValue?: unknown;
    };
}>;
/**
 * Converts a hex string to bytes array.
 */
export declare function hexToBytes(hex: string): number[];
/**
 * Converts span data to OTLP format.
 */
export declare function spanToOTLP(span: SpanData): Record<string, unknown>;
/**
 * Creates an OTLP trace export request.
 */
export declare function createTraceExportRequest(batch: SpanExportBatch): Record<string, unknown>;
/**
 * Creates an OTLP metrics export request.
 */
export declare function createMetricsExportRequest(batch: MetricExportBatch): Record<string, unknown>;
/**
 * Configuration for batch export.
 */
export interface BatchExportConfig {
    /** Maximum number of items per batch */
    maxBatchSize: number;
    /** Maximum time to wait before exporting a batch (ms) */
    scheduledDelayMs: number;
    /** Maximum time to wait for export to complete (ms) */
    exportTimeoutMs: number;
    /** Maximum queue size before dropping items */
    maxQueueSize: number;
}
/**
 * Default batch export configuration.
 */
export declare const DEFAULT_BATCH_CONFIG: BatchExportConfig;
/**
 * Abstract base class for OTLP exporters.
 */
export declare abstract class OTLPExporter<T> {
    protected readonly config: OTLPExporterConfig;
    protected readonly batchConfig: BatchExportConfig;
    protected queue: T[];
    protected exportTimer: ReturnType<typeof setTimeout> | null;
    protected isShuttingDown: boolean;
    constructor(config: OTLPExporterConfig, batchConfig?: Partial<BatchExportConfig>);
    /**
     * Adds items to the export queue.
     */
    enqueue(items: T[]): void;
    /**
     * Schedules the next export.
     */
    protected scheduleExport(): void;
    /**
     * Flushes the current queue immediately.
     */
    flushNow(): Promise<void>;
    /**
     * Flushes all remaining items and shuts down.
     */
    shutdown(): Promise<void>;
    /**
     * Performs the actual export. Implemented by subclasses.
     */
    protected abstract doExport(items: T[]): Promise<void>;
    /**
     * Sends data to the OTLP endpoint.
     */
    protected sendRequest(body: string): Promise<Response>;
}
/**
 * OTLP Trace Exporter for HTTP transport.
 */
export declare class OTLPTraceExporter extends OTLPExporter<SpanData> {
    private resource;
    private scope;
    constructor(config: OTLPExporterConfig, resource: Resource, scope: InstrumentationScope, batchConfig?: Partial<BatchExportConfig>);
    /**
     * Exports a batch of spans.
     */
    export(spans: SpanData[]): void;
    protected doExport(spans: SpanData[]): Promise<void>;
}
/**
 * OTLP Metrics Exporter for HTTP transport.
 */
export declare class OTLPMetricsExporter extends OTLPExporter<Record<string, unknown>> {
    private resource;
    private scope;
    constructor(config: OTLPExporterConfig, resource: Resource, scope: InstrumentationScope, batchConfig?: Partial<BatchExportConfig>);
    /**
     * Exports metric data.
     */
    export(metrics: Array<{
        name: string;
        description?: string;
        unit?: string;
        data: unknown;
    }>): void;
    protected doExport(metrics: Record<string, unknown>[]): Promise<void>;
}
/**
 * Console exporter for development and debugging.
 */
export declare class ConsoleSpanExporter {
    private readonly includeDetails;
    constructor(options?: {
        includeDetails?: boolean;
    });
    /**
     * Exports spans to console.
     */
    export(spans: SpanData[]): void;
    shutdown(): Promise<void>;
}
/**
 * No-op exporter that discards all data (for disabled telemetry).
 */
export declare class NoOpExporter<T> {
    export(_items: T[]): void;
    shutdown(): Promise<void>;
}
/**
 * Creates an appropriate trace exporter based on configuration.
 */
export declare function createTraceExporter(config: OTLPExporterConfig | null, resource: Resource, scope: InstrumentationScope, options?: {
    console?: boolean;
}): OTLPTraceExporter | ConsoleSpanExporter | NoOpExporter<SpanData>;
/**
 * Creates an appropriate metrics exporter based on configuration.
 */
export declare function createMetricsExporter(config: OTLPExporterConfig | null, resource: Resource, scope: InstrumentationScope): OTLPMetricsExporter | NoOpExporter<Record<string, unknown>>;
//# sourceMappingURL=exporter.d.ts.map