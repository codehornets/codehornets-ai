# Implementation Patterns: Wrapper IPC for Docker TUI Communication

This guide provides production-ready code patterns for implementing bidirectional IPC with Docker TUI applications.

---

## Pattern 1: Minimal Socket Server (50 lines)

**Best for**: Quick prototyping, single TUI per wrapper

```javascript
// minimal-wrapper.js
const net = require('net');
const pty = require('node-pty');
const fs = require('fs');

const SOCKET_PATH = '/tmp/claude.sock';

// Clean up stale socket
try { fs.unlinkSync(SOCKET_PATH); } catch (e) {}

// Spawn PTY
const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  env: process.env
});

// Create socket server
const server = net.createServer((socket) => {
  // Forward PTY output to socket
  ptyProcess.onData(data => socket.write(data));

  // Forward socket input to PTY
  socket.on('data', data => ptyProcess.write(data.toString()));
  socket.on('end', () => console.log('Client disconnected'));
  socket.on('error', console.error);
});

server.listen(SOCKET_PATH, () => {
  console.log(`Wrapper listening on ${SOCKET_PATH}`);
});

process.on('SIGTERM', () => {
  server.close();
  ptyProcess.kill();
  process.exit(0);
});
```

**Limitations**:
- No command queueing
- No output capture
- No error handling
- Direct pass-through only

---

## Pattern 2: JSON-RPC Command Queue (150 lines)

**Best for**: Structured commands with responses

```javascript
// json-rpc-wrapper.js
const net = require('net');
const pty = require('node-pty');
const fs = require('fs');

const SOCKET_PATH = '/tmp/claude.sock';

class CommandQueue {
  constructor(pty) {
    this.pty = pty;
    this.queue = [];
    this.processing = false;
    this.currentCmd = null;
  }

  enqueue(command, id) {
    this.queue.push({
      id,
      command,
      output: '',
      startTime: Date.now(),
      timeout: 30000
    });
    this.process();
  }

  async process() {
    if (this.processing || !this.queue.length) return;
    this.processing = true;

    this.currentCmd = this.queue.shift();
    const promptRegex = /\$\s*$/m; // Bash prompt

    // Accumulate output
    const dataHandler = (data) => {
      this.currentCmd.output += data;
    };

    this.pty.onData(dataHandler);

    // Write command
    this.pty.write(this.currentCmd.command + '\r');

    // Wait for prompt or timeout
    const timeoutId = setTimeout(() => {
      this.pty.removeListener('data', dataHandler);
      this.finish(this.currentCmd, false, 'Timeout');
    }, this.currentCmd.timeout);

    // Check for completion
    const checkComplete = setInterval(() => {
      if (promptRegex.test(this.currentCmd.output)) {
        clearInterval(checkComplete);
        clearTimeout(timeoutId);
        this.pty.removeListener('data', dataHandler);
        this.finish(this.currentCmd, true);
      }
    }, 50);
  }

  finish(cmd, success, error) {
    this.currentCmd = null;
    this.processing = false;

    // Emit result (via callbacks in real implementation)
    const result = {
      jsonrpc: '2.0',
      id: cmd.id,
      result: {
        success,
        output: cmd.output,
        duration: Date.now() - cmd.startTime
      }
    };

    if (error) result.error = { message: error };

    this._broadcastResult(result);
    this.process();
  }

  _broadcastResult(result) {
    // Broadcast to all connected clients
    // Implementation depends on global client tracking
  }
}

// Setup
try { fs.unlinkSync(SOCKET_PATH); } catch (e) {}

const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30
});

const queue = new CommandQueue(ptyProcess);
const clients = new Set();

const server = net.createServer((socket) => {
  clients.add(socket);

  let buffer = '';
  socket.on('data', (data) => {
    buffer += data.toString();

    // Parse newline-delimited JSON
    const lines = buffer.split('\n');
    buffer = lines.pop();

    lines.forEach(line => {
      if (!line.trim()) return;

      try {
        const msg = JSON.parse(line);
        if (msg.method === 'execute') {
          queue.enqueue(msg.params.command, msg.id);
        }
      } catch (e) {
        socket.write(JSON.stringify({
          jsonrpc: '2.0',
          error: { message: 'Invalid JSON' }
        }) + '\n');
      }
    });
  });

  socket.on('end', () => clients.delete(socket));
});

queue._broadcastResult = (result) => {
  const msg = JSON.stringify(result) + '\n';
  clients.forEach(c => c.write(msg));
};

server.listen(SOCKET_PATH);
process.on('SIGTERM', () => {
  server.close();
  ptyProcess.kill();
  process.exit(0);
});
```

**Client usage**:
```javascript
const net = require('net');

async function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection('/tmp/claude.sock');
    let buffer = '';

    const id = Math.random();
    const request = {
      jsonrpc: '2.0',
      method: 'execute',
      params: { command },
      id
    };

    socket.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(line => {
        const response = JSON.parse(line);
        if (response.id === id) {
          socket.end();
          resolve(response.result || response.error);
        }
      });
    });

    socket.write(JSON.stringify(request) + '\n');
  });
}

executeCommand('ls -la')
  .then(result => console.log(result))
  .catch(console.error);
```

**Advantages**:
- Structured protocol (JSON-RPC)
- Sequential execution
- Output capture
- Multiple clients supported

**Limitations**:
- Still basic completion detection
- No backpressure handling
- No reconnection support

---

## Pattern 3: Production-Grade Wrapper (300+ lines)

**Best for**: Production deployments with reliability requirements

See the complete `PTYWrapperServer` and `CommandQueue` implementations in the main research document (Part 5.2-5.4).

Key features:
- Comprehensive error handling
- Automatic reconnection
- Health monitoring
- Backpressure handling
- Request tracking
- Client broadcast support
- Graceful shutdown

---

## Pattern 4: Docker Compose Integration

### Basic Setup

```yaml
version: '3.9'

services:
  wrapper:
    build:
      context: .
      dockerfile: Dockerfile.wrapper
    container_name: claude-wrapper
    volumes:
      # Share socket with host/other containers
      - wrapper-sockets:/tmp/sockets
    environment:
      - SOCKET_PATH=/tmp/sockets/claude.sock
      - TUI_COMMAND=claude
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "node", "-e", "require('net').createConnection('/tmp/sockets/claude.sock', () => process.exit(0))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped

  orchestrator:
    image: orchestrator:latest
    depends_on:
      wrapper:
        condition: service_healthy
    volumes:
      - wrapper-sockets:/tmp/sockets:ro
    environment:
      - WRAPPER_SOCKET=/tmp/sockets/claude.sock
    links:
      - wrapper

volumes:
  wrapper-sockets:
```

### Multi-Agent Setup

```yaml
version: '3.9'

services:
  # Central orchestrator
  orchestrator:
    image: orchestrator:latest
    volumes:
      - /tmp/shared-sockets:/tmp/sockets:ro
      - ./config:/app/config:ro
    environment:
      - WRAPPER_SOCKET=/tmp/sockets/claude.sock
    depends_on:
      - wrapper
    networks:
      - agents

  # Single wrapper serving all agents
  wrapper:
    build: ./wrapper
    container_name: claude-wrapper
    volumes:
      - /tmp/shared-sockets:/tmp/sockets
    environment:
      - SOCKET_PATH=/tmp/sockets/claude.sock
    networks:
      - agents
    healthcheck:
      test: ["CMD", "node", "health-check.js"]
      interval: 30s
      timeout: 5s
      retries: 3

  # Multiple worker agents
  agent-marie:
    image: agent:latest
    environment:
      - AGENT_NAME=marie
      - WRAPPER_SOCKET=/tmp/sockets/claude.sock
    volumes:
      - /tmp/shared-sockets:/tmp/sockets:ro
      - ./data/marie:/app/data
    networks:
      - agents

  agent-anga:
    image: agent:latest
    environment:
      - AGENT_NAME=anga
      - WRAPPER_SOCKET=/tmp/sockets/claude.sock
    volumes:
      - /tmp/shared-sockets:/tmp/sockets:ro
      - ./data/anga:/app/data
    networks:
      - agents

  agent-fabien:
    image: agent:latest
    environment:
      - AGENT_NAME=fabien
      - WRAPPER_SOCKET=/tmp/sockets/claude.sock
    volumes:
      - /tmp/shared-sockets:/tmp/sockets:ro
      - ./data/fabien:/app/data
    networks:
      - agents

networks:
  agents:
    driver: bridge
```

---

## Pattern 5: Client Connection Pool (for Orchestrator)

**Best for**: High-throughput orchestrator needing connection reuse

```javascript
// client-pool.js
const net = require('net');

class SocketClientPool {
  constructor(socketPath, poolSize = 5) {
    this.socketPath = socketPath;
    this.poolSize = poolSize;
    this.available = [];
    this.inUse = new Set();
    this.waitQueue = [];
  }

  async acquire() {
    // Return available connection
    if (this.available.length > 0) {
      const socket = this.available.pop();
      this.inUse.add(socket);
      return socket;
    }

    // Create new connection if under limit
    if (this.inUse.size < this.poolSize) {
      const socket = await this._createSocket();
      this.inUse.add(socket);
      return socket;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(socket) {
    this.inUse.delete(socket);

    // Serve waiting request
    if (this.waitQueue.length > 0) {
      const waiting = this.waitQueue.shift();
      this.inUse.add(socket);
      waiting(socket);
    } else {
      this.available.push(socket);
    }
  }

  async _createSocket() {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath);

      socket.on('connect', () => {
        console.log(`Connected to wrapper (pool size: ${this.inUse.size + 1}/${this.poolSize})`);
        resolve(socket);
      });

      socket.on('error', reject);
    });
  }

  async executeCommand(command) {
    const socket = await this.acquire();

    try {
      return await this._sendCommand(socket, command);
    } finally {
      this.release(socket);
    }
  }

  async _sendCommand(socket, command) {
    return new Promise((resolve, reject) => {
      let buffer = '';

      const id = Date.now();
      const request = {
        jsonrpc: '2.0',
        method: 'execute',
        params: { command },
        id
      };

      const dataHandler = (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        lines.forEach(line => {
          try {
            const response = JSON.parse(line);
            if (response.id === id) {
              socket.removeListener('data', dataHandler);
              resolve(response.result || response.error);
            }
          } catch (e) {
            // Ignore parse errors
          }
        });
      };

      socket.on('data', dataHandler);
      socket.write(JSON.stringify(request) + '\n');

      // Timeout
      const timeoutId = setTimeout(() => {
        socket.removeListener('data', dataHandler);
        reject(new Error('Command timeout'));
      }, 60000);
    });
  }

  async close() {
    const allSockets = [...this.available, ...this.inUse];
    allSockets.forEach(socket => socket.destroy());
    this.available = [];
    this.inUse.clear();
  }
}

module.exports = SocketClientPool;
```

**Usage**:
```javascript
const pool = new SocketClientPool('/tmp/claude.sock', 5);

(async () => {
  // Three concurrent tasks will reuse connections
  const results = await Promise.all([
    pool.executeCommand('task-master list'),
    pool.executeCommand('task-master show 1.2'),
    pool.executeCommand('npm test')
  ]);

  console.log(results);
  await pool.close();
})();
```

---

## Pattern 6: Streaming Large Output (for bigger commands)

**Best for**: Commands with very large output (build logs, file contents)

```javascript
// streaming-wrapper.js
const net = require('net');
const pty = require('node-pty');

class StreamingCommandQueue {
  constructor(ptyProcess, chunkSize = 4096) {
    this.pty = ptyProcess;
    this.chunkSize = chunkSize;
    this.queue = [];
    this.processing = false;
    this.currentCmd = null;
    this.outputBuffer = [];
  }

  enqueue(command, id, onChunk) {
    this.queue.push({
      id,
      command,
      onChunk,  // Callback for each chunk
      startTime: Date.now(),
      totalBytes: 0
    });
    this.process();
  }

  async process() {
    if (this.processing || !this.queue.length) return;
    this.processing = true;

    this.currentCmd = this.queue.shift();
    const promptRegex = /\$\s*$/m;

    // Clear buffer
    this.outputBuffer = [];

    const dataHandler = (data) => {
      this.outputBuffer.push(data);
      this.currentCmd.totalBytes += data.length;

      // Send chunk when buffer exceeds chunkSize
      if (this.outputBuffer.length > 0) {
        const chunk = Buffer.concat(this.outputBuffer);

        if (chunk.length >= this.chunkSize) {
          this.currentCmd.onChunk({
            type: 'chunk',
            data: chunk.toString(),
            bytes: chunk.length
          });

          this.outputBuffer = [];
        }
      }

      // Check for completion
      if (promptRegex.test(chunk.toString())) {
        this.finish(this.currentCmd);
      }
    };

    this.pty.onData(dataHandler);
    this.pty.write(this.currentCmd.command + '\r');

    // Auto-cleanup on timeout
    const timeoutId = setTimeout(() => {
      this.pty.removeListener('data', dataHandler);
      this.finish(this.currentCmd, 'Timeout');
    }, 60000);
  }

  finish(cmd, error) {
    // Flush remaining buffer
    if (this.outputBuffer.length > 0) {
      const chunk = Buffer.concat(this.outputBuffer);
      cmd.onChunk({
        type: 'chunk',
        data: chunk.toString(),
        bytes: chunk.length
      });
    }

    // Send completion
    cmd.onChunk({
      type: 'complete',
      totalBytes: cmd.totalBytes,
      duration: Date.now() - cmd.startTime,
      error
    });

    this.outputBuffer = [];
    this.currentCmd = null;
    this.processing = false;
    this.process();
  }
}

// Usage with HTTP streaming
const express = require('express');
const app = express();

app.post('/stream-command', (req, res) => {
  const { command } = req.body;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  queue.enqueue(command, Date.now(), (update) => {
    res.write(JSON.stringify(update) + '\n');

    if (update.type === 'complete') {
      res.end();
    }
  });
});
```

---

## Pattern 7: Error Recovery with Exponential Backoff

**Best for**: Unreliable environments or long-running wrappers

```javascript
// resilient-client.js
class ResilientClient {
  constructor(socketPath, options = {}) {
    this.socketPath = socketPath;
    this.maxRetries = options.maxRetries || 5;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.socket = null;
  }

  async executeWithRetry(command) {
    let retries = 0;
    let delay = this.initialDelay;

    while (retries < this.maxRetries) {
      try {
        return await this.execute(command);
      } catch (error) {
        retries++;

        if (retries >= this.maxRetries) {
          throw new Error(
            `Failed after ${this.maxRetries} retries: ${error.message}`
          );
        }

        console.log(
          `Attempt ${retries} failed, retrying in ${delay}ms...`
        );

        await new Promise(r => setTimeout(r, delay));

        // Exponential backoff with jitter
        delay = Math.min(
          delay * 2 + Math.random() * 1000,
          this.maxDelay
        );
      }
    }
  }

  async execute(command) {
    // Reconnect if needed
    if (!this.socket || this.socket.destroyed) {
      await this.connect();
    }

    return this._sendCommand(command);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketPath);

      socket.on('connect', () => {
        console.log('Connected to wrapper');
        this.socket = socket;
        resolve();
      });

      socket.setTimeout(5000);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });

      socket.on('error', reject);
    });
  }

  async _sendCommand(command) {
    return new Promise((resolve, reject) => {
      // Implementation similar to Pattern 2
    });
  }
}
```

---

## Pattern 8: Command Timeouts with Output Validation

**Best for**: Commands where you need to detect completion reliably

```javascript
// smart-completion-detection.js
class SmartCommandExecutor {
  constructor(pty) {
    this.pty = pty;
  }

  /**
   * Execute command with multiple completion detection strategies
   */
  async execute(command, options = {}) {
    const {
      timeout = 30000,
      promptPattern = /[$#%>]\s*$/m,  // Shell prompt
      successPattern = null,            // Optional success pattern
      failurePattern = /error|failed/i,  // Optional failure pattern
      minOutputLines = 1
    } = options;

    return new Promise((resolve, reject) => {
      const output = [];
      let currentLine = '';
      const startTime = Date.now();

      const dataHandler = (data) => {
        const text = data.toString();
        output.push(text);
        currentLine += text;

        // Check for completion
        this.checkCompletion({
          output: output.join(''),
          currentLine,
          outputLines: currentLine.split('\n').length,
          promptPattern,
          successPattern,
          failurePattern,
          minOutputLines,
          elapsedTime: Date.now() - startTime,
          timeout
        }).then(status => {
          if (status.complete) {
            this.pty.removeListener('data', dataHandler);
            clearTimeout(timeoutId);

            resolve({
              output: output.join(''),
              lines: currentLine.split('\n').filter(l => l),
              status: status.type,
              duration: Date.now() - startTime
            });
          }
        });
      };

      this.pty.onData(dataHandler);
      this.pty.write(command + '\r');

      const timeoutId = setTimeout(() => {
        this.pty.removeListener('data', dataHandler);
        reject(new Error(`Command timeout (${timeout}ms)`));
      }, timeout);
    });
  }

  async checkCompletion(state) {
    const {
      output,
      currentLine,
      outputLines,
      promptPattern,
      successPattern,
      failurePattern,
      minOutputLines,
      elapsedTime,
      timeout
    } = state;

    // Check for prompt
    if (promptPattern.test(currentLine)) {
      return {
        complete: true,
        type: 'prompt-detected'
      };
    }

    // Check for success pattern
    if (successPattern && successPattern.test(output)) {
      return {
        complete: true,
        type: 'success-pattern'
      };
    }

    // Check for failure pattern
    if (failurePattern && failurePattern.test(output)) {
      // Still wait for prompt
      if (promptPattern.test(currentLine)) {
        return {
          complete: true,
          type: 'failure-detected'
        };
      }
    }

    // Minimum output lines requirement
    if (outputLines < minOutputLines) {
      return { complete: false };
    }

    // Timeout threshold
    if (elapsedTime > timeout * 0.9) {
      return {
        complete: true,
        type: 'timeout-threshold'
      };
    }

    return { complete: false };
  }
}
```

---

## Debugging Patterns

### Pattern A: Socket Traffic Logging

```javascript
// debug-wrapper.js
function wrapSocketWithLogging(socket, name) {
  const originalWrite = socket.write.bind(socket);
  const originalOn = socket.on.bind(socket);

  socket.write = function(data, ...args) {
    console.log(`[${name}] OUT:`, data.toString().slice(0, 200));
    return originalWrite(data, ...args);
  };

  const dataHandler = originalOn('data');
  socket.on = function(event, handler) {
    if (event === 'data') {
      return originalOn(event, (data) => {
        console.log(`[${name}] IN:`, data.toString().slice(0, 200));
        handler(data);
      });
    }
    return originalOn(event, handler);
  };

  return socket;
}
```

### Pattern B: PTY Output Monitoring

```javascript
function monitorPTY(ptyProcess, name = 'PTY') {
  const originalOnData = ptyProcess.onData.bind(ptyProcess);

  ptyProcess.onData = function(handler) {
    return originalOnData((data) => {
      console.log(`[${name}] OUTPUT:`, data.toString().slice(0, 100));
      handler(data);
    });
  };

  return ptyProcess;
}
```

---

## Testing Patterns

### Mock PTY for Testing

```javascript
// mock-pty.js
class MockPTY {
  constructor(responses = {}) {
    this.responses = responses;
    this.dataListeners = [];
    this.exitListeners = [];
    this.lastCommand = null;
  }

  onData(handler) {
    this.dataListeners.push(handler);
  }

  onExit(handler) {
    this.exitListeners.push(handler);
  }

  write(data) {
    this.lastCommand = data;

    // Find matching response
    const response = this.responses[data.trim()] ||
                     this.responses['*'] ||
                     `Command executed\n$ `;

    // Simulate async response
    setImmediate(() => {
      this.dataListeners.forEach(fn => fn(response));
    });
  }

  resize(cols, rows) {
    // No-op
  }

  kill() {
    this.exitListeners.forEach(fn => fn({ exitCode: 0 }));
  }
}

// Test usage
const mockPty = new MockPTY({
  'ls -la\r': 'total 48\ndrwxr-xr-x\n$ ',
  'echo test\r': 'test\n$ '
});

// Use in tests with command queue
```

---

## Summary Table: Pattern Selection Guide

| Pattern | Use Case | Complexity | Lines of Code |
|---------|----------|-----------|-----------------|
| 1: Minimal | Prototyping, simple pass-through | Low | 50 |
| 2: JSON-RPC | Structured commands, basic queueing | Medium | 150 |
| 3: Production | Enterprise deployments | High | 300+ |
| 4: Docker Compose | Multi-container orchestration | Medium | Config |
| 5: Connection Pool | High-throughput clients | Medium | 100 |
| 6: Streaming | Large output handling | Medium | 120 |
| 7: Resilient Client | Unreliable networks | Medium | 80 |
| 8: Smart Detection | Complex completion logic | High | 200 |

---

## Next Steps

1. Choose appropriate pattern based on requirements
2. Review corresponding documentation in main IPC research document
3. Implement health monitoring (Pattern 3)
4. Add comprehensive error handling
5. Deploy with Docker Compose setup (Pattern 4)
6. Monitor and adjust timeouts/buffers based on real-world usage

