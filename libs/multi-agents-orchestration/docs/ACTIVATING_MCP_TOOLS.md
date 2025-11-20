# Activating MCP Tools for Inter-Agent Communication

## The Issue

When you first try to use the inter-agent communication tools, you might get an error:
```
The MCP tools described in the CLAUDE.md instructions are not currently available
```

This happens because **Claude Code needs to restart to load the new `.mcp.json` configuration**.

## Solution: Restart All Agents

The MCP server script is already created and mounted. You just need to restart the containers so Claude Code picks up the new configuration.

### Quick Fix (Recommended)

```bash
# Stop all agents
make down

# Start them again
make up

# Complete theme selection (required after restart)
make complete-theme
```

### What This Does

1. **Stops** all running containers
2. **Starts** them fresh
3. Claude Code reads `.mcp.json` on startup
4. **MCP tools become available**

---

## Verification Steps

After restarting, verify the MCP tools are loaded:

### Step 1: Check MCP Configuration Files Exist

```bash
# All 4 agents should have .mcp.json
ls -la shared/auth-homes/orchestrator/.mcp.json
ls -la shared/auth-homes/marie/.mcp.json
ls -la shared/auth-homes/anga/.mcp.json
ls -la shared/auth-homes/fabien/.mcp.json

# All should show the file exists
```

### Step 2: Check MCP Server Script

```bash
# Script should be executable
ls -la tools/agent_communication_mcp.py

# Should show: -rwxr-xr-x ... agent_communication_mcp.py
```

### Step 3: Test MCP Server Manually

```bash
# Test from within orchestrator container
docker exec -it codehornets-orchestrator bash

# Inside container, test the MCP server:
python3 /tools/agent_communication_mcp.py

# Then type (and press Enter):
{"method": "tools/list"}

# You should see JSON output with the 3 tools:
# - send_message_to_agent
# - list_available_agents
# - check_agent_status

# Press Ctrl+D to exit
exit
```

### Step 4: Attach and Test Tools

```bash
# Attach to orchestrator
make attach-orchestrator

# Wait for banner to appear

# Try listing agents
list_available_agents()

# If you see a JSON response with all 4 agents, IT WORKS! ✅
```

---

## If Tools Still Not Available

### Option 1: Force Restart Individual Agent

```bash
# Stop specific agent
docker stop codehornets-orchestrator

# Start it
docker start codehornets-orchestrator

# Attach and check
make attach-orchestrator

# In the Claude session:
list_available_agents()
```

### Option 2: Check Claude Code Logs

```bash
# See if there are MCP loading errors
docker logs codehornets-orchestrator 2>&1 | grep -i mcp

# Look for lines like:
# "Loading MCP server: agent-communication"
# or errors like "Failed to load MCP server"
```

### Option 3: Verify Docker Volume Mounts

```bash
# Check if tools directory is mounted
docker exec codehornets-orchestrator ls -la /tools/

# You should see: agent_communication_mcp.py

# Check if .mcp.json is in home directory
docker exec codehornets-orchestrator cat /home/agent/.claude/.mcp.json

# Should show the configuration
```

---

## Common Issues

### Issue 1: "Command 'python3' not found"

**Cause**: Python not installed in container

**Fix**: The `docker/sandbox-templates:claude-code` image should have Python. If not:
```bash
# Check Python version
docker exec codehornets-orchestrator python3 --version

# If missing, use python instead:
docker exec codehornets-orchestrator python --version
```

Update `.mcp.json` if needed:
```json
{
  "mcpServers": {
    "agent-communication": {
      "command": "python",  // Changed from python3
      "args": ["/tools/agent_communication_mcp.py"]
    }
  }
}
```

### Issue 2: "Permission denied" when running script

**Cause**: Script not executable

**Fix**:
```bash
# Make script executable
chmod +x tools/agent_communication_mcp.py

# Restart containers
make restart
make complete-theme
```

### Issue 3: MCP Server Crashes

**Cause**: Syntax error or missing dependencies

**Fix**: Test the script directly
```bash
# Run the script manually
docker exec codehornets-orchestrator python3 /tools/agent_communication_mcp.py <<EOF
{"method": "tools/list"}
EOF

# If you see errors, check the script syntax
```

---

## Alternative: Manual Testing Without MCP

If MCP tools aren't loading, you can still test inter-agent communication manually:

```bash
# Send a message using the wake_worker.sh script directly
bash tools/wake_worker.sh anga "Test message from orchestrator"

# Check if Anga received it
make logs-anga | grep "Test message"
```

This proves the underlying communication system works, even if MCP isn't loading the tools.

---

## Expected Behavior After Restart

Once you restart and the MCP tools load correctly:

### In Orchestrator Session:

```python
# This should work:
>>> list_available_agents()

# Returns:
{
  "success": true,
  "agents": {
    "orchestrator": {...},
    "marie": {...},
    "anga": {...},
    "fabien": {...}
  }
}

# This should work:
>>> send_message_to_agent(
      target_agent="anga",
      message="Test",
      from_agent="orchestrator"
    )

# Returns:
{
  "success": true,
  "target_agent": "anga",
  "message_sent": "Test",
  ...
}
```

---

## Complete Restart Procedure

Here's the **complete step-by-step** procedure:

```bash
# 1. Stop everything
make down

# 2. Verify MCP configs exist
ls shared/auth-homes/*/.mcp.json

# 3. Verify MCP server script exists
ls -la tools/agent_communication_mcp.py

# 4. Start everything
make up

# 5. Wait for containers to be healthy (30 seconds)
sleep 30
make status

# 6. Complete theme selection
make complete-theme

# 7. Attach to orchestrator
make attach-orchestrator

# 8. Test MCP tools
list_available_agents()

# 9. If it works, you're done! ✅
```

---

## Success Indicators

✅ **MCP tools are working if**:

1. `list_available_agents()` returns JSON with all 4 agents
2. No error about "tools not available"
3. `check_agent_status(agent_name="anga")` returns heartbeat data
4. `send_message_to_agent()` returns success status

---

## Quick Test Script

Save this as `test_mcp_tools.sh`:

```bash
#!/bin/bash
echo "🧪 Testing MCP Tools Availability"
echo "=================================="

echo ""
echo "1. Checking MCP configs..."
for agent in orchestrator marie anga fabien; do
    if [ -f "shared/auth-homes/${agent}/.mcp.json" ]; then
        echo "  ✓ ${agent} .mcp.json exists"
    else
        echo "  ✗ ${agent} .mcp.json MISSING"
    fi
done

echo ""
echo "2. Checking MCP server script..."
if [ -x "tools/agent_communication_mcp.py" ]; then
    echo "  ✓ agent_communication_mcp.py exists and is executable"
else
    echo "  ✗ agent_communication_mcp.py missing or not executable"
fi

echo ""
echo "3. Testing MCP server..."
docker exec codehornets-orchestrator python3 /tools/agent_communication_mcp.py <<EOF
{"method": "tools/list"}
EOF

echo ""
echo "4. If you see JSON output above with 3 tools, MCP server works!"
echo "5. Now restart agents: make down && make up && make complete-theme"
echo "6. Then attach and test: make attach-orchestrator"
```

Run it:
```bash
chmod +x test_mcp_tools.sh
bash test_mcp_tools.sh
```

---

## Summary

**The fix is simple**: Restart the containers!

```bash
make down
make up
make complete-theme
make attach-orchestrator
```

Then test:
```python
list_available_agents()
```

If that works, **your inter-agent communication system is live!** 🚀
