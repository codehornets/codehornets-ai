# PTY Wrapper Communication Guide

This guide covers the node-pty wrapper approach for high-performance inter-agent communication in the CodeHornets orchestration system.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Protocol Specification](#protocol-specification)
- [Setup Instructions](#setup-instructions)
- [Implementation](#implementation)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The PTY wrapper approach creates a pseudo-terminal wrapper around Claude Code, exposing a Unix socket for programmatic input/output. This enables the lowest latency communication of all available strategies.

### Advantages

- Lowest latency (~3-8ms)
- Highest throughput
- Direct PTY control
- Structured message protocol
- Real-time bidirectional communication

### Disadvantages

- Requires node-pty package (native module)
- More complex setup
- Linux/macOS only
- Needs socket management

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Container                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────┐        │
│   │                       PTY Wrapper Process                       │        │
│   │                                                                │        │
│   │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │        │
│   │  │             │     │             │     │             │       │        │
│   │  │   Socket    │◀───▶│    PTY      │◀───▶│   Claude    │       │        │
│   │  │   Server    │     │   Manager   │     │    Code     │       │        │
│   │  │             │     │             │     │             │       │        │
│   │  └──────▲──────┘     └─────────────┘     └─────────────┘       │        │
│   │         │                                                      │        │
│   └─────────┼──────────────────────────────────────────────────────┘        │
│             │                                                               │
│             │ Unix Socket (/tmp/agent.sock)                                 │
│             │                                                               │
│   ┌─────────▼──────────────────────────────────────────────────────┐        │
│   │                     External Clients                           │        │
│   │                                                                │        │
│   │  Orchestrator          Other Agents         Monitoring         │        │
│   │                                                                │        │
│   └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐                              ┌──────────────────┐
│              │   1. Connect to socket       │                  │
│ Orchestrator ├─────────────────────────────▶│   PTY Wrapper    │
│              │                              │                  │
│              │   2. Send command            │   ┌──────────┐   │
│              ├─────────────────────────────▶│   │   PTY    │   │
│              │   {"action":"send",...}      │   │  Master  │   │
│              │                              │   └────┬─────┘   │
│              │                              │        │         │
│              │                              │   ┌────▼─────┐   │
│              │   3. Data written to PTY     │   │  Claude  │   │
│              │                              │   │   Code   │   │
│              │                              │   └────┬─────┘   │
│              │                              │        │         │
│              │   4. Response captured       │   ┌────▼─────┐   │
│              │◀─────────────────────────────│   │  Output  │   │
│              │                              │   │  Parser  │   │
└──────────────┘                              └───┴──────────┴───┘
```

## Protocol Specification

### Message Framing

Messages sent to the PTY use ASCII control characters for framing:

| Character | Code | Name | Purpose |
|-----------|------|------|---------|
| STX | 0x02 | Start of Text | Message start delimiter |
| ETX | 0x03 | End of Text | Message end delimiter |
| ACK | 0x06 | Acknowledge | Positive acknowledgment |
| NAK | 0x15 | Negative Ack | Negative acknowledgment |
| ENQ | 0x05 | Enquiry | Heartbeat/ping |

### Message Format

```
STX + JSON Payload + ETX
```

Example:
```
\x02{"type":"task","id":"123","data":"hello"}\x03
```

### Socket Protocol

Commands sent via Unix socket:

```json
// Send raw input
{
  "action": "send",
  "data": "text to send to PTY"
}

// Send structured message
{
  "action": "sendMessage",
  "message": {
    "type": "task",
    "id": "task-001",
    "data": {...}
  }
}

// Get status
{
  "action": "status"
}

// Resize PTY
{
  "action": "resize",
  "cols": 120,
  "rows": 40
}
```

### Response Format

```json
// Success
{
  "success": true,
  "messageId": "msg_123",
  "action": "send"
}

// Error
{
  "success": false,
  "error": "PTY not running"
}

// Status response
{
  "action": "status",
  "pid": 12345,
  "running": true,
  "cols": 120,
  "rows": 40
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install node-pty eventemitter3
```

### 2. Create Wrapper Script

Create `pty-wrapper.js`:

```javascript
const pty = require('node-pty');
const net = require('net');
const EventEmitter = require('events');
const fs = require('fs');

const SOCKET_PATH = process.env.WRAPPER_SOCKET || '/tmp/agent.sock';
const COMMAND = process.env.WRAPPER_COMMAND || 'claude';
const ARGS = (process.env.WRAPPER_ARGS || '').split(' ').filter(Boolean);

class PtyWrapper extends EventEmitter {
  constructor() {
    super();
    this.pty = null;
    this.server = null;
    this.clients = new Map();
  }

  start() {
    // Create PTY
    this.pty = pty.spawn(COMMAND, ARGS, {
      name: 'xterm-256color',
      cols: parseInt(process.env.COLS) || 120,
      rows: parseInt(process.env.ROWS) || 40,
      cwd: process.env.WORK_DIR || process.cwd(),
      env: process.env
    });

    this.pty.on('data', (data) => {
      this.emit('data', data);
      this.broadcastToClients({ type: 'data', data });
    });

    this.pty.on('exit', (info) => {
      console.log('PTY exited:', info);
      this.emit('exit', info);
    });

    // Start socket server
    this.startServer();

    console.log(`PTY Wrapper started (PID: ${this.pty.pid})`);
    console.log(`Socket: ${SOCKET_PATH}`);
  }

  startServer() {
    // Remove existing socket
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }

    this.server = net.createServer((socket) => {
      const clientId = Date.now().toString();
      this.clients.set(clientId, socket);

      socket.on('data', (data) => {
        this.handleCommand(clientId, data.toString());
      });

      socket.on('close', () => {
        this.clients.delete(clientId);
      });
    });

    this.server.listen(SOCKET_PATH, () => {
      fs.chmodSync(SOCKET_PATH, '0666');
    });
  }

  handleCommand(clientId, data) {
    try {
      const command = JSON.parse(data);
      this.executeCommand(clientId, command);
    } catch (error) {
      this.sendToClient(clientId, { error: error.message });
    }
  }

  executeCommand(clientId, command) {
    switch (command.action) {
      case 'send':
        this.pty.write(command.data);
        this.sendToClient(clientId, { success: true });
        break;

      case 'sendMessage':
        const framed = '\x02' + JSON.stringify(command.message) + '\x03';
        this.pty.write(framed);
        this.sendToClient(clientId, { success: true, messageId: command.message.id });
        break;

      case 'status':
        this.sendToClient(clientId, {
          action: 'status',
          pid: this.pty.pid,
          running: true,
          cols: this.pty.cols,
          rows: this.pty.rows
        });
        break;

      case 'resize':
        this.pty.resize(command.cols, command.rows);
        this.sendToClient(clientId, { success: true });
        break;

      default:
        this.sendToClient(clientId, { error: `Unknown action: ${command.action}` });
    }
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(JSON.stringify(data) + '\n');
    }
  }

  broadcastToClients(data) {
    const message = JSON.stringify(data) + '\n';
    for (const client of this.clients.values()) {
      client.write(message);
    }
  }

  stop() {
    if (this.pty) {
      this.pty.kill();
    }
    if (this.server) {
      this.server.close();
    }
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }
  }
}

// Start wrapper
const wrapper = new PtyWrapper();
wrapper.start();

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wrapper.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Interrupted...');
  wrapper.stop();
  process.exit(0);
});
```

### 3. Create Client Library

Create `pty-client.js`:

```javascript
const net = require('net');
const EventEmitter = require('events');

class PtyClient extends EventEmitter {
  constructor(socketPath) {
    super();
    this.socketPath = socketPath;
    this.socket = null;
    this.responseBuffer = '';
    this.pendingRequests = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(this.socketPath, () => {
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data.toString());
      });

      this.socket.on('error', reject);
      this.socket.on('close', () => this.emit('close'));
    });
  }

  handleData(data) {
    this.responseBuffer += data;

    // Parse newline-delimited JSON
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop(); // Keep incomplete line

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);

          if (response.type === 'data') {
            this.emit('data', response.data);
          } else {
            // Resolve pending request
            const pending = this.pendingRequests.get('current');
            if (pending) {
              this.pendingRequests.delete('current');
              pending.resolve(response);
            }
          }
        } catch (error) {
          this.emit('error', error);
        }
      }
    }
  }

  async send(action, params = {}) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set('current', { resolve, reject });
      this.socket.write(JSON.stringify({ action, ...params }) + '\n');
    });
  }

  async sendInput(data) {
    return this.send('send', { data });
  }

  async sendMessage(message) {
    return this.send('sendMessage', { message });
  }

  async getStatus() {
    return this.send('status');
  }

  async resize(cols, rows) {
    return this.send('resize', { cols, rows });
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}

module.exports = PtyClient;
```

### 4. Docker Configuration

Dockerfile:
```dockerfile
FROM node:18

# Install build tools for node-pty
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create socket directory
RUN mkdir -p /var/run/agent

ENV WRAPPER_SOCKET=/var/run/agent/agent.sock
ENV WRAPPER_COMMAND=claude

CMD ["node", "pty-wrapper.js"]
```

Docker Compose:
```yaml
version: '3.8'

services:
  worker-anga:
    build: .
    container_name: codehornets-worker-anga
    environment:
      - WRAPPER_SOCKET=/var/run/agent/agent.sock
      - WRAPPER_COMMAND=claude
      - COLS=120
      - ROWS=40
    volumes:
      - agent-sockets:/var/run/agent
      - ./shared:/shared
    stdin_open: true
    tty: true

volumes:
  agent-sockets:
```

## Implementation

### Orchestrator Integration

```javascript
const PtyClient = require('./pty-client');

class OrchestratorCommunicator {
  constructor() {
    this.clients = new Map();
  }

  async connectToAgent(agentName, socketPath) {
    const client = new PtyClient(socketPath);
    await client.connect();

    client.on('data', (data) => {
      this.handleAgentOutput(agentName, data);
    });

    this.clients.set(agentName, client);
    return client;
  }

  async sendToAgent(agentName, message) {
    const client = this.clients.get(agentName);
    if (!client) {
      throw new Error(`Not connected to ${agentName}`);
    }

    return client.sendMessage({
      id: `msg_${Date.now()}`,
      from: 'orchestrator',
      ...message
    });
  }

  async broadcastToAll(message) {
    const results = await Promise.allSettled(
      Array.from(this.clients.entries()).map(([name, client]) =>
        client.sendMessage({ ...message, to: name })
      )
    );

    return {
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }

  handleAgentOutput(agentName, data) {
    // Parse protocol messages
    const messages = this.parseProtocolMessages(data);

    for (const msg of messages) {
      this.emit('message', { from: agentName, ...msg });
    }
  }

  parseProtocolMessages(data) {
    const messages = [];
    let start = 0;

    while (true) {
      const stxIndex = data.indexOf('\x02', start);
      const etxIndex = data.indexOf('\x03', stxIndex);

      if (stxIndex === -1 || etxIndex === -1) break;

      try {
        const jsonStr = data.substring(stxIndex + 1, etxIndex);
        messages.push(JSON.parse(jsonStr));
      } catch (error) {
        // Invalid message, skip
      }

      start = etxIndex + 1;
    }

    return messages;
  }

  async disconnect() {
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
  }
}

module.exports = OrchestratorCommunicator;
```

## Best Practices

### 1. Connection Pooling

```javascript
class ConnectionPool {
  constructor(socketPath, maxConnections = 5) {
    this.socketPath = socketPath;
    this.maxConnections = maxConnections;
    this.available = [];
    this.inUse = new Set();
  }

  async acquire() {
    if (this.available.length > 0) {
      const client = this.available.pop();
      this.inUse.add(client);
      return client;
    }

    if (this.inUse.size < this.maxConnections) {
      const client = new PtyClient(this.socketPath);
      await client.connect();
      this.inUse.add(client);
      return client;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(check);
          const client = this.available.pop();
          this.inUse.add(client);
          resolve(client);
        }
      }, 10);
    });
  }

  release(client) {
    this.inUse.delete(client);
    this.available.push(client);
  }
}
```

### 2. Heartbeat Monitoring

```javascript
class HeartbeatMonitor {
  constructor(client, interval = 5000) {
    this.client = client;
    this.interval = interval;
    this.timer = null;
    this.lastResponse = Date.now();
  }

  start() {
    this.timer = setInterval(async () => {
      try {
        await this.client.getStatus();
        this.lastResponse = Date.now();
      } catch (error) {
        if (Date.now() - this.lastResponse > this.interval * 3) {
          this.emit('unhealthy');
        }
      }
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

### 3. Graceful Reconnection

```javascript
async function connectWithRetry(socketPath, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new PtyClient(socketPath);
      await client.connect();
      return client;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

## Troubleshooting

### Socket Connection Refused

**Error:** `ECONNREFUSED` or `ENOENT`

**Solutions:**
1. Check wrapper is running: `ps aux | grep pty-wrapper`
2. Verify socket path: `ls -la /var/run/agent/`
3. Check permissions: `chmod 666 /var/run/agent/agent.sock`
4. Ensure volume is mounted correctly

### PTY Not Starting

**Error:** `node-pty spawn failed`

**Solutions:**
1. Verify node-pty is installed: `npm ls node-pty`
2. Rebuild native module: `npm rebuild node-pty`
3. Check command exists: `which claude`
4. Review container logs for errors

### High Latency

**Issue:** Response times >100ms

**Solutions:**
1. Use connection pooling
2. Check for socket buffer issues
3. Reduce message size
4. Monitor system resources

### Memory Leaks

**Issue:** Memory usage grows over time

**Solutions:**
1. Properly clean up client connections
2. Clear pending request timeouts
3. Limit output buffer size
4. Implement connection rotation

### Debug Commands

```bash
# Check socket status
ss -x | grep agent.sock

# Monitor socket traffic
socat -v UNIX-CONNECT:/var/run/agent/agent.sock -

# Check PTY process
ps aux | grep node.*pty

# View wrapper logs
docker logs -f container-name
```

## Related Documentation

- [Communication Architecture](./COMMUNICATION.md)
- [tmux Guide](./TMUX-GUIDE.md) - Alternative approach
- [Migration Guide](./MIGRATION.md)
