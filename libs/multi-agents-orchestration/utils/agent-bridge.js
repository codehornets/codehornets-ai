/**
 * Agent Communication Bridge Utility
 *
 * Provides a simplified interface for inter-agent communication
 * using the docker-agent-bridge package.
 */

const AgentBridge = require('docker-agent-bridge');
const fs = require('fs').promises;
const path = require('path');

class AgentCommunicator {
  constructor(agentName, options = {}) {
    this.agentName = agentName;
    this.containerName = `codehornets-${agentName}`;

    // Initialize the bridge
    this.bridge = new AgentBridge({
      strategy: options.strategy || 'auto',
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      debug: options.debug || false,
      pipeDir: '/shared/pipes',
      messagesDir: '/shared/messages'
    });

    this.messageHandlers = new Map();
    this.isListening = false;

    // Pending requests for request-response pattern
    this.pendingRequests = new Map();
    this.requestTimeout = options.requestTimeout || 30000; // 30 seconds
  }

  /**
   * Initialize the communicator and start listening
   */
  async initialize() {
    console.log(`[${this.agentName}] Initializing agent communicator...`);

    // Set up message handler
    this.bridge.on('message', (message) => {
      this.handleIncomingMessage(message);
    });

    // Start listening for messages
    await this.bridge.listen(this.containerName);
    this.isListening = true;

    console.log(`[${this.agentName}] ✅ Ready to receive messages`);
  }

  /**
   * Send a message to another agent
   */
  async sendToAgent(targetAgent, payload, options = {}) {
    const targetContainer = `codehornets-${targetAgent}`;

    try {
      const result = await this.bridge.send(targetContainer, payload, {
        from: this.agentName,
        ...options
      });

      console.log(`[${this.agentName}] ✅ Message sent to ${targetAgent}`);
      return result;
    } catch (error) {
      console.error(`[${this.agentName}] ❌ Failed to send to ${targetAgent}:`, error.message);
      throw error;
    }
  }

  /**
   * Broadcast message to all other agents
   */
  async broadcast(payload, options = {}) {
    const allAgents = ['orchestrator', 'worker-marie', 'worker-anga', 'worker-fabien'];
    const targets = allAgents
      .filter(agent => agent !== this.agentName)
      .map(agent => `codehornets-${agent}`);

    try {
      const results = await this.bridge.broadcast(targets, payload, {
        from: this.agentName,
        ...options
      });

      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[${this.agentName}] 📡 Broadcast: ${successful}/${targets.length} successful`);

      return results;
    } catch (error) {
      console.error(`[${this.agentName}] ❌ Broadcast failed:`, error.message);
      throw error;
    }
  }

  /**
   * Send request and wait for response (request-response pattern)
   */
  async request(targetAgent, action, data, timeout = this.requestTimeout) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const targetContainer = `codehornets-${targetAgent}`;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${targetAgent} did not respond within ${timeout}ms`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send request
      this.bridge.send(targetContainer, {
        type: 'request',
        requestId,
        action,
        data
      }, {
        from: this.agentName
      }).catch(error => {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(requestId);
        reject(error);
      });
    });
  }

  /**
   * Send response to a request
   */
  async respond(requestMessage, result, error = null) {
    const targetAgent = requestMessage.from;
    const targetContainer = `codehornets-${targetAgent}`;

    await this.bridge.send(targetContainer, {
      type: 'response',
      requestId: requestMessage.requestId,
      result,
      error
    }, {
      from: this.agentName
    });
  }

  /**
   * Handle incoming messages
   */
  handleIncomingMessage(message) {
    const payload = typeof message.payload === 'string'
      ? this.tryParseJSON(message.payload)
      : message.payload;

    console.log(`[${this.agentName}] 📨 Message from ${message.from}:`,
                typeof payload === 'object' ? payload.type || 'message' : 'text');

    // Handle responses to requests
    if (payload.type === 'response') {
      this.handleResponse(payload);
      return;
    }

    // Handle requests
    if (payload.type === 'request') {
      this.handleRequest(message, payload);
      return;
    }

    // Handle regular messages
    const messageType = payload.type || 'default';
    const handlers = this.messageHandlers.get(messageType);

    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(payload, message);
        } catch (error) {
          console.error(`[${this.agentName}] ❌ Error in message handler:`, error);
        }
      });
    } else {
      // Default handler
      this.onMessage(payload, message);
    }
  }

  /**
   * Handle request messages
   */
  async handleRequest(message, payload) {
    const handlers = this.messageHandlers.get('request');

    if (handlers && handlers.length > 0) {
      for (const handler of handlers) {
        try {
          const result = await handler(payload, message);
          await this.respond(payload, result);
          return;
        } catch (error) {
          await this.respond(payload, null, error.message);
          return;
        }
      }
    } else {
      console.warn(`[${this.agentName}] ⚠️  No request handler registered`);
      await this.respond(payload, null, 'No request handler available');
    }
  }

  /**
   * Handle response messages
   */
  handleResponse(payload) {
    const pending = this.pendingRequests.get(payload.requestId);

    if (pending) {
      clearTimeout(pending.timeout);

      if (payload.error) {
        pending.reject(new Error(payload.error));
      } else {
        pending.resolve(payload.result);
      }

      this.pendingRequests.delete(payload.requestId);
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType).push(handler);
  }

  /**
   * Remove a message handler
   */
  off(messageType, handler) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Default message handler (can be overridden)
   */
  onMessage(payload, message) {
    console.log(`[${this.agentName}] 📬 Unhandled message:`, payload);
  }

  /**
   * Check if another agent is running
   */
  async isAgentRunning(agentName) {
    const containerName = `codehornets-${agentName}`;
    return await this.bridge.isContainerRunning(containerName);
  }

  /**
   * Get status of all agents
   */
  async getAgentStatuses() {
    const agents = ['orchestrator', 'worker-marie', 'worker-anga', 'worker-fabien'];
    const statuses = {};

    for (const agent of agents) {
      if (agent === this.agentName) {
        statuses[agent] = 'self';
        continue;
      }

      const isRunning = await this.isAgentRunning(agent);
      statuses[agent] = isRunning ? 'running' : 'stopped';
    }

    return statuses;
  }

  /**
   * Log a message to the agent's log file
   */
  async logMessage(type, content) {
    const logDir = '/home/agent/.claude/logs';
    const logFile = path.join(logDir, 'agent-communication.log');

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${JSON.stringify(content)}\n`;

    try {
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      // Silently fail if logging doesn't work
    }
  }

  /**
   * Try to parse JSON, return original string if fails
   */
  tryParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  /**
   * Clean up and stop listening
   */
  async shutdown() {
    console.log(`[${this.agentName}] Shutting down communicator...`);

    // Clear all pending requests
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Communicator shutting down'));
    }
    this.pendingRequests.clear();

    // Stop the bridge
    await this.bridge.stop();
    this.isListening = false;

    console.log(`[${this.agentName}] ✅ Communicator stopped`);
  }
}

module.exports = AgentCommunicator;
