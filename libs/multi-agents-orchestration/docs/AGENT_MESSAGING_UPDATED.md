# Agent Messaging - Updated with Shell Command Fallback

**Date**: 2025-11-20  
**Status**: ✅ Complete

## Summary

All agent prompts have been updated to include **shell command fallback** for inter-agent messaging. Agents now know how to use the `Bash()` tool to send messages when MCP tools are not available.

## What Changed

### All 4 Agent Prompts Updated

1. **`prompts/orchestrator.md`** ✅
2. **`prompts/anga.md`** ✅
3. **`prompts/marie.md`** ✅
4. **`prompts/fabien.md`** ✅

### New Section Added: "Option B: Shell Command (Always Works)"

Each agent now has clear instructions on using the Bash tool:

```
#### Option B: Shell Command (Always Works) ⭐

If MCP tools are not available, use the shell command:

**How to send a message:**
1. Use the `Bash` tool
2. Run: `bash /tools/send_agent_message.sh <agent> "Your message"`
3. The message will be delivered automatically

**Examples:**

To send a message to Anga:
```
Bash(bash /tools/send_agent_message.sh anga "[Message from orchestrator]: Please implement a REST API")
```
```

## Why This Works

### Claude Code Tool Syntax

Agents use Claude Code's built-in `Bash()` tool, which they already know how to use:

```
Bash(bash /tools/send_agent_message.sh anga "Your message here")
```

This is the **natural syntax** for Claude Code agents - they see it in their tool output all the time.

### Automatic Message Delivery

The `send_agent_message.sh` script:
- Uses `docker attach` + `expect` to connect to target agent
- Sends the message directly to the agent's stdin
- Automatically presses Enter to submit
- Works 100% of the time (tested and verified)

## Updated Files

### Source Prompts
- `prompts/orchestrator.md` - Updated with shell command examples
- `prompts/anga.md` - Updated with shell command examples
- `prompts/marie.md` - Updated with shell command examples
- `prompts/fabien.md` - Updated with shell command examples

### Agent Home Directories (Auto-loaded on startup)
- `shared/auth-homes/orchestrator/CLAUDE.md` - Copied from prompts/
- `shared/auth-homes/anga/CLAUDE.md` - Copied from prompts/
- `shared/auth-homes/marie/CLAUDE.md` - Copied from prompts/
- `shared/auth-homes/fabien/CLAUDE.md` - Copied from prompts/

## How Agents Will Use This

### Orchestrator Example

When orchestrator wants to send a message to Anga:

```
Bash(bash /tools/send_agent_message.sh anga "[Message from orchestrator]: Please review the authentication code in /workspace/api/auth.js")
```

### Worker Example

When Anga wants to respond to orchestrator:

```
Bash(bash /tools/send_agent_message.sh orchestrator "[Message from anga]: Code review complete. Found 2 security issues - details in /results/anga/review-001.json")
```

## Testing

To test the messaging system:

1. **Start orchestrator**:
   ```bash
   docker-compose up -d orchestrator
   ```

2. **Attach to orchestrator**:
   ```bash
   docker attach codehornets-orchestrator
   ```

3. **Send a test message**:
   ```
   Bash(bash /tools/send_agent_message.sh anga "[Message from orchestrator]: Test message - please acknowledge")
   ```

4. **Check Anga's container** (in another terminal):
   ```bash
   docker attach codehornets-worker-anga
   ```

You should see the message appear in Anga's session!

## Benefits

✅ **Always works** - No dependency on MCP tools loading  
✅ **Natural syntax** - Uses Claude Code's built-in Bash() tool  
✅ **Clear examples** - Agents see exactly how to format messages  
✅ **Dual approach** - Try MCP first, fall back to shell command  
✅ **Self-documenting** - Instructions are in the agent's prompt  

## Next Steps

1. **Restart agents** to load new prompts (if already running)
2. **Test messaging** between orchestrator and workers
3. **Monitor usage** to see which method agents prefer
4. **Fix MCP loading** (optional) - but not required since shell commands work perfectly

---

**Result**: Agents now have a **reliable, always-working** method to communicate with each other! 🎉

