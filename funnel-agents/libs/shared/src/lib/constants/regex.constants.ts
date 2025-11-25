/**
 * Common regex patterns
 */

/**
 * Email validation pattern (RFC 5322)
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * URL validation pattern
 */
export const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Phone number patterns
 */
export const PHONE_REGEX = {
  US: /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
  SIMPLE: /^[\d\s\-+()]+$/,
};

/**
 * Password strength pattern (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special)
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * UUID v4 pattern
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Slug pattern (lowercase letters, numbers, hyphens)
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Alphanumeric pattern
 */
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

/**
 * Username pattern (3-30 chars, letters, numbers, underscores, hyphens)
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

/**
 * Credit card patterns
 */
export const CREDIT_CARD_REGEX = {
  VISA: /^4[0-9]{12}(?:[0-9]{3})?$/,
  MASTERCARD: /^5[1-5][0-9]{14}$/,
  AMEX: /^3[47][0-9]{13}$/,
  DISCOVER: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  ANY: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,
};

/**
 * IP address patterns
 */
export const IP_REGEX = {
  V4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  V6: /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/,
};

/**
 * Date patterns
 */
export const DATE_REGEX = {
  ISO_8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/,
  YYYY_MM_DD: /^\d{4}-\d{2}-\d{2}$/,
  MM_DD_YYYY: /^\d{2}\/\d{2}\/\d{4}$/,
};

/**
 * HTML/Script detection (for XSS prevention)
 */
export const HTML_SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

/**
 * Common file extensions
 */
export const FILE_EXTENSION_REGEX = {
  IMAGE: /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i,
  DOCUMENT: /\.(pdf|doc|docx|txt|rtf|odt)$/i,
  SPREADSHEET: /\.(xls|xlsx|csv|ods)$/i,
  VIDEO: /\.(mp4|avi|mov|wmv|flv|webm)$/i,
  AUDIO: /\.(mp3|wav|ogg|flac|aac)$/i,
};

/**
 * Social media handle patterns
 */
export const SOCIAL_HANDLE_REGEX = {
  TWITTER: /^@?[a-zA-Z0-9_]{1,15}$/,
  INSTAGRAM: /^@?[a-zA-Z0-9_.]{1,30}$/,
  LINKEDIN: /^[a-zA-Z0-9-]{3,100}$/,
};
