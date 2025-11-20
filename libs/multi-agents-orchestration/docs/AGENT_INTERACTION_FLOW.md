# Agent Interaction Flow - Complete Process

## Overview

This document explains the **complete flow** when you send a prompt to the orchestrator asking it to send a message to another agent (like Anga).

## Example Scenario

**Your Prompt**: "Orchestrator, send a message to Anga asking him to review the auth code"

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: You Send Prompt to Orchestrator                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ You (Human)                                                      │
│   │                                                              │
│   ├─→ bash tools/send_agent_message.sh orchestrator \           │
│        "Send a message to Anga asking him to review auth code"  │
│                                                                  │
│   OR                                                             │
│                                                                  │
│   ├─→ make msg-orchestrator MSG="Send a message to Anga..."    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: send_agent_message.sh (Host System)                     │
│                                                                  │
│   ├─→ Validates: orchestrator is running                        │
│   ├─→ Validates: automation container is running                │
│   ├─→ Calls automation container with expect script             │
│                                                                  │
│   docker exec codehornets-svc-automation sh -c "                │
│     expect <<'EXPECT_EOF'                                        │
│       spawn docker attach codehornets-orchestrator              │
│       send \"Send a message to Anga...\"                        │
│       send \"\\r\"                                              │
│       sleep 10                                                   │
│       send \"\\x10\\x11\"  # Detach                             │
│     EXPECT_EOF                                                   │
│   "                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Message Delivered to Orchestrator's Persistent Session  │
│                                                                  │
│ Container: codehornets-orchestrator (PID 1: claude CLI)         │
│   │                                                              │
│   ├─→ Receives input at prompt                                  │
│   ├─→ Claude processes: "Send a message to Anga..."            │
│   ├─→ Orchestrator understands the task                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Orchestrator Decides to Use Bash Script                    │
│                                                                  │
│ Orchestrator Agent (Claude Code instance)                       │
│   │                                                              │
│   ├─→ Reads system prompt (prompts/orchestrator.md)            │
│   ├─→ Sees available MCP communication tools                    │
│   ├─→ Decides to use: send_message_to_agent()                  │
│   │                                                              │
│   └─→ Calls MCP tool with parameters:                           │
│         target_agent: "anga"                                     │
│         message: "Can you review the auth code?"                │
│         from_agent: "orchestrator"                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: send_agent_message.sh script Processes Tool Call                          │
│                                                                  │
│ send_agent_message.sh (send_agent_message.sh script)                         │
│   │                                                              │
│   ├─→ Receives tool call: send_message_to_agent                │
│   ├─→ Validates target_agent: "anga" ✓                         │
│   │                                                              │
│   ├─→ Formats message with sender info:                         │
│   │    "[Message from orchestrator]: Can you review..."         │
│   │                                                              │
│   └─→ Calls send_agent_message.sh script:                       │
│         bash /tools/send_agent_message.sh \                     │
│              anga \                                              │
│              "[Message from orchestrator]: Can you review..."    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: send_agent_message.sh Sends to Anga                     │
│                                                                  │
│   ├─→ Maps "anga" → container "codehornets-worker-anga"        │
│   ├─→ Validates: anga container is running                      │
│   ├─→ Calls automation container with expect                    │
│                                                                  │
│   docker exec codehornets-svc-automation sh -c "                │
│     expect <<'EXPECT_EOF'                                        │
│       spawn docker attach codehornets-worker-anga               │
│       send \"[Message from orchestrator]: Can you review...\"   │
│       send \"\\r\"                                              │
│       sleep 10                                                   │
│       send \"\\x10\\x11\"                                       │
│     EXPECT_EOF                                                   │
│   "                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: Message Delivered to Anga's Persistent Session          │
│                                                                  │
│ Container: codehornets-worker-anga (PID 1: claude CLI)          │
│   │                                                              │
│   ├─→ Receives input at prompt                                  │
│   ├─→ Sees: "[Message from orchestrator]: Can you review..."   │
│   ├─→ Anga processes the request                                │
│   └─→ Anga responds with auth code review                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: Bash Script Returns to Orchestrator                        │
│                                                                  │
│ send_agent_message.sh → Orchestrator                       │
│   │                                                              │
│   └─→ Returns success result:                                   │
│       {                                                          │
│         "success": true,                                         │
│         "target_agent": "anga",                                  │
│         "from_agent": "orchestrator",                            │
│         "message_sent": "Can you review...",                     │
│         "timestamp": "2025-11-20T11:30:00Z"                     │
│       }                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 9: Orchestrator Responds to You                            │
│                                                                  │
│ Orchestrator → You (Human)                                      │
│   │                                                              │
│   └─→ Logs show: "✓ Message sent to Anga (Coding Assistant)"  │
│   └─→ Orchestrator responds: "I've asked Anga to review..."    │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Step-by-Step Process

### Step 1: You Send Prompt

**Command**:
```bash
make msg-orchestrator MSG="Send a message to Anga asking him to review the auth code"
```

**What happens**: Your command triggers the messaging script

---

### Step 2: send_agent_message.sh Execution

**Script**: `tools/send_agent_message.sh`

**Process**:
1. Validates agent name: "orchestrator" → `codehornets-orchestrator`
2. Checks if container is running: `docker ps | grep codehornets-orchestrator`
3. Checks if automation container is running
4. Uses `docker exec` + `expect` to attach to orchestrator container
5. Sends your message to the orchestrator's TTY
6. Presses Enter to submit
7. Waits 10 seconds for processing
8. Detaches cleanly with Ctrl+P Ctrl+Q

**Key Code**:
```bash
docker exec codehornets-svc-automation sh -c "
  expect <<'EXPECT_EOF'
    spawn docker attach codehornets-orchestrator
    send \"Send a message to Anga asking him to review the auth code\"
    send \"\\r\"
    sleep 10
    send \"\\x10\\x11\"
  EXPECT_EOF
"
```

---

### Step 3: Orchestrator Receives Message

**Container**: `codehornets-orchestrator`
**Process**: Claude Code (PID 1) running persistently

**What happens**:
1. Message appears at orchestrator's input prompt
2. Orchestrator reads the instruction
3. Processes: "I need to send a message to Anga"
4. Checks available tools

---

### Step 4: Orchestrator Uses Bash Script

**Agent**: Orchestrator (Claude Code instance)

**Decision Process**:
1. Reads system prompt: `prompts/orchestrator.md`
2. Sees Bash scripts section describing `send_message_to_agent`
3. Understands this is the correct tool
4. Prepares tool call

**Tool Call**:
```python
send_message_to_agent(
    target_agent="anga",
    message="Can you review the auth code in /workspace/api/auth.js?",
    from_agent="orchestrator"
)
```

---

### Step 5: send_agent_message.sh script Processes Request

**Server**: `tools/send_agent_message.sh`

**Function**: `send_message()` (line 21-82)

**Process**:
1. Validates `target_agent="anga"` is valid ✓
2. Formats message with sender:
   ```
   "[Message from orchestrator]: Can you review the auth code in /workspace/api/auth.js?"
   ```
3. Locates script: `/tools/send_agent_message.sh`
4. Executes subprocess:
   ```python
   subprocess.run(
       ["bash", str(send_script), "anga", formatted_message],
       capture_output=True,
       text=True,
       timeout=30
   )
   ```

---

### Step 6: send_agent_message.sh Sends to Anga

**Script**: `tools/send_agent_message.sh` (called by MCP server)

**Process**:
1. Maps "anga" → `codehornets-worker-anga`
2. Validates container is running
3. Uses expect to attach to Anga's container
4. Sends formatted message: `[Message from orchestrator]: Can you review...`
5. Presses Enter
6. Waits 10 seconds
7. Detaches

---

### Step 7: Anga Receives and Processes

**Container**: `codehornets-worker-anga`
**Process**: Claude Code (PID 1) running persistently

**What happens**:
1. Anga sees message appear at input prompt
2. Reads: `[Message from orchestrator]: Can you review the auth code...`
3. Understands request came from orchestrator
4. Anga reads system prompt (`prompts/anga.md`)
5. Knows he's a coding assistant
6. Performs auth code review
7. Could respond back to orchestrator using Bash scripts if needed

---

### Step 8: Bash Script Returns Result

**send_agent_message.sh script** → **Orchestrator**

**Return Value**:
```json
{
  "success": true,
  "target_agent": "anga",
  "from_agent": "orchestrator",
  "message_sent": "Can you review the auth code in /workspace/api/auth.js?",
  "timestamp": "2025-11-20T11:30:00Z",
  "output": "✓ Message sent to Anga (Coding Assistant)"
}
```

---

### Step 9: Orchestrator Responds to You

**Orchestrator** → **You (Human)**

**Response**:
```
I've sent a message to Anga asking him to review the auth code in
/workspace/api/auth.js. He should receive it momentarily and begin
the code review.
```

## Key Technologies Used

### 1. Docker Attach
**Purpose**: Connect to running container's TTY
**Command**: `docker attach codehornets-worker-anga`
**Benefit**: Communicates with persistent Claude session

### 2. Expect Automation
**Purpose**: Automate TTY interactions
**Key Commands**:
- `spawn docker attach <container>` - Connect
- `send "message\r"` - Type and press Enter
- `send "\x10\x11"` - Detach (Ctrl+P Ctrl+Q)

### 3. Bash Scripts with Docker
**Purpose**: Provide tools to Claude instances
**Server**: `send_agent_message.sh`
**Tools**:
- `send_message_to_agent`
- `list_available_agents`
- `check_agent_status`

### 4. Persistent Claude Sessions
**Container Role**: Each agent runs `claude` as PID 1
**Benefit**: Agents stay alive, maintain context, ready for messages
**Startup**: `docker-compose up -d orchestrator anga marie fabien`

## Alternative Flow: Anga Responds Back

If Anga wants to respond to the orchestrator:

```
┌─────────────────────────────────────────────────────────────────┐
│ Anga's Turn to Respond                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Anga Decides to Respond                                 │
│                                                                  │
│ Anga (codehornets-worker-anga)                                  │
│   │                                                              │
│   ├─→ Finished reviewing auth code                              │
│   ├─→ Wants to report findings to orchestrator                  │
│   │                                                              │
│   └─→ Uses Bash tool:                                             │
│         send_message_to_agent(                                   │
│           target_agent="orchestrator",                           │
│           message="I reviewed the auth code. Found 3 issues...", │
│           from_agent="anga"                                      │
│         )                                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: send_agent_message.sh script Processes Anga's Request                     │
│                                                                  │
│ send_agent_message.sh                                       │
│   │                                                              │
│   ├─→ Formats: "[Message from anga]: I reviewed the auth..."   │
│   │                                                              │
│   └─→ Calls: bash /tools/send_agent_message.sh \               │
│                orchestrator \                                    │
│                "[Message from anga]: I reviewed..."              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Message Delivered to Orchestrator                       │
│                                                                  │
│ Container: codehornets-orchestrator                             │
│   │                                                              │
│   ├─→ Receives: "[Message from anga]: I reviewed the auth..."  │
│   ├─→ Orchestrator reads Anga's findings                        │
│   └─→ Orchestrator can now report back to you (human)          │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Methods

### Method 1: Direct Messages (Recommended)

**What it is**: Agents use Bash scripts to send messages directly

**Advantages**:
✓ Real-time communication
✓ Bidirectional (agents can reply)
✓ Automatic delivery
✓ Sender identification

**How it works**: Explained in flow above

---

### Method 2: File-Based Tasks (Legacy)

**What it is**: Create JSON task files in shared directories

**Process**:
1. Orchestrator writes: `/shared/tasks/anga/task_12345.json`
2. Anga watches directory with inotify
3. Anga reads task file
4. Anga writes result: `/shared/results/anga/result_12345.json`
5. Orchestrator watches results directory
6. Orchestrator reads result

**Advantages**:
✓ Persistent task history
✓ Asynchronous processing
✓ Auditable

**Disadvantages**:
✗ Slower (file watching delays)
✗ One-way by default
✗ Requires file watchers

---

## Checking Agent States Before Messaging

**Best Practice**: Check if agent is ready before sending

```bash
# Check if Anga is ready
bash tools/check_agent_activity.sh anga 2

# If result is 🟢 IDLE, proceed with message
bash tools/send_agent_message.sh anga "Your message"
```

**Possible States**:
- 🟢 IDLE - Ready to receive messages
- 🟡 BUSY - Wait for agent to finish
- 🔵 INITIALIZING - Complete setup first
- 🔴 OFFLINE - Start container
- ⚪ UNKNOWN - Attach manually to check

## Common Scenarios

### Scenario 1: Simple Task Delegation

**Your Prompt**: "Orchestrator, ask Marie to evaluate student Emma"

**Flow**:
```
You → Orchestrator → Bash Script → send_agent_message.sh → Marie
```

**Orchestrator's Action**:
```python
send_message_to_agent(
    target_agent="marie",
    message="Please evaluate student Emma's progress in ballet class this month",
    from_agent="orchestrator"
)
```

---

### Scenario 2: Multi-Agent Coordination

**Your Prompt**: "Build a student portal. Coordinate with Anga and Marie"

**Flow**:
```
You → Orchestrator → Bash Script → Anga (backend API)
                  ↘ Bash Script → Marie (student data requirements)
```

**Orchestrator's Actions**:
```python
# Message 1: To Anga
send_message_to_agent(
    target_agent="anga",
    message="We're building a student portal. You'll handle the backend API with user auth and student data endpoints",
    from_agent="orchestrator"
)

# Message 2: To Marie
send_message_to_agent(
    target_agent="marie",
    message="We're building a student portal. What student data fields should we include in the database?",
    from_agent="orchestrator"
)
```

**Then agents collaborate**:
```
Anga → Marie: "What fields do you need for student records?"
Marie → Anga: "Include: name, age, dance_level, years_experience, classes_enrolled"
Anga → Orchestrator: "API is ready with student endpoints"
Marie → Orchestrator: "Student data requirements provided to Anga"
Orchestrator → You: "Student portal is complete!"
```

---

### Scenario 3: Agent-to-Agent Without Orchestrator

**Direct collaboration** (agents know about each other now):

```
Anga (working on API) → Fabien:
  "I've completed the REST API. Can you write documentation for the /api/users endpoint?"

Fabien → Anga:
  "Documentation complete. Added examples and parameter descriptions"
```

**How**: Both agents have Bash scripts in their system prompts (updated in previous work)

## Related Files

| File | Purpose |
|------|---------|
| `tools/send_agent_message.sh` | Core messaging script (docker attach + expect) |
| `tools/send_agent_message.sh` | MCP server providing communication tools |
| `tools/check_agent_activity.sh` | Check agent state before messaging |
| `prompts/orchestrator.md` | Orchestrator's system prompt with Bash scripts |
| `prompts/anga.md` | Anga's system prompt with Bash scripts |
| `prompts/marie.md` | Marie's system prompt with Bash scripts |
| `prompts/fabien.md` | Fabien's system prompt with Bash scripts |
| `Makefile` | Convenient targets: `msg-orchestrator`, `msg-anga`, etc. |

## Troubleshooting

### Message not delivered?

**Check**:
```bash
# 1. Is target agent running?
docker ps | grep codehornets-worker-anga

# 2. Is automation container running?
docker ps | grep codehornets-svc-automation

# 3. Is agent ready?
bash tools/check_agent_activity.sh anga 2

# 4. View agent logs
docker logs codehornets-worker-anga --tail 50
```

### Agent stuck at initialization?

**Solution**:
```bash
# Attach and complete setup
make attach-anga

# Press Enter to select default theme
# Then Ctrl+P Ctrl+Q to detach
```

### Want to see message delivery?

**With logs**:
```bash
bash tools/send_agent_message.sh anga "Your message" logs
```

---

**Created**: 2025-11-20
**Last Updated**: 2025-11-20
**Status**: ✅ Complete
