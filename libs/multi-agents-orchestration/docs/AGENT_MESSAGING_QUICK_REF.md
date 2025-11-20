# Agent Messaging - Quick Reference

## Communication Method

**Agents use BASH SCRIPTS (NOT MCP tools) for inter-agent communication**

---

## How to Send Messages

### From Any Agent

Use Claude Code's **Bash tool** to execute the script:

```bash
Bash(bash /tools/send_agent_message.sh <target_agent> "<message>")
```

### Examples

```bash
# From orchestrator to anga
Bash(bash /tools/send_agent_message.sh anga "Please implement a REST API for user authentication")

# From anga to orchestrator  
Bash(bash /tools/send_agent_message.sh orchestrator "Task complete. Code is in /workspace/api/")

# From marie to fabien
Bash(bash /tools/send_agent_message.sh fabien "Our spring recital is May 15th. Can you create promotional materials?")
```

---

## Available Agents

| Agent | Name | Use For |
|-------|------|---------|
| `orchestrator` | Orchestrator | Task coordination |
| `anga` | Anga | Coding tasks |
| `marie` | Marie | Dance teaching |
| `fabien` | Fabien | Marketing |

---

## Test It Now

1. **Start agents**:
   ```bash
   docker-compose up -d orchestrator anga
   ```

2. **Attach to orchestrator**:
   ```bash
   docker attach codehornets-orchestrator
   ```

3. **In orchestrator session, type**:
   ```bash
   Bash(bash /tools/send_agent_message.sh anga "Test message - please acknowledge")
   ```

4. **In another terminal, attach to Anga**:
   ```bash
   docker attach codehornets-worker-anga
   ```

5. **You should see the message appear in Anga's session!**

---

## Key Points

1. **Bash scripts, NOT MCP tools** - Agents use `send_agent_message.sh`
2. **The script works perfectly** - Tested and verified
3. **Uses Claude Code's Bash tool** - No external dependencies
4. **Docker + expect** - Script uses docker attach with expect automation
5. **Requirements**: Docker socket access with group 0 permissions

---

## Technical Details

### How It Works

1. Agent calls: `Bash(bash /tools/send_agent_message.sh anga "message")`
2. Script maps agent name to container (`anga` → `codehornets-worker-anga`)
3. Uses `docker exec` + `expect` in automation container
4. `expect` spawns `docker attach` to target container
5. Sends message to agent's TTY
6. Presses Enter to submit
7. Detaches cleanly

### Requirements

- Docker socket access with group 0 permissions
- Automation container running with `expect` installed
- Target agent container must be running

---

**Status**: Complete - All agents use Bash scripts for communication
**Date**: 2025-11-20
