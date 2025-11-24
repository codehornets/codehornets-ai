/**
 * MCP Module Index
 *
 * Re-exports all MCP-related functionality.
 */

// Server
export {
  MCPServer,
  MCPServerState,
  MCPServerEvents,
  createMCPServer,
  createStdioTransport,
} from './server.js';

// Handlers
export {
  MCPMethod,
  InitializeParams,
  InitializeResult,
  ToolsListResult,
  ToolCallParams,
  ProgressParams,
  CancelledParams,
  registerRequestHandler,
  registerNotificationHandler,
  unregisterRequestHandler,
  unregisterNotificationHandler,
  routeRequest,
  routeNotification,
  createRequest,
  createResponse,
  createErrorResponse,
  createNotification,
  ErrorCodes,
  PROTOCOL_VERSION,
  DEFAULT_SERVER_INFO,
  handleInitialize,
  handleToolsList,
  handleToolCall,
  handlePing,
} from './handlers.js';

// Tools
export {
  registerTool,
  unregisterTool,
  getTool,
  listTools,
  hasTool,
  clearTools,
  executeTool,
  createTextContent,
  createImageContent,
  createSuccessResult,
  createErrorResult,
  BUILTIN_TOOLS,
  getBuiltinToolDefinition,
} from './tools.js';
