# Claude Code Stdin Injection Toolkit

Enables programmatic injection of prompts into Claude Code's interactive TUI.

## The Problem

Claude Code's TUI uses Ink (React for CLI) which requires raw TTY mode. When stdin comes from a pipe, it fails:

```
Raw mode is not supported on the current process.stdin
```

## Solutions

This toolkit provides two approaches:

### Option A: PTY Wrapper (No Code Modification)

Wraps Claude in a pseudo-TTY, allowing you to inject keystrokes via socket.

```bash
# Install dependency
npm install node-pty

# Run Claude with injection enabled
node claude-inject-wrapper.js

# From another terminal, inject a prompt:
echo "explain this code" | nc -U /tmp/claude-inject.sock
```

**Pros:** No modification to Claude Code
**Cons:** Requires node-pty (native addon), injects as keystrokes

### Option B: Code Patch (Direct Injection)

Patches Claude Code to expose a global injection handler.

```bash
# Apply the patch
chmod +x apply-claude-inject.sh
./apply-claude-inject.sh

# Run Claude normally - it now has injection capability
claude

# Inject via the global (same Node process or via IPC you implement)
global.__CLAUDE_INJECT__("your prompt here");
```

**Pros:** Clean API, auto-submits, access to internal state
**Cons:** Requires patching (re-apply after updates)

## Files

| File | Purpose |
|------|---------|
| `apply-claude-inject.sh` | Shell script to patch Claude Code |
| `claude-inject.patch` | Git-style patch (for prettified cli.js) |
| `claude-inject-wrapper.js` | PTY wrapper with socket injection |
| `claude-inject.js` | Client to send prompts to running Claude |

## API Reference

### PTY Wrapper Method

```bash
# Start Claude with injection server
node claude-inject-wrapper.js [any claude args]

# Socket location (customizable)
export CLAUDE_INJECT_SOCKET=/tmp/claude-inject.sock

# Inject prompt (will auto-submit with Enter)
echo "your prompt" | nc -U /tmp/claude-inject.sock

# Or from Node.js
require('net').connect('/tmp/claude-inject.sock').end('your prompt');
```

### Code Patch Method

After patching, these globals are available:

```javascript
// Direct injection (auto-submits by default)
global.__CLAUDE_INJECT__(text, autoSubmit = true);

// Event-based injection
global.__CLAUDE_INJECT_EMITTER__.emit('inject', text, autoSubmit);

// Set text without submitting
global.__CLAUDE_INJECT__("draft text", false);
```

## Integration Examples

### Shell Script Automation

```bash
#!/bin/bash
# Run a sequence of prompts

SOCKET=/tmp/claude-inject.sock

inject() {
    echo "$1" | nc -U $SOCKET
    sleep 2  # Wait for response
}

inject "read the package.json"
inject "explain the dependencies"
inject "suggest improvements"
```

### Node.js Controller

```javascript
const net = require('net');
const SOCKET = '/tmp/claude-inject.sock';

async function askClaude(prompt) {
    return new Promise((resolve, reject) => {
        const client = net.connect(SOCKET, () => {
            client.write(prompt);
            client.end();
        });
        client.on('end', () => resolve());
        client.on('error', reject);
    });
}

// Use it
await askClaude("analyze this codebase");
await askClaude("create a README");
```

### Python Integration

```python
import socket

def inject_prompt(text, socket_path='/tmp/claude-inject.sock'):
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.connect(socket_path)
        s.sendall(text.encode())
        s.shutdown(socket.SHUT_WR)
        return s.recv(1024).decode()

inject_prompt("refactor the main function")
```

## Troubleshooting

### "Socket not found"
Claude isn't running with the wrapper, or patch didn't apply correctly.

### "Cannot find module 'node-pty'"
```bash
npm install node-pty
```

### Patch doesn't apply
The cli.js structure may have changed. Check the version and adjust line numbers in the patch.

### Restore original
```bash
# The backup location is printed when you run the patch script
cp /path/to/cli.js.backup.TIMESTAMP /path/to/cli.js
```

## How It Works

### PTY Wrapper
1. Spawns Claude in a pseudo-TTY using node-pty
2. Creates a Unix socket server
3. Incoming data on socket is written to PTY as keystrokes
4. Enter key is sent to submit

### Code Patch
1. Locates the main REPL component in cli.js
2. Adds a useEffect hook that:
   - Creates a global EventEmitter
   - Exposes `__CLAUDE_INJECT__` function
   - Function calls the internal `setInputValue` (QQ) and `submit` (CG) handlers

## Key Variables in cli.js

From reverse engineering the minified code:

| Minified | Purpose |
|----------|---------|
| `IB` | Input value state |
| `QQ` | setInputValue setter |
| `CG` | Submit handler (calls SJ0) |
| `bXA` | Main REPL component |
| `rQ` | React import |

## Security Considerations

- The socket is created with mode 0666 (world-writable)
- Anyone with local access can inject prompts
- Consider restricting permissions or using authentication for production use

## License

MIT - Use at your own risk. This is unofficial and may break with Claude Code updates.
