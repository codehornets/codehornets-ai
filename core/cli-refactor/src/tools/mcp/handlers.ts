/**
 * MCP Request Handlers Module
 *
 * Handles incoming MCP protocol requests and routes them to appropriate handlers.
 */

import type {
  MCPToolDefinition,
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPRequestHandler,
  MCPNotificationHandler,
} from '../types.js';
import { listTools, executeTool, hasTool } from './tools.js';

// =============================================================================
// Types
// =============================================================================

/**
 * MCP Protocol message types
 */
export type MCPMethod =
  | 'initialize'
  | 'initialized'
  | 'shutdown'
  | 'tools/list'
  | 'tools/call'
  | 'resources/list'
  | 'resources/read'
  | 'prompts/list'
  | 'prompts/get'
  | 'ping'
  | 'notifications/progress'
  | 'notifications/cancelled';

/**
 * Initialize request params
 */
export interface InitializeParams {
  protocolVersion: string;
  capabilities: {
    roots?: { listChanged?: boolean };
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

// =============================================================================
// Handler Registry
// =============================================================================

type RequestHandlerMap = Map<string, MCPRequestHandler<unknown, unknown>>;
type NotificationHandlerMap = Map<string, MCPNotificationHandler<unknown>>;

const requestHandlers: RequestHandlerMap = new Map();
const notificationHandlers: NotificationHandlerMap = new Map();

// =============================================================================
// Handler Registration
// =============================================================================

/**
 * Registers a request handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export function registerRequestHandler<TParams, TResult>(
  method: MCPMethod,
  handler: MCPRequestHandler<TParams, TResult>
): void {
  requestHandlers.set(method, handler as MCPRequestHandler<unknown, unknown>);
}

/**
 * Registers a notification handler for a specific method
 *
 * @param method - MCP method name
 * @param handler - Handler function
 */
export function registerNotificationHandler<TParams>(
  method: MCPMethod,
  handler: MCPNotificationHandler<TParams>
): void {
  notificationHandlers.set(method, handler as MCPNotificationHandler<unknown>);
}

/**
 * Unregisters a request handler
 *
 * @param method - MCP method name
 */
export function unregisterRequestHandler(method: MCPMethod): void {
  requestHandlers.delete(method);
}

/**
 * Unregisters a notification handler
 *
 * @param method - MCP method name
 */
export function unregisterNotificationHandler(method: MCPMethod): void {
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
export async function handleInitialize(
  params: InitializeParams,
  serverOptions: {
    name?: string;
    version?: string;
    capabilities?: Record<string, unknown>;
    instructions?: string;
  } = {}
): Promise<InitializeResult> {
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
export async function handleToolsList(): Promise<ToolsListResult> {
  return { tools: listTools() };
}

/**
 * Handles tools/call request
 */
export async function handleToolCall(
  params: ToolCallParams
): Promise<MCPToolCallResult> {
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
export async function handlePing(): Promise<Record<string, unknown>> {
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
export async function routeRequest(
  method: string,
  params: unknown
): Promise<unknown> {
  // Check for registered handler first
  const handler = requestHandlers.get(method);
  if (handler) {
    return handler(params);
  }

  // Fall back to built-in handlers
  switch (method) {
    case 'initialize':
      return handleInitialize(params as InitializeParams);

    case 'initialized':
      return {}; // No response needed

    case 'shutdown':
      return {}; // No response needed

    case 'tools/list':
      return handleToolsList();

    case 'tools/call':
      return handleToolCall(params as ToolCallParams);

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
export function routeNotification(method: string, params: unknown): void {
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
export function createRequest(
  id: string | number,
  method: string,
  params?: unknown
): Record<string, unknown> {
  const request: Record<string, unknown> = {
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
export function createResponse(
  id: string | number,
  result: unknown
): Record<string, unknown> {
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
export function createErrorResponse(
  id: string | number,
  code: number,
  message: string,
  data?: unknown
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  };

  if (data !== undefined) {
    (response.error as Record<string, unknown>).data = data;
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
export function createNotification(
  method: string,
  params?: unknown
): Record<string, unknown> {
  const notification: Record<string, unknown> = {
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
} as const;
