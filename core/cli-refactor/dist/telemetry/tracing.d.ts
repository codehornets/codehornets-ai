/**
 * Tracing Module
 *
 * Provides distributed tracing utilities built on OpenTelemetry.
 * Supports creating spans, recording events, and propagating trace context.
 *
 * Key features:
 * - Automatic span lifecycle management
 * - Exception recording with stack traces
 * - Nested span support
 * - Context propagation helpers
 */
import { SpanKind, SpanStatusCode, type Span, type Tracer, type Context, type Attributes } from '@opentelemetry/api';
import type { SpanOptions } from './types.js';
/**
 * Gets the default tracer instance.
 *
 * @returns The default tracer
 */
export declare function getTracer(): Tracer;
/**
 * Gets a tracer with a custom name.
 *
 * @param name - The tracer name
 * @param version - Optional version
 * @returns The tracer instance
 */
export declare function getNamedTracer(name: string, version?: string): Tracer;
/**
 * Creates and starts a new span.
 *
 * @param name - The span name
 * @param options - Optional span configuration
 * @param parentContext - Optional parent context
 * @returns The created span
 */
export declare function startSpan(name: string, options?: SpanOptions, parentContext?: Context): Span;
/**
 * Runs a function within a span context.
 *
 * @param name - The span name
 * @param fn - The function to execute
 * @param options - Optional span configuration
 * @returns The function result
 */
export declare function withSpan<T>(name: string, fn: (span: Span) => T, options?: SpanOptions): T;
/**
 * Runs an async function within a span context.
 *
 * @param name - The span name
 * @param fn - The async function to execute
 * @param options - Optional span configuration
 * @returns Promise resolving to the function result
 */
export declare function withSpanAsync<T>(name: string, fn: (span: Span) => Promise<T>, options?: SpanOptions): Promise<T>;
/**
 * Gets the currently active span.
 *
 * @returns The active span or undefined
 */
export declare function getActiveSpan(): Span | undefined;
/**
 * Gets the current span context.
 *
 * @returns The span context or undefined
 */
export declare function getSpanContext(): {
    traceId: string;
    spanId: string;
} | undefined;
/**
 * Sets attributes on the active span.
 *
 * @param attributes - The attributes to set
 */
export declare function setSpanAttributes(attributes: Attributes): void;
/**
 * Sets a single attribute on the active span.
 *
 * @param key - The attribute key
 * @param value - The attribute value
 */
export declare function setSpanAttribute(key: string, value: string | number | boolean): void;
/**
 * Adds an event to the active span.
 *
 * @param name - The event name
 * @param attributes - Optional event attributes
 */
export declare function addSpanEvent(name: string, attributes?: Attributes): void;
/**
 * Sets the status of the active span.
 *
 * @param code - The status code
 * @param message - Optional status message
 */
export declare function setSpanStatus(code: SpanStatusCode, message?: string): void;
/**
 * Records an exception on a span.
 *
 * @param span - The span to record on (defaults to active span)
 * @param error - The error to record
 * @param escaped - Whether the exception escaped the span (unhandled)
 */
export declare function recordException(spanOrError: Span | Error | unknown, errorOrEscaped?: Error | unknown | boolean, escaped?: boolean): void;
/**
 * Runs a function with a specific span context.
 *
 * @param span - The span to use as context
 * @param fn - The function to run
 * @returns The function result
 */
export declare function runWithSpanContext<T>(span: Span, fn: () => T): T;
/**
 * Creates a detached span that doesn't affect current context.
 *
 * @param name - The span name
 * @param options - Optional span configuration
 * @returns The created span
 */
export declare function createDetachedSpan(name: string, options?: SpanOptions): Span;
/**
 * Builder class for creating spans with a fluent API.
 */
export declare class SpanBuilder {
    private name;
    private kind;
    private attributes;
    private links;
    private startTime?;
    private isRoot;
    constructor(name: string);
    /**
     * Sets the span kind.
     */
    setKind(kind: SpanKind): this;
    /**
     * Sets span as CLIENT kind.
     */
    asClient(): this;
    /**
     * Sets span as SERVER kind.
     */
    asServer(): this;
    /**
     * Sets span as PRODUCER kind.
     */
    asProducer(): this;
    /**
     * Sets span as CONSUMER kind.
     */
    asConsumer(): this;
    /**
     * Adds an attribute.
     */
    setAttribute(key: string, value: string | number | boolean): this;
    /**
     * Adds multiple attributes.
     */
    setAttributes(attributes: Attributes): this;
    /**
     * Adds a link to another span.
     */
    addLink(traceId: string, spanId: string, attributes?: Attributes): this;
    /**
     * Sets the start time.
     */
    setStartTime(time: number): this;
    /**
     * Makes this a root span.
     */
    asRoot(): this;
    /**
     * Starts the span.
     */
    start(): Span;
    /**
     * Starts the span and runs a function within it.
     */
    run<T>(fn: (span: Span) => T): T;
    /**
     * Starts the span and runs an async function within it.
     */
    runAsync<T>(fn: (span: Span) => Promise<T>): Promise<T>;
}
/**
 * Creates a new span builder.
 *
 * @param name - The span name
 * @returns A new SpanBuilder instance
 */
export declare function buildSpan(name: string): SpanBuilder;
/**
 * Traces a CLI command execution.
 *
 * @param command - The command name
 * @param fn - The command function
 * @param attributes - Additional attributes
 * @returns The command result
 */
export declare function traceCommand<T>(command: string, fn: (span: Span) => T, attributes?: Attributes): T;
/**
 * Traces an API call.
 *
 * @param endpoint - The API endpoint
 * @param method - The HTTP method
 * @param fn - The API call function
 * @returns The API call result
 */
export declare function traceApiCall<T>(endpoint: string, method: string, fn: (span: Span) => Promise<T>): Promise<T>;
/**
 * Traces a tool execution.
 *
 * @param toolName - The tool name
 * @param fn - The tool function
 * @param attributes - Additional attributes
 * @returns The tool result
 */
export declare function traceTool<T>(toolName: string, fn: (span: Span) => T, attributes?: Attributes): T;
//# sourceMappingURL=tracing.d.ts.map