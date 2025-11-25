/**
 * AWS Encoding Utilities
 *
 * Provides base64 encoding/decoding and serialization utilities
 * for AWS SDK operations.
 *
 * @module aws/encoding
 */
/**
 * Decode a base64 string to Uint8Array
 *
 * @param input - Base64 encoded string
 * @returns Decoded Uint8Array
 * @throws TypeError if input is invalid base64
 *
 * @example
 * ```typescript
 * const decoded = fromBase64('SGVsbG8gV29ybGQ=');
 * console.log(new TextDecoder().decode(decoded)); // "Hello World"
 * ```
 */
export declare function fromBase64(input: string): Uint8Array;
/**
 * Encode data to base64 string
 *
 * @param input - String or Uint8Array to encode
 * @returns Base64 encoded string
 * @throws Error if input is invalid type
 *
 * @example
 * ```typescript
 * const encoded = toBase64('Hello World');
 * console.log(encoded); // "SGVsbG8gV29ybGQ="
 *
 * const encodedBytes = toBase64(new Uint8Array([72, 101, 108, 108, 111]));
 * console.log(encodedBytes); // "SGVsbG8="
 * ```
 */
export declare function toBase64(input: string | Uint8Array): string;
/**
 * Encode a string to UTF-8 Uint8Array
 *
 * @param input - String to encode
 * @returns UTF-8 encoded Uint8Array
 *
 * @example
 * ```typescript
 * const bytes = fromUtf8('Hello');
 * console.log(bytes); // Uint8Array [72, 101, 108, 108, 111]
 * ```
 */
export declare function fromUtf8(input: string): Uint8Array;
/**
 * Decode UTF-8 Uint8Array to string
 *
 * @param input - UTF-8 encoded Uint8Array
 * @returns Decoded string
 *
 * @example
 * ```typescript
 * const text = toUtf8(new Uint8Array([72, 101, 108, 108, 111]));
 * console.log(text); // "Hello"
 * ```
 */
export declare function toUtf8(input: Uint8Array): string;
/**
 * Encode URI component with extended character support
 *
 * This function encodes additional characters beyond standard
 * encodeURIComponent for AWS compatibility.
 *
 * @param input - String to encode
 * @returns URL-encoded string
 *
 * @example
 * ```typescript
 * const encoded = extendedEncodeURIComponent("Hello World!");
 * console.log(encoded); // "Hello%20World%21"
 * ```
 */
export declare function extendedEncodeURIComponent(input: string): string;
/**
 * Parse a date string to Date object
 *
 * Supports multiple date formats commonly used in AWS responses.
 *
 * @param value - Date string or number (epoch seconds/milliseconds)
 * @returns Parsed Date object
 * @throws Error if date string is invalid
 *
 * @example
 * ```typescript
 * const date1 = parseDate('2024-01-15T10:30:00Z');
 * const date2 = parseDate(1705314600); // epoch seconds
 * const date3 = parseDate(1705314600000); // epoch milliseconds
 * ```
 */
export declare function parseDate(value: string | number): Date;
/**
 * Parse RFC3339 date with offset
 *
 * @param value - RFC3339 formatted date string
 * @returns Parsed Date object
 * @throws Error if date string is invalid
 *
 * @example
 * ```typescript
 * const date = parseRfc3339DateTimeWithOffset('2024-01-15T10:30:00+05:30');
 * ```
 */
export declare function parseRfc3339DateTimeWithOffset(value: string): Date;
/**
 * Format date as RFC3339 string
 *
 * @param date - Date object to format
 * @returns RFC3339 formatted string
 *
 * @example
 * ```typescript
 * const formatted = formatRfc3339DateTime(new Date());
 * console.log(formatted); // "2024-01-15T10:30:00.000Z"
 * ```
 */
export declare function formatRfc3339DateTime(date: Date): string;
/**
 * Parse a string value, returning undefined for empty strings
 *
 * @param value - String value to parse
 * @returns The string value or undefined
 */
export declare function expectString(value: unknown): string | undefined;
/**
 * Parse an integer value with strict validation
 *
 * @param value - Value to parse as integer
 * @returns Parsed integer or undefined
 * @throws Error if value is not a valid integer
 */
export declare function strictParseInt32(value: unknown): number | undefined;
/**
 * Build form URL-encoded string from object
 *
 * @param params - Object with string key-value pairs
 * @returns URL-encoded form string
 *
 * @example
 * ```typescript
 * const body = buildFormUrlencodedString({
 *   Action: 'AssumeRole',
 *   RoleArn: 'arn:aws:iam::123456789012:role/MyRole',
 *   Version: '2011-06-15'
 * });
 * ```
 */
export declare function buildFormUrlencodedString(params: Record<string, string>): string;
/**
 * Collect response body into Uint8Array
 *
 * @param body - Response body (Uint8Array, ReadableStream, or undefined)
 * @param streamCollector - Optional stream collector function
 * @returns Collected body as Uint8Array
 */
export declare function collectBody(body: Uint8Array | ReadableStream<Uint8Array> | undefined, streamCollector?: (stream: ReadableStream<Uint8Array>) => Promise<Uint8Array>): Promise<Uint8Array>;
/**
 * Convert Uint8Array to hex string
 *
 * @param bytes - Uint8Array to convert
 * @returns Hexadecimal string
 */
export declare function toHex(bytes: Uint8Array): string;
/**
 * Convert hex string to Uint8Array
 *
 * @param hex - Hexadecimal string
 * @returns Uint8Array
 */
export declare function fromHex(hex: string): Uint8Array;
//# sourceMappingURL=encoding.d.ts.map