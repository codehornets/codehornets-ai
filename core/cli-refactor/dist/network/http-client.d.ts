/**
 * HTTP Client
 *
 * High-level HTTP client wrapper providing a clean API for making HTTP requests.
 * Supports proxies, retries, timeouts, and various response handling.
 */
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import type { HttpRequestOptions, HttpResponse, ProxyConfig } from './types.js';
/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
    /** Base URL for all requests */
    baseUrl?: string;
    /** Default headers to include in all requests */
    defaultHeaders?: Record<string, string>;
    /** Default timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Whether to follow redirects (default: true) */
    followRedirects?: boolean;
    /** Maximum redirects to follow (default: 20) */
    maxRedirects?: number;
    /** Proxy configuration */
    proxy?: ProxyConfig;
    /** Whether to use proxy from environment variables (default: true) */
    useEnvProxy?: boolean;
    /** Maximum response size in bytes (default: unlimited) */
    maxResponseSize?: number;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Custom agent for HTTP requests */
    httpAgent?: HttpAgent;
    /** Custom agent for HTTPS requests */
    httpsAgent?: HttpsAgent;
}
/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay between retries in ms (default: 1000) */
    initialDelay?: number;
    /** Maximum delay between retries in ms (default: 10000) */
    maxDelay?: number;
    /** Multiplier for exponential backoff (default: 2) */
    backoffMultiplier?: number;
    /** HTTP status codes that should trigger retry */
    retryStatusCodes?: number[];
}
/**
 * HTTP Client class
 */
export declare class HttpClient {
    private config;
    private proxyAgent?;
    constructor(config?: HttpClientConfig);
    /**
     * Make an HTTP request
     */
    request<T = unknown>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    /**
     * Execute request with retry logic
     */
    private executeWithRetry;
    /**
     * Execute a single HTTP request
     */
    private executeRequest;
    /**
     * Get proxy URL for a request
     */
    private getProxyUrl;
    /**
     * Resolve URL with base URL
     */
    private resolveUrl;
    /**
     * Sleep helper
     */
    private sleep;
    /**
     * GET request
     */
    get<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    /**
     * POST request
     */
    post<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    /**
     * PUT request
     */
    put<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    /**
     * DELETE request
     */
    delete<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method'>): Promise<HttpResponse<T>>;
    /**
     * PATCH request
     */
    patch<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
    /**
     * HEAD request
     */
    head(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<void>>;
    /**
     * POST JSON data
     */
    postJson<T = unknown, R = unknown>(url: string, data: T, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<R>>;
    /**
     * PUT JSON data
     */
    putJson<T = unknown, R = unknown>(url: string, data: T, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<R>>;
    /**
     * PATCH JSON data
     */
    patchJson<T = unknown, R = unknown>(url: string, data: T, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<R>>;
}
/**
 * Create a new HTTP client instance
 */
export declare function createHttpClient(config?: HttpClientConfig): HttpClient;
/**
 * Get or create the default HTTP client
 */
export declare function getDefaultClient(): HttpClient;
/**
 * Set the default HTTP client configuration
 */
export declare function configureDefaultClient(config: HttpClientConfig): void;
/**
 * Make a GET request using the default client
 */
export declare function get<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
/**
 * Make a POST request using the default client
 */
export declare function post<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
/**
 * Make a PUT request using the default client
 */
export declare function put<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
/**
 * Make a DELETE request using the default client
 */
export declare function del<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method'>): Promise<HttpResponse<T>>;
/**
 * Make a PATCH request using the default client
 */
export declare function patch<T = unknown>(url: string, body?: HttpRequestOptions['body'], options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>>;
/**
 * Fetch JSON from a URL
 */
export declare function fetchJson<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<T>;
/**
 * Post JSON and get JSON response
 */
export declare function postJson<T = unknown, R = unknown>(url: string, data: T, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<R>;
//# sourceMappingURL=http-client.d.ts.map