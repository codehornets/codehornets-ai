# Restart Required for MCP Tools

## Current Status

✅ MCP server script exists and works (`/tools/agent_communication_mcp.py`)
✅ MCP configuration files exist in all agent directories (`.mcp.json`)
❌ Claude Code hasn't loaded the MCP tools yet

## Why?

Claude Code only loads MCP servers when it **first starts**. Since the containers were already running when we created the `.mcp.json` files, Claude didn't see them.

## Solution: Proper Container Restart

### Method 1: Full Restart (Recommended)

```bash
# 1. Stop all containers
make down

# Wait 5 seconds
sleep 5

# 2. Start fresh
make up

# 3. Wait for containers to be healthy
sleep 30
make status

# 4. Complete theme selection (required)
make complete-theme
```

### Method 2: Restart Individual Container

```bash
# Restart just the orchestrator
docker restart codehornets-orchestrator

# Wait for it to be ready
sleep 10

# Complete theme (if needed)
make attach-orchestrator
# Press Enter to select default theme
# Then Ctrl+P, Ctrl+Q to detach
```

### Method 3: Stop and Start (More thorough)

```bash
# Stop container
docker stop codehornets-orchestrator

# Remove container (keeps volumes!)
docker rm codehornets-orchestrator

# Recreate from docker-compose
docker-compose up -d orchestrator

# Wait and theme
sleep 10
make complete-theme
```

## Verification After Restart

### Step 1: Check Container is Running

```bash
docker ps | grep orchestrator
# Should show: Up X seconds (healthy)
```

### Step 2: Verify MCP Config Loaded

```bash
# Attach to orchestrator
make attach-orchestrator

# When you see the banner, try:
list_available_agents()

# Expected: JSON with all 4 agents
# If you get "tools not available" - MCP didn't load
```

### Step 3: Check Logs for MCP Messages

```bash
# Look for MCP loading messages
docker logs codehornets-orchestrator 2>&1 | grep -i "mcp" | head -20

# You should see messages about loading MCP servers
```

## If MCP Tools Still Not Available

### Diagnostic: Test MCP Server Manually

The MCP server works - we verified this:

```bash
docker exec codehornets-orchestrator sh -c 'echo "{\"method\": \"tools/list\"}" | python3 /tools/agent_communication_mcp.py'

# Returns: All 3 tools (send_message_to_agent, list_available_agents, check_agent_status)
```

So the issue is **Claude Code not connecting to it**.

### Possible Causes

1. **MCP not enabled in Claude Code**
   - Claude Code might need MCP explicitly enabled
   - Check if there's a feature flag or setting

2. **Wrong .mcp.json location**
   - Claude might be looking in a different directory
   - Try also putting it in `/home/agent/workspace/.mcp.json`

3. **Permission issues**
   - The .mcp.json file might not be readable

### Alternative Locations to Try

```bash
# Copy .mcp.json to workspace root
docker exec codehornets-orchestrator sh -c 'cp /home/agent/.claude/.mcp.json /home/agent/workspace/.mcp.json'

# Restart
docker restart codehornets-orchestrator
sleep 10
make complete-theme
```

## Workaround: Use Tools Directly

While we troubleshoot MCP loading, you can use the communication system directly:

### Send Messages Without MCP

```bash
# From host machine:
bash tools/wake_worker.sh anga "Test message from orchestrator"

# Check if received:
make logs-anga | grep "Test message"
```

### Create Tasks Without MCP

```bash
# Create a task file manually:
make task-anga TITLE="Test" DESC="Testing task system"

# Wake the agent:
make wake-anga
```

## Expected vs. Actual

### What SHOULD Happen

After restart:
1. Container starts
2. Claude Code reads `/home/agent/.claude/.mcp.json`
3. Starts `python3 /tools/agent_communication_mcp.py`
4. Makes tools available in Claude session
5. You can use `list_available_agents()` etc.

### What's ACTUALLY Happening

1. ✅ Container starts
2. ✅ Claude Code starts
3. ❌ Claude Code doesn't load MCP server
4. ❌ Tools not available

## Next Steps

1. **Try full restart first**: `make down && make up && make complete-theme`

2. **If that doesn't work**, check Claude Code version:
   ```bash
   docker exec codehornets-orchestrator claude --version
   ```

3. **Check if MCP is supported** in this Claude Code version

4. **Try alternative .mcp.json location**:
   ```bash
   # Copy to workspace
   docker cp shared/auth-homes/orchestrator/.mcp.json codehornets-orchestrator:/home/agent/workspace/.mcp.json

   # Restart
   docker restart codehornets-orchestrator
   ```

5. **Check Claude Code documentation** for MCP setup

## Testing Communication Without MCP

The good news: **The underlying system works perfectly!**

```bash
# Test 1: Direct wake script
bash tools/wake_worker.sh anga "Hello from orchestrator"
make logs-anga | grep "Hello from orchestrator"
# ✅ Works!

# Test 2: Task creation
make task-anga TITLE="Test" DESC="Test task"
make wake-anga
# ✅ Works!

# Test 3: Check heartbeats
cat shared/heartbeats/anga.json
# ✅ Works!
```

So even without MCP tools in Claude Code, the multi-agent communication infrastructure is fully operational!

## Summary

The MCP server is **ready and working**.
The issue is Claude Code **not loading it** from `.mcp.json`.

Try: `make down && make up && make complete-theme`

If that doesn't work, we can:
- Use the tools directly via bash scripts
- Investigate Claude Code MCP support
- Try alternative MCP configurations

**The system WORKS - we just need Claude to connect to it!** 🚀
