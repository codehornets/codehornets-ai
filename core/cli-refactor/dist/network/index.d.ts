/**
 * Network Module
 *
 * Provides HTTP client, proxy support, URL utilities, and network error handling.
 *
 * @module network
 */
export type { HttpMethod, HttpRequestOptions, HttpResponse, ProxyConfig, ProxyConnectResponse, TlsOptions, AgentBaseOptions, HttpsProxyAgentOptions, ParsedUrl, UrlSerializeOptions, IdnaOptions, IdnaToUnicodeResult, NetworkSocket, RequestMetadata, } from './types.js';
export { HttpClientSymbols } from './types.js';
export { NetworkError, ConnectTimeoutError, HeadersTimeoutError, BodyTimeoutError, HeadersOverflowError, ResponseExceededMaxSizeError, ResponseStatusCodeError, ResponseContentLengthMismatchError, ResponseError, RequestContentLengthMismatchError, RequestAbortedError, RequestRetryError, InvalidArgumentError, InvalidReturnValueError, AbortError, ClientDestroyedError, ClientClosedError, SocketError, HTTPParserError, NotSupportedError, BalancedPoolMissingUpstreamError, SecureProxyConnectionError, ProxyConnectError, UrlParseError, DnsError, InformationalError, isNetworkError, isRetriableError, isAbortError, } from './errors.js';
export { AgentBase, HttpsProxyAgent, createProxyAgent, getProxyFromEnv, shouldBypassProxy, } from './proxy.js';
export { URL, URLSearchParams, parseUrl, tryParseUrl, isValidUrl, serializeUrl, serializeOrigin, serializePath, getEffectivePort, hasCredentials, cannotHaveUsernamePasswordPort, setUsername, setPassword, joinUrl, getQueryParams, buildUrl, normalizeUrl, urlsEqual, getPathExtension, isSpecialScheme, getDefaultPort, isSecure, isIPAddress, isIPv4, isIPv6, formatIPv6, toASCII, toUnicode, } from './url.js';
export { PunycodeError, punycodeEncode, punycodeDecode, isPunycodeLabel, toASCII as punycodeToASCII, toUnicode as punycodeToUnicode, encode as encodeLabel, decode as decodeLabel, urlToASCII, urlToUnicode, } from './punycode.js';
export { HttpClient, createHttpClient, getDefaultClient, configureDefaultClient, get, post, put, del as delete, patch, fetchJson, postJson, } from './http-client.js';
export type { HttpClientConfig, RetryConfig } from './http-client.js';
//# sourceMappingURL=index.d.ts.map