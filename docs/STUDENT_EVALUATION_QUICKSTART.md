# Student Evaluation - Quick Start Guide

## Evaluate a Student with Name Parameter

### Method 1: Simple Command (Template Scores)

```bash
cd orchestration
make evaluate-student STUDENT=emma-rodriguez
```

This creates an evaluation with:
- Student name: `emma-rodriguez`
- Date: Today's date
- Scores: Template values (you edit the file afterward)

### Method 2: With Custom Date

```bash
make evaluate-student STUDENT=sophia-chen DATE=2025-11-20
```

### Method 3: Direct curl Command

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d @workflows/marie-evaluate-student.json
```

## File Naming Format

Evaluations are saved with timestamp to allow multiple evaluations per day:

```
evaluation_2025-11-16_20-21.md
            │          │
            │          └─ Time (HH-MM in UTC)
            └─ Date (YYYY-MM-DD)
```

Example path:
```
workspaces/dance/studio/students/kailua-smith/evaluations/evaluation_2025-11-16_20-21.md
```

## What Gets Created

When you run `make evaluate-student STUDENT=kailua-smith`:

**1. Temporary workflow file** (auto-deleted after execution)
```json
{
  "name": "Marie Student Evaluation - kailua-smith",
  "tasks": [{
    "agent": "marie",
    "action": "marie_create_student_evaluation",
    "params": {
      "student_name": "kailua-smith",
      "date": "2025-11-16",
      "scores": { ... }
    }
  }]
}
```

**2. Evaluation markdown file**
```
workspaces/dance/studio/students/kailua-smith/evaluations/evaluation_2025-11-16_20-21.md
```

## Customize Scores

The `create-evaluation.sh` script uses template scores by default:

| Category | Default Score | Max |
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
| **Total** | **71** | **100** |

After creation, edit the markdown file to:
- Adjust scores
- Customize French feedback
- Add specific observations

## Complete Workflow

### Option 1: Use Existing Workflow File

If you have a pre-filled workflow JSON:

```bash
make evaluate-student-file WORKFLOW=workflows/my-student.json
```

### Option 2: Create from Template

```bash
# 1. Copy template
cp workflows/marie-evaluate-student.template.json workflows/emma.json

# 2. Edit emma.json with scores and feedback

# 3. Execute
make evaluate-student-file WORKFLOW=workflows/emma.json
```

## Multiple Students (Batch)

To evaluate multiple students in parallel, use the batch workflow:

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d @workflows/marie-review-and-note-students.json
```

This evaluates Emma Rodriguez (75/100) and Sophia Chen (86/100) simultaneously.

## Output Example

```bash
$ make evaluate-student STUDENT=kailua-smith

════════════════════════════════════════════════════════════
  🩰 Creating Evaluation for: kailua-smith
════════════════════════════════════════════════════════════

Student: kailua-smith
Date: 2025-11-16
Evaluator: Marie

⏳ Waiting for orchestrator...
✅ Orchestrator ready!

🚀 Creating evaluation...

✅ Evaluation created successfully!

✅ Created evaluation for Kailua Smith 📝
Total Score: 71/100
File: workspaces/dance/studio/students/kailua-smith/evaluations/evaluation_2025-11-16_20-21.md

💡 Edit the file to customize feedback:
   workspaces/dance/studio/students/kailua-smith/evaluations/evaluation_2025-11-16_20-21.md

════════════════════════════════════════════════════════════
```

## Check Agent Status

Before evaluating, ensure orchestrator is running:

```bash
cd orchestration
make status
```

If not running:

```bash
make start
```

## Troubleshooting

### "Orchestrator not responding"

```bash
make start
# Wait 5 seconds for startup
make status
```

### "Student name must be lowercase with dashes"

❌ Bad: `Emma Rodriguez`, `emma rodriguez`, `Emma-Rodriguez`
✅ Good: `emma-rodriguez`, `kailua-smith`, `marie-louise`

### Multiple Evaluations Same Day

The timestamp prevents overwriting:
- First eval: `evaluation_2025-11-16_10-30.md`
- Second eval: `evaluation_2025-11-16_14-45.md`

Both are preserved.

## Available Commands

```bash
# Quick evaluation with student name
make evaluate-student STUDENT=name

# With custom date
make evaluate-student STUDENT=name DATE=2025-11-20

# Use existing workflow file
make evaluate-student-file WORKFLOW=path/to/file.json

# Help
make help
```

## Tips

1. **Student Name Format**: Always lowercase with dashes
   - `emma-rodriguez` ✅
   - `Emma Rodriguez` ❌

2. **Edit After Creation**: Template scores are placeholders
   - Generated file has generic feedback
   - Edit to add specific observations
   - Customize scores based on actual performance

3. **Batch Operations**: For multiple students, create a workflow JSON with multiple tasks

4. **File Organization**: Each student gets their own directory
   ```
   students/
     emma-rodriguez/
       evaluations/
         evaluation_2025-11-16_10-30.md
         evaluation_2025-11-16_14-45.md
     sophia-chen/
       evaluations/
         evaluation_2025-11-16_10-32.md
   ```

## Related Documentation

- `orchestration/workflows/README.md` - Complete workflow guide
- `docs/AGENT_INTRODUCTION_FEATURE.md` - Agent introduction system
- `docs/MAKE_MARIE_COMMAND.md` - Using Marie in standalone mode

## Summary

**Fastest way to evaluate a student:**

```bash
cd orchestration
make evaluate-student STUDENT=emma-rodriguez
```

Then edit the generated file to customize scores and feedback!
