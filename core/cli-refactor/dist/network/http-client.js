/**
 * HTTP Client
 *
 * High-level HTTP client wrapper providing a clean API for making HTTP requests.
 * Supports proxies, retries, timeouts, and various response handling.
 */
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { NetworkError, ConnectTimeoutError, RequestAbortedError, ResponseStatusCodeError, ResponseExceededMaxSizeError, isRetriableError, } from './errors.js';
import { HttpsProxyAgent, getProxyFromEnv, shouldBypassProxy } from './proxy.js';
/**
 * Default retry status codes
 */
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * HTTP Client class
 */
export class HttpClient {
    config;
    proxyAgent;
    constructor(config = {}) {
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
    async request(url, options = {}) {
        const fullUrl = this.resolveUrl(url);
        const method = options.method ?? 'GET';
        const headers = { ...this.config.defaultHeaders, ...options.headers };
        const timeout = options.timeout ?? this.config.timeout;
        const metadata = {
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
    async executeWithRetry(url, options, metadata) {
        const { maxAttempts, initialDelay, maxDelay, backoffMultiplier, retryStatusCodes } = this.config.retry;
        let lastError;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                metadata.retryCount = attempt;
                return await this.executeRequest(url, options, metadata);
            }
            catch (error) {
                lastError = error;
                // Check if we should retry
                const shouldRetry = attempt < maxAttempts - 1 &&
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
    executeRequest(url, options, metadata) {
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
                }
                else {
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
            const req = requestFn(url, requestOptions, (res) => {
                // Handle redirects
                if (this.config.followRedirects &&
                    res.statusCode &&
                    res.statusCode >= 300 &&
                    res.statusCode < 400 &&
                    res.headers.location) {
                    // Count redirects
                    const redirectCount = options._redirectCount ?? 0;
                    if (redirectCount >= this.config.maxRedirects) {
                        reject(new NetworkError(`Maximum redirects (${this.config.maxRedirects}) exceeded`));
                        return;
                    }
                    // Resolve redirect URL
                    const redirectUrl = new URL(res.headers.location, url).href;
                    // Follow redirect
                    this.executeRequest(redirectUrl, {
                        ...options,
                        _redirectCount: redirectCount + 1,
                    }, metadata)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                // Collect response body
                const chunks = [];
                let totalLength = 0;
                res.on('data', (chunk) => {
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
                    const response = {
                        status: res.statusCode ?? 0,
                        statusText: res.statusMessage ?? '',
                        headers: res.headers,
                        ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
                        url,
                        text: async () => body.toString('utf-8'),
                        json: async () => JSON.parse(body.toString('utf-8')),
                        buffer: async () => body,
                        arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
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
                }
                else {
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
                }
                else if (Buffer.isBuffer(options.body)) {
                    req.write(options.body);
                }
                else if (options.body instanceof Uint8Array) {
                    req.write(Buffer.from(options.body));
                }
            }
            req.end();
        });
    }
    /**
     * Get proxy URL for a request
     */
    getProxyUrl(url) {
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
    resolveUrl(url) {
        if (this.config.baseUrl && !url.startsWith('http://') && !url.startsWith('https://')) {
            return new URL(url, this.config.baseUrl).href;
        }
        return url;
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // Convenience methods
    /**
     * GET request
     */
    async get(url, options) {
        return this.request(url, { ...options, method: 'GET' });
    }
    /**
     * POST request
     */
    async post(url, body, options) {
        return this.request(url, { ...options, method: 'POST', body });
    }
    /**
     * PUT request
     */
    async put(url, body, options) {
        return this.request(url, { ...options, method: 'PUT', body });
    }
    /**
     * DELETE request
     */
    async delete(url, options) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    /**
     * PATCH request
     */
    async patch(url, body, options) {
        return this.request(url, { ...options, method: 'PATCH', body });
    }
    /**
     * HEAD request
     */
    async head(url, options) {
        return this.request(url, { ...options, method: 'HEAD' });
    }
    /**
     * POST JSON data
     */
    async postJson(url, data, options) {
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };
        return this.request(url, {
            ...options,
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    }
    /**
     * PUT JSON data
     */
    async putJson(url, data, options) {
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };
        return this.request(url, {
            ...options,
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
    }
    /**
     * PATCH JSON data
     */
    async patchJson(url, data, options) {
        const headers = {
            'Content-Type': 'application/json',
            ...options?.headers,
        };
        return this.request(url, {
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
export function createHttpClient(config) {
    return new HttpClient(config);
}
/**
 * Default HTTP client instance
 */
let defaultClient;
/**
 * Get or create the default HTTP client
 */
export function getDefaultClient() {
    if (!defaultClient) {
        defaultClient = new HttpClient();
    }
    return defaultClient;
}
/**
 * Set the default HTTP client configuration
 */
export function configureDefaultClient(config) {
    defaultClient = new HttpClient(config);
}
// Convenience functions using default client
/**
 * Make a GET request using the default client
 */
export async function get(url, options) {
    return getDefaultClient().get(url, options);
}
/**
 * Make a POST request using the default client
 */
export async function post(url, body, options) {
    return getDefaultClient().post(url, body, options);
}
/**
 * Make a PUT request using the default client
 */
export async function put(url, body, options) {
    return getDefaultClient().put(url, body, options);
}
/**
 * Make a DELETE request using the default client
 */
export async function del(url, options) {
    return getDefaultClient().delete(url, options);
}
/**
 * Make a PATCH request using the default client
 */
export async function patch(url, body, options) {
    return getDefaultClient().patch(url, body, options);
}
/**
 * Fetch JSON from a URL
 */
export async function fetchJson(url, options) {
    const response = await getDefaultClient().get(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...options?.headers,
        },
    });
    if (!response.ok) {
        throw new ResponseStatusCodeError(`HTTP ${response.status}: ${response.statusText}`, response.status, response.headers);
    }
    return response.json();
}
/**
 * Post JSON and get JSON response
 */
export async function postJson(url, data, options) {
    const response = await getDefaultClient().postJson(url, data, options);
    if (!response.ok) {
        throw new ResponseStatusCodeError(`HTTP ${response.status}: ${response.statusText}`, response.status, response.headers);
    }
    return response.json();
}
//# sourceMappingURL=http-client.js.map