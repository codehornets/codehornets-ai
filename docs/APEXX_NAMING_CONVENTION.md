# APEXX Naming Convention

## Summary

The dance evaluation system now uses consistent naming:

- **Agent**: `apexx`
- **Skill**: `apexx-dance-evaluator` (used by the agent)
- **Legacy Skill**: `marie-dance-evaluator` (for backward compatibility)

## File Structure

```
.claude/
├── skills/
│   ├── apexx-dance-evaluator/
│   │   └── SKILL.md                    # Primary skill (used by APEXX agent)
│   └── marie-dance-evaluator/
│       └── SKILL.md                    # Legacy skill (backward compatible)
│
└── agents/
    └── specialized/dance/
        └── apexx.md                    # Agent that loads apexx-dance-evaluator skill
```

## How It Works

### The APEXX Agent

**Agent Name**: `apexx`
**Location**: `.claude/agents/specialized/dance/apexx.md`

**What it does**:
1. When spawned via Task tool
2. Reads `.claude/skills/apexx-dance-evaluator/SKILL.md`
3. Follows the skill workflow
4. Creates evaluations autonomously
5. Reports back to main Claude

**YAML Frontmatter**:
```yaml
---
name: apexx
description: Autonomous APEXX evaluation agent that uses the apexx-dance-evaluator SKILL
color: pink
---
```

### The Skills

#### Primary: apexx-dance-evaluator

**Skill Name**: `apexx-dance-evaluator`
**Location**: `.claude/skills/apexx-dance-evaluator/SKILL.md`

**Used by**:
- APEXX agent (primary use case)
- Main Claude (if explicitly requested)

**Invocation**:
```
Use apexx-dance-evaluator to create evaluations
```

#### Legacy: marie-dance-evaluator

**Skill Name**: `marie-dance-evaluator`
**Location**: `.claude/skills/marie-dance-evaluator/SKILL.md`

**Used by**:
- Main Claude (interactive mode)
- Backward compatibility

**Invocation**:
```
Use marie-dance-evaluator to create a formal evaluation for Emma
```

## Usage Patterns

### Pattern 1: Interactive Single Evaluation (Legacy Skill)

```
User: "Use marie-dance-evaluator to create a formal evaluation for Emma"

What happens:
1. Main Claude loads marie-dance-evaluator skill
2. Follows workflow interactively
3. Creates evaluation
4. You see all steps

Use when:
- Single student evaluation
- Want to see the process
- Testing or learning
```

### Pattern 2: Batch Evaluation (APEXX Agent + Skill)

```
User: "Spawn APEXX agent to evaluate all students"

What happens:
1. Main Claude spawns APEXX agent
2. Agent loads apexx-dance-evaluator skill
3. Agent processes autonomously
4. Reports back when done
5. Main context stays clean

Use when:
- Multiple students (5+)
- Batch processing
- Don't want context pollution
```

### Pattern 3: Direct APEXX Skill (Alternative)

```
User: "Use apexx-dance-evaluator to create evaluations"

What happens:
1. Main Claude loads apexx-dance-evaluator skill
2. Follows workflow (same as marie-dance-evaluator)
3. Creates evaluations

Note: Same as marie-dance-evaluator, just different name
```

## Naming Rationale

### Why "apexx" for the agent?

- **APEXX** = The evaluation program name (APEXX Sport-Études)
- Short, memorable, distinctive
- Matches the domain (dance evaluation for APEXX program)
- Different from "marie" (avoids confusion)

### Why "apexx-dance-evaluator" for the skill?

- **Consistency**: Agent name + purpose
- **Clarity**: Immediately clear it's the skill for APEXX agent
- **Convention**: `{agent-name}-{function}` pattern

### Why keep "marie-dance-evaluator"?

- **Backward compatibility**: Existing workflows continue to work
- **Interactive mode**: Clearer name for teacher use
- **Legacy support**: No breaking changes

## Skill Registration

Both skills are registered in `.claude/skills/skill-rules.json`:

### marie-dance-evaluator
```json
{
  "marie-dance-evaluator": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "Create French-language hip-hop dance evaluations for APEXX Sport-Études students (interactive mode)",
    "promptTriggers": {
      "keywords": ["marie", "dance evaluation", "student evaluation", "APEXX", ...]
    }
  }
}
```

### apexx-dance-evaluator
```json
{
  "apexx-dance-evaluator": {
    "type": "domain",
    "enforcement": "suggest",
    "priority": "high",
    "description": "APEXX dance evaluation skill used by autonomous agent (for batch processing)",
    "promptTriggers": {
      "keywords": ["apexx", "apexx agent", "batch evaluation", "all students", ...]
    }
  }
}
```

## Migration Path

### Current Users

If you're using:
```
Use marie-dance-evaluator to...
```

✅ **No changes needed** - it still works!

### New Pattern (Recommended for Batch)

For large batch processing:
```javascript
Task({
  subagent_type: "apexx",
  description: "Batch evaluation",
  prompt: "Use apexx-dance-evaluator skill to evaluate all students"
})
```

Or naturally:
```
Spawn APEXX agent to evaluate all 26 students
```

## Quick Reference

| What | Name | Location | Use For |
|------|------|----------|---------|
| **Agent** | `apexx` | `.claude/agents/specialized/dance/apexx.md` | Autonomous batch processing |
| **Skill 1** | `apexx-dance-evaluator` | `.claude/skills/apexx-dance-evaluator/SKILL.md` | Used by APEXX agent |
| **Skill 2** | `marie-dance-evaluator` | `.claude/skills/marie-dance-evaluator/SKILL.md` | Interactive single evaluations |

## Relationship Diagram

```
┌──────────────────────────────────────────────────────┐
│                   User Request                       │
└────────────┬─────────────────────────┬───────────────┘
             │                         │
             │                         │
    ┌────────▼─────────┐      ┌────────▼─────────────┐
    │  Single Student  │      │  Batch Students      │
    │  (Interactive)   │      │  (Autonomous)        │
    └────────┬─────────┘      └────────┬─────────────┘
             │                         │
             │                         │
    ┌────────▼──────────────┐ ┌────────▼──────────────┐
    │ marie-dance-evaluator │ │   apexx agent         │
    │      (SKILL)          │ │   spawned via Task    │
    └───────────────────────┘ └────────┬──────────────┘
                                       │
                                       │ loads
                                       │
                              ┌────────▼──────────────┐
                              │ apexx-dance-evaluator │
                              │      (SKILL)          │
                              └───────────────────────┘
```

## Testing

### Test Legacy Skill
```bash
make clean-workspace-test
claude
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

### Test APEXX Agent
```bash
make clean-workspace-test
claude
> Spawn APEXX agent to evaluate all students
```

### Test APEXX Skill Directly
```bash
make clean-workspace-test
claude
> Use apexx-dance-evaluator to create evaluations for all students
```

## Summary

- ✅ **Agent**: `apexx` - Autonomous worker
- ✅ **Primary Skill**: `apexx-dance-evaluator` - Used by agent
- ✅ **Legacy Skill**: `marie-dance-evaluator` - Backward compatible
- ✅ **Both registered** in skill-rules.json
- ✅ **Consistent naming** convention
- ✅ **No breaking changes** for existing users

---

**Date**: 2025-11-17
**Convention**: `{agent-name}-{function}` for skills
**Agent Name**: `apexx`
**Skill Name**: `apexx-dance-evaluator`
**Legacy Support**: `marie-dance-evaluator` (still works)
