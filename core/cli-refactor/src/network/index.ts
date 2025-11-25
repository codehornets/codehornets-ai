/**
 * Network Module
 *
 * Provides HTTP client, proxy support, URL utilities, and network error handling.
 *
 * @module network
 */

// Types
export type {
  HttpMethod,
  HttpRequestOptions,
  HttpResponse,
  ProxyConfig,
  ProxyConnectResponse,
  TlsOptions,
  AgentBaseOptions,
  HttpsProxyAgentOptions,
  ParsedUrl,
  UrlSerializeOptions,
  IdnaOptions,
  IdnaToUnicodeResult,
  NetworkSocket,
  RequestMetadata,
} from './types.js';

export { HttpClientSymbols } from './types.js';

// Errors
export {
  // Base error
  NetworkError,
  // Timeout errors
  ConnectTimeoutError,
  HeadersTimeoutError,
  BodyTimeoutError,
  // Overflow errors
  HeadersOverflowError,
  ResponseExceededMaxSizeError,
  // Response errors
  ResponseStatusCodeError,
  ResponseContentLengthMismatchError,
  ResponseError,
  // Request errors
  RequestContentLengthMismatchError,
  RequestAbortedError,
  RequestRetryError,
  // Argument/value errors
  InvalidArgumentError,
  InvalidReturnValueError,
  // Abort errors
  AbortError,
  // Client state errors
  ClientDestroyedError,
  ClientClosedError,
  // Socket errors
  SocketError,
  HTTPParserError,
  // Support errors
  NotSupportedError,
  BalancedPoolMissingUpstreamError,
  // Proxy errors
  SecureProxyConnectionError,
  ProxyConnectError,
  // URL errors
  UrlParseError,
  DnsError,
  // Informational
  InformationalError,
  // Type guards
  isNetworkError,
  isRetriableError,
  isAbortError,
} from './errors.js';

// Proxy
export {
  AgentBase,
  HttpsProxyAgent,
  createProxyAgent,
  getProxyFromEnv,
  shouldBypassProxy,
} from './proxy.js';

// URL utilities
export {
  // URL class re-export
  URL,
  URLSearchParams,
  // Parsing
  parseUrl,
  tryParseUrl,
  isValidUrl,
  // Serialization
  serializeUrl,
  serializeOrigin,
  serializePath,
  // URL utilities
  getEffectivePort,
  hasCredentials,
  cannotHaveUsernamePasswordPort,
  setUsername,
  setPassword,
  joinUrl,
  getQueryParams,
  buildUrl,
  normalizeUrl,
  urlsEqual,
  getPathExtension,
  // Scheme utilities
  isSpecialScheme,
  getDefaultPort,
  isSecure,
  // IP utilities
  isIPAddress,
  isIPv4,
  isIPv6,
  formatIPv6,
  // IDNA (basic)
  toASCII,
  toUnicode,
} from './url.js';

// Punycode
export {
  PunycodeError,
  punycodeEncode,
  punycodeDecode,
  isPunycodeLabel,
  toASCII as punycodeToASCII,
  toUnicode as punycodeToUnicode,
  encode as encodeLabel,
  decode as decodeLabel,
  urlToASCII,
  urlToUnicode,
} from './punycode.js';

// HTTP Client
export {
  HttpClient,
  createHttpClient,
  getDefaultClient,
  configureDefaultClient,
  // Convenience functions
  get,
  post,
  put,
  del as delete,
  patch,
  fetchJson,
  postJson,
} from './http-client.js';

export type { HttpClientConfig, RetryConfig } from './http-client.js';
