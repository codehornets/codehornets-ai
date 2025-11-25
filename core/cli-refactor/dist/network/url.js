/**
 * URL Utilities
 *
 * URL parsing, serialization, and manipulation utilities.
 * Uses Node.js built-in URL API (WHATWG URL Standard) with additional helpers.
 */
import { URL, URLSearchParams } from 'url';
import { UrlParseError } from './errors.js';
/**
 * Default ports for well-known protocols
 */
const DEFAULT_PORTS = {
    ftp: 21,
    file: null,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443,
};
/**
 * Check if a scheme is a special scheme (has default port handling)
 */
export function isSpecialScheme(scheme) {
    const normalizedScheme = scheme.toLowerCase().replace(/:$/, '');
    return normalizedScheme in DEFAULT_PORTS;
}
/**
 * Get default port for a scheme
 */
export function getDefaultPort(scheme) {
    const normalizedScheme = scheme.toLowerCase().replace(/:$/, '');
    return DEFAULT_PORTS[normalizedScheme] ?? null;
}
/**
 * Parse a URL string into components
 *
 * @param input - URL string to parse
 * @param base - Optional base URL for relative URLs
 * @returns Parsed URL components
 * @throws UrlParseError if URL is invalid
 */
export function parseUrl(input, base) {
    try {
        const url = base ? new URL(input, base) : new URL(input);
        return {
            protocol: url.protocol,
            username: url.username,
            password: url.password,
            hostname: url.hostname,
            port: url.port,
            host: url.host,
            pathname: url.pathname,
            search: url.search,
            hash: url.hash,
            origin: url.origin,
            href: url.href,
        };
    }
    catch (error) {
        throw new UrlParseError(input, `Failed to parse URL: ${error.message}`);
    }
}
/**
 * Safely parse a URL, returning null on failure instead of throwing
 *
 * @param input - URL string to parse
 * @param base - Optional base URL for relative URLs
 * @returns Parsed URL components or null
 */
export function tryParseUrl(input, base) {
    try {
        return parseUrl(input, base);
    }
    catch {
        return null;
    }
}
/**
 * Check if a string is a valid URL
 */
export function isValidUrl(input) {
    try {
        new URL(input);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Serialize a URL object to string
 *
 * @param url - URL or parsed URL object
 * @param options - Serialization options
 * @returns Serialized URL string
 */
export function serializeUrl(url, options = {}) {
    const { excludeFragment = false } = options;
    if (url instanceof URL) {
        let serialized = url.href;
        if (excludeFragment && url.hash) {
            serialized = serialized.replace(url.hash, '');
        }
        return serialized;
    }
    // Build URL from ParsedUrl components
    let result = `${url.protocol}//`;
    // Add credentials if present
    if (url.username || url.password) {
        result += url.username;
        if (url.password) {
            result += `:${url.password}`;
        }
        result += '@';
    }
    // Add host
    result += url.hostname;
    if (url.port) {
        result += `:${url.port}`;
    }
    // Add path
    result += url.pathname;
    // Add query
    if (url.search) {
        result += url.search;
    }
    // Add fragment unless excluded
    if (!excludeFragment && url.hash) {
        result += url.hash;
    }
    return result;
}
/**
 * Serialize just the origin (scheme://host:port)
 */
export function serializeOrigin(url) {
    if (url instanceof URL) {
        return url.origin;
    }
    const protocol = url.protocol.endsWith(':') ? url.protocol : `${url.protocol}:`;
    let result = `${protocol}//${url.hostname}`;
    if (url.port) {
        result += `:${url.port}`;
    }
    return result;
}
/**
 * Serialize the path portion of a URL
 */
export function serializePath(url) {
    if (url instanceof URL) {
        return url.pathname;
    }
    return url.pathname;
}
/**
 * Get the effective port (actual port or default for scheme)
 */
export function getEffectivePort(url) {
    const port = url instanceof URL ? url.port : url.port;
    const protocol = url instanceof URL ? url.protocol : url.protocol;
    if (port) {
        return parseInt(port, 10);
    }
    return getDefaultPort(protocol);
}
/**
 * Check if a URL has credentials (username or password)
 */
export function hasCredentials(url) {
    const username = url instanceof URL ? url.username : url.username;
    const password = url instanceof URL ? url.password : url.password;
    return username !== '' || password !== '';
}
/**
 * Check if a URL cannot have username/password/port
 * (file:// URLs with empty host, opaque path URLs)
 */
export function cannotHaveUsernamePasswordPort(url) {
    const hostname = url instanceof URL ? url.hostname : url.hostname;
    const protocol = url instanceof URL ? url.protocol : url.protocol;
    return hostname === '' || protocol === 'file:';
}
/**
 * Set username on a URL (with proper encoding)
 */
export function setUsername(url, username) {
    url.username = encodeURIComponent(username);
}
/**
 * Set password on a URL (with proper encoding)
 */
export function setPassword(url, password) {
    url.password = encodeURIComponent(password);
}
/**
 * Join URL parts safely
 *
 * @param base - Base URL
 * @param paths - Path segments to join
 * @returns Joined URL string
 */
export function joinUrl(base, ...paths) {
    // Ensure base ends without trailing slash for consistent joining
    let result = base.replace(/\/+$/, '');
    for (const path of paths) {
        // Skip empty paths
        if (!path)
            continue;
        // If path is absolute URL, use it as new base
        if (isValidUrl(path)) {
            result = path;
            continue;
        }
        // Clean leading slashes from path
        const cleanPath = path.replace(/^\/+/, '');
        // Join with single slash
        result = `${result}/${cleanPath}`;
    }
    return result;
}
/**
 * Extract query parameters as an object
 */
export function getQueryParams(url) {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
/**
 * Build a URL with query parameters
 */
export function buildUrl(base, params) {
    const url = new URL(base);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }
    return url.href;
}
/**
 * Check if hostname is an IP address
 */
export function isIPAddress(hostname) {
    return isIPv4(hostname) || isIPv6(hostname);
}
/**
 * Check if hostname is IPv4 address
 */
export function isIPv4(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4)
        return false;
    return parts.every((part) => {
        const num = parseInt(part, 10);
        return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
    });
}
/**
 * Check if hostname is IPv6 address
 */
export function isIPv6(hostname) {
    // Remove brackets if present
    const cleanHost = hostname.replace(/^\[|\]$/g, '');
    // Basic IPv6 pattern check
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    const ipv6WithIPv4Regex = /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
    return ipv6Regex.test(cleanHost) || ipv6WithIPv4Regex.test(cleanHost);
}
/**
 * Format IPv6 address with brackets
 */
export function formatIPv6(hostname) {
    if (isIPv6(hostname) && !hostname.startsWith('[')) {
        return `[${hostname}]`;
    }
    return hostname;
}
/**
 * Normalize a URL (lowercase scheme/host, remove default port, etc.)
 */
export function normalizeUrl(input) {
    try {
        const url = new URL(input);
        // Protocol and hostname are already lowercased by URL parser
        // Remove default port
        const defaultPort = getDefaultPort(url.protocol);
        if (url.port && parseInt(url.port, 10) === defaultPort) {
            url.port = '';
        }
        // Remove trailing slash from root path
        if (url.pathname === '/') {
            return url.href.replace(/\/$/, '');
        }
        return url.href;
    }
    catch {
        return input;
    }
}
/**
 * Compare two URLs for equality (normalized)
 */
export function urlsEqual(url1, url2) {
    try {
        return normalizeUrl(url1) === normalizeUrl(url2);
    }
    catch {
        return url1 === url2;
    }
}
/**
 * Get the file extension from a URL path
 */
export function getPathExtension(url) {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    const lastSlash = pathname.lastIndexOf('/');
    if (lastDot > lastSlash) {
        return pathname.slice(lastDot + 1).toLowerCase();
    }
    return '';
}
/**
 * Check if URL is using HTTPS protocol
 */
export function isSecure(url) {
    const protocol = typeof url === 'string' ? tryParseUrl(url)?.protocol : url.protocol;
    return protocol === 'https:' || protocol === 'wss:';
}
/**
 * Convert URL to ASCII (punycode) using Node.js built-in
 * This wraps the WHATWG URL Standard implementation
 */
export function toASCII(domain, options = {}) {
    try {
        // Node's URL handles IDNA/punycode automatically
        const url = new URL(`http://${domain}`);
        return url.hostname;
    }
    catch {
        return null;
    }
}
/**
 * Convert URL to Unicode from punycode
 */
export function toUnicode(domain, options = {}) {
    try {
        // Decode punycode by checking for xn-- prefix
        const parts = domain.split('.');
        const decoded = parts
            .map((part) => {
            if (part.toLowerCase().startsWith('xn--')) {
                try {
                    // Use punycode decoding
                    return decodePunycode(part.slice(4));
                }
                catch {
                    return part;
                }
            }
            return part;
        })
            .join('.');
        return { domain: decoded, error: false };
    }
    catch {
        return { domain, error: true };
    }
}
/**
 * Simple punycode decoder (basic implementation)
 * For full compliance, consider using the 'punycode' package
 */
function decodePunycode(input) {
    // This is a simplified implementation
    // The bundled cli.js uses a full punycode implementation
    // For production, use the 'punycode' npm package
    const base = 36;
    const tMin = 1;
    const tMax = 26;
    const skew = 38;
    const damp = 700;
    const initialBias = 72;
    const initialN = 128;
    const delimiter = '-';
    const output = [];
    let i = 0;
    let n = initialN;
    let bias = initialBias;
    const basic = input.lastIndexOf(delimiter);
    if (basic >= 0) {
        for (let j = 0; j < basic; ++j) {
            output.push(input.charCodeAt(j));
        }
    }
    let index = basic >= 0 ? basic + 1 : 0;
    while (index < input.length) {
        const oldi = i;
        let w = 1;
        for (let k = base;; k += base) {
            if (index >= input.length)
                throw new Error('Invalid punycode');
            const digit = input.charCodeAt(index++);
            const value = digit >= 48 && digit <= 57
                ? digit - 22
                : digit >= 65 && digit <= 90
                    ? digit - 65
                    : digit >= 97 && digit <= 122
                        ? digit - 97
                        : base;
            if (value >= base)
                throw new Error('Invalid punycode');
            i += value * w;
            const t = k <= bias + tMin ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (value < t)
                break;
            w *= base - t;
        }
        const out = output.length + 1;
        bias = adaptBias(i - oldi, out, oldi === 0);
        n += Math.floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
}
/**
 * Punycode bias adaptation
 */
function adaptBias(delta, numPoints, firstTime) {
    const base = 36;
    const tMin = 1;
    const tMax = 26;
    const skew = 38;
    const damp = 700;
    let d = firstTime ? Math.floor(delta / damp) : delta >> 1;
    d += Math.floor(d / numPoints);
    let k = 0;
    while (d > ((base - tMin) * tMax) >> 1) {
        d = Math.floor(d / (base - tMin));
        k += base;
    }
    return Math.floor(k + ((base - tMin + 1) * d) / (d + skew));
}
// Re-export URLSearchParams for convenience
export { URL, URLSearchParams };
//# sourceMappingURL=url.js.map