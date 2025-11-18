# How the Marie Dance Evaluator Knows Where to Read and Save Files

## Your Question

> "How do the agents know where to take the reviews and create a note and where those generated files are saved?"

## Simple Answer

The agent knows through **3 mechanisms**:

### 1. Hardcoded Paths in Agent Specification

The agent file (`.claude/agents/specialized/dance/marie-dance-evaluator.md`) contains explicit paths:

```markdown
## File Paths and Directories

### Input: Reference Examples (Read from here)
data/knowledgehub/domain/dance/marie/markdown/students-reviews/
data/knowledgehub/domain/dance/marie/pdfs/students-notes/

### Output: Generated Evaluations (Save here)

**For Formal Evaluations:**
data/knowledgehub/domain/dance/marie/pdfs/students-notes/
└── [StudentName]_Evaluation_[Date].md

**For Quick Notes:**
data/knowledgehub/domain/dance/marie/markdown/students-reviews/
└── [studentname].md
```

### 2. Mandatory Execution Instructions

The agent specification includes **step-by-step instructions** that it MUST follow:

```markdown
## Execution Instructions

### MANDATORY: Start Every Task With These Steps

**STEP 1: Read Reference Examples (ALWAYS)**
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Leanne_Evaluation_Final.pdf

**STEP 2: Determine Output Path**
if (format === "formal") {
  outputPath = `data/knowledgehub/domain/dance/marie/pdfs/students-notes/${studentName}_Evaluation_${date}.md`
}

**STEP 6: Write to File**
Write: ${outputPath}
```

### 3. Automatic Path Determination Logic

The agent detects evaluation type from user request and automatically selects the correct path:

```javascript
// User says "formal evaluation" → writes to pdfs/students-notes/
// User says "quick note" → writes to markdown/students-reviews/
// User says "batch" → writes to batch-evaluations/
```

## Detailed Flow

### When You Ask for an Evaluation

**Your request:**
```
"Use marie-dance-evaluator to create a formal evaluation for Emma"
```

**What the agent does:**

#### Step 1: Read Its Own Specification
The agent first reads `.claude/agents/specialized/dance/marie-dance-evaluator.md` which tells it:
- Where to find example evaluations
- Where to save new evaluations
- What format to use
- What language to write in

#### Step 2: Read Example Files (Learn Style)
```bash
# Agent automatically executes:
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Marianne_Evaluation_Final.pdf

# This teaches the agent:
# - French phrasing patterns
# - Constructive tone
# - Evaluation structure
# - Technical terminology
```

#### Step 3: Determine Where to Save
```javascript
// User said "formal evaluation"
// Agent thinks:
format = "formal"
studentName = "Emma"
date = getCurrentDate() // "2025-11-17"

// From its specification, it knows:
outputDir = "data/knowledgehub/domain/dance/marie/pdfs/students-notes/"
filename = `Emma_Evaluation_2025-11-17.md`

fullPath = "data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md"
```

#### Step 4: Create the File
```bash
# Agent executes:
mkdir -p data/knowledgehub/domain/dance/marie/pdfs/students-notes/

Write: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md
Content: [generated evaluation in French]
```

#### Step 5: Confirm to You
```
✅ Formal evaluation created for Emma
Location: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md
```

## Path Mappings

| User Says | Agent Saves To |
|-----------|---------------|
| "formal evaluation for Emma" | `pdfs/students-notes/Emma_Evaluation_2025-11-17.md` |
| "quick note for Emma" | `markdown/students-reviews/emma.md` |
| "batch evaluations for 5 students" | `batch-evaluations/2025-11-17_batch_evaluations.md` |

## Directory Structure

```
data/knowledgehub/domain/dance/marie/
│
├── markdown/
│   ├── note.md                          # Agent READS this for examples
│   └── students-reviews/
│       ├── leanne.md                    # Agent READS for style
│       ├── bile.md                      # Agent READS for style
│       └── emma.md                      # Agent WRITES quick notes HERE
│
├── pdfs/students-notes/
│   ├── Leanne_Evaluation_Final.pdf      # Agent READS for examples
│   ├── Marianne_Evaluation_Final.pdf    # Agent READS for examples
│   └── Emma_Evaluation_2025-11-17.md    # Agent WRITES formal evals HERE
│
├── batch-evaluations/
│   └── 2025-11-17_batch_evaluations.md  # Agent WRITES batch files HERE
│
└── archive/
    └── 2025/                            # Agent MOVES old files HERE
        └── [old evaluations]
```

## Key Insight

**The agent doesn't "magically know" - it's explicitly programmed with the paths in its specification file.**

Think of it like GPS navigation:
1. **Specification file** = The map with all addresses
2. **Execution instructions** = The route to follow
3. **User request** = The destination you want

The agent follows the route (execution instructions), using the map (specification), to reach your destination (create evaluation at correct location).

## Can You Change the Paths?

**Yes!** Three ways:

### Option 1: Specify Custom Path in Request
```
"Create evaluation for Emma and save to: evaluations/custom/emma.md"
```

### Option 2: Edit the Agent Specification
Open `.claude/agents/specialized/dance/marie-dance-evaluator.md` and change the paths in the "File Paths and Directories" section.

### Option 3: Use Environment Variables
```bash
export MARIE_EVAL_OUTPUT_DIR="/custom/path/evaluations"
```

Then update agent spec to use `$MARIE_EVAL_OUTPUT_DIR`.

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│  "Create formal evaluation for Emma"                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AGENT READS ITS SPECIFICATION                   │
│  .claude/agents/specialized/dance/marie-dance-evaluator.md   │
│                                                              │
│  - Where to find examples                                    │
│  - Where to save files                                       │
│  - What format to use                                        │
│  - What language to write                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           AGENT READS EXAMPLE FILES                          │
│                                                              │
│  READ: markdown/students-reviews/leanne.md                   │
│  READ: pdfs/students-notes/Marianne_Evaluation_Final.pdf    │
│                                                              │
│  → Learns: tone, style, structure, terminology               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         AGENT DETERMINES OUTPUT PATH                         │
│                                                              │
│  Request type: "formal evaluation"                           │
│  Student: "Emma"                                             │
│  Date: "2025-11-17"                                          │
│                                                              │
│  → Output: pdfs/students-notes/Emma_Evaluation_2025-11-17.md│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            AGENT GENERATES CONTENT                           │
│                                                              │
│  Using learned style + user observations                     │
│  → Creates French-language evaluation with 8 categories      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AGENT WRITES FILE                               │
│                                                              │
│  WRITE: pdfs/students-notes/Emma_Evaluation_2025-11-17.md   │
│  CONTENT: [generated evaluation]                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            AGENT CONFIRMS TO USER                            │
│                                                              │
│  ✅ File created at:                                         │
│  pdfs/students-notes/Emma_Evaluation_2025-11-17.md           │
└─────────────────────────────────────────────────────────────┘
```

## Complete File Locations

### Input (Where Agent Reads Examples)

✅ `data/knowledgehub/domain/dance/marie/markdown/note.md`
✅ `data/knowledgehub/domain/dance/marie/markdown/students-reviews/*.md`
✅ `data/knowledgehub/domain/dance/marie/pdfs/students-notes/*.pdf`

### Output (Where Agent Saves New Files)

✅ **Formal:** `data/knowledgehub/domain/dance/marie/pdfs/students-notes/[Name]_Evaluation_[Date].md`
✅ **Quick:** `data/knowledgehub/domain/dance/marie/markdown/students-reviews/[name].md`
✅ **Batch:** `data/knowledgehub/domain/dance/marie/batch-evaluations/[Date]_batch.md`

## FAQ

### Q: Can I see these paths in the agent file?

**A:** Yes! Open `.claude/agents/specialized/dance/marie-dance-evaluator.md` and search for "File Paths and Directories" section.

### Q: What if I move the knowledgehub folder?

**A:** Update the paths in the agent specification file to reflect the new location.

### Q: Does the agent create directories automatically?

**A:** Yes! The agent runs `mkdir -p [path]` to ensure directories exist before writing.

### Q: Can I use different paths for different students?

**A:** Yes! Specify custom path in your request:
```
"Create evaluation for Emma and save to: custom-folder/emma-eval.md"
```

## Documentation Links

- **Full Agent Spec:** `.claude/agents/specialized/dance/marie-dance-evaluator.md`
- **File Handling Guide:** `.claude/agents/specialized/dance/FILE_HANDLING_GUIDE.md`
- **Usage Examples:** `.claude/agents/specialized/dance/USAGE_EXAMPLES.md`
- **Quick Reference:** `.claude/agents/specialized/dance/QUICK_REFERENCE.md`

---

## TL;DR

**The agent knows where to read and save files because:**

1. ✅ Paths are **hardcoded** in its specification file
2. ✅ **Step-by-step instructions** tell it what to do
3. ✅ **Automatic logic** determines path based on evaluation type
4. ✅ You can **override** by specifying custom paths

**Reading from:** `data/knowledgehub/domain/dance/marie/` (examples)
**Writing to:** Same directory structure, different files based on format

**It's all explicitly programmed - nothing is magic!**
