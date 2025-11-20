# CodeHornets AI - Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- A Claude account (free or paid)
- Terminal access

## Initial Setup

### Step 1: Start All Agents

```bash
# 1. Run initial setup (copies configs, creates directories)
make setup

# 2. Start all agents
make up
```

Agents will start but be stuck at the theme selection screen - this is normal!

### Step 2: Complete Interactive Setup (One-Time)

**IMPORTANT**: Now you need to complete the interactive setup for each agent.

```bash
# Run the interactive setup helper
make setup-interactive
```

This will:
1. Show you a menu to select which agent to set up
2. Attach you to the running container
3. Let you complete authentication and theme selection
4. Guide you to detach properly (Ctrl+P, Ctrl+Q)

**Alternative**: Attach to agents individually:
```bash
make attach-orchestrator  # Orchestrator
make attach-marie         # Marie (frontend)
make attach-anga          # Anga (backend)
make attach-fabien        # Fabien (DevOps)

# IMPORTANT: Detach with Ctrl+P then Ctrl+Q (NOT exit or Ctrl+C!)
```

**Check setup status**:
```bash
make check-setup
```

You should see ✓ for all agents before proceeding.

### Step 3: Complete Theme Selection (After Restarts)

**NOTE**: After restarting containers (`make restart` or `make down && make up`), agents will need theme selection again even though they're already authenticated.

```bash
# Complete theme selection for all agents
make complete-theme
```

This will guide you through selecting the theme for each agent. For each agent:
1. Press **ENTER** to select Dark mode (default)
2. Press **Ctrl+P then Ctrl+Q** to detach

This step is required every time containers are restarted.

## Common Commands

### System Management

```bash
make help          # Show all available commands
make up            # Start all agents
make down          # Stop all agents
make restart       # Restart all agents
make status        # Show agent status
```

### Individual Agents

```bash
make start-orchestrator   # Start orchestrator only
make start-marie         # Start Marie (frontend)
make start-anga          # Start Anga (backend)
make start-fabien        # Start Fabien (DevOps)
```

### Logs & Monitoring

```bash
make logs                # View all logs (live)
make logs-orchestrator   # View orchestrator logs
make logs-anga           # View Anga logs
make heartbeat           # Show agent heartbeat status
make watch-logs          # Watch file system logs
```

### Task Management

```bash
# Create tasks for workers
make task-marie TITLE="Update UI" DESC="Fix dashboard layout"
make task-anga TITLE="Fix API" DESC="Update authentication endpoint"
make task-fabien TITLE="Deploy" DESC="Setup CI/CD pipeline"

# List tasks and results
make list-tasks     # Show pending tasks
make list-results   # Show completed results
```

### Development

```bash
make shell-orchestrator  # Open bash in orchestrator
make shell-anga         # Open bash in Anga container
make test               # Run system tests
make test-hook          # Test the Stop hook
```

### Maintenance

```bash
make clean      # Clean logs, heartbeats, tasks, results
make clean-all  # Clean everything including containers
make reset      # Full reset (clean + setup + start)
```

## Quick Example Workflow

```bash
# 1. Setup and start
make setup
make up

# 2. Complete authentication (first time only)
make setup-interactive

# 3. Complete theme selection (after any restart)
make complete-theme

# 4. Check status
make status
make heartbeat

# 5. Create a task for Anga
make task-anga TITLE="Implement user API" DESC="Create REST endpoints for user management"

# 6. Monitor
make logs-anga

# 7. List results
make list-results

# 8. When done
make down
```

## Directory Structure

```
.
├── Makefile                      # All management commands
├── docker-compose.hooks.yml      # Docker configuration
├── requirements.txt              # Python dependencies
├── prompts/
│   └── orchestrator.md          # Orchestrator system prompt
├── hooks-config/
│   └── orchestrator-hooks.json  # Hook configuration
├── tools/
│   ├── entrypoint.sh             # Worker container initialization
│   ├── orchestrator_entrypoint.sh # Orchestrator initialization
│   ├── monitor_daemon.py         # System monitoring daemon
│   ├── create_worker_task.py     # Task creation CLI
│   ├── archive_task.py           # Task archiving
│   ├── wake_worker.sh            # Worker activation
│   └── helpers/                  # Supporting scripts (9 files)
│       ├── setup/                # Setup (1): auto-theme-select.sh
│       ├── tasks/                # Task management (3): create/test/reset
│       └── monitoring/           # Monitoring (5): hooks, watchers, notifications
└── shared/                       # Runtime artifacts
    ├── auth-homes/              # Per-agent .claude configs
    ├── tasks/                   # Worker task queues
    ├── results/                 # Worker results
    ├── heartbeats/              # Agent health status
    ├── triggers/                # Event triggers
    ├── pipes/                   # Named pipes
    ├── watcher-logs/            # Log files
    └── workspaces/              # Agent workspaces
```

## Environment Variables

```bash
SHARED_DIR           # Optional: Shared directory path (default: /workspace/shared)
TRIGGER_DIR          # Optional: Trigger directory path (default: /shared/triggers)
TASKS_DIR            # Optional: Tasks directory path (default: /tasks)
```

**Note:** Authentication uses Claude Code web session - no API key configuration needed.

## Troubleshooting

### Agents Stuck at Theme Selection Screen

**Problem**: Agents show the theme selection prompt and won't proceed.

**Solution**: This is normal! Theme selection is required:

1. **First time setup** (authentication):
   ```bash
   make setup-interactive
   ```

2. **After container restart** (already authenticated):
   ```bash
   make complete-theme
   ```

3. **For specific agent**:
   ```bash
   make attach-marie   # or attach-anga, attach-fabien, attach-orchestrator
   # Press ENTER for theme, then Ctrl+P Ctrl+Q to detach
   ```

### Setup Not Saving/Agent Resets

**Problem**: After setup, agent returns to theme selection on restart.

**Cause**: Theme selection is required after every container restart (this is a Claude CLI limitation).

**Solution**:
```bash
# Always complete theme selection after restart:
make complete-theme

# Proper detach sequence:
# 1. Press Ctrl+P (release)
# 2. Press Ctrl+Q (release)
# NEVER use: exit, Ctrl+C, or Ctrl+D

# If authentication is lost, check credentials:
make check-setup
# If any agent shows "Not set up", redo setup for that agent:
make attach-marie  # (or whichever agent needs setup)
```

### Containers Won't Start

```bash
# Full cleanup and restart
make clean-all
make auth-all    # Re-authenticate if needed
make setup
make up
```

### View Detailed Logs

```bash
make logs-orchestrator
# or
docker-compose -f docker-compose.hooks.yml logs -f orchestrator
```

### Check Container Status

```bash
docker-compose -f docker-compose.hooks.yml ps
```

### Reset Everything

```bash
make reset
```

## Advanced Usage

### Manual Task Creation

```bash
docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga "Task Title" "Description"
```

### Watch Specific Log

```bash
tail -f shared/watcher-logs/orchestrator.log
```

### Inspect Heartbeat

```bash
cat shared/heartbeats/anga.json | python3 -m json.tool
```

### Check Triggers

```bash
ls -la shared/triggers/anga/
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Review [CLAUDE.md](CLAUDE.md) for orchestrator configuration
3. Explore [prompts/orchestrator.md](prompts/orchestrator.md) to understand the orchestrator's role
4. Check [hooks-config/orchestrator-hooks.json](hooks-config/orchestrator-hooks.json) for hook configuration

## Support

For issues or questions, check:
- System status: `make status`
- Agent heartbeats: `make heartbeat`
- Logs: `make logs`
- Configuration: `make config`
