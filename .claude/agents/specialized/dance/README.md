# Dance Specialized Agents

Specialized agents for dance education, student evaluation, and performance assessment.

## Available Agents

### apexx (APEXX Evaluation Agent)

**Type:** Autonomous worker agent
**Skill:** Uses marie-dance-evaluator skill
**Purpose:** Handle dance evaluation tasks without polluting main context

**How it works:**
- Loads `.claude/skills/marie-dance-evaluator/SKILL.md`
- Follows skill workflow autonomously
- Creates APEXX Sport-Études evaluations
- Reports back with completion status

**Use cases:**
- Batch evaluation of multiple students (keeps main context clean)
- Large evaluation tasks that need autonomous processing
- Background evaluation work while main Claude handles other tasks

**Invocation:**
```javascript
Task({
  subagent_type: "apexx",
  description: "Evaluate all students",
  prompt: "Use marie-dance-evaluator skill to create formal evaluations for all students"
})
```

**Files:**
- `apexx.md` - Full agent specification
- `.claude/skills/marie-dance-evaluator/SKILL.md` - Skill the agent uses
- `USAGE_EXAMPLES.md` - Detailed usage scenarios
- `QUICK_REFERENCE.md` - Fast lookup guide

### marie-dance-evaluator (Skill)

**Type:** Claude Code Skill (not an agent)
**Purpose:** Instructions for creating dance evaluations

**How it works:**
- Direct skill invocation: "Use marie-dance-evaluator to..."
- Main Claude reads and follows skill instructions
- Interactive workflow with visibility into each step

**Use cases:**
- Single student evaluations (interactive)
- Quick progress notes after class
- When you want to see each step of the process

**Invocation:**
```
Use marie-dance-evaluator to create a formal evaluation for Emma
```

## Quick Start

### 1. Simple Evaluation

```bash
# Ask Claude Code:
"Use the marie-dance-evaluator agent to create a formal evaluation for Emma"
```

### 2. With Specific Observations

```bash
"Use marie-dance-evaluator to evaluate Leanne with these observations:
- Bounce: good improvement, push deeper
- Upper body: some tension in shoulders/neck
- Coordination: excellent, natural mover
- Performance: needs more confidence and expression"
```

### 3. Batch Processing

```bash
"Use marie-dance-evaluator to create evaluations for 10 students using
the observation notes in evaluations/class-notes.md"
```

## Knowledge Base

The agent references example evaluations from:

```
data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                           # Master notes (26 students)
│   └── students-reviews/                 # Individual quick notes
│       ├── leanne.md
│       ├── bile.md
│       ├── kailua.md
│       ├── marianne.md
│       └── [23 more students...]
└── pdfs/students-notes/                  # Formal evaluations
    ├── Leanne_Evaluation_Final.pdf
    ├── Marianne_Evaluation_Final.pdf
    ├── Kailua_Evaluation_Final.pdf
    └── Evaluation_HIPHOP_APEXX_Modifiable.pdf  # Template
```

## Evaluation Framework

### APEXX Sport-Études Hip-Hop Rubric (100 points)

1. **Expression artistique** (10 pts)
   - Stage presence, confidence, facial expression

2. **Coordination** (10 pts)
   - Body awareness, movement fluidity

3. **Effort** (10 pts)
   - Commitment, intensity, consistency

4. **Endurance** (10 pts)
   - Energy management, stamina

5. **Fondation - Bounce/Rock/Groove** (30 pts)
   - Hip-hop fundamentals mastery

6. **Musicalité** (10 pts)
   - Musical connection, rhythm

7. **Chorégraphie** (10 pts)
   - Learning speed, performance quality

8. **Application des corrections** (5 pts)
   - Receptiveness to feedback

9. **Processus d'apprentissage** (5 pts)
   - Class attitude, growth mindset

## Language

All evaluations are written in **French** by default, following the APEXX program standards.

## Output Formats

### Formal Evaluation
Complete 100-point evaluation with all 8 categories, ready for PDF conversion.

**Example:**
```markdown
# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Leanne
**Date:** ____________________
**Évalué par:** ____________________

## Expression artistique / 10 :
[Detailed feedback...]

[... all 8 categories ...]

**TOTAL:** ______ / 100
```

### Quick Progress Note
Brief observation-style notes for class tracking.

**Example:**
```markdown
# Leanne

## Feedback
Good improvement in bounce keep dancing with head and neck...
```

## Integration

### With Main Marie Agent

The dance-evaluator can be called by Marie's main teaching agent:

```javascript
// In Marie's orchestrator
if (task_type === "evaluation") {
  Task({
    subagent_type: "marie-dance-evaluator",
    description: "Create student evaluations",
    prompt: student_observation_data
  })
}
```

### With Batch Workflows

Use workflow JSON for systematic evaluation processing:

```json
{
  "name": "end-of-term-evaluations",
  "agent": "marie-dance-evaluator",
  "input": "observations/*.md",
  "output": "evaluations/",
  "format": "formal"
}
```

## Documentation

| File | Purpose |
|------|---------|
| `marie-dance-evaluator.md` | Complete agent specification |
| `USAGE_EXAMPLES.md` | Detailed usage scenarios & workflows |
| `QUICK_REFERENCE.md` | Fast lookup & common commands |
| `README.md` | This file - overview |

## Common Workflows

### Weekly Progress Tracking

```bash
# After each class
"Create quick notes for students who need attention: [names + observations]"
```

### End-of-Term Evaluations

```bash
# Process entire class
"Create formal evaluations for all 15 students using notes from term-observations.md"
```

### Mid-Term Reviews

```bash
# Detailed check-ins
"Create detailed progress reviews for 5 students: [observations]"
```

### Video Assessments

```bash
# Remote evaluation
"Create formal evaluation for Emma's video submission. Observations: [details]"
```

## Tips for Success

1. **Be Specific:** Provide detailed observations, not just "good" or "needs work"
2. **Balance Feedback:** Mix strengths with growth areas
3. **Use Terminology:** Reference bounce, rock, groove, musicality correctly
4. **Specify Format:** "formal evaluation" vs "quick note"
5. **Provide Context:** End-of-term vs mid-session affects tone

## Examples Library

Review the knowledgehub for 26+ example evaluations showing:
- Proper French phrasing
- Constructive feedback tone
- Technical terminology usage
- Balance of positive/growth feedback
- Category-specific observations

## Troubleshooting

**Issue:** Output in wrong language
**Fix:** Specify "in French" explicitly in prompt

**Issue:** Missing evaluation categories
**Fix:** Request "complete formal APEXX format"

**Issue:** Feedback too generic
**Fix:** Provide specific, detailed observations

**Issue:** Wrong tone (too harsh or too soft)
**Fix:** Reference example evaluations for correct tone

## Future Enhancements

Potential additions to the dance agents:

- **choreography-planner**: Plan class choreography sequences
- **music-selector**: Suggest music for different styles/levels
- **progress-tracker**: Track student improvement over time
- **class-planner**: Create lesson plans and class structures

## Contributing

To add new dance-related agents:

1. Create agent in `.claude/agents/specialized/dance/`
2. Follow naming convention: `marie-[functionality].md`
3. Include usage examples
4. Update this README
5. Add to main agents README.md

## Questions?

- **Quick help:** See QUICK_REFERENCE.md
- **Detailed examples:** See USAGE_EXAMPLES.md
- **Full specs:** See marie-dance-evaluator.md
- **General agents:** See ../../README.md

---

*Specialized agents for the APEXX Sport-Études Hip-Hop Dance Program*
