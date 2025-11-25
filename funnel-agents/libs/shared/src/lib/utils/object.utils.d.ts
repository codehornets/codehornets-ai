/**
 * Object utility functions
 */
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Deep merge objects
 */
export declare function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T;
/**
 * Check if value is a plain object
 */
export declare function isObject(value: unknown): value is Record<string, unknown>;
/**
 * Pick specific properties from an object
 */
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specific properties from an object
 */
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Remove null and undefined values from an object
 */
export declare function compact<T extends object>(obj: T): Partial<T>;
/**
 * Flatten nested object to dot notation
 */
export declare function flatten(obj: Record<string, unknown>, prefix?: string): Record<string, unknown>;
/**
 * Unflatten dot notation object to nested object
 */
export declare function unflatten(obj: Record<string, unknown>): Record<string, unknown>;
/**
 * Get nested property value by dot notation path
 */
export declare function getByPath(obj: Record<string, unknown>, path: string): unknown;
/**
 * Set nested property value by dot notation path
 */
export declare function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void;
