# tmux Communication Guide

This guide covers the tmux send-keys approach for inter-agent communication in the CodeHornets orchestration system.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Setup Instructions](#setup-instructions)
- [Common Commands](#common-commands)
- [Implementation Details](#implementation-details)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The tmux approach uses [tmux](https://github.com/tmux/tmux) (terminal multiplexer) sessions to send commands to containerized agents. Each agent runs in its own tmux session, allowing the orchestrator to inject keystrokes programmatically.

### Advantages

- Full terminal emulation support
- Session persistence (survives disconnects)
- Easy debugging via `tmux attach`
- Works with any TUI application
- Familiar for developers

### Disadvantages

- Higher latency than PTY wrapper (~15-25ms)
- Requires tmux installed in containers
- Special character escaping needed
- No Windows support

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Host System                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │   Orchestrator  │                                                │
│  │    Container    │                                                │
│  │                 │                                                │
│  │  tmux send-keys ├─────────────┐                                  │
│  │                 │             │                                  │
│  └─────────────────┘             │                                  │
│                                  │                                  │
│  ┌─────────────────┐    ┌───────▼───────┐    ┌─────────────────┐   │
│  │  Worker: Marie  │    │ Worker: Anga  │    │ Worker: Fabien  │   │
│  │                 │    │               │    │                 │   │
│  │  ┌───────────┐  │    │  ┌─────────┐  │    │  ┌───────────┐  │   │
│  │  │   tmux    │  │    │  │  tmux   │  │    │  │   tmux    │  │   │
│  │  │  session  │  │    │  │ session │  │    │  │  session  │  │   │
│  │  │           │  │    │  │         │  │    │  │           │  │   │
│  │  │  Claude   │  │    │  │ Claude  │  │    │  │  Claude   │  │   │
│  │  │   Code    │  │    │  │  Code   │  │    │  │   Code    │  │   │
│  │  └───────────┘  │    │  └─────────┘  │    │  └───────────┘  │   │
│  └─────────────────┘    └───────────────┘    └─────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Orchestrator** executes `tmux send-keys` via docker exec
2. **tmux** injects keystrokes into target session
3. **Claude Code** receives input as if typed by user
4. **Response** captured via `tmux capture-pane` or file monitoring

```
Orchestrator                    Worker Container
     │                                │
     │  docker exec ... tmux          │
     │  send-keys -t agent "msg"      │
     ├───────────────────────────────▶│
     │                                │
     │                          ┌─────▼─────┐
     │                          │   tmux    │
     │                          │  session  │
     │                          └─────┬─────┘
     │                                │
     │                          ┌─────▼─────┐
     │                          │  Claude   │
     │                          │   Code    │
     │                          └───────────┘
```

## Setup Instructions

### 1. Install tmux in Container

Add to your Dockerfile:

```dockerfile
FROM node:18-alpine

# Install tmux
RUN apk add --no-cache tmux

# ... rest of your setup
```

Or for Debian-based images:

```dockerfile
FROM node:18

RUN apt-get update && apt-get install -y tmux && rm -rf /var/lib/apt/lists/*
```

### 2. Configure tmux Session

Create tmux configuration file (`/etc/tmux.conf` or `~/.tmux.conf`):

```bash
# Disable status bar for cleaner output
set -g status off

# Increase history limit
set -g history-limit 50000

# Allow 256 colors
set -g default-terminal "screen-256color"

# Don't rename windows automatically
set -g allow-rename off

# Faster key repetition
set -s escape-time 0
```

### 3. Start Agent in tmux Session

Entry point script for container:

```bash
#!/bin/bash

# Create tmux session for agent
SESSION_NAME="agent-${AGENT_NAME:-default}"

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  # Create new session
  tmux new-session -d -s "$SESSION_NAME" -x 120 -y 40

  # Start Claude Code in the session
  tmux send-keys -t "$SESSION_NAME" "claude" Enter
fi

# Keep container running
exec tail -f /dev/null
```

### 4. Docker Compose Configuration

```yaml
version: '3.8'

services:
  worker-anga:
    image: codehornets-agent:latest
    container_name: codehornets-worker-anga
    environment:
      - AGENT_NAME=anga
      - TERM=xterm-256color
    stdin_open: true
    tty: true
    volumes:
      - ./shared:/shared
    command: /scripts/start-agent.sh
```

## Common Commands

### Send Message to Agent

```bash
# Basic send
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga "Hello, Anga!" Enter

# Send JSON message
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga \
  '{"type":"task","action":"review code"}' Enter

# Send multiline (using literal mode)
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga -l \
  'First line
Second line
Third line' Enter
```

### Capture Output

```bash
# Capture current pane content
docker exec codehornets-worker-anga \
  tmux capture-pane -t agent-anga -p

# Capture with history
docker exec codehornets-worker-anga \
  tmux capture-pane -t agent-anga -p -S -1000

# Save to file
docker exec codehornets-worker-anga \
  tmux capture-pane -t agent-anga -p > output.txt
```

### Session Management

```bash
# List sessions
docker exec codehornets-worker-anga tmux list-sessions

# Attach to session (for debugging)
docker exec -it codehornets-worker-anga tmux attach -t agent-anga

# Kill session
docker exec codehornets-worker-anga tmux kill-session -t agent-anga

# Create new session
docker exec codehornets-worker-anga \
  tmux new-session -d -s agent-anga -x 120 -y 40
```

### Window Control

```bash
# Send Ctrl+C (interrupt)
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga C-c

# Send Ctrl+L (clear screen)
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga C-l

# Send Escape
docker exec codehornets-worker-anga \
  tmux send-keys -t agent-anga Escape
```

## Implementation Details

### JavaScript Implementation

```javascript
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class TmuxCommunicator {
  constructor(options = {}) {
    this.sessionPrefix = options.sessionPrefix || 'agent';
    this.docker = options.docker || 'docker';
  }

  /**
   * Send message to agent via tmux
   */
  async sendMessage(containerName, message) {
    const sessionName = `${this.sessionPrefix}-${containerName}`;
    const escapedMessage = this.escapeForTmux(
      typeof message === 'string' ? message : JSON.stringify(message)
    );

    const command = `${this.docker} exec ${containerName} ` +
                   `tmux send-keys -t ${sessionName} "${escapedMessage}" Enter`;

    try {
      await execAsync(command);
      return { success: true };
    } catch (error) {
      throw new Error(`tmux send failed: ${error.message}`);
    }
  }

  /**
   * Capture current pane content
   */
  async capturePane(containerName, lines = 100) {
    const sessionName = `${this.sessionPrefix}-${containerName}`;

    const command = `${this.docker} exec ${containerName} ` +
                   `tmux capture-pane -t ${sessionName} -p -S -${lines}`;

    const { stdout } = await execAsync(command);
    return stdout;
  }

  /**
   * Escape special characters for tmux
   */
  escapeForTmux(str) {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/!/g, '\\!');
  }

  /**
   * Check if session exists
   */
  async sessionExists(containerName) {
    const sessionName = `${this.sessionPrefix}-${containerName}`;

    try {
      await execAsync(
        `${this.docker} exec ${containerName} tmux has-session -t ${sessionName}`
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create new session
   */
  async createSession(containerName, cols = 120, rows = 40) {
    const sessionName = `${this.sessionPrefix}-${containerName}`;

    await execAsync(
      `${this.docker} exec ${containerName} ` +
      `tmux new-session -d -s ${sessionName} -x ${cols} -y ${rows}`
    );
  }
}

module.exports = TmuxCommunicator;
```

### Character Escaping Reference

| Character | Escape Sequence | Notes |
|-----------|----------------|-------|
| `\` | `\\` | Backslash |
| `"` | `\"` | Double quote |
| `'` | `\'` | Single quote |
| `$` | `\$` | Dollar sign (prevents variable expansion) |
| `` ` `` | `` \` `` | Backtick |
| `!` | `\!` | Exclamation (history expansion) |
| Newline | `\n` or use `-l` flag | Line breaks |

## Best Practices

### 1. Use Literal Mode for Complex Messages

```bash
# Instead of escaping everything, use -l flag
tmux send-keys -t agent -l 'Complex "message" with $special chars' Enter
```

### 2. Implement Health Checks

```javascript
async function checkAgentHealth(containerName) {
  // Send heartbeat
  await sendMessage(containerName, '{"type":"heartbeat"}');

  // Wait for response with timeout
  const content = await capturePane(containerName);

  // Check for heartbeat response
  return content.includes('heartbeat_ack');
}
```

### 3. Handle Long Messages

```javascript
// For messages > 4KB, split into chunks
async function sendLargeMessage(containerName, message) {
  const CHUNK_SIZE = 4000;
  const chunks = [];

  for (let i = 0; i < message.length; i += CHUNK_SIZE) {
    chunks.push(message.slice(i, i + CHUNK_SIZE));
  }

  // Send start marker
  await sendMessage(containerName, '<<<START_LARGE_MSG>>>');

  // Send chunks
  for (const chunk of chunks) {
    await sendMessage(containerName, chunk);
    await sleep(50); // Small delay between chunks
  }

  // Send end marker
  await sendMessage(containerName, '<<<END_LARGE_MSG>>>');
}
```

### 4. Implement Retry Logic

```javascript
async function sendWithRetry(containerName, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendMessage(containerName, message);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Wait before retry (exponential backoff)
      await sleep(100 * attempt);

      // Ensure session exists
      if (!(await sessionExists(containerName))) {
        await createSession(containerName);
      }
    }
  }
}
```

## Troubleshooting

### Session Not Found

**Error:** `can't find session: agent-anga`

**Solutions:**
1. Check if session was created: `tmux list-sessions`
2. Create session manually: `tmux new-session -d -s agent-anga`
3. Verify container is running: `docker ps`

### Characters Not Appearing

**Issue:** Special characters being interpreted by shell

**Solutions:**
1. Use `-l` (literal) flag: `tmux send-keys -l "message"`
2. Properly escape characters (see table above)
3. Use base64 encoding for complex payloads

### Output Not Captured

**Issue:** `capture-pane` returns empty

**Solutions:**
1. Check session name matches
2. Increase history lines: `tmux capture-pane -S -1000`
3. Verify pane has output: attach and check manually

### Performance Issues

**Issue:** High latency or timeouts

**Solutions:**
1. Reduce docker exec overhead with socket connection
2. Batch multiple commands
3. Consider PTY wrapper for high-throughput needs

### Container Restart Handling

**Issue:** Session lost after container restart

**Solution:**
```bash
#!/bin/bash
# Recovery script

SESSION_NAME="agent-${AGENT_NAME}"

# Check if session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "Session lost, recreating..."
  tmux new-session -d -s "$SESSION_NAME" -x 120 -y 40
  tmux send-keys -t "$SESSION_NAME" "claude" Enter
fi
```

### Debug Commands

```bash
# Check tmux version
docker exec container-name tmux -V

# List all sessions with info
docker exec container-name tmux list-sessions -F \
  "#{session_name}: #{session_windows} windows, created #{session_created_string}"

# Show pane information
docker exec container-name tmux display-message -t session-name -p \
  "Pane: #{pane_id}, Size: #{pane_width}x#{pane_height}"

# Enable tmux logging
docker exec container-name tmux pipe-pane -t session-name \
  -o 'cat >> /tmp/tmux.log'
```

## Related Documentation

- [Communication Architecture](./COMMUNICATION.md)
- [PTY Wrapper Guide](./PTY-WRAPPER-GUIDE.md) - Alternative approach
- [Migration Guide](./MIGRATION.md)
