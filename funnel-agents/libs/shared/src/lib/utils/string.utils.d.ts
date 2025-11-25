/**
 * String utility functions
 */
/**
 * Convert string to slug format
 */
export declare function toSlug(str: string): string;
/**
 * Convert string to camelCase
 */
export declare function toCamelCase(str: string): string;
/**
 * Convert string to PascalCase
 */
export declare function toPascalCase(str: string): string;
/**
 * Convert string to snake_case
 */
export declare function toSnakeCase(str: string): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncate(str: string, maxLength: number, suffix?: string): string;
/**
 * Capitalize first letter of string
 */
export declare function capitalize(str: string): string;
/**
 * Check if string is empty or whitespace
 */
export declare function isBlank(str: string | null | undefined): boolean;
/**
 * Generate random string
 */
export declare function randomString(length: number, charset?: string): string;
/**
 * Mask sensitive data (e.g., email, phone)
 */
export declare function mask(str: string, visibleChars?: number, maskChar?: string): string;
/**
 * Mask email address
 */
export declare function maskEmail(email: string): string;
