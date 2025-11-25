/**
 * Common regex patterns
 */
/**
 * Email validation pattern (RFC 5322)
 */
export declare const EMAIL_REGEX: RegExp;
/**
 * URL validation pattern
 */
export declare const URL_REGEX: RegExp;
/**
 * Phone number patterns
 */
export declare const PHONE_REGEX: {
    US: RegExp;
    INTERNATIONAL: RegExp;
    SIMPLE: RegExp;
};
/**
 * Password strength pattern (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)
 */
export declare const STRONG_PASSWORD_REGEX: RegExp;
/**
 * UUID v4 pattern
 */
export declare const UUID_REGEX: RegExp;
/**
 * Slug pattern (lowercase letters, numbers, hyphens)
 */
export declare const SLUG_REGEX: RegExp;
/**
 * Alphanumeric pattern
 */
export declare const ALPHANUMERIC_REGEX: RegExp;
/**
 * Username pattern (3-30 chars, letters, numbers, underscores, hyphens)
 */
export declare const USERNAME_REGEX: RegExp;
/**
 * Credit card patterns
 */
export declare const CREDIT_CARD_REGEX: {
    VISA: RegExp;
    MASTERCARD: RegExp;
    AMEX: RegExp;
    DISCOVER: RegExp;
    ANY: RegExp;
};
/**
 * IP address patterns
 */
export declare const IP_REGEX: {
    V4: RegExp;
    V6: RegExp;
};
/**
 * Date patterns
 */
export declare const DATE_REGEX: {
    ISO_8601: RegExp;
    YYYY_MM_DD: RegExp;
    MM_DD_YYYY: RegExp;
};
/**
 * HTML/Script detection (for XSS prevention)
 */
export declare const HTML_SCRIPT_REGEX: RegExp;
/**
 * Common file extensions
 */
export declare const FILE_EXTENSION_REGEX: {
    IMAGE: RegExp;
    DOCUMENT: RegExp;
    SPREADSHEET: RegExp;
    VIDEO: RegExp;
    AUDIO: RegExp;
};
/**
 * Social media handle patterns
 */
export declare const SOCIAL_HANDLE_REGEX: {
    TWITTER: RegExp;
    INSTAGRAM: RegExp;
    LINKEDIN: RegExp;
};
