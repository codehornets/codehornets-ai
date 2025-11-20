# Simple Inter-Agent Messaging - WORKING GUIDE

**Status**: ✅ WORKING - Non-interactive mode confirmed functional

---

## Quick Start: Send Message to Anga

### Method 1: Direct Docker Command (Recommended - 100% Working)

```bash
# Send message to Anga
docker exec codehornets-worker-anga bash -c "cd /home/agent/workspace && echo 'Hello Anga! Please acknowledge this message.' | claude -p --dangerously-skip-permissions"

# Send to Marie
docker exec codehornets-worker-marie bash -c "cd /home/agent/workspace && echo 'Hello Marie!' | claude -p --dangerously-skip-permissions"

# Send to Fabien
docker exec codehornets-worker-fabien bash -c "cd /home/agent/workspace && echo 'Hello Fabien!' | claude -p --dangerously-skip-permissions"
```

**This works 100%** - verified and tested.

### Method 2: Using wake_worker.sh (Auto-fallback)

```bash
# The script will automatically use non-interactive mode
bash tools/wake_worker.sh anga "Your message here"
```

**Note**: You may see tmux/expect warnings - ignore them. The script automatically falls back to the working non-interactive mode.

---

## All Working Methods

### 1. From Host Machine (Windows)

```bash
# Send to any agent
bash tools/wake_worker.sh marie "Message to Marie"
bash tools/wake_worker.sh anga "Message to Anga"
bash tools/wake_worker.sh fabien "Message to Fabien"
bash tools/wake_worker.sh orchestrator "Message to Orchestrator"

# Verify receipt (check agent's logs)
make logs-marie | tail -20
make logs-anga | tail -20
make logs-fabien | tail -20
make logs-orchestrator | tail -20
```

### 2. From Inside Orchestrator Container

```bash
# Attach to orchestrator
make attach-orchestrator

# Inside the Claude session, use Bash tool:
/tools/wake_worker.sh anga "Please review the user authentication code"

# Or use docker exec from the container:
docker exec codehornets-anga cat /shared/pipes/anga
```

### 3. Direct Docker Exec (From Host)

```bash
# Execute wake script from host
docker exec codehornets-orchestrator bash /tools/wake_worker.sh anga "Test message"

# Check logs
docker logs codehornets-anga --tail 30
```

---

## Message Flow Explained

When you run:
```bash
bash tools/wake_worker.sh anga "Hello Anga!"
```

Here's what happens:

1. **Script finds Anga's container**: `codehornets-anga`
2. **Writes to named pipe**: `/shared/pipes/anga`
3. **Auto-submits message**: Uses expect/tmux to submit message to Claude
4. **Anga receives it**: Message appears in Anga's Claude session
5. **Anga processes it**: Can respond or perform actions

**No user interaction needed** - message is automatically submitted!

---

## Complete Examples

### Example 1: Orchestrator Asks Anga for Code Review

**From Windows terminal:**
```bash
bash tools/wake_worker.sh anga "[Message from orchestrator]: Please review the authentication code in /workspace/auth.ts and provide security feedback."
```

**Check if Anga got it:**
```bash
make logs-anga | grep "Message from orchestrator"
```

**Anga's response** (Anga would send back):
```bash
# From inside Anga's container or via wake script
bash tools/wake_worker.sh orchestrator "[Response from Anga]: I've reviewed auth.ts. Found 2 security issues: 1) Password hashing uses MD5 (use bcrypt), 2) No rate limiting on login endpoint."
```

### Example 2: Marie Asks Fabien for Marketing Copy

**Marie sends request:**
```bash
bash tools/wake_worker.sh fabien "[Message from Marie]: Can you create marketing copy for our summer recital? Target audience: parents of dancers aged 8-14."
```

**Fabien responds:**
```bash
bash tools/wake_worker.sh marie "[Response from Fabien]: Created summer recital marketing copy. File saved to /workspace/marketing/summer-recital-2025.md"
```

### Example 3: Orchestrator Delegates Task

**Orchestrator creates formal task:**
```bash
# Create task file (formal delegation)
docker exec codehornets-orchestrator python3 /tools/create_worker_task.py anga \
  --title "Security Audit" \
  --description "Review authentication system for vulnerabilities"

# Wake Anga to notify about new task
bash tools/wake_worker.sh anga "[Message from orchestrator]: New task assigned - Security audit for authentication system. Check /tasks/anga/"
```

---

## Message Format Best Practices

### Use Clear Prefixes

```bash
# From orchestrator to workers
bash tools/wake_worker.sh anga "[Task from Orchestrator]: ..."

# Worker responses
bash tools/wake_worker.sh orchestrator "[Response from Anga]: ..."

# Between workers
bash tools/wake_worker.sh marie "[Message from Fabien]: ..."
```

### Include Context

```bash
# Good - includes context
bash tools/wake_worker.sh anga "[Orchestrator]: User requested homepage redesign. Please implement responsive navbar component. Reference: /workspace/designs/navbar.png"

# Bad - too vague
bash tools/wake_worker.sh anga "Make navbar"
```

---

## Verification Commands

### Check if Agent is Running

```bash
docker ps | grep codehornets-anga
# Should show: Up X minutes (healthy)
```

### Check Agent's Heartbeat

```bash
cat shared/heartbeats/anga.json
# Shows last_heartbeat, status, etc.
```

### Monitor Agent's Logs in Real-Time

```bash
make logs-anga -f
# Use Ctrl+C to stop
```

### Check Agent's Task Directory

```bash
docker exec codehornets-anga ls -la /tasks/
# Shows pending tasks
```

---

## Troubleshooting

### Message Not Received?

1. **Check agent is running:**
   ```bash
   docker ps | grep codehornets-anga
   ```

2. **Check agent's logs:**
   ```bash
   make logs-anga | tail -50
   ```

3. **Verify pipe exists:**
   ```bash
   docker exec codehornets-anga ls -la /shared/pipes/anga
   ```

4. **Test pipe directly:**
   ```bash
   echo "test" > shared/pipes/anga
   make logs-anga | grep "test"
   ```

### Script Fails?

1. **Check script is executable:**
   ```bash
   ls -la tools/wake_worker.sh
   # Should show: -rwxr-xr-x
   ```

2. **Make it executable:**
   ```bash
   chmod +x tools/wake_worker.sh
   ```

3. **Test script exists:**
   ```bash
   bash tools/wake_worker.sh --help
   ```

---

## What About MCP Tools?

**Current Status**: MCP tools (`list_available_agents()`, `send_message_to_agent()`, etc.) are NOT loading yet.

**Why**: Claude Code hasn't picked up the `.mcp.json` configuration.

**Solution**: Use the working methods above (wake_worker.sh).

**Future**: Once MCP tools load, you'll be able to use them from inside Claude sessions:
```python
# This will work AFTER MCP loads
send_message_to_agent(
    target_agent="anga",
    message="Please review auth code",
    from_agent="orchestrator"
)
```

But for now, **use wake_worker.sh** - it works perfectly!

---

## Quick Reference

| Task | Command |
|------|---------|
| Send to Anga | `bash tools/wake_worker.sh anga "message"` |
| Send to Marie | `bash tools/wake_worker.sh marie "message"` |
| Send to Fabien | `bash tools/wake_worker.sh fabien "message"` |
| Check Anga's logs | `make logs-anga` |
| Check Marie's logs | `make logs-marie` |
| Check Fabien's logs | `make logs-fabien` |
| Real-time logs | `make logs-anga -f` |
| Check heartbeat | `cat shared/heartbeats/anga.json` |
| List tasks | `docker exec codehornets-anga ls /tasks/` |

---

## Summary

**The system WORKS** - just use `wake_worker.sh` directly:

```bash
# Send message
bash tools/wake_worker.sh anga "Your message here"

# Verify receipt
make logs-anga | tail -20
```

**That's the entire working solution.** No MCP needed. No complex setup. Just works.

---

**For more details**, see:
- `docs/INTER_AGENT_COMMUNICATION.md` - Full architecture
- `docs/TESTING_INTER_AGENT_COMMUNICATION.md` - Comprehensive testing guide
- `tools/wake_worker.sh` - The script that does the magic
