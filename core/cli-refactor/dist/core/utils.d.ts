/**
 * Core utility functions - Lodash-style utilities
 * Provides common operations like clone, isEqual, memoize, etc.
 */
/**
 * Creates a shallow clone of a value
 * @param value - The value to clone
 * @returns A shallow copy of the value
 */
export declare function clone<T>(value: T): T;
/**
 * Creates a deep clone of a value
 * Handles circular references via WeakMap tracking
 * @param value - The value to deep clone
 * @param seen - WeakMap to track circular references (internal use)
 * @returns A deep copy of the value
 */
export declare function cloneDeep<T>(value: T, seen?: WeakMap<WeakKey, any>): T;
/**
 * Performs a deep equality comparison between two values
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal
 */
export declare function isEqual(a: unknown, b: unknown): boolean;
/** Cache type for memoize function */
interface MemoizeCache<K, V> {
    has(key: K): boolean;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
}
/**
 * Creates a memoized version of a function
 * @param fn - Function to memoize
 * @param resolver - Optional function to generate cache key from arguments
 * @returns Memoized function with cache property
 */
export declare function memoize<T extends (...args: unknown[]) => unknown>(fn: T, resolver?: (...args: Parameters<T>) => unknown): T & {
    cache: MemoizeCache<unknown, unknown>;
};
/**
 * Creates an object with the same keys as the source object,
 * with values transformed by the iteratee function
 * @param obj - Source object
 * @param iteratee - Transform function called with (value, key, object)
 * @returns New object with transformed values
 */
export declare function mapValues<T extends object, R>(obj: T, iteratee: (value: T[keyof T], key: string, obj: T) => R): {
    [K in keyof T]: R;
};
/**
 * Creates an array excluding elements that match the predicate
 * @param array - Source array
 * @param predicate - Function to test each element
 * @returns New array with elements that don't match the predicate
 */
export declare function reject<T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[];
/**
 * Returns a random element from an array
 * @param array - Source array
 * @returns Random element or undefined if array is empty
 */
export declare function sample<T>(array: T[]): T | undefined;
/**
 * Sets a value at a path in an object, creating intermediate objects/arrays as needed
 * @param obj - Target object
 * @param path - Path string or array of keys
 * @param value - Value to set
 * @param customizer - Optional function to customize assigned values
 * @returns The modified object
 */
export declare function setWith<T extends object>(obj: T, path: string | (string | number)[], value: unknown, customizer?: (nsValue: unknown, key: string | number, nsObject: unknown) => unknown): T;
/**
 * Computes the sum of values in an array using an iteratee function
 * @param array - Source array
 * @param iteratee - Function to extract numeric value from each element
 * @returns Sum of all values
 */
export declare function sumBy<T>(array: T[], iteratee: (value: T) => number): number;
/**
 * Creates a duplicate-free version of an array using an iteratee to generate comparison keys
 * @param array - Source array
 * @param iteratee - Function to generate comparison key for each element
 * @returns New array with unique elements
 */
export declare function uniqBy<T>(array: T[], iteratee: (value: T) => unknown): T[];
/**
 * Creates an object from arrays of keys and values
 * @param keys - Array of property keys
 * @param values - Array of property values
 * @returns Object with keys mapped to corresponding values
 */
export declare function zipObject<K extends string | number | symbol, V>(keys: K[], values: V[]): Record<K, V>;
/**
 * Identity function - returns the value passed to it
 * @param value - Any value
 * @returns The same value
 */
export declare function identity<T>(value: T): T;
/**
 * Creates a function that always returns the given value
 * @param value - Value to return
 * @returns Function that returns the value
 */
export declare function constant<T>(value: T): () => T;
/**
 * A no-operation function
 */
export declare function noop(): void;
/**
 * Checks if a value is a plain object (not an array, null, or special object)
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * Checks if a value is a function
 * @param value - Value to check
 * @returns True if value is a function
 */
export declare function isFunction(value: unknown): value is (...args: unknown[]) => unknown;
/**
 * Checks if a value is an object (including arrays, excluding null)
 * @param value - Value to check
 * @returns True if value is an object
 */
export declare function isObject(value: unknown): value is object;
/**
 * Checks if a value is object-like (non-null object)
 * @param value - Value to check
 * @returns True if value is object-like
 */
export declare function isObjectLike(value: unknown): boolean;
/**
 * Gets a value at a path from an object
 * @param obj - Source object
 * @param path - Path string or array
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default value
 */
export declare function get<T = unknown>(obj: unknown, path: string | (string | number)[], defaultValue?: T): T | undefined;
/**
 * Checks if a path exists in an object
 * @param obj - Source object
 * @param path - Path string or array
 * @returns True if path exists
 */
export declare function has(obj: unknown, path: string | (string | number)[]): boolean;
export {};
//# sourceMappingURL=utils.d.ts.map