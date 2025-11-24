/**
 * Proxy Agent Implementation
 *
 * HTTP/HTTPS proxy agent for tunneling connections through proxy servers.
 * Based on https-proxy-agent pattern from cli.js.
 */

import { Agent as HttpAgent, ClientRequest, RequestOptions } from 'http';
import { Agent as HttpsAgent } from 'https';
import * as net from 'net';
import * as tls from 'tls';
import { URL } from 'url';
import type {
  ProxyConfig,
  ProxyConnectResponse,
  HttpsProxyAgentOptions,
  NetworkSocket,
} from './types.js';
import { ProxyConnectError, InvalidArgumentError } from './errors.js';

/**
 * Symbol for internal agent state
 */
const kAgentInternalState = Symbol('AgentBaseInternalState');

/**
 * Internal state interface
 */
interface AgentInternalState {
  currentSocket?: NetworkSocket;
  defaultPort?: number;
  protocol?: string;
}

/**
 * Base agent class that supports async connect methods
 */
export class AgentBase extends HttpAgent {
  private [kAgentInternalState]: AgentInternalState = {};

  constructor(options?: HttpsProxyAgentOptions) {
    super(options);
  }

  /**
   * Determine if the endpoint is secure (HTTPS)
   */
  isSecureEndpoint(options?: { secureEndpoint?: boolean; protocol?: string }): boolean {
    if (options) {
      if (typeof options.secureEndpoint === 'boolean') {
        return options.secureEndpoint;
      }
      if (typeof options.protocol === 'string') {
        return options.protocol === 'https:';
      }
    }

    // Fallback: Check call stack for https module
    const { stack } = new Error();
    if (typeof stack !== 'string') return false;

    return stack
      .split('\n')
      .some((line) => line.indexOf('(https.js:') !== -1 || line.indexOf('node:https:') !== -1);
  }

  /**
   * Get the name for socket pooling
   */
  override getName(options: RequestOptions): string {
    const secureEndpoint =
      typeof (options as Record<string, unknown>).secureEndpoint === 'boolean'
        ? (options as Record<string, unknown>).secureEndpoint as boolean
        : this.isSecureEndpoint(options as Record<string, unknown>);

    if (secureEndpoint) {
      return HttpsAgent.prototype.getName.call(this, options);
    }
    return super.getName(options);
  }

  /**
   * Create socket - override to use async connect
   */
  createSocket(
    req: ClientRequest,
    options: RequestOptions,
    callback: (err: Error | null, socket?: net.Socket) => void
  ): void {
    const opts = {
      ...options,
      secureEndpoint: this.isSecureEndpoint(options as Record<string, unknown>),
    };

    Promise.resolve()
      .then(() => this.connect(req, opts as Record<string, unknown>))
      .then((socket) => {
        if (socket instanceof HttpAgent) {
          // If connect returns an agent, use it
          try {
            (socket as unknown as { addRequest: (req: ClientRequest, opts: RequestOptions) => void }).addRequest(req, opts);
          } catch (err) {
            callback(err as Error);
          }
          return;
        }

        this[kAgentInternalState].currentSocket = socket;
        // Call parent createSocket with the resolved socket
        Object.getPrototypeOf(Object.getPrototypeOf(this)).createSocket.call(
          this,
          req,
          options,
          callback
        );
      })
      .catch((err: Error) => callback(err));
  }

  /**
   * Create connection - returns the previously stored socket
   */
  override createConnection(): NetworkSocket {
    const socket = this[kAgentInternalState].currentSocket;
    this[kAgentInternalState].currentSocket = undefined;

    if (!socket) {
      throw new Error('No socket was returned in the connect() function');
    }

    return socket;
  }

  /**
   * Async connect method - override in subclasses
   */
  async connect(
    _req: unknown,
    _options: Record<string, unknown>
  ): Promise<NetworkSocket | HttpAgent> {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Get default port based on protocol
   */
  get defaultPort(): number {
    return this[kAgentInternalState].defaultPort ?? (this.protocol === 'https:' ? 443 : 80);
  }

  set defaultPort(value: number) {
    if (this[kAgentInternalState]) {
      this[kAgentInternalState].defaultPort = value;
    }
  }

  /**
   * Get protocol
   */
  get protocol(): string {
    return this[kAgentInternalState].protocol ?? (this.isSecureEndpoint() ? 'https:' : 'http:');
  }

  set protocol(value: string) {
    if (this[kAgentInternalState]) {
      this[kAgentInternalState].protocol = value;
    }
  }
}

/**
 * HTTPS Proxy Agent
 *
 * Agent that tunnels requests through an HTTPS proxy server using
 * the HTTP CONNECT method.
 */
export class HttpsProxyAgent extends AgentBase {
  /** Supported protocols */
  static readonly protocols = ['http', 'https'];

  /** Proxy URL */
  readonly proxy: URL;

  /** Proxy headers */
  private proxyHeaders: Record<string, string> | (() => Record<string, string>);

  /** Connection options for the proxy */
  private connectOpts: tls.ConnectionOptions & net.NetConnectOpts;

  constructor(proxy: string | URL, options?: HttpsProxyAgentOptions) {
    super(options);

    this.proxy = typeof proxy === 'string' ? new URL(proxy) : proxy;
    this.proxyHeaders = options?.headers ?? {};

    // Extract host, handling IPv6 brackets
    const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, '');

    // Determine port
    const port = this.proxy.port
      ? parseInt(this.proxy.port, 10)
      : this.proxy.protocol === 'https:'
      ? 443
      : 80;

    // Build connection options
    this.connectOpts = {
      ALPNProtocols: ['http/1.1'],
      ...(options ? omitKeys(options as Record<string, unknown>, ['headers']) : {}),
      host,
      port,
    };
  }

  /**
   * Connect to target through proxy
   */
  override async connect(
    req: unknown,
    options: Record<string, unknown>
  ): Promise<NetworkSocket> {
    const { proxy } = this;

    const host = options.host as string | undefined;
    if (!host) {
      throw new InvalidArgumentError('No "host" provided');
    }

    // Create socket to proxy
    let socket: net.Socket | tls.TLSSocket;

    if (proxy.protocol === 'https:') {
      socket = tls.connect(addServername(this.connectOpts));
    } else {
      socket = net.connect(this.connectOpts);
    }

    // Build CONNECT request headers
    const headers =
      typeof this.proxyHeaders === 'function'
        ? this.proxyHeaders()
        : { ...this.proxyHeaders };

    // Format host for IPv6
    const hostHeader = net.isIPv6(host) ? `[${host}]` : host;
    const port = options.port as number;

    // Build CONNECT request
    let connectRequest = `CONNECT ${hostHeader}:${port} HTTP/1.1\r\n`;

    // Add proxy authentication if credentials present
    if (proxy.username || proxy.password) {
      const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(
        proxy.password
      )}`;
      headers['Proxy-Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
    }

    // Set required headers
    headers['Host'] = `${hostHeader}:${port}`;

    if (!headers['Proxy-Connection']) {
      headers['Proxy-Connection'] = (this as unknown as { keepAlive?: boolean }).keepAlive
        ? 'Keep-Alive'
        : 'close';
    }

    // Append headers to request
    for (const [key, value] of Object.entries(headers)) {
      connectRequest += `${key}: ${value}\r\n`;
    }

    // Start reading response
    const responsePromise = parseProxyResponse(socket);

    // Send CONNECT request
    socket.write(`${connectRequest}\r\n`);

    // Wait for proxy response
    const { connect: connectResponse } = await responsePromise;

    // Emit proxyConnect event
    const eventEmitter = req as { emit?: (event: string, data: unknown) => void };
    if (eventEmitter.emit) {
      eventEmitter.emit('proxyConnect', connectResponse);
    }
    this.emit('proxyConnect', connectResponse, req);

    // Check response status
    if (connectResponse.statusCode === 200) {
      // Resume socket
      const reqObj = req as { once?: (event: string, cb: (s: net.Socket) => void) => void };
      if (reqObj.once) {
        reqObj.once('socket', (s: net.Socket) => s.resume());
      }

      // If target is HTTPS, upgrade to TLS
      const secureEndpoint = options.secureEndpoint as boolean | undefined;
      if (secureEndpoint) {
        const tlsOpts = addServername({
          ...omitKeys(options as Record<string, unknown>, ['host', 'path', 'port']),
        } as tls.ConnectionOptions);
        return tls.connect({
          ...tlsOpts,
          socket,
        });
      }

      return socket;
    }

    // Connection failed - destroy socket and return error socket
    socket.destroy();

    throw new ProxyConnectError(
      connectResponse.statusCode,
      connectResponse.statusText,
      connectResponse.headers,
      `Proxy CONNECT failed: ${connectResponse.statusCode} ${connectResponse.statusText}`
    );
  }
}

/**
 * Parse proxy CONNECT response
 */
async function parseProxyResponse(
  socket: net.Socket
): Promise<{ connect: ProxyConnectResponse; buffered: Buffer }> {
  return new Promise((resolve, reject) => {
    let length = 0;
    const chunks: Buffer[] = [];

    function cleanup(): void {
      socket.removeListener('end', onEnd);
      socket.removeListener('error', onError);
      socket.removeListener('readable', onReadable);
    }

    function onEnd(): void {
      cleanup();
      reject(new Error('Proxy connection ended before receiving CONNECT response'));
    }

    function onError(err: Error): void {
      cleanup();
      reject(err);
    }

    function onReadable(): void {
      const chunk = socket.read() as Buffer | null;
      if (chunk) {
        onData(chunk);
      } else {
        socket.once('readable', onReadable);
      }
    }

    function onData(chunk: Buffer): void {
      chunks.push(chunk);
      length += chunk.length;

      const buffer = Buffer.concat(chunks, length);

      // Look for end of headers
      const headersEnd = buffer.indexOf('\r\n\r\n');
      if (headersEnd === -1) {
        // Haven't received all headers yet
        onReadable();
        return;
      }

      // Parse headers
      const headerLines = buffer.slice(0, headersEnd).toString('ascii').split('\r\n');
      const statusLine = headerLines.shift();

      if (!statusLine) {
        socket.destroy();
        reject(new Error('No header received from proxy CONNECT response'));
        return;
      }

      // Parse status line: "HTTP/1.1 200 Connection established"
      const statusParts = statusLine.split(' ');
      const statusCodeStr = statusParts[1];
      const statusCode = statusCodeStr ? parseInt(statusCodeStr, 10) : 0;
      const statusText = statusParts.slice(2).join(' ');

      // Parse headers
      const headers: Record<string, string | string[]> = {};
      for (const line of headerLines) {
        if (!line) continue;

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          socket.destroy();
          reject(new Error(`Invalid header from proxy CONNECT response: "${line}"`));
          return;
        }

        const key = line.slice(0, colonIndex).toLowerCase();
        const value = line.slice(colonIndex + 1).trimStart();

        const existing = headers[key];
        if (typeof existing === 'string') {
          headers[key] = [existing, value];
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          headers[key] = value;
        }
      }

      cleanup();
      resolve({
        connect: {
          statusCode,
          statusText,
          headers,
        },
        buffered: buffer,
      });
    }

    socket.on('error', onError);
    socket.on('end', onEnd);
    onReadable();
  });
}

/**
 * Add servername to options if not present and host is not IP
 */
function addServername<T extends { servername?: string; host?: string }>(options: T): T {
  if (options.servername === undefined && options.host && !net.isIP(options.host)) {
    return {
      ...options,
      servername: options.host,
    };
  }
  return options;
}

/**
 * Omit keys from object (type-safe version)
 */
function omitKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Create proxy agent from configuration
 */
export function createProxyAgent(config: ProxyConfig): HttpsProxyAgent {
  const proxyUrl = new URL(config.url);

  if (config.username) {
    proxyUrl.username = config.username;
  }
  if (config.password) {
    proxyUrl.password = config.password;
  }

  return new HttpsProxyAgent(proxyUrl, {
    headers: config.headers,
    keepAlive: config.keepAlive,
    ...config.tlsOptions,
  });
}

/**
 * Get proxy URL from environment variables
 */
export function getProxyFromEnv(url: string): string | null {
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';

  // Check environment variables (case insensitive)
  const envVars = isHttps
    ? ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy']
    : ['HTTP_PROXY', 'http_proxy'];

  for (const envVar of envVars) {
    const proxyUrl = process.env[envVar];
    if (proxyUrl) {
      // Check no_proxy
      if (!shouldBypassProxy(parsedUrl.hostname)) {
        return proxyUrl;
      }
    }
  }

  return null;
}

/**
 * Check if a hostname should bypass proxy based on NO_PROXY
 */
export function shouldBypassProxy(hostname: string): boolean {
  const noProxy = process.env['NO_PROXY'] || process.env['no_proxy'];
  if (!noProxy) return false;

  const noProxyList = noProxy.split(',').map((s) => s.trim().toLowerCase());
  const lowerHost = hostname.toLowerCase();

  for (const pattern of noProxyList) {
    if (!pattern) continue;

    // Exact match or wildcard
    if (pattern === '*') return true;
    if (lowerHost === pattern) return true;

    // Suffix match (e.g., .example.com matches sub.example.com)
    if (pattern.startsWith('.') && lowerHost.endsWith(pattern)) {
      return true;
    }

    // Also match without leading dot
    if (lowerHost.endsWith(`.${pattern}`)) {
      return true;
    }
  }

  return false;
}
