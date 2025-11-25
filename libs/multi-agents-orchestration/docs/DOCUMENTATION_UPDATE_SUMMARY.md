# Documentation Update Summary

## Changes Made

Updated all documentation to reflect that agents use **BASH SCRIPTS** (not MCP tools) for inter-agent communication.

## Key Changes

### Before (Incorrect - MCP Tools)
```python
send_message_to_agent(
    target_agent="anga",
    message="Your message here",
    from_agent="orchestrator"
)
```

### After (Correct - Bash Scripts)  
```bash
Bash(bash /tools/send_agent_message.sh anga "Your message here")
```

## Files Updated

1. **docs/AGENT_COMMUNICATION_UPDATE.md**
   - Removed MCP tool examples
   - Added Bash script examples for all agents
   - Documented technical implementation

2. **docs/AGENT_INTERACTION_FLOW.md**
   - Updated flow diagrams to show Bash tool usage
   - Removed MCP server steps
   - Emphasized Docker + expect approach

3. **prompts/orchestrator.md** 
   - Removed MCP tools section
   - Added Bash script communication examples
   - Updated all code samples

4. **prompts/anga.md**
   - Removed MCP tools section  
   - Added Bash script communication examples
   - Updated domain-specific examples

5. **prompts/marie.md**
   - Removed MCP tools section
   - Added Bash script communication examples  
   - Updated domain-specific examples

6. **prompts/fabien.md**
   - Removed MCP tools section
   - Added Bash script communication examples
   - Updated domain-specific examples

## Technical Implementation

### How It Works

1. Agents use Claude Code's built-in **Bash tool**
2. Execute: `bash /tools/send_agent_message.sh <agent> "<message>"`
3. Script uses `docker attach` + `expect` to deliver message
4. No MCP tools involved

### Requirements

- Docker socket access with group 0 permissions
- Automation container with `expect` installed
- send_agent_message.sh script in /tools/

## Documentation Status

- All agent prompts updated
- All documentation files updated
- Examples converted from MCP to Bash scripts
- Flow diagrams corrected

**Status**: Complete  
**Date**: 2025-11-20
