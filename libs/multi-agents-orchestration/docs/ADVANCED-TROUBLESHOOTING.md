# Advanced Troubleshooting and Edge Cases

## Diagnostic Tools and Techniques

### 1. Check PTY Status in Running Container

```bash
#!/bin/bash

CONTAINER=$1

echo "=== PTY Diagnostic for $CONTAINER ==="

echo -e "\n1. Process tree:"
docker exec $CONTAINER ps auxf

echo -e "\n2. TTY device:"
docker exec $CONTAINER tty

echo -e "\n3. File descriptor check:"
docker exec $CONTAINER ls -la /proc/1/fd/

echo -e "\n4. Is stdin a TTY?"
docker exec $CONTAINER test -t 0 && echo "YES" || echo "NO"

echo -e "\n5. Terminal settings:"
docker exec $CONTAINER stty -a

echo -e "\n6. TERM environment:"
docker exec $CONTAINER echo "TERM=$TERM"

echo -e "\n7. Process signals:"
docker exec $CONTAINER kill -l | head -3
```

### 2. Monitor Socket Activity

```bash
#!/bin/bash

SOCKET=$1

echo "Monitoring socket: $SOCKET"

# Watch file changes
while true; do
  stat "$SOCKET" 2>/dev/null && {
    ls -lah "$SOCKET"
    echo "Access time: $(stat -c %x "$SOCKET")"
    echo "Modify time: $(stat -c %y "$SOCKET")"
  }
  sleep 1
done
```

### 3. Trace socat Relay Activity

```bash
# Start socat with debug output
socat -d -d \
  EXEC:"docker attach container",pty,rawer \
  UNIX-LISTEN:/tmp/relay.sock,fork,reuseaddr

# Or in background with logging
socat -d -d \
  EXEC:"docker attach container",pty,rawer \
  UNIX-LISTEN:/tmp/relay.sock,fork,reuseaddr \
  > /tmp/socat.log 2>&1 &

# Monitor the log
tail -f /tmp/socat.log
```

### 4. Check Signal Handling

**Inside container**:
```bash
#!/bin/bash

# Check which signals Node.js is handling
docker exec container bash -c '
  # Send signal and check if app responds
  trap "echo SIGTERM received" SIGTERM
  trap "echo SIGINT received" SIGINT

  echo "Process ready, send signals..."
  sleep 30
'

# From host
docker kill -s SIGTERM container
docker kill -s SIGINT container
```

### 5. Verify PTY Allocation

```bash
#!/bin/bash

CONTAINER=$1

echo "Checking PTY allocation..."

# Check docker inspect for TTY
docker inspect --format='{{.Config.Tty}}' $CONTAINER
# Should be: true

# Check if /dev/console exists (PTY slave)
docker exec $CONTAINER test -e /dev/console && echo "Has /dev/console" || echo "NO /dev/console"

# Check /dev/pts
docker exec $CONTAINER ls -la /dev/pts/

# Check /proc for TTY info
docker exec $CONTAINER grep -E '^(Tty|VmPTE)' /proc/1/status
```

---

## Common Error Messages and Solutions

### Error: "Bad file descriptor" on macOS with socat

**Symptom**:
```
socat[12345]: 2025/11/22 10:00:00 E write(4, 0x7f..., 100): Bad file descriptor
```

**Cause**: macOS Docker Desktop has issues with nested PTY allocation in `EXEC:"docker attach",pty`

**Solutions**:

1. **Use TCP relay instead**:
   ```bash
   socat EXEC:"docker attach container",pty \
         TCP4-LISTEN:9001,reuseaddr,fork
   ```

2. **Use socat inside container**:
   ```dockerfile
   FROM node:18
   RUN apk add socat  # Inside Alpine container
   ```
   Then relay from inside.

3. **Use ssh bridge** (more complex but reliable):
   ```bash
   socat EXEC:"ssh host docker attach container" \
         UNIX-LISTEN:/tmp/relay.sock,fork
   ```

### Error: "Connection refused" on socket

**Symptom**:
```
Error: connect ECONNREFUSED /tmp/relay.sock
```

**Cause**: Relay process not running or socket path wrong

**Debugging**:
```bash
# Check if socket exists
ls -la /tmp/relay.sock

# If it doesn't exist, relay crashed
# Check relay logs
docker logs relay-container

# If path is wrong, check volume mount
docker inspect relay-container | grep -A 5 Mounts

# Check file permissions
stat /tmp/relay.sock
```

### Error: "Permission denied" on TIOCSTI

**Symptom**:
```
OSError: [Errno 1] Operation not permitted
```

**Cause**: Need CAP_SYS_ADMIN capability

**Solution**:
```bash
# Run with capability
docker run --cap-add=SYS_ADMIN myimage

# Or in docker-compose
services:
  agent:
    cap_add:
      - SYS_ADMIN
```

Check kernel config:
```bash
# Inside container
cat /proc/cmdline | grep -i tiocsti
cat /etc/sysctl.d/* | grep legacy_tiocsti

# Enable at runtime (needs root)
echo 1 > /proc/sys/dev/tty/legacy_tiocsti
```

### Error: "Inappropriate ioctl for device"

**Symptom**:
```
OSError: [Errno 25] Inappropriate ioctl for device
```

**Cause**: File descriptor is not a terminal

**Debugging**:
```bash
# Check if fd is a TTY
docker exec container python3 -c "import os; print(os.isatty(0))"

# Check what fd 0 actually is
docker exec container ls -la /proc/1/fd/0

# Check with lsof
docker exec container lsof -p 1 | grep 0
```

### Error: "No space left on device" with FIFO

**Symptom**:
```
No space left on device
```

**Cause**: FIFO buffer full, no reader attached

**Solution**:
```bash
# Always have reader before writer
# Open reader
tail -f /tmp/fifo/stdout &
tail -f /tmp/fifo/stderr &

# Then write
echo "command" > /tmp/fifo/stdin
```

### Error: "Stale file handle"

**Symptom**:
```
[Errno 116] Stale file handle
```

**Cause**: Socket/FIFO was recreated but old reference still exists

**Solution**:
```bash
# Clean up old sockets
rm -f /tmp/relay.sock

# Restart relay
docker restart relay-container

# Or create new socket with different name
socat ... UNIX-LISTEN:/tmp/relay.v2.sock,fork
```

---

## Echo Doubling Issue (PTY)

### Symptom
When sending commands via socat relay, input appears twice in output:
```
>>> help
hheellpp
... output ...
```

### Root Cause
PTY echo setting is enabled on both sides, causing:
1. Your write: "help"
2. PTY echo: "help" (echoed back by slave)
3. socat relay echoes: "help" (on master side)

### Solution 1: Use `echo=0` flag

```bash
socat EXEC:"docker attach container",pty,echo=0 \
      UNIX-LISTEN:/tmp/relay.sock,fork
```

### Solution 2: Use `rawer` flag (better)

```bash
socat EXEC:"docker attach container",pty,rawer \
      UNIX-LISTEN:/tmp/relay.sock,fork
```

### Solution 3: Disable echo in container

```bash
# Before running Node.js
docker exec container stty -echo

# Or in entrypoint
stty -echo && node app.js
```

### Solution 4: Handle in client code

```javascript
// Strip duplicate input from output
const stripEchoed = (input, output) => {
  // Remove first occurrence of input from output
  const regex = new RegExp(`^${input}\\s*`);
  return output.replace(regex, '');
};
```

---

## Window Resize Issues

### Symptom 1: Terminal corrupted after resize

**Cause**: SIGWINCH not propagated through relay

**Solution**: Manual resize in client
```bash
# After detecting terminal resize
stty rows 50 cols 200
```

### Symptom 2: TUI doesn't redraw on resize

**Cause**: SIGWINCH handler not working in Node.js

**Solution 1**: Add handler in Node.js
```javascript
process.stdout.on('resize', () => {
  const { rows, columns } = process.stdout;
  console.log(`Resized: ${columns}x${rows}`);
  // Trigger UI redraw
  redrawUI();
});
```

**Solution 2**: Force redraw with Ctrl-L
- Most TUIs (vim, less, etc.) redraw with Ctrl-L

### Symptom 3: Size incorrect through relay

**Debugging**:
```bash
# Check host terminal size
echo "Host: $(tput cols)x$(tput lines)"

# Check container size
docker exec container stty size

# Check through relay
socat - UNIX-CONNECT:/tmp/relay.sock <<< "stty size"
```

**Solution**:
```bash
# Set size at relay start
COLS=$(tput cols)
ROWS=$(tput lines)

# Pass to socat
socat EXEC:"docker attach container",pty,rawer,rows=$ROWS,cols=$COLS \
      UNIX-LISTEN:/tmp/relay.sock,fork
```

---

## Performance Issues

### Symptom: Slow response time

**Measurement**:
```bash
#!/bin/bash

SOCKET=$1
CMD=$2

START=$(date +%s%N)
echo "$CMD" | socat - UNIX-CONNECT:$SOCKET > /dev/null
END=$(date +%s%N)

ELAPSED=$(( ($END - $START) / 1000000 ))
echo "Response time: ${ELAPSED}ms"
```

### Common Causes and Fixes

**1. Relay process overloaded**
```bash
# Monitor relay CPU/memory
docker stats relay-container

# Solution: increase resources
services:
  relay:
    cpus: '0.5'
    mem_limit: 512M
```

**2. Network latency (TCP relay)**
```bash
# Check latency
ping -c 1 relay-host

# Solution: use Unix socket instead
socat ... UNIX-LISTEN:/socket,fork
```

**3. Disk I/O (FIFO)**
```bash
# Check I/O
iostat -x 1 5

# Solution: use memory-based relay
tmpfs mount with socat
```

**4. Container DNS resolution**
```bash
# Check DNS
docker exec container nslookup docker.io

# Solution: use IP instead of hostname
socat EXEC:"docker attach 172.17.0.2" ...
```

### Benchmarking socat

```bash
#!/bin/bash

SOCKET=$1
ITERATIONS=${2:-1000}

echo "Benchmarking $ITERATIONS requests..."

START=$(date +%s%N)

for i in $(seq 1 $ITERATIONS); do
  echo "status" | socat - UNIX-CONNECT:$SOCKET > /dev/null 2>&1
done

END=$(date +%s%N)

ELAPSED=$(( ($END - $START) / 1000000 ))
AVG=$(( $ELAPSED / $ITERATIONS ))

echo "Total: ${ELAPSED}ms"
echo "Average: ${AVG}ms/request"
echo "Throughput: $(( 1000 / AVG )) requests/sec"
```

---

## Multi-Container Coordination

### Problem: Multiple relays interfering

**Symptom**: Sending command to Marie but Anga responds

**Cause**: Same socket path or relay mixup

**Solution**:
```bash
# Use unique paths per agent
marie-relay: UNIX-LISTEN:/tmp/agent-sockets/marie.sock
anja-relay:  UNIX-LISTEN:/tmp/agent-sockets/anja.sock  # Different path

# Verify in client
docker exec orchestrator ls -la /tmp/agent-sockets/
```

### Problem: Commands get mixed up between agents

**Cause**: Sequential requests to same socket (relay maintains connection)

**Solution**: Close socket after each command
```javascript
function sendToAgent(socketPath, command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);

    let response = '';
    socket.on('data', (data) => {
      response += data.toString();
    });

    // IMPORTANT: send and close immediately
    socket.write(command + '\n');

    setTimeout(() => {
      socket.end();  // Close after response
      resolve(response);
    }, 1000);

    socket.on('error', reject);
  });
}
```

### Problem: Orphaned relay processes

**Cause**: Relay doesn't exit when main process exits

**Solution**:
```yaml
services:
  relay:
    command: |
      sh -c '
        trap "exit 0" SIGTERM SIGINT
        socat ...
      '
    # Add timeout to ensure cleanup
    stop_grace_period: 5s
```

---

## Container Lifecycle Issues

### Starting app before relay ready

**Problem**: Container starts but relay not attached yet

**Solution**: Health check
```yaml
services:
  relay:
    command: socat ...
    healthcheck:
      test: ["CMD", "test", "-S", "/tmp/relay.sock"]
      interval: 1s
      timeout: 3s
      retries: 5

  orchestrator:
    depends_on:
      relay:
        condition: service_healthy  # Wait for socket
```

### Relay crashes silently

**Problem**: No indication relay died, commands hang

**Solution**: Monitoring
```bash
#!/bin/bash

RELAY_PID=$(pgrep -f "socat.*relay.sock")

while true; do
  if ! ps -p $RELAY_PID > /dev/null; then
    echo "Relay died, restarting..."
    docker restart relay-container
    RELAY_PID=$(pgrep -f "socat.*relay.sock")
  fi
  sleep 5
done
```

### Incomplete startup sequence

```yaml
services:
  agent:
    init: true  # MUST have this
    stdin_open: true
    tty: true
    healthcheck:
      test: ["CMD", "node", "-e", "require('net').connect(0, 'localhost')"]
      interval: 1s
      retries: 30

  relay:
    depends_on:
      agent:
        condition: service_healthy
    command: socat ...

  orchestrator:
    depends_on:
      relay:
        condition: service_healthy
```

---

## Signal Handling Edge Cases

### Problem: Ctrl-C doesn't work through relay

**Debugging**:
```bash
# Check if signal reaches container
docker exec container bash -c '
  trap "echo SIGINT" SIGINT
  sleep 10
'

# From another terminal
docker kill -s SIGINT container
```

**Solution**: Enable proper PTY with --init

```yaml
services:
  agent:
    init: true  # This fixes signal handling
```

### Problem: Graceful shutdown hangs

**Cause**: Process doesn't handle SIGTERM

**Solution**:
```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');

  // Close connections
  // Flush state
  // Exit cleanly

  process.exit(0);
});
```

### Problem: Child processes not terminated

**Cause**: Main process doesn't kill children

**Solution**:
```javascript
const { spawn } = require('child_process');
let childProcess;

process.on('SIGTERM', () => {
  if (childProcess) {
    childProcess.kill('SIGTERM');
  }
  process.exit(0);
});

childProcess = spawn('some-command');
```

---

## Debugging Checklist

When things don't work, go through in order:

- [ ] **Container running?** `docker ps | grep agent`
- [ ] **Relay running?** `docker ps | grep relay`
- [ ] **Socket exists?** `ls -la /tmp/relay.sock`
- [ ] **Socket readable?** `test -S /tmp/relay.sock && echo OK`
- [ ] **Relay logs?** `docker logs relay-container`
- [ ] **Agent logs?** `docker logs agent-container`
- [ ] **Can connect manually?** `socat - UNIX-CONNECT:/tmp/relay.sock`
- [ ] **Send test command?** `echo "help" | socat - UNIX-CONNECT:/tmp/relay.sock`
- [ ] **Check init flag?** `docker inspect container | grep Init`
- [ ] **Check stdin/tty?** `docker inspect container | grep 'Stdin\|Tty'`
- [ ] **Test signal handling?** `docker kill -s SIGTERM container`

---

## Recovery Procedures

### Clean up stuck relay

```bash
#!/bin/bash

echo "Cleaning up socat relays..."

# Kill all socat processes
pkill -f socat

# Remove old sockets
rm -f /tmp/*.sock

# Wait for cleanup
sleep 2

# Restart services
docker-compose restart relay
```

### Reset container state

```bash
#!/bin/bash

CONTAINER=$1

echo "Resetting $CONTAINER..."

# Stop container
docker stop $CONTAINER

# Remove it
docker rm $CONTAINER

# Remove volumes (optional)
docker volume prune -f

# Restart from compose
docker-compose up -d $CONTAINER
```

### Debug with temporary container

```bash
# Run debug container with full access
docker run -it \
  --cap-add=SYS_PTRACE \
  --cap-add=SYS_ADMIN \
  --cap-add=NET_ADMIN \
  --security-opt apparmor=unconfined \
  --pid=host \
  --net=host \
  --ipc=host \
  alpine:latest bash

# Inside, you can:
# - Access all processes: ps aux
# - Trace system calls: strace -p PID
# - Inspect files: ls -la /proc/PID/fd
# - Use socat/netcat: socat ...
```

---

## Advanced Monitoring

### Real-time command tracing

```bash
#!/bin/bash

SOCKET=$1

# Use socat with verbose output
socat -v \
  - UNIX-CONNECT:$SOCKET

# Shows every byte sent/received
# Format: > outgoing, < incoming
```

### PTY state inspection

```bash
# Inside container
stty -a          # Full terminal state
stty size        # Rows and columns
stty -echo       # Check if echo on/off
tty              # Which PTY device
ps -p $$ -o cmd  # Current shell

# From host
docker exec container stty -a
docker exec container tty
```

### Process hierarchy

```bash
# See full process tree
docker exec container ps auxf

# See only Node.js processes
docker exec container ps aux | grep node
```

---

## Known Limitations and Workarounds

| Issue | Limitation | Workaround |
|-------|-----------|-----------|
| Window resize | Not auto-synced through relay | Manual `stty rows X cols Y` |
| macOS PTY | socat EXEC+docker attach fails | Use socat inside container or TCP relay |
| TIOCSTI | Disabled in recent kernels | Use socat relay instead |
| FIFO | No signal propagation | Use PTY-based relay |
| Multiple relays | Complex coordination | Use unique socket paths per agent |
| CPU usage | High with many connections | Increase relay resources |
| Memory leaks | socat can hold connections | Implement connection timeout |

---

## Testing Your Setup

```bash
#!/bin/bash

echo "Testing PTY/socat setup..."

SOCKET="/tmp/test-relay.sock"

# 1. Create test relay
echo "1. Starting relay..."
socat EXEC:"cat",pty,rawer UNIX-LISTEN:$SOCKET,fork &
RELAY_PID=$!
sleep 1

# 2. Test connection
echo "2. Testing connection..."
if echo "test" | socat - UNIX-CONNECT:$SOCKET > /tmp/test-output.txt 2>&1; then
  echo "✓ Connection works"
else
  echo "✗ Connection failed"
  kill $RELAY_PID
  exit 1
fi

# 3. Check output
echo "3. Checking output..."
if grep -q "test" /tmp/test-output.txt; then
  echo "✓ Output received"
else
  echo "✗ No output"
  kill $RELAY_PID
  exit 1
fi

# 4. Cleanup
echo "4. Cleanup..."
kill $RELAY_PID
rm -f $SOCKET /tmp/test-output.txt

echo "✓ All tests passed!"
```

