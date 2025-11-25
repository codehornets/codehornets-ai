# Marie Dance Evaluator - Input/Output Separation

## Critical Fix: Preventing Knowledge Base Pollution

### The Problem
The agent was configured to both READ examples from AND WRITE new evaluations to `data/knowledgehub/`. This would pollute the reference examples with generated content.

### The Solution
**Strict separation:**
- ✅ **INPUT (Read-only):** `data/knowledgehub/domain/dance/marie/`
- ✅ **OUTPUT (Write-only):** `workspaces/dance/studio/evaluations/`

---

## Directory Structure

### INPUT - Knowledge Base (READ ONLY - Never Write Here!)

```
data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                          ← Reference examples
│   └── students-reviews/
│       ├── leanne.md                    ← Learn tone/style
│       ├── bile.md                      ← Learn phrasing
│       ├── kailua.md
│       └── [33 more students...]
└── pdfs/students-notes/
    ├── Leanne_Evaluation_Final.pdf      ← Learn format
    ├── Marianne_Evaluation_Final.pdf
    └── [7 more PDFs...]
```

**Purpose:** Reference examples for the agent to learn:
- French phrasing patterns
- Constructive feedback tone
- Evaluation structure
- Hip-hop terminology

**Agent behavior:** ALWAYS read 2-3 files from here at the start of every task

---

### OUTPUT - Workspace (WRITE HERE - Generated Content)

```
workspaces/dance/studio/
├── evaluations/
│   ├── formal/                          ← Formal APEXX evaluations
│   │   ├── Emma_Evaluation_2025-11-17.md
│   │   └── Sophia_Evaluation_2025-11-17.md
│   ├── quick-notes/                     ← Quick progress notes
│   │   ├── emma.md
│   │   └── sophia.md
│   ├── batch/                           ← Batch evaluations
│   │   └── 2025-11-17_batch_evaluations.md
│   └── archive/                         ← Old evaluations
│       └── 2025/
│           └── [archived-files].md
└── students/                            ← Student-specific folders
    ├── emma-rodriguez/
    │   └── evaluations/
    │       ├── 2025-11-17_evaluation.md
    │       └── 2025-11-10_evaluation.md
    └── sophia-chen/
        └── evaluations/
            └── 2025-11-17_evaluation.md
```

**Purpose:** Store all generated evaluations

**Agent behavior:** ALWAYS write new files here, NEVER to knowledgehub

---

## File Paths Summary

### Input Paths (Where Agent Reads)

| Type | Path | Purpose |
|------|------|---------|
| Quick notes examples | `data/knowledgehub/domain/dance/marie/markdown/students-reviews/*.md` | Learn informal style |
| Formal eval examples | `data/knowledgehub/domain/dance/marie/pdfs/students-notes/*.pdf` | Learn APEXX format |
| Master notes | `data/knowledgehub/domain/dance/marie/markdown/note.md` | Reference all students |

### Output Paths (Where Agent Writes)

| Type | Path | Example |
|------|------|---------|
| Formal evaluations | `workspaces/dance/studio/evaluations/formal/` | `Emma_Evaluation_2025-11-17.md` |
| Quick notes | `workspaces/dance/studio/evaluations/quick-notes/` | `emma.md` |
| Batch evaluations | `workspaces/dance/studio/evaluations/batch/` | `2025-11-17_batch_evaluations.md` |
| Student-specific | `workspaces/dance/studio/students/emma-rodriguez/evaluations/` | `2025-11-17_evaluation.md` |

---

## Agent Workflow

### Step 1: Read Examples (from knowledgehub)
```bash
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Marianne_Evaluation_Final.pdf
```

### Step 2: Determine Output Path (to workspace)
```javascript
if (format === "formal") {
  outputPath = "workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md"
}
```

### Step 3: Write New File (to workspace - NOT knowledgehub!)
```bash
Write: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
```

---

## What Changed

### Before (WRONG - Would Pollute Knowledge Base)
```
❌ Read from:  data/knowledgehub/domain/dance/marie/
❌ Write to:   data/knowledgehub/domain/dance/marie/  ← BAD!
```

### After (CORRECT - Separated Input/Output)
```
✅ Read from:  data/knowledgehub/domain/dance/marie/  (READ ONLY)
✅ Write to:   workspaces/dance/studio/evaluations/   (WRITE ONLY)
```

---

## Protection Mechanisms

### 1. Explicit Instructions in Agent Spec
```markdown
**IMPORTANT:** Never write to `data/knowledgehub/` - that is read-only for reference examples!
```

### 2. Clear Path Separation in Code Logic
```javascript
// INPUT - Always read from here
const INPUT_DIR = "data/knowledgehub/domain/dance/marie/"

// OUTPUT - Always write here
const OUTPUT_DIR = "workspaces/dance/studio/evaluations/"
```

### 3. Comments in Execution Steps
```bash
# Step 1: Read examples (from knowledgehub - READ ONLY)
Read: data/knowledgehub/...

# Step 6: Write file (to workspace - NOT knowledgehub!)
Write: workspaces/dance/studio/...
```

---

## Why This Matters

### Risk of Knowledge Base Pollution

If the agent writes to `data/knowledgehub/`:

1. **Generated files mix with reference examples**
   - Agent might learn from its own generated content
   - Quality degrades over time
   - Hard to distinguish reference vs generated

2. **Loss of original examples**
   - Reference examples get overwritten
   - Can't recover original tone/style
   - Evaluation quality drifts

3. **Inconsistent results**
   - Each generation uses previous generations as examples
   - Feedback loop of degrading quality
   - "Telephone game" effect

### Benefits of Separation

With strict input/output separation:

1. **✅ Clean reference examples**
   - Knowledge base stays pristine
   - Consistent quality over time
   - Always learns from original high-quality examples

2. **✅ Organized workspace**
   - All generated content in one place
   - Easy to find student evaluations
   - Clear separation of concerns

3. **✅ No pollution risk**
   - Agent can't accidentally overwrite examples
   - Generated content never pollutes reference data
   - Maintains evaluation quality

---

## Directory Ownership

| Directory | Owner | Permission | Purpose |
|-----------|-------|------------|---------|
| `data/knowledgehub/domain/dance/marie/` | Reference Data | READ ONLY | Examples for agent to learn from |
| `workspaces/dance/studio/evaluations/` | Marie's Workspace | READ/WRITE | Generated evaluations |
| `workspaces/dance/studio/students/` | Student Files | READ/WRITE | Student-specific evaluations |

---

## User Instructions

### Creating a New Evaluation

When you request:
```
"Create a formal evaluation for Emma"
```

The agent will:
1. ✅ Read examples from `data/knowledgehub/` (learn style)
2. ✅ Generate evaluation in French
3. ✅ Write to `workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md`
4. ❌ NEVER write to `data/knowledgehub/`

### Finding Evaluations

**Generated evaluations:**
```
workspaces/dance/studio/evaluations/formal/
workspaces/dance/studio/evaluations/quick-notes/
workspaces/dance/studio/students/[name]/evaluations/
```

**Reference examples:**
```
data/knowledgehub/domain/dance/marie/markdown/students-reviews/
data/knowledgehub/domain/dance/marie/pdfs/students-notes/
```

---

## Verification

### ✅ Agent Configuration Verified

1. **Input paths correct:**
   - Agent reads from `data/knowledgehub/domain/dance/marie/`
   - All examples accessible

2. **Output paths correct:**
   - Agent writes to `workspaces/dance/studio/evaluations/`
   - Directories created

3. **Documentation updated:**
   - All files reflect new structure
   - Clear warnings about not writing to knowledgehub

### ✅ Directories Created

```bash
workspaces/dance/studio/evaluations/
├── formal/
├── quick-notes/
├── batch/
└── archive/
```

---

## Testing

### Test 1: Verify Read Paths
```bash
# Agent should be able to read these:
ls data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md  ✅
ls data/knowledgehub/domain/dance/marie/pdfs/students-notes/Leanne_Evaluation_Final.pdf  ✅
```

### Test 2: Verify Write Paths
```bash
# Agent should write here:
ls workspaces/dance/studio/evaluations/formal/  ✅
ls workspaces/dance/studio/evaluations/quick-notes/  ✅
```

### Test 3: Create Sample Evaluation
```
"Create a formal evaluation for TestStudent"
```

Expected result:
```
✅ File created: workspaces/dance/studio/evaluations/formal/TestStudent_Evaluation_2025-11-17.md
❌ NO files created in: data/knowledgehub/
```

---

## Files Updated

| File | Status | Change |
|------|--------|--------|
| `.claude/agents/specialized/dance/marie-dance-evaluator.md` | ✅ Updated | Output paths → workspace |
| Output directories | ✅ Created | workspaces/dance/studio/evaluations/* |
| Knowledge base | ✅ Protected | Marked as READ ONLY |

---

## Key Takeaways

### DO ✅
- Read examples from `data/knowledgehub/domain/dance/marie/`
- Write evaluations to `workspaces/dance/studio/evaluations/`
- Keep knowledge base pristine

### DON'T ❌
- Write to `data/knowledgehub/` (NEVER!)
- Mix generated content with reference examples
- Overwrite original example files

---

**Status:** ✅ Input/Output Separation Complete
**Knowledge Base:** ✅ Protected from pollution
**Workspace:** ✅ Ready for generated evaluations
**Date:** November 17, 2025
