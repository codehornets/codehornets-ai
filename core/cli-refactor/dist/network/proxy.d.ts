/**
 * Proxy Agent Implementation
 *
 * HTTP/HTTPS proxy agent for tunneling connections through proxy servers.
 * Based on https-proxy-agent pattern from cli.js.
 */
import { Agent as HttpAgent, ClientRequest, RequestOptions } from 'http';
import * as net from 'net';
import { URL } from 'url';
import type { ProxyConfig, HttpsProxyAgentOptions, NetworkSocket } from './types.js';
/**
 * Symbol for internal agent state
 */
declare const kAgentInternalState: unique symbol;
/**
 * Base agent class that supports async connect methods
 */
export declare class AgentBase extends HttpAgent {
    private [kAgentInternalState];
    constructor(options?: HttpsProxyAgentOptions);
    /**
     * Determine if the endpoint is secure (HTTPS)
     */
    isSecureEndpoint(options?: {
        secureEndpoint?: boolean;
        protocol?: string;
    }): boolean;
    /**
     * Get the name for socket pooling
     */
    getName(options: RequestOptions): string;
    /**
     * Create socket - override to use async connect
     */
    createSocket(req: ClientRequest, options: RequestOptions, callback: (err: Error | null, socket?: net.Socket) => void): void;
    /**
     * Create connection - returns the previously stored socket
     */
    createConnection(): NetworkSocket;
    /**
     * Async connect method - override in subclasses
     */
    connect(_req: unknown, _options: Record<string, unknown>): Promise<NetworkSocket | HttpAgent>;
    /**
     * Get default port based on protocol
     */
    get defaultPort(): number;
    set defaultPort(value: number);
    /**
     * Get protocol
     */
    get protocol(): string;
    set protocol(value: string);
}
/**
 * HTTPS Proxy Agent
 *
 * Agent that tunnels requests through an HTTPS proxy server using
 * the HTTP CONNECT method.
 */
export declare class HttpsProxyAgent extends AgentBase {
    /** Supported protocols */
    static readonly protocols: string[];
    /** Proxy URL */
    readonly proxy: URL;
    /** Proxy headers */
    private proxyHeaders;
    /** Connection options for the proxy */
    private connectOpts;
    constructor(proxy: string | URL, options?: HttpsProxyAgentOptions);
    /**
     * Connect to target through proxy
     */
    connect(req: unknown, options: Record<string, unknown>): Promise<NetworkSocket>;
}
/**
 * Create proxy agent from configuration
 */
export declare function createProxyAgent(config: ProxyConfig): HttpsProxyAgent;
/**
 * Get proxy URL from environment variables
 */
export declare function getProxyFromEnv(url: string): string | null;
/**
 * Check if a hostname should bypass proxy based on NO_PROXY
 */
export declare function shouldBypassProxy(hostname: string): boolean;
export {};
//# sourceMappingURL=proxy.d.ts.map