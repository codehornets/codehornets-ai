/**
 * MCP Request Handlers Module
 *
 * Handles incoming MCP protocol requests and routes them to appropriate handlers.
 */
import { listTools, executeTool, hasTool } from './tools.js';
const requestHandlers = new Map();
const notificationHandlers = new Map();
// =============================================================================
// Handler Registration
// =============================================================================
/**
 * Registers a request handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export function registerRequestHandler(method, handler) {
    requestHandlers.set(method, handler);
}
/**
 * Registers a notification handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export function registerNotificationHandler(method, handler) {
    notificationHandlers.set(method, handler);
}
/**
 * Unregisters a request handler
 *
 * @param method - MCP method name
 */
export function unregisterRequestHandler(method) {
    requestHandlers.delete(method);
}
/**
 * Unregisters a notification handler
 *
 * @param method - MCP method name
 */
export function unregisterNotificationHandler(method) {
    notificationHandlers.delete(method);
}
// =============================================================================
// Built-in Handlers
// =============================================================================
/**
 * Default server info
 */
export const DEFAULT_SERVER_INFO = {
    name: 'claude-code-mcp',
    version: '1.0.0',
};
/**
 * Supported protocol version
 */
export const PROTOCOL_VERSION = '2024-11-05';
/**
 * Handles initialize request
 */
export async function handleInitialize(params, serverOptions = {}) {
    return {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
            tools: {},
            ...(serverOptions.capabilities || {}),
        },
        serverInfo: {
            name: serverOptions.name || DEFAULT_SERVER_INFO.name,
            version: serverOptions.version || DEFAULT_SERVER_INFO.version,
        },
        instructions: serverOptions.instructions,
    };
}
/**
 * Handles tools/list request
 */
export async function handleToolsList() {
    return { tools: listTools() };
}
/**
 * Handles tools/call request
 */
export async function handleToolCall(params) {
    const { name, arguments: args = {} } = params;
    if (!hasTool(name)) {
        return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
        };
    }
    return executeTool(name, args);
}
/**
 * Handles ping request
 */
export async function handlePing() {
    return {};
}
// =============================================================================
// Request Routing
// =============================================================================
/**
 * Routes an incoming request to the appropriate handler
 *
 * @param method - MCP method name
 * @param params - Request parameters
 * @returns Handler result
 */
export async function routeRequest(method, params) {
    // Check for registered handler first
    const handler = requestHandlers.get(method);
    if (handler) {
        return handler(params);
    }
    // Fall back to built-in handlers
    switch (method) {
        case 'initialize':
            return handleInitialize(params);
        case 'initialized':
            return {}; // No response needed
        case 'shutdown':
            return {}; // No response needed
        case 'tools/list':
            return handleToolsList();
        case 'tools/call':
            return handleToolCall(params);
        case 'ping':
            return handlePing();
        default:
            throw new Error(`Unknown method: ${method}`);
    }
}
/**
 * Routes an incoming notification to the appropriate handler
 *
 * @param method - MCP method name
 * @param params - Notification parameters
 */
export function routeNotification(method, params) {
    const handler = notificationHandlers.get(method);
    if (handler) {
        handler(params);
    }
}
// =============================================================================
// Request/Response Helpers
// =============================================================================
/**
 * Creates a JSON-RPC 2.0 request object
 *
 * @param id - Request ID
 * @param method - Method name
 * @param params - Optional parameters
 * @returns JSON-RPC request object
 */
export function createRequest(id, method, params) {
    const request = {
        jsonrpc: '2.0',
        id,
        method,
    };
    if (params !== undefined) {
        request.params = params;
    }
    return request;
}
/**
 * Creates a JSON-RPC 2.0 response object
 *
 * @param id - Request ID this is responding to
 * @param result - Result data
 * @returns JSON-RPC response object
 */
export function createResponse(id, result) {
    return {
        jsonrpc: '2.0',
        id,
        result,
    };
}
/**
 * Creates a JSON-RPC 2.0 error response
 *
 * @param id - Request ID this is responding to
 * @param code - Error code
 * @param message - Error message
 * @param data - Optional additional error data
 * @returns JSON-RPC error response
 */
export function createErrorResponse(id, code, message, data) {
    const response = {
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message,
        },
    };
    if (data !== undefined) {
        response.error.data = data;
    }
    return response;
}
/**
 * Creates a JSON-RPC 2.0 notification object
 *
 * @param method - Method name
 * @param params - Optional parameters
 * @returns JSON-RPC notification object
 */
export function createNotification(method, params) {
    const notification = {
        jsonrpc: '2.0',
        method,
    };
    if (params !== undefined) {
        notification.params = params;
    }
    return notification;
}
// =============================================================================
// Error Codes
// =============================================================================
/**
 * Standard JSON-RPC 2.0 error codes
 */
export const ErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    // Server error codes (-32000 to -32099)
    SERVER_NOT_INITIALIZED: -32002,
    UNKNOWN_ERROR: -32001,
};
//# sourceMappingURL=handlers.js.map