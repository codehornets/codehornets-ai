# Agent Communication - Bash Scripts (NOT MCP Tools)

## Summary

All agents communicate using **BASH SCRIPTS**, not MCP tools.

## What Changed

We originally considered MCP tools for agent communication, but the reliable implementation uses Bash scripts with Docker.

## How Agents Communicate

### The Correct Method: Bash Scripts

Agents use Claude Code's built-in **Bash tool** to execute `send_agent_message.sh`:

```bash
# From orchestrator to anga
Bash(bash /tools/send_agent_message.sh anga "Your message here")

# From anga to fabien  
Bash(bash /tools/send_agent_message.sh fabien "Your message here")

# From marie to orchestrator
Bash(bash /tools/send_agent_message.sh orchestrator "Your message here")
```

### NOT Using: MCP Tools

```python
# ❌ This is NOT how agents communicate
send_message_to_agent(target_agent="anga", message="...", from_agent="orchestrator")
```

## Technical Implementation

### How send_agent_message.sh Works

1. Takes two parameters: `<agent_name>` and `<message>`
2. Maps agent name to Docker container (e.g., "anga" → "codehornets-worker-anga")
3. Uses `docker exec` to run `expect` script in automation container
4. `expect` spawns `docker attach` to target agent container
5. Sends message to agent's TTY
6. Presses Enter to submit
7. Detaches cleanly with Ctrl+P Ctrl+Q

### Requirements

- Docker socket access with group 0 permissions
- Automation container running with `expect` installed
- Target agent container must be running

## Examples by Agent

### Orchestrator

```bash
# To Anga
Bash(bash /tools/send_agent_message.sh anga "Please implement a REST API for user authentication")

# To Marie
Bash(bash /tools/send_agent_message.sh marie "Please evaluate student Emma's progress")

# To Fabien
Bash(bash /tools/send_agent_message.sh fabien "Create a social media campaign for our product launch")
```

### Anga (Coding Assistant)

```bash
# To Orchestrator
Bash(bash /tools/send_agent_message.sh orchestrator "I need clarification on the authentication requirements")

# To Fabien
Bash(bash /tools/send_agent_message.sh fabien "I've completed the REST API. Can you write documentation?")

# To Marie
Bash(bash /tools/send_agent_message.sh marie "Does the dance studio need student data exported in any specific format?")
```

### Marie (Dance Teacher)

```bash
# To Orchestrator
Bash(bash /tools/send_agent_message.sh orchestrator "Should I include recital performance notes in evaluations?")

# To Anga
Bash(bash /tools/send_agent_message.sh anga "Can you add a 'years_of_experience' field to the student database?")

# To Fabien
Bash(bash /tools/send_agent_message.sh fabien "Our spring recital is May 15th. Can you create promotional materials?")
```

### Fabien (Marketing Assistant)

```bash
# To Orchestrator
Bash(bash /tools/send_agent_message.sh orchestrator "What's the target audience for this email campaign?")

# To Anga
Bash(bash /tools/send_agent_message.sh anga "I've written the landing page copy. Can you implement it?")

# To Marie
Bash(bash /tools/send_agent_message.sh marie "What are the top 3 unique features I should highlight in social media?")
```

## Benefits of Bash Script Approach

### Advantages

- Works reliably with Docker containers
- No external dependencies beyond Docker and expect
- Direct TTY access to persistent Claude sessions
- Simple and predictable
- Easy to debug and monitor

### Requirements Met

- Docker socket access with group 0 permissions
- Automation container with expect installed
- Agents run as persistent containers

## Updated Documentation Files

All agent prompts now document Bash script communication:

1. `prompts/orchestrator.md` - Updated with Bash script examples
2. `prompts/anga.md` - Updated with Bash script examples  
3. `prompts/marie.md` - Updated with Bash script examples
4. `prompts/fabien.md` - Updated with Bash script examples

## Related Documentation

- `docs/AGENT_INTERACTION_FLOW.md` - Complete flow diagrams
- `tools/send_agent_message.sh` - The actual script
- `tools/check_agent_activity.sh` - Check agent status before messaging

---

**Updated**: 2025-11-20  
**Status**: Complete - All agents use Bash scripts for communication
