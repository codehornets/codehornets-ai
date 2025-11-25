# TmuxController

Node.js controller for sending commands to Claude Code TUI running in Docker containers via tmux sessions.

## Overview

This module provides a programmatic interface to interact with Claude Code instances running inside Docker containers. Each agent (orchestrator, marie, anga, fabien) runs Claude Code inside a tmux session, allowing external command injection.

## Installation

The module has no external dependencies and uses only Node.js built-in modules.

```bash
cd tmux-controller
npm install  # No dependencies to install
```

## Usage

### Programmatic Usage

```javascript
const TmuxController = require('./tmux-controller');

// Create controller instance
const controller = new TmuxController({
  verbose: true,  // Enable logging
  defaultTimeout: 30000  // 30 second timeout
});

// Send a message to an agent
const result = await controller.sendMessage('anga', 'Create a Python hello world script');
console.log(result);
// { success: true, message: 'Message sent to anga' }

// Get current screen output
const output = await controller.getOutput('anga', { lines: 50 });
console.log(output.output);

// Check if session is active
const isActive = await controller.isSessionActive('anga');
console.log(`Anga is ${isActive ? 'active' : 'inactive'}`);

// Send special keys
await controller.sendKey('anga', 'C-c');  // Ctrl+C to interrupt
await controller.sendKey('anga', 'Enter');

// Wait for agent to be ready
const ready = await controller.waitForReady('anga', { timeout: 60000 });

// Get all agents status
const status = await controller.getAllStatus();
console.log(status);
```

### CLI Usage

```bash
# Send a message
node index.js send anga "Create a Python function to validate emails"

# Get screen output
node index.js output anga 50

# Send special key
node index.js key anga C-c

# Check status
node index.js status
node index.js status anga

# Wait for agent to be ready
node index.js wait anga 60000
```

## API Reference

### Constructor

```javascript
new TmuxController(options)
```

Options:
- `tmuxSession` (string): tmux session name (default: 'claude')
- `defaultTimeout` (number): Default command timeout in ms (default: 30000)
- `verbose` (boolean): Enable verbose logging (default: false)

### Methods

#### `sendMessage(agent, message, options)`

Send a message to an agent's Claude TUI.

Parameters:
- `agent` (string): Agent name (orchestrator, marie, anga, fabien)
- `message` (string): Message to send
- `options.pressEnter` (boolean): Press Enter after message (default: true)
- `options.timeout` (number): Command timeout in ms

Returns: `Promise<{success: boolean, message: string}>`

#### `sendKey(agent, key, options)`

Send a special key to an agent's Claude TUI.

Parameters:
- `agent` (string): Agent name
- `key` (string): Key to send (e.g., 'Enter', 'C-c', 'Escape', 'Up', 'Down')
- `options.timeout` (number): Command timeout in ms

Returns: `Promise<{success: boolean, message: string}>`

#### `getOutput(agent, options)`

Get current screen output from an agent's Claude TUI.

Parameters:
- `agent` (string): Agent name
- `options.lines` (number): Number of history lines to capture (default: 100)
- `options.timeout` (number): Command timeout in ms

Returns: `Promise<{success: boolean, output: string, message: string}>`

#### `isSessionActive(agent)`

Check if tmux session is active for an agent.

Returns: `Promise<boolean>`

#### `isContainerRunning(agent)`

Check if a container is running.

Returns: `Promise<boolean>`

#### `getAllStatus()`

Get status of all agents.

Returns: `Promise<Object>` - Status object for all agents

#### `waitForReady(agent, options)`

Wait for agent to become ready.

Parameters:
- `agent` (string): Agent name
- `options.timeout` (number): Maximum wait time in ms (default: 60000)
- `options.interval` (number): Check interval in ms (default: 2000)

Returns: `Promise<boolean>` - True if ready, false if timeout

#### `interrupt(agent)`

Send Ctrl+C to interrupt current operation.

#### `exitClaude(agent)`

Send /exit command to quit Claude.

#### `clearConversation(agent)`

Send /clear command to clear the conversation.

## Agents

| Agent | Container | Role |
|-------|-----------|------|
| orchestrator | codehornets-orchestrator | orchestrator |
| marie | codehornets-worker-marie | worker |
| anga | codehornets-worker-anga | worker |
| fabien | codehornets-worker-fabien | worker |

## Special Keys

Common tmux key codes:
- `Enter` - Enter key
- `C-c` - Ctrl+C
- `C-d` - Ctrl+D
- `Escape` - Escape key
- `Up` - Arrow up
- `Down` - Arrow down
- `Left` - Arrow left
- `Right` - Arrow right
- `Tab` - Tab key
- `BSpace` - Backspace

## Error Handling

All methods return objects with a `success` boolean and `message` string. Check `success` to determine if the operation succeeded.

```javascript
const result = await controller.sendMessage('anga', 'test');
if (!result.success) {
  console.error('Failed:', result.message);
}
```

## Integration with Make

Use with Makefile targets:

```bash
make tmux-send AGENT=anga MSG="Hello"
make tmux-output AGENT=anga
make tmux-status
```
