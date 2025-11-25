# Agent Communication Module

Unified API for communicating with Claude Code agents in the CodeHornets AI orchestration system. Supports multiple communication strategies with automatic detection and fallback.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Strategies](#strategies)
- [CLI Tool](#cli-tool)
- [Configuration](#configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation

The module is included in the multi-agents-orchestration package:

```bash
cd libs/multi-agents-orchestration
npm install
```

## Quick Start

```javascript
const AgentCommunicator = require('./agent-comm');

// Create communicator with auto-detection
const comm = new AgentCommunicator({
  strategy: 'auto', // or 'tmux', 'pty-wrapper', 'file-based'
  agents: ['orchestrator', 'marie', 'anga', 'fabien']
});

// Initialize (required before use)
await comm.initialize();

// Send message and wait for response
const response = await comm.send('anga', 'analyze this code');
console.log(response);
// { success: true, response: '...', duration: 1234 }

// Send without waiting
await comm.sendAsync('marie', 'start task');

// Get current output
const output = await comm.getOutput('fabien');

// Check agent status
const status = await comm.getStatus('orchestrator');

// Broadcast to all workers
const results = await comm.broadcast('workers', 'system update');

// Delegate task to best agent
const result = await comm.delegateTask('review this marketing campaign');
// Automatically routes to fabien based on expertise matching

// Clean up
await comm.shutdown();
```

## API Reference

### AgentCommunicator

Main class for agent communication.

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strategy` | `'auto'` \| `'tmux'` \| `'pty-wrapper'` \| `'file-based'` | `'auto'` | Communication strategy |
| `agents` | `string[]` | `['orchestrator', 'marie', 'anga', 'fabien']` | List of agent names |
| `sharedDir` | `string` | `'/shared'` | Shared directory path |
| `debug` | `boolean` | `false` | Enable debug logging |
| `timeout` | `number` | `30000` | Default timeout (ms) |
| `socketDir` | `string` | `'/shared/sockets'` | Socket directory for pty-wrapper |
| `tmuxOptions` | `object` | `{}` | Options for tmux strategy |
| `ptyOptions` | `object` | `{}` | Options for pty-wrapper strategy |
| `fileOptions` | `object` | `{}` | Options for file-based strategy |

#### Methods

##### `initialize(): Promise<void>`

Initialize the communicator. Must be called before any other methods.

```javascript
await comm.initialize();
```

##### `send(agentName, message, options?): Promise<SendResult>`

Send a message to an agent and wait for response.

```javascript
const result = await comm.send('anga', 'hello world', {
  timeout: 60000,
  strategy: 'tmux' // optional override
});

// result: { success: boolean, response?: string, error?: string, duration: number }
```

##### `sendAsync(agentName, message, options?): Promise<void>`

Send a message without waiting for response.

```javascript
await comm.sendAsync('marie', 'start background task');
```

##### `getOutput(agentName, options?): Promise<string>`

Get current output from an agent.

```javascript
const output = await comm.getOutput('fabien', { lines: 50 });
```

##### `getStatus(agentName): Promise<AgentStatus>`

Get status of a specific agent.

```javascript
const status = await comm.getStatus('anga');
// { available: true, state: 'running', lastSeen: 1700000000000 }
```

##### `getAllStatuses(): Promise<AllStatuses>`

Get status of all agents.

```javascript
const statuses = await comm.getAllStatuses();
// { orchestrator: {...}, marie: {...}, anga: {...}, fabien: {...} }
```

##### `broadcast(targets, message, options?): Promise<BroadcastResults>`

Broadcast message to multiple agents.

```javascript
// Broadcast to all agents
await comm.broadcast('all', 'system announcement');

// Broadcast to workers only (excludes orchestrator)
await comm.broadcast('workers', 'new task available');

// Broadcast to specific agents
await comm.broadcast(['marie', 'anga'], 'targeted message');
```

##### `delegateTask(taskDescription, options?): Promise<DelegateResult>`

Delegate task to the most appropriate agent based on expertise.

```javascript
const result = await comm.delegateTask('review this code');
// Routes to anga (coding expertise)

const result = await comm.delegateTask('create marketing campaign');
// Routes to fabien (marketing expertise)

const result = await comm.delegateTask('choreography for students');
// Routes to marie (dance expertise)
```

##### `shutdown(): Promise<void>`

Clean up and shutdown the communicator.

```javascript
await comm.shutdown();
```

### Events

The communicator emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `initialized` | `{ strategy: string }` | Communicator initialized |
| `messageSent` | `{ agent, strategy, result?, async? }` | Message sent successfully |
| `sendError` | `{ agent, strategy, error }` | Send operation failed |
| `shutdown` | none | Communicator shutdown |

```javascript
comm.on('messageSent', ({ agent, strategy }) => {
  console.log(`Message sent to ${agent} via ${strategy}`);
});
```

## Strategies

### Auto Detection (Default)

When `strategy: 'auto'` is set, the communicator attempts strategies in this order:

1. **pty-wrapper**: Checks if socket files exist in `/shared/sockets`
2. **tmux**: Checks if docker and tmux are available
3. **file-based**: Always available as fallback

### tmux Strategy

Uses `tmux send-keys` to inject commands into agent sessions.

**Advantages:**
- Simple, immediate
- No additional infrastructure needed
- Works with existing tmux sessions

**Limitations:**
- Output capture is not real-time
- Requires tmux sessions to be running

**Configuration:**

```javascript
const comm = new AgentCommunicator({
  strategy: 'tmux',
  tmuxOptions: {
    useDockerExec: true,     // Execute via docker exec
    tmuxPath: 'tmux',        // Path to tmux binary
    captureLines: 100        // Lines to capture from pane
  }
});
```

### pty-wrapper Strategy

Connects to Unix sockets exposed by pty-wrapper services.

**Advantages:**
- Bidirectional communication
- Full PTY semantics
- Real-time interaction

**Limitations:**
- Requires pty-wrapper service running
- Socket file management needed

**Configuration:**

```javascript
const comm = new AgentCommunicator({
  strategy: 'pty-wrapper',
  ptyOptions: {
    socketDir: '/shared/sockets',
    socketPattern: '{agent}.sock',
    connectTimeout: 5000,
    readTimeout: 10000
  }
});
```

### file-based Strategy

Uses shared file system for task/result exchange.

**Advantages:**
- Most portable
- Works without additional services
- Easy to debug

**Limitations:**
- No real-time interaction
- Polling-based response detection

**Configuration:**

```javascript
const comm = new AgentCommunicator({
  strategy: 'file-based',
  fileOptions: {
    tasksDir: '/shared/tasks',
    resultsDir: '/shared/results',
    heartbeatsDir: '/shared/heartbeats',
    pollInterval: 500,
    maxWaitTime: 60000
  }
});
```

## CLI Tool

The module includes a command-line interface.

### Commands

```bash
# Send message to agent
node agent-comm/cli.js send anga "hello"

# Send without waiting for response
node agent-comm/cli.js async marie "start task"

# Get agent output
node agent-comm/cli.js output anga 50

# Check agent status
node agent-comm/cli.js status
node agent-comm/cli.js status anga

# Broadcast message
node agent-comm/cli.js broadcast workers "system update"
node agent-comm/cli.js broadcast all "announcement"
node agent-comm/cli.js broadcast marie,anga "targeted message"

# Delegate task
node agent-comm/cli.js delegate "review this code"

# Get help
node agent-comm/cli.js help
```

### Options

```bash
--strategy=<type>   # Force strategy: tmux, pty-wrapper, file-based
--timeout=<ms>      # Set timeout in milliseconds
--debug             # Enable debug logging
--json              # Output results as JSON
```

### Examples

```bash
# Send with JSON output
node agent-comm/cli.js send anga "hello" --json

# Force tmux strategy with timeout
node agent-comm/cli.js send anga "test" --strategy=tmux --timeout=60000

# Get all statuses in JSON format
node agent-comm/cli.js status --json
```

## Configuration

### Agent Definitions

Default agent configurations:

```javascript
const DEFAULT_AGENTS = {
  orchestrator: {
    name: 'orchestrator',
    role: 'Task Coordinator',
    expertise: ['coordination', 'task-management', 'routing']
  },
  marie: {
    name: 'marie',
    role: 'Dance Teacher Assistant',
    expertise: ['dance', 'students', 'choreography', 'performance']
  },
  anga: {
    name: 'anga',
    role: 'Coding Assistant',
    expertise: ['code', 'programming', 'review', 'architecture', 'debug']
  },
  fabien: {
    name: 'fabien',
    role: 'Marketing Assistant',
    expertise: ['marketing', 'campaign', 'content', 'seo', 'social']
  }
};
```

### Custom Agents

```javascript
const comm = new AgentCommunicator({
  agents: ['orchestrator', 'custom-agent'],
  agentConfigs: {
    'custom-agent': {
      name: 'custom-agent',
      role: 'Custom Role',
      expertise: ['custom', 'specific']
    }
  }
});
```

## Examples

### Basic Usage

```javascript
const AgentCommunicator = require('./agent-comm');

async function main() {
  const comm = new AgentCommunicator({ debug: true });

  try {
    await comm.initialize();

    // Send a coding task
    const result = await comm.send('anga', `
      Please review this function:

      function add(a, b) {
        return a + b;
      }
    `);

    if (result.success) {
      console.log('Response:', result.response);
    } else {
      console.error('Error:', result.error);
    }
  } finally {
    await comm.shutdown();
  }
}

main();
```

### Event Handling

```javascript
const comm = new AgentCommunicator();

comm.on('initialized', ({ strategy }) => {
  console.log(`Using strategy: ${strategy}`);
});

comm.on('messageSent', ({ agent, strategy, result }) => {
  console.log(`Message to ${agent} via ${strategy}`);
});

comm.on('sendError', ({ agent, error }) => {
  console.error(`Failed to send to ${agent}: ${error}`);
});

await comm.initialize();
```

### Integration with Orchestrator

```javascript
const AgentCommunicator = require('./agent-comm');

class OrchestratorService {
  constructor() {
    this.comm = new AgentCommunicator({
      strategy: 'auto',
      debug: process.env.DEBUG === 'true'
    });
  }

  async start() {
    await this.comm.initialize();

    // Check all workers
    const statuses = await this.comm.getAllStatuses();
    console.log('Worker statuses:', statuses);
  }

  async assignTask(task) {
    // Auto-delegate based on task content
    return this.comm.delegateTask(task);
  }

  async notifyWorkers(message) {
    return this.comm.broadcast('workers', message);
  }

  async stop() {
    await this.comm.shutdown();
  }
}
```

## Troubleshooting

### Strategy Not Available

**Problem:** No strategy is available.

**Solution:**
1. Check if Docker is running
2. Verify tmux sessions exist: `docker exec <container> tmux ls`
3. Check socket directory permissions
4. Ensure shared directory is mounted correctly

### Timeout Errors

**Problem:** Operations timeout waiting for response.

**Solutions:**
1. Increase timeout: `{ timeout: 60000 }`
2. Check if agent is responding
3. Verify network/socket connectivity
4. Use async send if response not needed

### Socket Connection Failed

**Problem:** Cannot connect to agent socket.

**Solutions:**
1. Verify socket file exists: `ls /shared/sockets/`
2. Check socket permissions
3. Ensure pty-wrapper service is running
4. Verify shared volume mounts

### tmux Session Not Found

**Problem:** tmux session not found for agent.

**Solutions:**
1. Verify session exists: `tmux has-session -t claude-<agent>`
2. Check session naming convention
3. Ensure container is running
4. Verify docker exec permissions

### Debug Mode

Enable debug logging for detailed information:

```javascript
const comm = new AgentCommunicator({ debug: true });
```

Or via CLI:

```bash
node agent-comm/cli.js send anga "test" --debug
```

## Strategy Comparison

| Feature | tmux | pty-wrapper | file-based |
|---------|------|-------------|------------|
| Real-time | Partial | Yes | No |
| Bidirectional | Partial | Yes | No |
| Infrastructure | tmux | pty-wrapper | Shared FS |
| Complexity | Low | Medium | Low |
| Reliability | Good | Best | Good |
| Latency | Low | Lowest | Higher |

## License

MIT License - CodeHornets AI
