/**
 * @fileoverview Error Logging Utility
 *
 * Provides unified error logging with integration to Sentry, console, and custom handlers.
 * Includes structured logging with different severity levels and context tracking.
 *
 * @module utils/errorLogger
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

/**
 * Log levels
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal',
};

/**
 * Log categories for better organization
 * @enum {string}
 */
export const LogCategory = {
  API: 'api',
  AUTH: 'auth',
  UI: 'ui',
  NAVIGATION: 'navigation',
  DATA: 'data',
  PERFORMANCE: 'performance',
  VALIDATION: 'validation',
  NETWORK: 'network',
  SECURITY: 'security',
  SYSTEM: 'system',
};

/**
 * Console styling for different log levels
 */
const CONSOLE_STYLES = {
  [LogLevel.DEBUG]: 'color: #9E9E9E; font-weight: normal',
  [LogLevel.INFO]: 'color: #2196F3; font-weight: bold',
  [LogLevel.WARNING]: 'color: #FF9800; font-weight: bold',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold',
  [LogLevel.FATAL]: 'background: #F44336; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px',
};

/**
 * Configuration
 */
const CONFIG = {
  enableConsoleLogging: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true',
  enableSentryLogging: import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'false',
  minLogLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARNING,
};

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVEL_HIERARCHY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARNING]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * Check if log level should be logged based on minimum level
 *
 * @param {string} level - Log level
 * @returns {boolean}
 */
function shouldLog(level) {
  return LOG_LEVEL_HIERARCHY[level] >= LOG_LEVEL_HIERARCHY[CONFIG.minLogLevel];
}

/**
 * Format log message with timestamp and context
 *
 * @param {string} message - Log message
 * @param {string} category - Log category
 * @param {Object} [context] - Additional context
 * @returns {string}
 */
function formatLogMessage(message, category, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
  return `[${timestamp}] [${category.toUpperCase()}] ${message} ${contextStr}`.trim();
}

/**
 * Log to console with styling
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 */
function logToConsole(level, message, data = {}) {
  if (!CONFIG.enableConsoleLogging || !shouldLog(level)) return;

  const style = CONSOLE_STYLES[level];
  const prefix = `[${level.toUpperCase()}]`;

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`%c${prefix}`, style, message, data);
      break;
    case LogLevel.INFO:
      console.info(`%c${prefix}`, style, message, data);
      break;
    case LogLevel.WARNING:
      console.warn(`%c${prefix}`, style, message, data);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(`%c${prefix}`, style, message, data);
      break;
    default:
      console.log(`%c${prefix}`, style, message, data);
  }
}

/**
 * Log to Sentry
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Context information
 */
function logToSentry(level, message, context = {}) {
  if (!CONFIG.enableSentryLogging || !shouldLog(level)) return;

  // Only send warnings, errors, and fatal to Sentry
  if (LOG_LEVEL_HIERARCHY[level] < LOG_LEVEL_HIERARCHY[LogLevel.WARNING]) {
    return;
  }

  if (context.error) {
    // If there's an actual error object, capture it as an exception
    captureException(context.error, {
      level,
      tags: context.tags,
      extra: { ...context.extra, message },
    });
  } else {
    // Otherwise, capture as a message
    captureMessage(message, level, {
      tags: context.tags,
      extra: context.extra,
    });
  }
}

/**
 * Create log entry
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [options] - Options
 * @param {string} [options.category] - Log category
 * @param {Object} [options.tags] - Custom tags
 * @param {Object} [options.extra] - Extra data
 * @param {Error} [options.error] - Error object
 * @param {boolean} [options.addBreadcrumb] - Whether to add breadcrumb
 */
function log(level, message, options = {}) {
  const {
    category = LogCategory.SYSTEM,
    tags = {},
    extra = {},
    error = null,
    addBreadcrumb: shouldAddBreadcrumb = true,
  } = options;

  // Prepare context
  const context = {
    category,
    level,
    tags: {
      category,
      ...tags,
    },
    extra: {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...extra,
    },
    error,
  };

  // Add breadcrumb for debugging trail
  if (shouldAddBreadcrumb && CONFIG.enableSentryLogging) {
    addBreadcrumb({
      message,
      category,
      level,
      data: { ...context.extra, error: error?.message },
    });
  }

  // Log to console
  logToConsole(level, message, context);

  // Log to Sentry
  logToSentry(level, message, context);

  // Return context for chaining or custom handling
  return context;
}

/**
 * Log debug message
 *
 * @param {string} message - Debug message
 * @param {Object} [options] - Options
 *
 * @example
 * logDebug('User profile loaded', {
 *   category: LogCategory.UI,
 *   extra: { userId: '123' }
 * });
 */
export function logDebug(message, options = {}) {
  return log(LogLevel.DEBUG, message, options);
}

/**
 * Log info message
 *
 * @param {string} message - Info message
 * @param {Object} [options] - Options
 *
 * @example
 * logInfo('User completed onboarding', {
 *   category: LogCategory.UI,
 *   tags: { flow: 'onboarding' },
 *   extra: { step: 5 }
 * });
 */
export function logInfo(message, options = {}) {
  return log(LogLevel.INFO, message, options);
}

/**
 * Log warning message
 *
 * @param {string} message - Warning message
 * @param {Object} [options] - Options
 *
 * @example
 * logWarning('API response slow', {
 *   category: LogCategory.PERFORMANCE,
 *   extra: { duration: 5000, endpoint: '/api/data' }
 * });
 */
export function logWarning(message, options = {}) {
  return log(LogLevel.WARNING, message, options);
}

/**
 * Log error
 *
 * @param {string|Error} messageOrError - Error message or Error object
 * @param {Object} [options] - Options
 *
 * @example
 * logError('Failed to save data', {
 *   category: LogCategory.API,
 *   error: new Error('Network error'),
 *   tags: { endpoint: '/api/save' }
 * });
 *
 * @example
 * logError(new Error('Something went wrong'), {
 *   category: LogCategory.SYSTEM
 * });
 */
export function logError(messageOrError, options = {}) {
  let message = messageOrError;
  let error = options.error;

  if (messageOrError instanceof Error) {
    error = messageOrError;
    message = error.message;
  }

  return log(LogLevel.ERROR, message, { ...options, error });
}

/**
 * Log fatal error (critical errors that require immediate attention)
 *
 * @param {string|Error} messageOrError - Fatal error message or Error object
 * @param {Object} [options] - Options
 *
 * @example
 * logFatal('Critical system failure', {
 *   category: LogCategory.SYSTEM,
 *   error: new Error('Database connection lost'),
 *   extra: { retryAttempts: 3 }
 * });
 */
export function logFatal(messageOrError, options = {}) {
  let message = messageOrError;
  let error = options.error;

  if (messageOrError instanceof Error) {
    error = messageOrError;
    message = error.message;
  }

  return log(LogLevel.FATAL, message, { ...options, error });
}

/**
 * Log API error
 * Specialized logger for API-related errors
 *
 * @param {Object} params - Parameters
 * @param {string} params.endpoint - API endpoint
 * @param {string} params.method - HTTP method
 * @param {number} [params.status] - HTTP status code
 * @param {Error} [params.error] - Error object
 * @param {Object} [params.requestData] - Request data
 * @param {Object} [params.responseData] - Response data
 *
 * @example
 * logApiError({
 *   endpoint: '/api/users',
 *   method: 'POST',
 *   status: 500,
 *   error: new Error('Internal server error'),
 *   requestData: { name: 'John' },
 *   responseData: { error: 'Database error' }
 * });
 */
export function logApiError({ endpoint, method, status, error, requestData, responseData }) {
  const message = `API Error: ${method} ${endpoint} - ${status || 'Network Error'}`;

  return logError(message, {
    category: LogCategory.API,
    error,
    tags: {
      endpoint,
      method,
      status: status?.toString(),
    },
    extra: {
      requestData,
      responseData,
    },
  });
}

/**
 * Log validation error
 * Specialized logger for validation errors
 *
 * @param {string} field - Field name
 * @param {string} message - Validation message
 * @param {Object} [options] - Additional options
 *
 * @example
 * logValidationError('email', 'Invalid email format', {
 *   extra: { value: 'invalid@' }
 * });
 */
export function logValidationError(field, message, options = {}) {
  return logWarning(`Validation Error: ${field} - ${message}`, {
    category: LogCategory.VALIDATION,
    tags: {
      field,
      ...options.tags,
    },
    extra: options.extra,
  });
}

/**
 * Log authentication error
 * Specialized logger for auth-related errors
 *
 * @param {string} action - Auth action (e.g., 'login', 'logout', 'token-refresh')
 * @param {Error} error - Error object
 * @param {Object} [options] - Additional options
 *
 * @example
 * logAuthError('login', new Error('Invalid credentials'), {
 *   extra: { email: 'user@example.com' }
 * });
 */
export function logAuthError(action, error, options = {}) {
  return logError(`Authentication Error: ${action}`, {
    category: LogCategory.AUTH,
    error,
    tags: {
      action,
      ...options.tags,
    },
    extra: options.extra,
  });
}

/**
 * Log performance issue
 * Specialized logger for performance-related issues
 *
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {number} [threshold] - Threshold in milliseconds
 * @param {Object} [options] - Additional options
 *
 * @example
 * logPerformanceIssue('data-fetch', 5000, 2000, {
 *   extra: { endpoint: '/api/large-data' }
 * });
 */
export function logPerformanceIssue(operation, duration, threshold, options = {}) {
  const message = `Performance Issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`;

  return logWarning(message, {
    category: LogCategory.PERFORMANCE,
    tags: {
      operation,
      ...options.tags,
    },
    extra: {
      duration,
      threshold,
      ...options.extra,
    },
  });
}

/**
 * Create a scoped logger for a specific component or module
 *
 * @param {string} scope - Scope name (e.g., component name)
 * @param {string} [defaultCategory] - Default category
 * @returns {Object} Scoped logger methods
 *
 * @example
 * const logger = createLogger('UserProfile', LogCategory.UI);
 * logger.info('Profile loaded');
 * logger.error('Failed to save', { error: new Error('Network error') });
 */
export function createLogger(scope, defaultCategory = LogCategory.SYSTEM) {
  return {
    debug: (message, options = {}) =>
      logDebug(`[${scope}] ${message}`, { category: defaultCategory, ...options }),
    info: (message, options = {}) =>
      logInfo(`[${scope}] ${message}`, { category: defaultCategory, ...options }),
    warning: (message, options = {}) =>
      logWarning(`[${scope}] ${message}`, { category: defaultCategory, ...options }),
    error: (messageOrError, options = {}) =>
      logError(messageOrError, { category: defaultCategory, ...options }),
    fatal: (messageOrError, options = {}) =>
      logFatal(messageOrError, { category: defaultCategory, ...options }),
  };
}

/**
 * Measure and log function execution time
 *
 * @param {string} name - Operation name
 * @param {Function} fn - Function to measure
 * @param {number} [threshold] - Warning threshold in milliseconds
 * @returns {Promise|any} Function result
 *
 * @example
 * const data = await measureExecutionTime('fetchData', async () => {
 *   return await api.getData();
 * }, 1000);
 */
export async function measureExecutionTime(name, fn, threshold = 3000) {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    if (duration > threshold) {
      logPerformanceIssue(name, duration, threshold);
    } else {
      logDebug(`${name} completed`, {
        category: LogCategory.PERFORMANCE,
        extra: { duration: `${duration.toFixed(2)}ms` },
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logError(`${name} failed after ${duration.toFixed(2)}ms`, {
      category: LogCategory.PERFORMANCE,
      error,
    });
    throw error;
  }
}

/**
 * Export all for convenience
 */
export default {
  logDebug,
  logInfo,
  logWarning,
  logError,
  logFatal,
  logApiError,
  logValidationError,
  logAuthError,
  logPerformanceIssue,
  createLogger,
  measureExecutionTime,
  LogLevel,
  LogCategory,
};
