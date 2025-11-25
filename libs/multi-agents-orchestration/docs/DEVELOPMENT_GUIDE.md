# Development Guide for CodeHornets AI

A comprehensive guide for new developers on how to make changes to this multi-agent orchestration system.

## Table of Contents

1. [Understanding the Codebase](#understanding-the-codebase)
2. [Development Environment Setup](#development-environment-setup)
3. [Making Changes](#making-changes)
4. [Testing Your Changes](#testing-your-changes)
5. [Common Development Workflows](#common-development-workflows)
6. [Troubleshooting](#troubleshooting)

---

## Understanding the Codebase

### Key Components

```
.
├── docker-compose.yml          # Container orchestration
├── Makefile                    # Development commands
├── prompts/                    # Agent system prompts
│   ├── orchestrator.md        # Orchestrator instructions
│   ├── marie.md               # Marie (dance teaching) prompt
│   ├── anga.md                # Anga (coding) prompt
│   └── fabien.md              # Fabien (Marketing) prompt
├── hooks-config/              # Claude Code hooks configuration
│   ├── orchestrator-hooks.json
│   ├── marie-hooks.json
│   ├── anga-hooks.json
│   └── fabien-hooks.json
├── tools/                      # Automation scripts (15 total)
│   ├── entrypoint.sh          # Worker container startup
│   ├── orchestrator_entrypoint.sh # Orchestrator startup
│   ├── create_worker_task.py  # Task creation tool
│   ├── monitor_daemon.py      # System monitor
│   ├── archive_task.py        # Task archiving
│   ├── wake_worker.sh         # Worker activation (with mode support)
│   └── helpers/               # Supporting scripts (9 files)
│       ├── setup/             # Setup (1): auto-theme-select.sh
│       ├── tasks/             # Task management (3): create/test/reset
│       └── monitoring/        # Monitoring (5): activation_wrapper, hook_watcher, send_to_worker, notifications, watch_workflow
└── shared/                     # Runtime data (gitignored)
    ├── auth-homes/            # Agent configurations
    ├── tasks/                 # Task files
    ├── results/               # Result files
    ├── heartbeats/            # Health status
    └── workspaces/            # Agent workspaces
```

### Architecture Overview

- **Orchestrator**: Coordinates tasks, delegates to workers
- **Workers** (Marie, Anga, Fabien): Process tasks in their domain
- **Monitor**: Observes system, auto-wakes workers, archives tasks
- **Automation**: Helper container for sending commands to workers

---

## Development Environment Setup

### Prerequisites

1. **Docker & Docker Compose** installed
2. **Claude Code** account (free or paid)
3. **Terminal** access
4. **Git** (for version control)

### Initial Setup

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd multi-agents-orchestration

# 2. Run initial setup
make setup

# 3. Start all agents
make up

# 4. Complete interactive authentication (one-time)
make setup-interactive

# 5. Complete theme selection (after restart)
make complete-theme

# 6. Verify setup
make check-setup
make status
```

### Development Workflow

```bash
# Start development session
make up                    # Start all containers
make status                # Check everything is running

# Make your changes (see sections below)

# Test your changes
make restart               # Restart to apply changes
make test                 # Run tests
```

---

## Making Changes

### 1. Changing Agent Prompts

**Location**: `prompts/{agent}.md`

**When to change**: 
- Update agent behavior or expertise
- Add new capabilities
- Modify communication style

**Example - Update Anga's prompt**:

```bash
# Edit the prompt file
vim prompts/anga.md

# Add new expertise section
# Save changes

# Restart Anga to apply
docker-compose restart anga

# Or restart all workers
make restart-workers
```

**Testing**:
```bash
# Attach to agent and test new behavior
make attach-anga

# Create a test task
make task-anga TITLE="Test new capability" DESC="Verify new behavior works"
```

### 2. Modifying Hooks Configuration

**Location**: `hooks-config/{agent}-hooks.json`

**When to change**:
- Add new event handlers
- Modify existing hook behavior
- Enable/disable hooks

**Example - Add new hook to orchestrator**:

```json
{
  "session_start": {
    "enabled": true,
    "command": "python /tools/hook_watcher.py handle_session_start orchestrator",
    "description": "Initialize session"
  },
  "your_new_hook": {
    "enabled": true,
    "command": "python /tools/your_script.py",
    "description": "Your custom hook"
  }
}
```

**Apply changes**:
```bash
# Copy updated config
cp hooks-config/orchestrator-hooks.json shared/auth-homes/orchestrator/hooks.json

# Restart orchestrator
docker-compose restart orchestrator
```

### 3. Modifying Tools/Scripts

**Location**: `tools/*.sh`, `tools/*.py`, `tools/helpers/*/`

**When to change**:
- Fix bugs in automation
- Add new features
- Improve error handling

**Example - Update task creation tool**:

```bash
# Edit the Python script
vim tools/create_worker_task.py

# Make your changes
# Save

# Test directly
docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga "Test" "Description"

# Or use Makefile command
make task-anga TITLE="Test" DESC="Test new functionality"
```

**Important**: Scripts are mounted as read-only volumes. To test changes:
1. Edit locally
2. Restart container to remount
3. Or copy into container for testing: `docker cp tools/script.sh codehornets-orchestrator:/tools/`

### 4. Modifying Docker Configuration

**Location**: `docker-compose.yml`

**When to change**:
- Add new services
- Modify environment variables
- Change volume mounts
- Update container settings

**Example - Add environment variable**:

```yaml
services:
  anga:
    environment:
      - NEW_VAR=value
```

**Apply changes**:
```bash
# Recreate containers with new config
docker-compose down
docker-compose up -d

# Or restart specific service
docker-compose up -d --force-recreate anga
```

### 5. Modifying Entrypoint Scripts

**Location**: `tools/entrypoint.sh`, `tools/orchestrator_entrypoint.sh`

**When to change**:
- Modify startup sequence
- Add initialization steps
- Change directory creation

**Example - Add new directory**:

```bash
# Edit entrypoint.sh
vim tools/orchestrator_entrypoint.sh

# Add directory creation
mkdir -p /shared/new-directory

# Restart to apply
docker-compose restart orchestrator
```

---

## Testing Your Changes

### Quick Test

```bash
# Run automated end-to-end test
make test-e2e
```

### Manual Testing Workflow

**Terminal 1 - Monitor**:
```bash
make watch-workflow
```

**Terminal 2 - Test**:
```bash
# Test orchestrator changes
make attach-orchestrator

# Test worker changes
make attach-anga
make task-anga TITLE="Test" DESC="Verify changes work"
```

### Testing Specific Components

#### Test Agent Prompt Changes

```bash
# 1. Make changes to prompt
vim prompts/anga.md

# 2. Restart agent
docker-compose restart anga

# 3. Attach and test
make attach-anga
# Give a request that should trigger new behavior

# 4. Verify behavior matches expectations
```

#### Test Hook Changes

```bash
# 1. Modify hook config
vim hooks-config/orchestrator-hooks.json

# 2. Copy to agent's .claude directory
cp hooks-config/orchestrator-hooks.json shared/auth-homes/orchestrator/hooks.json

# 3. Restart agent
docker-compose restart orchestrator

# 4. Trigger the hook event
# (e.g., submit a prompt to trigger user_prompt_submit hook)

# 5. Check logs
make logs-orchestrator
# Or
tail -f shared/watcher-logs/orchestrator-watcher.log
```

#### Test Tool Changes

```bash
# 1. Edit tool script
vim tools/create_worker_task.py

# 2. Test directly in container
docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga "Test" "Description"

# 3. Or copy updated file into container for testing
docker cp tools/create_worker_task.py codehornets-orchestrator:/tools/create_worker_task.py
docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga "Test" "Description"

# 4. Verify output
ls -la shared/tasks/anga/
```

### Integration Testing

```bash
# Full system test
make test-e2e

# Test specific workflow
make reset-test
make task-anga TITLE="Integration test" DESC="Test complete workflow"
make watch-workflow  # In another terminal
```

### Check System Health

```bash
# View all agent status
make status

# Check heartbeats
make heartbeat

# View logs
make logs-orchestrator
make logs-anga

# Check file system logs
make watch-logs
```

---

## Common Development Workflows

### Workflow 1: Adding a New Feature to an Agent

```bash
# 1. Update agent prompt
vim prompts/anga.md
# Add new capability description

# 2. Restart agent
docker-compose restart anga

# 3. Test the feature
make attach-anga
# Give request that uses new feature

# 4. Verify behavior
make logs-anga
```

### Workflow 2: Fixing a Bug

```bash
# 1. Reproduce the bug
make reset-test
make task-anga TITLE="Reproduce bug" DESC="Steps to reproduce"

# 2. Identify the issue
make logs-anga
# Or check watcher logs
tail -f shared/watcher-logs/anga-watcher.log

# 3. Fix the code
vim tools/script.py  # Or relevant file

# 4. Test the fix
make restart
make task-anga TITLE="Test fix" DESC="Verify bug is fixed"

# 5. Verify
make view-archive
```

### Workflow 3: Adding a New Hook

```bash
# 1. Create hook handler script
vim tools/new_hook_handler.py
# Implement hook logic

# 2. Add hook to configuration
vim hooks-config/orchestrator-hooks.json
# Add new hook entry

# 3. Copy config to agent
cp hooks-config/orchestrator-hooks.json shared/auth-homes/orchestrator/hooks.json

# 4. Restart agent
docker-compose restart orchestrator

# 5. Test hook
# Trigger the event that should fire the hook
make attach-orchestrator

# 6. Verify hook executed
tail -f shared/watcher-logs/orchestrator-watcher.log
```

### Workflow 4: Modifying Docker Configuration

```bash
# 1. Edit docker-compose.yml
vim docker-compose.yml

# 2. Validate configuration
docker-compose config

# 3. Apply changes
docker-compose down
docker-compose up -d

# 4. Verify services are running
make status

# 5. Test affected services
make logs-orchestrator
```

### Workflow 5: Debugging an Issue

```bash
# 1. Check system status
make status
make heartbeat

# 2. View relevant logs
make logs-orchestrator
make logs-anga
make logs-monitor

# 3. Check file system state
ls -la shared/tasks/anga/
ls -la shared/results/anga/
ls -la shared/triggers/anga/

# 4. Inspect container
make shell-anga
# Inside container:
#   ls /tasks
#   ls /results
#   cat /shared/heartbeats/anga.json

# 5. Test manually
make task-anga TITLE="Debug test" DESC="Manual test"
make wake-anga
make logs-anga
```

---

## Best Practices

### 1. Always Test Locally First

```bash
# Make changes
# Test with make test-e2e
# Verify with make watch-workflow
```

### 2. Use Version Control

```bash
# Commit changes frequently
git add .
git commit -m "Description of changes"

# Before major changes, create a branch
git checkout -b feature/new-feature
```

### 3. Check Logs After Changes

```bash
# Always verify logs after making changes
make logs-orchestrator
make logs-anga
```

### 4. Reset Test Environment

```bash
# Clean state for testing
make reset-test
```

### 5. Document Your Changes

- Update relevant documentation
- Add comments to code
- Update README if needed

---

## Troubleshooting

### Changes Not Taking Effect

**Problem**: Modified files but changes not visible in containers

**Solutions**:
```bash
# 1. Restart the affected container
docker-compose restart anga

# 2. Force recreate
docker-compose up -d --force-recreate anga

# 3. Check if file is mounted correctly
docker exec codehornets-worker-anga ls -la /tools/script.py

# 4. Verify file was saved
cat tools/script.py
```

### Agent Not Responding

**Problem**: Agent doesn't process tasks after changes

**Solutions**:
```bash
# 1. Check agent is running
make status

# 2. Check heartbeat
make heartbeat

# 3. Check logs for errors
make logs-anga

# 4. Restart agent
docker-compose restart anga

# 5. Re-authenticate if needed
make attach-anga
```

### Permission Issues

**Problem**: Scripts can't write files or execute

**Solutions**:
```bash
# 1. Check file permissions
ls -la tools/

# 2. Make scripts executable
chmod +x tools/*.sh

# 3. Check container user
docker exec codehornets-worker-anga whoami

# 4. Check directory permissions
ls -la shared/tasks/anga/
```

### Configuration Not Loading

**Problem**: Hook config or prompt not being used

**Solutions**:
```bash
# 1. Verify file exists in agent's .claude directory
ls -la shared/auth-homes/anga/CLAUDE.md
ls -la shared/auth-homes/anga/hooks.json

# 2. Copy config manually
cp prompts/anga.md shared/auth-homes/anga/CLAUDE.md
cp hooks-config/anga-hooks.json shared/auth-homes/anga/hooks.json

# 3. Restart agent
docker-compose restart anga
```

---

## Quick Reference

### Essential Commands

```bash
# Setup
make setup                    # Initial setup
make up                       # Start all agents
make setup-interactive        # Complete authentication

# Development
make restart                  # Restart all agents
make restart-workers          # Restart only workers
make status                   # Check system status

# Testing
make test-e2e                 # Automated test
make watch-workflow           # Real-time monitor
make attach-anga              # Attach to agent

# Debugging
make logs-anga                # View logs
make heartbeat                 # Check health
make shell-anga               # Open shell in container

# Maintenance
make clean                    # Clean runtime files
make reset-test               # Reset test environment
make view-archive             # View archived tasks
```

### File Locations

- **Prompts**: `prompts/{agent}.md`
- **Hooks**: `hooks-config/{agent}-hooks.json`
- **Tools**: `tools/*.sh`, `tools/*.py`
- **Docker**: `docker-compose.yml`
- **Runtime Data**: `shared/` (gitignored)

### Key Directories

- `shared/auth-homes/` - Agent configurations (persisted)
- `shared/tasks/` - Task files (ephemeral)
- `shared/results/` - Result files (ephemeral)
- `shared/archive/` - Archived tasks (persisted)
- `shared/watcher-logs/` - System logs

---

## Getting Help

1. **Check Documentation**:
   - `README.md` - Overview
   - `QUICKSTART.md` - Quick start guide
   - `docs/TESTING_GUIDE.md` - Testing guide
   - `docs/ARCHITECTURE_NOTES.md` - Architecture details

2. **Check Logs**:
   ```bash
   make logs-orchestrator
   make logs-anga
   tail -f shared/watcher-logs/*.log
   ```

3. **Check System Status**:
   ```bash
   make status
   make heartbeat
   ```

4. **Reset and Retry**:
   ```bash
   make reset-test
   make up
   ```

---

**Happy Coding! 🚀**

