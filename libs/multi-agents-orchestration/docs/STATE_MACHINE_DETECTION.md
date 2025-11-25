# Agent State Machine Detection

## Overview

The `check_agent_activity.sh` script now implements intelligent state detection for all agents in the CodeHornets AI system. This provides Slack/Teams-like status indicators to know when agents are truly ready to receive messages.

## Problem Solved

**Previous Issue**: The activity checker only measured log output volume, leading to false positives. Agents stuck at initialization screens (theme selection) were incorrectly reported as 🟢 IDLE when they couldn't actually respond to messages.

**Solution**: Content-based state detection that parses log output to identify what state the agent is in, not just whether it's generating output.

## State Machine

### States (Priority Order)

The script checks states in this order:

#### 1. 🔵 INITIALIZING
Agent is at setup/configuration screen and **cannot respond** to messages.

**Detected by**:
- Theme selection screen: "Choose the text style"
- Authentication prompts: "authentication required"
- Welcome screen: "Welcome to Claude Code"

**Action Required**: Complete initialization manually
```bash
make attach-marie   # Attach to agent
# Press Enter to select default theme
```

#### 2. 🟡 BUSY
Agent is actively processing/responding.

**Detected by**:
- High output volume: >10 log lines in check duration
- Moderate output: 3-10 lines (marked as "possibly busy")

**Action**: Wait for agent to finish before sending messages

#### 3. 🟢 IDLE
Agent is at prompt and **ready to receive** messages.

**Detected by**:
- Prompt indicators in logs:
  - "bypass permissions" (Claude Code permission system)
  - "> [7m" (input cursor)
  - "❯" (prompt symbol)
  - "What would you like"
  - "I can help"
- No new output in check duration

**Action**: Safe to send messages

#### 4. 🔴 OFFLINE
Container is not running.

**Detected by**: Docker ps shows container not running

**Action**: Start container
```bash
docker-compose up -d orchestrator
```

#### 5. ⚪ UNKNOWN
Cannot determine state from logs.

**Detected by**: No clear indicators found, no activity, but also no prompt detected

**Action**: Manually attach to check
```bash
make attach-anga
```

## Usage

### Check Single Agent
```bash
# Check orchestrator (default 3s monitoring)
bash tools/check_agent_activity.sh orchestrator

# Check with custom duration
bash tools/check_agent_activity.sh marie 5
```

### Check All Agents
```bash
make activity-all
```

### Makefile Targets
```bash
make activity-orchestrator   # Check orchestrator status
make activity-marie          # Check Marie status
make activity-anga           # Check Anga status
make activity-fabien         # Check Fabien status
make activity-all            # Check all agents
```

## Example Output

### INITIALIZING State
```
════════════════════════════════════════════════════════════
  Agent Status: Marie
════════════════════════════════════════════════════════════

Status: 🔵 INITIALIZING
   Agent is at theme selection screen
   Waiting for: Theme preference selection

Suggestion: Complete initialization by selecting a theme
            Use: make attach-marie and press Enter to select default
```

### IDLE State
```
════════════════════════════════════════════════════════════
  Agent Status: Orchestrator
════════════════════════════════════════════════════════════

Status: 🟢 IDLE
   Agent is at prompt, ready for messages
   No new output in 2s

Suggestion: Agent is ready to receive messages
```

### BUSY State
```
════════════════════════════════════════════════════════════
  Agent Status: Anga
════════════════════════════════════════════════════════════

Status: 🟡 BUSY
   Agent is actively responding/processing
   Output lines: 47 in 3s

Suggestion: Wait for agent to finish, then send your message
```

## Detection Logic

### Priority-Based Checking

The script checks states in priority order because some states can mask others:

1. **INITIALIZING first** - Prevents false idle detection
2. **BUSY second** - Detects active processing
3. **IDLE third** - Only if no initialization screens AND prompt detected
4. **UNKNOWN last** - Fallback for unclear states

### Why Priority Matters

Without priority, an agent at theme selection would:
- Show no new output (appears idle)
- Not be at a command prompt
- Be incorrectly classified as UNKNOWN or IDLE

With priority:
- Theme selection detected first
- Correctly classified as INITIALIZING
- Clear guidance provided to user

## Technical Implementation

### Log Analysis
```bash
# Capture recent logs for content analysis
RECENT_LOGS=$(docker logs ${CONTAINER} --tail 50 2>&1)

# Check for initialization patterns
if echo "$RECENT_LOGS" | grep -q "Choose the text style"; then
    # INITIALIZING state detected
fi

# Check for prompt indicators
if echo "$RECENT_LOGS" | grep -qE "(bypass permissions|> \[7m)"; then
    # IDLE state detected
fi
```

### Activity Monitoring
```bash
# Measure output volume over time
INITIAL_LINES=$(docker logs ${CONTAINER} --tail 100 2>&1 | wc -l)
sleep ${CHECK_DURATION}
FINAL_LINES=$(docker logs ${CONTAINER} --tail 100 2>&1 | wc -l)
DIFF=$((FINAL_LINES - INITIAL_LINES))

if [ $DIFF -gt 10 ]; then
    # BUSY state
fi
```

## Adding New State Patterns

To detect new initialization states, add patterns to the INITIALIZING section:

```bash
# 1. Check for initialization states
if echo "$RECENT_LOGS" | grep -q "YOUR_NEW_PATTERN"; then
    echo -e "Status: ${BLUE}🔵 INITIALIZING${NC}"
    echo "   Agent is at YOUR_SCREEN_DESCRIPTION"
    echo "   Waiting for: WHAT_USER_NEEDS_TO_DO"
    exit 0
fi
```

To detect new prompt patterns for IDLE state:

```bash
# 4. Check for actual ready state
if echo "$RECENT_LOGS" | grep -qE "(existing|patterns|YOUR_NEW_PATTERN)"; then
    echo -e "Status: ${GREEN}🟢 IDLE${NC}"
    ...
fi
```

## Integration with Other Tools

### Before Sending Messages
```bash
# Check if agent is ready before sending
STATUS=$(bash tools/check_agent_activity.sh orchestrator 2 2>&1 | grep "Status:" | grep -o "IDLE")
if [ "$STATUS" = "IDLE" ]; then
    bash tools/send_agent_message.sh orchestrator "Your message"
else
    echo "Agent not ready, waiting..."
fi
```

### In MCP Tools
The `agent_communication_mcp.py` could be enhanced to check status before sending:

```python
def send_message_to_agent(target_agent: str, message: str, from_agent: str):
    # Check if target agent is ready
    result = subprocess.run(
        ["bash", "tools/check_agent_activity.sh", target_agent, "2"],
        capture_output=True, text=True
    )

    if "🟢 IDLE" not in result.stdout:
        return f"Agent {target_agent} is not ready to receive messages"

    # Proceed with sending message
    ...
```

## Current Status by Agent

As of last check:
- **Orchestrator**: 🟢 IDLE - Ready
- **Marie**: 🔵 INITIALIZING - Theme selection needed
- **Anga**: ⚪ UNKNOWN - Manual check needed
- **Fabien**: 🔵 INITIALIZING - Theme selection needed

## Related Documentation

- `docs/MESSAGING_REFACTOR.md` - Messaging system refactoring
- `docs/AGENT_COMMUNICATION_UPDATE.md` - MCP tools documentation
- `tools/check_agent_activity.sh` - Implementation
- `tools/send_agent_message.sh` - Message sending

## Future Enhancements

### Potential Improvements

1. **Auto-initialization**: Automatically complete theme selection for stuck agents
2. **State history**: Track state changes over time
3. **State notifications**: Alert when agent becomes idle
4. **Queue messages**: Hold messages until agent is ready
5. **Response time estimates**: Predict when busy agent will be idle

### Additional States

Could add more granular states:
- 🟠 RESPONDING - Actively writing response
- 🟣 THINKING - In thinking/reasoning mode
- ⚫ ERROR - Agent in error state
- 🟤 WAITING - Waiting for user input/approval

---

**Created**: 2025-11-20
**Last Updated**: 2025-11-20
**Status**: ✅ Production Ready
