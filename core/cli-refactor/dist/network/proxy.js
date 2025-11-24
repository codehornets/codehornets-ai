/**
 * Proxy Agent Implementation
 *
 * HTTP/HTTPS proxy agent for tunneling connections through proxy servers.
 * Based on https-proxy-agent pattern from cli.js.
 */
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import * as net from 'net';
import * as tls from 'tls';
import { URL } from 'url';
import { ProxyConnectError, InvalidArgumentError } from './errors.js';
/**
 * Symbol for internal agent state
 */
const kAgentInternalState = Symbol('AgentBaseInternalState');
/**
 * Base agent class that supports async connect methods
 */
export class AgentBase extends HttpAgent {
    [kAgentInternalState] = {};
    constructor(options) {
        super(options);
    }
    /**
     * Determine if the endpoint is secure (HTTPS)
     */
    isSecureEndpoint(options) {
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
        if (typeof stack !== 'string')
            return false;
        return stack
            .split('\n')
            .some((line) => line.indexOf('(https.js:') !== -1 || line.indexOf('node:https:') !== -1);
    }
    /**
     * Get the name for socket pooling
     */
    getName(options) {
        const secureEndpoint = typeof options.secureEndpoint === 'boolean'
            ? options.secureEndpoint
            : this.isSecureEndpoint(options);
        if (secureEndpoint) {
            return HttpsAgent.prototype.getName.call(this, options);
        }
        return super.getName(options);
    }
    /**
     * Create socket - override to use async connect
     */
    createSocket(req, options, callback) {
        const opts = {
            ...options,
            secureEndpoint: this.isSecureEndpoint(options),
        };
        Promise.resolve()
            .then(() => this.connect(req, opts))
            .then((socket) => {
            if (socket instanceof HttpAgent) {
                // If connect returns an agent, use it
                try {
                    socket.addRequest(req, opts);
                }
                catch (err) {
                    callback(err);
                }
                return;
            }
            this[kAgentInternalState].currentSocket = socket;
            // Call parent createSocket with the resolved socket
            Object.getPrototypeOf(Object.getPrototypeOf(this)).createSocket.call(this, req, options, callback);
        })
            .catch((err) => callback(err));
    }
    /**
     * Create connection - returns the previously stored socket
     */
    createConnection() {
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
    async connect(_req, _options) {
        throw new Error('connect() must be implemented by subclass');
    }
    /**
     * Get default port based on protocol
     */
    get defaultPort() {
        return this[kAgentInternalState].defaultPort ?? (this.protocol === 'https:' ? 443 : 80);
    }
    set defaultPort(value) {
        if (this[kAgentInternalState]) {
            this[kAgentInternalState].defaultPort = value;
        }
    }
    /**
     * Get protocol
     */
    get protocol() {
        return this[kAgentInternalState].protocol ?? (this.isSecureEndpoint() ? 'https:' : 'http:');
    }
    set protocol(value) {
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
    static protocols = ['http', 'https'];
    /** Proxy URL */
    proxy;
    /** Proxy headers */
    proxyHeaders;
    /** Connection options for the proxy */
    connectOpts;
    constructor(proxy, options) {
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
            ...(options ? omitKeys(options, ['headers']) : {}),
            host,
            port,
        };
    }
    /**
     * Connect to target through proxy
     */
    async connect(req, options) {
        const { proxy } = this;
        const host = options.host;
        if (!host) {
            throw new InvalidArgumentError('No "host" provided');
        }
        // Create socket to proxy
        let socket;
        if (proxy.protocol === 'https:') {
            socket = tls.connect(addServername(this.connectOpts));
        }
        else {
            socket = net.connect(this.connectOpts);
        }
        // Build CONNECT request headers
        const headers = typeof this.proxyHeaders === 'function'
            ? this.proxyHeaders()
            : { ...this.proxyHeaders };
        // Format host for IPv6
        const hostHeader = net.isIPv6(host) ? `[${host}]` : host;
        const port = options.port;
        // Build CONNECT request
        let connectRequest = `CONNECT ${hostHeader}:${port} HTTP/1.1\r\n`;
        // Add proxy authentication if credentials present
        if (proxy.username || proxy.password) {
            const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
            headers['Proxy-Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
        }
        // Set required headers
        headers['Host'] = `${hostHeader}:${port}`;
        if (!headers['Proxy-Connection']) {
            headers['Proxy-Connection'] = this.keepAlive
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
        const eventEmitter = req;
        if (eventEmitter.emit) {
            eventEmitter.emit('proxyConnect', connectResponse);
        }
        this.emit('proxyConnect', connectResponse, req);
        // Check response status
        if (connectResponse.statusCode === 200) {
            // Resume socket
            const reqObj = req;
            if (reqObj.once) {
                reqObj.once('socket', (s) => s.resume());
            }
            // If target is HTTPS, upgrade to TLS
            const secureEndpoint = options.secureEndpoint;
            if (secureEndpoint) {
                const tlsOpts = addServername({
                    ...omitKeys(options, ['host', 'path', 'port']),
                });
                return tls.connect({
                    ...tlsOpts,
                    socket,
                });
            }
            return socket;
        }
        // Connection failed - destroy socket and return error socket
        socket.destroy();
        throw new ProxyConnectError(connectResponse.statusCode, connectResponse.statusText, connectResponse.headers, `Proxy CONNECT failed: ${connectResponse.statusCode} ${connectResponse.statusText}`);
    }
}
/**
 * Parse proxy CONNECT response
 */
async function parseProxyResponse(socket) {
    return new Promise((resolve, reject) => {
        let length = 0;
        const chunks = [];
        function cleanup() {
            socket.removeListener('end', onEnd);
            socket.removeListener('error', onError);
            socket.removeListener('readable', onReadable);
        }
        function onEnd() {
            cleanup();
            reject(new Error('Proxy connection ended before receiving CONNECT response'));
        }
        function onError(err) {
            cleanup();
            reject(err);
        }
        function onReadable() {
            const chunk = socket.read();
            if (chunk) {
                onData(chunk);
            }
            else {
                socket.once('readable', onReadable);
            }
        }
        function onData(chunk) {
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
            const headers = {};
            for (const line of headerLines) {
                if (!line)
                    continue;
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
                }
                else if (Array.isArray(existing)) {
                    existing.push(value);
                }
                else {
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
function addServername(options) {
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
function omitKeys(obj, keys) {
    const result = {};
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
export function createProxyAgent(config) {
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
export function getProxyFromEnv(url) {
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
export function shouldBypassProxy(hostname) {
    const noProxy = process.env['NO_PROXY'] || process.env['no_proxy'];
    if (!noProxy)
        return false;
    const noProxyList = noProxy.split(',').map((s) => s.trim().toLowerCase());
    const lowerHost = hostname.toLowerCase();
    for (const pattern of noProxyList) {
        if (!pattern)
            continue;
        // Exact match or wildcard
        if (pattern === '*')
            return true;
        if (lowerHost === pattern)
            return true;
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
//# sourceMappingURL=proxy.js.map