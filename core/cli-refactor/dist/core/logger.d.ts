/**
 * Logger module - Provides logging infrastructure for the CLI
 * Handles debug logging, console output, and log filtering
 */
/** Log level types */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/** Log filter configuration */
export interface LogFilter {
    /** Tags to include (if not exclusive) */
    include: string[];
    /** Tags to exclude (if exclusive) */
    exclude: string[];
    /** Whether the filter is exclusive (exclude mode) */
    isExclusive: boolean;
}
/** Logger configuration options */
export interface LoggerOptions {
    /** Enable debug mode output to stderr */
    debugMode?: boolean;
    /** Custom log file path */
    logFilePath?: string;
    /** Log filter string */
    filterString?: string;
}
/**
 * Sets the debug mode for the logger
 * @param enabled - Whether debug mode is enabled
 */
export declare function setDebugMode(enabled: boolean): void;
/**
 * Gets the current debug mode state
 * @returns Whether debug mode is enabled
 */
export declare function isDebugMode(): boolean;
/**
 * Writes a string to stdout in chunks to avoid buffer issues
 * @param content - Content to write
 */
export declare function writeStdout(content: string): void;
/**
 * Writes a string to stderr in chunks to avoid buffer issues
 * @param content - Content to write
 */
export declare function writeStderr(content: string): void;
/**
 * Extracts tags from a log message for filtering purposes
 * @param message - Log message to extract tags from
 * @returns Array of extracted tags
 */
export declare function extractLogTags(message: string): string[];
/**
 * Parses a filter string into a LogFilter object
 * @param filterString - Comma-separated filter string (prefix with ! for exclusion)
 * @returns LogFilter object or null if invalid
 */
export declare function parseLogFilter(filterString: string | undefined): LogFilter | null;
/**
 * Checks if log tags match a filter
 * @param tags - Tags to check
 * @param filter - Filter to apply
 * @returns True if tags pass the filter
 */
export declare function matchesLogFilter(tags: string[], filter: LogFilter | null): boolean;
/**
 * Checks if a log message should be output based on filter
 * @param message - Log message to check
 * @param filterString - Filter string to apply
 * @returns True if message should be output
 */
export declare function shouldLogMessage(message: string, filterString?: string): boolean;
/**
 * Gets the path for the debug log file
 * @returns Path to debug log file
 */
export declare function getDebugLogPath(): string;
/**
 * Logs a message to the debug log file
 * @param message - Message to log
 * @param options - Logging options
 */
export declare function log(message: string, options?: {
    level?: LogLevel;
}): void;
/**
 * Creates a scoped logger with a prefix
 * @param prefix - Prefix for all log messages
 * @returns Logger functions with the prefix applied
 */
export declare function createLogger(prefix: string): {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
};
/**
 * Logs a debug message (shorthand)
 * @param message - Message to log
 */
export declare function debug(message: string): void;
/**
 * Logs an info message (shorthand)
 * @param message - Message to log
 */
export declare function info(message: string): void;
/**
 * Logs a warning message (shorthand)
 * @param message - Message to log
 */
export declare function warn(message: string): void;
/**
 * Logs an error message (shorthand)
 * @param message - Message to log
 */
export declare function error(message: string): void;
/**
 * Clears the log filter cache
 */
export declare function clearLogFilterCache(): void;
//# sourceMappingURL=logger.d.ts.map