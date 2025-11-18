# Marie Dance Evaluator - Skill vs Agent

## The Solution: Created as a Skill

Marie dance evaluator has been implemented as a **Claude Code Skill** (not an Agent) because of how you wanted to invoke it.

## Skill vs Agent

### Skills
**What they are**: Instructions and workflows that guide Claude Code on how to perform a task

**How to use**:
```
Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

**Location**: `.claude/skills/marie-dance-evaluator/SKILL.md`

**Registration**: Listed in `.claude/skills/skill-rules.json`

**Behavior**: Claude Code reads the skill instructions and follows them step-by-step

### Agents (for reference)
**What they are**: Autonomous sub-agents that run independently via Task tool

**How to use**:
```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Create evaluation",
  prompt: "Create formal evaluation for Emma Rodriguez"
})
```

**Location**: `.claude/agents/specialized/dance/marie-dance-evaluator.md`

**Behavior**: Spawns a separate Claude instance that runs autonomously

## What We Built

### Created Files

1. **Skill Definition**
   - File: `.claude/skills/marie-dance-evaluator/SKILL.md`
   - Contains: Complete workflow instructions, templates, examples
   - Purpose: Tells Claude Code how to create dance evaluations

2. **Skill Registration**
   - File: `.claude/skills/skill-rules.json`
   - Added: `marie-dance-evaluator` entry
   - Triggers: Keywords like "marie", "dance evaluation", "APEXX", "formal evaluation"

3. **Agent Definition** (also kept for future use)
   - File: `.claude/agents/specialized/dance/marie-dance-evaluator.md`
   - Contains: Full agent specification with YAML frontmatter
   - Purpose: Can be used if you want to invoke as autonomous agent later

## How to Use

### Method 1: Natural Language (Recommended)
```
Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

Claude Code will:
1. Recognize "marie-dance-evaluator" keyword
2. Load the skill instructions
3. Follow the workflow step-by-step
4. Read reference examples
5. Generate French evaluation
6. Save to workspace

### Method 2: With Observations
```
Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez with these observations:
- Good energy and effort (9/10)
- Upper body tension in shoulders
- Bounce depth 7/10, can go deeper
- Excellent coordination
```

### Method 3: Quick Notes
```
Use marie-dance-evaluator to create a quick note for Emma: Good energy today, rock needs work, applied corrections well
```

### Method 4: Batch Processing
```
Use marie-dance-evaluator to create formal evaluations for Emma, Sophia, and Maya with these observations:
- Emma: [observations]
- Sophia: [observations]
- Maya: [observations]
```

## What Happens When You Use It

### Step-by-Step Process

1. **Skill Activation**
   - You say: "Use marie-dance-evaluator to..."
   - Claude Code recognizes keyword
   - Loads: `.claude/skills/marie-dance-evaluator/SKILL.md`

2. **Reference Reading**
   - Reads: `data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md`
   - Reads: `data/knowledgehub/domain/dance/marie/markdown/students-reviews/bile.md`
   - Reads: `data/knowledgehub/domain/dance/marie/pdfs/students-notes/Leanne_Evaluation_Final.pdf`
   - Purpose: Learn tone, style, phrasing

3. **Path Determination**
   - Formal: `workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md`
   - Quick: `workspaces/dance/studio/evaluations/quick-notes/emma.md`
   - Batch: `workspaces/dance/studio/evaluations/batch/2025-11-17_batch.md`

4. **Directory Creation**
   ```bash
   mkdir -p workspaces/dance/studio/evaluations/formal/
   ```

5. **Content Generation**
   - Creates French-language evaluation
   - Uses APEXX 100-point rubric (8 categories)
   - Follows reference style
   - Balances strengths and growth areas

6. **File Writing**
   ```bash
   Write: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
   ```

7. **Confirmation**
   ```
   ✅ Formal evaluation created for Emma Rodriguez
   📁 Location: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
   📊 Format: APEXX 100-point rubric
   🇫🇷 Language: French
   ```

## File Locations

### Skill Files
```
.claude/skills/marie-dance-evaluator/
└── SKILL.md                      # Main skill instructions

.claude/skills/skill-rules.json   # Skill registration
```

### Input (Reference Examples - Read Only)
```
data/knowledgehub/domain/dance/marie/
├── markdown/students-reviews/    # Quick notes examples
└── pdfs/students-notes/          # Formal evaluation examples
```

### Output (Generated Evaluations)
```
workspaces/dance/studio/evaluations/
├── formal/                       # Formal APEXX evaluations
├── quick-notes/                  # Quick progress notes
└── batch/                        # Batch evaluations
```

## Testing

### Clean and Test
```bash
# Clean workspace
make clean-workspace-test

# Start Claude Code
claude

# Test skill
> Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez

# Verify output
ls -la workspaces/dance/studio/evaluations/formal/
cat workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
```

## Troubleshooting

### Issue: "Unknown skill: marie-dance-evaluator"
**Cause**: Skill not registered or Claude Code session started before skill was created

**Solution**:
1. Exit Claude Code
2. Restart: `claude`
3. Try again

### Issue: Skill not triggering automatically
**Cause**: Keyword not recognized

**Solution**: Use explicit phrase:
```
Use marie-dance-evaluator to create a formal evaluation for Emma
```

### Issue: Output in English
**Solution**: Skill always generates French. If you see English, the skill didn't activate. Try:
```
Use the marie-dance-evaluator skill to create a formal evaluation for Emma
```

### Issue: File saved to wrong location
**Cause**: Skill not being followed

**Check**: Output should ALWAYS be in `workspaces/dance/studio/evaluations/`

**Fix**: Explicitly request:
```
Use marie-dance-evaluator skill and save to workspace
```

## Skill Triggers

The skill automatically activates when Claude Code detects:

### Keywords
- "marie"
- "marie-dance-evaluator"
- "dance evaluation"
- "student evaluation"
- "APEXX"
- "formal evaluation"
- "quick note"
- "bounce", "rock", "groove"

### Intent Patterns
- "create evaluation"
- "generate assessment"
- "write review"
- "evaluate student"
- "formal evaluation"
- "batch evaluation"

### File Patterns
When working with files in:
- `data/knowledgehub/domain/dance/marie/`
- `workspaces/dance/`

## Advantages of Skill Approach

1. **Simple Invocation**: Just say "Use marie-dance-evaluator"
2. **Transparent Process**: You see each step Claude Code takes
3. **Easy Debugging**: Can follow along and verify each action
4. **Flexible**: Can interrupt, modify, or adjust mid-process
5. **Visible Results**: Clear feedback on what was created where

## When to Use Agent Instead

If you want:
- **Fully Autonomous**: Agent runs independently, reports back when done
- **Parallel Processing**: Run multiple evaluations simultaneously
- **Background Execution**: Let it run while you do other things

**To use as agent**:
```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Create evaluation for Emma",
  prompt: "Create formal APEXX evaluation for Emma Rodriguez with observations: [details]"
})
```

## Summary

✅ **Created**: Marie dance evaluator as a Claude Code Skill
✅ **Registered**: In skill-rules.json for automatic activation
✅ **Usage**: "Use marie-dance-evaluator to create..."
✅ **Workflow**: Read examples → Generate → Write to workspace
✅ **Output**: French APEXX evaluations in `workspaces/dance/studio/evaluations/`

**Ready to use!** Just restart Claude Code and try:
```
Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez
```

---

**Date**: 2025-11-17
**Type**: Claude Code Skill
**Status**: ✅ Active and ready to use
