# IPC Research Quick Reference Guide

## One-Page Cheat Sheet for Docker TUI Communication

### Problem Statement

Need bidirectional communication with Claude Code (Node.js TUI) running in Docker container. External orchestrator must:
- Send commands to the TUI
- Capture output/results
- Handle multiple agents
- Maintain reliability over long sessions

---

## Technology Stack Comparison

### IPC Mechanisms

```
Unix Domain Sockets        Named Pipes (FIFO)
✓ Bidirectional           ✓ Simpler setup
✓ Multi-client             ✗ Unidirectional (Unix)
✓ Better performance       ✗ Single reader/writer
✓ Docker-standard          ✓ Windows compatible
```

**RECOMMENDATION: Use Unix Domain Sockets** (`/tmp/socket.sock`)

---

### PTY Libraries

```
node-pty (Microsoft)       child_pty
✓ Windows support          ✓ Minimal
✓ Active maintenance       ✗ Less feature-rich
✓ Flow control
✓ Resize handling
```

**RECOMMENDATION: Use node-pty** for production

---

## Architecture Diagram

```
Orchestrator                 Wrapper (Unix Socket)         Docker Container
    │                              │                            │
    ├─ Create socket conn ────────→├─ Spawn PTY ───────────────→├─ Claude TUI
    │ /tmp/claude.sock            │ node-pty                   │ (bash/shell)
    │                             │                            │
    ├─ Send JSON command ────────→├─ Queue command ───────────→├─ stdin
    │ {method:'execute'}          │ Sequential exec           │
    │                             │                            │
    ├─ Wait for result ◄──────────┤ Capture output ◄──────────┤─ stdout
    │                             │ Line buffering             │
    │                             │ Pattern matching           │
    ├─ Poll status ─────────────→├─ Queue mgmt               │
    │ {method:'query'}            │                            │
    │                             │                            │
```

---

## Key Concepts at a Glance

### PTY (Pseudoterminal)

- Virtual device pair: Master (wrapper) ↔ Slave (TUI process)
- Wrapper writes to master → TUI reads from slave stdin
- TUI writes to slave → Wrapper reads from master stdout
- Handles terminal control sequences, resizing, etc.

### Unix Domain Socket

- File-based socket (like `/var/run/docker.sock`)
- No network overhead (IPC only on same machine)
- File permissions control access
- Multiple clients can connect to single server

### Command Queueing Pattern

```
External Request (Async)
    │
    ├─→ Queue.enqueue(cmd) → Returns requestId
    │
    ├─→ Queue.process() executes sequentially
    │
    ├─→ Wait for prompt or timeout
    │
    └─→ Emit result with requestId

Client can:
- query(requestId) → Get status
- wait(requestId) → Block until complete
```

---

## Quick Start Code

### Minimal Wrapper (Copy-Paste Ready)

```javascript
const net = require('net');
const pty = require('node-pty');
const fs = require('fs');

const SOCKET = '/tmp/claude.sock';

// Cleanup
try { fs.unlinkSync(SOCKET); } catch (e) {}

// Spawn TUI
const proc = pty.spawn('claude', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30
});

// Create socket server
const server = net.createServer(socket => {
  proc.onData(d => socket.write(d));
  socket.on('data', d => proc.write(d.toString()));
  socket.on('end', () => console.log('Client left'));
});

server.listen(SOCKET);
console.log(`Wrapper ready at ${SOCKET}`);

process.on('SIGTERM', () => {
  server.close();
  proc.kill();
  process.exit(0);
});
```

### Minimal Client

```javascript
const net = require('net');

async function execute(cmd) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection('/tmp/claude.sock');
    let output = '';

    sock.on('data', d => {
      output += d.toString();
      // Check for completion ($ prompt)
      if (/\$\s*$/.test(output)) {
        sock.end();
        resolve(output);
      }
    });

    sock.on('error', reject);
    sock.write(cmd + '\r');
  });
}

execute('ls -la').then(console.log);
```

---

## Common Patterns

### Pattern 1: Command Queuing (for sequential execution)

```javascript
class Queue {
  constructor(pty) {
    this.pty = pty;
    this.queue = [];
    this.running = false;
  }

  add(cmd) {
    this.queue.push(cmd);
    this.run();
  }

  async run() {
    if (this.running || !this.queue.length) return;
    this.running = true;

    const cmd = this.queue.shift();
    this.pty.write(cmd + '\r');

    // Wait for prompt or 5 seconds
    await new Promise(r => setTimeout(r, 5000));

    this.running = false;
    this.run();
  }
}
```

### Pattern 2: Output Capture with Timeout

```javascript
async function executeWithTimeout(pty, cmd, timeout = 30000) {
  return new Promise((resolve, reject) => {
    let output = '';

    const handler = (d) => { output += d; };
    pty.onData(handler);

    pty.write(cmd + '\r');

    const id = setTimeout(() => {
      pty.onData(null); // Remove listener
      reject(new Error('Timeout'));
    }, timeout);

    // Poll for completion (prompt detected)
    const interval = setInterval(() => {
      if (/\$\s*$/.test(output)) {
        clearTimeout(id);
        clearInterval(interval);
        pty.onData(null);
        resolve(output);
      }
    }, 100);
  });
}
```

### Pattern 3: Connection Pooling (for multiple concurrent clients)

```javascript
class Pool {
  constructor(socketPath, size = 5) {
    this.path = socketPath;
    this.size = size;
    this.available = [];
    this.inUse = new Set();
  }

  async get() {
    if (this.available.length) {
      const s = this.available.pop();
      this.inUse.add(s);
      return s;
    }

    if (this.inUse.size < this.size) {
      const s = net.createConnection(this.path);
      this.inUse.add(s);
      return new Promise(r => s.once('connect', () => r(s)));
    }

    // Wait for available
    return new Promise(r => {
      const wait = () => {
        if (this.available.length) {
          const s = this.available.pop();
          this.inUse.add(s);
          r(s);
        } else {
          setImmediate(wait);
        }
      };
      wait();
    });
  }

  release(socket) {
    this.inUse.delete(socket);
    this.available.push(socket);
  }
}
```

---

## Timeout Guidelines

| Operation | Timeout | Notes |
|-----------|---------|-------|
| Short command (echo, ls) | 5 seconds | Fast operations |
| Build/test command | 60 seconds | Compilation/execution |
| Long task (analysis) | 300 seconds (5 min) | Patience required |
| Overall request | 600 seconds (10 min) | Hard limit |
| Socket connect | 5 seconds | Network wait |
| Health check | 3 seconds | Quick ping |

---

## Docker Compose Minimal Setup

```yaml
services:
  wrapper:
    image: node:18
    volumes:
      - /tmp/sockets:/tmp/sockets
      - ./wrapper.js:/app/wrapper.js
    working_dir: /app
    command: node wrapper.js
    environment:
      SOCKET_PATH: /tmp/sockets/claude.sock
    restart: unless-stopped

  orchestrator:
    image: my-orchestrator
    volumes:
      - /tmp/sockets:/tmp/sockets:ro
    environment:
      WRAPPER_SOCKET: /tmp/sockets/claude.sock
    depends_on:
      - wrapper
```

---

## Debugging Checklist

- [ ] Socket file exists: `ls -la /tmp/claude.sock`
- [ ] Socket is accessible: `nc -U /tmp/claude.sock`
- [ ] PTY process running: `ps aux | grep claude`
- [ ] No zombie processes: `ps aux | grep defunct`
- [ ] Socket permissions correct: `chmod 666 /tmp/claude.sock`
- [ ] No stale socket files: `rm /tmp/claude.sock && restart`
- [ ] Docker volume mounted: `docker inspect <container> | grep Mounts`
- [ ] PTY output visible: Add logging to `pty.onData()`

---

## Performance Optimization Tips

1. **Increase PTY buffer**: `handleFlowControl: true` in spawn options
2. **Batch operations**: Queue multiple commands, process once
3. **Connection pooling**: Reuse sockets (5-10 connections)
4. **Output chunking**: Stream large outputs in 4KB chunks
5. **Reduce polling**: Detect completion via patterns, not timers
6. **Compression**: For very large outputs, compress over socket

---

## Common Issues and Fixes

### Issue: "ENOENT: no such file or directory, open '/tmp/claude.sock'"

**Fix**: Socket doesn't exist. Wrapper isn't running.
```bash
# Check wrapper
docker ps | grep wrapper

# View logs
docker logs wrapper

# Restart if needed
docker restart wrapper
```

### Issue: "ECONNREFUSED: connect ECONNREFUSED"

**Fix**: Connection refused. Wrong path or wrapper crashed.
```bash
# Verify socket path matches
env | grep SOCKET

# Test connectivity
timeout 3 bash -c 'cat < /dev/null > /dev/unix/socket/path' || echo "Failed"
```

### Issue: Commands hang or timeout frequently

**Fix**: PTY buffer filling up, completion detection wrong.
```javascript
// Add logging
pty.onData(d => {
  console.log('PTY Output:', d.toString().slice(0, 100));
});

// Adjust completion pattern
const pattern = /[$#%>]\s*$/m;  // More permissive
```

### Issue: Multiple commands interfere with each other

**Fix**: No queueing or race condition.
```javascript
// Ensure sequential execution
class Queue {
  async run() {
    if (this.running) return;
    this.running = true;
    // ... execute ...
    this.running = false;
  }
}
```

---

## Environment Variables Quick Reference

```bash
# Wrapper configuration
SOCKET_PATH=/tmp/claude.sock          # Socket location
TUI_COMMAND=claude                    # Which TUI to run
LOG_LEVEL=info                        # Logging verbosity
NODE_ENV=production                   # Node environment

# Orchestrator configuration
WRAPPER_SOCKET=/tmp/sockets/claude.sock  # Socket to connect to
WRAPPER_TIMEOUT=60000                 # Command timeout (ms)
WRAPPER_RETRIES=5                     # Retry attempts
```

---

## Files to Create

```
project/
├── lib/
│   ├── wrapper-server.js              # Main wrapper implementation
│   ├── client.js                      # Client for external use
│   ├── command-queue.js               # Command queueing logic
│   └── health-monitor.js              # Health checks
├── docker/
│   └── Dockerfile.wrapper             # Wrapper container
├── docker-compose.yml                 # Multi-service setup
├── wrapper.js                         # Entry point
├── client-example.js                  # Client usage example
└── docs/
    ├── ipc-research-tui-docker-communication.md
    ├── implementation-patterns-wrapper-ipc.md
    └── ipc-quick-reference.md         # This file
```

---

## Decision Tree: Choosing Your Approach

```
Does your TUI need to handle:

1. Single request at a time?
   └─ YES → Use simple Pattern 2 (JSON-RPC)
   └─ NO  → Use Pattern 3 (Production Queue)

2. Very large outputs (>10MB)?
   └─ YES → Use Pattern 6 (Streaming)
   └─ NO  → Use standard buffering

3. Multiple concurrent orchestrators?
   └─ YES → Use Pattern 5 (Connection Pool)
   └─ NO  → Simple server is fine

4. Long-running commands (>5 min)?
   └─ YES → Use Pattern 7 (Resilient Client)
   └─ NO  → Basic retry with exponential backoff

5. Need to run in unreliable network?
   └─ YES → Use Pattern 7 (Resilient Client)
   └─ NO  → Direct connection acceptable
```

---

## References (Condensed)

- **node-pty**: https://github.com/microsoft/node-pty
- **dockerode**: https://github.com/apocas/dockerode
- **Linux PTY Deep Dive**: https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/
- **IPC Performance**: https://www.baeldung.com/linux/ipc-performance-comparison
- **Node.js child_process**: https://nodejs.org/api/child_process.html

---

## TL;DR - Copy This Now

**Ultra-minimal working example** (works but missing error handling):

```javascript
// server.js
const net = require('net');
const pty = require('node-pty');
const fs = require('fs');

const SOCK = '/tmp/pty.sock';
try { fs.unlinkSync(SOCK); } catch (e) {}

const p = pty.spawn('bash', [], { name: 'xterm-color', cols: 80, rows: 30 });
const s = net.createServer(c => {
  p.onData(d => c.write(d));
  c.on('data', d => p.write(d));
});

s.listen(SOCK);
process.on('SIGTERM', () => { s.close(); p.kill(); });
```

```javascript
// client.js
const net = require('net');

function exec(cmd) {
  return new Promise((res, rej) => {
    const s = net.createConnection('/tmp/pty.sock');
    let out = '';
    s.on('data', d => {
      out += d;
      if (/\$\s*$/.test(out)) { s.end(); res(out); }
    });
    s.on('error', rej);
    s.write(cmd + '\r');
  });
}

exec('echo hello').then(console.log);
```

**Install dependencies**:
```bash
npm install node-pty
```

**Run it**:
```bash
node server.js &
node client.js
```

Done! Now read the full documentation for production hardening.

