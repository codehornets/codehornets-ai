/**
 * MCP Server Module
 *
 * Implements the Model Context Protocol (MCP) server for tool execution,
 * resource access, and prompt management.
 */
import { EventEmitter } from 'events';
import { routeRequest, routeNotification, createResponse, createErrorResponse, createNotification, ErrorCodes, handleInitialize, } from './handlers.js';
import { registerTool, unregisterTool, listTools, clearTools } from './tools.js';
// =============================================================================
// MCP Server Class
// =============================================================================
/**
 * MCP Server implementation
 *
 * Handles the MCP protocol for communication with LLM clients.
 */
export class MCPServer extends EventEmitter {
    state = 'uninitialized';
    transport = null;
    serverInfo;
    capabilities;
    instructions;
    pendingRequests = new Map();
    requestId = 0;
    requestTimeout = 30000;
    /**
     * Creates a new MCP server instance
     *
     * @param info - Server info (name and version)
     * @param options - Server options
     */
    constructor(info, options = {}) {
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
    getState() {
        return this.state;
    }
    /**
     * Gets the server info
     */
    getServerInfo() {
        return { ...this.serverInfo };
    }
    /**
     * Gets the server capabilities
     */
    getCapabilities() {
        return { ...this.capabilities };
    }
    /**
     * Initializes the server with a transport
     *
     * @param transport - Transport to use for communication
     */
    async initialize(transport) {
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
    async shutdown() {
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
    registerTool(definition, handler) {
        registerTool(definition, handler);
    }
    /**
     * Unregisters a tool from the server
     *
     * @param name - Name of the tool to unregister
     */
    unregisterTool(name) {
        return unregisterTool(name);
    }
    /**
     * Lists all registered tools
     */
    listTools() {
        return listTools();
    }
    /**
     * Clears all registered tools
     */
    clearTools() {
        clearTools();
    }
    /**
     * Sends a notification to the client
     *
     * @param method - Notification method
     * @param params - Notification parameters
     */
    async sendNotification(method, params) {
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
    async sendRequest(method, params) {
        if (!this.transport || this.state !== 'running') {
            throw new Error('Server not running');
        }
        const id = ++this.requestId;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, this.requestTimeout);
            this.pendingRequests.set(id, {
                resolve: resolve,
                reject,
                timeout,
            });
            const request = {
                jsonrpc: '2.0',
                id,
                method,
                params,
            };
            this.transport.send(request).catch((error) => {
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
    async handleMessage(message) {
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
        }
        catch (error) {
            console.error('Error handling MCP message:', error);
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Handles an incoming request
     */
    async handleRequest(message) {
        const id = message.id;
        const method = message.method;
        const params = message.params;
        try {
            // Special handling for initialize
            if (method === 'initialize') {
                const result = await handleInitialize(params, {
                    name: this.serverInfo.name,
                    version: this.serverInfo.version,
                    capabilities: this.capabilities,
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
                const toolParams = params;
                this.emit('toolCalled', toolParams.name, toolParams.arguments || {});
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.sendErrorResponse(id, ErrorCodes.INTERNAL_ERROR, errorMessage);
        }
    }
    /**
     * Handles an incoming notification
     */
    handleNotification(message) {
        const method = message.method;
        const params = message.params;
        routeNotification(method, params);
    }
    /**
     * Handles a response to a pending request
     */
    handleResponse(message) {
        const id = message.id;
        const pending = this.pendingRequests.get(id);
        if (!pending) {
            console.warn('Received response for unknown request:', id);
            return;
        }
        this.pendingRequests.delete(id);
        clearTimeout(pending.timeout);
        if ('error' in message) {
            const error = message.error;
            pending.reject(new Error(`${error.code}: ${error.message}`));
        }
        else {
            pending.resolve(message.result);
        }
    }
    /**
     * Handles transport close
     */
    handleClose() {
        if (this.state !== 'shutdown') {
            this.state = 'shutdown';
            this.emit('shutdown');
        }
    }
    /**
     * Sends a response to a request
     */
    async sendResponse(id, result) {
        if (!this.transport)
            return;
        const response = createResponse(id, result);
        await this.transport.send(response);
    }
    /**
     * Sends an error response
     */
    async sendErrorResponse(id, code, message, data) {
        if (!this.transport)
            return;
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
export function createMCPServer(name, version, options = {}) {
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
export function createStdioTransport() {
    let messageHandler;
    let errorHandler;
    let closeHandler;
    let buffer = '';
    return {
        async start() {
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (chunk) => {
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
                        }
                        catch (error) {
                            if (errorHandler) {
                                errorHandler(error instanceof Error ? error : new Error(String(error)));
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
        async close() {
            process.stdin.removeAllListeners();
        },
        async send(message) {
            const json = JSON.stringify(message);
            process.stdout.write(json + '\n');
        },
        set onmessage(handler) {
            messageHandler = handler;
        },
        set onerror(handler) {
            errorHandler = handler;
        },
        set onclose(handler) {
            closeHandler = handler;
        },
    };
}
//# sourceMappingURL=server.js.map