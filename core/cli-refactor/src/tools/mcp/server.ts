/**
 * MCP Server Module
 *
 * Implements the Model Context Protocol (MCP) server for tool execution,
 * resource access, and prompt management.
 */

import { EventEmitter } from 'events';
import type {
  MCPServerInfo,
  MCPServerCapabilities,
  MCPServerOptions,
  MCPTransport,
  MCPToolDefinition,
  MCPToolCallResult,
} from '../types.js';
import {
  routeRequest,
  routeNotification,
  createResponse,
  createErrorResponse,
  createNotification,
  ErrorCodes,
  PROTOCOL_VERSION,
  handleInitialize,
  InitializeParams,
} from './handlers.js';
import { registerTool, unregisterTool, listTools, clearTools } from './tools.js';

// =============================================================================
// Types
// =============================================================================

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
 * Pending request tracking
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// =============================================================================
// MCP Server Class
// =============================================================================

/**
 * MCP Server implementation
 *
 * Handles the MCP protocol for communication with LLM clients.
 */
export class MCPServer extends EventEmitter {
  private state: MCPServerState = 'uninitialized';
  private transport: MCPTransport | null = null;
  private serverInfo: MCPServerInfo;
  private capabilities: MCPServerCapabilities;
  private instructions?: string;
  private pendingRequests: Map<string | number, PendingRequest> = new Map();
  private requestId: number = 0;
  private requestTimeout: number = 30000;

  /**
   * Creates a new MCP server instance
   *
   * @param info - Server info (name and version)
   * @param options - Server options
   */
  constructor(info: MCPServerInfo, options: MCPServerOptions = {}) {
    super();
    this.serverInfo = info;
    this.capabilities = options.capabilities || { tools: true };
    this.instructions = options.instructions;
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Gets the current server state
   */
  public getState(): MCPServerState {
    return this.state;
  }

  /**
   * Gets the server info
   */
  public getServerInfo(): MCPServerInfo {
    return { ...this.serverInfo };
  }

  /**
   * Gets the server capabilities
   */
  public getCapabilities(): MCPServerCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Initializes the server with a transport
   *
   * @param transport - Transport to use for communication
   */
  public async initialize(transport: MCPTransport): Promise<void> {
    if (this.state !== 'uninitialized') {
      throw new Error(`Cannot initialize: server is ${this.state}`);
    }

    this.state = 'initializing';
    this.transport = transport;

    // Set up transport handlers
    transport.onmessage = (message) => this.handleMessage(message);
    transport.onerror = (error) => this.emit('error', error);
    transport.onclose = () => this.handleClose();

    // Start the transport
    await transport.start();

    this.state = 'running';
    this.emit('initialized');
  }

  /**
   * Shuts down the server
   */
  public async shutdown(): Promise<void> {
    if (this.state === 'shutdown') {
      return;
    }

    this.state = 'shutdown';

    // Cancel all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Server shutdown'));
    }
    this.pendingRequests.clear();

    // Close transport
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    this.emit('shutdown');
  }

  /**
   * Registers a tool with the server
   *
   * @param definition - Tool definition
   * @param handler - Tool handler function
   */
  public registerTool(
    definition: MCPToolDefinition,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ): void {
    registerTool(definition, handler);
  }

  /**
   * Unregisters a tool from the server
   *
   * @param name - Name of the tool to unregister
   */
  public unregisterTool(name: string): boolean {
    return unregisterTool(name);
  }

  /**
   * Lists all registered tools
   */
  public listTools(): MCPToolDefinition[] {
    return listTools();
  }

  /**
   * Clears all registered tools
   */
  public clearTools(): void {
    clearTools();
  }

  /**
   * Sends a notification to the client
   *
   * @param method - Notification method
   * @param params - Notification parameters
   */
  public async sendNotification(
    method: string,
    params?: unknown
  ): Promise<void> {
    if (!this.transport || this.state !== 'running') {
      throw new Error('Server not running');
    }

    const notification = createNotification(method, params);
    await this.transport.send(notification);
  }

  /**
   * Sends a request to the client and waits for response
   *
   * @param method - Request method
   * @param params - Request parameters
   * @returns Response result
   */
  public async sendRequest<T>(method: string, params?: unknown): Promise<T> {
    if (!this.transport || this.state !== 'running') {
      throw new Error('Server not running');
    }

    const id = ++this.requestId;

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.requestTimeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.transport!.send(request).catch((error) => {
        this.pendingRequests.delete(id);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  // ===========================================================================
  // Message Handling
  // ===========================================================================

  /**
   * Handles an incoming message from the transport
   */
  private async handleMessage(message: Record<string, unknown>): Promise<void> {
    this.emit('message', message);

    try {
      // Check if it's a response to a pending request
      if ('id' in message && ('result' in message || 'error' in message)) {
        this.handleResponse(message);
        return;
      }

      // Check if it's a request (has id and method)
      if ('id' in message && 'method' in message) {
        await this.handleRequest(message);
        return;
      }

      // Check if it's a notification (has method but no id)
      if ('method' in message && !('id' in message)) {
        this.handleNotification(message);
        return;
      }

      // Invalid message
      console.warn('Received invalid MCP message:', message);
    } catch (error) {
      console.error('Error handling MCP message:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handles an incoming request
   */
  private async handleRequest(message: Record<string, unknown>): Promise<void> {
    const id = message.id as string | number;
    const method = message.method as string;
    const params = message.params;

    try {
      // Special handling for initialize
      if (method === 'initialize') {
        const result = await handleInitialize(params as InitializeParams, {
          name: this.serverInfo.name,
          version: this.serverInfo.version,
          capabilities: this.capabilities as Record<string, unknown>,
          instructions: this.instructions,
        });
        await this.sendResponse(id, result);
        return;
      }

      // Route to appropriate handler
      const result = await routeRequest(method, params);
      await this.sendResponse(id, result);

      // Emit tool called event
      if (method === 'tools/call' && params) {
        const toolParams = params as { name: string; arguments?: Record<string, unknown> };
        this.emit('toolCalled', toolParams.name, toolParams.arguments || {});
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.sendErrorResponse(id, ErrorCodes.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Handles an incoming notification
   */
  private handleNotification(message: Record<string, unknown>): void {
    const method = message.method as string;
    const params = message.params;

    routeNotification(method, params);
  }

  /**
   * Handles a response to a pending request
   */
  private handleResponse(message: Record<string, unknown>): void {
    const id = message.id as string | number;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      console.warn('Received response for unknown request:', id);
      return;
    }

    this.pendingRequests.delete(id);
    clearTimeout(pending.timeout);

    if ('error' in message) {
      const error = message.error as { code: number; message: string };
      pending.reject(new Error(`${error.code}: ${error.message}`));
    } else {
      pending.resolve(message.result);
    }
  }

  /**
   * Handles transport close
   */
  private handleClose(): void {
    if (this.state !== 'shutdown') {
      this.state = 'shutdown';
      this.emit('shutdown');
    }
  }

  /**
   * Sends a response to a request
   */
  private async sendResponse(
    id: string | number,
    result: unknown
  ): Promise<void> {
    if (!this.transport) return;

    const response = createResponse(id, result);
    await this.transport.send(response);
  }

  /**
   * Sends an error response
   */
  private async sendErrorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: unknown
  ): Promise<void> {
    if (!this.transport) return;

    const response = createErrorResponse(id, code, message, data);
    await this.transport.send(response);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new MCP server with default configuration
 *
 * @param name - Server name
 * @param version - Server version
 * @param options - Additional options
 * @returns New MCP server instance
 */
export function createMCPServer(
  name: string,
  version: string,
  options: MCPServerOptions = {}
): MCPServer {
  return new MCPServer({ name, version }, options);
}

/**
 * Creates a stdio transport for the MCP server
 *
 * Note: This is a simplified implementation. Full version would handle
 * proper JSON-RPC message framing over stdin/stdout.
 *
 * @returns Stdio transport
 */
export function createStdioTransport(): MCPTransport {
  let messageHandler: ((message: Record<string, unknown>) => void) | undefined;
  let errorHandler: ((error: Error) => void) | undefined;
  let closeHandler: (() => void) | undefined;
  let buffer = '';

  return {
    async start(): Promise<void> {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk: string) => {
        buffer += chunk;

        // Try to parse complete messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              if (messageHandler) {
                messageHandler(message);
              }
            } catch (error) {
              if (errorHandler) {
                errorHandler(
                  error instanceof Error ? error : new Error(String(error))
                );
              }
            }
          }
        }
      });

      process.stdin.on('close', () => {
        if (closeHandler) {
          closeHandler();
        }
      });

      process.stdin.on('error', (error) => {
        if (errorHandler) {
          errorHandler(error);
        }
      });
    },

    async close(): Promise<void> {
      process.stdin.removeAllListeners();
    },

    async send(message: Record<string, unknown>): Promise<void> {
      const json = JSON.stringify(message);
      process.stdout.write(json + '\n');
    },

    set onmessage(handler: ((message: Record<string, unknown>) => void) | undefined) {
      messageHandler = handler;
    },

    set onerror(handler: ((error: Error) => void) | undefined) {
      errorHandler = handler;
    },

    set onclose(handler: (() => void) | undefined) {
      closeHandler = handler;
    },
  };
}
