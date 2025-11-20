# Cleanup and Maintenance Guide

Comprehensive guide for cleaning up temporary files and maintaining the CodeHornets AI system.

## Cleanup Commands

### `make clean`

**Purpose**: Clean basic runtime files

**What it removes**:
- Heartbeat files (`shared/heartbeats/*.json`)
- Watcher logs (`shared/watcher-logs/*.log`)
- Pending tasks (`shared/tasks/*/*.json`)
- Pending results (`shared/results/*/*.json`)
- Trigger files (`shared/triggers/*/*.txt`, `*.trigger`)
- Workspace temporary files (`shared/workspaces/*/*.py`, `*.js`, `*.txt`)

**What it keeps**:
- Authentication credentials
- Agent prompts (CLAUDE.md)
- Hook configurations
- Session history
- Archives

**Usage**:
```bash
make clean
```

---

### `make clean-deep`

**Purpose**: Deep clean including all temporary session data

**What it removes**:
- Everything from `make clean` PLUS:
- Debug files (`shared/auth-homes/*/debug/*.txt`)
- Shell snapshots (`shared/auth-homes/*/shell-snapshots/*.sh`)
- File history (`shared/auth-homes/*/file-history/*`)
- Statsig cache files (`statsig.cached.*`, `statsig.failed_logs.*`)
- Todo files (`shared/auth-homes/*/todos/*.json`)
- Project session files (`shared/auth-homes/*/projects/*.jsonl`)

**What it keeps**:
- `.credentials.json` - Authentication credentials
- `CLAUDE.md` - Agent prompts
- `hooks.json` - Hook configurations
- `history.jsonl` - Session history
- `shared/archive/` - Archived tasks
- Statsig persistent files (`session_id`, `stable_id`, `last_modified_time`)

**Usage**:
```bash
make clean-deep
```

**Output**:
```
✓ Runtime files cleaned
✓ Deep clean complete
Kept: .credentials.json, CLAUDE.md, hooks.json, history.jsonl, archives
```

---

### `make clean-all`

**Purpose**: Clean everything including Docker containers

**What it does**:
1. Runs `make clean-deep`
2. Stops all containers (`make down`)
3. Removes all Docker volumes

**Usage**:
```bash
make clean-all
```

⚠️ **Warning**: This will require re-authentication of agents if you restart.

---

### `make reset`

**Purpose**: Full system reset

**What it does**:
1. Runs `make clean-all` (cleanup + stop containers)
2. Runs `make setup` (recreate directories and configs)
3. Runs `make up` (start all containers)

**Usage**:
```bash
make reset
```

⚠️ **Note**: After reset, you'll need to complete theme selection:
```bash
make complete-theme
```

---

## Directory Structure & File Types

### Important Files (Always Kept)

```
shared/
├── auth-homes/
│   ├── orchestrator/
│   ├── marie/
│   ├── anga/
│   └── fabien/
│       ├── .credentials.json     ✓ Authentication (KEEP)
│       ├── CLAUDE.md              ✓ Agent prompt (KEEP)
│       ├── hooks.json             ✓ Hooks config (KEEP)
│       ├── history.jsonl          ✓ Session history (KEEP)
│       └── statsig/
│           ├── statsig.session_id.*      ✓ Session ID (KEEP)
│           ├── statsig.stable_id.*       ✓ Stable ID (KEEP)
│           └── statsig.last_modified_time.* ✓ Metadata (KEEP)
└── archive/                       ✓ Archived tasks (KEEP)
```

### Temporary Files (Cleaned)

```
shared/
├── auth-homes/
│   └── {agent}/
│       ├── debug/
│       │   └── *.txt              ✗ Debug logs (REMOVE with clean-deep)
│       ├── shell-snapshots/
│       │   └── *.sh               ✗ Shell snapshots (REMOVE with clean-deep)
│       ├── file-history/
│       │   └── *                  ✗ File history (REMOVE with clean-deep)
│       ├── statsig/
│       │   ├── statsig.cached.*   ✗ Cache (REMOVE with clean-deep)
│       │   └── statsig.failed_logs.* ✗ Failed logs (REMOVE with clean-deep)
│       ├── todos/
│       │   └── *.json             ✗ Todo files (REMOVE with clean-deep)
│       └── projects/
│           └── *.jsonl            ✗ Project sessions (REMOVE with clean-deep)
├── heartbeats/
│   └── *.json                     ✗ Heartbeats (REMOVE with clean)
├── watcher-logs/
│   └── *.log                      ✗ Logs (REMOVE with clean)
├── tasks/
│   └── */*.json                   ✗ Pending tasks (REMOVE with clean)
├── results/
│   └── */*.json                   ✗ Pending results (REMOVE with clean)
├── triggers/
│   └── */*.txt, *.trigger         ✗ Triggers (REMOVE with clean)
└── workspaces/
    └── */*.py, *.js, *.txt        ✗ Workspace files (REMOVE with clean)
```

---

## Common Maintenance Workflows

### 1. Clean Between Test Runs

```bash
# Quick cleanup
make clean

# Or use the test reset helper
make reset-test
```

### 2. Deep Clean Before Important Work

```bash
# Remove all temporary files
make clean-deep

# Check what was kept
ls -la shared/auth-homes/anga/
```

### 3. Fresh Start (Full Reset)

```bash
# Complete system reset
make reset

# After containers start, complete theme selection
make complete-theme

# Verify system is ready
make status
make heartbeat
```

### 4. Debugging Cleanup Issues

```bash
# Check what files exist
find shared -type f -name "*.log" -o -name "*.txt" -o -name "*.py"

# Manual cleanup if needed
rm shared/watcher-logs/*.log
rm shared/heartbeats/*.json

# Or just run deep clean
make clean-deep
```

---

## Troubleshooting

### Cleanup Not Working

**Problem**: Files aren't being deleted

**Solutions**:
```bash
# Check permissions
ls -la shared/

# Fix permissions if needed
docker run --rm -v "$(PWD)/shared:/shared" alpine:latest chown -R $(id -u):$(id -g) /shared

# Try again
make clean-deep
```

### Accidentally Deleted Important Files

**Problem**: Removed `.credentials.json` or `CLAUDE.md`

**Solutions**:
```bash
# Re-copy configs
make setup

# Re-authenticate
make attach-anga  # (or whichever agent)
# Complete authentication in browser

# Restore prompts
cp prompts/orchestrator.md shared/auth-homes/orchestrator/CLAUDE.md
```

### Want to Keep Specific Files

The cleanup commands are designed to preserve all important files. If you need to keep additional files:

1. Move them to `shared/archive/` (never cleaned)
2. Or modify the Makefile cleanup patterns to exclude them

---

## Best Practices

### 1. Regular Cleanup

```bash
# After each development session
make clean

# Weekly deep clean
make clean-deep
```

### 2. Before Testing

```bash
# Always start with clean state
make reset-test

# Or full reset for major tests
make reset
```

### 3. Archive Important Work

```bash
# Check archives
make view-archive

# List archived tasks
make list-archive

# Archives are NEVER cleaned automatically
```

### 4. Check What Will Be Removed

```bash
# See temporary files
find shared/auth-homes/anga/debug -type f
find shared/auth-homes/anga/shell-snapshots -type f
find shared/workspaces/anga -type f

# Then clean
make clean-deep
```

---

## Summary

**Quick Reference**:

| Command | Speed | Scope | Keeps Auth | Keeps Archives |
|---------|-------|-------|------------|----------------|
| `make clean` | Fast | Runtime files | ✓ | ✓ |
| `make clean-deep` | Medium | + Session data | ✓ | ✓ |
| `make clean-all` | Slow | + Containers | ✗ | ✓ |
| `make reset` | Slow | Full restart | ✗ | ✓ |
| `make reset-test` | Fast | Test only | ✓ | ✓ |

**When to use each**:

- **Daily development**: `make clean`
- **End of week**: `make clean-deep`
- **Something's broken**: `make reset`
- **Before testing**: `make reset-test`

---

**Last Updated**: 2025-11-19
