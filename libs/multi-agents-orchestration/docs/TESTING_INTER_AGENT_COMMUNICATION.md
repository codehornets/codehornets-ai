# Testing Inter-Agent Communication

## Quick Start Test (5 minutes)

The fastest way to test the inter-agent communication system.

### Prerequisites

```bash
# 1. Make sure all agents are running
make status

# Expected output: All containers should be "Up" and "healthy"
```

### Test 1: Orchestrator → Anga (Simple Message)

```bash
# Step 1: Attach to orchestrator
make attach-orchestrator

# Step 2: Wait for Claude to initialize (you'll see the banner)
# Step 3: In the orchestrator session, type:

list_available_agents()

# You should see all 4 agents with their status

# Step 4: Send a test message to Anga
send_message_to_agent(
    target_agent="anga",
    message="Hello Anga! This is a test message. Please respond with 'Message received!'",
    from_agent="orchestrator"
)

# Step 5: Detach from orchestrator (IMPORTANT!)
# Press: Ctrl+P then Ctrl+Q

# Step 6: Check if Anga received the message
make logs-anga

# You should see: "[Message from orchestrator]: Hello Anga!..."
```

### Test 2: Anga → Orchestrator (Response)

```bash
# Step 1: Attach to Anga
make attach-anga

# Step 2: Wait for initialization

# Step 3: Send response to orchestrator
send_message_to_agent(
    target_agent="orchestrator",
    message="Message received! Communication system is working perfectly!",
    from_agent="anga"
)

# Step 4: Detach (Ctrl+P then Ctrl+Q)

# Step 5: Verify orchestrator received it
make logs-orchestrator
```

---

## Comprehensive Test Suite

### Test 3: Check Agent Status

```bash
# Attach to any agent
make attach-orchestrator

# Check if agents are available
check_agent_status(agent_name="marie")
check_agent_status(agent_name="anga")
check_agent_status(agent_name="fabien")

# Expected: JSON with status, heartbeat, tasks_completed
```

### Test 4: Marie → Fabien (Cross-Agent Communication)

```bash
# Step 1: Attach to Marie
make attach-marie

# Step 2: Send message to Fabien
send_message_to_agent(
    target_agent="fabien",
    message="Hi Fabien! We have a spring recital on May 15th. Can you help create promotional materials?",
    from_agent="marie"
)

# Step 3: Detach and check Fabien's logs
make logs-fabien

# Step 4: Attach to Fabien and respond
make attach-fabien

send_message_to_agent(
    target_agent="marie",
    message="Absolutely! I'd love to help. Can you share the recital theme and featured performances?",
    from_agent="fabien"
)

# Step 5: Verify Marie received it
make logs-marie
```

### Test 5: Multi-Agent Broadcast

```bash
# Attach to orchestrator
make attach-orchestrator

# Send message to all workers
send_message_to_agent("marie", "Team meeting in 5 minutes. Please check your tasks.", "orchestrator")
send_message_to_agent("anga", "Team meeting in 5 minutes. Please check your tasks.", "orchestrator")
send_message_to_agent("fabien", "Team meeting in 5 minutes. Please check your tasks.", "orchestrator")

# Detach and verify all received
make logs-marie
make logs-anga
make logs-fabien
```

---

## Advanced Testing

### Test 6: End-to-End Collaboration Workflow

This simulates a real project with multiple agents collaborating.

```bash
# 1. Orchestrator initiates project
make attach-orchestrator

send_message_to_agent(
    target_agent="anga",
    message="New project: Build a student registration API with database. Should include student name, age, dance styles, and contact info.",
    from_agent="orchestrator"
)

send_message_to_agent(
    target_agent="marie",
    message="New project: Student registration system. Anga will build the API. Please provide him with the data fields you need for student tracking.",
    from_agent="orchestrator"
)

# Detach (Ctrl+P, Ctrl+Q)

# 2. Anga coordinates with Marie
make attach-anga

send_message_to_agent(
    target_agent="marie",
    message="I'm building the student registration API. What specific data fields do you need? Dance styles, skill levels, evaluation dates?",
    from_agent="anga"
)

# Detach

# 3. Marie responds with requirements
make attach-marie

send_message_to_agent(
    target_agent="anga",
    message="For student tracking I need: Full name, age, dance styles (ballet, jazz, contemporary), skill level (beginner/intermediate/advanced), parent contact, and evaluation history. Thanks!",
    from_agent="marie"
)

# Detach

# 4. Anga builds and notifies completion
make attach-anga

# (Simulate some work here)

send_message_to_agent(
    target_agent="marie",
    message="Student registration API is complete! All the fields you requested are included. You can test it at /api/students",
    from_agent="anga"
)

send_message_to_agent(
    target_agent="orchestrator",
    message="Student registration API complete. Database schema includes all requirements from Marie. Ready for production.",
    from_agent="anga"
)

# Detach

# 5. Verify all messages were delivered
make logs-orchestrator
make logs-marie
make logs-anga
```

### Test 7: Error Handling

Test what happens when messaging an offline agent:

```bash
# Stop a worker
make stop-marie  # Or: docker stop codehornets-worker-marie

# Try to message the stopped agent
make attach-orchestrator

send_message_to_agent(
    target_agent="marie",
    message="Are you there?",
    from_agent="orchestrator"
)

# Expected: Error message about container not running

# Restart Marie
make start-marie

# Try again - should work now
```

---

## Automated Testing Scripts

### Quick Test Script

Create a test script to automate basic testing:

```bash
# Save as: tools/test_communication.sh
#!/bin/bash

echo "🧪 Testing Inter-Agent Communication"
echo "===================================="
echo ""

# Test 1: Check all agents running
echo "Test 1: Checking agent status..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep codehornets

echo ""
echo "Test 2: Checking heartbeats..."
for agent in orchestrator marie anga fabien; do
    if [ -f "shared/heartbeats/${agent}.json" ]; then
        echo "✓ ${agent} heartbeat found"
    else
        echo "✗ ${agent} heartbeat missing"
    fi
done

echo ""
echo "Test 3: Testing MCP server..."
docker exec codehornets-orchestrator python3 /tools/agent_communication_mcp.py <<EOF
{"method": "tools/list"}
EOF

echo ""
echo "Test 4: Sending test message..."
docker exec codehornets-svc-automation bash /tools/wake_worker.sh anga "Test message from automation script"

echo ""
echo "✓ Tests complete! Check logs with: make logs-anga"
```

Run it:
```bash
chmod +x tools/test_communication.sh
bash tools/test_communication.sh
```

---

## Troubleshooting Tests

### Problem: Agent doesn't receive message

**Check 1**: Is the agent running?
```bash
docker ps | grep codehornets-worker-anga
```

**Check 2**: Is automation container running?
```bash
docker ps | grep codehornets-svc-automation
```

**Check 3**: Test wake_worker.sh directly
```bash
bash tools/wake_worker.sh anga "Direct test message"
```

**Check 4**: View wake_worker.sh output
```bash
# The script shows which method it's using
# Look for: "Method: expect", "Method: tmux", etc.
```

### Problem: MCP tools not available

**Check 1**: Verify .mcp.json exists
```bash
ls -la shared/auth-homes/orchestrator/.mcp.json
ls -la shared/auth-homes/anga/.mcp.json
```

**Check 2**: Verify MCP server script is executable
```bash
ls -la tools/agent_communication_mcp.py
# Should show: -rwxr-xr-x
```

**Check 3**: Test MCP server manually
```bash
docker exec codehornets-orchestrator python3 /tools/agent_communication_mcp.py
# Then type: {"method": "tools/list"}
# Press Ctrl+D to exit
```

### Problem: Message sent but agent doesn't respond

**This is normal!** Agents are autonomous - they may:
- Be processing another task
- Need time to formulate a response
- Not have a reason to respond

**To verify message was delivered**:
```bash
# Check target agent's logs
make logs-anga | grep "Message from"

# You should see: [Message from orchestrator]: ...
```

---

## Monitoring During Tests

### Watch Multiple Agents Simultaneously

**Terminal 1**: Orchestrator logs
```bash
make logs-orchestrator
```

**Terminal 2**: Anga logs
```bash
make logs-anga
```

**Terminal 3**: Marie logs
```bash
make logs-marie
```

**Terminal 4**: System activity
```bash
make activity-live
```

### Check Communication Flow

```bash
# See all recent messages in logs
for agent in orchestrator marie anga fabien; do
    echo "=== $agent ==="
    docker logs codehornets-worker-$agent 2>&1 | grep "Message from" | tail -5
done
```

---

## Test Checklist

Use this checklist to verify everything works:

- [ ] All agents are running (`make status`)
- [ ] All heartbeats exist (`ls shared/heartbeats/*.json`)
- [ ] MCP server is accessible (`docker exec ... python3 /tools/agent_communication_mcp.py`)
- [ ] `list_available_agents()` returns all 4 agents
- [ ] `check_agent_status(agent_name="anga")` returns heartbeat data
- [ ] Orchestrator can message Anga
- [ ] Anga can message Orchestrator
- [ ] Marie can message Fabien
- [ ] Fabien can message Marie
- [ ] Messages appear in target agent logs
- [ ] Messages are prefixed with `[Message from X]:`

---

## Example Test Session (Copy-Paste Ready)

Here's a complete test session you can copy and paste:

```bash
# Terminal 1: Start system
make up
make status

# Terminal 2: Monitor Anga
make logs-anga

# Terminal 3: Run tests
make attach-orchestrator

# Wait for orchestrator to initialize, then:

# Test 1: List agents
list_available_agents()

# Test 2: Check status
check_agent_status(agent_name="anga")

# Test 3: Send message
send_message_to_agent(
    target_agent="anga",
    message="Hello Anga! Please acknowledge this test message by responding.",
    from_agent="orchestrator"
)

# Detach: Ctrl+P, Ctrl+Q

# Switch to Terminal 2 - you should see the message in Anga's logs

# Attach to Anga
make attach-anga

# Send response
send_message_to_agent(
    target_agent="orchestrator",
    message="Test message acknowledged! System working great!",
    from_agent="anga"
)

# Detach: Ctrl+P, Ctrl+Q

# Check orchestrator logs
make logs-orchestrator | grep "Message from anga"

# Success! ✓
```

---

## Performance Testing

### Measure Message Delivery Time

```bash
# Send message with timestamp
make attach-orchestrator

send_message_to_agent(
    target_agent="anga",
    message=f"Test at {datetime.now().isoformat()}",
    from_agent="orchestrator"
)

# Check logs and compare timestamps
make logs-anga | grep "Test at"

# Typical delivery time: < 2 seconds
```

---

## Success Criteria

✅ **Communication system is working if**:

1. All agents show as "online" in `list_available_agents()`
2. Messages appear in target agent logs within 5 seconds
3. Messages are prefixed with `[Message from X]:`
4. Agents can send messages to each other (not just receive)
5. No error messages in logs
6. Heartbeats update regularly

---

## Quick Reference Commands

```bash
# Start system
make up

# Check status
make status
make heartbeat

# Attach to agents
make attach-orchestrator
make attach-marie
make attach-anga
make attach-fabien

# Detach (while attached)
# Press: Ctrl+P then Ctrl+Q

# View logs
make logs-orchestrator
make logs-marie
make logs-anga
make logs-fabien

# Monitor activity
make activity-live

# Test message delivery
bash tools/wake_worker.sh <agent> "Test message"
```

---

## Next Steps After Testing

Once tests pass, you can:

1. **Create real workflows**: Use agents to collaborate on actual projects
2. **Monitor collaboration**: Watch agents communicate in real-time
3. **Optimize**: Adjust message formats based on usage patterns
4. **Extend**: Add new agents or communication features

**Your multi-agent communication system is ready for production use!** 🚀
