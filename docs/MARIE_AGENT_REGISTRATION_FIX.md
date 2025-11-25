# Marie Dance Evaluator - Agent Registration Fix

## Problem Identified

The marie-dance-evaluator agent was **not being invoked as a subagent** by Claude Code. Instead, Claude Code was:
- Reading the agent file directly
- Reading documentation
- Asking the user for information
- NOT using the Task tool to invoke the agent

## Root Cause

The agent file was missing **YAML frontmatter** required by Claude Code to register custom agents.

### What Was Missing

Claude Code requires this frontmatter at the top of agent files:

```yaml
---
name: agent-name
description: Brief description of what the agent does
color: color-name
---
```

### Before (Broken)

```markdown
# Marie - Dance Teacher Evaluation Specialist

Expert dance teacher specializing in hip-hop student evaluations...
```

### After (Fixed)

```markdown
---
name: marie-dance-evaluator
description: Expert dance teacher specializing in hip-hop student evaluations for the APEXX Sport-Études program. MUST BE USED for creating student evaluations, progress notes, and performance reviews for hip-hop dance students. Creates formal APEXX evaluations (100-point rubric), quick progress notes, and batch evaluations in French. Reads reference examples from data/knowledgehub/domain/dance/marie/ and writes output to workspaces/dance/studio/evaluations/.
color: pink
---

# Marie - Dance Teacher Evaluation Specialist

Expert dance teacher specializing in hip-hop student evaluations...
```

## How the Fix Works

### YAML Frontmatter Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Agent identifier used in Task tool | `marie-dance-evaluator` |
| `description` | Tells Claude Code when to use this agent | Describes use cases and functionality |
| `color` | Visual indicator in Claude Code UI | `pink`, `purple`, `blue`, etc. |

### Agent Registration

Once the frontmatter is added:
1. Claude Code automatically discovers the agent file
2. Agent appears in the available agents list
3. Can be invoked via Task tool: `Task(subagent_type: "marie-dance-evaluator")`
4. Natural language requests like "Use marie-dance-evaluator to..." work correctly

## Testing the Fix

### Before Fix
```
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez

Claude Code behavior:
- Searches for marie files
- Reads agent documentation
- Reads examples
- Asks user for information
- Does NOT invoke Task tool
```

### After Fix
```
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez

Expected Claude Code behavior:
- Invokes: Task(subagent_type: "marie-dance-evaluator", ...)
- Agent runs autonomously
- Reads reference examples
- Generates evaluation
- Writes to workspace
- Reports completion
```

## Verification Steps

### 1. Check Agent File Has Frontmatter
```bash
head -10 .claude/agents/specialized/dance/marie-dance-evaluator.md
```

Should show:
```yaml
---
name: marie-dance-evaluator
description: ...
color: pink
---
```

### 2. Restart Claude Code
```bash
# Exit current session
exit

# Start new session
claude
```

### 3. Test Invocation
```
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

Look for in the log:
```
● Task(Create formal evaluation for Emma Rodriguez)
  ⎿  Done (... tool uses · ... tokens · ...time)
```

### 4. Verify Output
```bash
# Check if evaluation was created
ls -la workspaces/dance/studio/students/emma-rodriguez/evaluations/
```

## What Changed

### File Modified
- `.claude/agents/specialized/dance/marie-dance-evaluator.md`

### Change Made
Added YAML frontmatter (lines 1-5):
```yaml
---
name: marie-dance-evaluator
description: Expert dance teacher specializing in hip-hop student evaluations for the APEXX Sport-Études program. MUST BE USED for creating student evaluations, progress notes, and performance reviews for hip-hop dance students. Creates formal APEXX evaluations (100-point rubric), quick progress notes, and batch evaluations in French. Reads reference examples from data/knowledgehub/domain/dance/marie/ and writes output to workspaces/dance/studio/evaluations/.
color: pink
---
```

## Similar Pattern for Other Agents

All Claude Code subagents must follow this pattern:

```markdown
---
name: my-custom-agent
description: Detailed description of what this agent does and when to use it
color: blue
---

# Agent Title

[Agent content...]
```

## Common Colors

- `pink` - Creative/artistic agents
- `purple` - Specialized tools
- `blue` - Technical/engineering agents
- `green` - Testing/QA agents
- `orange` - Documentation agents
- `red` - Security/debugging agents

## Related Documentation

- `.claude/agents/README.md` - Main agents overview
- `docs/HOW_TO_USE_MARIE_EVALUATOR.md` - Usage guide
- `docs/MARIE_INPUT_OUTPUT_SEPARATION.md` - File handling
- `docs/WORKSPACE_CLEANUP.md` - Testing workflows

## Key Takeaways

1. **YAML frontmatter is required** for Claude Code to register custom agents
2. **Agent name** must match the `subagent_type` used in Task tool calls
3. **Description** determines when Claude Code will invoke the agent
4. **Without frontmatter**, Claude Code will read the file but not invoke as subagent
5. **After adding frontmatter**, restart Claude Code session

---

**Status:** ✅ Fixed
**Date:** 2025-11-17
**Issue:** Agent not being invoked as subagent
**Solution:** Added YAML frontmatter with name, description, and color fields
