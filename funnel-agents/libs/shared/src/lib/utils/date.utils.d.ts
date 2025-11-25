/**
 * Date utility functions
 */
/**
 * Format date to ISO string without milliseconds
 */
export declare function toISODateString(date: Date): string;
/**
 * Format date to YYYY-MM-DD format
 */
export declare function toDateString(date: Date): string;
/**
 * Add days to a date
 */
export declare function addDays(date: Date, days: number): Date;
/**
 * Add hours to a date
 */
export declare function addHours(date: Date, hours: number): Date;
/**
 * Add minutes to a date
 */
export declare function addMinutes(date: Date, minutes: number): Date;
/**
 * Get start of day
 */
export declare function startOfDay(date: Date): Date;
/**
 * Get end of day
 */
export declare function endOfDay(date: Date): Date;
/**
 * Get start of week (Monday)
 */
export declare function startOfWeek(date: Date): Date;
/**
 * Get start of month
 */
export declare function startOfMonth(date: Date): Date;
/**
 * Get end of month
 */
export declare function endOfMonth(date: Date): Date;
/**
 * Check if date is between two dates
 */
export declare function isBetween(date: Date, start: Date, end: Date): boolean;
/**
 * Check if date is in the past
 */
export declare function isPast(date: Date): boolean;
/**
 * Check if date is in the future
 */
export declare function isFuture(date: Date): boolean;
/**
 * Check if two dates are on the same day
 */
export declare function isSameDay(date1: Date, date2: Date): boolean;
/**
 * Get difference in days between two dates
 */
export declare function diffInDays(date1: Date, date2: Date): number;
/**
 * Get relative time string (e.g., "2 hours ago")
 */
export declare function relativeTime(date: Date): string;
