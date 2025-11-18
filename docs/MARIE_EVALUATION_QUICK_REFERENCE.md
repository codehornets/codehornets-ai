# Marie Evaluation - Quick Reference Card

## 🚀 Single Student Evaluation

```bash
# Simple evaluation (template scores)
make evaluate-student STUDENT=emma-rodriguez

# With custom date
make evaluate-student STUDENT=sophia-chen DATE=2025-11-20

# Use existing workflow file
make evaluate-student-file WORKFLOW=orchestration/workflows/my-eval.json
```

## 👥 Batch Evaluation (Multiple Students)

```bash
# Demo (Emma & Sophia)
make batch-evaluate-demo

# Custom workflow
make batch-evaluate STUDENTS_FILE=orchestration/workflows/my-class.json

# With custom date
make batch-evaluate STUDENTS_FILE=my-class.json DATE=2025-11-20
```

## 📊 APEXX Score Categories (100 points)

| Category | Points | Weight |
|----------|--------|--------|
| Expression artistique | /10 | Regular |
| Coordination | /10 | Regular |
| Effort | /10 | Regular |
| Endurance | /10 | Regular |
| **Fondation (Bounce/Rock/Groove)** | **/30** | **Triple!** |
| Musicalité | /10 | Regular |
| Chorégraphie | /10 | Regular |
| Application corrections | /5 | Half |
| Processus apprentissage | /5 | Half |

## 💯 Score Interpretation

- **90-100**: Exceptional (mastery level)
- **80-89**: Very good (advanced)
- **70-79**: Good (solid)
- **60-69**: Satisfactory (developing)
- **<60**: Needs significant work

## 📝 Feedback Format (French)

**Pattern**: Positive → Constructive

```
✅ "Tu montres une belle énergie..."
✅ "Continue à travailler ta présence scénique..."

✅ "Excellente coordination!"
✅ "Continue à maintenir cette fluidité..."

✅ "Tes fondations progressent bien."
✅ "Continue à travailler ton grounding avec plus de poids..."
```

## 🗂️ Student Name Format

- ✅ `emma-rodriguez`
- ✅ `marie-louise-dupont`
- ✅ `sophia-chen`
- ❌ `Emma Rodriguez`
- ❌ `Emma_Rodriguez`

Always: **lowercase-with-dashes**

## 📁 Output Files

```
workspaces/dance/studio/students/
  └── emma-rodriguez/
      └── evaluations/
          └── evaluation_2025-11-16_20-21.md
                        │          │
                        │          └─ Time (HH-MM UTC)
                        └─ Date (YYYY-MM-DD)
```

## 🎯 Quick Workflow

### Single Student
1. `make evaluate-student STUDENT=name`
2. Edit generated file to customize scores/feedback
3. Done!

### Batch (Multiple Students)
1. Copy template: `cp orchestration/workflows/marie-review-and-note-students.json my-class.json`
2. Edit `my-class.json` with student data
3. `make batch-evaluate STUDENTS_FILE=my-class.json`
4. Review all generated files
5. Done!

## 🛠️ Orchestration Commands

```bash
# Start/stop
make orchestration-start
make orchestration-stop
make orchestration-status

# View logs
make logs-marie
make orchestration-logs

# Testing
make orchestration-test-all
```

## 📚 Full Documentation

- Single evaluations: `docs/STUDENT_EVALUATION_QUICKSTART.md`
- Batch evaluations: `docs/BATCH_EVALUATION_GUIDE.md`
- All workflows: `orchestration/workflows/README.md`
- All commands: `make help`

## ⚡ Cheat Sheet

```bash
# SETUP (first time only)
make orchestration-setup

# START
make orchestration-start

# EVALUATE ONE STUDENT
make evaluate-student STUDENT=emma-rodriguez

# EVALUATE MULTIPLE STUDENTS
make batch-evaluate-demo

# CHECK STATUS
make orchestration-status

# VIEW MARIE LOGS
make logs-marie

# STOP
make orchestration-stop
```

That's it! 🎭✨
