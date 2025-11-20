# Inter-Agent Communication System

## Overview

The CodeHornets AI multi-agent system now features **peer-to-peer communication** between all agents using MCP (Model Context Protocol) tools. Agents can send messages directly to each other, enabling true collaboration beyond simple task delegation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  MCP Communication Layer                     │
│                 (agent_communication_mcp.py)                │
└────────────┬────────────────┬─────────────┬─────────────────┘
             │                │             │
     ┌───────▼──────┐  ┌──────▼──────┐  ┌──▼──────────┐
     │ Orchestrator │  │    Marie    │  │    Anga     │
     │      🎯      │  │     🩰      │  │     💻      │
     └───────┬──────┘  └──────┬──────┘  └──┬──────────┘
             │                │             │
             └────────────────┴─────────────┴────────────┐
                                                          │
                                                   ┌──────▼──────┐
                                                   │   Fabien    │
                                                   │     📈      │
                                                   └─────────────┘
```

## Components

### 1. MCP Server (`tools/agent_communication_mcp.py`)

A Python-based MCP server that provides three core tools:

#### `send_message_to_agent`
Send a message to any agent in the system.

**Parameters**:
- `target_agent`: Agent name (`marie`, `anga`, `fabien`, `orchestrator`)
- `message`: The message content
- `from_agent`: Your agent name (for logging)

**How it works**:
1. Formats message with sender information
2. Calls `wake_worker.sh` script
3. Message is delivered and **auto-submitted** to target agent
4. Returns success/failure status

#### `list_available_agents`
Get a list of all agents with their specializations and current status.

**Returns**:
- Agent names, roles, specializations
- Online/offline status
- Container names

#### `check_agent_status`
Check a specific agent's heartbeat and current status.

**Parameters**:
- `agent_name`: Agent to check

**Returns**:
- Current status (active/idle/busy/error)
- Last updated timestamp
- Current task (if any)
- Tasks completed count

### 2. Message Delivery (`tools/wake_worker.sh`)

The wake_worker.sh script handles actual message delivery using multiple methods:

**Auto-submission Methods** (tries in order):
1. **expect mode**: Uses `expect` automation to send message + press Enter
2. **tmux mode**: Uses `tmux send-keys` to type message + Enter
3. **non-interactive mode**: Uses `claude -p` flag for direct submission
4. **manual mode**: Creates notification file (fallback)

All automated methods **submit the message automatically** - no human interaction needed!

### 3. MCP Configuration Files

Each agent has `.mcp.json` in their home directory:

```
shared/auth-homes/
├── orchestrator/.mcp.json
├── marie/.mcp.json
├── anga/.mcp.json
└── fabien/.mcp.json
```

All configurations point to the same MCP server:
```json
{
  "mcpServers": {
    "agent-communication": {
      "command": "python3",
      "args": ["/tools/agent_communication_mcp.py"]
    }
  }
}
```

## Agent Awareness

All agents now understand:

### Their Team
- **Orchestrator**: Coordinator and task delegator
- **Marie**: Dance teacher assistant
- **Anga**: Coding assistant
- **Fabien**: Marketing assistant

### Their Environment
```
/workspace/shared/
├── tasks/           # Task files
│   ├── marie/
│   ├── anga/
│   └── fabien/
├── results/         # Completed work
├── heartbeats/      # Agent status
└── triggers/        # Activation signals
```

### Communication Methods
1. **Direct messages** (MCP tools) - Real-time collaboration
2. **Task files** - Formal assignments
3. **Result files** - Work delivery

## Usage Examples

### Example 1: Orchestrator Delegates to Anga

```python
# Orchestrator assigns a coding task
send_message_to_agent(
    target_agent="anga",
    message="Please create a REST API for user authentication. Include JWT tokens and refresh token logic. Code should go in /workspace/api/auth/",
    from_agent="orchestrator"
)
```

**What happens**:
1. MCP server receives the request
2. Calls `wake_worker.sh anga "[Message from orchestrator]: Please create..."`
3. wake_worker.sh attaches to Anga's container
4. Sends the message
5. **Automatically presses Enter** (submits)
6. Detaches cleanly
7. Anga receives and processes the message

### Example 2: Anga Asks Marie for Requirements

```python
# Anga needs clarification from Marie
send_message_to_agent(
    target_agent="marie",
    message="I'm building the student evaluation database. What fields do you need for tracking student progress? Dance styles, skill levels, notes?",
    from_agent="anga"
)
```

**Marie receives**: `[Message from anga]: I'm building the student evaluation database...`

### Example 3: Marie Celebrates with Team

```python
# Marie shares good news
send_message_to_agent(
    target_agent="orchestrator",
    message="Emma Rodriguez just nailed her first double pirouette! After 6 months of dedicated practice, she's made incredible progress! 🎉",
    from_agent="marie"
)

send_message_to_agent(
    target_agent="fabien",
    message="Emma achieved a major milestone today! Can you create a social media post celebrating her first double pirouette? Perfect for student spotlight series!",
    from_agent="marie"
)
```

### Example 4: Fabien Coordinates Website Launch

```python
# Check if Anga is available
status = check_agent_status(agent_name="anga")

# Request feature
send_message_to_agent(
    target_agent="anga",
    message="Can you add a newsletter signup form to the homepage? I'm launching an email campaign next week and need to collect emails.",
    from_agent="fabien"
)

# After Anga implements
send_message_to_agent(
    target_agent="anga",
    message="Signup form works perfectly! Already got 50 signups. Thanks for the quick turnaround! 📈",
    from_agent="fabien"
)
```

## Communication Best Practices

### DO ✅
- **Be specific**: Include file paths, requirements, context
- **Be timely**: Respond to messages from other agents
- **Be collaborative**: Offer help, share insights
- **Be clear**: Explain technical details in plain language
- **Acknowledge**: Thank agents for their work

### DON'T ❌
- **Assume context**: Always explain what you need and why
- **Send vague messages**: "it's done" → "Student API complete at /api/students with full documentation"
- **Ignore messages**: Always respond to coordination requests
- **Overload**: Check agent status before assigning heavy work

## Message Format

All messages are automatically prefixed with sender information:

**You send**:
```python
send_message_to_agent(
    target_agent="anga",
    message="Can you review the code?",
    from_agent="orchestrator"
)
```

**Agent receives**:
```
[Message from orchestrator]: Can you review the code?
```

This ensures agents always know who's communicating with them.

## Collaboration Workflows

### Workflow 1: Multi-Agent Project

```python
# 1. Orchestrator initiates
send_message_to_agent("anga", "New project: Student registration system. You'll build backend API.", "orchestrator")
send_message_to_agent("fabien", "New project: Student registration system. You'll create launch marketing.", "orchestrator")

# 2. Agents coordinate
send_message_to_agent("marie", "What student data fields are needed for registration?", "anga")

# 3. Implementation
# (Anga builds, Marie provides requirements, Fabien prepares marketing)

# 4. Delivery coordination
send_message_to_agent("fabien", "Registration API is live at /api/register. Ready for launch campaign.", "anga")
send_message_to_agent("orchestrator", "Backend complete. Frontend pending. Marketing ready.", "anga")
```

### Workflow 2: Ad-Hoc Collaboration

```python
# Marie discovers need for technical solution
send_message_to_agent("anga", "I'm manually tracking 50+ students in spreadsheets. Can you build a simple dashboard to visualize progress over time?", "marie")

# Anga builds solution
send_message_to_agent("marie", "Student dashboard ready! Check /workspace/dance-dashboard/. Shows progress trends, skill development, and class attendance. Let me know if you need adjustments!", "anga")

# Marie provides feedback
send_message_to_agent("anga", "This is perfect! The progress charts make it so easy to spot students who need extra help. Can you add a filter by dance style?", "marie")
```

### Workflow 3: Status Checks

```python
# Orchestrator monitors progress
check_agent_status("anga")  # See if busy
check_agent_status("marie")  # Check current task
check_agent_status("fabien")  # Verify availability

# Send follow-up if needed
send_message_to_agent("anga", "How's the API development going? Any blockers I can help with?", "orchestrator")
```

## Troubleshooting

### Message not delivered?

1. **Check target agent is running**:
   ```bash
   docker ps | grep codehornets-worker-anga
   ```

2. **Check MCP server logs**:
   ```bash
   # Messages are sent via MCP server
   docker logs codehornets-orchestrator | grep "agent_communication"
   ```

3. **Verify wake_worker.sh**:
   ```bash
   # Test wake_worker.sh manually
   bash tools/wake_worker.sh anga "Test message"
   ```

### Agent not responding?

1. **Check heartbeat**:
   ```python
   check_agent_status(agent_name="anga")
   ```

2. **Check agent logs**:
   ```bash
   make logs-anga
   ```

3. **Try direct message again**:
   ```python
   send_message_to_agent("anga", "Are you there? Need status update.", "orchestrator")
   ```

## Testing Inter-Agent Communication

### Test 1: Simple Message
```bash
# From host machine
make attach-orchestrator

# In orchestrator session
send_message_to_agent(
    target_agent="anga",
    message="Test message - please acknowledge",
    from_agent="orchestrator"
)

# Check Anga's logs
# (In another terminal)
make logs-anga
```

### Test 2: Round-Trip Communication
```python
# Orchestrator → Anga
send_message_to_agent("anga", "Can you send me a test response?", "orchestrator")

# Anga → Orchestrator (after receiving)
send_message_to_agent("orchestrator", "Test response received and acknowledged!", "anga")
```

### Test 3: Multi-Agent Broadcast
```python
# Send message to all workers
for agent in ["marie", "anga", "fabien"]:
    send_message_to_agent(
        target_agent=agent,
        message="System update: All agents please acknowledge receipt",
        from_agent="orchestrator"
    )
```

## Security Considerations

- **Message validation**: MCP server validates agent names
- **Container isolation**: Agents run in separate Docker containers
- **No credentials in messages**: Don't send API keys or passwords
- **Audit trail**: All messages logged with timestamps
- **Access control**: Only system agents can use communication tools

## Future Enhancements

Potential improvements:
- [ ] Message history/archive
- [ ] Group messaging (broadcast to multiple agents)
- [ ] Message priorities (urgent/normal/low)
- [ ] Async message queues
- [ ] Message delivery receipts
- [ ] Conversation threading
- [ ] Rich media support (images, files)

## Summary

The inter-agent communication system transforms CodeHornets AI from a simple orchestrator-worker setup into a **collaborative AI team** where agents can:

✅ Communicate peer-to-peer
✅ Coordinate on complex projects
✅ Share insights and learnings
✅ Request help from specialists
✅ Celebrate successes together

**Result**: More natural collaboration, faster problem-solving, and better outcomes! 🚀
