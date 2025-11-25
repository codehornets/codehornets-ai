---
name: agent-messaging
description: Send messages to other agents in the CodeHornets AI multi-agent system. Use this skill when you need to communicate with orchestrator, marie, anga, or fabien.
---

# Agent Messaging Skill

## Overview

This skill enables inter-agent communication in the CodeHornets AI system. Any agent can send messages to any other agent using multiple convenient methods.

## Available Agents

- **orchestrator** - Central coordinator (you!)
- **marie** 🩰 - Dance Teacher Assistant (Frontend specialist)
- **anga** 💻 - Coding Assistant (Backend specialist)
- **fabien** 📈 - Marketing Assistant (DevOps specialist)

## Four Methods to Send Messages

### Method 1: Direct Bash Script ⭐ (Most Reliable)

**Syntax:**
```bash
bash /scripts/send_agent_message.sh <agent> "Your message"
```

**Examples:**
```bash
# Send to Anga
bash /scripts/send_agent_message.sh anga "Please review the authentication module"

# Send to Marie
bash /scripts/send_agent_message.sh marie "Evaluate student progress for ballet class"

# Send to Fabien
bash /scripts/send_agent_message.sh fabien "Create social media campaign"

# Send to Orchestrator (if you're a worker)
bash /scripts/send_agent_message.sh orchestrator "Task completed, results ready"
```

**When to use:** Always works, most reliable, best for automation

---

### Method 2: Slash Commands (Most Concise)

**Syntax:**
```bash
/msg-<agent> "Your message"
```

**Examples:**
```bash
/msg-anga "Review authentication module"
/msg-marie "Evaluate student progress"
/msg-fabien "Create social media campaign"
/msg-orchestrator "Task completed"
```

**Note:** Slash commands are only available if command files are configured in `.claude/commands/`

**When to use:** Quick messaging within Claude CLI

---

### Method 3: Makefile Commands (Most Familiar)

**Syntax:**
```bash
make msg-<agent> MSG="Your message"
```

**Examples:**
```bash
make msg-anga MSG="Review authentication module"
make msg-marie MSG="Evaluate student progress"
make msg-fabien MSG="Create social media campaign"
make msg-orchestrator MSG="Task completed"
```

**Note:** Requires `make` to be installed and Makefile to be mounted

**When to use:** If you prefer make syntax or are automating with Makefiles

---

### Method 4: This Skill! (Most Guided)

**Syntax:**
Just follow the prompts in this skill document!

**When to use:** When you want guidance on best practices and message formatting

---

## Message Best Practices

### Message Format

Always include context about who you are and what you need:

**Good message format:**
```
[Message from <your-agent>]: <clear request with context>
```

**Examples:**

```bash
# From orchestrator to worker
bash /scripts/send_agent_message.sh anga "[Message from orchestrator]: Please implement JWT authentication for the user API. Requirements: RS256 algorithm, 1-hour expiration, refresh token support."

# From worker to orchestrator
bash /scripts/send_agent_message.sh orchestrator "[Message from anga]: Authentication API completed. Code reviewed and tested. Ready for deployment."

# Between workers
bash /scripts/send_agent_message.sh marie "[Message from anga]: I've deployed the student API. You can now integrate it into your frontend forms."
```

### Message Guidelines

✅ **DO:**
- Be specific and clear about what you need
- Include relevant file paths or context
- Mention dependencies or blockers
- Acknowledge received messages
- Use professional, collaborative tone

❌ **DON'T:**
- Send vague requests ("help me")
- Assume context (always explain the situation)
- Forget to identify yourself
- Send multiple messages rapidly (give time to respond)

---

## Common Scenarios

### Scenario 1: Requesting Help (Worker → Orchestrator)

```bash
# You're stuck and need help
bash /scripts/send_agent_message.sh orchestrator "[Message from $AGENT_NAME]: I'm blocked on the database migration task. The PostgreSQL schema conflicts with existing tables. Need guidance on how to proceed."
```

### Scenario 2: Delegating Work (Orchestrator → Worker)

```bash
# Assign a task
bash /scripts/send_agent_message.sh anga "[Message from orchestrator]: New task: Implement user registration API endpoint. Requirements: email validation, password hashing (bcrypt), duplicate email check. Priority: high. Estimated: 2 hours."
```

### Scenario 3: Collaboration (Worker → Worker)

```bash
# Request collaboration
bash /scripts/send_agent_message.sh marie "[Message from anga]: I've completed the backend API for student management. Can you build the frontend forms? API docs: /workspace/api-docs/students.md"
```

### Scenario 4: Status Update (Worker → Orchestrator)

```bash
# Report progress
bash /scripts/send_agent_message.sh orchestrator "[Message from anga]: Authentication module 75% complete. JWT implementation done, testing in progress. Should finish in 30 minutes."
```

### Scenario 5: Broadcast to All (Orchestrator)

```bash
# Send to multiple agents
bash /scripts/send_agent_message.sh anga "[Message from orchestrator]: System maintenance in 1 hour. Please save your work and prepare for brief downtime."
bash /scripts/send_agent_message.sh marie "[Message from orchestrator]: System maintenance in 1 hour. Please save your work and prepare for brief downtime."
bash /scripts/send_agent_message.sh fabien "[Message from orchestrator]: System maintenance in 1 hour. Please save your work and prepare for brief downtime."
```

---

## How It Works (Technical Details)

The messaging system uses:

1. **Docker attach** - Connects to the target agent's interactive session
2. **expect** - Automates sending the message and pressing Enter
3. **Automation container** - Acts as the messaging relay

**Message flow:**
```
Your Agent → Bash tool → send_agent_message.sh → Automation container →
expect script → docker attach → Target Agent's Claude session → Message delivered
```

**Delivery time:** ~10 seconds (includes wait time for agent to process)

---

## Environment Variables

Your agent automatically has these environment variables:

- `$AGENT_NAME` - Your agent's name (orchestrator, marie, anga, or fabien)
- `$AGENT_ROLE` - Your role (orchestrator or worker)

Use `$AGENT_NAME` to identify yourself in messages:

```bash
bash /scripts/send_agent_message.sh orchestrator "[Message from $AGENT_NAME]: Task completed"
```

---

## Troubleshooting

### Message not delivered?

Check if the target agent is running:
```bash
docker ps | grep codehornets-worker-<agent>
```

Check target agent's logs:
```bash
docker logs codehornets-worker-<agent> --tail 50
```

### Agent not responding?

Check their heartbeat:
```bash
cat /shared/heartbeats/<agent>.json
```

Check if they're stuck or errored:
```bash
docker exec codehornets-worker-<agent> ps aux
```

### Automation container not available?

Start it:
```bash
docker-compose up -d automation
```

---

## Quick Reference Card

| Method | Command | Best For |
|--------|---------|----------|
| **Bash Script** | `bash /scripts/send_agent_message.sh <agent> "msg"` | Always works, reliable |
| **Slash Command** | `/msg-<agent> "msg"` | Quick, concise |
| **Makefile** | `make msg-<agent> MSG="msg"` | Familiar syntax |
| **This Skill** | Read and follow prompts | Guided, best practices |

**Most common usage:**
```bash
bash /scripts/send_agent_message.sh <agent> "[Message from $AGENT_NAME]: <your message>"
```

---

## Summary

You now have **four flexible ways** to communicate with other agents:

1. **Direct bash script** - Most reliable, always use this if unsure
2. **Slash commands** - Quick and concise for conversational messaging
3. **Makefile commands** - Familiar syntax if you prefer make
4. **This skill** - Guided approach with best practices

**Remember:** Clear communication creates effective collaboration! 🚀

Always include:
- Who you are (`[Message from $AGENT_NAME]`)
- What you need (clear, specific request)
- Why (context and background)
- When (deadlines or priorities if applicable)

Happy collaborating! 🎯
