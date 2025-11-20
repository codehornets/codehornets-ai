# Worker Activation Guide

## The Challenge

Workers (marie, anga, fabien) run Claude CLI - an interactive Terminal User Interface (TUI) application. When they start, they show a prompt and wait for user input. To begin task monitoring, workers need an initial activation message.

**The Problem:** Programmatically sending input to an interactive TUI is challenging because:
1. Claude CLI captures keyboard input directly
2. Standard input redirection doesn't work with TUI applications
3. Docker attach is meant for interactive use, not automation

## Solutions

We provide multiple approaches, from fully automated to manual:

### Method 1: Automated with `expect` (Recommended)

**Install expect:**
```bash
# Ubuntu/Debian
sudo apt-get install expect

# macOS
brew install expect

# Windows (WSL)
sudo apt-get install expect
```

**Usage:**
```bash
# Wake specific worker
make wake-anga

# Wake all workers
make wake-all

# Custom message
./tools/wake_worker.sh marie "Start processing tasks now"
```

With `expect` installed, this fully automates the interaction:
1. Attaches to container
2. Sends the activation message
3. Waits for processing
4. Detaches cleanly (Ctrl+P Ctrl+Q)

**Output:**
```
════════════════════════════════════════════════════════════
  Waking Worker: anga
════════════════════════════════════════════════════════════

Method: Using 'expect' to automate interaction
Message: Check for pending tasks and start monitoring

✓ Message sent via expect

Check worker logs:
  make logs-anga
```

### Method 2: Notification Triggers (Fallback)

If `expect` is not installed, the script creates a notification file:

```bash
make wake-anga
```

Creates: `shared/triggers/anga/MANUAL_WAKE_XXXXXX.txt`

The worker's hook watcher will detect this file, but since workers are at a prompt, they need manual activation:

**Follow the instructions:**
```
Manual activation required:
─────────────────────────────────────────────────────────────
  1. Attach to worker:
       make attach-anga

  2. Send message:
       Check for pending tasks and start monitoring

  3. Press ENTER

  4. Detach (important!):
       Press: Ctrl+P then Ctrl+Q
─────────────────────────────────────────────────────────────
```

### Method 3: Direct Manual Activation

The simplest approach - just manually send the message:

```bash
# Attach to worker
make attach-anga

# Type (or paste):
Check for pending tasks

# Press ENTER

# Detach (IMPORTANT!):
Press: Ctrl+P then Ctrl+Q
```

**⚠️ Critical:** Always detach with `Ctrl+P Ctrl+Q` - never use `exit` or `Ctrl+C`!

### Method 4: Monitoring Daemon Notifications

The monitor daemon automatically creates notifications when tasks appear:

```bash
# Check for notifications
make check-notifications

# Output shows:
════════════════════════════════════════════════════════════
  📢 Notification for ANGA
════════════════════════════════════════════════════════════
ATTENTION: You have 1 pending task(s)
...
```

Then manually activate the worker as shown above.

## Complete Workflow Examples

### Example 1: Automated (with expect)

```bash
# 1. Create a task
make task-anga TITLE="Fix API" DESC="Update authentication"

# 2. Monitor detects it (within 3 seconds)
make logs-monitor
# [📢 Created notification for anga (1 tasks)]

# 3. Wake worker automatically
make wake-anga

# 4. Verify worker is processing
make logs-anga
# Should show worker reading task and executing
```

### Example 2: Manual (no expect)

```bash
# 1. Create a task
make task-anga TITLE="Fix API" DESC="Update authentication"

# 2. Check notifications
make check-notifications

# 3. Attach to worker
make attach-anga

# 4. Type in the prompt:
Check for pending tasks

# 5. Press ENTER

# 6. Detach:
Ctrl+P then Ctrl+Q

# 7. Monitor logs
make logs-anga
```

### Example 3: Wake All Workers

```bash
# Install expect first (if not installed)
sudo apt-get install expect

# Wake all workers at once
make wake-all

# Check all are monitoring
make logs-marie
make logs-anga
make logs-fabien
```

## Scripts Available

### 1. `wake_worker.sh` (Main script)
**Location:** `tools/wake_worker.sh`

**Features:**
- Tries `expect` for automation
- Falls back to notification trigger
- Provides manual instructions
- Checks worker status
- Shows pending task count

**Usage:**
```bash
./tools/wake_worker.sh anga
./tools/wake_worker.sh marie "Custom message here"
```

### 2. `send_to_worker.sh` (Expect only)
**Location:** `tools/send_to_worker.sh`

**Features:**
- Pure `expect` implementation
- Fails if expect not installed
- Cleaner for automation scripts

**Usage:**
```bash
./tools/send_to_worker.sh anga
./tools/send_to_worker.sh marie "Start monitoring"
```

### 3. `show_notifications.sh` (View notifications)
**Location:** `tools/show_notifications.sh`

**Features:**
- Shows pending notifications
- Provides wake instructions
- No activation attempted

**Usage:**
```bash
./tools/show_notifications.sh
./tools/show_notifications.sh anga
```

## Why Is This Hard?

### Technical Background

**Problem:** Claude CLI is a TUI (Text User Interface) that:
1. Directly controls terminal cursor
2. Handles keyboard events at a low level
3. Uses alternate screen buffer
4. Doesn't work with simple stdin redirection

**What doesn't work:**
```bash
# ✗ This won't work:
echo "message" | docker attach codehornets-worker-anga

# ✗ This won't work:
docker exec codehornets-worker-anga echo "message" > /proc/$(pgrep claude)/fd/0

# ✗ This won't work:
printf "message\n" | docker attach --no-stdin codehornets-worker-anga
```

**What works:**
```bash
# ✓ Using expect to simulate keyboard:
expect -c 'spawn docker attach container; send "message\r"; ...'

# ✓ Manual interaction:
docker attach container
# Type message manually
# Ctrl+P Ctrl+Q to detach
```

## Future Enhancements

Possible improvements to make this easier:

1. **Claude CLI API Mode:** If Claude CLI adds a non-interactive mode or API
2. **Worker Auto-Start:** Modify worker containers to auto-activate on startup
3. **Tmux/Screen Wrapper:** Wrap Claude CLI in tmux for easier automation
4. **File-Based Activation:** Workers could watch a special file for commands
5. **HTTP API Gateway:** Create a lightweight API that workers poll

## Recommendations

**For Production Use:**
- Install `expect` for reliable automation
- Use `make wake-all` after restarts
- Monitor logs to verify activation

**For Development:**
- Manual activation is fine
- Use `make attach-<worker>` directly
- Keep notifications as backup

**For CI/CD:**
- Install `expect` in CI environment
- Script: `make wake-all` before running tests
- Add health checks for worker activation state

## Troubleshooting

### "expect: command not found"

Install expect:
```bash
sudo apt-get install expect  # Linux
brew install expect           # macOS
```

### Worker Not Responding After Wake

Check worker logs:
```bash
make logs-anga
```

Possible issues:
- Worker crashed (restart: `make start-anga`)
- Message not received (try manual attach)
- Theme selection needed (see QUICKSTART.md)

### Detach Not Working

Always use: `Ctrl+P` then `Ctrl+Q` (release Ctrl between them)

Never use:
- `exit` - stops the container
- `Ctrl+C` - terminates the process
- `Ctrl+D` - sends EOF

### Task Not Processing After Wake

1. Check worker received message: `make logs-anga`
2. Verify task file exists: `ls shared/tasks/anga/`
3. Check worker heartbeat: `make heartbeat`
4. Try sending message again: `make wake-anga`

## Summary

| Method | Automation | Requires | Reliability |
|--------|------------|----------|-------------|
| `make wake-<worker>` (with expect) | ✓ Full | expect installed | ⭐⭐⭐⭐⭐ |
| `make wake-<worker>` (no expect) | Partial | Nothing | ⭐⭐⭐ |
| `make attach-<worker>` | ✗ Manual | Nothing | ⭐⭐⭐⭐⭐ |
| Monitor notifications | Partial | Nothing | ⭐⭐⭐ |

**Best practice:** Install `expect` and use `make wake-all` for fully automated worker activation.
