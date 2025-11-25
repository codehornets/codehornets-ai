/**
 * Punycode / IDNA Utilities
 *
 * Internationalized Domain Names in Applications (IDNA) conversion utilities.
 * Provides ASCII-compatible encoding (ACE) for internationalized domain names.
 *
 * Note: For production use, consider using the 'punycode' npm package for
 * full RFC compliance. This module provides a basic implementation.
 */
import type { IdnaOptions, IdnaToUnicodeResult } from './types.js';
/**
 * Error thrown when punycode encoding/decoding fails
 */
export declare class PunycodeError extends Error {
    constructor(message: string);
}
/**
 * Encode a string to punycode
 *
 * @param input - Unicode string to encode
 * @returns Punycode-encoded string
 */
export declare function punycodeEncode(input: string): string;
/**
 * Decode a punycode string
 *
 * @param input - Punycode-encoded string
 * @returns Decoded Unicode string
 */
export declare function punycodeDecode(input: string): string;
/**
 * Check if a label is a punycode-encoded label
 */
export declare function isPunycodeLabel(label: string): boolean;
/**
 * Convert a domain to ASCII (punycode)
 *
 * @param domain - Domain name to convert
 * @param options - Conversion options
 * @returns ASCII-encoded domain or null if conversion fails
 */
export declare function toASCII(domain: string, options?: IdnaOptions): string | null;
/**
 * Convert a domain from ASCII (punycode) to Unicode
 *
 * @param domain - ASCII-encoded domain name
 * @param options - Conversion options
 * @returns Unicode domain and error status
 */
export declare function toUnicode(domain: string, options?: IdnaOptions): IdnaToUnicodeResult;
/**
 * Encode a single Unicode string to punycode with xn-- prefix
 *
 * @param input - Unicode string
 * @returns Punycode string with xn-- prefix
 */
export declare function encode(input: string): string;
/**
 * Decode a single punycode string (with or without xn-- prefix)
 *
 * @param input - Punycode string
 * @returns Decoded Unicode string
 */
export declare function decode(input: string): string;
/**
 * Convert a URL to ASCII-safe form
 *
 * @param url - URL string
 * @returns URL with ASCII-encoded hostname
 */
export declare function urlToASCII(url: string): string;
/**
 * Convert a URL hostname to Unicode
 *
 * @param url - URL string with possibly punycode-encoded hostname
 * @returns URL with Unicode hostname
 */
export declare function urlToUnicode(url: string): string;
//# sourceMappingURL=punycode.d.ts.map