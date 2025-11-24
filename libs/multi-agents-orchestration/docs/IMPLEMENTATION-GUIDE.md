# PTY/Socat IPC Implementation Guide - Practical Examples

This guide provides working implementations for each approach to send input to Claude Code TUI running in Docker.

---

## Implementation 1: Native Docker Attach (Baseline)

### Use Case
Local development, interactive debugging, single terminal session.

### Advantages
- Full PTY semantics out-of-the-box
- Proper signal handling (with `--init`)
- Window resize synchronization
- Zero additional complexity

### Code Example

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install needed packages
RUN apk add --no-cache tini

COPY package*.json ./
RUN npm install

COPY . .

# Use tini to handle signals
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "claude-code.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  agent:
    build: .
    init: true  # Use docker init
    stdin_open: true
    tty: true
    environment:
      - TERM=xterm-256color
```

**Usage**:
```bash
# Start container in background
docker-compose up -d agent

# Attach to interactive session
docker attach $(docker-compose ps -q agent)

# Type commands directly
ls
help
quit
```

### Limitations
- Only works for single terminal (can't have multiple parallel connections)
- Platform-specific: Linux/Mac work, Windows (Docker Desktop) works with limitations
- Requires human interaction or shell script with expect/socat wrapper

---

## Implementation 2: TIOCSTI Direct Injection (Low-Level)

### Use Case
Injecting individual characters or sequences into a known PTY from another process.

### Advantages
- Direct kernel API
- No relay process needed
- Low overhead

### Code Example

**Node.js TTY File Discovery**:
```javascript
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function getTTYPath(containerName) {
  return new Promise((resolve, reject) => {
    exec(`docker exec ${containerName} tty`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      // Output like: /dev/pts/0
      resolve(stdout.trim());
    });
  });
}

async function getTTYPathOnHost(containerPID) {
  // Map PID to its TTY
  // /proc/{PID}/fd/0 -> symlink to actual tty
  try {
    const fdPath = fs.readlinkSync(`/proc/${containerPID}/fd/0`);
    return fdPath;
  } catch (err) {
    return null;
  }
}
```

**Python TIOCSTI Injection**:
```python
#!/usr/bin/env python3
import fcntl
import termios
import sys
import subprocess

def get_tty_path(container_name):
    """Get the TTY path inside a container"""
    result = subprocess.run(
        ['docker', 'exec', container_name, 'tty'],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def inject_text_via_tiocsti(tty_path, text):
    """
    Inject text into a TTY using TIOCSTI ioctl.

    Requirements:
    - Root or CAP_SYS_ADMIN capability
    - Kernel CONFIG_LEGACY_TIOCSTI enabled
    - Linux only (not macOS/Windows)
    """
    try:
        with open(tty_path, 'w') as fd:
            for char in text:
                try:
                    fcntl.ioctl(fd, termios.TIOCSTI, char.encode())
                except OSError as e:
                    print(f"Error injecting '{char}': {e}", file=sys.stderr)
                    # Check if TIOCSTI is disabled
                    if "Operation not permitted" in str(e):
                        print("TIOCSTI may be disabled in kernel", file=sys.stderr)
                        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

    return True

def check_tiocsti_available():
    """Check if TIOCSTI is available on this kernel"""
    try:
        status = open('/proc/sys/dev/tty/legacy_tiocsti').read().strip()
        return status == '1'
    except FileNotFoundError:
        # Parameter might not exist in all kernels
        return None  # Unknown

# Usage example
if __name__ == '__main__':
    container_name = 'agent-marie'

    # Check TIOCSTI availability
    available = check_tiocsti_available()
    if available is False:
        print("ERROR: TIOCSTI is disabled in kernel config")
        print("Enable with: echo 1 > /proc/sys/dev/tty/legacy_tiocsti")
        sys.exit(1)

    # Get TTY path
    tty_path = get_tty_path(container_name)
    print(f"Using TTY: {tty_path}")

    # Inject command
    success = inject_text_via_tiocsti(tty_path, "ls -la\n")

    if success:
        print("Command injected successfully")
    else:
        print("Failed to inject command")
        sys.exit(1)
```

### Limitations
- Requires root or CAP_SYS_ADMIN
- Disabled in Linux kernels 6.2+ by default
- Character-by-character (4096 limit)
- Only works on Linux
- Slow for large inputs

---

## Implementation 3: socat with docker attach (Pipe-Based)

### Use Case
Sending commands to a container via shell pipe (non-interactive or limited interactive).

### Advantages
- Simple shell commands
- Works cross-platform (except macOS quirk)
- No additional infrastructure

### Code Example

**Basic Shell Usage**:
```bash
#!/bin/bash

CONTAINER_NAME="agent-marie"

# Single command
echo "help" | socat EXEC:"docker attach $CONTAINER_NAME",pty STDIN

# Multiple commands (with delays for processing)
{
  echo "status"
  sleep 0.5
  echo "list-tasks"
  sleep 0.5
  echo "help"
} | socat EXEC:"docker attach $CONTAINER_NAME",pty,rawer STDIN
```

**Node.js Wrapper**:
```javascript
const { spawn } = require('child_process');

async function sendCommandViaSocat(containerName, command) {
  return new Promise((resolve, reject) => {
    // Start socat subprocess
    const socat = spawn('socat', [
      'EXEC:docker attach ' + containerName + ',pty,rawer',
      'STDIN'
    ]);

    let output = '';
    let error = '';

    socat.stdout.on('data', (data) => {
      output += data.toString();
    });

    socat.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Send command through stdin
    socat.stdin.write(command + '\n');

    // Wait a bit for output, then close
    setTimeout(() => {
      socat.stdin.end();
    }, 1000);

    socat.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`socat exited with code ${code}: ${error}`));
      }
    });

    socat.on('error', (err) => {
      reject(err);
    });
  });
}

// Usage
sendCommandViaSocat('agent-marie', 'help')
  .then(output => console.log('Output:', output))
  .catch(err => console.error('Error:', err));
```

**Shell Script with Error Handling**:
```bash
#!/bin/bash

send_command_to_container() {
  local container=$1
  local command=$2
  local timeout=${3:-5}

  # Check if socat is available
  if ! command -v socat &> /dev/null; then
    echo "ERROR: socat not found. Install with: apt install socat"
    return 1
  fi

  # Check if container is running
  if ! docker ps | grep -q "$container"; then
    echo "ERROR: Container '$container' not running"
    return 1
  fi

  # Send command with timeout
  echo "$command" | timeout $timeout socat EXEC:"docker attach $container",pty,rawer STDIN

  local exit_code=$?

  if [ $exit_code -eq 124 ]; then
    echo "WARNING: Command timed out after ${timeout}s"
    return 1
  elif [ $exit_code -ne 0 ]; then
    echo "ERROR: socat failed with exit code $exit_code"
    return 1
  fi

  return 0
}

# Usage
send_command_to_container "agent-marie" "status" 5
```

### Limitations
- **macOS Incompatibility**: The `EXEC:"docker attach",pty` fails with "Bad file descriptor"
- Non-interactive: Commands execute but you can't have a real back-and-forth conversation
- Window resize: Not propagated through relay
- Buffering: Output may not appear immediately
- Echo control: Can be doubled or missing depending on pty flags

---

## Implementation 4: socat with TCP Relay (Network)

### Use Case
Remote access to container TUI, network transparency.

### Advantages
- Network-transparent: can connect from other machines
- Full PTY through network
- Clean separation of relay and consumer

### Code Example

**Docker Compose with Relay Service**:
```yaml
version: '3.8'

services:
  # The actual TUI application
  agent-marie:
    build:
      context: ./agents/marie
    stdin_open: true
    tty: true
    init: true
    environment:
      - TERM=xterm-256color
      - NODE_ENV=production
    networks:
      - agent-network

  # Relay service for remote access
  marie-pty-relay:
    image: alpine:latest
    depends_on:
      - agent-marie
    command: |
      sh -c '
        apk add --no-cache socat

        # Forward container PTY to TCP port
        socat \
          EXEC:"docker attach agent-marie",pty,rawer \
          TCP4-LISTEN:9001,reuseaddr,fork
      '
    ports:
      - "9001:9001"
    networks:
      - agent-network
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

networks:
  agent-network:
    driver: bridge
```

**Remote Client Script (Python)**:
```python
#!/usr/bin/env python3
import socket
import sys
import time

class RemoteContainerClient:
    def __init__(self, host, port, timeout=5):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.socket = None

    def connect(self):
        """Connect to the socat relay"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.host, self.port))
            print(f"Connected to {self.host}:{self.port}")
            return True
        except socket.error as e:
            print(f"Connection failed: {e}", file=sys.stderr)
            return False

    def send_command(self, command):
        """Send command and wait for response"""
        if not self.socket:
            print("Not connected", file=sys.stderr)
            return None

        try:
            # Send command
            self.socket.sendall((command + '\n').encode())

            # Receive response
            response = b''
            while True:
                try:
                    chunk = self.socket.recv(4096)
                    if not chunk:
                        break
                    response += chunk
                except socket.timeout:
                    break

            return response.decode('utf-8', errors='replace')
        except socket.error as e:
            print(f"Error: {e}", file=sys.stderr)
            return None

    def close(self):
        """Close connection"""
        if self.socket:
            self.socket.close()

    def interactive_session(self):
        """Start interactive shell"""
        if not self.connect():
            return False

        print("Connected to remote container. Type 'quit' to exit.")
        print("Note: Window resize not auto-synced, use 'stty rows X cols Y' if needed\n")

        try:
            while True:
                try:
                    command = input(">>> ")
                    if command.lower() == 'quit':
                        break

                    response = self.send_command(command)
                    if response:
                        print(response)
                except KeyboardInterrupt:
                    print("\n(Ctrl-C received)")
                    break
        finally:
            self.close()

# Usage
if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else 'localhost'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9001

    client = RemoteContainerClient(host, port)
    client.interactive_session()
```

**Node.js Client**:
```javascript
const net = require('net');
const readline = require('readline');

class RemoteContainerClient {
  constructor(host = 'localhost', port = 9001) {
    this.host = host;
    this.port = port;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(this.port, this.host, () => {
        console.log(`Connected to ${this.host}:${this.port}`);
        resolve();
      });

      this.socket.on('error', (err) => {
        console.error('Connection error:', err.message);
        reject(err);
      });
    });
  }

  sendCommand(command) {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(null);
        return;
      }

      let response = '';
      const timeout = setTimeout(() => {
        responseHandler();
      }, 1000);

      const responseHandler = () => {
        clearTimeout(timeout);
        resolve(response);
      };

      this.socket.once('data', (data) => {
        response = data.toString();
        responseHandler();
      });

      this.socket.write(command + '\n');
    });
  }

  async interactiveSession() {
    try {
      await this.connect();

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askQuestion = () => {
        rl.question('>>> ', async (command) => {
          if (command.toLowerCase() === 'quit') {
            rl.close();
            this.socket.destroy();
            return;
          }

          const response = await this.sendCommand(command);
          if (response) {
            console.log(response);
          }

          askQuestion();
        });
      };

      askQuestion();
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  }
}

// Usage
const client = new RemoteContainerClient(
  process.argv[2] || 'localhost',
  parseInt(process.argv[3]) || 9001
);

client.interactiveSession();
```

**Bash Client**:
```bash
#!/bin/bash

# Simple TCP client for container relay
HOST=${1:-localhost}
PORT=${2:-9001}

# Check connectivity
if ! (echo > /dev/tcp/$HOST/$PORT) 2>/dev/null; then
  echo "ERROR: Cannot connect to $HOST:$PORT"
  exit 1
fi

echo "Connected to $HOST:$PORT"
echo "Type 'quit' to exit"

# Use socat as client
socat - TCP:$HOST:$PORT
```

### Limitations
- Window size not auto-synced (must manually `stty rows X cols Y`)
- Network latency adds to input/output delays
- Relay needs to be running (separate service)
- Stateless relay: each TCP connection gets fresh environment

---

## Implementation 5: socat with Unix Socket (IPC)

### Use Case
Inter-container communication, local IPC without network overhead.

### Advantages
- Same container can run both relay and consumer
- Fastest local IPC (Unix socket vs network)
- Clean separation of concerns
- Can be mounted as shared volume

### Code Example

**Docker Compose Setup**:
```yaml
version: '3.8'

services:
  agent-marie:
    build:
      context: ./agents/marie
    stdin_open: true
    tty: true
    init: true
    environment:
      - TERM=xterm-256color
    volumes:
      # Shared socket directory
      - agent-sockets:/tmp/agent-sockets
    networks:
      - agent-network

  marie-socket-relay:
    image: alpine:latest
    depends_on:
      - agent-marie
    command: |
      sh -c '
        apk add --no-cache socat

        # Forward container PTY to Unix socket
        # Socket on shared volume accessible to orchestrator
        mkdir -p /tmp/agent-sockets

        socat \
          EXEC:"docker attach agent-marie",pty,rawer \
          UNIX-LISTEN:/tmp/agent-sockets/marie.sock,fork,reuseaddr
      '
    volumes:
      - agent-sockets:/tmp/agent-sockets
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - agent-network

  orchestrator:
    build:
      context: ./orchestrator
    init: true
    stdin_open: true
    tty: true
    depends_on:
      - marie-socket-relay
    volumes:
      # Access the same socket directory
      - agent-sockets:/tmp/agent-sockets
    networks:
      - agent-network

volumes:
  agent-sockets:
    driver: local

networks:
  agent-network:
    driver: bridge
```

**Node.js IPC Client**:
```javascript
const net = require('net');
const fs = require('fs');

class AgentIPCClient {
  constructor(socketPath) {
    this.socketPath = socketPath;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Check socket exists
      if (!fs.existsSync(this.socketPath)) {
        reject(new Error(`Socket not found: ${this.socketPath}`));
        return;
      }

      this.socket = net.createConnection(this.socketPath, () => {
        console.log(`Connected to ${this.socketPath}`);
        resolve();
      });

      this.socket.on('error', (err) => {
        reject(new Error(`Socket error: ${err.message}`));
      });
    });
  }

  async sendCommand(command, timeout = 2000) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      let response = '';
      let timeoutHandle;

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        this.socket.removeListener('data', dataHandler);
      };

      const dataHandler = (data) => {
        response += data.toString();
      };

      this.socket.on('data', dataHandler);

      timeoutHandle = setTimeout(() => {
        cleanup();
        resolve(response);
      }, timeout);

      // Send command
      this.socket.write(command + '\n', (err) => {
        if (err) {
          cleanup();
          reject(err);
        }
      });
    });
  }

  close() {
    if (this.socket) {
      this.socket.destroy();
    }
  }
}

// Example orchestrator that controls multiple agents
class Orchestrator {
  constructor() {
    this.agents = {
      marie: new AgentIPCClient('/tmp/agent-sockets/marie.sock'),
      anga: new AgentIPCClient('/tmp/agent-sockets/anga.sock'),
      fabien: new AgentIPCClient('/tmp/agent-sockets/fabien.sock')
    };
  }

  async initialize() {
    // Connect to all agents
    const promises = Object.entries(this.agents).map(
      ([name, client]) =>
        client.connect()
          .then(() => console.log(`Connected to ${name}`))
          .catch(err => console.warn(`Failed to connect to ${name}: ${err.message}`))
    );

    await Promise.allSettled(promises);
  }

  async sendToAgent(agentName, command) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    return agent.sendCommand(command);
  }

  async broadcastCommand(command) {
    const results = {};
    for (const [name, agent] of Object.entries(this.agents)) {
      try {
        results[name] = await agent.sendCommand(command);
      } catch (err) {
        results[name] = `Error: ${err.message}`;
      }
    }
    return results;
  }

  cleanup() {
    for (const agent of Object.values(this.agents)) {
      agent.close();
    }
  }
}

// Usage example
async function main() {
  const orchestrator = new Orchestrator();

  try {
    await orchestrator.initialize();

    // Get status from Marie
    const marieStatus = await orchestrator.sendToAgent('marie', 'status');
    console.log('Marie status:', marieStatus);

    // Broadcast command to all agents
    const allResults = await orchestrator.broadcastCommand('help');
    console.log('All results:', allResults);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    orchestrator.cleanup();
  }
}

main();
```

**Python IPC Client**:
```python
#!/usr/bin/env python3
import socket
import os
import time
from typing import Optional, Dict

class AgentIPCClient:
    def __init__(self, socket_path: str):
        self.socket_path = socket_path
        self.socket = None
        self.timeout = 5

    def connect(self) -> bool:
        """Connect to agent socket"""
        if not os.path.exists(self.socket_path):
            print(f"ERROR: Socket not found: {self.socket_path}")
            return False

        try:
            self.socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect(self.socket_path)
            print(f"Connected to {self.socket_path}")
            return True
        except socket.error as e:
            print(f"Connection error: {e}")
            return False

    def send_command(self, command: str, timeout: Optional[float] = None) -> Optional[str]:
        """Send command and receive response"""
        if not self.socket:
            print("Not connected")
            return None

        timeout = timeout or self.timeout

        try:
            old_timeout = self.socket.gettimeout()
            self.socket.settimeout(timeout)

            # Send command
            self.socket.sendall((command + '\n').encode())

            # Receive response
            response = b''
            while True:
                try:
                    chunk = self.socket.recv(4096)
                    if not chunk:
                        break
                    response += chunk
                except socket.timeout:
                    break

            self.socket.settimeout(old_timeout)
            return response.decode('utf-8', errors='replace')
        except socket.error as e:
            print(f"Error: {e}")
            return None

    def close(self):
        """Close connection"""
        if self.socket:
            self.socket.close()


class Orchestrator:
    def __init__(self, socket_dir: str = '/tmp/agent-sockets'):
        self.socket_dir = socket_dir
        self.agents = {
            'marie': AgentIPCClient(f'{socket_dir}/marie.sock'),
            'anga': AgentIPCClient(f'{socket_dir}/anga.sock'),
            'fabien': AgentIPCClient(f'{socket_dir}/fabien.sock')
        }

    def initialize(self) -> bool:
        """Connect to all agents"""
        all_connected = True
        for name, agent in self.agents.items():
            if agent.connect():
                print(f"✓ Connected to {name}")
            else:
                print(f"✗ Failed to connect to {name}")
                all_connected = False
        return all_connected

    def send_to_agent(self, agent_name: str, command: str) -> Optional[str]:
        """Send command to specific agent"""
        if agent_name not in self.agents:
            print(f"Unknown agent: {agent_name}")
            return None
        return self.agents[agent_name].send_command(command)

    def broadcast(self, command: str) -> Dict[str, Optional[str]]:
        """Send command to all agents"""
        results = {}
        for name, agent in self.agents.items():
            results[name] = agent.send_command(command)
        return results

    def cleanup(self):
        """Close all connections"""
        for agent in self.agents.values():
            agent.close()


# Usage example
if __name__ == '__main__':
    orchestrator = Orchestrator()

    if orchestrator.initialize():
        # Send to single agent
        status = orchestrator.send_to_agent('marie', 'status')
        if status:
            print(f"Marie response:\n{status}")

        # Broadcast to all
        results = orchestrator.broadcast('help')
        for agent_name, response in results.items():
            print(f"\n{agent_name.upper()}:\n{response}")

    orchestrator.cleanup()
```

**Bash Client for Socket Access**:
```bash
#!/bin/bash

SOCKET_PATH=${1:-/tmp/agent-sockets/marie.sock}
COMMAND=${2:-help}

if [ ! -S "$SOCKET_PATH" ]; then
  echo "ERROR: Socket not found: $SOCKET_PATH"
  echo "Available sockets:"
  ls -la /tmp/agent-sockets/ 2>/dev/null || echo "  (none)"
  exit 1
fi

# Use socat as client
echo "$COMMAND" | socat - UNIX-CONNECT:$SOCKET_PATH
```

### Limitations
- Requires shared volume or host access to socket
- Socket cleanup needed if relay crashes
- Still limited window resize (though less overhead than TCP)

---

## Implementation 6: reptyr for Process Reparenting

### Use Case
Attaching to an already-running Node.js TUI process from another terminal.

### Advantages
- Full terminal semantics (everything works)
- Proper signal propagation
- Window resize synchronization
- Process can be running in background first

### Code Example

**Dockerfile with reptyr**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache \
    tini \
    reptyr \
    bash

COPY package*.json ./
RUN npm install

COPY . .

# Security: enable ptrace for reptyr to work
# (Usually needs --security-opt or --cap-add at runtime)

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "claude-code.js"]
```

**Docker run with reptyr support**:
```bash
docker run \
  --init \
  --cap-add=SYS_PTRACE \
  --security-opt apparmor=unconfined \
  --interactive \
  --tty \
  myagent
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  agent-marie:
    build: .
    init: true
    cap_add:
      - SYS_PTRACE
    security_opt:
      - apparmor=unconfined
    stdin_open: true
    tty: true
    environment:
      - TERM=xterm-256color
    command: node marie-tui.js
```

**Bash Script to Reparent Process**:
```bash
#!/bin/bash

CONTAINER_NAME=$1
TIMEOUT=${2:-10}

if [ -z "$CONTAINER_NAME" ]; then
  echo "Usage: $0 <container-name> [timeout]"
  exit 1
fi

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
  echo "ERROR: Container '$CONTAINER_NAME' not running"
  exit 1
fi

# Find the Node.js process in container
echo "Finding Node.js process..."
NODE_PID=$(docker exec $CONTAINER_NAME pgrep -f 'node' | head -1)

if [ -z "$NODE_PID" ]; then
  echo "ERROR: No node process found in container"
  exit 1
fi

echo "Found Node.js PID: $NODE_PID"

# Reparent to new terminal
echo "Reparenting process $NODE_PID to new terminal..."
docker exec --interactive --tty $CONTAINER_NAME reptyr $NODE_PID

if [ $? -eq 0 ]; then
  echo "Successfully attached process!"
else
  echo "ERROR: Failed to reparent process"
  echo "Troubleshooting:"
  echo "  1. Check ptrace is enabled: cat /proc/sys/kernel/yama/ptrace_scope"
  echo "  2. If not 0, enable: sysctl kernel.yama.ptrace_scope=0"
  echo "  3. Check capabilities: docker inspect $CONTAINER_NAME | grep Cap"
  exit 1
fi
```

**Python Helper**:
```python
#!/usr/bin/env python3
import subprocess
import sys
import os

def enable_ptrace_scope(scope=0):
    """Set ptrace scope (requires root)"""
    try:
        with open('/proc/sys/kernel/yama/ptrace_scope', 'w') as f:
            f.write(str(scope))
        print(f"ptrace_scope set to {scope}")
    except PermissionError:
        print("WARNING: Cannot set ptrace_scope (need root)")
        print("Run: sudo sysctl kernel.yama.ptrace_scope=0")

def get_container_pid(container_name):
    """Get main PID of container on host"""
    result = subprocess.run(
        ['docker', 'inspect', '-f', '{{.State.Pid}}', container_name],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def get_nodejs_pid_in_container(container_name):
    """Find Node.js process inside container"""
    result = subprocess.run(
        ['docker', 'exec', container_name, 'pgrep', '-f', 'node'],
        capture_output=True,
        text=True
    )
    pids = result.stdout.strip().split('\n')
    return pids[0] if pids else None

def reparent_process(container_name, pid):
    """Use reptyr to reparent process"""
    print(f"Attempting to reparent PID {pid}...")

    cmd = [
        'docker', 'exec',
        '--interactive', '--tty',
        container_name,
        'reptyr', pid
    ]

    result = subprocess.run(cmd)
    return result.returncode == 0

def main():
    if len(sys.argv) < 2:
        print("Usage: reptyr-attach.py <container-name>")
        sys.exit(1)

    container_name = sys.argv[1]

    # Get Node.js PID inside container
    node_pid = get_nodejs_pid_in_container(container_name)

    if not node_pid:
        print(f"ERROR: No Node.js process found in {container_name}")
        sys.exit(1)

    print(f"Found Node.js PID: {node_pid}")

    # Attempt to reparent
    if not reparent_process(container_name, node_pid):
        print("\nFailed to reparent. Troubleshooting...")

        # Check ptrace scope
        try:
            with open('/proc/sys/kernel/yama/ptrace_scope') as f:
                scope = int(f.read().strip())
            if scope != 0:
                print(f"  ptrace_scope is {scope} (need 0)")
                print("  Run: sudo sysctl kernel.yama.ptrace_scope=0")
        except:
            pass

        sys.exit(1)

if __name__ == '__main__':
    main()
```

### Limitations
- **Requires privileged capabilities**: SYS_PTRACE, apparmor=unconfined
- **ptrace_scope must be 0**: Default on many systems is 1 (restricted)
- **Doesn't work with process children**: Multi-process TUIs problematic
- **Curses redraw needed**: Some TUIs need Ctrl-L to redraw after reparenting
- **Not available on Windows/macOS**: Only works on Linux

---

## Implementation 7: Named Pipes (FIFO) for Simplicity

### Use Case
Basic command execution, minimum infrastructure, debugging.

### Advantages
- No relay process needed
- Simple file-based IPC
- Works on any platform
- Easy to debug (can see fifos)

### Code Example

**Setup Script**:
```bash
#!/bin/bash

AGENT_NAME=${1:-marie}
SOCKET_DIR=${2:-/tmp/agent-io}

echo "Setting up FIFOs for agent '$AGENT_NAME'..."

# Create directory
mkdir -p "$SOCKET_DIR/$AGENT_NAME"

# Create named pipes
mkfifo "$SOCKET_DIR/$AGENT_NAME/stdin"  2>/dev/null || true
mkfifo "$SOCKET_DIR/$AGENT_NAME/stdout" 2>/dev/null || true
mkfifo "$SOCKET_DIR/$AGENT_NAME/stderr" 2>/dev/null || true

# Set permissions
chmod 666 "$SOCKET_DIR/$AGENT_NAME"/*

echo "FIFOs created:"
ls -la "$SOCKET_DIR/$AGENT_NAME/"

echo ""
echo "Usage from host:"
echo "  Send: echo 'command' > $SOCKET_DIR/$AGENT_NAME/stdin"
echo "  Read: cat $SOCKET_DIR/$AGENT_NAME/stdout"
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  agent-marie:
    build:
      context: ./agents/marie
    command: |
      bash -c "
        exec 0</tmp/agent-io/marie/stdin
        exec 1>/tmp/agent-io/marie/stdout
        exec 2>/tmp/agent-io/marie/stderr
        node marie-tui.js
      "
    volumes:
      - /tmp/agent-io:/tmp/agent-io

  agent-anga:
    build:
      context: ./agents/anga
    command: |
      bash -c "
        exec 0</tmp/agent-io/anga/stdin
        exec 1>/tmp/agent-io/anga/stdout
        exec 2>/tmp/agent-io/anga/stderr
        node anga-tui.js
      "
    volumes:
      - /tmp/agent-io:/tmp/agent-io
```

**Node.js Client**:
```javascript
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class FIFOAgent {
  constructor(name, baseDir = '/tmp/agent-io') {
    this.name = name;
    this.stdinPath = path.join(baseDir, name, 'stdin');
    this.stdoutPath = path.join(baseDir, name, 'stdout');
    this.stderrPath = path.join(baseDir, name, 'stderr');

    this.stdoutStream = null;
    this.stderrStream = null;
  }

  async sendCommand(command) {
    return new Promise((resolve, reject) => {
      // Check FIFOs exist
      try {
        fs.accessSync(this.stdinPath, fs.constants.W_OK);
      } catch (err) {
        reject(new Error(`FIFO not accessible: ${this.stdinPath}`));
        return;
      }

      // Collect output
      let stdout = '';
      let stderr = '';

      // Start reading stdout before writing
      const stdoutStream = fs.createReadStream(this.stdoutPath);
      const stderrStream = fs.createReadStream(this.stderrPath);

      stdoutStream.on('data', (data) => {
        stdout += data.toString();
      });

      stderrStream.on('data', (data) => {
        stderr += data.toString();
      });

      // Write command with delay to let readers attach
      setTimeout(() => {
        fs.appendFile(this.stdinPath, command + '\n', (err) => {
          if (err) {
            stdoutStream.destroy();
            stderrStream.destroy();
            reject(err);
            return;
          }

          // Wait for output
          setTimeout(() => {
            stdoutStream.destroy();
            stderrStream.destroy();
            resolve({ stdout, stderr });
          }, 500);
        });
      }, 100);
    });
  }
}

// Usage
async function main() {
  const agent = new FIFOAgent('marie');

  try {
    const result = await agent.sendCommand('help');
    console.log('STDOUT:', result.stdout);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
```

**Python Helper**:
```python
#!/usr/bin/env python3
import os
import time
from pathlib import Path
from typing import Optional, Tuple

class FIFOAgent:
    def __init__(self, name: str, base_dir: str = '/tmp/agent-io'):
        self.name = name
        self.base_dir = base_dir
        self.stdin_path = Path(base_dir) / name / 'stdin'
        self.stdout_path = Path(base_dir) / name / 'stdout'
        self.stderr_path = Path(base_dir) / name / 'stderr'

    def send_command(self, command: str, timeout: float = 2.0) -> Tuple[str, str]:
        """Send command and read response"""

        # Check FIFOs exist
        if not all(p.exists() for p in [self.stdin_path, self.stdout_path, self.stderr_path]):
            raise FileNotFoundError(f"FIFOs not found for {self.name}")

        # Write command
        with open(self.stdin_path, 'w') as f:
            f.write(command + '\n')
            f.flush()

        # Read output with timeout
        stdout = ''
        stderr = ''

        start = time.time()

        try:
            with open(self.stdout_path, 'r', buffering=1) as out:
                while time.time() - start < timeout:
                    try:
                        line = out.readline()
                        if line:
                            stdout += line
                        else:
                            break
                    except Exception:
                        break

            with open(self.stderr_path, 'r', buffering=1) as err:
                while time.time() - start < timeout:
                    try:
                        line = err.readline()
                        if line:
                            stderr += line
                        else:
                            break
                    except Exception:
                        break
        except Exception as e:
            raise RuntimeError(f"Error reading output: {e}")

        return stdout, stderr

# Usage
if __name__ == '__main__':
    agent = FIFOAgent('marie')

    try:
        out, err = agent.send_command('help')
        print('Output:')
        print(out)
        if err:
            print('Errors:')
            print(err)
    except Exception as e:
        print(f'Error: {e}')
```

### Limitations
- No terminal semantics (no colors, no raw mode)
- No signal propagation (Ctrl-C doesn't work)
- No window metadata
- Line-based only (can't send individual keypresses)
- Blocking behavior on open
- Need manual cleanup on crashes

---

## Decision Matrix

Choose based on your requirements:

| Need | Solution | Complexity |
|------|----------|-----------|
| **Interactive local** | docker attach | Very Low |
| **Interactive remote** | socat TCP relay | Medium |
| **IPC between containers** | socat Unix socket | Medium |
| **Max fidelity** | reptyr reparenting | High |
| **Simplest setup** | Named pipes (FIFO) | Low |
| **Direct kernel API** | TIOCSTI | High (unreliable) |

---

## Testing Your Implementation

All code examples can be tested with:

```bash
# 1. Clone your repository
cd /workspace/@codehornets-ai/libs/multi-agents-orchestration

# 2. Start services
docker-compose up -d

# 3. Test connectivity
# (Use the appropriate client from above)

# 4. Monitor logs
docker-compose logs -f agent-marie

# 5. Verify with ps
docker exec agent-marie ps aux | grep node
```

