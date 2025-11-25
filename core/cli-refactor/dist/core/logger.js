/**
 * Logger module - Provides logging infrastructure for the CLI
 * Handles debug logging, console output, and log filtering
 */
import * as fs from 'fs';
import * as path from 'path';
import { getConfigDir } from './config.js';
import { getSessionId } from './session.js';
// Module state
let debugMode = false;
let logFilterCache = new Map();
/**
 * Sets the debug mode for the logger
 * @param enabled - Whether debug mode is enabled
 */
export function setDebugMode(enabled) {
    debugMode = enabled;
}
/**
 * Gets the current debug mode state
 * @returns Whether debug mode is enabled
 */
export function isDebugMode() {
    return debugMode;
}
/**
 * Writes a string to stdout in chunks to avoid buffer issues
 * @param content - Content to write
 */
export function writeStdout(content) {
    const chunkSize = 2000;
    for (let i = 0; i < content.length; i += chunkSize) {
        process.stdout.write(content.substring(i, i + chunkSize));
    }
}
/**
 * Writes a string to stderr in chunks to avoid buffer issues
 * @param content - Content to write
 */
export function writeStderr(content) {
    const chunkSize = 2000;
    for (let i = 0; i < content.length; i += chunkSize) {
        process.stderr.write(content.substring(i, i + chunkSize));
    }
}
/**
 * Extracts tags from a log message for filtering purposes
 * @param message - Log message to extract tags from
 * @returns Array of extracted tags
 */
export function extractLogTags(message) {
    const tags = [];
    // Extract MCP server name
    const mcpMatch = message.match(/^MCP server ["']([^"']+)["']/);
    if (mcpMatch?.[1]) {
        tags.push('mcp');
        tags.push(mcpMatch[1].toLowerCase());
    }
    else {
        // Extract prefix before colon
        const prefixMatch = message.match(/^([^:[]+):/);
        if (prefixMatch?.[1]) {
            tags.push(prefixMatch[1].trim().toLowerCase());
        }
    }
    // Extract bracketed tags
    const bracketMatch = message.match(/^\[([^\]]+)]/);
    if (bracketMatch?.[1]) {
        tags.push(bracketMatch[1].trim().toLowerCase());
    }
    // Check for statsig events
    if (message.toLowerCase().includes('statsig event:')) {
        tags.push('statsig');
    }
    // Extract additional context
    const contextMatch = message.match(/:\s*([^:]+?)(?:\s+(?:type|mode|status|event))?:/);
    if (contextMatch?.[1]) {
        const tag = contextMatch[1].trim().toLowerCase();
        if (tag.length < 30 && !tag.includes(' ')) {
            tags.push(tag);
        }
    }
    return Array.from(new Set(tags));
}
/**
 * Parses a filter string into a LogFilter object
 * @param filterString - Comma-separated filter string (prefix with ! for exclusion)
 * @returns LogFilter object or null if invalid
 */
export function parseLogFilter(filterString) {
    if (!filterString || filterString.trim() === '') {
        return null;
    }
    // Check cache
    if (logFilterCache.has(filterString)) {
        return logFilterCache.get(filterString) ?? null;
    }
    const parts = filterString.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) {
        logFilterCache.set(filterString, null);
        return null;
    }
    const hasExclusions = parts.some((p) => p.startsWith('!'));
    const hasInclusions = parts.some((p) => !p.startsWith('!'));
    // Mixed mode (both include and exclude) is not supported
    if (hasExclusions && hasInclusions) {
        logFilterCache.set(filterString, null);
        return null;
    }
    const normalizedParts = parts.map((p) => p.replace(/^!/, '').toLowerCase());
    const filter = {
        include: hasExclusions ? [] : normalizedParts,
        exclude: hasExclusions ? normalizedParts : [],
        isExclusive: hasExclusions,
    };
    logFilterCache.set(filterString, filter);
    return filter;
}
/**
 * Checks if log tags match a filter
 * @param tags - Tags to check
 * @param filter - Filter to apply
 * @returns True if tags pass the filter
 */
export function matchesLogFilter(tags, filter) {
    if (!filter)
        return true;
    if (tags.length === 0)
        return false;
    if (filter.isExclusive) {
        // Exclusive mode: return true if no tags match the exclude list
        return !tags.some((tag) => filter.exclude.includes(tag));
    }
    // Inclusive mode: return true if any tag matches the include list
    return tags.some((tag) => filter.include.includes(tag));
}
/**
 * Checks if a log message should be output based on filter
 * @param message - Log message to check
 * @param filterString - Filter string to apply
 * @returns True if message should be output
 */
export function shouldLogMessage(message, filterString) {
    const filter = parseLogFilter(filterString);
    if (!filter)
        return true;
    const tags = extractLogTags(message);
    return matchesLogFilter(tags, filter);
}
/**
 * Gets the path for the debug log file
 * @returns Path to debug log file
 */
export function getDebugLogPath() {
    const customPath = process.env.CLAUDE_CODE_DEBUG_LOGS_DIR;
    if (customPath) {
        return customPath;
    }
    return path.join(getConfigDir(), 'debug', `${getSessionId()}.txt`);
}
/**
 * Logs a message to the debug log file
 * @param message - Message to log
 * @param options - Logging options
 */
export function log(message, options = { level: 'debug' }) {
    const { level = 'debug' } = options;
    // Check if we should log this message
    if (!shouldLog(message)) {
        return;
    }
    // Format message for JSON if it contains newlines and we're in debug mode
    let formattedMessage = message;
    if (debugMode && message.includes('\n')) {
        formattedMessage = JSON.stringify(message);
    }
    const logLine = `[${level.toUpperCase()}] ${formattedMessage.trim()}\n`;
    // In debug mode, write to stderr
    if (debugMode) {
        writeStderr(logLine);
        return;
    }
    // Otherwise write to debug log file
    const logPath = getDebugLogPath();
    const logDir = path.dirname(logPath);
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
        }
        fs.appendFileSync(logPath, logLine);
    }
    catch {
        // Silently fail if we can't write to the log file
    }
}
/**
 * Checks if a message should be logged based on environment filter
 * @param message - Message to check
 * @returns True if message should be logged
 */
function shouldLog(message) {
    // Check Node.js environment
    if (typeof process === 'undefined' ||
        typeof process.versions === 'undefined' ||
        typeof process.versions.node === 'undefined') {
        return false;
    }
    // Apply any configured filter
    const filterString = process.env.CLAUDE_CODE_LOG_FILTER;
    return shouldLogMessage(message, filterString);
}
/**
 * Creates a scoped logger with a prefix
 * @param prefix - Prefix for all log messages
 * @returns Logger functions with the prefix applied
 */
export function createLogger(prefix) {
    return {
        debug: (message) => log(`[${prefix}] ${message}`, { level: 'debug' }),
        info: (message) => log(`[${prefix}] ${message}`, { level: 'info' }),
        warn: (message) => log(`[${prefix}] ${message}`, { level: 'warn' }),
        error: (message) => log(`[${prefix}] ${message}`, { level: 'error' }),
    };
}
/**
 * Logs a debug message (shorthand)
 * @param message - Message to log
 */
export function debug(message) {
    log(message, { level: 'debug' });
}
/**
 * Logs an info message (shorthand)
 * @param message - Message to log
 */
export function info(message) {
    log(message, { level: 'info' });
}
/**
 * Logs a warning message (shorthand)
 * @param message - Message to log
 */
export function warn(message) {
    log(message, { level: 'warn' });
}
/**
 * Logs an error message (shorthand)
 * @param message - Message to log
 */
export function error(message) {
    log(message, { level: 'error' });
}
/**
 * Clears the log filter cache
 */
export function clearLogFilterCache() {
    logFilterCache = new Map();
}
//# sourceMappingURL=logger.js.map