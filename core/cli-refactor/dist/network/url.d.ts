/**
 * URL Utilities
 *
 * URL parsing, serialization, and manipulation utilities.
 * Uses Node.js built-in URL API (WHATWG URL Standard) with additional helpers.
 */
import { URL, URLSearchParams } from 'url';
import type { ParsedUrl, UrlSerializeOptions, IdnaOptions, IdnaToUnicodeResult } from './types.js';
/**
 * Check if a scheme is a special scheme (has default port handling)
 */
export declare function isSpecialScheme(scheme: string): boolean;
/**
 * Get default port for a scheme
 */
export declare function getDefaultPort(scheme: string): number | null;
/**
 * Parse a URL string into components
 *
 * @param input - URL string to parse
 * @param base - Optional base URL for relative URLs
 * @returns Parsed URL components
 * @throws UrlParseError if URL is invalid
 */
export declare function parseUrl(input: string, base?: string): ParsedUrl;
/**
 * Safely parse a URL, returning null on failure instead of throwing
 *
 * @param input - URL string to parse
 * @param base - Optional base URL for relative URLs
 * @returns Parsed URL components or null
 */
export declare function tryParseUrl(input: string, base?: string): ParsedUrl | null;
/**
 * Check if a string is a valid URL
 */
export declare function isValidUrl(input: string): boolean;
/**
 * Serialize a URL object to string
 *
 * @param url - URL or parsed URL object
 * @param options - Serialization options
 * @returns Serialized URL string
 */
export declare function serializeUrl(url: URL | ParsedUrl, options?: UrlSerializeOptions): string;
/**
 * Serialize just the origin (scheme://host:port)
 */
export declare function serializeOrigin(url: URL | ParsedUrl): string;
/**
 * Serialize the path portion of a URL
 */
export declare function serializePath(url: URL | ParsedUrl): string;
/**
 * Get the effective port (actual port or default for scheme)
 */
export declare function getEffectivePort(url: URL | ParsedUrl): number | null;
/**
 * Check if a URL has credentials (username or password)
 */
export declare function hasCredentials(url: URL | ParsedUrl): boolean;
/**
 * Check if a URL cannot have username/password/port
 * (file:// URLs with empty host, opaque path URLs)
 */
export declare function cannotHaveUsernamePasswordPort(url: URL | ParsedUrl): boolean;
/**
 * Set username on a URL (with proper encoding)
 */
export declare function setUsername(url: URL, username: string): void;
/**
 * Set password on a URL (with proper encoding)
 */
export declare function setPassword(url: URL, password: string): void;
/**
 * Join URL parts safely
 *
 * @param base - Base URL
 * @param paths - Path segments to join
 * @returns Joined URL string
 */
export declare function joinUrl(base: string, ...paths: string[]): string;
/**
 * Extract query parameters as an object
 */
export declare function getQueryParams(url: string | URL): Record<string, string>;
/**
 * Build a URL with query parameters
 */
export declare function buildUrl(base: string, params?: Record<string, string | number | boolean | null | undefined>): string;
/**
 * Check if hostname is an IP address
 */
export declare function isIPAddress(hostname: string): boolean;
/**
 * Check if hostname is IPv4 address
 */
export declare function isIPv4(hostname: string): boolean;
/**
 * Check if hostname is IPv6 address
 */
export declare function isIPv6(hostname: string): boolean;
/**
 * Format IPv6 address with brackets
 */
export declare function formatIPv6(hostname: string): string;
/**
 * Normalize a URL (lowercase scheme/host, remove default port, etc.)
 */
export declare function normalizeUrl(input: string): string;
/**
 * Compare two URLs for equality (normalized)
 */
export declare function urlsEqual(url1: string, url2: string): boolean;
/**
 * Get the file extension from a URL path
 */
export declare function getPathExtension(url: string | URL): string;
/**
 * Check if URL is using HTTPS protocol
 */
export declare function isSecure(url: string | URL): boolean;
/**
 * Convert URL to ASCII (punycode) using Node.js built-in
 * This wraps the WHATWG URL Standard implementation
 */
export declare function toASCII(domain: string, options?: IdnaOptions): string | null;
/**
 * Convert URL to Unicode from punycode
 */
export declare function toUnicode(domain: string, options?: IdnaOptions): IdnaToUnicodeResult;
export { URL, URLSearchParams };
//# sourceMappingURL=url.d.ts.map