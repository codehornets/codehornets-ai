# Manual Verification Checklist

## Agent Communication Testing

Use this checklist to verify all 4 communication methods work bidirectionally between all agents.

---

## Test 1: Orchestrator → Anga (All 4 Methods)

### Attach to Orchestrator
```bash
docker attach codehornets-orchestrator
```

### Method 1: Bash Script
Type in orchestrator:
```bash
bash /scripts/send_agent_message.sh anga "Method 1 test from orchestrator"
```
- [ ] Orchestrator executes Bash tool
- [ ] Script shows "✓ Message sent"

### Method 2: Slash Command
Type in orchestrator:
```bash
/msg-anga "Method 2 test from orchestrator"
```
- [ ] Slash command recognized
- [ ] Message sent successfully

### Method 3: Makefile
Type in orchestrator:
```bash
make msg-anga MSG="Method 3 test from orchestrator"
```
- [ ] Make command executes
- [ ] Message sent successfully

### Method 4: Skill
Type in orchestrator:
```bash
Read /shared/skills/agent-messaging.md
```
- [ ] Skill file loads
- [ ] Documentation appears
- [ ] Follow examples to send message

Detach: `Ctrl+P` then `Ctrl+Q`

---

## Test 2: Verify Anga Received Messages

### Attach to Anga
```bash
docker attach codehornets-worker-anga
```

### Check Input Prompt
Look for these messages in Anga's input:
- [ ] "Method 1 test from orchestrator"
- [ ] "Method 2 test from orchestrator"
- [ ] "Method 3 test from orchestrator"

Detach: `Ctrl+P` then `Ctrl+Q`

---

## Test 3: Anga → Orchestrator (Reverse Communication)

### Attach to Anga
```bash
docker attach codehornets-worker-anga
```

### Send Reply to Orchestrator
Type in Anga:
```bash
bash /scripts/send_agent_message.sh orchestrator "Reply from Anga: I received all your messages!"
```
- [ ] Anga executes Bash tool
- [ ] Script shows "✓ Message sent"

Detach: `Ctrl+P` then `Ctrl+Q`

---

## Test 4: Verify Orchestrator Received Reply

### Attach to Orchestrator
```bash
docker attach codehornets-orchestrator
```

### Check Input Prompt
Look for:
- [ ] "Reply from Anga: I received all your messages!"

Detach: `Ctrl+P` then `Ctrl+Q`

---

## Test 5: Worker-to-Worker Communication

### Attach to Anga
```bash
docker attach codehornets-worker-anga
```

### Send to Marie
Type in Anga:
```bash
bash /scripts/send_agent_message.sh marie "Hello Marie, this is Anga testing communication"
```
- [ ] Message sent successfully

Detach and attach to Marie:
```bash
# Ctrl+P, Ctrl+Q to detach
docker attach codehornets-worker-marie
```

### Verify Marie Received
- [ ] Message visible in Marie's input

### Marie Replies to Anga
Type in Marie:
```bash
bash /scripts/send_agent_message.sh anga "Hi Anga! Received your message"
```
- [ ] Message sent successfully

Detach and attach to Anga to verify:
```bash
# Ctrl+P, Ctrl+Q to detach
docker attach codehornets-worker-anga
```
- [ ] Reply visible in Anga's input

---

## Test 6: Test All Agents Can Message Each Other

### Communication Matrix

| From → To | Command to Execute | Status |
|-----------|-------------------|--------|
| Orchestrator → Marie | `bash /scripts/send_agent_message.sh marie "test"` | [ ] |
| Orchestrator → Anga | `bash /scripts/send_agent_message.sh anga "test"` | [ ] |
| Orchestrator → Fabien | `bash /scripts/send_agent_message.sh fabien "test"` | [ ] |
| Marie → Orchestrator | `bash /scripts/send_agent_message.sh orchestrator "test"` | [ ] |
| Marie → Anga | `bash /scripts/send_agent_message.sh anga "test"` | [ ] |
| Marie → Fabien | `bash /scripts/send_agent_message.sh fabien "test"` | [ ] |
| Anga → Orchestrator | `bash /scripts/send_agent_message.sh orchestrator "test"` | [ ] |
| Anga → Marie | `bash /scripts/send_agent_message.sh marie "test"` | [ ] |
| Anga → Fabien | `bash /scripts/send_agent_message.sh fabien "test"` | [ ] |
| Fabien → Orchestrator | `bash /scripts/send_agent_message.sh orchestrator "test"` | [ ] |
| Fabien → Marie | `bash /scripts/send_agent_message.sh marie "test"` | [ ] |
| Fabien → Anga | `bash /scripts/send_agent_message.sh anga "test"` | [ ] |

---

## Test 7: Verify Slash Commands

### From Each Agent's Container

Attach to each agent and test slash commands:

**Orchestrator:**
- [ ] `/msg-marie "test"`
- [ ] `/msg-anga "test"`
- [ ] `/msg-fabien "test"`

**Marie:**
- [ ] `/msg-orchestrator "test"`
- [ ] `/msg-anga "test"`
- [ ] `/msg-fabien "test"`

**Anga:**
- [ ] `/msg-orchestrator "test"`
- [ ] `/msg-marie "test"`
- [ ] `/msg-fabien "test"`

**Fabien:**
- [ ] `/msg-orchestrator "test"`
- [ ] `/msg-marie "test"`
- [ ] `/msg-anga "test"`

---

## Test 8: Verify Makefile Commands

### From Each Agent's Container

Attach to each agent and test make commands:

**Orchestrator:**
- [ ] `make msg-marie MSG="test"`
- [ ] `make msg-anga MSG="test"`
- [ ] `make msg-fabien MSG="test"`

**Workers** (Marie, Anga, Fabien):
- [ ] `make msg-orchestrator MSG="test"`
- [ ] `make msg-<other-worker> MSG="test"`

---

## Test 9: Verify Skills Access

### From Each Agent

Attach to each agent and verify skill is accessible:

```bash
Read /shared/skills/agent-messaging.md
```

- [ ] Orchestrator can read skill
- [ ] Marie can read skill
- [ ] Anga can read skill
- [ ] Fabien can read skill

---

## Success Criteria

✅ **All tests pass if:**

1. All agents can send messages using bash script
2. All agents can send messages using slash commands
3. All agents can send messages using Makefile
4. All agents can read the shared skill
5. Messages are delivered within 10 seconds
6. No errors in automation container logs
7. Bi-directional communication works (A→B and B→A)
8. Worker-to-worker communication works

---

## Troubleshooting

### If messages aren't being delivered:

1. Check automation container:
   ```bash
   docker logs codehornets-svc-automation --tail 50
   ```

2. Verify script exists and is executable:
   ```bash
   docker exec codehornets-orchestrator ls -lh /scripts/send_agent_message.sh
   ```

3. Check Docker socket access:
   ```bash
   docker exec codehornets-orchestrator docker ps
   ```

4. Restart automation container:
   ```bash
   docker-compose restart automation
   ```

---

## After All Tests Pass

Document any issues encountered and create workflow templates for common communication patterns.

**Status**: [ ] All tests completed successfully
**Date**: _______________
**Notes**:

---
