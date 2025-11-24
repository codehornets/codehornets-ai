/**
 * Application-wide constants
 */

export const APP_NAME = 'FunnelAgents';
export const APP_VERSION = '1.0.0';

/**
 * Default pagination values
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_SORT_ORDER: 'desc' as const,
};

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

/**
 * Rate limiting values
 */
export const RATE_LIMIT = {
  DEFAULT_TTL: 60, // seconds
  DEFAULT_LIMIT: 100, // requests per TTL
  STRICT_LIMIT: 10, // requests per TTL for sensitive endpoints
};

/**
 * JWT token expiration times
 */
export const TOKEN_EXPIRATION = {
  ACCESS: '15m',
  REFRESH: '7d',
  PASSWORD_RESET: '1h',
  EMAIL_VERIFICATION: '24h',
};

/**
 * File upload limits
 */
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  MAX_FILES: 5,
};

/**
 * Queue job options
 */
export const JOB_OPTIONS = {
  DEFAULT_ATTEMPTS: 3,
  DEFAULT_BACKOFF: 1000,
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  REMOVE_ON_COMPLETE: 100, // Keep last 100 completed jobs
  REMOVE_ON_FAIL: 50, // Keep last 50 failed jobs
};

/**
 * AI/Agent settings
 */
export const AGENT_SETTINGS = {
  DEFAULT_MODEL: 'gpt-4o-mini',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 4096,
  DEFAULT_TIMEOUT: 60000, // 60 seconds
};

/**
 * Email settings
 */
export const EMAIL_SETTINGS = {
  DEFAULT_FROM_NAME: 'FunnelAgents',
  MAX_RECIPIENTS: 50,
  BATCH_SIZE: 100,
};

/**
 * Report settings
 */
export const REPORT_SETTINGS = {
  MAX_ROWS: 10000,
  DEFAULT_DATE_RANGE_DAYS: 30,
  EXPORT_FORMATS: ['json', 'csv', 'pdf', 'excel'],
};
