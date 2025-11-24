/**
 * AWS Encoding Utilities
 *
 * Provides base64 encoding/decoding and serialization utilities
 * for AWS SDK operations.
 *
 * @module aws/encoding
 */
/**
 * Valid base64 character pattern
 */
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
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
export function fromBase64(input) {
    // Validate padding
    if ((input.length * 3) % 4 !== 0) {
        throw new TypeError('Incorrect padding on base64 string.');
    }
    // Validate characters
    if (!BASE64_PATTERN.test(input)) {
        throw new TypeError('Invalid base64 string.');
    }
    // Use Node.js Buffer for efficient decoding
    const buffer = Buffer.from(input, 'base64');
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
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
export function toBase64(input) {
    let data;
    if (typeof input === 'string') {
        data = new TextEncoder().encode(input);
    }
    else {
        data = input;
    }
    // Validate input type
    if (typeof data !== 'object' ||
        typeof data.byteOffset !== 'number' ||
        typeof data.byteLength !== 'number') {
        throw new Error('@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.');
    }
    // Use Node.js Buffer for efficient encoding
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
}
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
export function fromUtf8(input) {
    return new TextEncoder().encode(input);
}
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
export function toUtf8(input) {
    return new TextDecoder('utf-8').decode(input);
}
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
export function extendedEncodeURIComponent(input) {
    return encodeURIComponent(input).replace(/[!'()*]/g, (char) => {
        return '%' + char.charCodeAt(0).toString(16).toUpperCase();
    });
}
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
export function parseDate(value) {
    if (typeof value === 'number') {
        // Detect if epoch is in seconds or milliseconds
        // If less than 10 digits, it's likely seconds
        if (value < 10000000000) {
            return new Date(value * 1000);
        }
        return new Date(value);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${value}`);
    }
    return date;
}
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
export function parseRfc3339DateTimeWithOffset(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid RFC3339 date string: ${value}`);
    }
    return date;
}
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
export function formatRfc3339DateTime(date) {
    return date.toISOString();
}
/**
 * Parse a string value, returning undefined for empty strings
 *
 * @param value - String value to parse
 * @returns The string value or undefined
 */
export function expectString(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    return String(value);
}
/**
 * Parse an integer value with strict validation
 *
 * @param value - Value to parse as integer
 * @returns Parsed integer or undefined
 * @throws Error if value is not a valid integer
 */
export function strictParseInt32(value) {
    if (value === null || value === undefined) {
        return undefined;
    }
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? parseInt(value, 10) : NaN;
    if (isNaN(parsed) || !Number.isInteger(parsed)) {
        throw new Error(`Expected integer, got: ${value}`);
    }
    // Check 32-bit integer bounds
    if (parsed < -2147483648 || parsed > 2147483647) {
        throw new Error(`Integer out of 32-bit bounds: ${parsed}`);
    }
    return parsed;
}
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
export function buildFormUrlencodedString(params) {
    return Object.entries(params)
        .map(([key, value]) => `${extendedEncodeURIComponent(key)}=${extendedEncodeURIComponent(value)}`)
        .join('&');
}
/**
 * Collect response body into Uint8Array
 *
 * @param body - Response body (Uint8Array, ReadableStream, or undefined)
 * @param streamCollector - Optional stream collector function
 * @returns Collected body as Uint8Array
 */
export async function collectBody(body, streamCollector) {
    if (body instanceof Uint8Array) {
        return body;
    }
    if (!body) {
        return new Uint8Array();
    }
    if (streamCollector) {
        return streamCollector(body);
    }
    // Default stream collection for Node.js
    const chunks = [];
    const reader = body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
/**
 * Convert Uint8Array to hex string
 *
 * @param bytes - Uint8Array to convert
 * @returns Hexadecimal string
 */
export function toHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Convert hex string to Uint8Array
 *
 * @param hex - Hexadecimal string
 * @returns Uint8Array
 */
export function fromHex(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
//# sourceMappingURL=encoding.js.map