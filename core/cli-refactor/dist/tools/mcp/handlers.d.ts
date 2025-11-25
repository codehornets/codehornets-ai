/**
 * MCP Request Handlers Module
 *
 * Handles incoming MCP protocol requests and routes them to appropriate handlers.
 */
import type { MCPToolDefinition, MCPToolCallResult, MCPRequestHandler, MCPNotificationHandler } from '../types.js';
/**
 * MCP Protocol message types
 */
export type MCPMethod = 'initialize' | 'initialized' | 'shutdown' | 'tools/list' | 'tools/call' | 'resources/list' | 'resources/read' | 'prompts/list' | 'prompts/get' | 'ping' | 'notifications/progress' | 'notifications/cancelled';
/**
 * Initialize request params
 */
export interface InitializeParams {
    protocolVersion: string;
    capabilities: {
        roots?: {
            listChanged?: boolean;
        };
        sampling?: Record<string, unknown>;
        experimental?: Record<string, unknown>;
    };
    clientInfo: {
        name: string;
        version: string;
    };
}
/**
 * Initialize result
 */
export interface InitializeResult {
    protocolVersion: string;
    capabilities: {
        tools?: Record<string, unknown>;
        resources?: Record<string, unknown>;
        prompts?: Record<string, unknown>;
        logging?: Record<string, unknown>;
    };
    serverInfo: {
        name: string;
        version: string;
    };
    instructions?: string;
}
/**
 * Tools list result
 */
export interface ToolsListResult {
    tools: MCPToolDefinition[];
}
/**
 * Tool call params
 */
export interface ToolCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}
/**
 * Progress notification params
 */
export interface ProgressParams {
    progressToken: string | number;
    progress: number;
    total?: number;
}
/**
 * Cancelled notification params
 */
export interface CancelledParams {
    requestId: string | number;
    reason?: string;
}
/**
 * Registers a request handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export declare function registerRequestHandler<TParams, TResult>(method: MCPMethod, handler: MCPRequestHandler<TParams, TResult>): void;
/**
 * Registers a notification handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export declare function registerNotificationHandler<TParams>(method: MCPMethod, handler: MCPNotificationHandler<TParams>): void;
/**
 * Unregisters a request handler
 *
 * @param method - MCP method name
 */
export declare function unregisterRequestHandler(method: MCPMethod): void;
/**
 * Unregisters a notification handler
 *
 * @param method - MCP method name
 */
export declare function unregisterNotificationHandler(method: MCPMethod): void;
/**
 * Default server info
 */
export declare const DEFAULT_SERVER_INFO: {
    name: string;
    version: string;
};
/**
 * Supported protocol version
 */
export declare const PROTOCOL_VERSION = "2024-11-05";
/**
 * Handles initialize request
 */
export declare function handleInitialize(params: InitializeParams, serverOptions?: {
    name?: string;
    version?: string;
    capabilities?: Record<string, unknown>;
    instructions?: string;
}): Promise<InitializeResult>;
/**
 * Handles tools/list request
 */
export declare function handleToolsList(): Promise<ToolsListResult>;
/**
 * Handles tools/call request
 */
export declare function handleToolCall(params: ToolCallParams): Promise<MCPToolCallResult>;
/**
 * Handles ping request
 */
export declare function handlePing(): Promise<Record<string, unknown>>;
/**
 * Routes an incoming request to the appropriate handler
 *
 * @param method - MCP method name
 * @param params - Request parameters
 * @returns Handler result
 */
export declare function routeRequest(method: string, params: unknown): Promise<unknown>;
/**
 * Routes an incoming notification to the appropriate handler
 *
 * @param method - MCP method name
 * @param params - Notification parameters
 */
export declare function routeNotification(method: string, params: unknown): void;
/**
 * Creates a JSON-RPC 2.0 request object
 *
 * @param id - Request ID
 * @param method - Method name
 * @param params - Optional parameters
 * @returns JSON-RPC request object
 */
export declare function createRequest(id: string | number, method: string, params?: unknown): Record<string, unknown>;
/**
 * Creates a JSON-RPC 2.0 response object
 *
 * @param id - Request ID this is responding to
 * @param result - Result data
 * @returns JSON-RPC response object
 */
export declare function createResponse(id: string | number, result: unknown): Record<string, unknown>;
/**
 * Creates a JSON-RPC 2.0 error response
 *
 * @param id - Request ID this is responding to
 * @param code - Error code
 * @param message - Error message
 * @param data - Optional additional error data
 * @returns JSON-RPC error response
 */
export declare function createErrorResponse(id: string | number, code: number, message: string, data?: unknown): Record<string, unknown>;
/**
 * Creates a JSON-RPC 2.0 notification object
 *
 * @param method - Method name
 * @param params - Optional parameters
 * @returns JSON-RPC notification object
 */
export declare function createNotification(method: string, params?: unknown): Record<string, unknown>;
/**
 * Standard JSON-RPC 2.0 error codes
 */
export declare const ErrorCodes: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly SERVER_NOT_INITIALIZED: -32002;
    readonly UNKNOWN_ERROR: -32001;
};
//# sourceMappingURL=handlers.d.ts.map