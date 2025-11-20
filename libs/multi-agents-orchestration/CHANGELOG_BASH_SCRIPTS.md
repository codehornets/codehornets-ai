# Changelog: Agent Communication Update to Bash Scripts

## Date: 2025-11-20

## Summary

Updated all agent documentation to reflect that agents use **BASH SCRIPTS** (not MCP tools) for inter-agent communication.

## Motivation

The multi-agent system uses `send_agent_message.sh` with Docker attach and expect for reliable agent-to-agent communication. MCP tools were originally documented but are NOT the actual implementation method.

## Changes

### Agent Prompts Updated

All agent system prompts now document Bash script communication:

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/prompts/orchestrator.md
- Removed: MCP Tools section with `send_message_to_agent()` examples
- Added: Bash script examples using `Bash(bash /tools/send_agent_message.sh ...)`
- Updated: All code samples to use Bash tool

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/prompts/anga.md
- Removed: MCP Communication Tools section
- Added: Bash script communication examples
- Updated: Domain-specific examples for coding assistant

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/prompts/marie.md
- Removed: MCP Communication Tools section
- Added: Bash script communication examples
- Updated: Domain-specific examples for dance teacher assistant

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/prompts/fabien.md
- Removed: MCP Communication Tools section
- Added: Bash script communication examples
- Updated: Domain-specific examples for marketing assistant

### Documentation Files Updated

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/docs/AGENT_COMMUNICATION_UPDATE.md
- Created new version emphasizing Bash scripts
- Removed MCP tool examples
- Added technical implementation details
- Added examples for all agents

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/docs/AGENT_INTERACTION_FLOW.md
- Updated flow diagrams to show Bash tool usage
- Removed MCP server steps
- Updated all examples from Python to Bash
- Emphasized Docker + expect approach

#### C:/workspace/@codehornets-ai/libs/multi-agents-orchestration/docs/AGENT_MESSAGING_QUICK_REF.md
- Removed MCP tools as "Method 1"
- Kept only Bash script method
- Simplified examples
- Updated technical details

## Technical Details

### Old Method (Documented but NOT Used)
```python
send_message_to_agent(
    target_agent="anga",
    message="Your message",
    from_agent="orchestrator"
)
```

### New Method (Actual Implementation)
```bash
Bash(bash /tools/send_agent_message.sh anga "Your message")
```

### How It Works

1. Agent uses Claude Code's built-in Bash tool
2. Executes: `bash /tools/send_agent_message.sh <agent> "<message>"`
3. Script uses `docker attach` + `expect` automation
4. Message delivered to target agent's TTY
5. No MCP tools involved

### Requirements

- Docker socket access with group 0 permissions (agents run with `group_add: [0]`)
- Automation container with `expect` installed
- send_agent_message.sh script in /tools/
- Target agent container must be running

## Examples by Agent

### Orchestrator
```bash
Bash(bash /tools/send_agent_message.sh anga "Please implement REST API")
Bash(bash /tools/send_agent_message.sh marie "Evaluate student Emma")  
Bash(bash /tools/send_agent_message.sh fabien "Create social media campaign")
```

### Worker Agents
```bash
# Anga to Orchestrator
Bash(bash /tools/send_agent_message.sh orchestrator "API implementation complete")

# Marie to Anga
Bash(bash /tools/send_agent_message.sh anga "Can you add a database field?")

# Fabien to Marie
Bash(bash /tools/send_agent_message.sh marie "What studio features should I highlight?")
```

## Verification

```bash
# No MCP references in prompts
$ grep -c "MCP" prompts/*.md
prompts/anga.md:0
prompts/fabien.md:0
prompts/marie.md:0
prompts/orchestrator.md:0
```

## Files Changed

- `prompts/orchestrator.md`
- `prompts/anga.md`
- `prompts/marie.md`
- `prompts/fabien.md`
- `docs/AGENT_COMMUNICATION_UPDATE.md`
- `docs/AGENT_INTERACTION_FLOW.md`
- `docs/AGENT_MESSAGING_QUICK_REF.md`

## Files Created

- `docs/DOCUMENTATION_UPDATE_SUMMARY.md`
- `docs/DOCUMENTATION_UPDATE_COMPLETE.md`
- `CHANGELOG_BASH_SCRIPTS.md` (this file)

## Backups

All modified files have `.backup` versions created before changes.

## Impact

- Agents now have correct instructions for communication
- No confusion about MCP tools vs Bash scripts
- All examples show the actual implementation method
- Documentation matches the working system

## Next Steps

No further action required. Agents are now correctly configured.

---

**Status**: Complete
**Updated By**: Documentation Specialist
**Date**: 2025-11-20
