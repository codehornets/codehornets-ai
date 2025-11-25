# Permission Configuration for Workers

## Overview

Workers are configured to auto-approve safe operations to enable full automation without manual permission prompts.

## Configuration

### Permission Mode: `bypassPermissions`

Workers start Claude CLI with the following flags:

```bash
claude --permission-mode bypassPermissions \
       --add-dir /tasks \
       --add-dir /results \
       --add-dir /home/agent/workspace
```

### What This Enables

**Auto-Approved Operations:**
- ✅ Reading from `/tasks` directory (task files)
- ✅ Writing to `/results` directory (result files)
- ✅ Reading/writing in `/home/agent/workspace` (working directory)
- ✅ File operations (Read, Write, Edit, Glob, Grep)
- ✅ Bash commands within allowed directories

**Why This Is Safe:**
- Workers run in isolated Docker containers
- Containers have no internet access by default
- Each worker has a dedicated workspace
- Shared volumes have appropriate permissions
- Operations are limited to approved directories

## Alternative Modes

If you need more control, you can use:

### 1. Accept Edits Mode (Manual Bash Approval)
```bash
claude --permission-mode acceptEdits \
       --add-dir /tasks \
       --add-dir /results
```
- Auto-approves file edits
- Asks for Bash command confirmation

### 2. Bypass All Permissions (Maximum Automation)
```bash
claude --dangerously-skip-permissions
```
- ⚠️ Only use in fully sandboxed environments
- No permission prompts at all

### 3. Whitelist Specific Tools
```bash
claude --allowedTools "Read Write Edit Glob Grep Bash(ls:*) Bash(cat:*)"
```
- Fine-grained control over specific operations

## Updating Configuration

### For Workers (Marie, Anga, Fabien)

Edit: `tools/entrypoint.sh` line 97 and 119

```bash
spawn claude --permission-mode dontAsk --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace
```

### For Orchestrator

Edit: `docker-compose.yml` line 45

```bash
claude --permission-mode dontAsk --add-dir /tasks --add-dir /results --add-dir /workspaces
```

## Applying Changes

After updating configuration:

```bash
# Restart all agents
make restart

# Or restart specific worker
docker-compose restart anga

# Or full rebuild
make down
make up
```

## Troubleshooting

### Still Getting Permission Prompts?

1. **Check container startup:**
   ```bash
   docker logs codehornets-worker-anga | grep "permission-mode"
   ```

2. **Verify flags were applied:**
   ```bash
   docker exec codehornets-worker-anga ps aux | grep claude
   ```

3. **Restart worker:**
   ```bash
   make restart
   ```

### Want More Restrictive Permissions?

Change `dontAsk` to `default` or `acceptEdits`:

```bash
claude --permission-mode default --add-dir /tasks --add-dir /results
```

## Security Notes

- Permission mode is scoped per container
- Each worker's workspace is isolated
- Orchestrator has separate permissions
- Shared volumes use mounted directories with restricted access
- No cross-worker file access without explicit mounting

## See Also

- [Claude CLI Permission Docs](https://docs.anthropic.com/claude-code)
- `claude --help` for all permission options
- `WORKER_ACTIVATION.md` for automation details
