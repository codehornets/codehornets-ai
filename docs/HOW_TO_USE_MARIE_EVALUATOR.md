# How to Use the Marie Dance Evaluator Agent

## Quick Start

### Option 1: Simple Command (Easiest)

Just ask Claude Code directly:

```
"Use the marie-dance-evaluator agent to create a formal evaluation for Emma"
```

That's it! The agent will automatically:
1. Read reference examples
2. Generate a French-language evaluation
3. Save it to the workspace

---

## Common Use Cases

### 1. Create a Formal Evaluation (100-point APEXX format)

**Command:**
```
"Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez"
```

**With observations:**
```
"Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez with these observations:
- Good bounce improvement, depth is 7/10
- Upper body has tension in shoulders and neck
- Excellent coordination, very natural mover
- Needs more stage presence and confidence
- Applies corrections well
- Good effort and commitment"
```

**Output:**
```
✅ File created: workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
```

---

### 2. Create Quick Progress Notes (Informal)

**Command:**
```
"Use marie-dance-evaluator to create a quick note for Emma"
```

**With observations:**
```
"Use marie-dance-evaluator to create a quick note for Emma:
- Bounce clarity improved today
- Good music connection in rocks
- Needs consistent range in rock movements"
```

**Output:**
```
✅ File created: workspaces/dance/studio/evaluations/quick-notes/emma.md
```

---

### 3. Batch Evaluations (Multiple Students)

**Command:**
```
"Use marie-dance-evaluator to create formal evaluations for these students:

1. Emma Rodriguez:
   - Good bounce (7/10)
   - Upper body tension
   - Excellent coordination

2. Sophia Chen:
   - Strong energy and attack
   - Sometimes stiff with high energy
   - Good rock comprehension

3. Maya Thompson:
   - Nice musicality
   - Needs more amplitude
   - Work on lightness"
```

**Output:**
```
✅ Files created in: workspaces/dance/studio/evaluations/formal/
   - Emma_Evaluation_2025-11-17.md
   - Sophia_Evaluation_2025-11-17.md
   - Maya_Evaluation_2025-11-17.md
```

---

## Step-by-Step Examples

### Example 1: End-of-Term Formal Evaluation

**Step 1: Gather your observations**

Write down what you noticed about the student:
- Bounce quality
- Rock technique
- Groove/musicality
- Coordination
- Effort/attitude
- Areas for improvement

**Step 2: Request the evaluation**

```
"Use marie-dance-evaluator to create a formal evaluation for Emma Rodriguez.

Observations:
- Bounce: Good depth and rhythm (7/10), can push deeper
- Rock: Explores different directions well, sometimes loses shoulder engagement
- Groove: Developing well, needs more weight and grounding
- Coordination: Excellent, very natural mover (9/10)
- Musicality: Connects well to beats, could explore more accents
- Expression: Confident in some moments, shy in others
- Effort: Full commitment visible (9/10)
- Endurance: Maintains energy through sequences (8/10)
- Corrections: Applied previous feedback on hand placement
- Learning: Quick learner, details need refinement"
```

**Step 3: Review the generated evaluation**

The agent creates a complete French-language evaluation at:
```
workspaces/dance/studio/evaluations/formal/Emma_Evaluation_2025-11-17.md
```

**Step 4: Edit if needed (optional)**

You can ask Claude Code to:
```
"Review the evaluation and add more emphasis on her improvement since last term"
```

---

### Example 2: Quick Class Notes

**After a regular class:**

```
"Use marie-dance-evaluator to create quick notes for these students from today's class:

Emma: Good energy in bounce, rock needs more shoulder engagement, pushed hard today

Sophia: Better style emerging, upper body still stiff, good focus on isolations

Maya: Nice musicality exploration, needs more amplitude in movements"
```

**Output:**
3 quick note files with concise feedback

---

### Example 3: Mid-Term Progress Review

```
"Use marie-dance-evaluator to create detailed progress reviews for these 3 students:

Emma Rodriguez:
- Mid-term check-in
- Overall showing good improvement
- Bounce depth increased from 5/10 to 7/10
- Upper body still has tension but working on it
- Coordination remains her strength
- Need to work on confidence and performance quality

Sophia Chen:
- Strong natural ability
- Sometimes doesn't push herself to maximum
- Good attack when engaged
- Needs more consistent effort throughout class

Maya Thompson:
- Great improvement trajectory
- Was hesitant at start of term, now more committed
- Musicality is developing nicely
- Still working on getting lower in movements"
```

---

## Understanding the Output

### Formal Evaluation Structure

The agent generates evaluations with all 8 APEXX categories:

```markdown
# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Emma Rodriguez

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
```

### Quick Note Structure

Simple, concise feedback:

```markdown
# Emma Rodriguez

## Feedback

Good improvement in bounce keep dancing with head and neck let it move
and push the bounces deeper. Over all good needs to pop out more relax
upper body and dance with head the body is moving well and much improvement.
```

---

## Tips for Best Results

### 1. Be Specific with Observations

**Good:**
```
"Bounce depth is 7/10, up from 5/10 last term
Upper body shows tension especially in shoulders (needs to relax)
Coordination is excellent - body responds naturally to movements
Stage presence: confident when dancing alone, shy in group"
```

**Less effective:**
```
"Student is good, needs some improvement"
```

### 2. Use Hip-Hop Terminology

The agent understands these terms:
- **Bounce** - rhythmic up-down from legs
- **Rock** - upper body isolation
- **Groove** - weighted, grounded movement
- **Footwork** - foot precision
- **Levels** - high/low positions
- **Attack** - sharpness of movement
- **Musicality** - connection to music
- **Isolations** - body part movements

### 3. Specify Format Clearly

**For formal evaluation:**
```
"Create a formal APEXX evaluation for..."
"Create a complete 100-point evaluation for..."
```

**For quick note:**
```
"Create a quick note for..."
"Create a progress note for..."
"Create class notes for..."
```

### 4. Provide Context

```
"Create end-of-term formal evaluation for..."
"Create mid-term progress review for..."
"Create quick notes after today's class for..."
```

---

## Where to Find Generated Files

### Formal Evaluations
```
workspaces/dance/studio/evaluations/formal/
└── Emma_Evaluation_2025-11-17.md
```

### Quick Notes
```
workspaces/dance/studio/evaluations/quick-notes/
└── emma.md
```

### Batch Evaluations
```
workspaces/dance/studio/evaluations/batch/
└── 2025-11-17_batch_evaluations.md
```

### Student-Specific Folders
```
workspaces/dance/studio/students/emma-rodriguez/evaluations/
└── 2025-11-17_evaluation.md
```

---

## Advanced Usage

### Using with Claude Code Task Tool (Programmatic)

If you're coding or scripting:

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Create formal evaluation for Emma",
  prompt: `Create a formal APEXX evaluation for Emma Rodriguez.

Observations:
- Bounce: 7/10 depth, good rhythm
- Rock: explores directions, needs shoulder engagement
- Coordination: excellent (9/10)
- Expression: confident in moments, shy overall
- Effort: full commitment (9/10)`
})
```

### Reading Evaluations

After creating evaluations:

```
"Show me the evaluation I just created for Emma"
```

Or:

```
"Read the formal evaluation for Emma and tell me the key strengths and areas for improvement"
```

### Editing Evaluations

```
"Update Emma's evaluation to add more detail about her improvement in bounce since last term"
```

### Converting to PDF

```
"Convert Emma's evaluation to PDF format"
```

---

## Troubleshooting

### Issue: Output is in English instead of French

**Solution:** Specify language explicitly:
```
"Create a formal evaluation in French for Emma"
```

### Issue: Evaluation is too generic

**Solution:** Provide more specific observations:
```
"Create evaluation with these specific details:
- Bounce depth: 7/10 (was 5/10 last term)
- Specific issue: tension in shoulders when doing rocks
- Specific strength: picks up choreography very quickly"
```

### Issue: Missing some categories

**Solution:** Request complete format:
```
"Create a complete formal APEXX evaluation with all 8 categories for Emma"
```

### Issue: Can't find the file

**Solution:** Check the correct directory:
```
"List files in workspaces/dance/studio/evaluations/formal/"
```

Or ask:
```
"Where was Emma's evaluation saved?"
```

---

## Workflow Examples

### Weekly Workflow

**Monday (after class):**
```
"Create quick notes for students who stood out today: Emma, Sophia, Maya
[brief observations for each]"
```

**Friday (end of week):**
```
"Review the quick notes from this week and create a summary"
```

### End-of-Term Workflow

**Step 1: Gather observations**
Review your notes throughout the term

**Step 2: Create formal evaluations**
```
"Create formal evaluations for all 12 students using my term notes:
[student observations]"
```

**Step 3: Review and edit**
```
"Review Emma's evaluation and ensure it mentions her specific improvement in coordination"
```

**Step 4: Export**
```
"Convert all formal evaluations to PDF"
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| Formal evaluation | `"Use marie-dance-evaluator to create a formal evaluation for [Name]"` |
| Quick note | `"Use marie-dance-evaluator to create a quick note for [Name]"` |
| Batch evaluations | `"Use marie-dance-evaluator to create evaluations for: [list of students]"` |
| Find file | `"Where was [Name]'s evaluation saved?"` |
| Read evaluation | `"Show me [Name]'s evaluation"` |
| Edit evaluation | `"Update [Name]'s evaluation to [change]"` |
| List all | `"List all evaluations created today"` |

---

## Summary

**Easiest way to use:**
```
"Use marie-dance-evaluator to create a formal evaluation for [Student Name]"
```

**With observations:**
```
"Use marie-dance-evaluator to create a formal evaluation for [Student Name]:
- [Observation 1]
- [Observation 2]
- [Observation 3]"
```

**The agent will:**
1. ✅ Read reference examples automatically
2. ✅ Generate evaluation in French
3. ✅ Save to workspace (never pollutes knowledgehub)
4. ✅ Tell you where the file was saved

---

**Questions?**
- See detailed documentation: `.claude/agents/specialized/dance/`
- See file handling: `docs/MARIE_INPUT_OUTPUT_SEPARATION.md`
- See quick reference: `.claude/agents/specialized/dance/QUICK_REFERENCE.md`

**Ready to start!** Just ask Claude Code to use the marie-dance-evaluator agent. 🎉
