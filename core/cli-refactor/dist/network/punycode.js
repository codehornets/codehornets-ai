/**
 * Punycode / IDNA Utilities
 *
 * Internationalized Domain Names in Applications (IDNA) conversion utilities.
 * Provides ASCII-compatible encoding (ACE) for internationalized domain names.
 *
 * Note: For production use, consider using the 'punycode' npm package for
 * full RFC compliance. This module provides a basic implementation.
 */
/**
 * Punycode constants (RFC 3492)
 */
const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 0x80; // 128
const DELIMITER = '-';
/**
 * Error thrown when punycode encoding/decoding fails
 */
export class PunycodeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PunycodeError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
/**
 * Calculate the bias adaptation
 */
function adaptBias(delta, numPoints, firstTime) {
    let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
    d += Math.floor(d / numPoints);
    let k = 0;
    while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
        d = Math.floor(d / (BASE - T_MIN));
        k += BASE;
    }
    return Math.floor(k + ((BASE - T_MIN + 1) * d) / (d + SKEW));
}
/**
 * Convert a digit value to a basic code point
 */
function digitToBasic(digit) {
    return digit + 22 + 75 * (digit < 26 ? 1 : 0);
}
/**
 * Convert a basic code point to a digit value
 */
function basicToDigit(codePoint) {
    if (codePoint >= 0x30 && codePoint <= 0x39) {
        // 0-9
        return codePoint - 0x16; // 0x30 - 0x16 = 0x1a (26)
    }
    if (codePoint >= 0x41 && codePoint <= 0x5a) {
        // A-Z
        return codePoint - 0x41;
    }
    if (codePoint >= 0x61 && codePoint <= 0x7a) {
        // a-z
        return codePoint - 0x61;
    }
    return BASE; // Invalid
}
/**
 * Check if a code point is a basic ASCII character
 */
function isBasic(codePoint) {
    return codePoint < 0x80;
}
/**
 * Encode a string to punycode
 *
 * @param input - Unicode string to encode
 * @returns Punycode-encoded string
 */
export function punycodeEncode(input) {
    const output = [];
    // Convert to array of code points
    const codePoints = Array.from(input, (char) => char.codePointAt(0));
    // Handle the basic code points
    for (const cp of codePoints) {
        if (isBasic(cp)) {
            output.push(String.fromCodePoint(cp));
        }
    }
    const basicLength = output.length;
    let handledCount = basicLength;
    // Add delimiter if there are basic characters
    if (basicLength > 0) {
        output.push(DELIMITER);
    }
    // Main encoding loop
    let n = INITIAL_N;
    let delta = 0;
    let bias = INITIAL_BIAS;
    while (handledCount < codePoints.length) {
        // Find the minimum code point >= n
        let m = Infinity;
        for (const cp of codePoints) {
            if (cp >= n && cp < m) {
                m = cp;
            }
        }
        // Increase delta enough to advance the decoder's <n,i> state to <m,0>
        const deltaIncrement = (m - n) * (handledCount + 1);
        if (deltaIncrement > Number.MAX_SAFE_INTEGER - delta) {
            throw new PunycodeError('Overflow');
        }
        delta += deltaIncrement;
        n = m;
        for (const cp of codePoints) {
            if (cp < n) {
                delta++;
                if (delta > Number.MAX_SAFE_INTEGER) {
                    throw new PunycodeError('Overflow');
                }
            }
            if (cp === n) {
                // Encode delta as a generalized variable-length integer
                let q = delta;
                for (let k = BASE;; k += BASE) {
                    const t = k <= bias + T_MIN ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
                    if (q < t)
                        break;
                    output.push(String.fromCodePoint(digitToBasic(t + ((q - t) % (BASE - t)))));
                    q = Math.floor((q - t) / (BASE - t));
                }
                output.push(String.fromCodePoint(digitToBasic(q)));
                bias = adaptBias(delta, handledCount + 1, handledCount === basicLength);
                delta = 0;
                handledCount++;
            }
        }
        delta++;
        n++;
    }
    return output.join('');
}
/**
 * Decode a punycode string
 *
 * @param input - Punycode-encoded string
 * @returns Decoded Unicode string
 */
export function punycodeDecode(input) {
    const output = [];
    // Find the last delimiter
    let basic = input.lastIndexOf(DELIMITER);
    if (basic < 0) {
        basic = 0;
    }
    // Copy basic code points
    for (let i = 0; i < basic; i++) {
        const cp = input.charCodeAt(i);
        if (!isBasic(cp)) {
            throw new PunycodeError('Invalid input');
        }
        output.push(cp);
    }
    // Main decoding loop
    let n = INITIAL_N;
    let bias = INITIAL_BIAS;
    let i = 0;
    for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length;) {
        const oldi = i;
        let w = 1;
        for (let k = BASE;; k += BASE) {
            if (idx >= input.length) {
                throw new PunycodeError('Invalid input');
            }
            const digit = basicToDigit(input.charCodeAt(idx++));
            if (digit >= BASE) {
                throw new PunycodeError('Invalid input');
            }
            const digitTimesW = digit * w;
            if (digitTimesW > Number.MAX_SAFE_INTEGER - i) {
                throw new PunycodeError('Overflow');
            }
            i += digitTimesW;
            const t = k <= bias + T_MIN ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
            if (digit < t)
                break;
            const baseMinusT = BASE - t;
            if (w > Math.floor(Number.MAX_SAFE_INTEGER / baseMinusT)) {
                throw new PunycodeError('Overflow');
            }
            w *= baseMinusT;
        }
        const out = output.length + 1;
        bias = adaptBias(i - oldi, out, oldi === 0);
        if (Math.floor(i / out) > Number.MAX_SAFE_INTEGER - n) {
            throw new PunycodeError('Overflow');
        }
        n += Math.floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
}
/**
 * Check if a domain label contains non-ASCII characters
 */
function hasNonAscii(label) {
    for (let i = 0; i < label.length; i++) {
        if (label.charCodeAt(i) >= 0x80) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a label is a punycode-encoded label
 */
export function isPunycodeLabel(label) {
    return label.toLowerCase().startsWith('xn--');
}
/**
 * Convert a domain to ASCII (punycode)
 *
 * @param domain - Domain name to convert
 * @param options - Conversion options
 * @returns ASCII-encoded domain or null if conversion fails
 */
export function toASCII(domain, options = {}) {
    const { verifyDNSLength = false, } = options;
    try {
        // Split into labels
        const labels = domain.split('.');
        // Convert each label
        const encodedLabels = labels.map((label) => {
            if (hasNonAscii(label)) {
                try {
                    return `xn--${punycodeEncode(label.toLowerCase())}`;
                }
                catch {
                    return label;
                }
            }
            return label.toLowerCase();
        });
        const result = encodedLabels.join('.');
        // Verify DNS length if requested
        if (verifyDNSLength) {
            if (result.length === 0 || result.length > 253) {
                return null;
            }
            for (const label of encodedLabels) {
                if (label.length === 0 || label.length > 63) {
                    return null;
                }
            }
        }
        return result;
    }
    catch {
        return null;
    }
}
/**
 * Convert a domain from ASCII (punycode) to Unicode
 *
 * @param domain - ASCII-encoded domain name
 * @param options - Conversion options
 * @returns Unicode domain and error status
 */
export function toUnicode(domain, options = {}) {
    try {
        // Split into labels
        const labels = domain.split('.');
        // Decode each label
        const decodedLabels = labels.map((label) => {
            if (isPunycodeLabel(label)) {
                try {
                    return punycodeDecode(label.slice(4)); // Remove 'xn--' prefix
                }
                catch {
                    return label;
                }
            }
            return label;
        });
        return {
            domain: decodedLabels.join('.'),
            error: false,
        };
    }
    catch {
        return {
            domain,
            error: true,
        };
    }
}
/**
 * Encode a single Unicode string to punycode with xn-- prefix
 *
 * @param input - Unicode string
 * @returns Punycode string with xn-- prefix
 */
export function encode(input) {
    return `xn--${punycodeEncode(input)}`;
}
/**
 * Decode a single punycode string (with or without xn-- prefix)
 *
 * @param input - Punycode string
 * @returns Decoded Unicode string
 */
export function decode(input) {
    const normalized = input.toLowerCase();
    if (normalized.startsWith('xn--')) {
        return punycodeDecode(input.slice(4));
    }
    return punycodeDecode(input);
}
/**
 * Convert a URL to ASCII-safe form
 *
 * @param url - URL string
 * @returns URL with ASCII-encoded hostname
 */
export function urlToASCII(url) {
    try {
        const parsed = new URL(url);
        const asciiHost = toASCII(parsed.hostname);
        if (asciiHost && asciiHost !== parsed.hostname) {
            parsed.hostname = asciiHost;
        }
        return parsed.href;
    }
    catch {
        return url;
    }
}
/**
 * Convert a URL hostname to Unicode
 *
 * @param url - URL string with possibly punycode-encoded hostname
 * @returns URL with Unicode hostname
 */
export function urlToUnicode(url) {
    try {
        const parsed = new URL(url);
        const result = toUnicode(parsed.hostname);
        if (!result.error && result.domain !== parsed.hostname) {
            parsed.hostname = result.domain;
        }
        return parsed.href;
    }
    catch {
        return url;
    }
}
//# sourceMappingURL=punycode.js.map