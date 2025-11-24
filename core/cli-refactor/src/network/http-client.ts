/**
 * HTTP Client
 *
 * High-level HTTP client wrapper providing a clean API for making HTTP requests.
 * Supports proxies, retries, timeouts, and various response handling.
 */

import { request as httpRequest, Agent as HttpAgent, IncomingMessage } from 'http';
import { request as httpsRequest, Agent as HttpsAgent } from 'https';
import { URL } from 'url';
import type {
  HttpMethod,
  HttpRequestOptions,
  HttpResponse,
  RequestMetadata,
  ProxyConfig,
} from './types.js';
import {
  NetworkError,
  ConnectTimeoutError,
  BodyTimeoutError,
  RequestAbortedError,
  ResponseStatusCodeError,
  ResponseExceededMaxSizeError,
  isRetriableError,
} from './errors.js';
import { HttpsProxyAgent, getProxyFromEnv, shouldBypassProxy } from './proxy.js';
import { isSecure, parseUrl } from './url.js';

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
 * Default retry status codes
 */
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Resolved retry configuration (all fields required)
 */
interface ResolvedRetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryStatusCodes: number[];
}

/**
 * HTTP Client class
 */
export class HttpClient {
  private config: {
    baseUrl: string;
    defaultHeaders: Record<string, string>;
    timeout: number;
    followRedirects: boolean;
    maxRedirects: number;
    useEnvProxy: boolean;
    maxResponseSize: number;
    retry: ResolvedRetryConfig;
    proxy?: ProxyConfig;
    httpAgent?: HttpAgent;
    httpsAgent?: HttpsAgent;
  };

  private proxyAgent?: HttpsProxyAgent;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? '',
      defaultHeaders: config.defaultHeaders ?? {},
      timeout: config.timeout ?? 30000,
      followRedirects: config.followRedirects ?? true,
      maxRedirects: config.maxRedirects ?? 20,
      useEnvProxy: config.useEnvProxy ?? true,
      maxResponseSize: config.maxResponseSize ?? Infinity,
      retry: {
        maxAttempts: config.retry?.maxAttempts ?? 3,
        initialDelay: config.retry?.initialDelay ?? 1000,
        maxDelay: config.retry?.maxDelay ?? 10000,
        backoffMultiplier: config.retry?.backoffMultiplier ?? 2,
        retryStatusCodes: config.retry?.retryStatusCodes ?? DEFAULT_RETRY_STATUS_CODES,
      },
      proxy: config.proxy,
      httpAgent: config.httpAgent,
      httpsAgent: config.httpsAgent,
    };

    // Create proxy agent if configured
    if (config.proxy) {
      this.proxyAgent = new HttpsProxyAgent(config.proxy.url, {
        headers: config.proxy.headers,
        keepAlive: config.proxy.keepAlive,
      });
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.resolveUrl(url);
    const method = options.method ?? 'GET';
    const headers = { ...this.config.defaultHeaders, ...options.headers };
    const timeout = options.timeout ?? this.config.timeout;

    const metadata: RequestMetadata = {
      requestId: generateRequestId(),
      startTime: Date.now(),
      url: fullUrl,
      method,
      proxied: false,
      retryCount: 0,
    };

    return this.executeWithRetry(fullUrl, { ...options, method, headers, timeout }, metadata);
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: HttpRequestOptions,
    metadata: RequestMetadata
  ): Promise<HttpResponse<T>> {
    const { maxAttempts, initialDelay, maxDelay, backoffMultiplier, retryStatusCodes } =
      this.config.retry;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        metadata.retryCount = attempt;
        return await this.executeRequest<T>(url, options, metadata);
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        const shouldRetry =
          attempt < maxAttempts - 1 &&
          (isRetriableError(error) ||
            (error instanceof ResponseStatusCodeError &&
              retryStatusCodes.includes(error.statusCode)));

        if (!shouldRetry) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

        // Add jitter to prevent thundering herd
        const jitter = delay * 0.1 * Math.random();

        await this.sleep(delay + jitter);
      }
    }

    throw lastError ?? new NetworkError('Request failed after retries');
  }

  /**
   * Execute a single HTTP request
   */
  private executeRequest<T>(
    url: string,
    options: HttpRequestOptions,
    metadata: RequestMetadata
  ): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';

      // Determine agent
      let agent = options.agent;
      if (!agent) {
        // Check for proxy
        const proxyUrl = this.getProxyUrl(url);
        if (proxyUrl) {
          metadata.proxied = true;
          agent = this.proxyAgent ?? new HttpsProxyAgent(proxyUrl);
        } else {
          agent = isHttps ? this.config.httpsAgent : this.config.httpAgent;
        }
      }

      // Build request options
      const requestOptions = {
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
        agent,
        timeout: options.timeout ?? this.config.timeout,
      };

      // Select http or https module
      const requestFn = isHttps ? httpsRequest : httpRequest;

      // Create request
      const req = requestFn(url, requestOptions, (res: IncomingMessage) => {
        // Handle redirects
        if (
          this.config.followRedirects &&
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // Count redirects
          const redirectCount =
            (options as { _redirectCount?: number })._redirectCount ?? 0;
          if (redirectCount >= this.config.maxRedirects) {
            reject(new NetworkError(`Maximum redirects (${this.config.maxRedirects}) exceeded`));
            return;
          }

          // Resolve redirect URL
          const redirectUrl = new URL(res.headers.location, url).href;

          // Follow redirect
          this.executeRequest<T>(
            redirectUrl,
            {
              ...options,
              _redirectCount: redirectCount + 1,
            } as HttpRequestOptions & { _redirectCount: number },
            metadata
          )
            .then(resolve)
            .catch(reject);
          return;
        }

        // Collect response body
        const chunks: Buffer[] = [];
        let totalLength = 0;

        res.on('data', (chunk: Buffer) => {
          totalLength += chunk.length;

          // Check response size limit
          if (totalLength > this.config.maxResponseSize) {
            req.destroy();
            reject(new ResponseExceededMaxSizeError());
            return;
          }

          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);

          const response: HttpResponse<T> = {
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? '',
            headers: res.headers as Record<string, string | string[] | undefined>,
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            url,
            text: async () => body.toString('utf-8'),
            json: async () => JSON.parse(body.toString('utf-8')) as T,
            buffer: async () => body,
            arrayBuffer: async () => body.buffer.slice(
              body.byteOffset,
              body.byteOffset + body.byteLength
            ),
          };

          resolve(response);
        });

        res.on('error', (err) => {
          reject(new NetworkError(err.message));
        });
      });

      // Handle request errors
      req.on('error', (err) => {
        if (options.signal?.aborted) {
          reject(new RequestAbortedError());
        } else {
          reject(new NetworkError(err.message));
        }
      });

      // Handle timeout
      req.on('timeout', () => {
        req.destroy();
        reject(new ConnectTimeoutError());
      });

      // Handle abort signal
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          req.destroy();
          reject(new RequestAbortedError());
        });
      }

      // Send body if present
      if (options.body) {
        if (typeof options.body === 'string') {
          req.write(options.body);
        } else if (Buffer.isBuffer(options.body)) {
          req.write(options.body);
        } else if (options.body instanceof Uint8Array) {
          req.write(Buffer.from(options.body));
        }
      }

      req.end();
    });
  }

  /**
   * Get proxy URL for a request
   */
  private getProxyUrl(url: string): string | null {
    if (this.config.proxy) {
      return this.config.proxy.url;
    }

    if (this.config.useEnvProxy) {
      const parsedUrl = new URL(url);
      if (!shouldBypassProxy(parsedUrl.hostname)) {
        return getProxyFromEnv(url);
      }
    }

    return null;
  }

  /**
   * Resolve URL with base URL
   */
  private resolveUrl(url: string): string {
    if (this.config.baseUrl && !url.startsWith('http://') && !url.startsWith('https://')) {
      return new URL(url, this.config.baseUrl).href;
    }
    return url;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience methods

  /**
   * GET request
   */
  async get<T = unknown>(url: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    body?: HttpRequestOptions['body'],
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    body?: HttpRequestOptions['body'],
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, 'method'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    body?: HttpRequestOptions['body'],
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  /**
   * HEAD request
   */
  async head(
    url: string,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<void>> {
    return this.request<void>(url, { ...options, method: 'HEAD' });
  }

  /**
   * POST JSON data
   */
  async postJson<T = unknown, R = unknown>(
    url: string,
    data: T,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<R>> {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    return this.request<R>(url, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT JSON data
   */
  async putJson<T = unknown, R = unknown>(
    url: string,
    data: T,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<R>> {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    return this.request<R>(url, {
      ...options,
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH JSON data
   */
  async patchJson<T = unknown, R = unknown>(
    url: string,
    data: T,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse<R>> {
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    return this.request<R>(url, {
      ...options,
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }
}

/**
 * Create a new HTTP client instance
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

/**
 * Default HTTP client instance
 */
let defaultClient: HttpClient | undefined;

/**
 * Get or create the default HTTP client
 */
export function getDefaultClient(): HttpClient {
  if (!defaultClient) {
    defaultClient = new HttpClient();
  }
  return defaultClient;
}

/**
 * Set the default HTTP client configuration
 */
export function configureDefaultClient(config: HttpClientConfig): void {
  defaultClient = new HttpClient(config);
}

// Convenience functions using default client

/**
 * Make a GET request using the default client
 */
export async function get<T = unknown>(
  url: string,
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
  return getDefaultClient().get<T>(url, options);
}

/**
 * Make a POST request using the default client
 */
export async function post<T = unknown>(
  url: string,
  body?: HttpRequestOptions['body'],
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
  return getDefaultClient().post<T>(url, body, options);
}

/**
 * Make a PUT request using the default client
 */
export async function put<T = unknown>(
  url: string,
  body?: HttpRequestOptions['body'],
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
  return getDefaultClient().put<T>(url, body, options);
}

/**
 * Make a DELETE request using the default client
 */
export async function del<T = unknown>(
  url: string,
  options?: Omit<HttpRequestOptions, 'method'>
): Promise<HttpResponse<T>> {
  return getDefaultClient().delete<T>(url, options);
}

/**
 * Make a PATCH request using the default client
 */
export async function patch<T = unknown>(
  url: string,
  body?: HttpRequestOptions['body'],
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<HttpResponse<T>> {
  return getDefaultClient().patch<T>(url, body, options);
}

/**
 * Fetch JSON from a URL
 */
export async function fetchJson<T = unknown>(
  url: string,
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<T> {
  const response = await getDefaultClient().get<T>(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ResponseStatusCodeError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.headers
    );
  }

  return response.json();
}

/**
 * Post JSON and get JSON response
 */
export async function postJson<T = unknown, R = unknown>(
  url: string,
  data: T,
  options?: Omit<HttpRequestOptions, 'method' | 'body'>
): Promise<R> {
  const response = await getDefaultClient().postJson<T, R>(url, data, options);

  if (!response.ok) {
    throw new ResponseStatusCodeError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.headers
    );
  }

  return response.json();
}
