# Marie Dance Evaluator Subagent - Implementation Complete

## Overview

Successfully created a specialized Claude Code subagent for Marie, the dance teacher, to review and evaluate hip-hop dance students following the APEXX Sport-Études program standards.

## What Was Created

### 1. Main Agent Specification
**File:** `.claude/agents/specialized/dance/marie-dance-evaluator.md`

A comprehensive 600+ line agent specification that:
- Defines expertise in hip-hop dance evaluation
- Implements APEXX 100-point rubric (8 categories)
- Provides French-language evaluation capability
- Includes constructive feedback guidelines
- References hip-hop terminology (bounce, rock, groove)
- Supports multiple output formats (formal/quick notes)

### 2. Usage Examples
**File:** `.claude/agents/specialized/dance/USAGE_EXAMPLES.md`

Detailed documentation covering:
- Task tool invocation examples
- 4 complete workflow scenarios
- Expected output formats
- Integration patterns with orchestration
- Advanced workflows (aggregation, comparison)
- Troubleshooting guide

### 3. Quick Reference
**File:** `.claude/agents/specialized/dance/QUICK_REFERENCE.md`

Fast-lookup guide with:
- Common commands
- Evaluation categories
- Hip-hop terminology table
- Key French phrases
- Quick troubleshooting
- Example prompts

### 4. Directory README
**File:** `.claude/agents/specialized/dance/README.md`

Overview documentation including:
- Agent purpose and capabilities
- Quick start guide
- Knowledge base structure
- Evaluation framework
- Integration examples
- Common workflows

### 5. Updated Main Agents README
**File:** `.claude/agents/README.md`

Added marie-dance-evaluator to the main agents list with proper categorization.

## Agent Capabilities

### Evaluation Types

1. **Formal Evaluations** (100-point APEXX format)
   - All 8 required categories
   - PDF-ready markdown output
   - Professional French language
   - Constructive, encouraging tone

2. **Quick Progress Notes**
   - Brief markdown format
   - Class observation notes
   - Informal feedback style
   - Fast progress tracking

3. **Batch Processing**
   - Multiple students in one request
   - Consistent evaluation standards
   - Personalized feedback for each
   - Systematic class-wide reviews

### Core Features

- **Language:** French (default, following APEXX standards)
- **Tone:** Encouraging + constructive
- **Terminology:** Authentic hip-hop vocabulary
- **Structure:** 8-category rubric (100 points total)
- **Flexibility:** Formal or informal formats
- **Scalability:** Single student or entire class

## Evaluation Framework (APEXX Rubric)

| Category | Points | Focus Area |
|----------|--------|------------|
| Expression artistique | 10 | Stage presence, confidence, expression |
| Coordination | 10 | Body awareness, fluidity |
| Effort | 10 | Commitment, intensity |
| Endurance | 10 | Stamina, energy management |
| Fondation (Bounce/Rock/Groove) | 30 | Hip-hop fundamentals |
| Musicalité | 10 | Musical connection, rhythm |
| Chorégraphie | 10 | Learning speed, performance |
| Application des corrections | 5 | Feedback receptiveness |
| Processus d'apprentissage | 5 | Class attitude, growth mindset |
| **TOTAL** | **100** | |

## Knowledge Base Integration

The agent references 26+ existing student evaluations:

### PDF Examples (Formal)
- `Leanne_Evaluation_Final.pdf`
- `Marianne_Evaluation_Final.pdf`
- `Kailua_Evaluation_Final.pdf`
- `Evaluation_HIPHOP_APEXX_Modifiable.pdf` (template)
- 5 more student PDFs

### Markdown Examples (Quick Notes)
- `note.md` (master notes file with 26 students)
- Individual files for 26 students
- Shows informal feedback style
- Demonstrates balanced observations

**Location:** `data/knowledgehub/domain/dance/marie/`

## How to Use

### Basic Usage

```bash
# Ask Claude Code:
"Use the marie-dance-evaluator agent to create a formal evaluation for Emma"
```

### With Observations

```bash
"Use marie-dance-evaluator to evaluate Leanne:
- Good bounce improvement, needs deeper levels
- Upper body tension in shoulders/neck
- Excellent coordination
- Needs more stage presence and confidence"
```

### Batch Processing

```bash
"Use marie-dance-evaluator to create evaluations for 10 students
using notes from class-observations.md"
```

### Programmatic (Task Tool)

```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Evaluate student Emma",
  prompt: `Create formal APEXX evaluation for Emma.

  Observations:
  - Bounce: 7/10 depth, good rhythm
  - Rock: explores directions, needs shoulder engagement
  - Coordination: excellent (9/10)
  - Expression: confident in moments, shy overall
  - Effort: full commitment (9/10)`
})
```

## Example Output

### Formal Evaluation (Excerpt)

```markdown
# ÉVALUATION HIPHOP – PROGRAMME SPORT-ÉTUDES APEXX

**Nom:** Leanne
**Date:** ____________________
**Évalué par:** ____________________

## Expression artistique / 10 :

Tu apportes une belle attitude en classe et une énergie positive. Continue
à développer ta présence : engage davantage ton regard, tes expressions
et ta confiance pour que ton interprétation soit plus claire et assumée.
Relâche la mâchoire et laisse ton visage être plus expressif dans ta danse.

## Coordination / 10 :

Ta coordination a beaucoup évolué. Pour gagner encore en fluidité, pense
à utiliser davantage la direction de ta tête et de ton cou dans tes
mouvements...

[... continues for all 8 categories ...]

**TOTAL:** ______ / 100
**Signature:** ____________________
```

### Quick Progress Note

```markdown
# Leanne

## Feedback

Good improvement in bounce keep dancing with head and neck let it move
and push the bounces deeper. Over all good needs to pop out more relax
upper body and dance with head the body is moving well and much improvement.
Take more solace in your dance and call more attention to you.
```

## Integration Points

### 1. Main Marie Agent
Can be called by Marie's main teaching agent when evaluation tasks are detected.

### 2. Orchestration System
Integrates with workflow JSON for batch evaluation processing.

### 3. Knowledgehub
References example evaluations for consistency and tone.

### 4. Direct Use
Can be invoked directly by users via Claude Code.

## Common Workflows

### Weekly Class Notes
After each class, create quick notes for students who need attention or showed significant progress.

### Mid-Term Reviews
Generate detailed progress reviews for students requiring extra focus or encouragement.

### End-of-Term Evaluations
Process entire class with formal 100-point evaluations for official records.

### Video Assessments
Evaluate student performance from video submissions for remote learning.

### Parent-Teacher Meetings
Prepare comprehensive evaluation materials for scheduled meetings.

## Quality Features

### Balanced Feedback
- Starts with strengths
- Identifies growth opportunities
- Provides actionable guidance
- Maintains encouraging tone

### Specific Observations
- References concrete movements
- Uses proper terminology
- Cites specific examples
- Avoids vague statements

### Personalization
- Tailored to each student
- References individual progress
- Acknowledges unique strengths
- Custom growth recommendations

### Professional Standards
- APEXX rubric compliance
- French language accuracy
- Constructive phrasing
- PDF-ready formatting

## File Structure

```
.claude/agents/specialized/dance/
├── marie-dance-evaluator.md        # Main agent (600+ lines)
├── USAGE_EXAMPLES.md               # Detailed workflows
├── QUICK_REFERENCE.md              # Fast lookup
└── README.md                       # Directory overview

data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                     # 26 student notes
│   └── students-reviews/           # Individual files
│       ├── leanne.md
│       ├── bile.md
│       ├── kailua.md
│       └── [23 more...]
└── pdfs/students-notes/
    ├── Leanne_Evaluation_Final.pdf
    ├── Marianne_Evaluation_Final.pdf
    ├── Evaluation_HIPHOP_APEXX_Modifiable.pdf
    └── [6 more...]

docs/
└── MARIE_DANCE_EVALUATOR_COMPLETE.md  # This file
```

## Benefits

### For Marie (Dance Teacher)
- Saves time on evaluation writing
- Maintains consistent standards
- Ensures balanced, constructive feedback
- Scales to entire class easily
- Professional French language
- APEXX-compliant format

### For Students
- Personalized, specific feedback
- Clear growth opportunities
- Encouraging tone
- Actionable guidance
- Professional documentation

### For Program (APEXX)
- Standardized evaluation format
- Consistent rubric application
- High-quality documentation
- Scalable across multiple teachers
- Easy integration with systems

## Technical Implementation

### Agent Type
Specialized Claude Code subagent using the Task tool

### Tool Access
- Read (reference examples)
- Write (generate evaluations)
- Edit (modify existing)
- Grep (search patterns)
- Glob (find files)

### Invocation
```javascript
Task({
  subagent_type: "marie-dance-evaluator",
  description: "Brief task description",
  prompt: "Detailed instructions and observations"
})
```

### Response
Returns complete markdown-formatted evaluation(s) ready for use or PDF conversion.

## Testing Checklist

- [x] Single student formal evaluation
- [x] Single student quick note
- [x] Batch processing (multiple students)
- [x] French language output verified
- [x] All 8 categories present in formal format
- [x] Constructive, encouraging tone maintained
- [x] Hip-hop terminology correct
- [x] Reference examples analyzed
- [x] Documentation complete

## Future Enhancements

Potential additions:

1. **Progress Tracking Agent**
   - Compare evaluations over time
   - Identify improvement trends
   - Generate progress reports

2. **Choreography Planner Agent**
   - Plan class choreography
   - Suggest movement sequences
   - Adapt to student levels

3. **Music Selector Agent**
   - Recommend music for classes
   - Match to style and level
   - Create playlists

4. **Class Planner Agent**
   - Design lesson plans
   - Structure class progression
   - Balance fundamentals and choreography

## Documentation Quick Links

| Document | Purpose |
|----------|---------|
| [marie-dance-evaluator.md](.claude/agents/specialized/dance/marie-dance-evaluator.md) | Complete specification |
| [USAGE_EXAMPLES.md](.claude/agents/specialized/dance/USAGE_EXAMPLES.md) | Workflow examples |
| [QUICK_REFERENCE.md](.claude/agents/specialized/dance/QUICK_REFERENCE.md) | Fast lookup |
| [README.md](.claude/agents/specialized/dance/README.md) | Directory overview |

## Success Criteria Met

✅ Analyzed 26+ existing evaluation examples
✅ Identified APEXX 100-point rubric structure
✅ Created comprehensive agent specification
✅ Documented multiple usage scenarios
✅ Provided quick reference materials
✅ Integrated with existing knowledge base
✅ Maintained French language standards
✅ Ensured encouraging, constructive tone
✅ Supported multiple output formats
✅ Enabled batch processing capability

## Conclusion

The Marie Dance Evaluator subagent is now fully operational and ready to help Marie create high-quality, consistent, and constructive student evaluations for the APEXX Sport-Études Hip-Hop program.

The agent successfully:
- Follows APEXX evaluation standards
- Produces professional French-language feedback
- Balances encouragement with growth opportunities
- Uses authentic hip-hop terminology
- Scales from single students to entire classes
- Integrates with existing knowledge base
- Provides flexible output formats

**Status:** ✅ Complete and ready for use

---

*Implementation Date: November 17, 2025*
*Agent Location: `.claude/agents/specialized/dance/marie-dance-evaluator.md`*
*Documentation: `.claude/agents/specialized/dance/`*
*Knowledge Base: `data/knowledgehub/domain/dance/marie/`*
