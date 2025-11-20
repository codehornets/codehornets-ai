# MCP Agent Communication Deprecation Notice

## Summary

As of November 2025, the MCP server for inter-agent communication (`tools/agent_communication_mcp.py`) has been **DEPRECATED**. All agent-to-agent communication should now use the bash script approach directly.

## Background

The MCP server was originally created to provide tools for inter-agent communication:
- `send_message_to_agent`
- `list_available_agents`
- `check_agent_status`

However, in practice, agents have been using the bash scripts directly for more reliable communication:
- `/tools/send_agent_message.sh` - For sending messages between agents
- `/tools/check_agent_activity.sh` - For checking agent status

## Current State

### What Has Changed

1. **agent_communication_mcp.py** - Added deprecation notice at the top of the file
2. **All .mcp.json files** - MCP server entries renamed from `agent-communication` to `_DEPRECATED_agent-communication`
3. **Documentation** - This deprecation notice created to explain the change

### Files Modified

- `tools/agent_communication_mcp.py` - Added deprecation header
- `shared/auth-homes/orchestrator/.mcp.json` - Deprecated MCP server entry
- `shared/auth-homes/anga/.mcp.json` - Deprecated MCP server entry
- `shared/auth-homes/marie/.mcp.json` - Deprecated MCP server entry
- `shared/auth-homes/fabien/.mcp.json` - Deprecated MCP server entry

## Migration Guide

### Old Method (DEPRECATED - MCP Tools)

```python
# DO NOT USE
send_message_to_agent(
    target_agent="anga",
    message="Please review the code",
    from_agent="orchestrator"
)
```

### New Method (RECOMMENDED - Bash Scripts)

```bash
# USE THIS INSTEAD
bash /tools/send_agent_message.sh anga "[Message from orchestrator]: Please review the code"
```

## How Agent Communication Works Now

1. **Direct Bash Script Execution**
   - Agents use the `Bash` tool to execute `/tools/send_agent_message.sh`
   - The script uses `docker attach` + `expect` to send messages to persistent Claude sessions
   - Messages are automatically submitted to the target agent

2. **Benefits of Bash Script Approach**
   - More reliable and direct
   - No MCP server overhead
   - Works consistently across all agents
   - Simpler to debug and maintain

## Important Notes

- The MCP server file (`agent_communication_mcp.py`) is maintained for backwards compatibility only
- The MCP server entries in `.mcp.json` files are renamed but not removed to avoid breaking existing setups
- Agent CLAUDE.md files already document both methods, with bash scripts as the primary approach

## Future Plans

- The MCP server file may be completely removed in future versions
- Agent documentation will be updated to remove references to MCP tools for communication
- The bash script approach will remain the standard method

## Contact

For questions about this deprecation or assistance with migration, please refer to the main project documentation or contact the project maintainers.

---

**Deprecated**: November 2025
**Recommended Alternative**: `/tools/send_agent_message.sh`
**Status**: MCP server maintained for backwards compatibility only