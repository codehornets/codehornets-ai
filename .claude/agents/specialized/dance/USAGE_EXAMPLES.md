# Marie Dance Evaluator - Usage Examples

This guide shows you how to use the Marie Dance Evaluator subagent for creating student evaluations and progress notes.

## Quick Start

### Using the Task Tool

```javascript
// Example 1: Single formal evaluation
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Create formal evaluation for Leanne",
  prompt: `Create a formal APEXX Sport-Études evaluation for student Leanne.

Observations:
- Good improvement in bounce, needs to push deeper
- Upper body is relaxed but head/neck could be more engaged
- Strong coordination and learning ability
- Sometimes lacks confidence in performance
- Applies corrections well
- Needs more stage presence and expression`
})

// Example 2: Quick progress note
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Quick note for Marianne",
  prompt: `Create a quick progress note for Marianne after today's class.

Observations:
- Bounce clarity improved
- Good connection to music in rocks
- Needs to push range and consistency in rock movements`
})

// Example 3: Batch evaluations
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Batch evaluations for 5 students",
  prompt: `Create formal evaluations for the following students:

1. Emma:
   - Strong bounce with good depth
   - Upper body tension (shoulders, neck)
   - Good musicality
   - Needs more facial expression

2. Sophie:
   - Excellent energy and attack
   - Sometimes movements become stiff with high energy
   - Good rock comprehension
   - Needs to use hips more in rock movements

[... continue for other students ...]`
})
```

## Example Scenarios

### Scenario 1: End-of-Term Formal Evaluations

**Context:** You need to create formal PDF-ready evaluations for your entire class of 12 students.

**Workflow:**

1. **Gather observation notes** for each student throughout the term
2. **Launch the agent** with batch processing

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Create 12 formal evaluations",
  prompt: `Generate formal APEXX Sport-Études evaluations for the following 12 students.

For each student, provide a complete evaluation covering all 8 categories.

Student observations:

1. Leanne:
   - Improved bounce, push deeper
   - Relaxed upper body, engage head/neck more
   - Good coordination
   - Needs more stage presence
   - Applies corrections well

2. Marianne:
   - Clear bounces needed
   - Good music connection in rocks
   - Needs range in rock movements

[Continue for all 12 students...]

Format: Generate each as a separate formal evaluation ready for PDF conversion.`
})
```

**Output:** 12 complete formal evaluations in French, structured according to APEXX format.

---

### Scenario 2: Quick Class Notes

**Context:** After a regular class, you want to jot down quick observations for students who stood out.

**Workflow:**

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Class notes for 5 students",
  prompt: `Create quick progress notes for these students from today's class:

Bile:
- Good energy in bounce
- Rock has good foundation but hands keep going to shirt
- Really pushed hard today, great improvement

Kailua:
- Nice musicality exploration in bounce
- Needs more amplitude
- Could work on lightness in movement

Alexia:
- Better style emerging
- Upper body still a bit stiff
- Good focus and working on shoulder isolations

Eva:
- Nice posture in bounce
- Feels like marking sometimes, needs more commitment
- Stance too high, needs to get lower

India:
- Good energy and full out
- Bounce needs more consistent levels
- Often moves on heels instead of toes

Format: Quick notes format (markdown with student name and brief feedback)`
})
```

**Output:** 5 concise progress notes in markdown format.

---

### Scenario 3: Mid-Term Progress Review

**Context:** You want to create more detailed progress notes (not full formal evaluations) for students who need extra attention.

**Workflow:**

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Mid-term progress for 3 students",
  prompt: `Create detailed progress reviews for these 3 students (more detailed than quick notes, but not full formal evaluations):

Jeanie:
- Nice commitment but needs bigger practice
- Levels and attack needed in movements
- Hip-hop posture issues - too upright
- Often loading late, hesitating
- Playing catch-up with more experienced dancers
- Needs encouragement to push harder

Rafaelle:
- Good listener, respectful
- Needs work on endurance and resilience
- Coordination much improved
- Needs to show feeling and bring life to steps
- Great attitude

Melrose:
- Good bounce, relax shoulders/neck
- Stiff in rock, needs to breathe more
- Working on groove understanding
- Most improvement when given corrections
- Great receptiveness to feedback

Format: Extended feedback paragraphs (3-5 sentences per student)`
})
```

---

### Scenario 4: Video Review Evaluation

**Context:** Student submitted a video for remote evaluation.

**Workflow:**

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Video evaluation for Emma",
  prompt: `Create a formal evaluation for Emma based on her submitted evaluation video.

Video observations:
- Bounce: Good rhythm and understanding, depth varies (6/10 depth consistency)
- Rock: Explores different directions well, sometimes loses shoulder engagement
- Groove: Developing well, needs more weight and grounding
- Coordination: Excellent, natural mover (9/10)
- Musicality: Connects well to beats, could explore more accents
- Expression: Confident in some moments, shy in others
- Effort: Full commitment visible (9/10)
- Endurance: Maintains energy through full sequence (8/10)
- Corrections: Applied previous feedback on hand placement
- Learning: Quick learner, details need refinement

Format: Full formal APEXX evaluation`
})
```

---

## Integration with Orchestration System

### Calling from Marie's Main Agent

If you have a main Marie agent that handles various teaching tasks, it can delegate to the dance-evaluator subagent:

```javascript
// In marie/server.ts or main Marie agent logic

// User asks: "Create evaluations for my students"
if (userRequestsEvaluation) {
  Task({
    subagent_type: "marie-dance-evaluator",
    description: "Student evaluations",
    prompt: extractedStudentData
  })
}
```

### Batch Workflow with JSON

Create a workflow JSON for batch evaluation processing:

```json
{
  "name": "batch-student-evaluations",
  "description": "Process end-of-term evaluations for entire class",
  "steps": [
    {
      "agent": "marie",
      "action": "gather-student-observations",
      "output": "student-observation-notes.md"
    },
    {
      "agent": "marie-dance-evaluator",
      "action": "create-formal-evaluations",
      "input": "student-observation-notes.md",
      "output": "evaluations/"
    },
    {
      "agent": "marie",
      "action": "review-and-finalize",
      "input": "evaluations/",
      "output": "final-evaluations-pdf/"
    }
  ]
}
```

---

## Expected Output Formats

### Format 1: Formal Evaluation (Markdown for PDF)

```markdown
# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Leanne
**Date:** ____________________
**Évalué par:** ____________________

## Expression artistique / 10 :

Tu apportes une belle attitude en classe et une énergie positive. Continue à développer ta présence : engage davantage ton regard, tes expressions et ta confiance pour que ton interprétation soit plus claire et assumée. Relâche la mâchoire et laisse ton visage être plus expressif dans ta danse.

## Coordination / 10 :

Ta coordination a beaucoup évolué. Pour gagner encore en fluidité, pense à utiliser davantage la direction de ta tête et de ton cou dans tes mouvements. Le relâchement du haut du corps — surtout dans le cou et la mâchoire — t'aidera à rendre ta danse plus naturelle et à mieux connecter les segments entre eux.

[... continues for all 8 categories ...]

**TOTAL:** ______ / 100
**Signature:** ____________________
```

### Format 2: Quick Progress Note

```markdown
# Leanne

## Feedback

Good improvement in bounce keep dancing with head and neck let it move and push the bounces deeper. Over all good needs to pop out more relax upper body and dance with head the body is moving well and much improvement. Take more solace in your dance and call more attention to you. Don't need to be humble the whole time.
```

### Format 3: Batch Output (Multiple Students)

```markdown
# EVALUATIONS - HIPHOP APEXX - [Date]

---

# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Student 1
[Complete evaluation...]

---

# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Student 2
[Complete evaluation...]

[... continues for all students ...]
```

---

## Tips for Best Results

### 1. Provide Specific Observations

**Good:**
```
"Student has good bounce with decent depth, but upper body shows tension
especially in shoulders and neck. When doing rocks, hands often go to
shirt. Musicality is strong - connects well to beats and accents."
```

**Less effective:**
```
"Student is okay, needs improvement in some areas"
```

### 2. Reference Hip-Hop Fundamentals

Use correct terminology:
- Bounce (rhythmic up-down from legs)
- Rock (upper body isolation)
- Groove (weighted, grounded quality)
- Footwork, levels, attack, musicality

### 3. Note Both Strengths and Growth Areas

Balanced feedback helps the agent create encouraging yet constructive evaluations.

### 4. Specify Format Clearly

Tell the agent exactly what you want:
- "formal APEXX evaluation"
- "quick progress note"
- "detailed mid-term review"

### 5. For Batch Processing, Use Consistent Structure

```
Student Name:
- Observation 1
- Observation 2
- Observation 3

Student Name:
- Observation 1
- Observation 2
```

---

## Common Use Cases

| Use Case | Format | When |
|----------|--------|------|
| End-of-term grades | Formal evaluation | Term end |
| Class notes | Quick notes | After every class |
| Mid-term check-in | Extended notes | Mid-semester |
| Video submissions | Formal evaluation | Remote learning |
| Progress tracking | Quick notes | Weekly |
| Parent-teacher meetings | Formal evaluation | Scheduled meetings |

---

## Troubleshooting

### Agent returns evaluation in English

**Fix:** Specify language in prompt:
```javascript
prompt: `Create evaluation in French for [student]...`
```

### Evaluation too generic

**Fix:** Provide more specific observations:
```javascript
prompt: `Create evaluation with these specific details:
- Bounce depth: 6/10, needs lower levels
- Rock: explores directions but lacks shoulder use
- [more specific observations...]`
```

### Missing categories in formal evaluation

**Fix:** Request complete format:
```javascript
prompt: `Create complete formal APEXX evaluation with all 8 categories for [student]...`
```

---

## Advanced Workflows

### Workflow 1: Observation Aggregation

Combine notes from multiple classes into one evaluation:

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Compile 4 weeks of observations",
  prompt: `Create a formal evaluation for Emma, synthesizing observations from the past 4 weeks:

Week 1: [observations]
Week 2: [observations]
Week 3: [observations]
Week 4: [observations]

Identify patterns, improvements, and consistent growth areas.`
})
```

### Workflow 2: Comparative Analysis

Track student progress over time:

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Progress comparison",
  prompt: `Compare Emma's current performance to her last evaluation (3 months ago).

Previous evaluation (October):
[previous evaluation content]

Current observations (January):
[current observations]

Create new evaluation highlighting improvement areas and new focus points.`
})
```

---

## Integration Checklist

- [ ] Agent file copied to `.claude/agents/specialized/dance/`
- [ ] Knowledge base examples available in `data/knowledgehub/domain/dance/marie/`
- [ ] Test with single student evaluation
- [ ] Test with batch processing
- [ ] Verify French language output
- [ ] Check all 8 categories present in formal evaluations
- [ ] Validate tone is encouraging and constructive

---

## Questions?

For issues or questions about the dance evaluator agent:
1. Check this USAGE_EXAMPLES.md file
2. Review marie-dance-evaluator.md for detailed specifications
3. Examine example evaluations in the knowledgehub
4. Consult main agents README.md

---

*Created for the APEXX Sport-Études Hip-Hop Program*
