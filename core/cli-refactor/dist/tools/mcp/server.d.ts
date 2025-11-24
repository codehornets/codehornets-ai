/**
 * MCP Server Module
 *
 * Implements the Model Context Protocol (MCP) server for tool execution,
 * resource access, and prompt management.
 */
import { EventEmitter } from 'events';
import type { MCPServerInfo, MCPServerCapabilities, MCPServerOptions, MCPTransport, MCPToolDefinition } from '../types.js';
/**
 * MCP Server state
 */
export type MCPServerState = 'uninitialized' | 'initializing' | 'running' | 'shutdown';
/**
 * MCP Server events
 */
export interface MCPServerEvents {
    initialized: () => void;
    shutdown: () => void;
    error: (error: Error) => void;
    message: (message: Record<string, unknown>) => void;
    toolCalled: (name: string, args: Record<string, unknown>) => void;
}
/**
 * MCP Server implementation
 *
 * Handles the MCP protocol for communication with LLM clients.
 */
export declare class MCPServer extends EventEmitter {
    private state;
    private transport;
    private serverInfo;
    private capabilities;
    private instructions?;
    private pendingRequests;
    private requestId;
    private requestTimeout;
    /**
     * Creates a new MCP server instance
     *
     * @param info - Server info (name and version)
     * @param options - Server options
     */
    constructor(info: MCPServerInfo, options?: MCPServerOptions);
    /**
     * Gets the current server state
     */
    getState(): MCPServerState;
    /**
     * Gets the server info
     */
    getServerInfo(): MCPServerInfo;
    /**
     * Gets the server capabilities
     */
    getCapabilities(): MCPServerCapabilities;
    /**
     * Initializes the server with a transport
     *
     * @param transport - Transport to use for communication
     */
    initialize(transport: MCPTransport): Promise<void>;
    /**
     * Shuts down the server
     */
    shutdown(): Promise<void>;
    /**
     * Registers a tool with the server
     *
     * @param definition - Tool definition
     * @param handler - Tool handler function
     */
    registerTool(definition: MCPToolDefinition, handler: (args: Record<string, unknown>) => Promise<unknown>): void;
    /**
     * Unregisters a tool from the server
     *
     * @param name - Name of the tool to unregister
     */
    unregisterTool(name: string): boolean;
    /**
     * Lists all registered tools
     */
    listTools(): MCPToolDefinition[];
    /**
     * Clears all registered tools
     */
    clearTools(): void;
    /**
     * Sends a notification to the client
     *
     * @param method - Notification method
     * @param params - Notification parameters
     */
    sendNotification(method: string, params?: unknown): Promise<void>;
    /**
     * Sends a request to the client and waits for response
     *
     * @param method - Request method
     * @param params - Request parameters
     * @returns Response result
     */
    sendRequest<T>(method: string, params?: unknown): Promise<T>;
    /**
     * Handles an incoming message from the transport
     */
    private handleMessage;
    /**
     * Handles an incoming request
     */
    private handleRequest;
    /**
     * Handles an incoming notification
     */
    private handleNotification;
    /**
     * Handles a response to a pending request
     */
    private handleResponse;
    /**
     * Handles transport close
     */
    private handleClose;
    /**
     * Sends a response to a request
     */
    private sendResponse;
    /**
     * Sends an error response
     */
    private sendErrorResponse;
}
/**
 * Creates a new MCP server with default configuration
 *
 * @param name - Server name
 * @param version - Server version
 * @param options - Additional options
 * @returns New MCP server instance
 */
export declare function createMCPServer(name: string, version: string, options?: MCPServerOptions): MCPServer;
/**
 * Creates a stdio transport for the MCP server
 *
 * Note: This is a simplified implementation. Full version would handle
 * proper JSON-RPC message framing over stdin/stdout.
 *
 * @returns Stdio transport
 */
export declare function createStdioTransport(): MCPTransport;
//# sourceMappingURL=server.d.ts.map