/**
 * HTTP-related constants
 */
/**
 * HTTP status codes
 */
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * HTTP methods
 */
export declare const HTTP_METHOD: {
    readonly GET: "GET";
    readonly POST: "POST";
    readonly PUT: "PUT";
    readonly PATCH: "PATCH";
    readonly DELETE: "DELETE";
    readonly OPTIONS: "OPTIONS";
    readonly HEAD: "HEAD";
};
/**
 * Common HTTP headers
 */
export declare const HTTP_HEADERS: {
    readonly CONTENT_TYPE: "Content-Type";
    readonly AUTHORIZATION: "Authorization";
    readonly ACCEPT: "Accept";
    readonly CORRELATION_ID: "X-Correlation-ID";
    readonly REQUEST_ID: "X-Request-ID";
    readonly RATE_LIMIT_REMAINING: "X-RateLimit-Remaining";
    readonly RATE_LIMIT_RESET: "X-RateLimit-Reset";
    readonly CACHE_CONTROL: "Cache-Control";
    readonly USER_AGENT: "User-Agent";
    readonly ORIGIN: "Origin";
    readonly REFERER: "Referer";
};
/**
 * Content types
 */
export declare const CONTENT_TYPE: {
    readonly JSON: "application/json";
    readonly FORM_URLENCODED: "application/x-www-form-urlencoded";
    readonly FORM_DATA: "multipart/form-data";
    readonly TEXT_PLAIN: "text/plain";
    readonly TEXT_HTML: "text/html";
    readonly TEXT_CSV: "text/csv";
    readonly XML: "application/xml";
    readonly PDF: "application/pdf";
    readonly OCTET_STREAM: "application/octet-stream";
};
/**
 * Error codes
 */
export declare const ERROR_CODES: {
    readonly AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS";
    readonly AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED";
    readonly AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID";
    readonly AUTH_TOKEN_MISSING: "AUTH_TOKEN_MISSING";
    readonly AUTH_REFRESH_TOKEN_EXPIRED: "AUTH_REFRESH_TOKEN_EXPIRED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND";
    readonly ENTITY_ALREADY_EXISTS: "ENTITY_ALREADY_EXISTS";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
    readonly OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED";
};
