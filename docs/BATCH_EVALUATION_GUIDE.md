# Batch Student Evaluation Guide

## Overview

Batch evaluation allows you to evaluate multiple students simultaneously in parallel, saving time and ensuring consistent evaluation dates across all students.

## Quick Start

### Option 1: Use Demo Workflow (Emma & Sophia)

The simplest way to batch evaluate students:

```bash
make batch-evaluate-demo
```

This evaluates Emma Rodriguez (75/100) and Sophia Chen (86/100) using the pre-configured workflow.

### Option 2: Create Custom Batch Workflow

1. **Create your workflow JSON file:**

```bash
cp orchestration/workflows/marie-review-and-note-students.json orchestration/workflows/my-class.json
```

2. **Edit the file** to include your students
3. **Execute:**

```bash
make batch-evaluate STUDENTS_FILE=orchestration/workflows/my-class.json
```

## Batch Workflow Format

### Basic Structure

```json
{
  "name": "Marie Student Evaluation Workflow",
  "description": "Batch evaluation for Class 2A",
  "tasks": [
    {
      "id": "evaluate-student1",
      "agent": "marie",
      "action": "marie_create_student_evaluation",
      "params": {
        "student_name": "emma-rodriguez",
        "date": "2025-11-16",
        "evaluator": "Marie",
        "scores": { ... }
      }
    },
    {
      "id": "evaluate-student2",
      "agent": "marie",
      "action": "marie_create_student_evaluation",
      "params": {
        "student_name": "sophia-chen",
        "date": "2025-11-16",
        "evaluator": "Marie",
        "scores": { ... }
      }
    }
  ]
}
```

### Score Categories (APEXX Format)

Each student needs these 9 categories (100 points total):

| Category | Points | Description |
|----------|--------|-------------|
| **expression_artistique** | /10 | Stage presence, artistic interpretation |
| **coordination** | /10 | Body connection, movement fluidity |
| **effort** | /10 | Class engagement, energy level |
| **endurance** | /10 | Stamina throughout class |
| **fondation** | **/30** | **Grounding, bounce, rock, groove** |
| **musicalite** | /10 | Musical sensitivity, rhythm |
| **choregraphie** | /10 | Learning speed, performance |
| **application_corrections** | /5 | Receptiveness to feedback |
| **processus_apprentissage** | /5 | Learning capacity, curiosity |

### Score Object Format

```json
"scores": {
  "expression_artistique": {
    "score": 8,
    "feedback": "Tu montres une belle énergie. Continue à travailler ta présence scénique..."
  },
  "coordination": {
    "score": 7,
    "feedback": "Ta coordination s'améliore. Continue à connecter le haut et le bas..."
  },
  "fondation": {
    "score": 24,
    "feedback": "Tes fondations progressent. Continue à travailler ton grounding..."
  }
  // ... all 9 categories
}
```

## Usage Examples

### Example 1: Evaluate Full Class (10 students)

Create `my-full-class.json`:

```json
{
  "name": "Full Class Evaluation - November 2025",
  "description": "All students from Class 2A",
  "tasks": [
    { "id": "evaluate-emma", "agent": "marie", "action": "marie_create_student_evaluation", "params": {...} },
    { "id": "evaluate-sophia", "agent": "marie", "action": "marie_create_student_evaluation", "params": {...} },
    { "id": "evaluate-kailua", "agent": "marie", "action": "marie_create_student_evaluation", "params": {...} },
    { "id": "evaluate-marie-louise", "agent": "marie", "action": "marie_create_student_evaluation", "params": {...} },
    // ... up to 10 students
  ]
}
```

Execute:

```bash
make batch-evaluate STUDENTS_FILE=orchestration/workflows/my-full-class.json
```

### Example 2: Mid-Semester Progress Check

All students with same date:

```bash
# All evaluations dated 2025-12-15
make batch-evaluate STUDENTS_FILE=orchestration/workflows/december-progress.json DATE=2025-12-15
```

### Example 3: Different Evaluator

```bash
make batch-evaluate STUDENTS_FILE=my-students.json EVALUATOR="Marie & Pierre"
```

## Available Commands

```bash
# Batch evaluate with default workflow (demo)
make batch-evaluate-demo

# Batch evaluate with custom workflow
make batch-evaluate STUDENTS_FILE=path/to/file.json

# With custom date
make batch-evaluate STUDENTS_FILE=path/to/file.json DATE=2025-11-20

# With custom evaluator
make batch-evaluate STUDENTS_FILE=path/to/file.json EVALUATOR="Marie"

# Combine options
make batch-evaluate STUDENTS_FILE=my-class.json DATE=2025-12-01 EVALUATOR="Marie"
```

## Output

### Generated Files

Each student gets their own evaluation file:

```
workspaces/dance/studio/students/
  ├── emma-rodriguez/
  │   └── evaluations/
  │       └── evaluation_2025-11-16_20-21.md
  ├── sophia-chen/
  │   └── evaluations/
  │       └── evaluation_2025-11-16_20-22.md
  └── kailua-smith/
      └── evaluations/
          └── evaluation_2025-11-16_20-23.md
```

### Terminal Output Example

```bash
$ make batch-evaluate-demo

════════════════════════════════════════════════════════════
  🩰 Batch Student Evaluation
════════════════════════════════════════════════════════════

⏳ Waiting for orchestrator...
✅ Orchestrator ready!

📋 Workflow: workflows/marie-review-and-note-students.json

👥 Evaluating 2 students in parallel...

🚀 Starting batch evaluation...

✅ Batch evaluation completed!

════════════════════════════════════════════════════════════
  📊 Evaluation Summary
════════════════════════════════════════════════════════════

✅ Created evaluation for Emma Rodriguez 📝
   📝 workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-16_20-21.md

✅ Created evaluation for Sophia Chen 📝
   📝 workspaces/dance/studio/students/sophia-chen/evaluations/evaluation_2025-11-16_20-22.md

Total: 2 evaluations processed

════════════════════════════════════════════════════════════

💡 Next steps:
  1. Review the generated evaluation files
  2. Edit scores and feedback as needed
  3. Generate PDFs (coming soon)
  4. Send evaluations to parents (coming soon)
```

## Tips & Best Practices

### 1. **Student Name Format**
Always use lowercase-with-dashes:
- ✅ `emma-rodriguez`
- ✅ `marie-louise-dupont`
- ❌ `Emma Rodriguez`
- ❌ `Emma_Rodriguez`

### 2. **Feedback Language**
Use professional French following Marie's tone:
- Start positive: "Tu montres..."
- Then constructive: "Continue à..."
- Be specific and encouraging

### 3. **Fondation is Key**
This category is worth 30 points (vs 10 for others):
- Focus on bounce quality
- Rock technique
- Grounding and groove
- Provide detailed feedback

### 4. **Consistent Dates**
For batch evaluations, use the same date for all students unless there's a specific reason not to:

```json
"date": "2025-11-16"  // Same for all students in this batch
```

### 5. **Parallel Execution**
The orchestrator executes all evaluations simultaneously:
- Faster than evaluating one by one
- All students get the same timestamp range
- More efficient for large classes

### 6. **Score Distribution**
Typical scoring guide:
- 90-100: Exceptional (rare)
- 80-89: Very good (top students)
- 70-79: Good (solid performance)
- 60-69: Satisfactory (needs work)
- Below 60: Needs significant development

## Template Workflow

Here's a complete template for 3 students:

```json
{
  "name": "Marie Student Evaluation - Class Template",
  "description": "Template for batch evaluations",
  "tasks": [
    {
      "id": "evaluate-student1",
      "agent": "marie",
      "action": "marie_create_student_evaluation",
      "params": {
        "student_name": "student-name-1",
        "date": "2025-11-16",
        "evaluator": "Marie",
        "scores": {
          "expression_artistique": { "score": 7, "feedback": "..." },
          "coordination": { "score": 7, "feedback": "..." },
          "effort": { "score": 8, "feedback": "..." },
          "endurance": { "score": 7, "feedback": "..." },
          "fondation": { "score": 20, "feedback": "..." },
          "musicalite": { "score": 7, "feedback": "..." },
          "choregraphie": { "score": 7, "feedback": "..." },
          "application_corrections": { "score": 4, "feedback": "..." },
          "processus_apprentissage": { "score": 4, "feedback": "..." }
        }
      }
    },
    {
      "id": "evaluate-student2",
      "agent": "marie",
      "action": "marie_create_student_evaluation",
      "params": {
        "student_name": "student-name-2",
        "date": "2025-11-16",
        "evaluator": "Marie",
        "scores": {
          "expression_artistique": { "score": 7, "feedback": "..." },
          "coordination": { "score": 7, "feedback": "..." },
          "effort": { "score": 8, "feedback": "..." },
          "endurance": { "score": 7, "feedback": "..." },
          "fondation": { "score": 20, "feedback": "..." },
          "musicalite": { "score": 7, "feedback": "..." },
          "choregraphie": { "score": 7, "feedback": "..." },
          "application_corrections": { "score": 4, "feedback": "..." },
          "processus_apprentissage": { "score": 4, "feedback": "..." }
        }
      }
    },
    {
      "id": "evaluate-student3",
      "agent": "marie",
      "action": "marie_create_student_evaluation",
      "params": {
        "student_name": "student-name-3",
        "date": "2025-11-16",
        "evaluator": "Marie",
        "scores": {
          "expression_artistique": { "score": 7, "feedback": "..." },
          "coordination": { "score": 7, "feedback": "..." },
          "effort": { "score": 8, "feedback": "..." },
          "endurance": { "score": 7, "feedback": "..." },
          "fondation": { "score": 20, "feedback": "..." },
          "musicalite": { "score": 7, "feedback": "..." },
          "choregraphie": { "score": 7, "feedback": "..." },
          "application_corrections": { "score": 4, "feedback": "..." },
          "processus_apprentissage": { "score": 4, "feedback": "..." }
        }
      }
    }
  ]
}
```

## Troubleshooting

### "Orchestrator not responding"

```bash
# Start orchestrator first
make orchestration-start

# Wait a few seconds, then try again
make batch-evaluate-demo
```

### "Workflow file not found"

```bash
# Check file path
ls -la orchestration/workflows/

# Use absolute or relative path from orchestration directory
make batch-evaluate STUDENTS_FILE=workflows/my-file.json
```

### "Some evaluations failed"

Check the error output for specific student issues:
- Invalid student name format
- Missing required score categories
- Invalid score values (must be within limits)

## Performance

**Execution Time:**
- Sequential (one by one): ~10 seconds per student
- Parallel (batch): ~10 seconds total for any number of students (up to system limits)

**Recommended Batch Size:**
- Optimal: 5-15 students per batch
- Maximum tested: 30 students
- For larger classes: Split into multiple batches

## Coming Soon

- 📄 **PDF Generation**: Auto-generate professional PDFs from markdown
- 📧 **Email Integration**: Send evaluations directly to parents
- 📊 **Analytics Dashboard**: Class-wide statistics and trends
- 🔄 **Import from CSV**: Bulk import student data
- 📝 **Evaluation Templates**: Pre-filled templates by level

## Related Documentation

- `docs/STUDENT_EVALUATION_QUICKSTART.md` - Single student evaluations
- `orchestration/workflows/README.md` - Workflow file reference
- `docs/AGENT_INTRODUCTION_FEATURE.md` - How Marie introduces herself
- `docs/MAKEFILE_CONSOLIDATION.md` - All available commands

## Summary

**Fastest way to batch evaluate students:**

```bash
# 1. Create or copy workflow file with your students
cp orchestration/workflows/marie-review-and-note-students.json orchestration/workflows/my-class.json

# 2. Edit my-class.json with student names and scores

# 3. Execute
make batch-evaluate STUDENTS_FILE=orchestration/workflows/my-class.json
```

All evaluations happen in parallel, all files created with timestamps! 🚀
