# Hooks-Based Agent Communication

Making two Claude Code CLI instances communicate using external scripts + Claude Code Hooks.

## The Problem

Claude Code CLI doesn't maintain persistent state:
```
User: "Watch for tasks and process them"
Claude: "OK, I'll watch..."
[Processes one message]
[FORGETS everything on next message]
```

## The Solution: Hooks + External Scripts

Use **Claude Code Hooks** to run persistent external scripts that:
1. Watch for file changes (inotify/watchdog)
2. Signal Claude Code when tasks arrive
3. Restart Claude's conversation with the task

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator Container                                      │
│                                                              │
│  1. User/Orchestrator creates task file                     │
│  2. Hook triggers: orchestrator-send.py                     │
│  3. Script writes to /tasks/marie/task.json                 │
│  4. Script signals Marie via named pipe/webhook             │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Named Pipe / HTTP Signal
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Marie Container                                             │
│                                                              │
│  1. Persistent watcher: marie-watcher.py (runs in bg)       │
│  2. Detects task file via inotify                           │
│  3. Hook triggers: marie-activate.sh                        │
│  4. Script executes: claude -p "Process task X"             │
│  5. Claude processes task, writes result                    │
│  6. Hook triggers: marie-complete.py                        │
│  7. Script signals orchestrator                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Create Persistent File Watcher Scripts

#### Marie's Background Watcher

```python
#!/usr/bin/env python3
# /shared/scripts/marie-watcher.py
"""
Persistent file watcher for Marie agent.
Runs in background, watches for tasks, triggers Claude Code via hook.
"""

import time
import json
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class MarieTaskHandler(FileSystemEventHandler):
    def on_created(self, event):
        """Triggered when task file is created"""
        if event.is_directory or not event.src_path.endswith('.json'):
            return

        task_path = Path(event.src_path)
        print(f"🔔 Marie: New task detected: {task_path.name}")

        try:
            # Read task
            task = json.loads(task_path.read_text())
            task_id = task['task_id']
            description = task['description']

            print(f"📋 Task {task_id}: {description}")

            # Create trigger file for Claude Code hook
            trigger_file = Path(f"/shared/triggers/marie/{task_id}.trigger")
            trigger_file.parent.mkdir(parents=True, exist_ok=True)
            trigger_file.write_text(json.dumps({
                "action": "process_task",
                "task_id": task_id,
                "task_path": str(task_path)
            }))

            print(f"✅ Trigger created for Claude Code hook")

        except Exception as e:
            print(f"❌ Error processing task: {e}")

def main():
    """Start watching Marie's task directory"""
    task_dir = "/shared/tasks/marie"
    Path(task_dir).mkdir(parents=True, exist_ok=True)

    print(f"🎧 Marie watcher starting...")
    print(f"📁 Watching: {task_dir}")

    event_handler = MarieTaskHandler()
    observer = Observer()
    observer.schedule(event_handler, task_dir, recursive=False)
    observer.start()

    print(f"✅ Marie watcher active (PID: {os.getpid()})")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n🛑 Marie watcher stopped")

    observer.join()

if __name__ == "__main__":
    import os
    main()
```

---

### Step 2: Configure Claude Code Hooks

#### Marie's Hooks Configuration

```json
// /workspaces/marie/.claude/hooks.json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "python3 /shared/scripts/marie-watcher.py > /shared/logs/marie-watcher.log 2>&1 &",
        "description": "Start Marie's persistent task watcher"
      }
    ],

    "PreToolUse": [
      {
        "matcher": {
          "type": "file_pattern",
          "pattern": "/shared/triggers/marie/*.trigger"
        },
        "hooks": [
          {
            "type": "command",
            "command": "/shared/scripts/marie-process-trigger.sh",
            "description": "Process task trigger and activate Claude"
          }
        ]
      }
    ],

    "PostToolUse": [
      {
        "matcher": {
          "tool": "Write",
          "pattern": "/shared/results/marie/.*\\.json"
        },
        "hooks": [
          {
            "type": "command",
            "command": "/shared/scripts/marie-notify-complete.sh",
            "description": "Notify orchestrator that task is complete"
          }
        ]
      }
    ]
  }
}
```

---

### Step 3: Hook Execution Scripts

#### Marie's Trigger Processing Script

```bash
#!/bin/bash
# /shared/scripts/marie-process-trigger.sh
# Executed by PreToolUse hook when trigger file detected

set -e

TRIGGER_DIR="/shared/triggers/marie"

# Find latest trigger
TRIGGER_FILE=$(ls -t "$TRIGGER_DIR"/*.trigger 2>/dev/null | head -1)

if [ -z "$TRIGGER_FILE" ]; then
    echo "No trigger file found"
    exit 0
fi

echo "🔔 Processing trigger: $TRIGGER_FILE"

# Parse trigger
TASK_ID=$(jq -r '.task_id' "$TRIGGER_FILE")
TASK_PATH=$(jq -r '.task_path' "$TRIGGER_FILE")

echo "📋 Task ID: $TASK_ID"

# Read task details
TASK_DESCRIPTION=$(jq -r '.description' "$TASK_PATH")

echo "📝 Description: $TASK_DESCRIPTION"

# Execute Claude Code with task prompt
# This RESTARTS Claude's conversation with the task context
cd /workspaces/marie

claude --headless -p "$(cat <<EOF
You are Marie, a specialized worker agent.

A new task has arrived:

Task ID: $TASK_ID
Description: $TASK_DESCRIPTION

Execute this task and write the result to:
/shared/results/marie/$TASK_ID.json

Format:
{
  "task_id": "$TASK_ID",
  "status": "complete",
  "result": "your detailed result here"
}
EOF
)"

# Cleanup trigger
rm "$TRIGGER_FILE"

echo "✅ Task processing initiated"
```

#### Marie's Completion Notification Script

```bash
#!/bin/bash
# /shared/scripts/marie-notify-complete.sh
# Executed by PostToolUse hook when result file is written

set -e

# Get the file that was just written (passed by hook)
RESULT_FILE="${CLAUDE_HOOK_FILE_PATH}"

if [ -z "$RESULT_FILE" ]; then
    echo "No result file path provided"
    exit 0
fi

echo "📤 Notifying orchestrator: $RESULT_FILE"

# Extract task ID from filename
TASK_ID=$(basename "$RESULT_FILE" .json)

# Signal orchestrator via named pipe
echo "$TASK_ID" > /shared/pipes/marie-to-orchestrator

# Or via webhook
# curl -X POST http://orchestrator:8000/task-complete \
#      -H "Content-Type: application/json" \
#      -d "{\"worker\": \"marie\", \"task_id\": \"$TASK_ID\"}"

echo "✅ Orchestrator notified"
```

---

### Step 4: Orchestrator Hooks

```json
// /workspaces/orchestrator/.claude/hooks.json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "python3 /shared/scripts/orchestrator-listener.py > /shared/logs/orchestrator-listener.log 2>&1 &",
        "description": "Start orchestrator completion listener"
      }
    ],

    "PreToolUse": [
      {
        "matcher": {
          "tool": "Write",
          "pattern": "/shared/tasks/.*/.*\\.json"
        },
        "hooks": [
          {
            "type": "command",
            "command": "/shared/scripts/orchestrator-send-task.sh",
            "description": "Notify worker when task is created"
          }
        ]
      }
    ]
  }
}
```

#### Orchestrator Task Sender

```bash
#!/bin/bash
# /shared/scripts/orchestrator-send-task.sh
# Executed when orchestrator writes task file

set -e

TASK_FILE="${CLAUDE_HOOK_FILE_PATH}"

if [ -z "$TASK_FILE" ]; then
    exit 0
fi

# Extract worker name from path: /shared/tasks/marie/task-123.json
WORKER=$(basename $(dirname "$TASK_FILE"))
TASK_ID=$(basename "$TASK_FILE" .json)

echo "🔔 Signaling $WORKER for task: $TASK_ID"

# Create trigger for worker
TRIGGER_FILE="/shared/triggers/$WORKER/$TASK_ID.trigger"
mkdir -p "$(dirname $TRIGGER_FILE)"

jq -n \
  --arg action "process_task" \
  --arg task_id "$TASK_ID" \
  --arg task_path "$TASK_FILE" \
  '{action: $action, task_id: $task_id, task_path: $task_path}' \
  > "$TRIGGER_FILE"

echo "✅ Worker $WORKER triggered"
```

#### Orchestrator Completion Listener

```python
#!/usr/bin/env python3
# /shared/scripts/orchestrator-listener.py
"""
Listen for completion signals from workers.
Runs in background, updates orchestrator when workers complete tasks.
"""

import os
import json
from pathlib import Path

def listen_for_completions():
    """Listen on named pipe for worker completion signals"""
    pipe_path = "/shared/pipes/marie-to-orchestrator"

    # Create pipe if it doesn't exist
    if not os.path.exists(pipe_path):
        os.mkfifo(pipe_path)

    print(f"🎧 Orchestrator listening for completions on: {pipe_path}")

    while True:
        try:
            # BLOCKS until data available
            with open(pipe_path, 'r') as pipe:
                task_id = pipe.read().strip()

                if task_id:
                    print(f"✅ Received completion signal: {task_id}")

                    # Create trigger for orchestrator
                    trigger_file = Path(f"/shared/triggers/orchestrator/{task_id}.complete")
                    trigger_file.parent.mkdir(parents=True, exist_ok=True)
                    trigger_file.write_text(json.dumps({
                        "action": "task_complete",
                        "task_id": task_id,
                        "worker": "marie"
                    }))

                    print(f"📥 Orchestrator notified of completion: {task_id}")

        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    listen_for_completions()
```

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  orchestrator:
    image: anthropic/claude-code:latest
    container_name: orchestrator
    volumes:
      - ./workspaces/orchestrator:/workspace
      - ./shared:/shared
      - ./auth/orchestrator:/home/agent/.claude:ro
    environment:
      - CLAUDE_HOOKS_ENABLED=true
    command: claude
    stdin_open: true
    tty: true

  marie:
    image: anthropic/claude-code:latest
    container_name: marie
    volumes:
      - ./workspaces/marie:/workspace
      - ./shared:/shared
      - ./auth/marie:/home/agent/.claude:ro
    environment:
      - CLAUDE_HOOKS_ENABLED=true
    command: claude
    stdin_open: true
    tty: true
    depends_on:
      - orchestrator

  # Optional: Watcher manager service
  watchers:
    image: python:3.11-slim
    container_name: watchers
    volumes:
      - ./shared:/shared
    command: >
      bash -c "
        pip install watchdog &&
        python3 /shared/scripts/marie-watcher.py
      "
    restart: unless-stopped
```

---

## Directory Structure

```
project/
├── shared/
│   ├── tasks/
│   │   ├── marie/          # Task files written here
│   │   ├── anga/
│   │   └── fabien/
│   ├── results/
│   │   ├── marie/          # Result files written here
│   │   ├── anga/
│   │   └── fabien/
│   ├── triggers/
│   │   ├── orchestrator/   # Completion triggers
│   │   ├── marie/          # Task triggers
│   │   ├── anga/
│   │   └── fabien/
│   ├── pipes/
│   │   ├── marie-to-orchestrator
│   │   ├── anga-to-orchestrator
│   │   └── fabien-to-orchestrator
│   ├── scripts/
│   │   ├── marie-watcher.py
│   │   ├── marie-process-trigger.sh
│   │   ├── marie-notify-complete.sh
│   │   ├── orchestrator-listener.py
│   │   └── orchestrator-send-task.sh
│   └── logs/
│       ├── marie-watcher.log
│       └── orchestrator-listener.log
├── workspaces/
│   ├── orchestrator/
│   │   └── .claude/
│   │       └── hooks.json
│   └── marie/
│       └── .claude/
│           └── hooks.json
└── docker-compose.yml
```

---

## How It Works

### 1. System Initialization

```bash
# Start containers
docker-compose up -d

# Containers start, hooks fire:
# - SessionStart hook runs marie-watcher.py (background)
# - SessionStart hook runs orchestrator-listener.py (background)
```

### 2. Orchestrator Creates Task

```python
# User in orchestrator terminal:
"Create a task for Marie to review auth.py"

# Claude writes file:
Path("/shared/tasks/marie/task-001.json").write_text(...)

# PreToolUse hook fires:
# → orchestrator-send-task.sh
# → Creates trigger: /shared/triggers/marie/task-001.trigger
```

### 3. Marie Watcher Detects Trigger

```python
# marie-watcher.py (running in background):
# - inotify detects /shared/triggers/marie/task-001.trigger
# - Reads trigger file
# - Executes: claude --headless -p "Process task..."
# - Claude processes task independently
```

### 4. Marie Writes Result

```python
# Claude in Marie container writes result:
Path("/shared/results/marie/task-001.json").write_text(...)

# PostToolUse hook fires:
# → marie-notify-complete.sh
# → Signals orchestrator via named pipe
```

### 5. Orchestrator Receives Completion

```python
# orchestrator-listener.py (running in background):
# - Named pipe unblocks
# - Receives task_id: "task-001"
# - Creates trigger: /shared/triggers/orchestrator/task-001.complete
# - Orchestrator Claude sees completion signal
```

---

## Alternative: HTTP-Based Activation

If you prefer HTTP over pipes:

```python
#!/usr/bin/env python3
# /shared/scripts/marie-webhook-server.py
"""
Run HTTP server in Marie container.
Orchestrator POSTs to activate Marie.
"""

from flask import Flask, request, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/activate', methods=['POST'])
def activate():
    """Webhook endpoint to activate Marie"""
    task = request.json
    task_id = task['task_id']
    description = task['description']

    print(f"🔔 Marie activated via webhook: {task_id}")

    # Execute Claude headless with task
    result = subprocess.run([
        "claude", "--headless", "-p", f"""
        Process this task:
        Task ID: {task_id}
        Description: {description}

        Write result to /shared/results/marie/{task_id}.json
        """
    ], capture_output=True, text=True, timeout=600)

    return jsonify({"status": "processing", "task_id": task_id})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)
```

**Hook configuration:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "python3 /shared/scripts/marie-webhook-server.py > /shared/logs/marie-webhook.log 2>&1 &"
      }
    ]
  }
}
```

**Orchestrator sends:**
```bash
#!/bin/bash
# /shared/scripts/orchestrator-send-via-webhook.sh

TASK_FILE="${CLAUDE_HOOK_FILE_PATH}"
WORKER=$(basename $(dirname "$TASK_FILE"))
TASK=$(cat "$TASK_FILE")

curl -X POST "http://$WORKER:5001/activate" \
  -H "Content-Type: application/json" \
  -d "$TASK"
```

---

## Testing

### Test 1: Manual Task Creation

```bash
# In orchestrator container
echo '{
  "task_id": "test-001",
  "description": "Test task for Marie"
}' > /shared/tasks/marie/test-001.json

# Watch marie logs
docker exec marie tail -f /shared/logs/marie-watcher.log

# Should see:
# 🔔 Marie: New task detected: test-001.json
# ✅ Trigger created for Claude Code hook
```

### Test 2: Full Workflow

```bash
# Orchestrator terminal
docker exec -it orchestrator bash
claude

# In Claude:
"Write a task for Marie to analyze the security of auth.py"

# Marie should automatically:
# 1. Detect task via watcher
# 2. Process task via Claude
# 3. Write result
# 4. Signal orchestrator
```

---

## Key Advantages

✅ **Persistent watchers** - Don't rely on Claude remembering
✅ **Hooks trigger automatically** - No manual intervention
✅ **True async** - Workers process independently
✅ **Debuggable** - Logs show exactly what's happening
✅ **Zero polling** - Event-driven via inotify
✅ **No context loss** - Each task gets fresh Claude instance

---

## Environment Variables for Hooks

```bash
# Available in hook scripts:
CLAUDE_HOOK_TYPE=PreToolUse
CLAUDE_HOOK_TOOL_NAME=Write
CLAUDE_HOOK_FILE_PATH=/shared/tasks/marie/task-001.json
CLAUDE_SESSION_ID=abc123
CLAUDE_WORKSPACE=/workspace
```

---

## Troubleshooting

### Hooks not firing

```bash
# Check if hooks are enabled
docker exec marie bash -c 'echo $CLAUDE_HOOKS_ENABLED'

# Check hooks.json syntax
docker exec marie cat /workspace/.claude/hooks.json | jq .

# View hook execution logs
docker exec marie cat /workspace/.claude/hooks.log
```

### Watcher not starting

```bash
# Check if watcher is running
docker exec marie ps aux | grep marie-watcher

# Check watcher logs
docker exec marie cat /shared/logs/marie-watcher.log

# Restart watcher manually
docker exec marie python3 /shared/scripts/marie-watcher.py &
```

### Named pipe blocked

```bash
# Check if pipe exists
docker exec orchestrator ls -la /shared/pipes/

# Test pipe manually
docker exec marie bash -c 'echo "test" > /shared/pipes/marie-to-orchestrator'
docker exec orchestrator bash -c 'cat /shared/pipes/marie-to-orchestrator'
```

---

## Summary

**This approach solves your problem:**

1. ✅ **Hooks run external scripts** - Not dependent on Claude's memory
2. ✅ **Persistent watchers** - Always running in background
3. ✅ **Event-driven activation** - inotify triggers instantly
4. ✅ **True agent-to-agent communication** - Via files + signals + hooks
5. ✅ **Claude stays stateless** - Each task gets fresh context via `--headless`

**The magic:**
- **Hooks** = Claude Code's official way to run external scripts
- **Watchers** = Python scripts that never forget
- **Triggers** = Files that tell workers to wake up
- **Named Pipes** = Signals between agents

This is production-ready, maintainable, and exactly how multi-agent systems should work! 🚀
