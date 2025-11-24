# Agent Communication Architecture

This document provides a comprehensive overview of the inter-agent communication system in the CodeHornets AI orchestration platform.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Communication Strategies](#communication-strategies)
- [Strategy Comparison](#strategy-comparison)
- [Configuration Options](#configuration-options)
- [When to Use Each Approach](#when-to-use-each-approach)
- [Message Protocol](#message-protocol)
- [Error Handling](#error-handling)

## Architecture Overview

The CodeHornets orchestration system enables communication between a central orchestrator and multiple specialized worker agents. Each agent runs Claude Code in an isolated Docker container.

```
                              +-------------------+
                              |                   |
                              |   Orchestrator    |
                              |   (Coordinator)   |
                              |                   |
                              +--------+----------+
                                       |
           +---------------------------+---------------------------+
           |                           |                           |
           v                           v                           v
+----------+----------+     +----------+----------+     +----------+----------+
|                     |     |                     |     |                     |
|   Marie (Worker)    |     |   Anga (Worker)     |     |   Fabien (Worker)   |
|   Dance Teaching    |     |   Coding           |     |   Marketing         |
|                     |     |                     |     |                     |
+---------------------+     +---------------------+     +---------------------+
```

### Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Message Flow                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Task Assignment                                                         │
│     Orchestrator ──────> Worker                                            │
│     { type: "task", taskId: "...", action: "..." }                         │
│                                                                             │
│  2. Progress Update                                                         │
│     Worker ──────> Orchestrator                                            │
│     { type: "progress", taskId: "...", percent: 50 }                       │
│                                                                             │
│  3. Task Result                                                             │
│     Worker ──────> Orchestrator                                            │
│     { type: "result", taskId: "...", status: "completed" }                 │
│                                                                             │
│  4. Broadcast                                                               │
│     Orchestrator ══════> All Workers                                       │
│     { type: "announcement", message: "..." }                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Communication Strategies

The system supports multiple communication strategies that can be selected based on requirements:

### 1. tmux Send-Keys Approach

Uses tmux sessions to send keystrokes to containerized agents.

```
┌──────────────┐     tmux send-keys     ┌──────────────┐
│              │ ────────────────────▶  │              │
│ Orchestrator │                        │   Worker     │
│              │ ◀────────────────────  │   (tmux)     │
└──────────────┘     tmux capture       └──────────────┘
```

**Characteristics:**
- Latency: ~15-25ms
- Requires: tmux installed in container
- Best for: Interactive sessions, shell-based communication

### 2. PTY Wrapper Approach

Wraps the Claude Code process with a PTY that accepts programmatic input.

```
┌──────────────┐    Unix Socket     ┌────────────────┐    PTY     ┌────────────┐
│              │ ─────────────────▶ │                │ ─────────▶ │            │
│ Orchestrator │                    │  PTY Wrapper   │            │ Claude Code│
│              │ ◀───────────────── │                │ ◀───────── │            │
└──────────────┘                    └────────────────┘            └────────────┘
```

**Characteristics:**
- Latency: ~3-8ms
- Requires: node-pty package
- Best for: Low-latency, high-throughput scenarios

### 3. Shared Volume Approach

Uses shared filesystem to exchange messages via JSON files.

```
┌──────────────┐                    ┌──────────────┐
│              │                    │              │
│ Orchestrator │ ─────┐      ┌───▶ │   Worker     │
│              │      │      │     │              │
└──────────────┘      │      │     └──────────────┘
                      │      │
                      v      │
               ┌─────────────┴─────┐
               │                   │
               │  /shared/messages │
               │   (JSON files)    │
               │                   │
               └───────────────────┘
```

**Characteristics:**
- Latency: ~10-20ms
- Requires: Shared Docker volume
- Best for: Cross-platform compatibility, simple debugging

## Strategy Comparison

| Feature | tmux | PTY Wrapper | Shared Volume |
|---------|------|-------------|---------------|
| Latency | ~20ms | ~5ms | ~15ms |
| Throughput | Medium | High | Medium |
| Setup Complexity | Low | Medium | Low |
| Dependencies | tmux | node-pty | None |
| Cross-platform | Linux/Mac | Linux/Mac | All |
| Debugging | Easy | Medium | Easy |
| Signal Support | Yes | Yes | No |
| Terminal Semantics | Full | Full | None |
| Persistence | Session-based | Process-based | File-based |

### Performance Benchmarks

```
Strategy Performance (100 iterations, small payload):

Strategy           Avg(ms)    P95(ms)    P99(ms)    Throughput
-----------------------------------------------------------------
pty-wrapper          4.2        6.1        8.3      238 msg/sec
tmux                17.5       22.4       28.1       57 msg/sec
shared-volume       12.8       18.2       24.6       78 msg/sec
docker-exec         52.3       71.4       89.2       19 msg/sec
```

## Configuration Options

### Strategy Selection

```javascript
const AgentComm = require('./agent-comm');

// Auto-select best available strategy
const comm = new AgentComm({
  strategy: 'auto'
});

// Force specific strategy
const comm = new AgentComm({
  strategy: 'pty-wrapper' // or 'tmux', 'shared-volume'
});
```

### Retry Configuration

```javascript
const comm = new AgentComm({
  retryAttempts: 3,        // Number of retry attempts
  retryDelay: 100,         // Base delay between retries (ms)
  timeout: 30000,          // Message timeout (ms)
  fallback: true           // Enable fallback to other strategies
});
```

### Debug Mode

```javascript
const comm = new AgentComm({
  debug: true  // Enable verbose logging
});
```

## When to Use Each Approach

### Use tmux Send-Keys When:

- You need full terminal emulation
- Interactive debugging is important
- Running on Linux or macOS
- You need session persistence
- Commands involve shell features

### Use PTY Wrapper When:

- Low latency is critical
- High message throughput is needed
- You're building automated pipelines
- Response time consistency matters
- You control the container images

### Use Shared Volume When:

- Cross-platform compatibility is required
- Simple setup is preferred
- You need message persistence
- Debugging message flow is important
- Network restrictions exist

### Fallback Strategy

The system automatically falls back between strategies:

```
PTY Wrapper (primary)
       │
       │ (if fails)
       v
   tmux (fallback)
       │
       │ (if fails)
       v
Shared Volume (last resort)
```

## Message Protocol

### Standard Message Format

```json
{
  "id": "msg_1700000000000_abc123def",
  "from": "orchestrator",
  "to": "worker-anga",
  "payload": {
    "type": "task",
    "taskId": "task-001",
    "action": "review code",
    "data": { ... }
  },
  "timestamp": 1700000000000,
  "expectResponse": true
}
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `task` | Orch -> Worker | Assign work to agent |
| `result` | Worker -> Orch | Return task result |
| `progress` | Worker -> Orch | Report task progress |
| `request` | Any -> Any | Request-response pattern |
| `response` | Any -> Any | Response to request |
| `announcement` | Orch -> All | Broadcast message |
| `status` | Worker -> Orch | Agent status update |
| `heartbeat` | Any | Health check |

### PTY Wrapper Protocol Framing

For PTY wrapper, messages are framed with control characters:

```
STX (0x02) + JSON payload + ETX (0x03)
```

Example:
```
\x02{"type":"task","id":"123"}\x03
```

## Error Handling

### Retry Logic

```javascript
async function sendWithRetry(message, options) {
  let lastError;

  for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
    try {
      return await strategy.send(message);
    } catch (error) {
      lastError = error;

      if (attempt < options.retryAttempts) {
        // Exponential backoff
        await sleep(options.retryDelay * attempt);

        // Try fallback strategy
        if (options.fallback) {
          strategy = selectFallbackStrategy();
        }
      }
    }
  }

  throw lastError;
}
```

### Error Types

| Error | Cause | Recovery |
|-------|-------|----------|
| `TimeoutError` | Response not received | Retry with longer timeout |
| `ConnectionError` | Socket/pipe broken | Reconnect and retry |
| `StrategyError` | Strategy unavailable | Use fallback strategy |
| `AgentError` | Target agent down | Wait and retry, or fail |
| `ParseError` | Invalid message format | Log and skip message |

### Circuit Breaker Pattern

For production use, implement circuit breaker:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.lastFailure = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Related Documentation

- [tmux Guide](./TMUX-GUIDE.md) - Detailed tmux approach documentation
- [PTY Wrapper Guide](./PTY-WRAPPER-GUIDE.md) - PTY wrapper implementation details
- [Migration Guide](./MIGRATION.md) - Migrating from file-based approach
- [Testing Guide](./TESTING_GUIDE.md) - How to test the communication system
