---
description: List all available Claude Code agents with their capabilities
---

# List Agents Command

Display all available agents with their configuration and capabilities.

## Usage

```
/list-agents [filter]
```

**Filters**:
- No filter: Show all agents
- `--detailed`: Include full configuration
- `--by-model`: Group by model (Haiku/Sonnet/Opus)
- `--by-domain`: Group by domain/purpose
- `project`: Only project agents (.claude/agents/)
- `user`: Only user agents (~/.claude/agents/)
- `plugin`: Only plugin-provided agents

## Output Format

### Default View
```
Available Claude Code Agents (3):

1. code-reviewer
   Purpose: Expert code review with security focus
   Model: sonnet
   Tools: Read, Grep, Glob
   Location: .claude/agents/code-reviewer.md

2. student-evaluator
   Purpose: Evaluate dance students with constructive feedback
   Model: sonnet
   Tools: Read, Write
   Location: .claude/agents/student-evaluator.md

3. docs-generator
   Purpose: Create comprehensive documentation
   Model: sonnet
   Tools: Read, Write, Grep, Glob
   Location: .claude/agents/docs-generator.md
```

### Detailed View (--detailed)
```
code-reviewer
├─ Description: Expert code review with security and best practices focus
├─ Model: sonnet
├─ Tools: Read, Grep, Glob
├─ Skills: security-patterns
├─ Permissions: default
├─ Output Style: .claude/output-styles/code-reviewer.md
├─ Location: .claude/agents/code-reviewer.md
├─ Last Modified: 2025-11-18 14:32:00
└─ Invoke: Task(subagent_type="code-reviewer", ...)

student-evaluator
├─ Description: Evaluate dance students with constructive feedback
├─ Model: sonnet
├─ Tools: Read, Write
├─ Skills: (none)
├─ Permissions: default
├─ Output Style: .claude/output-styles/student-evaluator.md
├─ Location: .claude/agents/student-evaluator.md
├─ Last Modified: 2025-11-18 15:45:00
└─ Invoke: Task(subagent_type="student-evaluator", ...)
```

### By Model (--by-model)
```
Haiku (Fast & Cost-Effective):
  (none)

Sonnet (Balanced - Recommended):
  - code-reviewer
  - student-evaluator
  - docs-generator

Opus (Maximum Capability):
  - complex-architect
  - deep-researcher
```

### By Domain (--by-domain)
```
Development:
  - code-reviewer
  - test-creator
  - debugger

Documentation:
  - docs-generator
  - api-documenter

Education:
  - student-evaluator
  - progress-tracker

Marketing:
  - content-writer
  - social-media-manager
```

## Examples

### List All Agents
```
/list-agents

Available Claude Code Agents (5):
1. code-reviewer (sonnet)
2. student-evaluator (sonnet)
3. docs-generator (sonnet)
4. test-creator (haiku)
5. security-auditor (opus)
```

### Detailed Information
```
/list-agents --detailed

[Full configuration for each agent]
```

### Filter by Location
```
/list-agents project

Project Agents (.claude/agents/):
- code-reviewer
- student-evaluator
- docs-generator
```

### Group by Model
```
/list-agents --by-model

[Agents grouped by Haiku/Sonnet/Opus]
```

## Agent Information Fields

Each agent shows:

| Field | Description |
|-------|-------------|
| **Name** | Agent identifier (subagent_type) |
| **Purpose** | One-line description |
| **Model** | Haiku, Sonnet, or Opus |
| **Tools** | Available tool access |
| **Skills** | Integrated skills |
| **Permissions** | Permission mode |
| **Output Style** | Custom personality file |
| **Location** | File path |
| **Invoke** | How to call the agent |

## Quick Actions

After listing, can directly:

```
/list-agents

Available agents:
1. code-reviewer
2. student-evaluator

# Invoke agent
Task(subagent_type="code-reviewer", prompt="Review my code")

# Update agent
/update-agent code-reviewer

# Delete agent
/delete-agent code-reviewer
```

## Filter Combinations

```
# Project agents only
/list-agents project

# User-level agents only
/list-agents user

# Plugin-provided agents
/list-agents plugin

# All with details
/list-agents --detailed
```

## Output Uses

### Quick Reference
```
/list-agents

→ See what agents exist
→ Check agent capabilities
→ Find right agent for task
```

### Configuration Audit
```
/list-agents --detailed

→ Review all configurations
→ Check tool permissions
→ Verify skills integration
→ Audit security settings
```

### Planning Updates
```
/list-agents --by-model

→ Identify cost optimization opportunities
→ See which agents could use better models
→ Plan model upgrades
```

## Integration with Other Commands

### List → Invoke
```
/list-agents
→ See: code-reviewer available
→ Task(subagent_type="code-reviewer", ...)
```

### List → Update
```
/list-agents
→ See: student-evaluator needs tools
→ /update-agent student-evaluator
```

### List → Create
```
/list-agents --by-domain
→ Notice: No testing agents
→ /create-agent test-creator
```

## Advanced Queries

### Find Agents with Specific Tool
```
/list-agents --detailed | grep "WebSearch"
→ Shows agents that can search web
```

### Find Agents by Purpose
```
/list-agents | grep -i "test"
→ Shows all testing-related agents
```

### Check Agent Count by Model
```
/list-agents --by-model
→ Haiku: 2 agents
→ Sonnet: 8 agents
→ Opus: 1 agent
```

## Sample Output

```
═══════════════════════════════════════════════════════════════════
  Claude Code Agents - Available
═══════════════════════════════════════════════════════════════════

PROJECT AGENTS (.claude/agents/)
--------------------------------

1. code-reviewer [sonnet]
   Expert code review with security focus
   Tools: Read, Grep, Glob
   Invoke: Task(subagent_type="code-reviewer", ...)

2. student-evaluator [sonnet]
   Evaluate dance students with constructive feedback
   Tools: Read, Write
   Invoke: Task(subagent_type="student-evaluator", ...)

3. docs-generator [sonnet]
   Create comprehensive documentation from code
   Tools: Read, Write, Grep, Glob
   Invoke: Task(subagent_type="docs-generator", ...)

PLUGIN AGENTS
-------------

4. agent-creator [sonnet]
   Create new specialized Claude Code agents
   Plugin: agent-manager
   Invoke: Task(subagent_type="agent-creator", ...)

═══════════════════════════════════════════════════════════════════
Total: 4 agents (3 project, 1 plugin)

Next steps:
- Use: Task(subagent_type="name", ...)
- Update: /update-agent name
- Create: /create-agent
═══════════════════════════════════════════════════════════════════
```

## Related Commands

- `/create-agent` - Create new agent
- `/update-agent` - Update existing agent
- `/delete-agent` - Remove agent
- `/test-agent` - Test agent configuration

---

**Quick agent inventory and reference!**

Try: `/list-agents --detailed`
