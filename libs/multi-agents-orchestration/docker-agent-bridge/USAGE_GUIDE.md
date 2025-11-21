# 📚 Docker Agent Bridge - Complete Usage Guide

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Communication Strategies](#communication-strategies)
5. [Real-World Examples](#real-world-examples)
6. [Integration with CodeHornets](#integration-with-codehornets)
7. [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install docker-agent-bridge
```

## Quick Start

### Sending a Message

```javascript
const AgentBridge = require('docker-agent-bridge');

const bridge = new AgentBridge({
  strategy: 'auto',  // Automatically select best strategy
  debug: true        // Enable debug logging
});

// Send a simple message
await bridge.send('my-worker-container', 'Hello, worker!');
```

### Receiving Messages

```javascript
const AgentBridge = require('docker-agent-bridge');

const bridge = new AgentBridge();

// Set up message handler
bridge.on('message', (message) => {
  console.log(`From: ${message.from}`);
  console.log(`Payload: ${message.payload}`);
});

// Start listening
await bridge.listen('my-container-name');
```

## Core Concepts

### 1. Message Structure

Every message has this structure:

```javascript
{
  from: 'orchestrator',           // Sender
  to: 'worker-container',         // Recipient
  payload: 'message content',     // Content (string or object)
  timestamp: 1234567890,          // Unix timestamp
  id: 'msg_123_abc'              // Unique identifier
}
```

### 2. Strategies

Five strategies for different scenarios:

- **auto** - Tries all strategies until one succeeds
- **named-pipe** - Fast Unix pipes (~5ms)
- **tty** - Direct terminal injection (~10ms)
- **signal** - Unix signals (~15ms)
- **exec** - Universal fallback (~50ms)
- **shared-volume** - Most reliable (~500ms)

### 3. Options

```javascript
new AgentBridge({
  strategy: 'auto',        // Communication strategy
  retryAttempts: 3,        // Number of retries
  retryDelay: 1000,        // Delay between retries (ms)
  debug: false,            // Debug logging
  docker: dockerInstance,  // Custom Docker instance
  dockerOptions: {},       // Docker connection options
  pipeDir: '/shared/pipes',      // Named pipe directory
  messagesDir: '/shared/messages' // Shared volume directory
})
```

## Communication Strategies

### Auto Strategy (Recommended)

```javascript
const bridge = new AgentBridge({ strategy: 'auto' });

// Tries strategies in order: named-pipe → tty → signal → exec → shared-volume
await bridge.send('worker', 'message');
```

### Named Pipe Strategy (Fastest)

```javascript
const bridge = new AgentBridge({
  strategy: 'named-pipe',
  pipeDir: '/shared/pipes'
});

await bridge.send('worker', 'Fast message via pipe');
```

**Best for:** Real-time communication, high-frequency messages

### TTY Injection Strategy (Direct)

```javascript
const bridge = new AgentBridge({ strategy: 'tty' });

await bridge.send('worker', 'Urgent notification!', {
  prefix: '🚨'
});
```

**Best for:** Urgent notifications, guaranteed visibility

### Shared Volume Strategy (Most Reliable)

```javascript
const bridge = new AgentBridge({
  strategy: 'shared-volume',
  messagesDir: '/shared/messages'
});

await bridge.send('worker', 'Important task');
```

**Best for:** Critical messages, guaranteed delivery

## Real-World Examples

### Example 1: Task Orchestrator

```javascript
const AgentBridge = require('docker-agent-bridge');

class TaskOrchestrator {
  constructor() {
    this.bridge = new AgentBridge({ debug: true });
  }

  async assignTask(worker, taskDetails) {
    const task = {
      type: 'task',
      id: Date.now(),
      ...taskDetails
    };

    await this.bridge.send(`worker-${worker}`, task);
    console.log(`✅ Task ${task.id} assigned to ${worker}`);
  }

  async broadcastAnnouncement(workers, message) {
    const containers = workers.map(w => `worker-${w}`);

    const results = await this.bridge.broadcast(containers, {
      type: 'announcement',
      message
    });

    const success = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Announcement sent to ${success}/${workers.length} workers`);
  }
}

// Usage
const orchestrator = new TaskOrchestrator();

await orchestrator.assignTask('anga', {
  action: 'code_review',
  pr: 123
});

await orchestrator.broadcastAnnouncement(
  ['marie', 'anga', 'fabien'],
  'System maintenance in 10 minutes'
);
```

### Example 2: Request-Response Pattern

```javascript
const AgentBridge = require('docker-agent-bridge');

class AgentCommunicator {
  constructor(agentName) {
    this.agentName = agentName;
    this.bridge = new AgentBridge();
    this.pendingRequests = new Map();
  }

  async start() {
    // Listen for messages
    this.bridge.on('message', (msg) => {
      if (msg.type === 'request') {
        this.handleRequest(msg);
      } else if (msg.type === 'response') {
        this.handleResponse(msg);
      }
    });

    await this.bridge.listen(this.agentName);
  }

  async sendRequest(target, action, data) {
    const requestId = `req_${Date.now()}`;

    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }, 30000) // 30s timeout
      });

      // Send request
      this.bridge.send(target, {
        type: 'request',
        requestId,
        action,
        data
      });
    });
  }

  handleRequest(msg) {
    // Process request and send response
    const result = this.processAction(msg.action, msg.data);

    this.bridge.send(msg.from, {
      type: 'response',
      requestId: msg.requestId,
      result
    });
  }

  handleResponse(msg) {
    const pending = this.pendingRequests.get(msg.requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(msg.result);
      this.pendingRequests.delete(msg.requestId);
    }
  }

  processAction(action, data) {
    // Your business logic here
    return { status: 'success', data };
  }
}

// Usage
const agent = new AgentCommunicator('worker-1');
await agent.start();

// Send request and wait for response
const result = await agent.sendRequest('worker-2', 'calculate', {
  operation: 'sum',
  numbers: [1, 2, 3]
});

console.log('Result:', result);
```

### Example 3: Health Monitoring

```javascript
const AgentBridge = require('docker-agent-bridge');

class HealthMonitor {
  constructor(workers) {
    this.workers = workers;
    this.bridge = new AgentBridge();
    this.healthStatus = new Map();
  }

  async start() {
    // Check health every 30 seconds
    setInterval(() => this.checkHealth(), 30000);

    // Listen for health responses
    this.bridge.on('message', (msg) => {
      if (msg.type === 'health_response') {
        this.updateHealth(msg.from, msg.status);
      }
    });

    await this.bridge.listen('health-monitor');
  }

  async checkHealth() {
    for (const worker of this.workers) {
      const isRunning = await this.bridge.isContainerRunning(worker);

      if (!isRunning) {
        this.healthStatus.set(worker, 'stopped');
        console.log(`⚠️  ${worker} is not running`);
        continue;
      }

      // Send health check
      try {
        await this.bridge.send(worker, { type: 'health_check' });
        this.healthStatus.set(worker, 'pending');
      } catch (error) {
        this.healthStatus.set(worker, 'error');
        console.log(`❌ ${worker} health check failed`);
      }
    }

    this.reportHealth();
  }

  updateHealth(worker, status) {
    this.healthStatus.set(worker, status);
    console.log(`✅ ${worker} is ${status}`);
  }

  reportHealth() {
    const healthy = Array.from(this.healthStatus.entries())
      .filter(([_, status]) => status === 'healthy').length;

    console.log(`📊 Health: ${healthy}/${this.workers.length} workers healthy`);
  }
}

// Usage
const monitor = new HealthMonitor([
  'worker-marie',
  'worker-anga',
  'worker-fabien'
]);

await monitor.start();
```

## Integration with CodeHornets

Complete example for CodeHornets orchestration:

```javascript
const AgentBridge = require('docker-agent-bridge');

class CodeHornetsOrchestrator {
  constructor() {
    this.bridge = new AgentBridge({
      strategy: 'auto',
      debug: true
    });

    this.workers = {
      marie: 'codehornets-worker-marie',
      anga: 'codehornets-worker-anga',
      fabien: 'codehornets-worker-fabien'
    };
  }

  async initialize() {
    // Check worker status
    for (const [name, container] of Object.entries(this.workers)) {
      const isRunning = await this.bridge.isContainerRunning(container);
      console.log(`${name}: ${isRunning ? '✅ Running' : '❌ Stopped'}`);
    }

    // Set up message listener
    this.bridge.on('message', (msg) => {
      this.handleWorkerMessage(msg);
    });

    await this.bridge.listen('codehornets-orchestrator');
  }

  async delegateTask(userRequest) {
    // Analyze request and delegate to appropriate worker
    const taskType = this.analyzeRequest(userRequest);

    switch (taskType) {
      case 'dance':
        return await this.sendToMarie(userRequest);

      case 'code':
        return await this.sendToAnga(userRequest);

      case 'marketing':
        return await this.sendToFabien(userRequest);

      default:
        // Complex task - distribute
        return await this.distributeTask(userRequest);
    }
  }

  async sendToMarie(task) {
    await this.bridge.send(this.workers.marie, {
      type: 'task',
      domain: 'dance',
      details: task,
      priority: 'normal'
    });
  }

  async sendToAnga(task) {
    await this.bridge.send(this.workers.anga, {
      type: 'task',
      domain: 'code',
      details: task,
      priority: 'high'
    });
  }

  async sendToFabien(task) {
    await this.bridge.send(this.workers.fabien, {
      type: 'task',
      domain: 'marketing',
      details: task,
      priority: 'normal'
    });
  }

  async distributeTask(task) {
    // Complex task - coordinate multiple workers
    const subtasks = this.breakDownTask(task);

    await this.bridge.broadcast(
      Object.values(this.workers),
      {
        type: 'coordinated_task',
        mainTask: task,
        subtasks
      }
    );
  }

  handleWorkerMessage(msg) {
    console.log(`📨 Message from ${msg.from}:`, msg.payload);

    if (msg.type === 'result') {
      this.handleTaskResult(msg);
    } else if (msg.type === 'error') {
      this.handleTaskError(msg);
    }
  }

  analyzeRequest(request) {
    // Your analysis logic
    if (request.includes('dance') || request.includes('student')) return 'dance';
    if (request.includes('code') || request.includes('review')) return 'code';
    if (request.includes('marketing') || request.includes('campaign')) return 'marketing';
    return 'complex';
  }

  breakDownTask(task) {
    // Break complex task into subtasks
    return [];
  }

  handleTaskResult(msg) {
    console.log(`✅ Task completed by ${msg.from}`);
  }

  handleTaskError(msg) {
    console.log(`❌ Task failed in ${msg.from}:`, msg.error);
  }
}

// Usage
const orchestrator = new CodeHornetsOrchestrator();
await orchestrator.initialize();

// Delegate tasks
await orchestrator.delegateTask('Review PR #123 for authentication system');
await orchestrator.delegateTask('Evaluate dance students for Spring Recital');
await orchestrator.delegateTask('Create Q1 marketing campaign');
```

## Troubleshooting

### Messages Not Appearing

```javascript
// Enable debug logging
const bridge = new AgentBridge({ debug: true });

// Try specific strategy
const bridge = new AgentBridge({ strategy: 'tty' });

// Check container status
const isRunning = await bridge.isContainerRunning('worker');
console.log('Container running:', isRunning);
```

### Connection Issues

```javascript
// Specify Docker socket explicitly
const bridge = new AgentBridge({
  dockerOptions: {
    socketPath: '/var/run/docker.sock'
  }
});

// Or use remote Docker
const bridge = new AgentBridge({
  dockerOptions: {
    host: 'remote-docker-host',
    port: 2375
  }
});
```

### Permission Errors

Make sure containers have proper permissions:

```yaml
# docker-compose.yml
services:
  worker:
    image: your-image
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # Add capabilities if needed
    cap_add:
      - SYS_ADMIN
```

### Slow Message Delivery

```javascript
// Use faster strategy
const bridge = new AgentBridge({
  strategy: 'named-pipe'  // ~5ms vs ~500ms for shared-volume
});

// Reduce retries for faster failure
const bridge = new AgentBridge({
  retryAttempts: 1,
  retryDelay: 500
});
```

## Best Practices

1. **Always use `auto` strategy** unless you have specific requirements
2. **Enable debug mode** during development
3. **Set up proper error handling** for production
4. **Clean up listeners** when done (`await bridge.stop()`)
5. **Use broadcast** for multiple recipients instead of loops
6. **Implement health checks** to ensure containers are responsive
7. **Add timeouts** for request-response patterns

---

**Need more help?** Check the [README](./README.md) or [open an issue](https://github.com/codehornets-ai/docker-agent-bridge/issues).
