# Preventing Data Loss in Multi-Agent System

## The Problem

Docker containers are **ephemeral** - when you restart or recreate a container, **everything inside is lost** including:
- Conversation history
- Files created in `/home/agent/workspace/`
- Work in progress

## What Happened to Marie's Revised Evaluations

1. Marie was revising 26 evaluations
2. She saved them to `/home/agent/workspace/evaluations_revised/` **inside her container**
3. We restarted the container to fix mount permissions
4. **Everything in the container was wiped**, including all her work and the conversation history

## The Solution: Always Use Mounted Volumes

### ✅ Safe Locations (Persist on Host)

**Marie:**
- `/workspace/dance/` → `C:\workspace\@codehornets-ai\workspaces\dance\`
- `/results/` → `C:\workspace\@codehornets-ai\core\shared\results\marie\`

**Anga:**
- `/workspace/coding/` → `C:\workspace\@codehornets-ai\workspaces\coding\`
- `/results/` → `C:\workspace\@codehornets-ai\core\shared\results\anga\`

**Fabien:**
- `/workspace/marketing/` → `C:\workspace\@codehornets-ai\workspaces\marketing\`
- `/results/` → `C:\workspace\@codehornets-ai\core\shared\results\fabien\`

### ❌ Dangerous Locations (Lost on Restart)

- `/home/agent/workspace/` - **NEVER use this**
- `/tmp/` - Temporary, will be lost
- Any path not explicitly mounted in `docker-compose.yml`

## Best Practices

### 1. **Always Backup Before Restart**

```bash
# Backup a specific agent
make backup-marie

# Backup all agents
make backup-all
```

This saves:
- All files in the container
- Conversation history
- Work in progress

### 2. **Tell Agents to Use Mounted Paths**

Marie's prompt now includes:

```
**CRITICAL: ALWAYS save files to `/workspace/dance/` - NEVER to `/home/agent/workspace/`**

Files saved to `/workspace/dance/` are persisted on the host machine and survive container restarts.
Files saved to `/home/agent/workspace/` are LOST when the container restarts.
```

### 3. **Verify Work is Saved to Host**

After an agent completes work:

```bash
# Check Marie's workspace on host
ls -la workspaces/dance/

# Check results
ls -la core/shared/results/marie/
```

If you don't see files on your host machine, they're only in the container and will be lost!

### 4. **Use Result Files for Task Completion**

Agents should ALWAYS write result files to `/results/` after completing tasks:

```json
{
  "task_id": "task-123",
  "status": "complete",
  "artifacts": [
    {
      "type": "evaluation",
      "path": "/workspace/dance/students/emma/evaluation.md"
    }
  ]
}
```

This documents what was created and where it's located.

## Recovery Procedures

### If You Forgot to Backup Before Restart

If the container is still running:

```bash
# Quick backup
docker cp marie:/home/agent/. backups/emergency-marie/

# Then check what was saved
ls -la backups/emergency-marie/
```

### If Container Was Already Restarted

Unfortunately, data inside the container is **permanently lost**. This is why:
1. Always use mounted volumes
2. Always backup before restart
3. Verify work is on host machine

## Mount Configuration

See `core/docker-compose.yml`:

```yaml
marie:
  volumes:
    - ./prompts:/prompts:ro                        # Read-only prompts
    - ./shared/auth-homes/marie:/home/agent/.claude:rw  # Auth persists
    - ./shared/tasks/marie:/tasks:ro                # Read-only tasks
    - ./shared/results/marie:/results:rw            # Write results here
    - ../workspaces/dance:/workspace/dance:rw       # Write work here (NOW rw!)
```

**Key change**: We changed `/workspace/dance` from `:ro` (read-only) to `:rw` (read-write) so Marie can save directly to the host.

## Summary

**Golden Rule**: If it's important, it must be in a mounted volume:
- `/workspace/{domain}/` ✅
- `/results/` ✅
- `/home/agent/workspace/` ❌

**Before ANY container restart or recreation**: `make backup-all`
