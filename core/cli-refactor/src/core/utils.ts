/**
 * Core utility functions - Lodash-style utilities
 * Provides common operations like clone, isEqual, memoize, etc.
 */

/**
 * Creates a shallow clone of a value
 * @param value - The value to clone
 * @returns A shallow copy of the value
 */
export function clone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return [...value] as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof Map) {
    return new Map(value) as unknown as T;
  }

  if (value instanceof Set) {
    return new Set(value) as unknown as T;
  }

  return { ...value };
}

/**
 * Creates a deep clone of a value
 * Handles circular references via WeakMap tracking
 * @param value - The value to deep clone
 * @param seen - WeakMap to track circular references (internal use)
 * @returns A deep copy of the value
 */
export function cloneDeep<T>(value: T, seen = new WeakMap()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Handle circular references
  if (seen.has(value as object)) {
    return seen.get(value as object);
  }

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    seen.set(value, result);
    for (const item of value) {
      result.push(cloneDeep(item, seen));
    }
    return result as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof Map) {
    const result = new Map();
    seen.set(value, result);
    for (const [key, val] of value) {
      result.set(cloneDeep(key, seen), cloneDeep(val, seen));
    }
    return result as unknown as T;
  }

  if (value instanceof Set) {
    const result = new Set();
    seen.set(value, result);
    for (const item of value) {
      result.add(cloneDeep(item, seen));
    }
    return result as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Handle Buffer if available
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return Buffer.from(value) as unknown as T;
  }

  // Plain object
  const result: Record<string, unknown> = {};
  seen.set(value as object, result);

  for (const key of Object.keys(value as object)) {
    result[key] = cloneDeep((value as Record<string, unknown>)[key], seen);
  }

  return result as unknown as T;
}

/**
 * Performs a deep equality comparison between two values
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal
 */
export function isEqual(a: unknown, b: unknown): boolean {
  // Same reference or primitive equality
  if (a === b) return true;

  // Handle NaN
  if (Number.isNaN(a) && Number.isNaN(b)) return true;

  // Check for null/undefined
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b;
  }

  // Type check
  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;

  // Primitives already handled above
  if (typeA !== 'object') return false;

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // One is array, other is not
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp comparison
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // Map comparison
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !isEqual(val, b.get(key))) return false;
    }
    return true;
  }

  // Set comparison
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  // Object comparison
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

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
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  resolver?: (...args: Parameters<T>) => unknown
): T & { cache: MemoizeCache<unknown, unknown> } {
  if (typeof fn !== 'function') {
    throw new TypeError('Expected a function');
  }
  if (resolver !== undefined && typeof resolver !== 'function') {
    throw new TypeError('Expected a function');
  }

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver.apply(this, args) : args[0];
    const { cache } = memoized;

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result as ReturnType<T>;
  };

  memoized.cache = new Map() as MemoizeCache<unknown, unknown>;

  return memoized as T & { cache: MemoizeCache<unknown, unknown> };
}

/**
 * Creates an object with the same keys as the source object,
 * with values transformed by the iteratee function
 * @param obj - Source object
 * @param iteratee - Transform function called with (value, key, object)
 * @returns New object with transformed values
 */
export function mapValues<T extends object, R>(
  obj: T,
  iteratee: (value: T[keyof T], key: string, obj: T) => R
): { [K in keyof T]: R } {
  const result = {} as { [K in keyof T]: R };

  for (const key of Object.keys(obj) as (keyof T)[]) {
    result[key] = iteratee(obj[key], key as string, obj);
  }

  return result;
}

/**
 * Creates an array excluding elements that match the predicate
 * @param array - Source array
 * @param predicate - Function to test each element
 * @returns New array with elements that don't match the predicate
 */
export function reject<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): T[] {
  return array.filter((value, index, arr) => !predicate(value, index, arr));
}

/**
 * Returns a random element from an array
 * @param array - Source array
 * @returns Random element or undefined if array is empty
 */
export function sample<T>(array: T[]): T | undefined {
  const length = array?.length ?? 0;
  if (length === 0) return undefined;
  return array[Math.floor(Math.random() * length)];
}

/**
 * Sets a value at a path in an object, creating intermediate objects/arrays as needed
 * @param obj - Target object
 * @param path - Path string or array of keys
 * @param value - Value to set
 * @param customizer - Optional function to customize assigned values
 * @returns The modified object
 */
export function setWith<T extends object>(
  obj: T,
  path: string | (string | number)[],
  value: unknown,
  customizer?: (nsValue: unknown, key: string | number, nsObject: unknown) => unknown
): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const pathArray = typeof path === 'string' ? parsePath(path) : path;
  const length = pathArray.length;
  let current: unknown = obj;

  for (let i = 0; i < length; i++) {
    const key = pathArray[i];
      if (key === undefined) continue;
    let newValue: unknown;

    if (i === length - 1) {
      newValue = value;
    } else {
      const existing = (current as Record<string | number, unknown>)[key];
      newValue = customizer
        ? customizer(existing, key, current)
        : undefined;

      if (newValue === undefined) {
        newValue = typeof existing === 'object' && existing !== null
          ? existing
          : (isIndex(pathArray[i + 1] ?? 0) ? [] : {});
      }
    }

    (current as Record<string | number, unknown>)[key as string | number] = newValue;
    current = newValue;
  }

  return obj;
}

/**
 * Computes the sum of values in an array using an iteratee function
 * @param array - Source array
 * @param iteratee - Function to extract numeric value from each element
 * @returns Sum of all values
 */
export function sumBy<T>(array: T[], iteratee: (value: T) => number): number {
  let result = 0;
  for (const item of array) {
    const value = iteratee(item);
    if (value !== undefined) {
      result += value;
    }
  }
  return result;
}

/**
 * Creates a duplicate-free version of an array using an iteratee to generate comparison keys
 * @param array - Source array
 * @param iteratee - Function to generate comparison key for each element
 * @returns New array with unique elements
 */
export function uniqBy<T>(array: T[], iteratee: (value: T) => unknown): T[] {
  const seen = new Set();
  const result: T[] = [];

  for (const item of array) {
    const key = iteratee(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Creates an object from arrays of keys and values
 * @param keys - Array of property keys
 * @param values - Array of property values
 * @returns Object with keys mapped to corresponding values
 */
export function zipObject<K extends string | number | symbol, V>(
  keys: K[],
  values: V[]
): Record<K, V> {
  const result = {} as Record<K, V>;
  const length = Math.max(keys.length, values.length);

  for (let i = 0; i < length; i++) {
    if (i < keys.length && keys[i] !== undefined) {
      result[keys[i]!] = values[i] as V;
    }
  }

  return result;
}

/**
 * Identity function - returns the value passed to it
 * @param value - Any value
 * @returns The same value
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * Creates a function that always returns the given value
 * @param value - Value to return
 * @returns Function that returns the value
 */
export function constant<T>(value: T): () => T {
  return () => value;
}

/**
 * A no-operation function
 */
export function noop(): void {
  // Intentionally empty
}

/**
 * Checks if a value is a plain object (not an array, null, or special object)
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Checks if a value is a function
 * @param value - Value to check
 * @returns True if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Checks if a value is an object (including arrays, excluding null)
 * @param value - Value to check
 * @returns True if value is an object
 */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

/**
 * Checks if a value is object-like (non-null object)
 * @param value - Value to check
 * @returns True if value is object-like
 */
export function isObjectLike(value: unknown): boolean {
  return value !== null && typeof value === 'object';
}

/**
 * Gets a value at a path from an object
 * @param obj - Source object
 * @param path - Path string or array
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default value
 */
export function get<T = unknown>(
  obj: unknown,
  path: string | (string | number)[],
  defaultValue?: T
): T | undefined {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  const pathArray = typeof path === 'string' ? parsePath(path) : path;
  let current: unknown = obj;

  for (const key of pathArray) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = key !== undefined ? (current as Record<string | number, unknown>)[key] : undefined;
  }

  return (current === undefined ? defaultValue : current) as T | undefined;
}

/**
 * Checks if a path exists in an object
 * @param obj - Source object
 * @param path - Path string or array
 * @returns True if path exists
 */
export function has(obj: unknown, path: string | (string | number)[]): boolean {
  if (obj === null || obj === undefined) {
    return false;
  }

  const pathArray = typeof path === 'string' ? parsePath(path) : path;
  let current: unknown = obj;

  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
      if (key === undefined) continue;
    if (current === null || current === undefined) {
      return false;
    }
    if (key === undefined || !Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }
    current = key !== undefined ? (current as Record<string | number, unknown>)[key] : undefined;
  }

  return true;
}

// Helper functions

/**
 * Parses a path string into an array of keys
 * @param path - Path string like "a.b[0].c"
 * @returns Array of path segments
 */
function parsePath(path: string): (string | number)[] {
  const result: (string | number)[] = [];
  const regex = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(['"])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] !== undefined) {
      // Numeric index
      result.push(parseInt(match[1], 10));
    } else if (match[3] !== undefined) {
      // Quoted string
      result.push(match[3].replace(/\\(.)/g, '$1'));
    } else {
      // Regular property name
      result.push(match[0]);
    }
  }

  return result;
}

/**
 * Checks if a value is a valid array index
 * @param value - Value to check
 * @returns True if value is a valid array index
 */
function isIndex(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0;
  }
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && String(num) === value;
  }
  return false;
}
