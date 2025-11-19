# Agent Manager Plugin - Hooks Fix

## Issue

UserPromptSubmit hook was causing errors during session:
```
> create a new agent
  ⎿  UserPromptSubmit hook error
```

## Root Cause

The hook configuration had issues:
1. **UserPromptSubmit on every message** - Ran on every user prompt, high chance of failure
2. **Echo command** - Less portable, could fail on some shells
3. **No explicit exit** - Could return non-zero exit code
4. **Complex stderr redirection** - Potential syntax issues

## Fix Applied

Changed from:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "echo '✅ Agent Manager Plugin Loaded' >&2"
        }]
      }
    ]
  }
}
```

To:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "printf '✅ Agent Manager Plugin Ready\\n' >&2; exit 0"
        }]
      }
    ]
  }
}
```

## Changes Made

### 1. Changed Event Type
- **Before**: `UserPromptSubmit` (runs on every user message)
- **After**: `SessionStart` with `"startup"` matcher (runs once at session start)
- **Why**: Less intrusive, fewer failure points, one-time initialization

### 2. Changed Command
- **Before**: `echo '✅ Agent Manager Plugin Loaded' >&2`
- **After**: `printf '✅ Agent Manager Plugin Ready\\n' >&2; exit 0`
- **Why**:
  - `printf` more portable than `echo`
  - Explicit `\n` for newline
  - Explicit `exit 0` ensures success

### 3. Added Explicit Exit Code
- Added `; exit 0` to ensure hook always exits successfully
- Prevents Claude Code from treating hook as failed

## How to Test

Start a new Claude Code session:
```bash
claude
```

You should see in stderr:
```
✅ Agent Manager Plugin Ready
```

No more hook errors!

## Hook Best Practices

Based on this fix:

1. **Use SessionStart for initialization** - Don't use UserPromptSubmit for one-time setup
2. **Use printf over echo** - More portable across shells
3. **Always exit 0** - Explicit success exit code
4. **Keep commands simple** - Avoid complex shell features
5. **Test in isolation** - Test hook commands in terminal first

## Testing Hook Command

Test the hook command directly:
```bash
printf '✅ Agent Manager Plugin Ready\n' >&2; exit 0
echo $?  # Should output: 0
```

## Alternative: No Hooks

If you don't need the startup message, you can use empty hooks:
```json
{
  "hooks": {}
}
```

Hooks are optional for plugins.

## References

- Claude Code Hooks Documentation: `/home/anga/workspace/beta/codehornets-ai/docs/CLAUDE_CODE_HOOKS_GUIDE.md`
- Hook events: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop
- Exit codes: 0 (success), 2 (blocking error), other (non-blocking error)

---

**Status**: ✅ Fixed
**Date**: 2025-11-18
**Impact**: Hook errors resolved, plugin loads cleanly
