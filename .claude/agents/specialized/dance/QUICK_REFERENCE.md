# Marie Dance Evaluator - Quick Reference

## How to Use

### Option 1: Direct Call (Recommended)

```bash
# Ask Claude Code:
"Use the marie-dance-evaluator agent to create a formal evaluation for [student name]"
```

### Option 2: Task Tool (Programmatic)

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Evaluate student Emma",
  prompt: "Create formal evaluation for Emma. Observations: [details...]"
})
```

## Common Commands

### Single Formal Evaluation

```
"Create a formal APEXX evaluation for Leanne with these observations:
- Good bounce improvement
- Upper body tension
- Strong coordination
- Needs more stage presence"
```

### Quick Class Note

```
"Create a quick progress note for Marianne:
- Bounce clarity improved
- Good music connection
- Needs consistent rock range"
```

### Batch Evaluations

```
"Create formal evaluations for 5 students:
1. Emma: [observations]
2. Sophie: [observations]
3. Leanne: [observations]
4. Bile: [observations]
5. Kailua: [observations]"
```

## Output Formats

### Formal Evaluation
- All 8 APEXX categories
- French language
- PDF-ready markdown
- /100 point scoring

### Quick Note
- Student name header
- Brief feedback paragraph
- Markdown format
- Casual observation style

## Evaluation Categories (8)

1. Expression artistique /10
2. Coordination /10
3. Effort /10
4. Endurance /10
5. Fondation (Bounce/Rock/Groove) /30
6. Musicalité /10
7. Chorégraphie /10
8. Application des corrections /5
9. Processus d'apprentissage /5

**Total: /100**

## Hip-Hop Terminology

| Term | Meaning |
|------|---------|
| Bounce | Rhythmic up-down from legs |
| Rock | Upper body isolation with direction |
| Groove | Weighted, grounded movement |
| Footwork | Precision in foot movements |
| Levels | Vertical range (high/low) |
| Attack | Sharpness/intensity |
| Musicality | Connection to music |
| Isolations | Body part-specific moves |

## Key Phrases (French)

**Positive:**
- Belle présence
- Bonne compréhension
- Excellent travail
- Tu as une bonne base

**Growth:**
- Continue à...
- Travaille sur...
- Cherche à...
- Pousse plus loin...

**Technical:**
- Relâche [le cou/les épaules]
- Plus d'amplitude
- Approfondir [le bounce]
- Engage davantage

## Tips for Best Results

1. **Be specific** - "Good bounce depth 7/10" vs "good bounce"
2. **Balance feedback** - Mix strengths with growth areas
3. **Use correct terms** - Bounce, rock, groove (not just "moves")
4. **Specify format** - "formal" vs "quick note"
5. **Provide context** - "end-of-term" vs "mid-session check-in"

## Files Structure

```
.claude/agents/specialized/dance/
├── marie-dance-evaluator.md      # Main agent specification
├── USAGE_EXAMPLES.md              # Detailed examples
├── QUICK_REFERENCE.md             # This file
└── README.md                      # (optional) Overview

data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                    # Master notes
│   └── students-reviews/          # Individual quick notes
│       ├── leanne.md
│       ├── bile.md
│       └── [others...]
└── pdfs/students-notes/           # Formal PDF evaluations
    ├── Leanne_Evaluation_Final.pdf
    ├── Marianne_Evaluation_Final.pdf
    └── Evaluation_HIPHOP_APEXX_Modifiable.pdf  # Template
```

## Example Prompts

### End of Term
```
"Create formal evaluations for my 12 students using notes from [file]"
```

### After Class
```
"Quick notes for 5 students who stood out today: [names and observations]"
```

### Mid-Term Review
```
"Detailed progress review for 3 students needing extra attention: [details]"
```

### Video Submission
```
"Formal evaluation for Emma's video submission. Observations: [details from video]"
```

## Integration Points

### With Main Marie Agent
The marie-dance-evaluator can be called by Marie's main teaching agent when evaluation tasks are detected.

### With Orchestration System
Can be integrated into batch workflows using JSON workflow definitions (see USAGE_EXAMPLES.md).

### With Knowledgehub
References example evaluations from:
- `data/knowledgehub/domain/dance/marie/markdown/`
- `data/knowledgehub/domain/dance/marie/pdfs/`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Output in English | Specify "in French" in prompt |
| Too generic | Provide specific observations |
| Missing categories | Request "complete formal APEXX format" |
| Wrong format | Clarify "formal evaluation" vs "quick note" |

## Quick Checklist

Before running evaluations:

- [ ] Student observations prepared
- [ ] Format decided (formal vs quick)
- [ ] Language specified (default: French)
- [ ] Output location decided
- [ ] Reference examples reviewed (optional)

After receiving output:

- [ ] All categories present (if formal)
- [ ] Tone is encouraging + constructive
- [ ] Feedback is specific and actionable
- [ ] French language correct
- [ ] Student name correct

## Need More Help?

1. **Detailed examples:** See USAGE_EXAMPLES.md
2. **Full specification:** See marie-dance-evaluator.md
3. **Reference evaluations:** Check knowledgehub/domain/dance/marie/
4. **General agent info:** See .claude/agents/README.md

---

**Quick Start:** Just ask Claude Code to "use the marie-dance-evaluator agent to [create evaluation for student]"!
