# PTY Wrapper for Claude Code TUI

A Node.js-based wrapper using `node-pty` for bidirectional communication with Claude Code TUI in Docker containers.

## Overview

The PTY wrapper spawns Claude CLI using node-pty and exposes a Unix socket interface for external communication. This enables:

- Programmatic command sending to Claude agents
- Real-time output streaming
- Multiple client connections
- Command queuing for sequential execution
- Automatic completion detection

## Architecture

```
+-------------------+       +------------------+       +-------------------+
|   Orchestrator    | ----> | Unix Socket      | ----> | PTY Wrapper       |
|   (pty-client.js) |       | /shared/sockets/ |       | (wrapper.js)      |
+-------------------+       +------------------+       +-------------------+
                                                              |
                                                              v
                                                       +-------------+
                                                       | Claude CLI  |
                                                       | (node-pty)  |
                                                       +-------------+
```

## Components

### wrapper.js
Main PTY wrapper that:
- Spawns Claude CLI using node-pty
- Listens on Unix socket at `/shared/sockets/{agent}.sock`
- Accepts JSON commands from connected clients
- Streams output back to all subscribed clients
- Queues commands for sequential execution

### client.js
Client library for connecting to PTY wrapper:
- Connects to worker sockets
- Sends commands and receives responses
- Handles reconnection on failure
- Provides promise-based API

### completion-detector.js
Detects when Claude finishes responding by:
- Analyzing terminal output patterns (prompts, etc.)
- Monitoring output silence periods
- Supporting custom completion patterns

### pty-client.js (orchestrator/)
Specialized orchestrator client that:
- Manages connections to all worker agents
- Provides connection pooling
- Automatic reconnection
- Health checks

## Protocol

### Request Types

```json
// Send command (queued)
{"id": "uuid", "type": "command", "input": "hello", "timeout": 30000}

// Send raw input (immediate, not queued)
{"type": "input", "data": "some text"}

// Resize terminal
{"type": "resize", "cols": 120, "rows": 40}

// Get status
{"type": "status"}

// Ping
{"type": "ping"}

// Subscribe/unsubscribe to output stream
{"type": "subscribe"}
{"type": "unsubscribe"}
```

### Response Types

```json
// Connected (sent on connection)
{"type": "connected", "clientId": "uuid", "agent": "anga", "ready": true}

// Command queued
{"type": "queued", "id": "uuid", "position": 1}

// Output stream
{"type": "output", "id": "uuid", "data": "...", "timestamp": "..."}

// Command complete
{"type": "complete", "id": "uuid", "output": "...", "timestamp": "..."}

// Error
{"type": "error", "id": "uuid", "error": "message"}

// Status response
{"type": "status", "agent": "anga", "ready": true, "queueLength": 0}

// Pong
{"type": "pong", "timestamp": "..."}
```

## Usage

### Starting PTY Mode

```bash
# Build PTY images
make pty-build

# Start all agents in PTY mode
make pty-up

# Check status
make pty-status

# View logs
make pty-logs
```

### Sending Commands

```bash
# Send command via Makefile
make pty-send AGENT=anga MSG="hello"

# Send command via script
./scripts/pty-send.sh anga "hello world"

# Ping all agents
make pty-ping-all
```

### From Orchestrator Container

```bash
# Get status of all workers
node /orchestrator/pty-client.js status

# Send command to worker
node /orchestrator/pty-client.js send anga "create a hello world function"

# Ping workers
node /orchestrator/pty-client.js ping
```

### Programmatic Usage

```javascript
import { PtyClient, createClient } from './pty-wrapper/src/client.js';

// Connect to a worker
const client = await createClient('anga');

// Send a command
const result = await client.sendCommand('hello world', {
  timeout: 60000,
  onOutput: (data) => process.stdout.write(data)
});

console.log('Result:', result);

// Close connection
client.close();
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| AGENT_NAME | worker | Agent identifier |
| SOCKET_DIR | /shared/sockets | Socket directory |
| SOCKET_PATH | {SOCKET_DIR}/{AGENT_NAME}.sock | Socket path |
| CLAUDE_CLI | claude | Claude CLI command |
| CLAUDE_ARGS | --permission-mode bypassPermissions | Claude CLI arguments |
| DEFAULT_TIMEOUT | 60000 | Default command timeout (ms) |
| LOG_LEVEL | info | Logging level |

## Docker Integration

### Volumes

The PTY compose file adds:
```yaml
volumes:
  - ./shared/sockets:/shared/sockets:rw
  - ./pty-wrapper:/pty-wrapper:ro
```

### Entrypoint

Uses `scripts/wrapper-entrypoint.sh` which:
1. Sets up environment
2. Installs PTY wrapper dependencies
3. Starts the wrapper (which spawns Claude)
4. Handles graceful shutdown

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "test", "-S", "/shared/sockets/{agent}.sock"]
  interval: 15s
  timeout: 5s
  retries: 3
```

## Makefile Targets

| Target | Description |
|--------|-------------|
| `pty-up` | Start all agents in PTY mode |
| `pty-down` | Stop all PTY agents |
| `pty-restart` | Restart all PTY agents |
| `pty-logs` | Show logs from all agents |
| `pty-status` | Show PTY wrapper status |
| `pty-send` | Send command to agent |
| `pty-ping` | Ping specific agent |
| `pty-ping-all` | Ping all agents |
| `pty-test` | Test PTY communication |
| `pty-build` | Build PTY Docker images |
| `pty-setup` | Setup directories |
| `pty-clean` | Clean socket files |
| `pty-shell` | Open shell in container |

## Troubleshooting

### Socket not found
```bash
# Check if containers are running
docker-compose -f docker-compose.pty.yml ps

# Check socket directory
ls -la shared/sockets/
```

### Connection refused
```bash
# Check wrapper is running inside container
docker exec codehornets-worker-anga ps aux | grep node

# Check wrapper logs
docker logs codehornets-worker-anga
```

### Timeout issues
```bash
# Increase timeout
make pty-send AGENT=anga MSG="complex task" TIMEOUT=120000
```

### Build failures
```bash
# node-pty requires build tools
# The Dockerfiles include: build-essential, gcc, g++, make, cmake, python3
```

## Files

```
pty-wrapper/
├── package.json              # Dependencies
├── README.md                 # This file
└── src/
    ├── index.js              # Module exports
    ├── wrapper.js            # Main PTY wrapper
    ├── client.js             # Client library
    ├── completion-detector.js # Completion detection
    └── test.js               # Test suite

orchestrator/
└── pty-client.js             # Orchestrator client

scripts/
├── wrapper-entrypoint.sh     # Container entrypoint
├── pty-send.sh               # Send command helper
└── pty-status.sh             # Status checker

dockerfiles/
├── pty-orchestrator.Dockerfile
├── pty-marie.Dockerfile
├── pty-anga.Dockerfile
└── pty-fabien.Dockerfile

docker-compose.pty.yml        # PTY mode compose file
```
