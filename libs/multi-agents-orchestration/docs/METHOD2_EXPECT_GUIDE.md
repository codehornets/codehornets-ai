# 🚀 Method 2: Expect + Docker Attach Guide

Complete guide for using Expect automation to send messages between containers via Docker Attach.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [File Structure](#file-structure)
- [Usage Examples](#usage-examples)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## 🎯 Overview

**Method 2** uses `expect` to automate the process of:
1. Attaching to a Docker container's interactive terminal
2. Sending a message
3. Pressing Enter to submit
4. Detaching cleanly without stopping the container

This method is **production-ready** and used throughout the CodeHornets AI system.

### Why This Method?

✅ **Actually delivers to interactive sessions** - Messages appear in Claude's terminal
✅ **Auto-submits** - Presses Enter for you
✅ **Clean detach** - Doesn't interrupt the agent
✅ **Reliable** - Handles edge cases and timeouts
✅ **Production-tested** - Used in live multi-agent systems

---

## 📦 Prerequisites

### 1. Containers Must Be Running

```bash
# Start all containers
docker-compose up -d

# Verify they're running
docker ps | grep codehornets
```

### 2. Automation Container Needs Expect

```bash
# Check if expect is installed
docker exec codehornets-svc-automation command -v expect

# If not installed (Alpine):
docker exec codehornets-svc-automation apk add --no-cache expect

# If Ubuntu/Debian:
docker exec codehornets-svc-automation apt-get update && apt-get install -y expect
```

### 3. Docker Socket Must Be Mounted

In `docker-compose.yml`:
```yaml
services:
  orchestrator:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:rw
```

### 4. Target Containers Need TTY

In `docker-compose.yml`:
```yaml
services:
  anga:
    stdin_open: true
    tty: true
```

---

## 🚀 Quick Start

### Method A: Use the Helper Script (Easiest)

```bash
# From host machine or any container with scripts mounted
bash scripts/send-via-expect.sh anga "Hello Anga!"
bash scripts/send-via-expect.sh marie "Evaluate student progress"
bash scripts/send-via-expect.sh orchestrator "Task completed"
```

### Method B: Use the Expect Script Directly

```bash
# From inside a container with expect installed
expect scripts/send-message-expect.exp codehornets-worker-anga "Hello!"
```

### Method C: Run the Interactive Test

```bash
# Interactive test script
bash test-expect-method.sh
```

---

## 📁 File Structure

```
multi-agents-orchestration/
├── scripts/
│   ├── send-message-expect.exp      # Standalone expect script
│   ├── send-via-expect.sh           # Helper bash wrapper
│   └── send_agent_message.sh        # Full-featured version
├── test-expect-method.sh            # Interactive test script
└── METHOD2_EXPECT_GUIDE.md          # This file
```

### File Descriptions

**`send-message-expect.exp`**
- Pure expect script
- Takes container name and message as arguments
- Handles attach, send, submit, detach
- ~50 lines, well-commented

**`send-via-expect.sh`**
- Bash wrapper for ease of use
- Maps agent names to container names
- Validates prerequisites
- Colorized output

**`send_agent_message.sh`**
- Production version with full features
- Inline expect (no separate file needed)
- Log viewing option
- Used by automation container

**`test-expect-method.sh`**
- Interactive test script
- Guided setup and execution
- Multiple test scenarios
- Verification steps

---

## 💡 Usage Examples

### Example 1: Simple Message

```bash
bash scripts/send-via-expect.sh anga "Hello Anga!"
```

**Output:**
```
════════════════════════════════════════════════════════════
  Method 2: Expect + Docker Attach
════════════════════════════════════════════════════════════
Checking if Anga 💻 is running... ✓
Checking if expect is installed... ✓
Checking Docker access... ✓

Target: Anga 💻
Container: codehornets-worker-anga
Message: "Hello Anga!"

⏳ Sending message...

✓ Container is responsive
✓ Message sent
✓ Enter pressed (message submitted)
⏳ Waiting for processing (10 seconds)...
✓ Detached cleanly

════════════════════════════════════════════════════════════
✅ Message delivered to Anga 💻
════════════════════════════════════════════════════════════
```

### Example 2: Task Assignment

```bash
bash scripts/send-via-expect.sh anga "Task: Review PR #123 for authentication system. Priority: high. Check for security vulnerabilities and code quality."
```

### Example 3: From Inside a Container

```bash
# Attach to orchestrator
docker exec -it codehornets-orchestrator bash

# Send message to anga
bash /scripts/send-via-expect.sh anga "Please review the authentication code"

# Send to marie
bash /scripts/send-via-expect.sh marie "Evaluate Emma's ballet progress"

# Send to fabien
bash /scripts/send-via-expect.sh fabien "Create social media post for recital"
```

### Example 4: Using Expect Script Directly

```bash
# From automation container
docker exec -it codehornets-svc-automation sh

# Run expect script
expect /scripts/send-message-expect.exp \
  codehornets-worker-anga \
  "Hello from automation container!"
```

### Example 5: Automated Loop

```bash
#!/bin/bash
# Send messages to all workers

for agent in marie anga fabien; do
  echo "Sending to $agent..."
  bash scripts/send-via-expect.sh $agent "System update: All agents please acknowledge"
  sleep 5
done
```

### Example 6: Request-Response Pattern

```bash
# Send request
bash scripts/send-via-expect.sh anga "What's your current status?"

# Wait a bit
sleep 15

# Check response in logs
docker logs codehornets-worker-anga --tail 30
```

---

## 🔧 How It Works

### Step-by-Step Process

```
1. Validate Arguments
   ├─> Check target container name
   └─> Check message is not empty

2. Check Prerequisites
   ├─> Container is running
   ├─> Docker socket is accessible
   └─> Expect is installed

3. Spawn Docker Attach
   └─> docker attach --no-stdin <container>

4. Wait for Ready
   ├─> Expect any output from container
   ├─> Timeout after 30 seconds
   └─> Handle EOF errors

5. Send Message
   └─> send "<message>"

6. Submit Message
   └─> send "\r" (Enter key)

7. Wait for Processing
   └─> sleep 10 (adjustable)

8. Detach Cleanly
   ├─> send "\x10" (Ctrl+P)
   └─> send "\x11" (Ctrl+Q)

9. Cleanup
   └─> expect eof
```

### Expect Script Breakdown

```tcl
#!/usr/bin/expect -f

# Get arguments
set container [lindex $argv 0]
set message [lindex $argv 1]

# Configuration
set timeout 30          # Max wait time
log_user 0             # Disable terminal echo (cleaner)

# Spawn docker attach
spawn docker attach --no-stdin $container

# Wait for container output
expect {
    -re ".+" {          # Any output = container is alive
        puts "✓ Responsive"
    }
    timeout {           # No output after 30s
        puts "❌ Timeout"
        exit 1
    }
    eof {              # Container closed
        puts "❌ EOF"
        exit 2
    }
}

# Send message
sleep 0.5
send "$message"
puts "✓ Sent"

# Submit (press Enter)
sleep 0.5
send "\r"
puts "✓ Submitted"

# Wait for Claude to process
sleep 10

# Detach (Ctrl+P, Ctrl+Q)
send "\x10\x11"
puts "✓ Detached"

exit 0
```

### Key Expect Commands

| Command | Description |
|---------|-------------|
| `spawn <cmd>` | Start a process |
| `expect "text"` | Wait for specific text |
| `expect -re "pattern"` | Wait for regex pattern |
| `send "text"` | Send text to process |
| `send "\r"` | Send Enter key |
| `send "\x10\x11"` | Send Ctrl+P, Ctrl+Q (detach) |
| `sleep N` | Wait N seconds |
| `set timeout N` | Set timeout to N seconds |
| `log_user 0/1` | Disable/enable echo |
| `exit N` | Exit with code N |

---

## 🐛 Troubleshooting

### Problem: "expect: command not found"

**Solution:**
```bash
# Alpine
docker exec codehornets-svc-automation apk add expect

# Ubuntu/Debian
docker exec container-name apt-get update && apt-get install -y expect
```

### Problem: "Cannot attach to container"

**Check 1: Container is running with TTY**
```bash
docker inspect codehornets-worker-anga | grep -A 2 "Tty"
# Should show: "Tty": true, "OpenStdin": true
```

**Check 2: Container hasn't exited**
```bash
docker ps | grep codehornets-worker-anga
# Should show in list
```

**Check 3: Docker socket is mounted**
```bash
docker exec codehornets-orchestrator ls -la /var/run/docker.sock
# Should exist and be accessible
```

### Problem: "Timeout waiting for container"

**Cause:** Container is not responding

**Solutions:**
```bash
# Check if container is hung
docker exec codehornets-worker-anga ps aux

# Check container logs
docker logs codehornets-worker-anga --tail 50

# Try increasing timeout in expect script
set timeout 60  # Increase from 30 to 60
```

### Problem: "Message sent but not visible"

**Cause:** Detached too quickly

**Solution:** Increase wait time
```tcl
# In expect script, increase from 10 to 15
sleep 15
```

### Problem: "Container stops after message"

**Cause:** Using Ctrl+C instead of Ctrl+P, Ctrl+Q

**Solution:** Use proper detach sequence
```tcl
# Wrong (stops container):
send "\003"  # Ctrl+C

# Right (detaches cleanly):
send "\x10\x11"  # Ctrl+P, Ctrl+Q
```

### Problem: "Permission denied on docker.sock"

**Solution 1:** Add to docker group
```yaml
# In docker-compose.yml
services:
  orchestrator:
    group_add:
      - "0"      # Root group
      - "1001"   # Docker group
```

**Solution 2:** Check socket permissions
```bash
ls -la /var/run/docker.sock
# Should be: srw-rw---- root docker
```

---

## 🎓 Advanced Usage

### Custom Timeout

```tcl
#!/usr/bin/expect -f
set timeout 60  # Longer timeout for slow responses
# ... rest of script
```

### Multiple Messages in Sequence

```bash
#!/bin/bash
MESSAGES=(
  "Task 1: Review code"
  "Task 2: Run tests"
  "Task 3: Deploy"
)

for msg in "${MESSAGES[@]}"; do
  bash scripts/send-via-expect.sh anga "$msg"
  sleep 20  # Wait between messages
done
```

### Wait for Specific Output

```tcl
#!/usr/bin/expect -f
# Wait for Claude's ready prompt
expect ">"

# Send message
send "Hello!\r"

# Wait for response indicator
expect {
  "I understand" { puts "✓ Acknowledged" }
  "I'll help" { puts "✓ Accepted" }
  timeout { puts "⚠ No response" }
}
```

### Error Recovery

```bash
#!/bin/bash
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if bash scripts/send-via-expect.sh anga "Test message"; then
    echo "✅ Success"
    exit 0
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⚠ Retry $RETRY_COUNT/$MAX_RETRIES"
    sleep 5
  fi
done

echo "❌ Failed after $MAX_RETRIES attempts"
exit 1
```

### Broadcast to All Agents

```bash
#!/bin/bash
broadcast_message() {
  local message="$1"
  local agents=("marie" "anga" "fabien")

  for agent in "${agents[@]}"; do
    echo "Broadcasting to $agent..."
    bash scripts/send-via-expect.sh "$agent" "$message" &
  done

  wait  # Wait for all to complete
  echo "✅ Broadcast complete"
}

broadcast_message "System maintenance in 10 minutes"
```

---

## 📚 Reference

### Environment Variables

```bash
AGENT_NAME        # Current agent name (set in docker-compose.yml)
CONTAINER_NAME    # Docker container name
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Timeout or validation error |
| 2 | Container EOF (closed unexpectedly) |

### Timing Guidelines

| Operation | Recommended Time |
|-----------|------------------|
| Initial wait | 0.5s |
| After message send | 0.5s |
| Processing wait | 10s (adjust for complex tasks) |
| Between messages | 5-20s |
| Detach wait | 0.5s |

---

## 🎯 Summary

Method 2 (Expect + Docker Attach) is the **most reliable** way to send messages to interactive terminal sessions in Docker containers.

**Use it when:**
- ✅ You need guaranteed delivery to Claude's session
- ✅ You want automatic message submission (Enter press)
- ✅ You're building production automation
- ✅ You need clean detach without interruption

**Files to use:**
- **Quick & Easy:** `scripts/send-via-expect.sh`
- **Direct Control:** `scripts/send-message-expect.exp`
- **Testing:** `test-expect-method.sh`

**Next Steps:**
1. Run `bash test-expect-method.sh` to try it out
2. Send your first message: `bash scripts/send-via-expect.sh anga "Hello!"`
3. Check logs: `docker logs codehornets-worker-anga --tail 30`

Happy messaging! 🚀
