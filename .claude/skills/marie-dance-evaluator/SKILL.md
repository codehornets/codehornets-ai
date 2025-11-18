---
name: marie-dance-evaluator
description: Create formal hip-hop dance evaluations for APEXX Sport-Études students. Use this skill when creating student evaluations, progress notes, or performance reviews for hip-hop dance students. Creates 100-point APEXX evaluations in French.
---

# Marie Dance Evaluator Skill

## Purpose
This skill helps create professional French-language hip-hop dance evaluations for students in the APEXX Sport-Études program using the official 100-point rubric.

## When to Use This Skill
- Creating formal student evaluations (end-of-term, mid-term)
- Writing quick progress notes after class
- Generating batch evaluations for multiple students
- Reviewing student performance and providing constructive feedback

## APEXX Evaluation Framework (100 points)

The evaluation uses 8 categories:

1. **Expression artistique** /10 - Stage presence, confidence, facial expressions
2. **Coordination** /10 - Body awareness, fluidity, rhythm alignment
3. **Effort** /10 - Commitment level, intensity, consistency
4. **Endurance** /10 - Stamina, energy management
5. **Fondation (Bounce / Rock / Groove)** /30 - Hip-hop fundamentals
6. **Musicalité** /10 - Musical understanding, rhythm interpretation
7. **Chorégraphie** /10 - Learning speed, performance quality
8. **Application des corrections** /5 - Receptiveness to feedback
9. **Processus d'apprentissage** /5 - Class attitude, growth mindset

## File Handling

### Input (Reference Examples - Read Only)
```
data/knowledgehub/domain/dance/marie/
├── markdown/students-reviews/     # Quick notes examples
│   ├── leanne.md
│   ├── bile.md
│   └── [33 more students...]
└── pdfs/students-notes/           # Formal evaluation examples
    ├── Leanne_Evaluation_Final.pdf
    ├── Marianne_Evaluation_Final.pdf
    └── Evaluation_HIPHOP_APEXX_Modifiable.pdf
```

### Output (Generated Evaluations - Write Here)
```
workspaces/dance/studio/evaluations/
├── formal/                        # Formal evaluations
│   └── [StudentName]_Evaluation_[Date].md
├── quick-notes/                   # Quick progress notes
│   └── [studentname].md
└── batch/                         # Batch evaluations
    └── [Date]_batch_evaluations.md
```

**CRITICAL:** NEVER write to `data/knowledgehub/` - that is read-only! Always write to `workspaces/`!

## Workflow

### Step 1: Read Reference Examples
Before creating any evaluation, read 2-3 examples to learn the tone and style:

```bash
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md
Read: data/knowledgehub/domain/dance/marie/markdown/students-reviews/bile.md
Read: data/knowledgehub/domain/dance/marie/pdfs/students-notes/Leanne_Evaluation_Final.pdf
```

### Step 2: Determine Evaluation Type and Output Path

**Formal Evaluation:**
```javascript
format = "formal"
outputPath = `workspaces/dance/studio/evaluations/formal/${StudentName}_Evaluation_${date}.md`
```

**Quick Note:**
```javascript
format = "quick-note"
outputPath = `workspaces/dance/studio/evaluations/quick-notes/${studentName.toLowerCase()}.md`
```

**Batch:**
```javascript
format = "batch"
outputPath = `workspaces/dance/studio/evaluations/batch/${date}_batch_evaluations.md`
```

### Step 3: Create Output Directory
```bash
mkdir -p workspaces/dance/studio/evaluations/formal/
```

### Step 4: Generate Evaluation Content

Using the reference examples as a style guide, create French-language evaluation with:
- Encouraging, constructive tone
- Specific, actionable feedback
- Balance of strengths and growth areas
- Authentic hip-hop terminology
- "Tu" form (informal second person)

### Step 5: Write to File
```bash
Write: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
```

### Step 6: Confirm to User
Report:
- File created at: [path]
- Student name: [name]
- Format: [formal/quick-note/batch]
- Date: [date]

## Formal Evaluation Template

```markdown
# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** [Student Name]
**Date:** ____________________
**Évalué par:** ____________________

## Expression artistique / 10 :

[Feedback about stage presence, confidence, facial expression...]

## Coordination / 10 :

[Feedback about body awareness, fluidity...]

## Effort / 10 :

[Feedback about commitment, intensity...]

## Endurance / 10 :

[Feedback about stamina, energy management...]

## Fondation (Bounce / Rock / Groove) / 30 :

[Detailed feedback on hip-hop fundamentals...]

## Musicalité / 10 :

[Feedback about musical connection...]

## Chorégraphie / 10 :

[Feedback about learning speed, performance...]

## Application des corrections / 5 :

[Feedback about receptiveness to feedback...]

## Processus d'apprentissage / 5 :

[Feedback about class attitude, growth mindset...]

**TOTAL:** ______ / 100
**Signature:** ____________________
```

## Quick Note Template

```markdown
# [Student Name]

## Feedback

[Constructive observations mixing strengths and areas for improvement in 2-5 sentences]
```

## Hip-Hop Terminology

Use authentic hip-hop vocabulary:
- **Bounce**: rhythmic up-down movement from legs
- **Rock**: upper body isolation with directional variety
- **Groove**: weighted, grounded movement quality
- **Footwork**: precision in foot placement
- **Isolations**: body part-specific movements
- **Levels**: vertical range (high/low positions)
- **Attack**: sharpness and intensity
- **Musicality**: connection to music's rhythm and accents

## Common Feedback Patterns

### Positive Reinforcement
- "Belle présence"
- "Bonne compréhension"
- "Excellent travail"
- "Beaucoup de progrès"
- "Tu as une bonne base"

### Growth Opportunities
- "Continue à..."
- "Travaille sur..."
- "Cherche à..."
- "Pousse plus loin..."
- "Développe davantage..."

### Technical Corrections
- "Relâche [body part]"
- "Approfondir [movement]"
- "Plus d'amplitude/profondeur/clarté"
- "Engage davantage [element]"
- "Maintiens [quality]"

## Example Usage

### Example 1: Create Formal Evaluation
```
User: "Create a formal evaluation for Emma Rodriguez. She has good energy but struggles with upper body tension and needs to work on her bounce depth."

Steps:
1. Read reference examples (leanne.md, bile.md, Leanne_Evaluation_Final.pdf)
2. Determine: format = "formal", outputPath = "workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md"
3. mkdir -p workspaces/dance/studio/evaluations/formal/
4. Generate complete formal evaluation in French covering all 8 categories
5. Incorporate observations: energy (Effort), tension (Expression/Fondation), bounce depth (Fondation)
6. Write file to workspace
7. Confirm: "✅ Formal evaluation created for Emma at: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md"
```

### Example 2: Quick Class Notes
```
User: "Create quick notes for Emma: Good energy today, rock needs more shoulder engagement, applied corrections well"

Steps:
1. Read reference examples
2. Determine: format = "quick-note", outputPath = "workspaces/dance/studio/evaluations/quick-notes/emma.md"
3. Generate 2-5 sentence feedback in French
4. Write to workspace
5. Confirm completion
```

### Example 3: Batch Evaluations
```
User: "Create formal evaluations for Emma, Sophia, and Maya with these observations: [observations]"

Steps:
1. Read reference examples
2. For each student:
   - Generate complete formal evaluation
   - Save to: workspaces/dance/studio/evaluations/formal/[Name]_Evaluation_[Date].md
3. Confirm all files created
```

## Quality Checklist

Before finalizing:
- ✅ All required categories addressed (8 for formal, flexible for quick notes)
- ✅ Encouraging and constructive tone throughout
- ✅ Proper French grammar, accents, and terminology
- ✅ Concrete observations, not generic feedback
- ✅ Balance of strengths and growth areas
- ✅ Clear, actionable next steps
- ✅ File saved to workspace (NOT knowledgehub!)

## Tips for Best Results

1. **Be Specific**: Instead of "good bounce," say "bounce solide avec bonne profondeur, peut descendre encore plus bas"
2. **Be Actionable**: Provide clear next steps - "relâche les épaules et le cou pour libérer le rock"
3. **Balance Feedback**: Start with strengths, then growth areas
4. **Use Comparisons**: Reference improvement when applicable
5. **Encourage Ownership**: Use phrases like "tu as la capacité de..."

## Troubleshooting

### Issue: Generic feedback
**Solution**: Reference specific movements, moments, or technical elements observed

### Issue: English output
**Solution**: Always write in French unless explicitly requested otherwise

### Issue: Missing categories
**Solution**: For formal evaluations, ensure all 8 categories are included

### Issue: File not found
**Solution**: Check paths - read from `data/knowledgehub/`, write to `workspaces/`

## Cleanup for Testing

To clean workspace and restart testing:
```bash
make clean-workspace-test
```

This removes all generated evaluation files and prepares for a fresh test.

---

**Ready to create dance evaluations!** Just ask to create an evaluation and follow the workflow above.
