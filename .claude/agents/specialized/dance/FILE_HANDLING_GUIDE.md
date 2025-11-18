# Marie Dance Evaluator - File Handling Guide

## Overview

This guide explains exactly how the marie-dance-evaluator agent knows **where to read examples** and **where to save generated evaluations**.

## Directory Structure

```
data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                           # Master notes (READ for examples)
│   └── students-reviews/                 # Quick notes
│       ├── leanne.md                     # READ for examples
│       ├── bile.md                       # READ for examples
│       └── [new-student].md              # WRITE new quick notes here
├── pdfs/students-notes/                  # Formal evaluations
│   ├── Leanne_Evaluation_Final.pdf       # READ for examples
│   ├── Marianne_Evaluation_Final.pdf     # READ for examples
│   └── [NewStudent]_Evaluation_2025-11-17.md  # WRITE new formal here
├── batch-evaluations/                    # Batch processing
│   └── 2025-11-17_batch_evaluations.md   # WRITE batch files here
└── archive/                              # Old evaluations
    └── 2024/
        └── [old-files].md
```

## How the Agent Knows Where to Read Examples

### Step 1: Agent Reads CLAUDE.md Instructions

When the agent is invoked, it automatically has access to the agent specification file:
`.claude/agents/specialized/dance/marie-dance-evaluator.md`

This file contains explicit paths in the "File Paths and Directories" section.

### Step 2: Mandatory Example Reading

The agent specification includes **MANDATORY execution instructions**:

```markdown
## Execution Instructions

### MANDATORY: Start Every Task With These Steps

**STEP 1: Read Reference Examples (ALWAYS)**

Before generating ANY evaluation, you MUST read 2-3 reference examples:

Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/bile.md
Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Leanne_Evaluation_Final.pdf
```

### Step 3: Learning Tone and Style

By reading these examples, the agent learns:
- French phrasing patterns
- Constructive tone
- Technical terminology usage
- Feedback structure
- Balance of positive/growth areas

## How the Agent Knows Where to Save Files

### Automatic Path Determination

The agent uses this logic (from specification):

```javascript
// Formal evaluation
if (user requests "formal evaluation" or "APEXX evaluation") {
  format = "formal"
  outputDir = "data/knowledgehub/domain/dance/marie/pdfs/students-notes/"
  filename = `${StudentName}_Evaluation_${getCurrentDate()}.md`
  fullPath = outputDir + filename
}

// Quick note
if (user requests "quick note" or "progress note") {
  format = "quick-note"
  outputDir = "data/knowledgehub/domain/dance/marie/markdown/students-reviews/"
  filename = `${studentName.toLowerCase()}.md`
  fullPath = outputDir + filename
}

// Batch
if (multiple students or "batch") {
  format = "batch"
  outputDir = "data/knowledgehub/domain/dance/marie/batch-evaluations/"
  filename = `${getCurrentDate()}_batch_evaluations.md`
  fullPath = outputDir + filename
}
```

### File Naming Conventions

**Formal Evaluations:**
- Pattern: `[StudentName]_Evaluation_[YYYY-MM-DD].md`
- Example: `Emma_Evaluation_2025-11-17.md`
- Location: `data/knowledgehub/domain/dance/marie/pdfs/students-notes/`

**Quick Notes:**
- Pattern: `[studentname].md` (lowercase)
- Example: `emma.md`
- Location: `data/knowledgehub/domain/dance/marie/markdown/students-reviews/`

**Batch Files:**
- Pattern: `[YYYY-MM-DD]_batch_evaluations.md`
- Example: `2025-11-17_batch_evaluations.md`
- Location: `data/knowledgehub/domain/dance/marie/batch-evaluations/`

## Complete Execution Workflow

### Example: Creating a Formal Evaluation

**User request:**
```
"Use marie-dance-evaluator to create a formal evaluation for Emma.
Observations:
- Good bounce depth
- Upper body tension
- Excellent coordination"
```

**Agent execution steps:**

#### Step 1: Read Examples (Learn Style)
```bash
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
# Agent learns: tone, phrasing, structure

Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Marianne_Evaluation_Final.pdf
# Agent learns: formal evaluation format, category structure
```

#### Step 2: Determine Output Path
```javascript
// User said "formal evaluation"
format = "formal"
studentName = "Emma"
date = "2025-11-17"

outputDir = "data/knowledgehub/domain/dance/marie/pdfs/students-notes/"
filename = `Emma_Evaluation_2025-11-17.md`
fullPath = "data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md"
```

#### Step 3: Check for Existing File
```bash
Bash: ls data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma*.md

# If file exists:
#   - Inform user
#   - Ask: update existing or create new dated version?
# If not exists:
#   - Continue to create new file
```

#### Step 4: Ensure Directory Exists
```bash
Bash: mkdir -p data/knowledgehub/domain/dance/marie/pdfs/students-notes/
# Creates directory if it doesn't exist
```

#### Step 5: Generate Content
```markdown
# Using learned style from reference examples, generate:

# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Emma
**Date:** ____________________
**Évalué par:** ____________________

## Expression artistique / 10 :
[Generated feedback in French, following learned style...]

[... all 8 categories ...]

**TOTAL:** ______ / 100
```

#### Step 6: Write to File
```bash
Write: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md

Content: [generated evaluation from Step 5]
```

#### Step 7: Confirm to User
```
✅ Formal evaluation created for Emma

File location: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-11-17.md
Format: Formal APEXX evaluation (100 points)
Date: 2025-11-17
Language: French

The file is ready for review or PDF conversion.
```

## User Control Over Paths

### Default Behavior
The agent uses the paths specified in its configuration (above).

### Custom Output Path
Users can override by specifying:

```
"Create formal evaluation for Emma and save to: evaluations/custom-folder/emma.md"
```

The agent will respect the custom path if explicitly provided.

### Reading from Custom Locations
Users can provide custom input:

```
"Read student observations from class-notes/week-12.md and create evaluations"
```

The agent will read from the specified location.

## File Management Best Practices

### 1. Existing Files Check
Before creating a file, the agent always checks:
```bash
Bash: ls data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma*.md
```

If found, agent asks user:
- Update existing file?
- Create new dated version?
- Cancel operation?

### 2. Directory Creation
Agent automatically creates missing directories:
```bash
Bash: mkdir -p data/knowledgehub/domain/dance/marie/batch-evaluations/
```

### 3. Archive Old Files
For updates, agent can move old version to archive:
```bash
Bash: mv data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma_Evaluation_2025-10-15.md \
         data/knowledgehub/domain/dance/marie/archive/2025/
```

## Troubleshooting

### Q: How does the agent know to use French?

**A:** The agent specification includes:
```markdown
### Language and Tone
- **Always write in French** (unless explicitly requested otherwise)
```

This instruction is part of the agent's core behavior.

### Q: Can I change where files are saved?

**A:** Yes, two ways:

1. **Specify in request:**
   ```
   "Create evaluation and save to: custom/path/file.md"
   ```

2. **Edit agent specification:**
   Modify the paths in `.claude/agents/specialized/dance/marie-dance-evaluator.md`

### Q: What if the directory doesn't exist?

**A:** The agent creates it automatically:
```bash
Bash: mkdir -p [path]
```

### Q: How do I see what files already exist?

**A:** Ask the agent:
```
"List all existing evaluations for Emma"
```

Agent will run:
```bash
Bash: ls data/knowledgehub/domain/dance/marie/pdfs/students-notes/Emma*.md
```

### Q: Can the agent update an existing file?

**A:** Yes! When you request an evaluation for a student who already has one:

1. Agent detects existing file
2. Asks: "Emma_Evaluation_2025-10-15.md already exists. Would you like to:
   - Update this file
   - Create a new dated version
   - Cancel"
3. Proceeds based on your choice

### Q: Where are batch evaluations saved?

**A:** In the batch-evaluations directory:
```
data/knowledgehub/domain/dance/marie/batch-evaluations/2025-11-17_batch_evaluations.md
```

Each batch file is dated so you can track when evaluations were created.

## Path Reference Quick Lookup

| Evaluation Type | Directory | Filename Pattern | Example |
|----------------|-----------|------------------|---------|
| Formal | `pdfs/students-notes/` | `[Name]_Evaluation_[Date].md` | `Emma_Evaluation_2025-11-17.md` |
| Quick Note | `markdown/students-reviews/` | `[name].md` | `emma.md` |
| Batch | `batch-evaluations/` | `[Date]_batch_evaluations.md` | `2025-11-17_batch_evaluations.md` |
| Archive | `archive/[YEAR]/` | `[original-filename]` | `archive/2025/Emma_Evaluation_2025-10-15.md` |

## Integration with Other Systems

### Reading Input from Files

User can provide input via file:
```
"Read student observations from class-notes/november-evaluations.md and create formal evaluations"
```

Agent will:
1. Read the specified file
2. Parse student observations
3. Generate evaluations
4. Save to standard locations

### Exporting to PDF

After creating markdown evaluations:
```
"Convert Emma's evaluation to PDF"
```

Agent can use tools to convert markdown → PDF.

### Batch Processing from Roster

```
"Read the class roster from roster.txt and create evaluations for all students"
```

Agent will:
1. Read roster.txt
2. For each student, read observations (if available)
3. Generate evaluation
4. Save to appropriate directory

## Summary

### Where Agent READS From (Input)
✅ `data/knowledgehub/domain/dance/marie/markdown/students-reviews/` (examples)
✅ `data/knowledgehub/domain/dance/marie/pdfs/students-notes/` (examples)
✅ Any custom path user specifies for observations

### Where Agent WRITES To (Output)
✅ **Formal:** `data/knowledgehub/domain/dance/marie/pdfs/students-notes/`
✅ **Quick Notes:** `data/knowledgehub/domain/dance/marie/markdown/students-reviews/`
✅ **Batch:** `data/knowledgehub/domain/dance/marie/batch-evaluations/`
✅ **Archive:** `data/knowledgehub/domain/dance/marie/archive/`

### How Agent Knows
✅ **Hardcoded in specification:** Default paths in agent .md file
✅ **User override:** Can specify custom paths in request
✅ **Automatic detection:** Based on evaluation type (formal/quick/batch)

---

**Questions?** See the main agent specification: `.claude/agents/specialized/dance/marie-dance-evaluator.md`
