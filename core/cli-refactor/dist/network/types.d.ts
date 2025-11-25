/**
 * Network Module Types
 *
 * TypeScript interfaces and types for HTTP client, proxy configuration,
 * URL handling, and network error management.
 */
import type { Agent as HttpAgent, AgentOptions as HttpAgentOptions } from 'http';
import type { Agent as HttpsAgent } from 'https';
import type { Socket } from 'net';
import type { TLSSocket } from 'tls';
/**
 * HTTP methods supported by the HTTP client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
/**
 * HTTP request options
 */
export interface HttpRequestOptions {
    /** HTTP method */
    method?: HttpMethod;
    /** Request headers */
    headers?: Record<string, string | string[] | undefined>;
    /** Request body */
    body?: string | Buffer | Uint8Array | ReadableStream | null;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Signal for request cancellation */
    signal?: AbortSignal;
    /** Whether to follow redirects (default: true) */
    followRedirects?: boolean;
    /** Maximum number of redirects to follow (default: 20) */
    maxRedirects?: number;
    /** Custom agent for the request */
    agent?: HttpAgent | HttpsAgent;
}
/**
 * HTTP response object
 */
export interface HttpResponse<T = unknown> {
    /** HTTP status code */
    status: number;
    /** HTTP status text */
    statusText: string;
    /** Response headers */
    headers: Record<string, string | string[] | undefined>;
    /** Response body as text */
    text(): Promise<string>;
    /** Response body as JSON */
    json(): Promise<T>;
    /** Response body as buffer */
    buffer(): Promise<Buffer>;
    /** Response body as array buffer */
    arrayBuffer(): Promise<ArrayBuffer>;
    /** Whether the response was successful (2xx status) */
    ok: boolean;
    /** Final URL after redirects */
    url: string;
}
/**
 * Proxy configuration options
 */
export interface ProxyConfig {
    /** Proxy URL (http:// or https://) */
    url: string;
    /** Proxy authentication username */
    username?: string;
    /** Proxy authentication password */
    password?: string;
    /** Additional proxy headers */
    headers?: Record<string, string>;
    /** Whether to keep the connection alive */
    keepAlive?: boolean;
    /** Custom TLS options for HTTPS proxies */
    tlsOptions?: TlsOptions;
}
/**
 * TLS/SSL options for secure connections
 */
export interface TlsOptions {
    /** Server name for SNI */
    servername?: string;
    /** Reject unauthorized certificates (default: true) */
    rejectUnauthorized?: boolean;
    /** CA certificates */
    ca?: string | Buffer | Array<string | Buffer>;
    /** Client certificate */
    cert?: string | Buffer | Array<string | Buffer>;
    /** Client private key */
    key?: string | Buffer | Array<string | Buffer>;
    /** ALPN protocols */
    ALPNProtocols?: string[];
}
/**
 * Proxy connect response from CONNECT request
 */
export interface ProxyConnectResponse {
    /** HTTP status code from proxy */
    statusCode: number;
    /** HTTP status text from proxy */
    statusText: string;
    /** Response headers from proxy */
    headers: Record<string, string | string[]>;
}
/**
 * Agent base options
 */
export interface AgentBaseOptions extends HttpAgentOptions {
    /** Whether the endpoint is secure (HTTPS) */
    secureEndpoint?: boolean;
    /** Protocol (http: or https:) */
    protocol?: string;
}
/**
 * HTTPS Proxy Agent options
 */
export interface HttpsProxyAgentOptions extends AgentBaseOptions {
    /** Custom proxy headers or header generator */
    headers?: Record<string, string> | (() => Record<string, string>);
    /** TLS options for connecting to the proxy */
    tlsOptions?: TlsOptions;
}
/**
 * Parsed URL components (WHATWG URL Standard compatible)
 */
export interface ParsedUrl {
    /** Protocol scheme (e.g., 'https:') */
    protocol: string;
    /** Username for authentication */
    username: string;
    /** Password for authentication */
    password: string;
    /** Hostname (without port) */
    hostname: string;
    /** Port number as string (empty if default) */
    port: string;
    /** Full host (hostname:port) */
    host: string;
    /** Path portion of URL */
    pathname: string;
    /** Query string (including ?) */
    search: string;
    /** Fragment/hash (including #) */
    hash: string;
    /** Origin of the URL */
    origin: string;
    /** Full URL string */
    href: string;
}
/**
 * URL serialization options
 */
export interface UrlSerializeOptions {
    /** Whether to exclude the fragment */
    excludeFragment?: boolean;
    /** Whether to use Unicode (instead of ASCII/punycode) */
    unicode?: boolean;
}
/**
 * Punycode/IDNA conversion options
 */
export interface IdnaOptions {
    /** Check for invalid hyphens */
    checkHyphens?: boolean;
    /** Check for bidirectional text */
    checkBidi?: boolean;
    /** Check for CONTEXTJ characters */
    checkJoiners?: boolean;
    /** Use STD3 ASCII rules */
    useSTD3ASCIIRules?: boolean;
    /** Verify DNS length constraints */
    verifyDNSLength?: boolean;
    /** Use transitional processing (IDNA2003 compatibility) */
    transitionalProcessing?: boolean;
    /** Ignore invalid punycode */
    ignoreInvalidPunycode?: boolean;
}
/**
 * Result of IDNA toUnicode conversion
 */
export interface IdnaToUnicodeResult {
    /** Converted domain string */
    domain: string;
    /** Whether an error occurred */
    error: boolean;
}
/**
 * HTTP client symbols (internal state management)
 */
export declare const HttpClientSymbols: {
    readonly kClose: symbol;
    readonly kDestroy: symbol;
    readonly kDispatch: symbol;
    readonly kUrl: symbol;
    readonly kWriting: symbol;
    readonly kResuming: symbol;
    readonly kQueue: symbol;
    readonly kConnect: symbol;
    readonly kConnecting: symbol;
    readonly kKeepAliveDefaultTimeout: symbol;
    readonly kKeepAliveMaxTimeout: symbol;
    readonly kKeepAliveTimeoutThreshold: symbol;
    readonly kKeepAliveTimeoutValue: symbol;
    readonly kKeepAlive: symbol;
    readonly kHeadersTimeout: symbol;
    readonly kBodyTimeout: symbol;
    readonly kServerName: symbol;
    readonly kLocalAddress: symbol;
    readonly kHost: symbol;
    readonly kNoRef: symbol;
    readonly kBodyUsed: symbol;
    readonly kBody: symbol;
    readonly kRunning: symbol;
    readonly kBlocking: symbol;
    readonly kPending: symbol;
    readonly kSize: symbol;
    readonly kBusy: symbol;
    readonly kQueued: symbol;
    readonly kFree: symbol;
    readonly kConnected: symbol;
    readonly kClosed: symbol;
    readonly kNeedDrain: symbol;
    readonly kReset: symbol;
    readonly kDestroyed: symbol;
    readonly kResume: symbol;
    readonly kOnError: symbol;
    readonly kMaxHeadersSize: symbol;
    readonly kRunningIdx: symbol;
    readonly kPendingIdx: symbol;
    readonly kError: symbol;
    readonly kClients: symbol;
    readonly kClient: symbol;
    readonly kParser: symbol;
    readonly kOnDestroyed: symbol;
    readonly kPipelining: symbol;
    readonly kSocket: symbol;
    readonly kHostHeader: symbol;
    readonly kConnector: symbol;
    readonly kStrictContentLength: symbol;
    readonly kMaxRedirections: symbol;
    readonly kMaxRequests: symbol;
    readonly kProxy: symbol;
    readonly kCounter: symbol;
    readonly kInterceptors: symbol;
    readonly kMaxResponseSize: symbol;
    readonly kHTTP2Session: symbol;
    readonly kHTTP2SessionState: symbol;
    readonly kRetryHandlerDefaultRetry: symbol;
    readonly kConstruct: symbol;
    readonly kListeners: symbol;
    readonly kHTTPContext: symbol;
    readonly kMaxConcurrentStreams: symbol;
    readonly kNoProxyAgent: symbol;
    readonly kHttpProxyAgent: symbol;
    readonly kHttpsProxyAgent: symbol;
};
/**
 * Socket type union
 */
export type NetworkSocket = Socket | TLSSocket;
/**
 * Request metadata for logging/tracing
 */
export interface RequestMetadata {
    /** Unique request ID */
    requestId: string;
    /** Request start timestamp */
    startTime: number;
    /** Request URL */
    url: string;
    /** HTTP method */
    method: HttpMethod;
    /** Whether request went through proxy */
    proxied: boolean;
    /** Number of retry attempts */
    retryCount: number;
}
//# sourceMappingURL=types.d.ts.map