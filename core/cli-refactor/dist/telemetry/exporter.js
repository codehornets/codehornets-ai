/**
 * Telemetry Exporter Module
 *
 * Provides export functionality for traces and metrics using OTLP protocol.
 * Supports both HTTP and gRPC transports with configurable batching.
 */
import { TimeUtils, getSharedClock } from './clock.js';
// =============================================================================
// Export Result Handling
// =============================================================================
/**
 * Export result status codes.
 */
export const ExportResultCode = {
    SUCCESS: 0,
    FAILED: 1,
};
/**
 * Creates a successful export result.
 */
export function createSuccessResult() {
    return ExportResultCode.SUCCESS;
}
/**
 * Creates a failed export result.
 */
export function createFailedResult() {
    return ExportResultCode.FAILED;
}
// =============================================================================
// OTLP Trace Serialization
// =============================================================================
/**
 * Converts attributes to OTLP key-value format.
 */
export function attributesToOTLP(attributes) {
    return Object.entries(attributes).map(([key, value]) => {
        const kvp = { key, value: {} };
        if (typeof value === 'string') {
            kvp.value.stringValue = value;
        }
        else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                kvp.value.intValue = value;
            }
            else {
                kvp.value.stringValue = String(value);
            }
        }
        else if (typeof value === 'boolean') {
            kvp.value.boolValue = value;
        }
        else if (Array.isArray(value)) {
            kvp.value.arrayValue = {
                values: value.map((v) => {
                    if (typeof v === 'string')
                        return { stringValue: v };
                    if (typeof v === 'number')
                        return { intValue: v };
                    if (typeof v === 'boolean')
                        return { boolValue: v };
                    return { stringValue: String(v) };
                }),
            };
        }
        return kvp;
    });
}
/**
 * Converts a hex string to bytes array.
 */
export function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return bytes;
}
/**
 * Converts span data to OTLP format.
 */
export function spanToOTLP(span) {
    return {
        traceId: hexToBytes(span.traceId),
        spanId: hexToBytes(span.spanId),
        parentSpanId: span.parentSpanId ? hexToBytes(span.parentSpanId) : undefined,
        traceState: span.traceState,
        name: span.name,
        kind: span.kind + 1, // OTLP uses 1-indexed enum
        startTimeUnixNano: span.startTimeUnixNano.toString(),
        endTimeUnixNano: span.endTimeUnixNano.toString(),
        attributes: attributesToOTLP(span.attributes),
        droppedAttributesCount: span.droppedAttributesCount,
        events: span.events.map((event) => ({
            timeUnixNano: event.timestamp
                ? TimeUtils.millisToNanos(event.timestamp).toString()
                : getSharedClock().nanoTime().toString(),
            name: event.name,
            attributes: event.attributes ? attributesToOTLP(event.attributes) : [],
            droppedAttributesCount: 0,
        })),
        droppedEventsCount: span.droppedEventsCount,
        links: span.links.map((link) => ({
            traceId: hexToBytes(link.traceId),
            spanId: hexToBytes(link.spanId),
            attributes: link.attributes ? attributesToOTLP(link.attributes) : [],
            droppedAttributesCount: 0,
        })),
        droppedLinksCount: span.droppedLinksCount,
        status: {
            code: span.status.code,
            message: span.status.message,
        },
    };
}
/**
 * Creates an OTLP trace export request.
 */
export function createTraceExportRequest(batch) {
    return {
        resourceSpans: [
            {
                resource: {
                    attributes: attributesToOTLP(batch.resource.attributes),
                },
                scopeSpans: [
                    {
                        scope: {
                            name: batch.scope.name,
                            version: batch.scope.version,
                        },
                        spans: batch.spans.map(spanToOTLP),
                        schemaUrl: batch.scope.schemaUrl,
                    },
                ],
                schemaUrl: batch.resource.schemaUrl,
            },
        ],
    };
}
// =============================================================================
// OTLP Metrics Serialization
// =============================================================================
/**
 * Creates an OTLP metrics export request.
 */
export function createMetricsExportRequest(batch) {
    return {
        resourceMetrics: [
            {
                resource: {
                    attributes: attributesToOTLP(batch.resource.attributes),
                },
                scopeMetrics: [
                    {
                        scope: {
                            name: batch.scope.name,
                            version: batch.scope.version,
                        },
                        metrics: batch.metrics.map((metric) => ({
                            name: metric.name,
                            description: metric.description,
                            unit: metric.unit,
                            // Type-specific data would go here
                            data: metric.data,
                        })),
                        schemaUrl: batch.scope.schemaUrl,
                    },
                ],
                schemaUrl: batch.resource.schemaUrl,
            },
        ],
    };
}
/**
 * Default batch export configuration.
 */
export const DEFAULT_BATCH_CONFIG = {
    maxBatchSize: 512,
    scheduledDelayMs: 5000,
    exportTimeoutMs: 30000,
    maxQueueSize: 2048,
};
/**
 * Abstract base class for OTLP exporters.
 */
export class OTLPExporter {
    config;
    batchConfig;
    queue = [];
    exportTimer = null;
    isShuttingDown = false;
    constructor(config, batchConfig = {}) {
        this.config = {
            url: config.url,
            headers: config.headers ?? {},
            timeout: config.timeout ?? 30000,
            compression: config.compression ?? 'none',
        };
        this.batchConfig = { ...DEFAULT_BATCH_CONFIG, ...batchConfig };
    }
    /**
     * Adds items to the export queue.
     */
    enqueue(items) {
        if (this.isShuttingDown)
            return;
        // Check queue capacity
        const availableSpace = this.batchConfig.maxQueueSize - this.queue.length;
        if (availableSpace <= 0) {
            console.warn(`Telemetry export queue full, dropping ${items.length} items`);
            return;
        }
        // Add items up to available space
        const itemsToAdd = items.slice(0, availableSpace);
        this.queue.push(...itemsToAdd);
        // Schedule export if we have enough items
        if (this.queue.length >= this.batchConfig.maxBatchSize) {
            this.flushNow();
        }
        else if (!this.exportTimer) {
            this.scheduleExport();
        }
    }
    /**
     * Schedules the next export.
     */
    scheduleExport() {
        if (this.exportTimer)
            return;
        this.exportTimer = setTimeout(() => {
            this.exportTimer = null;
            this.flushNow();
        }, this.batchConfig.scheduledDelayMs);
    }
    /**
     * Flushes the current queue immediately.
     */
    async flushNow() {
        if (this.queue.length === 0)
            return;
        // Clear the timer
        if (this.exportTimer) {
            clearTimeout(this.exportTimer);
            this.exportTimer = null;
        }
        // Take items from queue up to batch size
        const batch = this.queue.splice(0, this.batchConfig.maxBatchSize);
        try {
            await this.doExport(batch);
        }
        catch (error) {
            console.error('Telemetry export failed:', error);
        }
        // Schedule next export if there are more items
        if (this.queue.length > 0) {
            this.scheduleExport();
        }
    }
    /**
     * Flushes all remaining items and shuts down.
     */
    async shutdown() {
        this.isShuttingDown = true;
        if (this.exportTimer) {
            clearTimeout(this.exportTimer);
            this.exportTimer = null;
        }
        // Export remaining items in batches
        while (this.queue.length > 0) {
            await this.flushNow();
        }
    }
    /**
     * Sends data to the OTLP endpoint.
     */
    async sendRequest(body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.batchConfig.exportTimeoutMs);
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...this.config.headers,
            };
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`OTLP export failed: ${response.status} ${response.statusText}`);
            }
            return response;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
/**
 * OTLP Trace Exporter for HTTP transport.
 */
export class OTLPTraceExporter extends OTLPExporter {
    resource;
    scope;
    constructor(config, resource, scope, batchConfig) {
        super(config, batchConfig);
        this.resource = resource;
        this.scope = scope;
    }
    /**
     * Exports a batch of spans.
     */
    export(spans) {
        this.enqueue(spans);
    }
    async doExport(spans) {
        const request = createTraceExportRequest({
            resource: this.resource,
            scope: this.scope,
            spans,
        });
        await this.sendRequest(JSON.stringify(request));
    }
}
/**
 * OTLP Metrics Exporter for HTTP transport.
 */
export class OTLPMetricsExporter extends OTLPExporter {
    resource;
    scope;
    constructor(config, resource, scope, batchConfig) {
        super(config, batchConfig);
        this.resource = resource;
        this.scope = scope;
    }
    /**
     * Exports metric data.
     */
    export(metrics) {
        this.enqueue(metrics);
    }
    async doExport(metrics) {
        const request = createMetricsExportRequest({
            resource: this.resource,
            scope: this.scope,
            metrics: metrics,
        });
        await this.sendRequest(JSON.stringify(request));
    }
}
// =============================================================================
// Console Exporter (for development/debugging)
// =============================================================================
/**
 * Console exporter for development and debugging.
 */
export class ConsoleSpanExporter {
    includeDetails;
    constructor(options) {
        this.includeDetails = options?.includeDetails ?? false;
    }
    /**
     * Exports spans to console.
     */
    export(spans) {
        for (const span of spans) {
            const duration = Number(span.endTimeUnixNano - span.startTimeUnixNano) / 1_000_000;
            console.log(`[TRACE] ${span.name} (${duration.toFixed(2)}ms)`, this.includeDetails
                ? {
                    traceId: span.traceId,
                    spanId: span.spanId,
                    parentSpanId: span.parentSpanId,
                    kind: span.kind,
                    status: span.status,
                    attributes: span.attributes,
                    events: span.events,
                }
                : '');
        }
    }
    async shutdown() {
        // No cleanup needed
    }
}
// =============================================================================
// No-Op Exporter
// =============================================================================
/**
 * No-op exporter that discards all data (for disabled telemetry).
 */
export class NoOpExporter {
    export(_items) {
        // Intentionally empty
    }
    async shutdown() {
        // No cleanup needed
    }
}
// =============================================================================
// Exporter Factory
// =============================================================================
/**
 * Creates an appropriate trace exporter based on configuration.
 */
export function createTraceExporter(config, resource, scope, options) {
    if (options?.console) {
        return new ConsoleSpanExporter({ includeDetails: true });
    }
    if (config) {
        return new OTLPTraceExporter(config, resource, scope);
    }
    return new NoOpExporter();
}
/**
 * Creates an appropriate metrics exporter based on configuration.
 */
export function createMetricsExporter(config, resource, scope) {
    if (config) {
        return new OTLPMetricsExporter(config, resource, scope);
    }
    return new NoOpExporter();
}
//# sourceMappingURL=exporter.js.map