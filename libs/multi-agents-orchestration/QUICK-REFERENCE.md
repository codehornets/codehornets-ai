# PTY/Socat IPC - Quick Reference Guide

## TL;DR - Choose Your Approach

### For Your Use Case (Multi-Agent Orchestration)

**Recommended: socat + Unix Socket Relay**

Why:
- Reliable inter-container communication
- Works on Linux/Mac/Windows
- No terminal resize complications
- Simple to debug and troubleshoot
- Scales to multiple agents

```yaml
# Agent with relay
marie-pty-relay:
  image: alpine:latest
  command: |
    sh -c 'apk add socat &&
    socat EXEC:"docker attach agent-marie",pty,rawer \
          UNIX-LISTEN:/tmp/marie.sock,fork,reuseaddr'
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - agent-sockets:/tmp/agent-sockets

# Orchestrator sends commands
orchestrator:
  volumes:
    - agent-sockets:/tmp/agent-sockets
```

**Orchestrator code**:
```javascript
const net = require('net');

// Connect to agent via socket
const socket = net.createConnection('/tmp/agent-sockets/marie.sock');

// Send command
socket.write('help\n');

// Read response
socket.on('data', (data) => {
  console.log(data.toString());
});
```

---

## Quick Start Commands

### 1. Local Interactive (Simplest)

```bash
# Start container
docker-compose up -d agent-marie

# Attach with full terminal support
docker attach $(docker-compose ps -q agent-marie)

# Or with compose shortcut
docker-compose exec agent-marie bash
```

**Requirements**: Must use `init: true` in docker-compose

---

### 2. Remote Interactive (Network)

```bash
# Start relay
docker-compose up -d marie-pty-relay

# Connect from anywhere
socat - TCP:localhost:9001

# Or use Python client
python3 remote-client.py localhost 9001
```

---

### 3. IPC (Recommended for Orchestration)

```bash
# Setup FIFOs (one-time)
mkdir -p /tmp/agent-sockets
docker exec agent-marie mkdir -p /tmp/agent-sockets

# Send command
echo "status" | socat - UNIX-CONNECT:/tmp/agent-sockets/marie.sock

# Node.js
node -e "
  const net = require('net');
  const socket = net.createConnection('/tmp/agent-sockets/marie.sock');
  socket.write('help\n');
  socket.on('data', d => console.log(d.toString()));
"
```

---

### 4. Development/Debug (Simple FIFO)

```bash
# Create FIFOs
mkfifo /tmp/agent-io/stdin /tmp/agent-io/stdout /tmp/agent-io/stderr

# Start container with FIFO redirection
docker run -v /tmp/agent-io:/io myapp bash -c "
  exec 0</io/stdin
  exec 1>/io/stdout
  exec 2>/io/stderr
  node app.js
"

# Send commands
echo "help" > /tmp/agent-io/stdin

# Read output
tail -f /tmp/agent-io/stdout
```

---

## Critical Configuration

### Always Use `init: true` or `--init`

Without this, your Node.js process won't handle signals properly:

```yaml
services:
  agent:
    init: true  # CRITICAL - enables proper signal handling
    tty: true
    stdin_open: true
```

Or in bash:
```bash
docker run --init myimage
```

---

## Troubleshooting Matrix

| Problem | Cause | Solution |
|---------|-------|----------|
| **"Bad file descriptor" on macOS** | socat EXEC+docker attach bug | Use TCP relay instead, or socat inside container |
| **Ctrl-C doesn't work** | PID 1 signal handling | Add `init: true` or `--init` flag |
| **Terminal looks corrupted** | Echo is doubled in PTY | Add `rawer` or `echo=0` to socat: `pty,rawer` |
| **Window resize doesn't sync** | socat doesn't forward SIGWINCH | Manual: `stty rows 50 cols 200` |
| **No output from command** | Command needs terminal | Ensure `tty: true` and `-t` flag used |
| **TIOCSTI permission denied** | No CAP_SYS_ADMIN | Add `--cap-add=SYS_ADMIN` to docker run |
| **Socket "Address already in use"** | Old relay process still running | `kill -9` the relay process, or `rm /tmp/*.sock` |
| **reptyr fails** | ptrace not enabled | Add `--cap-add=SYS_PTRACE` and set `ptrace_scope=0` |

---

## Performance Comparison

| Method | Latency | Overhead | Best For |
|--------|---------|----------|----------|
| Native attach | <1ms | Minimal | Local interactive |
| Unix socket | 1-5ms | Very low | Local IPC |
| TCP relay | 5-50ms | Low | Remote access |
| Named pipes | 1-10ms | Very low | Simple command execution |
| TIOCSTI | 10-100ms | Medium | Direct injection (unreliable) |
| reptyr | 1-5ms | Medium | Full terminal features |

---

## Docker Compose Template

Minimal working example for multi-agent orchestration:

```yaml
version: '3.8'

services:
  # Agent 1
  agent-marie:
    build: ./agents/marie
    init: true
    stdin_open: true
    tty: true
    volumes:
      - agent-sockets:/tmp/agent-sockets
    networks:
      - agent-net

  # Relay for Marie
  marie-relay:
    image: alpine:latest
    depends_on:
      - agent-marie
    command: |
      sh -c 'apk add socat &&
      socat EXEC:"docker attach agent-marie",pty,rawer \
            UNIX-LISTEN:/tmp/agent-sockets/marie.sock,fork,reuseaddr'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - agent-sockets:/tmp/agent-sockets
    networks:
      - agent-net

  # Orchestrator
  orchestrator:
    build: ./orchestrator
    init: true
    stdin_open: true
    tty: true
    depends_on:
      - marie-relay
    volumes:
      - agent-sockets:/tmp/agent-sockets
    networks:
      - agent-net

volumes:
  agent-sockets:

networks:
  agent-net:
    driver: bridge
```

**Orchestrator code**:
```javascript
const net = require('net');

// Connect to agent
function sendToAgent(socketPath, command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);

    socket.on('connect', () => {
      socket.write(command + '\n');

      let response = '';
      socket.on('data', (data) => {
        response += data.toString();
      });

      setTimeout(() => {
        socket.destroy();
        resolve(response);
      }, 1000);
    });

    socket.on('error', reject);
  });
}

// Usage
sendToAgent('/tmp/agent-sockets/marie.sock', 'status')
  .then(r => console.log(r))
  .catch(e => console.error(e));
```

---

## Common Pitfalls

### 1. Using `docker attach` in Scripts

**WRONG**:
```bash
# This doesn't work in scripts - blocks forever
docker attach mycontainer
echo "next command"  # Never executes
```

**RIGHT**:
```bash
# Use docker exec instead
docker exec mycontainer command

# Or socat for PTY
echo "command" | socat EXEC:"docker attach mycontainer",pty STDIN
```

---

### 2. Forgetting the `init` Flag

**WRONG**:
```dockerfile
FROM node:18
CMD ["node", "app.js"]  # PID 1 won't handle signals!
```

**RIGHT**:
```dockerfile
FROM node:18
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
```

Or in docker-compose:
```yaml
init: true
```

---

### 3. Using FIFO Without Understanding Blocking

**WRONG**:
```bash
# This blocks indefinitely waiting for reader
echo "command" > /tmp/fifo/stdin
```

**RIGHT**:
```bash
# Open reader first
tail -f /tmp/fifo/stdout &

# Then write
echo "command" > /tmp/fifo/stdin
```

---

### 4. Not Handling Terminal Escape Codes in Responses

**WRONG**:
```javascript
// Raw PTY output includes ANSI escape codes
socket.on('data', (data) => {
  console.log(data);  // Includes ^[[33m, etc.
});
```

**RIGHT**:
```javascript
// Parse or strip ANSI codes
const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');

socket.on('data', (data) => {
  const clean = stripAnsi(data.toString());
  console.log(clean);
});
```

---

## Testing Checklist

Before deploying to production:

- [ ] Can send simple command (`help`)
- [ ] Can receive response with output
- [ ] Multi-line input works correctly
- [ ] Can send commands to multiple agents
- [ ] Error handling works (agent offline, socket error)
- [ ] Cleanup works (close socket, terminate relay)
- [ ] Tested on target platform (Linux/Mac/Windows)
- [ ] Tested with actual Claude Code TUI
- [ ] Load tested (100s of commands/second)
- [ ] Handles large responses (>1MB)
- [ ] Timeout handling works
- [ ] Signal forwarding works (Ctrl-C)

---

## Signal Handling Reference

### Signals Needed in Node.js

```javascript
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  // Close connections, cleanup
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received (Ctrl-C)...');
  process.exit(0);
});

// Window resize (for TUI)
process.stdout.on('resize', () => {
  const { rows, columns } = process.stdout;
  console.log(`Resized to ${columns}x${rows}`);
  // Redraw UI
});
```

### Docker Compose `init` flag
- Automatically uses `/sbin/tini` on Linux
- Proper signal forwarding for PID 1
- No additional dependencies needed

---

## File Descriptors Reference

| FD | Name | Purpose |
|----|------|---------|
| 0 | stdin | Input |
| 1 | stdout | Normal output |
| 2 | stderr | Error output |
| 3+ | Custom | Open files, sockets |

In Docker container:
- `PID 1` = main process (your Node.js app)
- `/proc/1/fd/0` = path to stdin (but writing doesn't work as expected)
- Use PTY master/slave or relay instead

---

## PTY vs Non-PTY

| Feature | With PTY | Without PTY |
|---------|----------|------------|
| Escape codes | Preserved | Lost |
| Raw mode input | Yes | No (line buffered) |
| Signal propagation | Yes (proper) | No |
| Colors | Preserved | Stripped |
| Ctrl-C | Works | Doesn't work |
| Terminal size | Synchronized | Not available |

---

## Resources

### Main Research Document
- `RESEARCH-PTY-SOCAT-IPC.md` - Full technical depth

### Implementation Guide
- `IMPLEMENTATION-GUIDE.md` - Working code examples for each approach

### External References
- [Docker PTY internals](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/)
- [socat man page](https://linux.die.net/man/1/socat)
- [Node.js signal handling](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [reptyr project](https://github.com/nelhage/reptyr)

---

## One-Liner Recipes

### Send command to container via socat
```bash
echo "ls" | socat EXEC:"docker attach container",pty,rawer STDIN
```

### Create Unix socket relay
```bash
docker exec container \
  socat EXEC:"docker attach container",pty,rawer \
        UNIX-LISTEN:/tmp/relay.sock,fork
```

### Connect to relay from Node.js
```bash
node -e "require('net').createConnection('/tmp/relay.sock').write('help\n')"
```

### Find Node.js process in container
```bash
docker exec container pgrep -f 'node'
```

### Check if TIOCSTI available
```bash
cat /proc/sys/dev/tty/legacy_tiocsti
```

### Enable ptrace for reptyr
```bash
sudo sysctl kernel.yama.ptrace_scope=0
```

### Create FIFOs quickly
```bash
for f in stdin stdout stderr; do mkfifo /tmp/$f; done
```

### Monitor container logs
```bash
docker logs -f $(docker-compose ps -q agent)
```

---

## Summary Table

| Approach | Setup Time | Reliability | Compatibility | Recommended Use |
|----------|-----------|-------------|---|---|
| Native attach | 5 min | High | Linux/Mac/Win | Local interactive |
| socat TCP | 20 min | High | Linux/Mac/Win | Remote interactive |
| socat Socket | 15 min | Very High | Linux/Mac/Win | **Orchestration** |
| Named pipes | 10 min | Medium | Linux/Mac/Win | Simple commands |
| TIOCSTI | 30 min | Low | Linux only | Not recommended |
| reptyr | 30 min | High | Linux only | Full terminal |

---

**For your multi-agent orchestration: Use socat + Unix socket + Node.js IPC client.**

Everything you need is in `IMPLEMENTATION-GUIDE.md` - Section 5.

