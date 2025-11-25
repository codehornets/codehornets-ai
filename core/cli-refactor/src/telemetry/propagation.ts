/**
 * Context Propagation Module
 *
 * Implements W3C Baggage propagation for distributed tracing context.
 * Baggage allows arbitrary key-value pairs to be propagated across service
 * boundaries along with trace context.
 *
 * @see https://www.w3.org/TR/baggage/
 */

import type {
  Context,
  TextMapGetter,
  TextMapSetter,
  TextMapPropagator,
} from '@opentelemetry/api';
import { propagation, createContextKey } from '@opentelemetry/api';
import type { BaggageEntry, BaggageEntries, TextMapCarrier } from './types.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * W3C Baggage header name.
 */
export const BAGGAGE_HEADER = 'baggage';

/**
 * Maximum length for a single key-value pair.
 */
export const BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;

/**
 * Maximum number of key-value pairs in baggage.
 */
export const BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;

/**
 * Maximum total length of baggage header value.
 */
export const BAGGAGE_MAX_TOTAL_LENGTH = 8192;

/**
 * Separator between baggage items.
 */
export const BAGGAGE_ITEMS_SEPARATOR = ',';

/**
 * Separator between key and value.
 */
export const BAGGAGE_KEY_VALUE_SEPARATOR = '=';

/**
 * Separator for metadata properties.
 */
export const BAGGAGE_PROPERTIES_SEPARATOR = ';';

// =============================================================================
// Baggage Serialization
// =============================================================================

/**
 * Encodes a baggage value for HTTP header transmission.
 *
 * @param value - The value to encode
 * @returns Percent-encoded value
 */
export function encodeBaggageValue(value: string): string {
  // Encode characters that are not allowed in baggage values
  return encodeURIComponent(value).replace(
    /[-_.!~*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Decodes a percent-encoded baggage value.
 *
 * @param value - The encoded value
 * @returns Decoded value
 */
export function decodeBaggageValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Return original if decoding fails
    return value;
  }
}

/**
 * Serializes a single baggage entry to a key-value pair string.
 *
 * @param key - The baggage key
 * @param entry - The baggage entry
 * @returns Serialized key-value pair
 */
export function serializeBaggageEntry(key: string, entry: BaggageEntry): string {
  const encodedValue = encodeBaggageValue(entry.value);
  let pair = `${key}${BAGGAGE_KEY_VALUE_SEPARATOR}${encodedValue}`;

  if (entry.metadata) {
    pair += `${BAGGAGE_PROPERTIES_SEPARATOR}${entry.metadata}`;
  }

  return pair;
}

/**
 * Gets all key-value pairs from baggage entries.
 *
 * @param entries - The baggage entries
 * @returns Array of serialized key-value pairs
 */
export function getKeyPairs(entries: BaggageEntries): string[] {
  const pairs: string[] = [];

  for (const [key, entry] of Object.entries(entries)) {
    if (entry && entry.value) {
      pairs.push(serializeBaggageEntry(key, entry));
    }
  }

  return pairs;
}

/**
 * Serializes key-value pairs to a baggage header value.
 *
 * @param pairs - Array of key-value pair strings
 * @returns Baggage header value
 */
export function serializeKeyPairs(pairs: string[]): string {
  return pairs.join(BAGGAGE_ITEMS_SEPARATOR);
}

/**
 * Parses a single key-value pair from a baggage header.
 *
 * @param pair - The key-value pair string
 * @returns Parsed entry or null if invalid
 */
export function parsePairKeyValue(
  pair: string
): { key: string; value: string; metadata?: string } | null {
  const trimmed = pair.trim();
  if (!trimmed) return null;

  // Split by properties separator first to extract metadata
  const [keyValue, ...metadataParts] = trimmed.split(BAGGAGE_PROPERTIES_SEPARATOR);

  if (!keyValue) return null;

  const equalIndex = keyValue.indexOf(BAGGAGE_KEY_VALUE_SEPARATOR);
  if (equalIndex === -1) return null;

  const key = keyValue.slice(0, equalIndex).trim();
  const value = keyValue.slice(equalIndex + 1).trim();

  if (!key || !value) return null;

  const result: { key: string; value: string; metadata?: string } = {
    key,
    value: decodeBaggageValue(value),
  };

  if (metadataParts.length > 0) {
    result.metadata = metadataParts.join(BAGGAGE_PROPERTIES_SEPARATOR).trim();
  }

  return result;
}

/**
 * Parses a baggage header value into a record of key-value pairs.
 *
 * @param headerValue - The baggage header value
 * @returns Record of parsed key-value pairs
 */
export function parseKeyPairsIntoRecord(headerValue: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (!headerValue) return result;

  const pairs = headerValue.split(BAGGAGE_ITEMS_SEPARATOR);

  for (const pair of pairs) {
    const parsed = parsePairKeyValue(pair);
    if (parsed && parsed.value.length > 0) {
      result[parsed.key] = parsed.value;
    }
  }

  return result;
}

// =============================================================================
// W3C Baggage Propagator
// =============================================================================

/**
 * Default text map getter for standard objects.
 */
export const defaultTextMapGetter: TextMapGetter<TextMapCarrier> = {
  keys(carrier: TextMapCarrier): string[] {
    return Object.keys(carrier);
  },

  get(carrier: TextMapCarrier, key: string): string | string[] | undefined {
    const value = carrier[key];
    if (Array.isArray(value)) {
      return value.length === 1 ? value[0] : value;
    }
    return value;
  },
};

/**
 * Default text map setter for standard objects.
 */
export const defaultTextMapSetter: TextMapSetter<TextMapCarrier> = {
  set(carrier: TextMapCarrier, key: string, value: string): void {
    carrier[key] = value;
  },
};

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
export class W3CBaggagePropagator implements TextMapPropagator<TextMapCarrier> {
  /**
   * Injects baggage from context into carrier.
   *
   * @param context - The context containing baggage
   * @param carrier - The carrier to inject into
   * @param setter - The setter to use for injection
   */
  inject(
    context: Context,
    carrier: TextMapCarrier,
    setter: TextMapSetter<TextMapCarrier>
  ): void {
    const baggage = propagation.getBaggage(context);

    if (!baggage) return;

    // Convert baggage to entries
    const entries: BaggageEntries = {};
    for (const [key, entry] of baggage.getAllEntries()) {
      entries[key] = {
        value: entry.value,
        metadata: entry.metadata?.toString(),
      };
    }

    // Filter pairs by size limit
    const pairs = getKeyPairs(entries)
      .filter((pair) => pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS)
      .slice(0, BAGGAGE_MAX_NAME_VALUE_PAIRS);

    const headerValue = serializeKeyPairs(pairs);

    if (headerValue.length > 0 && headerValue.length <= BAGGAGE_MAX_TOTAL_LENGTH) {
      setter.set(carrier, BAGGAGE_HEADER, headerValue);
    }
  }

  /**
   * Extracts baggage from carrier into context.
   *
   * @param context - The current context
   * @param carrier - The carrier to extract from
   * @param getter - The getter to use for extraction
   * @returns New context with baggage
   */
  extract(
    context: Context,
    carrier: TextMapCarrier,
    getter: TextMapGetter<TextMapCarrier>
  ): Context {
    const headerValue = getter.get(carrier, BAGGAGE_HEADER);

    if (!headerValue) return context;

    // Handle array values by joining
    const value = Array.isArray(headerValue)
      ? headerValue.join(BAGGAGE_ITEMS_SEPARATOR)
      : headerValue;

    if (!value || value.length === 0) return context;

    const entries: BaggageEntries = {};
    const pairs = value.split(BAGGAGE_ITEMS_SEPARATOR);

    for (const pair of pairs) {
      const parsed = parsePairKeyValue(pair);
      if (parsed) {
        entries[parsed.key] = {
          value: parsed.value,
          metadata: parsed.metadata,
        };
      }
    }

    if (Object.keys(entries).length === 0) return context;

    // Create OpenTelemetry baggage from entries
    const baggageEntries = Object.entries(entries).map(([key, entry]) => {
      return { key, value: entry.value, metadata: entry.metadata };
    });

    // Create baggage using the propagation API
    const baggage = propagation.createBaggage(
      baggageEntries.reduce(
        (acc, { key, value, metadata }) => {
          acc[key] = { value, metadata: metadata as import("@opentelemetry/api").BaggageEntryMetadata | undefined };
          return acc;
        },
        {} as Record<string, import("@opentelemetry/api").BaggageEntry>
      )
    );

    return propagation.setBaggage(context, baggage);
  }

  /**
   * Returns the fields that this propagator modifies.
   *
   * @returns Array of field names
   */
  fields(): string[] {
    return [BAGGAGE_HEADER];
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Context key for storing trace suppression flag.
 */
const SUPPRESS_TRACING_KEY = createContextKey('OpenTelemetry Context Key SUPPRESS_TRACING');

/**
 * Checks if tracing is suppressed in the given context.
 *
 * @param context - The context to check
 * @returns True if tracing is suppressed
 */
export function isTracingSuppressed(context: Context): boolean {
  return context.getValue(SUPPRESS_TRACING_KEY) === true;
}

/**
 * Sets the tracing suppression flag in the context.
 *
 * @param context - The context to modify
 * @returns New context with suppression flag
 */
export function suppressTracing(context: Context): Context {
  return context.setValue(SUPPRESS_TRACING_KEY, true);
}

/**
 * Clears the tracing suppression flag from the context.
 *
 * @param context - The context to modify
 * @returns New context without suppression flag
 */
export function unsuppressTracing(context: Context): Context {
  return context.deleteValue(SUPPRESS_TRACING_KEY);
}

/**
 * Gets baggage value from the current context.
 *
 * @param context - The context to extract from
 * @param key - The baggage key
 * @returns The baggage value or undefined
 */
export function getBaggageValue(context: Context, key: string): string | undefined {
  const baggage = propagation.getBaggage(context);
  return baggage?.getEntry(key)?.value;
}

/**
 * Sets a baggage value in the context.
 *
 * @param context - The context to modify
 * @param key - The baggage key
 * @param value - The baggage value
 * @param metadata - Optional metadata
 * @returns New context with updated baggage
 */
export function setBaggageValue(
  context: Context,
  key: string,
  value: string,
  metadata?: string
): Context {
  const currentBaggage = propagation.getBaggage(context);
  const newBaggage = (currentBaggage ?? propagation.createBaggage()).setEntry(key, {
    value,
    metadata: metadata as import("@opentelemetry/api").BaggageEntryMetadata | undefined,
  });
  return propagation.setBaggage(context, newBaggage);
}

/**
 * Removes a baggage entry from the context.
 *
 * @param context - The context to modify
 * @param key - The baggage key to remove
 * @returns New context with baggage entry removed
 */
export function removeBaggageValue(context: Context, key: string): Context {
  const currentBaggage = propagation.getBaggage(context);
  if (!currentBaggage) return context;

  const newBaggage = currentBaggage.removeEntry(key);
  return propagation.setBaggage(context, newBaggage);
}

/**
 * Gets all baggage entries from the context.
 *
 * @param context - The context to extract from
 * @returns Record of baggage entries
 */
export function getAllBaggage(context: Context): Record<string, string> {
  const baggage = propagation.getBaggage(context);
  if (!baggage) return {};

  const result: Record<string, string> = {};
  for (const [key, entry] of baggage.getAllEntries()) {
    result[key] = entry.value;
  }
  return result;
}
