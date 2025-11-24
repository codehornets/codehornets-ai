/**
 * Context Propagation Module
 *
 * Implements W3C Baggage propagation for distributed tracing context.
 * Baggage allows arbitrary key-value pairs to be propagated across service
 * boundaries along with trace context.
 *
 * @see https://www.w3.org/TR/baggage/
 */
import type { Context, TextMapGetter, TextMapSetter, TextMapPropagator } from '@opentelemetry/api';
import type { BaggageEntry, BaggageEntries, TextMapCarrier } from './types.js';
/**
 * W3C Baggage header name.
 */
export declare const BAGGAGE_HEADER = "baggage";
/**
 * Maximum length for a single key-value pair.
 */
export declare const BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
/**
 * Maximum number of key-value pairs in baggage.
 */
export declare const BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
/**
 * Maximum total length of baggage header value.
 */
export declare const BAGGAGE_MAX_TOTAL_LENGTH = 8192;
/**
 * Separator between baggage items.
 */
export declare const BAGGAGE_ITEMS_SEPARATOR = ",";
/**
 * Separator between key and value.
 */
export declare const BAGGAGE_KEY_VALUE_SEPARATOR = "=";
/**
 * Separator for metadata properties.
 */
export declare const BAGGAGE_PROPERTIES_SEPARATOR = ";";
/**
 * Encodes a baggage value for HTTP header transmission.
 *
 * @param value - The value to encode
 * @returns Percent-encoded value
 */
export declare function encodeBaggageValue(value: string): string;
/**
 * Decodes a percent-encoded baggage value.
 *
 * @param value - The encoded value
 * @returns Decoded value
 */
export declare function decodeBaggageValue(value: string): string;
/**
 * Serializes a single baggage entry to a key-value pair string.
 *
 * @param key - The baggage key
 * @param entry - The baggage entry
 * @returns Serialized key-value pair
 */
export declare function serializeBaggageEntry(key: string, entry: BaggageEntry): string;
/**
 * Gets all key-value pairs from baggage entries.
 *
 * @param entries - The baggage entries
 * @returns Array of serialized key-value pairs
 */
export declare function getKeyPairs(entries: BaggageEntries): string[];
/**
 * Serializes key-value pairs to a baggage header value.
 *
 * @param pairs - Array of key-value pair strings
 * @returns Baggage header value
 */
export declare function serializeKeyPairs(pairs: string[]): string;
/**
 * Parses a single key-value pair from a baggage header.
 *
 * @param pair - The key-value pair string
 * @returns Parsed entry or null if invalid
 */
export declare function parsePairKeyValue(pair: string): {
    key: string;
    value: string;
    metadata?: string;
} | null;
/**
 * Parses a baggage header value into a record of key-value pairs.
 *
 * @param headerValue - The baggage header value
 * @returns Record of parsed key-value pairs
 */
export declare function parseKeyPairsIntoRecord(headerValue: string): Record<string, string>;
/**
 * Default text map getter for standard objects.
 */
export declare const defaultTextMapGetter: TextMapGetter<TextMapCarrier>;
/**
 * Default text map setter for standard objects.
 */
export declare const defaultTextMapSetter: TextMapSetter<TextMapCarrier>;
/**
 * W3C Baggage Propagator
 *
 * Implements the W3C Baggage specification for propagating key-value pairs
 * across service boundaries. This propagator injects and extracts baggage
 * using the 'baggage' HTTP header.
 *
 * @example
 * ```typescript
 * const propagator = new W3CBaggagePropagator();
 *
 * // Inject baggage into carrier
 * const carrier: Record<string, string> = {};
 * propagator.inject(context, carrier, defaultTextMapSetter);
 *
 * // Extract baggage from carrier
 * const newContext = propagator.extract(context, carrier, defaultTextMapGetter);
 * ```
 */
export declare class W3CBaggagePropagator implements TextMapPropagator<TextMapCarrier> {
    /**
     * Injects baggage from context into carrier.
     *
     * @param context - The context containing baggage
     * @param carrier - The carrier to inject into
     * @param setter - The setter to use for injection
     */
    inject(context: Context, carrier: TextMapCarrier, setter: TextMapSetter<TextMapCarrier>): void;
    /**
     * Extracts baggage from carrier into context.
     *
     * @param context - The current context
     * @param carrier - The carrier to extract from
     * @param getter - The getter to use for extraction
     * @returns New context with baggage
     */
    extract(context: Context, carrier: TextMapCarrier, getter: TextMapGetter<TextMapCarrier>): Context;
    /**
     * Returns the fields that this propagator modifies.
     *
     * @returns Array of field names
     */
    fields(): string[];
}
/**
 * Checks if tracing is suppressed in the given context.
 *
 * @param context - The context to check
 * @returns True if tracing is suppressed
 */
export declare function isTracingSuppressed(context: Context): boolean;
/**
 * Sets the tracing suppression flag in the context.
 *
 * @param context - The context to modify
 * @returns New context with suppression flag
 */
export declare function suppressTracing(context: Context): Context;
/**
 * Clears the tracing suppression flag from the context.
 *
 * @param context - The context to modify
 * @returns New context without suppression flag
 */
export declare function unsuppressTracing(context: Context): Context;
/**
 * Gets baggage value from the current context.
 *
 * @param context - The context to extract from
 * @param key - The baggage key
 * @returns The baggage value or undefined
 */
export declare function getBaggageValue(context: Context, key: string): string | undefined;
/**
 * Sets a baggage value in the context.
 *
 * @param context - The context to modify
 * @param key - The baggage key
 * @param value - The baggage value
 * @param metadata - Optional metadata
 * @returns New context with updated baggage
 */
export declare function setBaggageValue(context: Context, key: string, value: string, metadata?: string): Context;
/**
 * Removes a baggage entry from the context.
 *
 * @param context - The context to modify
 * @param key - The baggage key to remove
 * @returns New context with baggage entry removed
 */
export declare function removeBaggageValue(context: Context, key: string): Context;
/**
 * Gets all baggage entries from the context.
 *
 * @param context - The context to extract from
 * @returns Record of baggage entries
 */
export declare function getAllBaggage(context: Context): Record<string, string>;
//# sourceMappingURL=propagation.d.ts.map