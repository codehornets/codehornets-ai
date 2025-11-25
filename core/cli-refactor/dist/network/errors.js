/**
 * Network Error Classes
 *
 * Typed error classes for HTTP client operations, proxy connections,
 * and network-related failures. Based on Undici error patterns.
 */
/**
 * Base class for all network-related errors
 */
export class NetworkError extends Error {
    /** Error code identifier */
    code;
    constructor(message, code = 'NET_ERR') {
        super(message);
        this.name = 'NetworkError';
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
/**
 * Error thrown when connection times out during establishment
 */
export class ConnectTimeoutError extends NetworkError {
    constructor(message) {
        super(message || 'Connect Timeout Error', 'UND_ERR_CONNECT_TIMEOUT');
        this.name = 'ConnectTimeoutError';
    }
}
/**
 * Error thrown when reading headers times out
 */
export class HeadersTimeoutError extends NetworkError {
    constructor(message) {
        super(message || 'Headers Timeout Error', 'UND_ERR_HEADERS_TIMEOUT');
        this.name = 'HeadersTimeoutError';
    }
}
/**
 * Error thrown when headers exceed maximum allowed size
 */
export class HeadersOverflowError extends NetworkError {
    constructor(message) {
        super(message || 'Headers Overflow Error', 'UND_ERR_HEADERS_OVERFLOW');
        this.name = 'HeadersOverflowError';
    }
}
/**
 * Error thrown when reading body times out
 */
export class BodyTimeoutError extends NetworkError {
    constructor(message) {
        super(message || 'Body Timeout Error', 'UND_ERR_BODY_TIMEOUT');
        this.name = 'BodyTimeoutError';
    }
}
/**
 * Error thrown for non-successful HTTP status codes
 */
export class ResponseStatusCodeError extends NetworkError {
    /** HTTP status code */
    status;
    /** Alias for status */
    statusCode;
    /** Response headers */
    headers;
    /** Response body (if available) */
    body;
    constructor(message, statusCode, headers, body) {
        super(message || 'Response Status Code Error', 'UND_ERR_RESPONSE_STATUS_CODE');
        this.name = 'ResponseStatusCodeError';
        this.status = statusCode ?? 0;
        this.statusCode = statusCode ?? 0;
        this.headers = headers ?? {};
        this.body = body;
    }
}
/**
 * Error thrown when an argument is invalid
 */
export class InvalidArgumentError extends NetworkError {
    constructor(message) {
        super(message || 'Invalid Argument Error', 'UND_ERR_INVALID_ARG');
        this.name = 'InvalidArgumentError';
    }
}
/**
 * Error thrown when a function returns an invalid value
 */
export class InvalidReturnValueError extends NetworkError {
    constructor(message) {
        super(message || 'Invalid Return Value Error', 'UND_ERR_INVALID_RETURN_VALUE');
        this.name = 'InvalidReturnValueError';
    }
}
/**
 * Base abort error
 */
export class AbortError extends NetworkError {
    constructor(message) {
        super(message || 'The operation was aborted', 'ABORT_ERR');
        this.name = 'AbortError';
    }
}
/**
 * Error thrown when a request is aborted
 */
export class RequestAbortedError extends AbortError {
    constructor(message) {
        super(message || 'Request aborted');
        this.name = 'RequestAbortedError';
        this.code = 'UND_ERR_ABORTED';
    }
}
/**
 * Informational error (not a failure, used for signaling)
 */
export class InformationalError extends NetworkError {
    constructor(message) {
        super(message || 'Request information', 'UND_ERR_INFO');
        this.name = 'InformationalError';
    }
}
/**
 * Error thrown when request body length doesn't match Content-Length header
 */
export class RequestContentLengthMismatchError extends NetworkError {
    constructor(message) {
        super(message || 'Request body length does not match content-length header', 'UND_ERR_REQ_CONTENT_LENGTH_MISMATCH');
        this.name = 'RequestContentLengthMismatchError';
    }
}
/**
 * Error thrown when response body length doesn't match Content-Length header
 */
export class ResponseContentLengthMismatchError extends NetworkError {
    constructor(message) {
        super(message || 'Response body length does not match content-length header', 'UND_ERR_RES_CONTENT_LENGTH_MISMATCH');
        this.name = 'ResponseContentLengthMismatchError';
    }
}
/**
 * Error thrown when the client has been destroyed
 */
export class ClientDestroyedError extends NetworkError {
    constructor(message) {
        super(message || 'The client is destroyed', 'UND_ERR_DESTROYED');
        this.name = 'ClientDestroyedError';
    }
}
/**
 * Error thrown when the client has been closed
 */
export class ClientClosedError extends NetworkError {
    constructor(message) {
        super(message || 'The client is closed', 'UND_ERR_CLOSED');
        this.name = 'ClientClosedError';
    }
}
/**
 * Error thrown for socket-level errors
 */
export class SocketError extends NetworkError {
    /** The socket that errored (if available) */
    socket;
    constructor(message, socket) {
        super(message || 'Socket error', 'UND_ERR_SOCKET');
        this.name = 'SocketError';
        this.socket = socket;
    }
}
/**
 * Error thrown when a feature is not supported
 */
export class NotSupportedError extends NetworkError {
    constructor(message) {
        super(message || 'Not supported error', 'UND_ERR_NOT_SUPPORTED');
        this.name = 'NotSupportedError';
    }
}
/**
 * Error thrown when balanced pool has no upstream
 */
export class BalancedPoolMissingUpstreamError extends NetworkError {
    constructor(message) {
        super(message || 'No upstream has been added to the BalancedPool', 'UND_ERR_BPL_MISSING_UPSTREAM');
        this.name = 'BalancedPoolMissingUpstreamError';
    }
}
/**
 * Error thrown during HTTP parsing
 */
export class HTTPParserError extends Error {
    /** Parser error code */
    code;
    /** Raw data that caused the error */
    data;
    constructor(message, code, data) {
        super(message);
        this.name = 'HTTPParserError';
        this.code = code ? `HPE_${code}` : undefined;
        this.data = data?.toString();
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
/**
 * Error thrown when response exceeds maximum allowed size
 */
export class ResponseExceededMaxSizeError extends NetworkError {
    constructor(message) {
        super(message || 'Response content exceeded max size', 'UND_ERR_RES_EXCEEDED_MAX_SIZE');
        this.name = 'ResponseExceededMaxSizeError';
    }
}
/**
 * Error thrown when a request retry fails
 */
export class RequestRetryError extends NetworkError {
    /** HTTP status code of the failed request */
    statusCode;
    /** Response headers */
    headers;
    /** Response data */
    data;
    constructor(message, statusCode, options) {
        super(message || 'Request retry error', 'UND_ERR_REQ_RETRY');
        this.name = 'RequestRetryError';
        this.statusCode = statusCode ?? 0;
        this.headers = options?.headers ?? {};
        this.data = options?.data;
    }
}
/**
 * General response error
 */
export class ResponseError extends NetworkError {
    /** HTTP status code */
    statusCode;
    /** Response headers */
    headers;
    /** Response data */
    data;
    constructor(message, statusCode, options) {
        super(message || 'Response error', 'UND_ERR_RESPONSE');
        this.name = 'ResponseError';
        this.statusCode = statusCode ?? 0;
        this.headers = options?.headers ?? {};
        this.data = options?.data;
    }
}
/**
 * Error thrown when secure proxy connection fails
 */
export class SecureProxyConnectionError extends NetworkError {
    /** Original error that caused the failure */
    cause;
    constructor(cause, message, options) {
        super(message || 'Secure Proxy Connection failed', 'UND_ERR_PRX_TLS');
        this.name = 'SecureProxyConnectionError';
        this.cause = cause;
        if (options?.cause) {
            Object.assign(this, options);
        }
    }
}
/**
 * Error thrown when proxy CONNECT request fails
 */
export class ProxyConnectError extends NetworkError {
    /** HTTP status code from proxy */
    statusCode;
    /** Status text from proxy */
    statusText;
    /** Proxy response headers */
    headers;
    constructor(statusCode, statusText, headers, message) {
        super(message || `Proxy CONNECT failed: ${statusCode} ${statusText}`, 'NET_ERR_PROXY_CONNECT');
        this.name = 'ProxyConnectError';
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.headers = headers;
    }
}
/**
 * Error thrown when URL parsing fails
 */
export class UrlParseError extends NetworkError {
    /** The input that failed to parse */
    input;
    constructor(input, message) {
        super(message || `Invalid URL: ${input}`, 'NET_ERR_URL_PARSE');
        this.name = 'UrlParseError';
        this.input = input;
    }
}
/**
 * Error thrown when DNS resolution fails
 */
export class DnsError extends NetworkError {
    /** Hostname that failed to resolve */
    hostname;
    constructor(hostname, message) {
        super(message || `DNS resolution failed for: ${hostname}`, 'NET_ERR_DNS');
        this.name = 'DnsError';
        this.hostname = hostname;
    }
}
/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error) {
    return error instanceof NetworkError;
}
/**
 * Type guard to check if an error is retriable
 */
export function isRetriableError(error) {
    if (!isNetworkError(error)) {
        return false;
    }
    const retriableCodes = [
        'UND_ERR_CONNECT_TIMEOUT',
        'UND_ERR_HEADERS_TIMEOUT',
        'UND_ERR_BODY_TIMEOUT',
        'UND_ERR_SOCKET',
        'NET_ERR_DNS',
    ];
    return retriableCodes.includes(error.code);
}
/**
 * Type guard to check if an error is an abort error
 */
export function isAbortError(error) {
    return error instanceof AbortError;
}
//# sourceMappingURL=errors.js.map