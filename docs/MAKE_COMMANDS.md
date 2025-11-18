# Make Commands Reference

**Date**: 2025-11-17
**Status**: Complete

---

## Overview

The multi-agent orchestration system includes a comprehensive Makefile for easy management. All commands run from the **root directory**.

```bash
# Always run from root
cd /path/to/@codehornets-ai
make <command>
```

---

## Quick Start

```bash
# 1. Pull Docker image (one-time)
make pull

# 2. Authenticate all agents (one-time)
make auth-all

# 3. Start the system
make start

# 4. Attach to orchestrator
make attach
```

---

## All Commands

### Setup Commands (One-Time)

| Command | Description |
|---------|-------------|
| `make pull` | Pull Claude Code Docker image |
| `make auth-all` | Authenticate all 4 agents (interactive) |
| `make auth-orchestrator` | Authenticate orchestrator only |
| `make auth-marie` | Authenticate Marie only |
| `make auth-anga` | Authenticate Anga only |
| `make auth-fabien` | Authenticate Fabien only |
| `make check-auth` | Verify which agents are authenticated |

**Authentication Process:**
- Each `auth-*` command opens a browser
- Log in to Claude web interface
- Credentials saved to `core/shared/auth-homes/{agent}/.claude/`
- You only do this once (persists across restarts)

---

### System Management

| Command | Description |
|---------|-------------|
| `make start` | Start all containers in background |
| `make stop` | Stop all containers |
| `make restart` | Restart all containers |
| `make rebuild` | Rebuild and restart (use after prompt changes) |

**When to use `make rebuild`:**
- After editing files in `core/prompts/`
- After changing domain knowledge (`core/prompts/domains/`)
- After changing agent personalities (`core/prompts/agents/`)
- After modifying orchestrator behavior

---

### Monitoring

| Command | Description |
|---------|-------------|
| `make status` | Show container status |
| `make logs` | Show logs from all containers (Ctrl+C to exit) |
| `make logs-orchestrator` | Show orchestrator logs only |
| `make logs-marie` | Show Marie logs only |
| `make logs-anga` | Show Anga logs only |
| `make logs-fabien` | Show Fabien logs only |

**Log Output:**
- Real-time streaming (`-f` flag)
- Shows container startup, task processing, errors
- Press `Ctrl+C` to exit log view

---

### Interaction

| Command | Description |
|---------|-------------|
| `make attach` | Attach to orchestrator (Ctrl+P Ctrl+Q to detach) |
| `make attach-marie` | Attach to Marie |
| `make attach-anga` | Attach to Anga |
| `make attach-fabien` | Attach to Fabien |

**Detaching Without Stopping:**
1. Press `Ctrl+P`
2. Press `Ctrl+Q`
3. Container keeps running in background

**Stopping Container:**
- If you exit normally (Ctrl+C or `exit`), container stops
- Use detach sequence to keep it running

---

### Development Helpers

| Command | Description |
|---------|-------------|
| `make check-tasks` | Show number of tasks in each queue |
| `make check-results` | Show number of results available |

**Task Queue Monitoring:**
```bash
$ make check-tasks
Current tasks in queue:

Marie:
  2 tasks
Anga:
  0 tasks
Fabien:
  1 tasks
```

---

### Cleanup

| Command | Description |
|---------|-------------|
| `make clean` | Stop containers and remove volumes |
| `make clean-tasks` | Clear all task files |
| `make clean-results` | Clear all result files |

**What gets cleaned:**
- `make clean` - Containers, networks, volumes (keeps auth)
- `make clean-tasks` - All JSON files in `core/shared/tasks/`
- `make clean-results` - All files in `core/shared/results/`

**Note:** `make clean` does **not** remove authentication. To re-auth, manually delete `core/shared/auth-homes/`.

---

## Common Workflows

### Daily Development

```bash
# Start system
make start

# Attach to orchestrator
make attach

# Work with orchestrator...
# (Ctrl+P, Ctrl+Q to detach)

# Check what's happening
make status
make logs

# Stop when done
make stop
```

### After Changing Prompts

```bash
# Edit prompts
vim core/prompts/agents/Marie.md
vim core/prompts/domains/DANCE.md

# Rebuild and restart
make rebuild

# Verify changes
make attach
```

### Debugging a Worker

```bash
# Check if tasks are stuck
make check-tasks

# Attach to worker
make attach-marie

# View worker logs
make logs-marie
```

### Complete Reset

```bash
# Stop everything
make stop

# Clean task/result files
make clean-tasks
make clean-results

# Start fresh
make start
```

---

## Troubleshooting

### "Permission denied" on Makefile

```bash
# Make sure Makefile is executable
chmod +x Makefile

# Or run with explicit make
/usr/bin/make help
```

### "docker-compose: command not found"

```bash
# Install docker-compose
# macOS: brew install docker-compose
# Linux: sudo apt-get install docker-compose
# Windows: Included with Docker Desktop
```

### Authentication Fails

```bash
# Check auth status
make check-auth

# Re-authenticate specific agent
make auth-marie

# If browser doesn't open, check Docker Desktop is running
```

### Containers Won't Start

```bash
# Check status
make status

# View logs for errors
make logs

# Common issues:
# 1. Not authenticated → make auth-all
# 2. Port conflicts → Change ports in docker-compose.yml
# 3. Docker not running → Start Docker Desktop
```

### Worker Not Processing Tasks

```bash
# Check task queue
make check-tasks

# Attach to worker to see what's happening
make attach-marie

# Check worker logs
make logs-marie

# Restart if needed
make restart
```

---

## File Locations

When running Make commands from root, files are located at:

```
@codehornets-ai/
├── Makefile                              # Make commands (run from here)
├── core/
│   ├── docker-compose.yml               # Container configuration
│   ├── prompts/                         # System prompts
│   │   ├── orchestrator.md
│   │   ├── domains/                     # Domain knowledge
│   │   │   ├── DANCE.md
│   │   │   ├── CODING.md
│   │   │   └── MARKETING.md
│   │   ├── agents/                      # Agent personalities
│   │   │   ├── Marie.md
│   │   │   ├── Anga.md
│   │   │   └── Fabien.md
│   │   └── combine-prompts.sh           # Runtime merger
│   └── shared/
│       ├── auth-homes/                  # Web authentication (gitignored)
│       │   ├── orchestrator/.claude/
│       │   ├── marie/.claude/
│       │   ├── anga/.claude/
│       │   └── fabien/.claude/
│       ├── tasks/                       # Task queue (gitignored)
│       │   ├── marie/
│       │   ├── anga/
│       │   └── fabien/
│       └── results/                     # Results (gitignored)
│           ├── marie/
│           ├── anga/
│           └── fabien/
```

---

## Advanced Usage

### Run Specific Container Only

```bash
# Start just orchestrator
cd core && docker-compose up -d orchestrator

# Start just Marie
cd core && docker-compose up -d marie
```

### View Combined Prompt

```bash
# See what Marie receives at startup
cat core/prompts/agents/Marie.md
echo "---"
cat core/prompts/domains/DANCE.md
```

### Manual Task Creation

```bash
# Create task file for Marie
cat > core/shared/tasks/marie/task-test.json << 'EOF'
{
  "task_id": "task-test",
  "description": "Test task",
  "requirements": ["Do something"]
}
EOF

# Marie will pick it up within 5 seconds
```

---

## Best Practices

1. **Always run from root** - All Make commands expect to be run from `@codehornets-ai/`
2. **Use `make attach`** - Easiest way to interact with orchestrator
3. **Use `make rebuild`** - After any prompt changes
4. **Use `make check-auth`** - Before starting if system was idle
5. **Use `make logs`** - First step when debugging
6. **Detach properly** - Ctrl+P, Ctrl+Q to keep containers running

---

## Help

```bash
# Show all commands
make help

# View this documentation
cat docs/MAKE_COMMANDS.md
```

---

**Generated**: 2025-11-17
**Location**: `docs/MAKE_COMMANDS.md`
**Makefile**: Root directory
