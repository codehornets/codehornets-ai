# APEXX Hybrid Architecture: Agent + Skill

## Overview

The dance evaluation system uses a **hybrid architecture** that combines:
- **Skill**: `marie-dance-evaluator` (workflow instructions)
- **Agent**: `apexx` (autonomous worker that uses the skill)

This provides the best of both worlds: interactive workflows AND autonomous processing without context pollution.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code (Main)                       │
│                                                             │
│  User: "Evaluate all students"                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Option 1: Use Skill Directly (Interactive)        │   │
│  │                                                     │   │
│  │  > Use marie-dance-evaluator to...                 │   │
│  │  ↓                                                  │   │
│  │  Main Claude reads and follows skill instructions  │   │
│  │  ✓ Visible process                                 │   │
│  │  ✗ Uses main context                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Option 2: Spawn APEXX Agent (Autonomous)          │   │
│  │                                                     │   │
│  │  Task(subagent_type: "apexx")                       │   │
│  │  ↓                                                  │   │
│  │  ┌───────────────────────────────────────────┐     │   │
│  │  │  APEXX Agent (Separate Instance)          │     │   │
│  │  │                                            │     │   │
│  │  │  1. Reads skill:                           │     │   │
│  │  │     .claude/skills/marie-dance-evaluator/  │     │   │
│  │  │     SKILL.md                               │     │   │
│  │  │                                            │     │   │
│  │  │  2. Follows skill workflow:                │     │   │
│  │  │     - Read reference examples              │     │   │
│  │  │     - Identify students                    │     │   │
│  │  │     - Generate evaluations                 │     │   │
│  │  │     - Save to workspace                    │     │   │
│  │  │                                            │     │   │
│  │  │  3. Reports back:                          │     │   │
│  │  │     - Evaluations created: 26              │     │   │
│  │  │     - Location: workspaces/...             │     │   │
│  │  │                                            │     │   │
│  │  │  ✓ Clean context                           │     │   │
│  │  │  ✓ Autonomous                              │     │   │
│  │  │  ✗ Less visibility                         │     │   │
│  │  └───────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Skill: marie-dance-evaluator

**Location**: `.claude/skills/marie-dance-evaluator/SKILL.md`

**Type**: Instructions (reusable workflow)

**Contains**:
- Complete evaluation workflow
- APEXX rubric (100-point, 8 categories)
- File paths (input/output separation)
- Templates (formal evaluations, quick notes)
- Hip-hop terminology guide
- French language patterns
- Quality checklist

**Used by**:
- Main Claude Code (when skill is invoked directly)
- APEXX agent (when spawned via Task tool)

**Registered in**: `.claude/skills/skill-rules.json`

**Triggers**:
- Keywords: "marie", "dance evaluation", "APEXX", "formal evaluation"
- Intent patterns: "create evaluation", "evaluate student", "batch evaluation"

### 2. Agent: apexx

**Location**: `.claude/agents/specialized/dance/apexx.md`

**Type**: Autonomous worker agent

**YAML Frontmatter**:
```yaml
---
name: apexx
description: Autonomous APEXX evaluation agent that uses the marie-dance-evaluator SKILL
color: pink
---
```

**Purpose**:
- Handle large evaluation tasks autonomously
- Keep main Claude Code context clean
- Process batch evaluations without user interaction
- Report completion status

**Workflow**:
1. Reads `.claude/skills/marie-dance-evaluator/SKILL.md`
2. Executes skill workflow step-by-step
3. Operates independently in separate context
4. Returns results to main Claude

## Usage Comparison

### Scenario 1: Single Student Evaluation (Use Skill)

```
User: "Create a formal evaluation for Emma Rodriguez"

Approach: Use skill directly
Command: "Use marie-dance-evaluator to create a formal evaluation for Emma"

What happens:
1. Main Claude loads skill instructions
2. Reads reference examples (visible in logs)
3. Generates evaluation (you see the process)
4. Writes to workspace
5. Reports completion

Pros:
✓ Visible process - you see each step
✓ Interactive - can interrupt or adjust
✓ Clear feedback

Cons:
✗ Uses main context (adds ~5-10k tokens)
✗ Not ideal for large batches
```

### Scenario 2: Batch Evaluation (Use Agent)

```
User: "Evaluate all 26 dance students"

Approach: Spawn APEXX agent
Command: Task({
  subagent_type: "apexx",
  description: "Evaluate all students",
  prompt: "Use marie-dance-evaluator skill to create formal evaluations for all 26 students"
})

What happens:
1. Main Claude spawns APEXX agent
2. Agent loads skill in separate context
3. Agent processes all 26 students autonomously
4. Agent reports: "Created 26 evaluations in workspaces/..."
5. Main context stays clean

Pros:
✓ Clean main context (no 26 evaluations worth of tokens)
✓ Autonomous processing (runs in background)
✓ Scalable (can handle large batches)

Cons:
✗ Less visibility (don't see each step)
✗ Less interactive (can't adjust mid-process)
```

## File Structure

```
.claude/
├── skills/
│   └── marie-dance-evaluator/
│       └── SKILL.md                    # Workflow instructions (reusable)
│
├── agents/
│   └── specialized/dance/
│       ├── apexx.md                    # Agent that uses the skill
│       ├── README.md                   # Updated with hybrid info
│       ├── USAGE_EXAMPLES.md
│       └── QUICK_REFERENCE.md
│
└── skill-rules.json                    # Skill registration

data/knowledgehub/domain/dance/marie/  # Reference examples (READ ONLY)
├── markdown/students-reviews/
└── pdfs/students-notes/

workspaces/dance/studio/evaluations/    # Generated evaluations (WRITE HERE)
├── formal/
├── quick-notes/
└── batch/
```

## When to Use Which

### Use Skill Directly (Interactive)

**Best for**:
- Single student evaluations
- Quick progress notes
- When you want to see the process
- Learning how evaluations are created
- Testing and verification

**How to invoke**:
```
Use marie-dance-evaluator to create a formal evaluation for Emma
```

### Use APEXX Agent (Autonomous)

**Best for**:
- Batch evaluations (5+ students)
- Large tasks that would pollute context
- Background processing
- When you trust the workflow and just want results

**How to invoke**:
```javascript
Task({
  subagent_type: "apexx",
  description: "Batch evaluate students",
  prompt: "Use marie-dance-evaluator skill to create formal evaluations for all students in knowledgehub"
})
```

**Or naturally**:
```
Spawn the APEXX agent to evaluate all 26 dance students
```

## Benefits of Hybrid Architecture

### 1. **Skill Reusability**
- One source of truth for evaluation workflow
- Both main Claude and APEXX agent use same instructions
- Updates to skill automatically apply to both approaches

### 2. **Context Management**
- Interactive mode: Uses main context (acceptable for small tasks)
- Autonomous mode: Separate context (essential for large tasks)
- Main Claude stays under token limits

### 3. **Flexibility**
- Choose approach based on task size
- Interactive for learning and testing
- Autonomous for production batch work

### 4. **Transparency**
- Skill workflow is documented and visible
- Agent behavior is predictable (follows skill)
- Easy to debug (check skill instructions)

### 5. **Scalability**
- Can process 1 student or 100 students
- Agent approach scales without context issues
- Skill provides consistent quality

## Example Workflows

### Workflow 1: End-of-Term (26 Students)

```bash
# Use APEXX agent for batch processing
Task({
  subagent_type: "apexx",
  description: "End-of-term evaluations",
  prompt: "Use marie-dance-evaluator skill to create formal APEXX evaluations for all 26 students in the knowledge base"
})

# Result:
# ✅ Created 26 evaluations
# 📁 Location: workspaces/dance/studio/evaluations/formal/
# 🕒 Time: ~15 minutes
# 🧠 Main context: Clean (no pollution)
```

### Workflow 2: Quick Class Notes (3 Students)

```bash
# Use skill directly for interactive feedback
Use marie-dance-evaluator to create quick notes for:
- Emma: Good energy, rock needs work
- Sophia: Strong attack, needs fluidity
- Maya: Nice musicality, amplitude needed

# Result:
# ✅ Created 3 quick notes
# 📁 Location: workspaces/dance/studio/evaluations/quick-notes/
# 👁️ Visible: Saw each step
# 🕒 Time: ~2 minutes
```

### Workflow 3: Single Formal Evaluation

```bash
# Use skill directly for visibility
Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez with these observations:
- Bounce: 7/10, good depth
- Upper body: tension in shoulders
- Coordination: excellent (9/10)
- Effort: full commitment (9/10)

# Result:
# ✅ Created formal evaluation
# 📁 Location: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
# 👁️ Visible: Saw reference reading, generation, writing
# 🕒 Time: ~3 minutes
```

## Troubleshooting

### Issue: Agent not recognized

**Symptom**: `Error: Unknown agent: apexx`

**Cause**: Agent file missing YAML frontmatter or Claude Code not restarted

**Fix**:
1. Check `.claude/agents/specialized/dance/apexx.md` has YAML frontmatter
2. Restart Claude Code: `exit` then `claude`

### Issue: Skill not triggering

**Symptom**: Claude doesn't recognize skill keyword

**Cause**: Skill not registered in skill-rules.json

**Fix**:
1. Check `.claude/skills/skill-rules.json` has `marie-dance-evaluator` entry
2. Restart Claude Code

### Issue: Context pollution

**Symptom**: "Large cumulative agent descriptions will impact performance"

**Solution**: Use APEXX agent instead of skill for large tasks
```javascript
Task({subagent_type: "apexx", ...})
```

## Testing

### Test Skill Approach
```bash
make clean-workspace-test
claude
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

### Test Agent Approach
```bash
make clean-workspace-test
claude
> Spawn APEXX agent to evaluate all students
```

## Summary

| Feature | Skill (Interactive) | Agent (Autonomous) |
|---------|--------------------|--------------------|
| **Context** | Uses main | Separate (clean) |
| **Visibility** | High | Low |
| **Speed** | Medium | Fast |
| **Best for** | 1-3 students | 5+ students |
| **Interaction** | Can adjust | Fire and forget |
| **Invocation** | "Use marie-dance-evaluator" | `Task(subagent_type: "apexx")` |

**The hybrid architecture gives you the best of both worlds:**
- ✅ Interactive workflows when you need visibility
- ✅ Autonomous processing when you need scale
- ✅ One workflow definition (DRY principle)
- ✅ Clean context management
- ✅ Flexible based on task size

---

**Date**: 2025-11-17
**Architecture**: Hybrid (Agent + Skill)
**Status**: ✅ Implemented and ready to use
**Agent Name**: `apexx`
**Skill Name**: `marie-dance-evaluator`
