# Messaging Tools Refactoring - Complete

## Summary

Successfully refactored and cleaned up all messaging tools to use the proper `docker attach + expect` method for sending messages to persistent Claude agent sessions.

## Changes Made

### ✅ New Unified Scripts

1. **`tools/send_agent_message.sh`** - Universal messaging script
   - Works with **all agents**: orchestrator, marie, anga, fabien
   - Uses `docker attach` + `expect` to send to persistent sessions
   - Optional log viewing with ANSI codes stripped
   - Color-coded output for better UX
   - Proper error handling and validation

2. **`tools/wake_worker.sh`** - Refactored wake script
   - Now supports **orchestrator** in addition to workers
   - Removed non-functional modes (non-interactive, tmux)
   - Streamlined to use only `expect` mode + manual fallback
   - Updated all references from "worker" to "agent"
   - Better error messages and help documentation

### ✅ Updated MCP Tools

**`tools/agent_communication_mcp.py`**
- Updated `send_message()` function to use `send_agent_message.sh`
- Now properly sends to persistent sessions instead of spawning new instances
- Maintains same MCP protocol interface:
  - `send_message_to_agent`
  - `list_available_agents`
  - `check_agent_status`

### ✅ Updated Makefile Targets

**New targets:**
- `make wake-orchestrator` - Wake the orchestrator
- `make wake-workers` - Wake only workers (marie, anga, fabien)
- `make msg-orchestrator MSG="..."` - Send message to orchestrator

**Updated targets:**
- `make wake-all` - Now wakes orchestrator + all workers
- `make wake-marie/anga/fabien` - Use refactored wake_worker.sh
- `make msg-marie/anga/fabien` - Use refactored send_agent_message.sh

### ✅ Removed Redundant Scripts

Deleted obsolete scripts that used incorrect methods:
- ❌ `tools/send_message.sh` - Used `claude -p` (spawned new instances)
- ❌ `tools/test_orchestrator_message.sh` - Duplicate functionality
- ❌ `tools/send_to_orchestrator.sh` - Orchestrator-specific duplicate

## How It Works

### Architecture

```
User/Agent
    ↓
send_agent_message.sh / wake_worker.sh / MCP tools
    ↓
automation container (expect)
    ↓
docker attach <agent-container>
    ↓
Send keystrokes to persistent Claude session (PID 1)
    ↓
Message delivered to running agent
```

### Key Technical Details

1. **Persistent Sessions**: All agents run Claude CLI as PID 1 in their containers
2. **Docker Attach**: Connects to the running session's TTY
3. **Expect Automation**: Automates sending keystrokes (message + Enter)
4. **Proper Detach**: Uses Ctrl+P Ctrl+Q to detach without stopping container
5. **Wait Time**: 10-second wait allows Claude to fully process and respond

## Usage Examples

### Direct Script Usage

```bash
# Send message to orchestrator
bash tools/send_agent_message.sh orchestrator "What are your capabilities?"

# Send message with log viewing
bash tools/send_agent_message.sh anga "Review this code" logs

# Wake an agent (sends default monitoring message)
bash tools/wake_worker.sh marie
```

### Makefile Targets

```bash
# Wake agents
make wake-orchestrator
make wake-all           # orchestrator + workers
make wake-workers       # workers only

# Send custom messages
make msg-orchestrator MSG="Coordinate the team"
make msg-anga MSG="Review authentication module"
make msg-marie MSG="Evaluate student Sarah"
make msg-fabien MSG="Create email campaign"
```

### MCP Tools (From Other Agents)

```python
# From within an agent's Claude session
send_message_to_agent(
    target_agent="orchestrator",
    message="I've completed the database migration",
    from_agent="anga"
)
```

## Benefits

### ✅ Consistency
- Single unified approach for all agents (including orchestrator)
- No more confusion about which script to use

### ✅ Correctness
- Messages go to **persistent sessions** (maintains context)
- No more spawning unnecessary new Claude instances
- Proper container lifecycle management

### ✅ Simplicity
- Removed 3 redundant scripts
- Streamlined wake_worker.sh from 297 lines to ~238 lines
- Clear separation of concerns

### ✅ Reliability
- Proper error handling and validation
- Automation container dependency checks
- Graceful fallback to manual instructions

### ✅ Maintainability
- Centralized logic in fewer files
- Better documentation and help messages
- Consistent naming conventions

## Testing Results

All refactored tools tested successfully:

✅ `send_agent_message.sh` - Sends to orchestrator ✓
✅ `wake_worker.sh` - Works with orchestrator ✓
✅ `wake_worker.sh` - Works with workers ✓
✅ `make wake-orchestrator` - Works ✓
✅ `make msg-orchestrator` - Works ✓
✅ `make msg-anga/marie/fabien` - Works ✓
✅ MCP `agent_communication_mcp.py` - Updated ✓

## Migration Notes

### For Developers

**Old way (deprecated):**
```bash
# DON'T USE - these scripts were removed
bash tools/send_message.sh anga "message"
bash tools/test_orchestrator_message.sh "message"
bash tools/send_to_orchestrator.sh "message"
```

**New way:**
```bash
# USE THIS - unified script
bash tools/send_agent_message.sh anga "message"
bash tools/send_agent_message.sh orchestrator "message"
```

### For MCP Tool Users

No changes required! The MCP tool interface remains the same:
- `send_message_to_agent()` still works identically
- Agents can continue using it without modifications
- Now uses the correct underlying implementation

## Future Improvements

Potential enhancements to consider:

1. **Better Log Parsing**: Improve ANSI stripping to reconstruct readable text from TUI output
2. **Response Capture**: Add option to capture and return Claude's response programmatically
3. **Async Messaging**: Support for fire-and-forget vs wait-for-response modes
4. **Message Queue**: Track sent messages and responses in a structured format
5. **Health Checks**: Pre-flight checks before sending (agent responsive, not busy, etc.)

## Related Documentation

- `docs/ARCHITECTURE_NOTES.md` - System architecture overview
- `docs/INTER_AGENT_COMMUNICATION.md` - Communication protocols
- `docs/SETUP_COMPLETE.md` - Automation container setup
- `prompts/orchestrator.md` - Orchestrator system prompt

---

**Refactored by**: Anga (AI Coding Assistant)
**Date**: 2025-11-20
**Status**: ✅ Complete and Tested
