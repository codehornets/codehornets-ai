/**
 * Network Error Classes
 *
 * Typed error classes for HTTP client operations, proxy connections,
 * and network-related failures. Based on Undici error patterns.
 */
/**
 * Base class for all network-related errors
 */
export declare class NetworkError extends Error {
    /** Error code identifier */
    code: string;
    constructor(message?: string, code?: string);
}
/**
 * Error thrown when connection times out during establishment
 */
export declare class ConnectTimeoutError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when reading headers times out
 */
export declare class HeadersTimeoutError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when headers exceed maximum allowed size
 */
export declare class HeadersOverflowError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when reading body times out
 */
export declare class BodyTimeoutError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown for non-successful HTTP status codes
 */
export declare class ResponseStatusCodeError extends NetworkError {
    /** HTTP status code */
    readonly status: number;
    /** Alias for status */
    readonly statusCode: number;
    /** Response headers */
    readonly headers: Record<string, string | string[] | undefined>;
    /** Response body (if available) */
    readonly body?: unknown;
    constructor(message?: string, statusCode?: number, headers?: Record<string, string | string[] | undefined>, body?: unknown);
}
/**
 * Error thrown when an argument is invalid
 */
export declare class InvalidArgumentError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when a function returns an invalid value
 */
export declare class InvalidReturnValueError extends NetworkError {
    constructor(message?: string);
}
/**
 * Base abort error
 */
export declare class AbortError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when a request is aborted
 */
export declare class RequestAbortedError extends AbortError {
    constructor(message?: string);
}
/**
 * Informational error (not a failure, used for signaling)
 */
export declare class InformationalError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when request body length doesn't match Content-Length header
 */
export declare class RequestContentLengthMismatchError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when response body length doesn't match Content-Length header
 */
export declare class ResponseContentLengthMismatchError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when the client has been destroyed
 */
export declare class ClientDestroyedError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when the client has been closed
 */
export declare class ClientClosedError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown for socket-level errors
 */
export declare class SocketError extends NetworkError {
    /** The socket that errored (if available) */
    readonly socket?: unknown;
    constructor(message?: string, socket?: unknown);
}
/**
 * Error thrown when a feature is not supported
 */
export declare class NotSupportedError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when balanced pool has no upstream
 */
export declare class BalancedPoolMissingUpstreamError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown during HTTP parsing
 */
export declare class HTTPParserError extends Error {
    /** Parser error code */
    readonly code?: string;
    /** Raw data that caused the error */
    readonly data?: string;
    constructor(message?: string, code?: string, data?: Buffer);
}
/**
 * Error thrown when response exceeds maximum allowed size
 */
export declare class ResponseExceededMaxSizeError extends NetworkError {
    constructor(message?: string);
}
/**
 * Error thrown when a request retry fails
 */
export declare class RequestRetryError extends NetworkError {
    /** HTTP status code of the failed request */
    readonly statusCode: number;
    /** Response headers */
    readonly headers: Record<string, string | string[] | undefined>;
    /** Response data */
    readonly data?: unknown;
    constructor(message?: string, statusCode?: number, options?: {
        headers?: Record<string, string | string[] | undefined>;
        data?: unknown;
    });
}
/**
 * General response error
 */
export declare class ResponseError extends NetworkError {
    /** HTTP status code */
    readonly statusCode: number;
    /** Response headers */
    readonly headers: Record<string, string | string[] | undefined>;
    /** Response data */
    readonly data?: unknown;
    constructor(message?: string, statusCode?: number, options?: {
        headers?: Record<string, string | string[] | undefined>;
        data?: unknown;
    });
}
/**
 * Error thrown when secure proxy connection fails
 */
export declare class SecureProxyConnectionError extends NetworkError {
    /** Original error that caused the failure */
    readonly cause: Error;
    constructor(cause: Error, message?: string, options?: ErrorOptions);
}
/**
 * Error thrown when proxy CONNECT request fails
 */
export declare class ProxyConnectError extends NetworkError {
    /** HTTP status code from proxy */
    readonly statusCode: number;
    /** Status text from proxy */
    readonly statusText: string;
    /** Proxy response headers */
    readonly headers: Record<string, string | string[]>;
    constructor(statusCode: number, statusText: string, headers: Record<string, string | string[]>, message?: string);
}
/**
 * Error thrown when URL parsing fails
 */
export declare class UrlParseError extends NetworkError {
    /** The input that failed to parse */
    readonly input: string;
    constructor(input: string, message?: string);
}
/**
 * Error thrown when DNS resolution fails
 */
export declare class DnsError extends NetworkError {
    /** Hostname that failed to resolve */
    readonly hostname: string;
    constructor(hostname: string, message?: string);
}
/**
 * Type guard to check if an error is a NetworkError
 */
export declare function isNetworkError(error: unknown): error is NetworkError;
/**
 * Type guard to check if an error is retriable
 */
export declare function isRetriableError(error: unknown): boolean;
/**
 * Type guard to check if an error is an abort error
 */
export declare function isAbortError(error: unknown): error is AbortError;
//# sourceMappingURL=errors.d.ts.map