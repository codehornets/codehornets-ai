# PTY and Socat-Based IPC with Interactive TUI Applications in Docker

## Executive Summary

Sending text input to a Node.js TUI (Terminal User Interface) application running as PID 1 in a Docker container requires understanding how pseudo-terminals (PTY) work and the limitations of various IPC approaches. This research covers five distinct approaches with technical depth, practical examples, and specific limitations for each.

---

## Part 1: How PTY/TTY Works in Docker Containers

### 1.1 Pseudo-Terminal Fundamentals

A **pseudoterminal (PTY)** is a pair of virtual character devices that provide **bidirectional communication**:

- **Master end**: Controlled by a process (docker daemon or client)
- **Slave end**: Provides a terminal interface to the containerized application

From [Linux PTY documentation](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/):
> "Anything written on the master end is provided to the process on the slave end as though it was input typed on a terminal."

### 1.2 Docker's `-i` and `-t` Flags

These flags are fundamental to interactive container operations:

| Flag | Effect |
|------|--------|
| `-i` (interactive) | Attaches STDIN from host to container stdin |
| `-t` (tty) | Allocates a pseudo-terminal pair |
| `-it` (combined) | Creates true interactive mode with terminal semantics |

From [Baeldung on Linux](https://www.baeldung.com/linux/docker-run-interactive-tty-options):
> "The `-i` option adds a stdin stream, while `-t` allocates a pseudo-TTY master/slave pair with the slave part tied to the running process in the container and the master part tied to your docker command."

### 1.3 How Docker Attach Works Internally

When a user runs `docker attach <container>`:

1. **PTY Allocation**: Docker allocates a PTY pair during container creation
2. **File Descriptor Binding**: The slave end is bound to the container's process stdin/stdout/stderr
3. **Master FD Binding**: The master end is bound to the docker CLI's stdin/stdout
4. **Host Terminal State**: The docker CLI puts the host terminal into **raw mode** (disabling line buffering and special character interpretation)
5. **Signal Handling**: Control-C (SIGINT) is transmitted through the master end, triggering SIGINT in the container
6. **Window Size Sync**: SIGWINCH handler resizes the PTY when the terminal is resized

From [iximiuz.com](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/):
> "In reality it's more complicated, since care must be taken to put the host terminal into raw mode (where keys such as enter are not interpreted with any special meaning) and restore it on exit."

### 1.4 Why TUI Applications Need PTY

PTY/TTY functionality is **critical** for proper TUI operation because:

1. **Terminal Escape Sequences**: TUIs use ANSI escape codes for colors, cursor positioning, etc.
2. **Raw Mode Input**: Applications need unprocessed keyboard input (individual key presses, not line-buffered)
3. **Signal Propagation**: SIGINT (Ctrl-C) and SIGTSTP (Ctrl-Z) must reach the application
4. **Terminal Metadata**: Applications detect TTY to enable colored output, disable echo, etc.

---

## Part 2: Writing to /proc/PID/fd/0 (stdin File Descriptor)

### 2.1 The Critical Misconception

This approach **does not work as expected** despite appearing viable.

From [Stack Overflow discussion on fd access](https://stackoverflow.com/questions/73542495/writing-to-file-descriptor-0-stdin-only-affects-terminal-program-doesnt-read):
> "If the FD points to a terminal/pty, writing to `/proc/PID/fd/0` outputs data on the terminal display. But the program doesn't actually read it."

**Key distinction**: Opening `/proc/PID/fd/0` accesses the **file that PID has open on fd 0**, not PID's actual file descriptor. If that file is a PTY, you're writing to the PTY display, not the input queue.

### 2.2 Why This Fails

When you write to `/proc/PID/fd/0`:

```bash
# This APPEARS to work:
echo "ls" > /proc/1/fd/0

# But the Node.js process doesn't actually receive the input
# You're just writing to the display side of the PTY
```

The reason: **PTYs are bidirectional but asymmetric**. The master side receives input; the slave side sends/receives I/O. Writing directly to the file descriptor path doesn't inject into the input queue.

### 2.3 TIOCSTI Workaround: Terminal Input Simulation

The **TIOCSTI** ioctl can inject characters into the terminal input queue.

From [ioctl_tty(2) man pages](https://man7.org/linux/man-pages/man2/ioctl_tty.2.html):
> "TIOCSTI: Insert the given byte in the input queue."

**Python example**:

```python
import fcntl
import termios
import sys

def inject_input(tty_path, text):
    """Inject text into a TTY/PTY using TIOCSTI"""
    with open(tty_path, 'w') as fd:
        for char in text:
            fcntl.ioctl(fd, termios.TIOCSTI, char)

# Usage: inject into /dev/pts/1
inject_input('/dev/pts/1', 'ls\n')
```

**C example**:

```c
#include <fcntl.h>
#include <sys/ioctl.h>
#include <termios.h>

int inject_to_tty(const char *tty_path, const char *text) {
    int fd = open(tty_path, O_WRONLY);
    if (fd < 0) return -1;

    for (const char *p = text; *p; p++) {
        ioctl(fd, TIOCSTI, (unsigned char)*p);
    }
    close(fd);
    return 0;
}

// Usage: inject_to_tty("/dev/pts/1", "ls\n");
```

### 2.4 TIOCSTI Limitations

**Permissions**: Requires `CAP_SYS_ADMIN` capability.

```bash
# Docker: must add capability
docker run --cap-add=SYS_ADMIN ...
```

**Kernel Configuration**: Modern kernels (6.2+) have disabled TIOCSTI by default.

From [Stack Overflow on TIOCSTI alternatives](https://stackoverflow.com/questions/75675261/alternatives-to-tiocsti-now-that-is-disable-on-default-for-kernels-6-2):
> "The default kernel configuration has CONFIG_LEGACY_TIOCSTI=y which allows the TIOCSTI ioctl command by default, but a distro could have unset CONFIG_LEGACY_TIOCSTI for the kernel binaries they ship."

Check if available:

```bash
cat /proc/cmdline | grep -i tiocsti
cat /etc/sysctl.d/10-ptrace.conf | grep legacy_tiocsti
```

**Runtime control**:

```bash
# Check current status
cat /proc/sys/dev/tty/legacy_tiocsti

# Enable (requires root)
echo 1 > /proc/sys/dev/tty/legacy_tiocsti
```

**Speed**: Character-by-character injection is slow (4096 character limit on Linux).

**Verdict**: Not reliable for production due to kernel configuration variability.

---

## Part 3: Using socat for PTY Forwarding

### 3.1 What is socat?

From [Getting started with socat - Red Hat](https://www.redhat.com/sysadmin/getting-started-socat):
> "socat is a flexible, multi-purpose relay tool. Its purpose is to establish a relationship between two data sources, where each data source can be a file, a Unix socket, UDP, TCP, or standard input."

### 3.2 Docker attach via socat (Pipe-Based)

**Basic syntax**:

```bash
echo "command" | socat EXEC:"docker attach <container>",pty STDIN
```

**How it works**:

1. socat creates a pseudo-terminal pair
2. The `EXEC` option runs the command (`docker attach`)
3. The `pty` modifier allocates a PTY for the subprocess
4. stdin is piped to the PTY master
5. Output is captured and forwarded

**Example - send single command**:

```bash
echo "ls -la" | socat EXEC:"docker attach mycontainer",pty STDIN
```

**Example - interactive multi-command session**:

```bash
# Create a session with multiple commands
cat << 'EOF' | socat EXEC:"docker attach mycontainer",pty STDIN
npm start
# wait for startup
help
quit
EOF
```

**MacOS Issue**: This approach has a critical flaw on macOS.

From [Stack Overflow - write to stdin on macOS](https://stackoverflow.com/questions/79236833/write-to-stdin-of-running-docker-container-with-socat-on-macos):
> "On macOS, when docker attach attempts to write to the PTY, it encounters a 'Bad file descriptor' error because the write side isn't properly set up."

### 3.3 socat with TCP Relay (Network-Based)

**Architecture**: socat bridges between local TCP and remote docker attach PTY.

**Inside container - Docker Compose**:

```yaml
version: '3'
services:
  myapp:
    image: myimage
    stdin_open: true
    tty: true

  pty-relay:
    image: alpine:latest
    depends_on:
      - myapp
    command: |
      sh -c 'apk add --no-cache socat &&
      socat EXEC:"docker attach myapp",pty,echo=0 \
            TCP4-LISTEN:9001,reuseaddr,fork'
    ports:
      - "9001:9001"
```

**From host - connect via TCP**:

```bash
# Connect to the relay
socat - TCP:localhost:9001

# Or pipe commands
echo "ls" | socat - TCP:localhost:9001
```

**More robust relay command**:

```bash
socat EXEC:"docker attach container-id",pty,rawer \
      TCP4-LISTEN:32000,reuseaddr
```

The `rawer` option handles echo issues with nested PTYs.

### 3.4 socat with Unix Socket Relay

**Use Case**: Avoid network overhead, use Unix socket for local IPC.

**Setup - inside container**:

```bash
# Create relay from socket to docker attach PTY
socat UNIX-LISTEN:/tmp/container-pty.sock,fork \
      EXEC:"docker attach mycontainer",pty
```

**Access from host** (via docker exec):

```bash
# In another container or via docker exec
socat - UNIX-CONNECT:/tmp/container-pty.sock < /dev/stdin
```

### 3.5 socat Limitations

1. **Echo Issues**: PTY echo behavior can cause doubled output with some settings
   - Solution: Use `pty,echo=0` or `pty,rawer`

2. **Terminal Size**: socat doesn't automatically handle SIGWINCH
   - The relay won't resize when terminal resizes
   - Solution: Manually set with `stty rows X cols Y`

3. **Signal Propagation**: May not properly forward Ctrl-C through multiple relay layers
   - Each relay layer can break signal transmission
   - Solution: Use `setsid` to create new session

4. **Performance**: Character-at-a-time processing for interactive input
   - Adequate for typical TUI use but not real-time

5. **macOS Compatibility**: The pipe-based approach (`EXEC:"docker attach",pty`) fails on macOS

---

## Part 4: Named Pipes (FIFO) Alternative

### 4.1 Named Pipes Architecture

**Advantage**: Simpler than PTY, avoids terminal semantics issues.

**Disadvantage**: No signal propagation, no terminal metadata.

### 4.2 Basic FIFO Setup

**Create FIFOs on shared volume**:

```bash
# On host (in shared directory)
mkdir -p /tmp/container-io
mkfifo /tmp/container-io/stdin
mkfifo /tmp/container-io/stdout
mkfifo /tmp/container-io/stderr
```

**Mount in container**:

```yaml
services:
  myapp:
    volumes:
      - /tmp/container-io:/io
    command: |
      bash -c "
        exec 0</io/stdin
        exec 1>/io/stdout
        exec 2>/io/stderr
        node app.js
      "
```

**Access from host**:

```bash
# Write input
echo "command" > /tmp/container-io/stdin

# Read output (in background)
tail -f /tmp/container-io/stdout &

# Read errors
tail -f /tmp/container-io/stderr &
```

### 4.3 FIFO with Loop Pattern

**Persistent shell in container**:

```bash
while true; do
  bash -s < /io/stdin 2> /io/stderr > /io/stdout
done
```

This keeps FIFOs open between commands.

**Host side - send commands**:

```bash
{
  echo "ls"
  sleep 1
  echo "pwd"
  sleep 1
} > /tmp/container-io/stdin
```

### 4.4 FIFO Limitations

1. **No TTY Semantics**: No terminal metadata, no raw mode, no signal handling
2. **Blocking Behavior**: FIFOs block on open until both read and write ends connect
3. **No Signal Propagation**: Ctrl-C doesn't reach the application
4. **Line-Buffered Only**: Cannot send individual keypresses for interactive apps
5. **FIFO State**: Broken FIFOs require cleanup and recreation

---

## Part 5: Reptyr - PTY Reparenting

### 5.1 What is reptyr?

From [GitHub - reptyr](https://github.com/nelhage/reptyr):
> "reptyr is a utility for taking an existing running program and attaching it to a new terminal."

**Key difference**: Unlike `docker attach`, reptyr **changes the controlling terminal** of an already-running process using ptrace(2).

### 5.2 Docker Usage

**Host side - attach running Node.js TUI to new terminal**:

```bash
# Get container PID on host (requires docker --pid=host or privileged)
CONTAINER_PID=$(docker inspect -f '{{.State.Pid}}' mycontainer)

# Reparent to new PTY
reptyr $CONTAINER_PID
```

**Inside container - attach to running process**:

```bash
# List all processes in container
ps aux

# Get PID of Node.js TUI
NODEJS_PID=$(pgrep -f 'node.*tui')

# Reparent to current terminal
reptyr $NODEJS_PID
```

### 5.3 PTY-Stealing Mode

When ptrace is disabled, use TTY-stealing:

```bash
# Disable ptrace check (requires root)
echo 0 > /proc/sys/kernel/yama/ptrace_scope

# Steal the PTY
reptyr -T $NODEJS_PID
```

In Docker:

```bash
docker run \
  --cap-add=SYS_PTRACE \
  --security-opt apparmor=unconfined \
  ... # other options
```

### 5.4 Creating New PTY with reptyr

```bash
# Create a new PTY pair
PTY_NAME=$(reptyr -l)
echo "Created PTY: $PTY_NAME"

# Attach process to the new PTY
reptyr -t $PTY_NAME $NODEJS_PID
```

### 5.5 reptyr Limitations

1. **Requires ptrace(2)**: Must have `CAP_SYS_PTRACE` and ptrace_scope=0
   ```bash
   # Check current ptrace scope
   cat /proc/sys/kernel/yama/ptrace_scope
   # 0 = unrestricted, 1 = restricted to parent, 2 = disabled, 3 = strict
   ```

2. **Process Groups**: Attaching to multi-process programs doesn't work reliably
   > "Attaching to a process with children doesn't work right."

3. **Curses Programs**: Some TUIs need screen redraw after reparenting
   - Solution: Send Ctrl-L to force redraw

4. **epoll-based Apps**: Applications using epoll on stdin may not work
   > "Attaching to rtorrent doesn't work right (rtorrent stops accepting input)"

5. **ARM/Architecture Limited**: Works on i386, x86_64, and ARM but dependent on syscall details

6. **In Docker on Windows/Mac**: Cannot access host PID 1 process - Docker Desktop runs containers in a Linux VM

---

## Part 6: Docker PID 1 Specific Challenges

### 6.1 Signal Handling as PID 1

When Node.js runs as PID 1 in Docker, signal handling is fundamentally different.

From [Node.js Docker issues](https://github.com/nodejs/docker-node/issues/1620):
> "Node.js running as PID 1 will not respond to SIGINT (CTRL-C) and similar signals."

**Why**: The Linux kernel treats PID 1 (init process) specially - signals without explicit handlers are **ignored**, not defaulted.

**Example of the problem**:

```javascript
// Node.js app running as PID 1 (Dockerfile)
// FROM node:latest
// ENTRYPOINT ["node", "app.js"]

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// This WILL work - handler is explicit
process.on('SIGINT', () => {
  console.log('Caught SIGINT');
  process.exit(0);
});

rl.question('Enter command: ', (answer) => {
  console.log(answer);
});
```

Even with explicit handler, **PTY-related issues persist**:
- Window resize (SIGWINCH) may not be forwarded properly
- Process group signal forwarding is broken
- Terminal control characters may not work

### 6.2 Solutions for PID 1 Signal Handling

**Option 1: Use docker --init flag** (Recommended)

```bash
docker run --init myimage
# or
docker run --init=true myimage
```

This wraps your process with a lightweight init that forwards signals.

**Option 2: Use tini explicitly**

```dockerfile
FROM node:latest
RUN apt-get install -y tini
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "app.js"]
```

**Option 3: Explicit signal handlers**

```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
```

### 6.3 PTY Issues Specific to PID 1

Even with signal handling fixed, PTY semantics break as PID 1:

1. **No Controlling Terminal Hierarchy**: The init process can't properly establish controlling terminal relationships
2. **Process Group Issues**: Child processes may not form proper job control groups
3. **Terminal Foreground**: The `tcgetpgrp()`/`tcsetpgrp()` calls fail or behave unexpectedly

**Symptom**: Interactive applications work but don't respond to Ctrl-C or terminal resize.

---

## Part 7: Window Resize (SIGWINCH) Handling

### 7.1 How Terminal Resize Works

From [SIGWINCH documentation](http://rkoucha.fr/tech_corner/sigwinch.html):
> "SIGWINCH is raised to the foreground processes when the number of columns or rows changes."

**The sequence**:

1. User resizes terminal emulator window
2. Terminal emulator calls `TIOCSWINSZ` ioctl on its PTY
3. Kernel sends `SIGWINCH` to foreground process group
4. Application calls `TIOCGWINSZ` to get new dimensions
5. Application redraws interface with new size

### 7.2 Docker PTY Resize

From [Docker PTY resize](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/):
> "Docker provides an API call to resize the allocated PTY. A SIGWINCH handler is used to detect window size changes and resize the pseudo-terminal as needed."

**Inside docker daemon**: When terminal is resized, docker calls resize API:

```go
// Pseudocode - Docker internally does this
size := getTerminalSize()
containerPTY.Resize(size.Rows, size.Cols)
```

### 7.3 socat Window Resize Issue

**Problem**: socat relay breaks SIGWINCH propagation.

```
Host Terminal
    ↓ (SIGWINCH)
socat process
    ? (doesn't forward)
Docker attach PTY
    ↓ (no SIGWINCH)
Container process
```

**Workaround**: Manually resize via stty

```bash
# Inside container via socat relay
stty rows 50 cols 200
```

### 7.4 Handling SIGWINCH in Node.js

```javascript
const tty = require('tty');
const readline = require('readline');

process.stdout.on('resize', () => {
  const cols = process.stdout.columns;
  const rows = process.stdout.rows;
  console.log(`Terminal resized: ${cols}x${rows}`);
  // Redraw UI with new dimensions
});

// Manual handler (for backwards compatibility)
process.on('SIGWINCH', () => {
  if (tty.isatty(process.stdout.fd)) {
    const size = process.stdout.getWindowSize();
    console.log(`Window size: ${size[0]} x ${size[1]}`);
  }
});
```

---

## Part 8: Comprehensive Comparison Table

| Approach | Terminal Semantics | Signals | Window Resize | Complexity | Latency | Platform Support |
|----------|-------------------|---------|---------------|-----------|---------|------------------|
| `/proc/PID/fd/0` direct | None | None | N/A | Low | Very Low | Linux only |
| TIOCSTI ioctl | None | None | N/A | Low-Medium | Medium | Linux (6.2+ needs config) |
| socat + docker attach (pipe) | Full | Partial | Broken | Medium | Medium | Linux, fails on macOS |
| socat + TCP relay | Full | Partial | Broken | Medium-High | High | Cross-platform |
| Named pipes (FIFO) | None | None | N/A | Low | Very Low | Cross-platform |
| reptyr reparenting | Full | Full | Full | High | Low | Linux (requires ptrace) |
| Native docker attach | Full | Full | Full | Very Low | Very Low | Cross-platform |

---

## Part 9: Recommended Solutions by Use Case

### 9.1 For Simple Command Execution (Non-Interactive)

**Use**: FIFO or socat pipe
**Reason**: Lowest overhead, simple setup
**Limitation**: No user input during execution

```bash
# FIFO approach
{
  echo "npm start"
  sleep 10  # Let it run
} > /tmp/container-io/stdin

# socat approach
echo "npm start" | socat EXEC:"docker attach myapp",pty STDIN
```

### 9.2 For Interactive TUI (Single Terminal)

**Use**: Native docker attach from host
**Reason**: Full PTY semantics, proper signal handling, window resize
**Setup**:

```bash
docker attach mycontainer
```

**For PID 1 issue**:

```bash
docker run --init -it myimage node app.js
```

### 9.3 For Remote Interactive Access

**Use**: socat + TCP relay
**Reason**: Network transparency, full PTY
**Limitation**: Window resize requires manual sync
**Setup**:

Inside container:
```bash
socat EXEC:"docker attach mycontainer",pty,rawer \
      TCP4-LISTEN:9001,reuseaddr
```

From remote:
```bash
socat - TCP:remote-host:9001
```

### 9.4 For Programmatic Control with Full Terminal Semantics

**Use**: reptyr reparenting + explicit PTY handling
**Reason**: Full control, proper signal propagation
**Complexity**: High - requires ptrace setup
**Setup**:

```bash
# Enable ptrace
docker run --cap-add=SYS_PTRACE \
           --security-opt apparmor=unconfined \
           myimage

# Inside: reparent running process
reptyr $NODEJS_PID
```

### 9.5 For Containerized Orchestration (Agent Communication)

**Use**: Custom IPC via socat + custom protocol
**Reason**: Decoupled from host terminal state
**Implementation**:

```bash
# In container 1 (orchestrator)
socat UNIX-LISTEN:/tmp/agent1.sock,fork \
      EXEC:"docker attach agent1",pty

# In container 2 (another orchestrator)
socat - UNIX-CONNECT:/tmp/agent1.sock <<< "status"
```

---

## Part 10: Practical Implementations

### 10.1 Docker Compose with socat Relay

**Full example with multiple agents**:

```yaml
version: '3.8'

services:
  marie:
    image: nodeTUI:latest
    stdin_open: true
    tty: true
    command: node marie-tui.js
    volumes:
      - marie-data:/data

  anga:
    image: nodeTUI:latest
    stdin_open: true
    tty: true
    command: node anga-tui.js
    volumes:
      - anga-data:/data

  marie-relay:
    image: alpine:latest
    depends_on:
      - marie
    command: |
      sh -c 'apk add --no-cache socat &&
      socat EXEC:"docker attach multi-agents-orchestration-marie-1",pty,rawer \
            UNIX-LISTEN:/tmp/marie.sock,fork,reuseaddr'
    volumes:
      - /tmp:/tmp
      - /var/run/docker.sock:/var/run/docker.sock

  anga-relay:
    image: alpine:latest
    depends_on:
      - anga
    command: |
      sh -c 'apk add --no-cache socat &&
      socat EXEC:"docker attach multi-agents-orchestration-anga-1",pty,rawer \
            UNIX-LISTEN:/tmp/anga.sock,fork,reuseaddr'
    volumes:
      - /tmp:/tmp
      - /var/run/docker.sock:/var/run/docker.sock

  orchestrator:
    image: nodeTUI:latest
    stdin_open: true
    tty: true
    command: node orchestrator.js
    depends_on:
      - marie-relay
      - anga-relay
    volumes:
      - /tmp:/tmp
      - orchestrator-data:/data

volumes:
  marie-data:
  anga-data:
  orchestrator-data:
```

**Orchestrator code to send commands**:

```javascript
const net = require('net');
const fs = require('fs');

async function sendCommandToAgent(socketPath, command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath, () => {
      socket.write(command + '\n');

      let response = '';
      socket.on('data', (data) => {
        response += data.toString();
        // Wait for prompt or timeout
        setTimeout(() => {
          socket.end();
          resolve(response);
        }, 500);
      });
    });

    socket.on('error', reject);
  });
}

// Usage
sendCommandToAgent('/tmp/marie.sock', 'status')
  .then(response => console.log('Marie response:', response))
  .catch(err => console.error('Error:', err));
```

### 10.2 Named Pipe Setup for Local IPC

**Setup script**:

```bash
#!/bin/bash

# Create shared directory
mkdir -p /tmp/agent-io/{marie,anga,orchestrator}

# Create FIFOs for each agent
for agent in marie anga orchestrator; do
  mkfifo /tmp/agent-io/$agent/{stdin,stdout,stderr}
  chmod 666 /tmp/agent-io/$agent/*
done
```

**Docker Compose**:

```yaml
services:
  marie:
    image: nodeTUI:latest
    command: |
      bash -c "exec 0</tmp/agent-io/marie/stdin &&
               exec 1>/tmp/agent-io/marie/stdout &&
               exec 2>/tmp/agent-io/marie/stderr &&
               node marie-tui.js"
    volumes:
      - /tmp/agent-io:/tmp/agent-io
```

**Orchestrator sends command**:

```bash
echo "command" > /tmp/agent-io/marie/stdin
# Read response
head -1 /tmp/agent-io/marie/stdout
```

### 10.3 reptyr for Development Workflow

**Scenario**: Node.js TUI crashed, need to restart without losing state.

```bash
#!/bin/bash

CONTAINER_NAME="agent-marie"

# Check if running
if docker ps | grep -q $CONTAINER_NAME; then
  # Get process inside container
  PID=$(docker exec $CONTAINER_NAME pgrep -f 'node.*tui')

  if [ -n "$PID" ]; then
    # Reparent to new terminal
    docker exec --privileged $CONTAINER_NAME reptyr $PID
  else
    echo "Process not running, starting..."
    docker exec -it $CONTAINER_NAME node marie-tui.js
  fi
else
  echo "Container not running"
  docker run -it --cap-add=SYS_PTRACE $CONTAINER_NAME node marie-tui.js
fi
```

---

## Part 11: Key Findings and Recommendations

### 11.1 Critical Insights

1. **PTY is Essential**: Simple file descriptor writes don't work for interactive apps
   - The Linux kernel carefully separates the master and slave ends
   - Writing to file descriptor paths doesn't inject into input queue

2. **Docker attach is the Baseline**: For local interactive use, nothing beats native docker attach
   - Full terminal semantics automatically handled
   - Proper signal propagation (with `--init` flag)
   - Window resize synchronization

3. **PID 1 Breaks Everything**: Node.js as PID 1 fundamentally breaks signal handling
   - Use `docker run --init` flag universally for containers
   - Alternative: explicit signal handlers in code
   - Alternative: Use tini or dumb-init wrapper

4. **socat is Network-Capable but Lossy**: Great for remote access, loses terminal features
   - Window resize must be manual
   - Proper echo control needed (`rawer` or `echo=0`)
   - macOS doesn't work with EXEC+docker attach combination

5. **reptyr Reparenting Works but Requires Capabilities**: Highest fidelity for process attachment
   - Needs `SYS_PTRACE` capability + ptrace_scope=0
   - Works best for single processes
   - Multi-child process groups problematic

6. **Named Pipes (FIFO) Are Simplest but Least Capable**: Good for basic command execution
   - No terminal semantics at all
   - No signal propagation
   - Easiest to debug and troubleshoot

### 11.2 For Your Specific Use Case (Multi-Agent Orchestration)

**The Problem**: Need to send commands to Claude Code (Node.js TUI) in Docker containers from an orchestrator.

**Recommended Architecture**:

```
Orchestrator (host or container)
    │
    ├─→ socat relay (per agent) ──→ agent container (claude code)
    └─→ socat relay (per agent) ──→ agent container (claude code)

OR for better reliability:

Orchestrator container
    │
    ├─→ Unix socket → shared volume
    │
    └─→ socat inside each agent container
        ├─→ Listen on socket
        └─→ Forward to docker attach PTY
```

**Key Implementation Points**:

1. Use socat with `rawer` flag to handle PTY echo:
   ```bash
   socat EXEC:"docker attach agent",pty,rawer \
         UNIX-LISTEN:/tmp/agent.sock,fork
   ```

2. Handle window size manually (not automatic via relay):
   ```javascript
   // No automatic resize - inform agents of size if needed
   ```

3. Always use `docker run --init` for all containers:
   ```yaml
   services:
     agent:
       init: true  # or --init flag in docker run
   ```

4. For multi-line input, handle line endings carefully:
   ```bash
   # Each line needs newline
   { echo "command1"; echo "command2"; } > socket
   ```

---

## Part 12: Technical Depth Resources

### PTY Architecture Deep Dive
- [iximiuz.com - Linux PTY article](https://iximiuz.com/en/posts/linux-pty-what-powers-docker-attach-functionality/)
- [dockerpty Python library](https://github.com/d11wtq/dockerpty)
- [Container runtime shim implementation](https://iximiuz.com/en/posts/implementing-container-runtime-shim-3/)

### socat Resources
- [socat manual page](https://linux.die.net/man/1/socat)
- [socat examples repository](https://github.com/KostyaEsmukov/socat)
- [Red Hat socat guide](https://www.redhat.com/sysadmin/getting-started-socat)

### Signal Handling in Containers
- [Node.js Docker best practices](https://github.com/nodejs/docker-node/issues/1620)
- [Process signals guide](https://maximorlov.com/process-signals-inside-docker-containers/)
- [Tini init system](https://github.com/krallin/tini)

### Terminal Control
- [TIOCSTI documentation](https://www.qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.devctl/topic/tioc/tiocsti.html)
- [SIGWINCH deep dive](http://rkoucha.fr/tech_corner/sigwinch.html)
- [ioctl_tty man page](https://man7.org/linux/man-pages/man2/ioctl_tty.2.html)

### Process Reparenting
- [reptyr project](https://github.com/nelhage/reptyr)
- [reptyr man page](https://manpages.ubuntu.com/manpages/bionic/man1/reptyr.1.html)

---

## Conclusion

Sending text input to an interactive TUI application in Docker requires understanding the full PTY architecture. Direct file descriptor writes don't work; the solution depends on your specific requirements:

- **Local interactive**: Use `docker attach` with `--init` flag
- **Remote interactive**: Use socat TCP relay (accept window resize limitation)
- **Programmatic IPC**: Use socat UNIX socket relay (simplest and most reliable)
- **Maximum fidelity**: Use reptyr reparenting (complexity trade-off)
- **Maximum simplicity**: Use named pipes (no terminal features)

For your orchestration use case, **socat with UNIX socket relay** offers the best balance of reliability, simplicity, and capability.

