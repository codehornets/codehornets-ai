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

import {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
  type Span,
  type Tracer,
  type Context,
  type Attributes,
} from '@opentelemetry/api';
import type { SpanOptions, SpanEvent, SpanLink, SpanData, SpanStatus } from './types.js';
import { getSharedClock, TimeUtils } from './clock.js';
import { ExceptionAttributes, sanitizeAttributes } from './attributes.js';

// =============================================================================
// Tracer Provider
// =============================================================================

/**
 * Default tracer name for CLI telemetry.
 */
const DEFAULT_TRACER_NAME = '@anthropic-ai/claude-code';

/**
 * Default tracer version.
 */
const DEFAULT_TRACER_VERSION = '1.0.0';

/**
 * Gets the default tracer instance.
 *
 * @returns The default tracer
 */
export function getTracer(): Tracer {
  return trace.getTracer(DEFAULT_TRACER_NAME, DEFAULT_TRACER_VERSION);
}

/**
 * Gets a tracer with a custom name.
 *
 * @param name - The tracer name
 * @param version - Optional version
 * @returns The tracer instance
 */
export function getNamedTracer(name: string, version?: string): Tracer {
  return trace.getTracer(name, version);
}

// =============================================================================
// Span Creation and Management
// =============================================================================

/**
 * Creates and starts a new span.
 *
 * @param name - The span name
 * @param options - Optional span configuration
 * @param parentContext - Optional parent context
 * @returns The created span
 */
export function startSpan(
  name: string,
  options?: SpanOptions,
  parentContext?: Context
): Span {
  const tracer = getTracer();
  const ctx = parentContext ?? context.active();

  return tracer.startSpan(
    name,
    {
      kind: options?.kind ?? SpanKind.INTERNAL,
      attributes: options?.attributes ? sanitizeAttributes(options.attributes) : undefined,
      links: options?.links?.map((link) => ({
        context: {
          traceId: link.traceId,
          spanId: link.spanId,
          traceFlags: 1, // Sampled
        },
        attributes: link.attributes ? sanitizeAttributes(link.attributes) : undefined,
      })),
      startTime: options?.startTime,
      root: options?.root,
    },
    ctx
  );
}

/**
 * Runs a function within a span context.
 *
 * @param name - The span name
 * @param fn - The function to execute
 * @param options - Optional span configuration
 * @returns The function result
 */
export function withSpan<T>(
  name: string,
  fn: (span: Span) => T,
  options?: SpanOptions
): T {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    name,
    {
      kind: options?.kind ?? SpanKind.INTERNAL,
      attributes: options?.attributes ? sanitizeAttributes(options.attributes) : undefined,
      root: options?.root,
    },
    (span) => {
      try {
        const result = fn(span);
        if (result instanceof Promise) {
          return result
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return value;
            })
            .catch((error) => {
              recordException(span, error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
              });
              span.end();
              throw error;
            }) as T;
        }
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        recordException(span, error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.end();
        throw error;
      }
    }
  );
}

/**
 * Runs an async function within a span context.
 *
 * @param name - The span name
 * @param fn - The async function to execute
 * @param options - Optional span configuration
 * @returns Promise resolving to the function result
 */
export async function withSpanAsync<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(
    name,
    {
      kind: options?.kind ?? SpanKind.INTERNAL,
      attributes: options?.attributes ? sanitizeAttributes(options.attributes) : undefined,
      root: options?.root,
    },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        recordException(span, error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.end();
        throw error;
      }
    }
  );
}

// =============================================================================
// Span Helpers
// =============================================================================

/**
 * Gets the currently active span.
 *
 * @returns The active span or undefined
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Gets the current span context.
 *
 * @returns The span context or undefined
 */
export function getSpanContext(): { traceId: string; spanId: string } | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Sets attributes on the active span.
 *
 * @param attributes - The attributes to set
 */
export function setSpanAttributes(attributes: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(sanitizeAttributes(attributes));
  }
}

/**
 * Sets a single attribute on the active span.
 *
 * @param key - The attribute key
 * @param value - The attribute value
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

/**
 * Adds an event to the active span.
 *
 * @param name - The event name
 * @param attributes - Optional event attributes
 */
export function addSpanEvent(name: string, attributes?: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes ? sanitizeAttributes(attributes) : undefined);
  }
}

/**
 * Sets the status of the active span.
 *
 * @param code - The status code
 * @param message - Optional status message
 */
export function setSpanStatus(code: SpanStatusCode, message?: string): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setStatus({ code, message });
  }
}

/**
 * Records an exception on a span.
 *
 * @param span - The span to record on (defaults to active span)
 * @param error - The error to record
 * @param escaped - Whether the exception escaped the span (unhandled)
 */
export function recordException(
  spanOrError: Span | Error | unknown,
  errorOrEscaped?: Error | unknown | boolean,
  escaped = true
): void {
  let span: Span | undefined;
  let error: Error | unknown;
  let isEscaped = escaped;

  // Handle overloaded arguments
  if (spanOrError instanceof Error || !(spanOrError as Span).recordException) {
    span = trace.getActiveSpan();
    error = spanOrError;
    if (typeof errorOrEscaped === 'boolean') {
      isEscaped = errorOrEscaped;
    }
  } else {
    span = spanOrError as Span;
    error = errorOrEscaped;
  }

  if (!span) return;

  const attributes: Attributes = {
    [ExceptionAttributes.ESCAPED]: isEscaped,
  };

  if (error instanceof Error) {
    attributes[ExceptionAttributes.TYPE] = error.name;
    attributes[ExceptionAttributes.MESSAGE] = error.message;
    if (error.stack) {
      attributes[ExceptionAttributes.STACKTRACE] = error.stack;
    }
  } else if (error !== undefined) {
    attributes[ExceptionAttributes.TYPE] = 'Error';
    attributes[ExceptionAttributes.MESSAGE] = String(error);
  }

  span.recordException(error instanceof Error ? error : new Error(String(error)));
}

// =============================================================================
// Context Propagation
// =============================================================================

/**
 * Runs a function with a specific span context.
 *
 * @param span - The span to use as context
 * @param fn - The function to run
 * @returns The function result
 */
export function runWithSpanContext<T>(span: Span, fn: () => T): T {
  return context.with(trace.setSpan(context.active(), span), fn);
}

/**
 * Creates a detached span that doesn't affect current context.
 *
 * @param name - The span name
 * @param options - Optional span configuration
 * @returns The created span
 */
export function createDetachedSpan(name: string, options?: SpanOptions): Span {
  const tracer = getTracer();
  return tracer.startSpan(name, {
    kind: options?.kind ?? SpanKind.INTERNAL,
    attributes: options?.attributes ? sanitizeAttributes(options.attributes) : undefined,
    root: true, // Detached spans are always root spans
  });
}

// =============================================================================
// Span Builder
// =============================================================================

/**
 * Builder class for creating spans with a fluent API.
 */
export class SpanBuilder {
  private name: string;
  private kind: SpanKind = SpanKind.INTERNAL;
  private attributes: Attributes = {};
  private links: SpanLink[] = [];
  private startTime?: number;
  private isRoot = false;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Sets the span kind.
   */
  setKind(kind: SpanKind): this {
    this.kind = kind;
    return this;
  }

  /**
   * Sets span as CLIENT kind.
   */
  asClient(): this {
    this.kind = SpanKind.CLIENT;
    return this;
  }

  /**
   * Sets span as SERVER kind.
   */
  asServer(): this {
    this.kind = SpanKind.SERVER;
    return this;
  }

  /**
   * Sets span as PRODUCER kind.
   */
  asProducer(): this {
    this.kind = SpanKind.PRODUCER;
    return this;
  }

  /**
   * Sets span as CONSUMER kind.
   */
  asConsumer(): this {
    this.kind = SpanKind.CONSUMER;
    return this;
  }

  /**
   * Adds an attribute.
   */
  setAttribute(key: string, value: string | number | boolean): this {
    this.attributes[key] = value;
    return this;
  }

  /**
   * Adds multiple attributes.
   */
  setAttributes(attributes: Attributes): this {
    Object.assign(this.attributes, attributes);
    return this;
  }

  /**
   * Adds a link to another span.
   */
  addLink(traceId: string, spanId: string, attributes?: Attributes): this {
    this.links.push({ traceId, spanId, attributes });
    return this;
  }

  /**
   * Sets the start time.
   */
  setStartTime(time: number): this {
    this.startTime = time;
    return this;
  }

  /**
   * Makes this a root span.
   */
  asRoot(): this {
    this.isRoot = true;
    return this;
  }

  /**
   * Starts the span.
   */
  start(): Span {
    return startSpan(this.name, {
      kind: this.kind,
      attributes: this.attributes,
      links: this.links.length > 0 ? this.links : undefined,
      startTime: this.startTime,
      root: this.isRoot,
    });
  }

  /**
   * Starts the span and runs a function within it.
   */
  run<T>(fn: (span: Span) => T): T {
    return withSpan(this.name, fn, {
      kind: this.kind,
      attributes: this.attributes,
      links: this.links.length > 0 ? this.links : undefined,
      root: this.isRoot,
    });
  }

  /**
   * Starts the span and runs an async function within it.
   */
  async runAsync<T>(fn: (span: Span) => Promise<T>): Promise<T> {
    return withSpanAsync(this.name, fn, {
      kind: this.kind,
      attributes: this.attributes,
      links: this.links.length > 0 ? this.links : undefined,
      root: this.isRoot,
    });
  }
}

/**
 * Creates a new span builder.
 *
 * @param name - The span name
 * @returns A new SpanBuilder instance
 */
export function buildSpan(name: string): SpanBuilder {
  return new SpanBuilder(name);
}

// =============================================================================
// Pre-built Trace Wrappers
// =============================================================================

/**
 * Traces a CLI command execution.
 *
 * @param command - The command name
 * @param fn - The command function
 * @param attributes - Additional attributes
 * @returns The command result
 */
export function traceCommand<T>(
  command: string,
  fn: (span: Span) => T,
  attributes?: Attributes
): T {
  return buildSpan(`cli.command.${command}`)
    .setKind(SpanKind.INTERNAL)
    .setAttributes({
      'cli.command.name': command,
      ...attributes,
    })
    .run(fn);
}

/**
 * Traces an API call.
 *
 * @param endpoint - The API endpoint
 * @param method - The HTTP method
 * @param fn - The API call function
 * @returns The API call result
 */
export async function traceApiCall<T>(
  endpoint: string,
  method: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return buildSpan('cli.api.call')
    .asClient()
    .setAttributes({
      'http.method': method,
      'http.url': endpoint,
    })
    .runAsync(fn);
}

/**
 * Traces a tool execution.
 *
 * @param toolName - The tool name
 * @param fn - The tool function
 * @param attributes - Additional attributes
 * @returns The tool result
 */
export function traceTool<T>(
  toolName: string,
  fn: (span: Span) => T,
  attributes?: Attributes
): T {
  return buildSpan(`cli.tool.${toolName}`)
    .setKind(SpanKind.INTERNAL)
    .setAttributes({
      'cli.tool.name': toolName,
      ...attributes,
    })
    .run(fn);
}
