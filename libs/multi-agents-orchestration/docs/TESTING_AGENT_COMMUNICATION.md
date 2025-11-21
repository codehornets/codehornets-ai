# Testing Agent Communication - Step by Step Guide

## Overview

This guide shows you how to properly test all 4 communication methods between agents in the CodeHornets AI system.

**Date**: 2025-11-20
**Prerequisites**: All agents must be authenticated

---

## ✅ Correct Testing Workflow

### Two Ways to Test:

1. **Method A: Send message TO agent asking it to message another agent** (Recommended)
2. **Method B: Attach to agent and have it send message directly**

---

## Method A: External Testing (Recommended for Automation)

### Test 1: Orchestrator → Anga (Bash Script)

```bash
# Send instruction to orchestrator
bash scripts/send_agent_message.sh orchestrator "Please send a test message to Anga using this command: bash /scripts/send_agent_message.sh anga 'Hello from orchestrator'"

# Wait 15-20 seconds for orchestrator to process

# Check orchestrator logs
docker logs codehornets-orchestrator --tail 50

# Check if Anga received the message
docker logs codehornets-worker-anga --tail 50
```

### Test 2: Orchestrator → Marie (Makefile)

```bash
# Send instruction to orchestrator
bash scripts/send_agent_message.sh orchestrator "Please send a test message to Marie using this Makefile command: make msg-marie MSG='Hello from orchestrator'"

# Wait and check logs
docker logs codehornets-orchestrator --tail 50
docker logs codehornets-worker-marie --tail 50
```

### Test 3: Anga → Orchestrator (Reverse Communication)

```bash
# Send instruction to Anga
bash scripts/send_agent_message.sh anga "Please send a message back to the orchestrator using: bash /scripts/send_agent_message.sh orchestrator 'Message received, orchestrator!'"

# Check logs
docker logs codehornets-worker-anga --tail 50
docker logs codehornets-orchestrator --tail 50
```

---

## Method B: Direct Testing (Best for Real-Time Verification)

### Step-by-Step: Orchestrator Sends Message to Anga

1. **Attach to orchestrator**:
   ```bash
   docker attach codehornets-orchestrator
   ```

2. **Type in the orchestrator's Claude CLI**:
   ```
   bash /scripts/send_agent_message.sh anga "Test message from orchestrator"
   ```
   Press Enter

3. **Wait for orchestrator to execute** (you'll see it use the Bash tool)

4. **Detach from orchestrator**:
   Press `Ctrl+P` then `Ctrl+Q`

5. **Attach to Anga to see if message arrived**:
   ```bash
   docker attach codehornets-worker-anga
   ```
   You should see the message in Anga's input prompt

6. **Detach from Anga**:
   Press `Ctrl+P` then `Ctrl+Q`

---

## Testing All 4 Methods

### From Orchestrator Container

**Attach to orchestrator**:
```bash
docker attach codehornets-orchestrator
```

**Method 1: Direct Bash Script**
```bash
bash /scripts/send_agent_message.sh anga "Method 1: Testing bash script"
```

**Method 2: Slash Command**
```bash
/msg-anga "Method 2: Testing slash command"
```

**Method 3: Makefile**
```bash
make msg-anga MSG="Method 3: Testing Makefile"
```

**Method 4: Read the Skill**
```bash
Read("/shared/skills/agent-messaging.md")
```
Then follow the examples in the skill

**Detach**: `Ctrl+P` then `Ctrl+Q`

---

## Verification Matrix

### Full Communication Test Matrix

| Source | Target | Method | Command to Test |
|--------|--------|--------|-----------------|
| Orchestrator | Anga | Bash | `bash /scripts/send_agent_message.sh anga "test"` |
| Orchestrator | Marie | Slash | `/msg-marie "test"` |
| Orchestrator | Fabien | Make | `make msg-fabien MSG="test"` |
| Anga | Orchestrator | Bash | `bash /scripts/send_agent_message.sh orchestrator "test"` |
| Anga | Marie | Slash | `/msg-marie "test"` |
| Marie | Fabien | Make | `make msg-fabien MSG="test"` |
| Fabien | Anga | Bash | `bash /scripts/send_agent_message.sh anga "test"` |

---

## Checking If Messages Were Delivered

### View Agent Logs

```bash
# Orchestrator
docker logs codehornets-orchestrator --tail 50

# Workers
docker logs codehornets-worker-anga --tail 50
docker logs codehornets-worker-marie --tail 50
docker logs codehornets-worker-fabien --tail 50
```

### Look For:

In **sender logs**:
- ✅ Bash tool execution
- ✅ "Sending message to: <agent>"
- ✅ "✓ Message sent"

In **receiver logs**:
- ✅ Message appears in the input prompt
- ✅ Agent acknowledges or responds to the message

---

## Common Issues & Solutions

### Issue: Message not delivered

**Check 1**: Is automation container running?
```bash
docker ps | grep automation
```

**Check 2**: Is target agent running and authenticated?
```bash
docker ps | grep codehornets-worker
```

**Check 3**: View automation logs
```bash
docker logs codehornets-svc-automation --tail 30
```

### Issue: Slash command not found

**Check**: Are command files present?
```bash
ls -la shared/auth-homes/orchestrator/commands/
ls -la shared/auth-homes/marie/commands/
ls -la shared/auth-homes/anga/commands/
ls -la shared/auth-homes/fabien/commands/
```

**Fix**: Command files should be in each agent's `.claude/commands/` directory

### Issue: Make command not found

**Check**: Is make installed?
```bash
docker exec codehornets-orchestrator which make
docker exec codehornets-worker-anga which make
```

**Fix**: Install make
```bash
docker exec --user root <container-name> apt-get update && apt-get install -y make
```

### Issue: Skill file not found

**Check**: Is skill mounted?
```bash
docker exec codehornets-orchestrator ls -lh /shared/skills/agent-messaging.md
```

**Fix**: Ensure `shared/skills` volume is mounted in docker-compose.yml

---

## Expected Behavior

### When Working Correctly:

1. **Sender agent** uses Bash tool to execute send_agent_message.sh
2. **Script runs** in automation container using expect
3. **Message is delivered** to target agent's input prompt via docker attach
4. **Target agent sees** the message and can respond
5. **Takes ~10 seconds** end-to-end (includes processing time)

### Visual Flow:

```
You → Attach to Orchestrator
         ↓
Orchestrator (Claude) uses Bash tool
         ↓
bash /scripts/send_agent_message.sh anga "message"
         ↓
Automation Container (expect + docker attach)
         ↓
Message delivered to Anga's input prompt
         ↓
You → Attach to Anga to see the message
```

---

## Quick Test Script

```bash
#!/bin/bash
# Quick test of all communication methods

echo "Testing Orchestrator → Anga communication..."

# Test Method 1
echo "→ Testing Method 1 (Bash)"
bash scripts/send_agent_message.sh orchestrator "Test Anga communication: bash /scripts/send_agent_message.sh anga 'Method 1 works'"

sleep 20

# Test Method 3
echo "→ Testing Method 3 (Makefile)"
bash scripts/send_agent_message.sh orchestrator "Test Anga communication: make msg-anga MSG='Method 3 works'"

sleep 20

# Check results
echo ""
echo "Checking Orchestrator logs:"
docker logs codehornets-orchestrator --tail 30 | grep -i "message sent"

echo ""
echo "Checking Anga logs:"
docker logs codehornets-worker-anga --tail 30 | grep -i "method"

echo ""
echo "Test complete! Check logs above for confirmation."
```

---

## Best Practices

1. **Always wait 15-20 seconds** between sending messages (agents need time to process)
2. **Use descriptive messages** so you can easily identify them in logs
3. **Prefix messages** with agent name: `[Message from orchestrator]: ...`
4. **Test one method at a time** to avoid confusion
5. **Check both sender and receiver logs** to verify delivery
6. **Detach properly** using `Ctrl+P` `Ctrl+Q` (don't use `Ctrl+C` or `exit`)

---

## Success Indicators

✅ **Communication is working if:**
- Sender's logs show "✓ Message sent to <agent>"
- Receiver's logs show the message in their input prompt
- Receiver can respond or acknowledge the message
- No errors in automation container logs
- All 4 methods work from all 4 agents

---

## Next Steps After Successful Testing

1. Document any issues encountered
2. Create workflow templates for common communication patterns
3. Set up monitoring for failed message deliveries
4. Consider adding message history/logging
5. Create automated tests for continuous validation

---

**Happy Testing!** 🚀

For more information, see:
- `docs/AGENT_MESSAGING_IMPLEMENTATION.md` - Full implementation details
- `shared/skills/agent-messaging.md` - Comprehensive messaging guide
- `scripts/send_agent_message.sh` - Core messaging script
