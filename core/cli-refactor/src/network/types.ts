/**
 * Network Module Types
 *
 * TypeScript interfaces and types for HTTP client, proxy configuration,
 * URL handling, and network error management.
 */

import type { Agent as HttpAgent, AgentOptions as HttpAgentOptions } from 'http';
import type { Agent as HttpsAgent, AgentOptions as HttpsAgentOptions } from 'https';
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
export const HttpClientSymbols = {
  kClose: Symbol('close'),
  kDestroy: Symbol('destroy'),
  kDispatch: Symbol('dispatch'),
  kUrl: Symbol('url'),
  kWriting: Symbol('writing'),
  kResuming: Symbol('resuming'),
  kQueue: Symbol('queue'),
  kConnect: Symbol('connect'),
  kConnecting: Symbol('connecting'),
  kKeepAliveDefaultTimeout: Symbol('default keep alive timeout'),
  kKeepAliveMaxTimeout: Symbol('max keep alive timeout'),
  kKeepAliveTimeoutThreshold: Symbol('keep alive timeout threshold'),
  kKeepAliveTimeoutValue: Symbol('keep alive timeout'),
  kKeepAlive: Symbol('keep alive'),
  kHeadersTimeout: Symbol('headers timeout'),
  kBodyTimeout: Symbol('body timeout'),
  kServerName: Symbol('server name'),
  kLocalAddress: Symbol('local address'),
  kHost: Symbol('host'),
  kNoRef: Symbol('no ref'),
  kBodyUsed: Symbol('used'),
  kBody: Symbol('abstracted request body'),
  kRunning: Symbol('running'),
  kBlocking: Symbol('blocking'),
  kPending: Symbol('pending'),
  kSize: Symbol('size'),
  kBusy: Symbol('busy'),
  kQueued: Symbol('queued'),
  kFree: Symbol('free'),
  kConnected: Symbol('connected'),
  kClosed: Symbol('closed'),
  kNeedDrain: Symbol('need drain'),
  kReset: Symbol('reset'),
  kDestroyed: Symbol.for('nodejs.stream.destroyed'),
  kResume: Symbol('resume'),
  kOnError: Symbol('on error'),
  kMaxHeadersSize: Symbol('max headers size'),
  kRunningIdx: Symbol('running index'),
  kPendingIdx: Symbol('pending index'),
  kError: Symbol('error'),
  kClients: Symbol('clients'),
  kClient: Symbol('client'),
  kParser: Symbol('parser'),
  kOnDestroyed: Symbol('destroy callbacks'),
  kPipelining: Symbol('pipelining'),
  kSocket: Symbol('socket'),
  kHostHeader: Symbol('host header'),
  kConnector: Symbol('connector'),
  kStrictContentLength: Symbol('strict content length'),
  kMaxRedirections: Symbol('maxRedirections'),
  kMaxRequests: Symbol('maxRequestsPerClient'),
  kProxy: Symbol('proxy agent options'),
  kCounter: Symbol('socket request counter'),
  kInterceptors: Symbol('dispatch interceptors'),
  kMaxResponseSize: Symbol('max response size'),
  kHTTP2Session: Symbol('http2Session'),
  kHTTP2SessionState: Symbol('http2Session state'),
  kRetryHandlerDefaultRetry: Symbol('retry agent default retry'),
  kConstruct: Symbol('constructable'),
  kListeners: Symbol('listeners'),
  kHTTPContext: Symbol('http context'),
  kMaxConcurrentStreams: Symbol('max concurrent streams'),
  kNoProxyAgent: Symbol('no proxy agent'),
  kHttpProxyAgent: Symbol('http proxy agent'),
  kHttpsProxyAgent: Symbol('https proxy agent'),
} as const;

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
