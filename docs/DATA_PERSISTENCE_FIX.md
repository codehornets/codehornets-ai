# Data Persistence Fix - Complete Solution

## Problem Statement

**Before this fix:**
- ❌ Conversation history lost on container restart
- ❌ Work files saved to `/home/agent/workspace/` lost on container restart
- ❌ Hours of work could disappear with a simple `docker restart`

## The Solution - Mount Everything

### What Changed in `docker-compose.yml`

**Added new volume mount for each agent:**

```yaml
marie:
  volumes:
    # ... existing mounts ...
    - ./shared/workspaces/marie:/home/agent/workspace:rw  # ← NEW
```

This mounts the agent's entire workspace directory to the host filesystem.

### What This Fixes

✅ **Conversation History Persisted**
- Claude Code stores sessions in `/home/agent/workspace/.claude/`
- Now saved to: `C:\workspace\@codehornets-ai\core\shared\workspaces\marie\.claude\`
- Survives container restarts, rebuilds, and updates

✅ **All Work Files Persisted**
- Any file created in `/home/agent/workspace/` is now saved to host
- Located at: `C:\workspace\@codehornets-ai\core\shared\workspaces\{agent}\`
- Permanent storage on your computer

✅ **Domain-Specific Work Already Persisted**
- `/workspace/dance/` → `C:\workspace\@codehornets-ai\workspaces\dance\`
- `/workspace/coding/` → `C:\workspace\@codehornets-ai\workspaces\coding\`
- `/workspace/marketing/` → `C:\workspace\@codehornets-ai\workspaces\marketing\`

## Complete Persistence Map

### Marie's File Locations

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| `/home/agent/workspace/` | `core/shared/workspaces/marie/` | **Chat history + temp work** |
| `/workspace/dance/` | `workspaces/dance/` | Dance evaluations & files |
| `/results/` | `core/shared/results/marie/` | Task completion results |
| `/tasks/` | `core/shared/tasks/marie/` | Incoming tasks (read-only) |
| `/home/agent/.claude` | `core/shared/auth-homes/marie/` | Authentication credentials |

### Anga's File Locations

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| `/home/agent/workspace/` | `core/shared/workspaces/anga/` | **Chat history + temp work** |
| `/workspace/coding/` | `workspaces/coding/` | Code projects & files |
| `/results/` | `core/shared/results/anga/` | Task completion results |
| `/tasks/` | `core/shared/tasks/anga/` | Incoming tasks (read-only) |
| `/home/agent/.claude` | `core/shared/auth-homes/anga/` | Authentication credentials |

### Fabien's File Locations

| Container Path | Host Path | Purpose |
|---------------|-----------|---------|
| `/home/agent/workspace/` | `core/shared/workspaces/fabien/` | **Chat history + temp work** |
| `/workspace/marketing/` | `workspaces/marketing/` | Marketing materials & files |
| `/results/` | `core/shared/results/fabien/` | Task completion results |
| `/tasks/` | `core/shared/tasks/fabien/` | Incoming tasks (read-only) |
| `/home/agent/.claude` | `core/shared/auth-homes/fabien/` | Authentication credentials |

## How to Apply This Fix

1. **Already Applied**: The `docker-compose.yml` has been updated

2. **Recreate Containers** (one at a time or all):
   ```bash
   # Recreate Marie
   make restart-workers

   # Or recreate all agents
   cd core && docker-compose down
   cd core && docker-compose up -d
   ```

3. **Verify It's Working**:
   ```bash
   # Check Marie's workspace is mounted
   ls -la core/shared/workspaces/marie/

   # You should see CLAUDE.md and eventually .claude/ directory
   ```

## Viewing Conversation History

Each agent's conversation history is stored locally at:

```bash
# Marie's chat history
ls -la core/shared/workspaces/marie/.claude/

# Anga's chat history
ls -la core/shared/workspaces/anga/.claude/

# Fabien's chat history
ls -la core/shared/workspaces/fabien/.claude/
```

Claude Code stores this as SQLite databases and JSON files.

## Backup Is Now Easier

With everything persisted to the host, backing up is simple:

```bash
# Backup entire system
tar -czf backup-$(date +%Y%m%d).tar.gz \
  core/shared/workspaces/ \
  core/shared/auth-homes/ \
  workspaces/

# Or use the built-in backup command
make backup-all
```

## Testing Data Persistence

1. **Start Marie and have a conversation**:
   ```bash
   make attach-marie
   # Have a conversation with Marie
   # Press Ctrl+P then Ctrl+Q to detach
   ```

2. **Restart Marie**:
   ```bash
   cd core && docker-compose restart marie
   ```

3. **Check conversation history is still there**:
   ```bash
   make attach-marie
   # Use up arrow to see previous commands
   # Conversation context should be preserved
   ```

## What Happens on Container Restart Now

**Before Fix:**
- 💥 Conversation history: LOST
- 💥 Work in `/home/agent/workspace/`: LOST
- ✅ Work in `/workspace/dance/`: Kept
- ✅ Work in `/results/`: Kept

**After Fix:**
- ✅ Conversation history: **KEPT**
- ✅ Work in `/home/agent/workspace/`: **KEPT**
- ✅ Work in `/workspace/dance/`: Kept
- ✅ Work in `/results/`: Kept

## Maintenance

### Cleaning Up Old Data

Over time, conversation history and temp files can accumulate:

```bash
# View workspace sizes
du -sh core/shared/workspaces/*

# Clean Marie's workspace (careful - deletes chat history!)
rm -rf core/shared/workspaces/marie/*

# Clean all workspaces
make clean-workspaces  # If you add this to Makefile
```

### Preserving Important Conversations

To preserve specific conversations before cleanup:

```bash
# Copy Marie's chat history to permanent backup
cp -r core/shared/workspaces/marie/.claude \
      backups/marie-chat-$(date +%Y%m%d)/
```

## Summary

**Every agent now has 3 persistent locations:**

1. **`/home/agent/workspace/`** → Host (chat history + temp work)
2. **`/workspace/{domain}/`** → Host (domain-specific files)
3. **`/results/`** → Host (task results)

**Nothing is lost on restart!** 🎉

All work, all conversations, all files persist on your local machine at:
```
C:\workspace\@codehornets-ai\
├── core/shared/workspaces/     ← Chat history & temp work
├── workspaces/                 ← Domain-specific work
└── core/shared/results/        ← Task results
```
