# CodeHornets AI - Monitoring & Notification System

## Overview

The monitoring system provides real-time visibility into the multi-agent system without consuming Claude API tokens. It uses a lightweight Python daemon with optional local LLM support (Ollama) for AI-powered recaps.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Monitor Daemon                         │
│  (Python container - runs every 3 seconds)                │
│                                                            │
│  1. Scans:                                                 │
│     - Task queues (pending work)                           │
│     - Result directories (completed work)                  │
│     - Heartbeat files (agent health)                       │
│     - Trigger directories (events)                         │
│                                                            │
│  2. Detects tasks → Creates notifications                  │
│  3. Generates recaps every 30 seconds                      │
│  4. Optional: Uses local LLM for AI summaries              │
└──────────────────────────────────────────────────────────┘
                              │
                              ↓
         ┌──────────────────────────────────────┐
         │   Worker Notification Files          │
         │   shared/triggers/{worker}/          │
         │   WAKE_UP_TASKS_PENDING.txt          │
         └──────────────────────────────────────┘
```

## Features

### 1. Real-Time Monitoring
- **Interval:** Every 3 seconds
- **Zero Claude tokens** - uses lightweight Python
- **System health:** Tracks worker active/inactive status
- **Task flow:** Monitors pending → processing → completed

### 2. Automatic Notifications
When a task is created for a worker, the monitor:
1. Detects the pending task
2. Creates a notification file in the worker's trigger directory
3. Logs the notification event
4. Shows the alert in status recaps

### 3. Recaps
Every 30 seconds (10 iterations), generates a detailed recap:

```
=== CodeHornets AI System Status ===
System Health: HEALTHY

--- Worker Heartbeats ---
marie: active | Current: None | Completed: 0
anga: active | Current: None | Completed: 1
fabien: active | Current: None | Completed: 0

--- Pending Tasks ---
Total: 2 pending task(s)

--- Completed Results ---
Total: 1 result(s)

--- Recap ---
✓ All workers are active. 📋 2 task(s) pending.
```

### 4. Optional AI-Powered Recaps
If Ollama is installed, the monitor uses `llama3.2:1b` for intelligent summaries:
- Analyzes system state
- Identifies bottlenecks
- Suggests actions
- Provides context-aware insights

## Commands

### Start/Stop Monitor
```bash
make start-monitor   # Start monitoring daemon
make stop-monitor    # Stop monitoring daemon
make logs-monitor    # View real-time monitoring output
```

### Check Notifications
```bash
make check-notifications   # Show pending worker notifications
```

Output example:
```
════════════════════════════════════════════════════════════
  📢 Notification for ANGA
════════════════════════════════════════════════════════════
ATTENTION: You have 1 pending task(s)
Timestamp: 2025-11-19T19:59:36.485783

ACTION REQUIRED:
1. Read your CLAUDE.md prompt
2. Start monitoring /tasks directory
3. Process tasks as they arrive
════════════════════════════════════════════════════════════

To wake anga:
  1. make attach-anga
  2. Type: 'Check for pending tasks'
  3. Press Enter
  4. Detach with Ctrl+P Ctrl+Q
```

## Workflow: Task Creation → Notification → Processing

### 1. Create a Task
```bash
make task-anga TITLE="Fix API bug" DESC="Update authentication endpoint"
```

### 2. Monitor Detects Task (within 3 seconds)
```
[2025-11-19T19:59:36.485840] 📢 Created notification for anga (1 tasks)
[2025-11-19T19:59:36.485986] [1] Health: healthy | Tasks: 1 | Results: 0
```

### 3. Check Notifications
```bash
make check-notifications
```

### 4. Wake Worker
```bash
make attach-anga
# Type: "Check for pending tasks"
# Press Enter
# Press Ctrl+P then Ctrl+Q to detach
```

### 5. Worker Processes Task
The worker will:
1. Read the task from `/tasks/anga/*.json`
2. Execute the work
3. Write result to `/results/anga/result_*.json`
4. Update heartbeat with completion count

### 6. Monitor Confirms Completion
```
[2025-11-19T20:05:42.123456] [120] Health: healthy | Tasks: 0 | Results: 1
```

## Optional: Install Local LLM

For AI-powered recaps, see **[OLLAMA_SETUP.md](OLLAMA_SETUP.md)** for complete installation instructions.

Quick start:
```bash
# On your host machine
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:1b

# Restart monitor to detect Ollama
make stop-monitor && make start-monitor
```

With Ollama installed, recaps become more intelligent:
```
--- AI Recap ---
The system is healthy with all 3 workers active. One task for Anga
is pending and waiting to be processed. Marie and Fabien have no
current workload. Consider waking Anga to process the pending task.
```

**Note:** Ollama is completely optional. The monitor works great with rule-based analysis.

## Configuration

Environment variables (set in `.env` or docker-compose.yml):

```bash
MONITOR_INTERVAL=3           # Check interval in seconds (default: 3)
LLM_MODEL=llama3.2:1b       # Local LLM model (default: llama3.2:1b)
```

## Log Files

- **Container logs:** `docker logs codehornets-svc-monitor`
- **File log:** `shared/watcher-logs/monitor-daemon.log`
- **Worker watchers:** `shared/watcher-logs/{worker}-watcher.log`

## Monitoring Output

Quick status (every 3 seconds):
```
[1] Health: healthy | Tasks: 1 | Results: 0
[2] Health: healthy | Tasks: 1 | Results: 0
```

Detailed recap (every 30 seconds):
```
================================================================================
RECAP (Iteration 10)
================================================================================
[Full system snapshot with worker details, task counts, results, and AI analysis]
================================================================================
```

## Troubleshooting

### Monitor Not Creating Notifications

Check triggers directory is writable:
```bash
ls -la shared/triggers/
# Should show rw (read-write) permissions
```

### Worker Not Seeing Notification

Notifications are passive - they create a file but don't interrupt the worker. You must manually wake the worker:
```bash
make check-notifications    # See if notification exists
make attach-anga            # Attach to worker
# Type a prompt to activate them
```

### Ollama Not Detected

The monitor works without Ollama (simple rule-based recaps). To enable AI recaps:
1. Install Ollama on host machine
2. Pull model: `ollama pull llama3.2:1b`
3. Restart monitor

## Integration with Main System

The monitor is automatically started with:
```bash
make up    # Starts all agents including monitor
```

It runs continuously alongside workers, providing visibility without interrupting their operation.

## Future Enhancements

Possible improvements:
- Auto-wake workers via automation script
- Slack/Discord notifications
- Web dashboard
- Performance metrics
- Task queue analytics
- Worker efficiency scoring
