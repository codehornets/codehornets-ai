/**
 * Application-wide constants
 */
export declare const APP_NAME = "FunnelAgents";
export declare const APP_VERSION = "1.0.0";
/**
 * Default pagination values
 */
export declare const PAGINATION: {
    DEFAULT_PAGE: number;
    DEFAULT_LIMIT: number;
    MAX_LIMIT: number;
    DEFAULT_SORT_ORDER: "desc";
};
/**
 * Cache TTL values (in seconds)
 */
export declare const CACHE_TTL: {
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    VERY_LONG: number;
};
/**
 * Rate limiting values
 */
export declare const RATE_LIMIT: {
    DEFAULT_TTL: number;
    DEFAULT_LIMIT: number;
    STRICT_LIMIT: number;
};
/**
 * JWT token expiration times
 */
export declare const TOKEN_EXPIRATION: {
    ACCESS: string;
    REFRESH: string;
    PASSWORD_RESET: string;
    EMAIL_VERIFICATION: string;
};
/**
 * File upload limits
 */
export declare const FILE_LIMITS: {
    MAX_SIZE: number;
    ALLOWED_MIME_TYPES: string[];
    MAX_FILES: number;
};
/**
 * Queue job options
 */
export declare const JOB_OPTIONS: {
    DEFAULT_ATTEMPTS: number;
    DEFAULT_BACKOFF: number;
    DEFAULT_TIMEOUT: number;
    REMOVE_ON_COMPLETE: number;
    REMOVE_ON_FAIL: number;
};
/**
 * AI/Agent settings
 */
export declare const AGENT_SETTINGS: {
    DEFAULT_MODEL: string;
    DEFAULT_TEMPERATURE: number;
    DEFAULT_MAX_TOKENS: number;
    DEFAULT_TIMEOUT: number;
};
/**
 * Email settings
 */
export declare const EMAIL_SETTINGS: {
    DEFAULT_FROM_NAME: string;
    MAX_RECIPIENTS: number;
    BATCH_SIZE: number;
};
/**
 * Report settings
 */
export declare const REPORT_SETTINGS: {
    MAX_ROWS: number;
    DEFAULT_DATE_RANGE_DAYS: number;
    EXPORT_FORMATS: string[];
};
