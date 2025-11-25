# Batch Evaluate ALL Students - Complete Guide

## Quick Answer

**Yes! You can evaluate ANY number of students in one batch!**

The demo (`make batch-evaluate-demo`) only shows 2 students, but you can evaluate **10, 20, 50, or even 100+ students** simultaneously using the workflow generator.

## 🚀 Three Ways to Batch Evaluate

### Method 1: Use the Demo (2 Students)
```bash
make batch-evaluate-demo
```
- Emma Rodriguez (75/100)
- Sophia Chen (86/100)

### Method 2: Generate Workflow from Student List (Recommended)

**Step 1: Create a student list file**
```bash
cat > my-students.txt <<EOF
emma-rodriguez
sophia-chen
kailua-smith
marie-louise-dupont
jessica-thompson
michael-anderson
sarah-williams
david-martinez
olivia-brown
james-davis
EOF
```

**Step 2: Generate workflow**
```bash
make generate-batch-workflow STUDENTS=my-students.txt
```

This creates `workflows/batch-evaluation-generated.json` with **template scores** for all students.

**Step 3: Edit scores (optional but recommended)**
```bash
# Edit the generated file to customize scores for each student
nano orchestration/workflows/batch-evaluation-generated.json
# or use your favorite editor
```

**Step 4: Execute batch evaluation**
```bash
make batch-evaluate STUDENTS_FILE=workflows/batch-evaluation-generated.json
```

**Done!** All students evaluated in parallel! ✨

### Method 3: Manually Create Workflow JSON

Copy the template and add as many students as you need:

```json
{
  "name": "My Class Evaluation",
  "tasks": [
    { "id": "evaluate-student1", "agent": "marie", ... },
    { "id": "evaluate-student2", "agent": "marie", ... },
    { "id": "evaluate-student3", "agent": "marie", ... }
    // Add as many as you want!
  ]
}
```

## 📋 Complete Example: Evaluate 10 Students

### 1. Create Student Roster

```bash
# File: my-class-2a.txt
cat > orchestration/my-class-2a.txt <<'STUDENTS'
# Class 2A - Hip-Hop Program
# Advanced Students

emma-rodriguez
sophia-chen
kailua-smith
marie-louise-dupont
jessica-thompson
michael-anderson
sarah-williams
david-martinez
olivia-brown
james-davis
STUDENTS
```

### 2. Generate Workflow

```bash
make generate-batch-workflow STUDENTS=my-class-2a.txt OUTPUT=workflows/class-2a-november.json
```

Output:
```
════════════════════════════════════════════════════════════
  🩰 Generating Batch Evaluation Workflow
════════════════════════════════════════════════════════════

📋 Input: my-class-2a.txt
👥 Students: 10
📅 Date: 2025-11-16
👤 Evaluator: Marie
📄 Output: workflows/class-2a-november.json

✅ Workflow file generated successfully!
```

### 3. Customize Scores (Important!)

The generator creates **template scores** (71/100 for each student). You should edit the file to give each student their actual scores:

```bash
# Open in your editor
code orchestration/workflows/class-2a-november.json

# Or nano
nano orchestration/workflows/class-2a-november.json
```

**Find each student** and update their scores and feedback:

```json
{
  "id": "evaluate-emma-rodriguez",
  "params": {
    "scores": {
      "expression_artistique": { "score": 8, "feedback": "Emma a une présence naturelle..." },
      "coordination": { "score": 7, "feedback": "Bonne coordination..." },
      // ... update all 9 categories
    }
  }
}
```

### 4. Execute Batch Evaluation

```bash
make batch-evaluate STUDENTS_FILE=workflows/class-2a-november.json
```

Output:
```
════════════════════════════════════════════════════════════
  🩰 Batch Student Evaluation
════════════════════════════════════════════════════════════

⏳ Waiting for orchestrator...
✅ Orchestrator ready!

📋 Workflow: workflows/class-2a-november.json

👥 Evaluating 10 students in parallel...

🚀 Starting batch evaluation...

✅ Batch evaluation completed!

════════════════════════════════════════════════════════════
  📊 Evaluation Summary
════════════════════════════════════════════════════════════

✅ Batch evaluation completed successfully!

📊 Results:
   • 10 students evaluated in parallel
   • Files generated with timestamp: 2025-11-16_15-42

📝 Check evaluation files in:
   workspaces/dance/studio/students/[student-name]/evaluations/
```

### 5. Verify Results

```bash
# List all generated files
ls workspaces/dance/studio/students/*/evaluations/evaluation_2025-11-16_*.md

# Output shows 10 files:
workspaces/dance/studio/students/david-martinez/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/james-davis/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/jessica-thompson/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/kailua-smith/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/marie-louise-dupont/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/michael-anderson/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/olivia-brown/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/sarah-williams/evaluations/evaluation_2025-11-16_20-42.md
workspaces/dance/studio/students/sophia-chen/evaluations/evaluation_2025-11-16_20-42.md
```

**All 10 students evaluated in parallel!** 🎉

## 🎯 Student Name Format

**Always use lowercase-with-dashes:**

✅ **Correct:**
- `emma-rodriguez`
- `marie-louise-dupont`
- `jean-francois-martin`

❌ **Wrong:**
- `Emma Rodriguez` (spaces)
- `Emma_Rodriguez` (underscores)
- `EmmaRodriguez` (no separator)

## 📊 Template Scores

The generator uses template scores (Total: 71/100):

| Category | Template Score | Max |
|----------|---------------|-----|
| Expression artistique | 7 | 10 |
| Coordination | 7 | 10 |
| Effort | 8 | 10 |
| Endurance | 7 | 10 |
| **Fondation** | **20** | **30** |
| Musicalité | 7 | 10 |
| Chorégraphie | 7 | 10 |
| Application corrections | 4 | 5 |
| Processus apprentissage | 4 | 5 |

**You MUST edit these** to match each student's actual performance!

## 🔧 Advanced Options

### Custom Date

```bash
# All evaluations dated December 1st
make generate-batch-workflow STUDENTS=my-students.txt
# Then edit the JSON or:
DATE=2025-12-01 make generate-batch-workflow STUDENTS=my-students.txt
```

### Custom Evaluator

```bash
EVALUATOR="Marie & Pierre" make generate-batch-workflow STUDENTS=my-students.txt
```

### Custom Output File

```bash
make generate-batch-workflow STUDENTS=my-students.txt OUTPUT=workflows/december-evaluations.json
```

## 💡 Tips for Large Classes

### Split Into Groups

For very large classes (30+ students), split into batches:

```bash
# Batch 1: Beginners
cat > beginners.txt <<EOF
student1
student2
# ... 15 students
EOF

make generate-batch-workflow STUDENTS=beginners.txt OUTPUT=workflows/beginners-batch.json

# Batch 2: Intermediate
cat > intermediate.txt <<EOF
student16
student17
# ... 15 students
EOF

make generate-batch-workflow STUDENTS=intermediate.txt OUTPUT=workflows/intermediate-batch.json

# Execute separately
make batch-evaluate STUDENTS_FILE=workflows/beginners-batch.json
make batch-evaluate STUDENTS_FILE=workflows/intermediate-batch.json
```

### Use Comments in Student List

```bash
# my-students.txt
# Advanced Class
emma-rodriguez
sophia-chen

# Intermediate Class
kailua-smith
marie-louise-dupont

# Lines starting with # are ignored
```

## ⚡ Performance

- **Sequential (one by one)**: ~10 seconds × 10 students = **100 seconds**
- **Parallel (batch)**: ~10 seconds for **all 10 students**

**Batch is 10× faster!** ⚡

## 📚 Command Reference

```bash
# Generate workflow from student list
make generate-batch-workflow STUDENTS=file.txt

# With custom output
make generate-batch-workflow STUDENTS=file.txt OUTPUT=my-workflow.json

# Execute batch evaluation
make batch-evaluate STUDENTS_FILE=workflows/my-workflow.json

# With custom date
make batch-evaluate STUDENTS_FILE=workflows/my-workflow.json DATE=2025-12-01

# Demo (2 students)
make batch-evaluate-demo

# Help
cd orchestration && ./scripts/generate-batch-workflow.sh --help
cd orchestration && ./scripts/batch-evaluate.sh --help
```

## 🎓 Complete Workflow Example

```bash
# 1. Create student roster
cat > class-roster.txt <<EOF
emma-rodriguez
sophia-chen
kailua-smith
marie-louise-dupont
jessica-thompson
michael-anderson
sarah-williams
david-martinez
olivia-brown
james-davis
EOF

# 2. Generate workflow with template scores
make generate-batch-workflow STUDENTS=class-roster.txt

# 3. Edit scores (IMPORTANT!)
nano orchestration/workflows/batch-evaluation-generated.json
# Update scores for each student based on their performance

# 4. Start orchestrator (if not running)
make orchestration-start

# 5. Execute batch evaluation
make batch-evaluate STUDENTS_FILE=workflows/batch-evaluation-generated.json

# 6. View results
ls workspaces/dance/studio/students/*/evaluations/

# 7. Read individual evaluations
cat workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_*.md
```

## 🆘 Troubleshooting

### "Orchestrator not responding"
```bash
make orchestration-start
# Wait 5 seconds
make orchestration-status
```

### "Student list file not found"
```bash
# Path is relative to orchestration/ directory
# Use: example-students.txt
# Not: orchestration/example-students.txt
```

### "Some students not evaluated"
Check student name format:
- Must be lowercase
- Use dashes not spaces
- Example: `marie-louise` not `Marie Louise`

## 📖 Related Documentation

- `docs/BATCH_EVALUATION_GUIDE.md` - Detailed batch evaluation guide
- `docs/STUDENT_EVALUATION_QUICKSTART.md` - Single student evaluations
- `docs/MARIE_EVALUATION_QUICK_REFERENCE.md` - Quick reference card
- `orchestration/workflows/README.md` - Workflow file format
- `orchestration/example-class-roster.txt` - Example student list

## Summary

**To evaluate ALL your students:**

1. Create a text file with one student name per line (lowercase-with-dashes)
2. Run: `make generate-batch-workflow STUDENTS=your-file.txt`
3. Edit the generated workflow to customize scores
4. Run: `make batch-evaluate STUDENTS_FILE=workflows/batch-evaluation-generated.json`
5. Done! All students evaluated in parallel! ✨

**No limit on number of students!** You can evaluate 5, 10, 20, 50, or 100+ students in a single batch! 🚀
