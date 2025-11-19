# Marie Memory & Context System

## Overview

Marie's memory system enables consistent, high-quality output by learning from curated examples while maintaining strict separation between reference knowledge and generated content. This document details how context works, how learning happens, and how to maintain the knowledge base.

## Table of Contents

- [Memory Architecture](#memory-architecture)
- [Knowledge Base Structure](#knowledge-base-structure)
- [Learning Mechanisms](#learning-mechanisms)
- [Context Loading](#context-loading)
- [Pattern Extraction](#pattern-extraction)
- [Input/Output Separation](#inputoutput-separation)
- [Knowledge Maintenance](#knowledge-maintenance)
- [Performance Optimization](#performance-optimization)

## Memory Architecture

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────┐
│                   Marie Memory System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Read-Only Knowledge Base                   │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Example    │  │    Domain    │               │    │
│  │  │ Evaluations  │  │  Knowledge   │               │    │
│  │  │  (33 files)  │  │  (DANCE.md)  │               │    │
│  │  └──────┬───────┘  └──────┬───────┘               │    │
│  │         │                  │                        │    │
│  │         └──────────┬───────┘                        │    │
│  │                    │                                 │    │
│  └────────────────────┼─────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Pattern Extraction Engine                 │    │
│  │                                                     │    │
│  │  • Tone Analysis                                   │    │
│  │  • Structure Mapping                               │    │
│  │  • Language Patterns                               │    │
│  │  • Terminology Usage                               │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │           In-Session Context                       │    │
│  │                                                     │    │
│  │  • Current task                                    │    │
│  │  • Loaded examples (2-3)                           │    │
│  │  • Extracted patterns                              │    │
│  │  • Domain knowledge                                │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Generation Engine                         │    │
│  │                                                     │    │
│  │  • Apply patterns                                  │    │
│  │  • Use terminology                                 │    │
│  │  • Follow structure                                │    │
│  │  • Match tone                                      │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Write-Only Workspace                        │    │
│  │                                                     │    │
│  │  • Generated evaluations                           │    │
│  │  • Class notes                                     │    │
│  │  • Choreography docs                               │    │
│  │  (NEVER pollutes knowledge base)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Memory Types

#### 1. Static Knowledge (Read-Only)

**Location**: `data/knowledgehub/domain/dance/marie/`
**Persistence**: Permanent (version controlled)
**Purpose**: Reference examples and domain expertise

**Components**:
- Example evaluations (33 markdown files)
- PDF formal evaluations (8 files)
- Dance terminology database
- Master student notes

#### 2. Domain Knowledge (Embedded)

**Location**: `core/prompts/domains/DANCE.md`
**Persistence**: Embedded in agent configuration
**Purpose**: Dance education expertise

**Components**:
- Dance terminology (ballet, jazz, hip-hop)
- Teaching methodologies
- Assessment frameworks (APEXX)
- Student development patterns

#### 3. Session Context (Volatile)

**Location**: In-memory during task processing
**Persistence**: Duration of single task
**Purpose**: Active working memory

**Components**:
- Current task details
- Loaded examples (2-3 files)
- Extracted patterns
- Generation state

#### 4. Generated Knowledge (Write-Only)

**Location**: `workspaces/dance/studio/`
**Persistence**: Permanent (never read as examples)
**Purpose**: Output artifacts

**Components**:
- Student evaluations
- Class documentation
- Progress logs
- Choreography notes

## Knowledge Base Structure

### Directory Layout

```
data/knowledgehub/domain/dance/marie/
│
├── markdown/
│   │
│   ├── note.md                          # Master reference (all students)
│   │   │
│   │   ├── Content: Comprehensive student notes
│   │   ├── Format: French markdown
│   │   ├── Usage: Overview of all students
│   │   └── Size: ~5000 lines
│   │
│   └── students-reviews/
│       │
│       ├── leanne.md                    # Example 1: Advanced student
│       ├── bile.md                      # Example 2: Intermediate
│       ├── kailua.md                    # Example 3: Beginner
│       ├── marianne.md
│       ├── sofia.md
│       ├── emma.md
│       └── [27 more students...]
│           │
│           ├── Content: Individual evaluations
│           ├── Format: French with APEXX scores
│           ├── Tone: Warm, encouraging, specific
│           └── Structure: Standardized sections
│
└── pdfs/
    └── students-notes/
        │
        ├── Leanne_Evaluation_Final.pdf
        ├── Marianne_Evaluation_Final.pdf
        ├── Sofia_Evaluation_Final.pdf
        └── [5 more PDFs...]
            │
            ├── Content: Formal APEXX evaluations
            ├── Format: Professional PDF layout
            └── Usage: Visual format reference
```

### Example File Structure

#### Example Evaluation (markdown/students-reviews/leanne.md)

```markdown
# Leanne - Évaluation Hip-Hop

## Attitude (18/20)
Leanne démontre une attitude exceptionnelle en classe...

## Posture (16/20)
Sa posture est généralement bonne, avec un bon alignement...

## Énergie (17/20)
L'énergie de Leanne est contagieuse...

## Expression (15/20)
Elle commence à développer sa propre expression...

## Exécution (16/20)
Techniquement, Leanne exécute les mouvements avec précision...

## Score Total: 82/100

## Observations
- Point fort: Coordination et rythme
- À travailler: Confiance dans les improvisations
- Recommandations: Continue le niveau intermédiaire

## Prochaines Étapes
1. Exercices d'improvisation guidée
2. Travail sur les transitions rapides
3. Exploration de différents styles musicaux
```

#### Pattern Elements

From this example, Marie extracts:

**Tone Patterns**:
- "démontre une attitude exceptionnelle" (positive framing)
- "généralement bonne" (encouraging but honest)
- "commence à développer" (growth-oriented)

**Structure Pattern**:
1. Student name heading
2. APEXX sections with scores
3. Total score
4. Observations (strengths, areas to work on)
5. Next steps (actionable items)

**Language Pattern**:
- French language throughout
- Second person ("Leanne démontre...")
- Present tense
- Specific observations with examples

**Terminology Pattern**:
- "alignement" (posture)
- "coordination et rythme" (technical skills)
- "improvisations" (dance concept)
- "transitions" (choreography term)

## Learning Mechanisms

### 1. Example Selection

When processing a task, Marie selects relevant examples:

```python
def selectExamples(task_context):
    """
    Select 2-3 most relevant examples for current task
    """
    examples = []

    # Strategy 1: Match student level
    if task_context.student_level == "advanced":
        examples.append(loadExample("leanne.md"))  # Advanced example
    elif task_context.student_level == "intermediate":
        examples.append(loadExample("bile.md"))    # Intermediate example
    else:
        examples.append(loadExample("kailua.md"))  # Beginner example

    # Strategy 2: Match evaluation type
    if task_context.evaluation_type == "formal":
        examples.append(loadPDF("Leanne_Evaluation_Final.pdf"))

    # Strategy 3: Always include a general reference
    examples.append(loadExample("marianne.md"))  # Well-rounded example

    return examples
```

### 2. Pattern Extraction

From selected examples, extract reusable patterns:

```python
def extractPatterns(examples):
    """
    Analyze examples and extract patterns
    """
    patterns = {
        "tone": analyzeTone(examples),
        "structure": analyzeStructure(examples),
        "language": analyzeLanguage(examples),
        "terminology": extractTerminology(examples)
    }

    return patterns

def analyzeTone(examples):
    """
    Extract tone patterns from examples
    """
    return {
        "positive_framing": [
            "démontre une attitude exceptionnelle",
            "montre de grands progrès",
            "possède un talent naturel"
        ],
        "constructive_feedback": [
            "pourrait améliorer",
            "avec plus de pratique",
            "continue de travailler sur"
        ],
        "encouraging_language": [
            "en bonne voie",
            "fait des efforts remarquables",
            "sur la bonne trajectoire"
        ]
    }

def analyzeStructure(examples):
    """
    Extract structural patterns
    """
    return {
        "sections": [
            "Titre avec nom de l'élève",
            "APEXX components (5 sections)",
            "Score total (/100)",
            "Observations détaillées",
            "Prochaines étapes"
        ],
        "scoring": {
            "scale": "X/20 for each component",
            "total": "/100",
            "display": "Score Total: XX/100"
        }
    }

def analyzeLanguage(examples):
    """
    Extract language patterns
    """
    return {
        "primary_language": "French",
        "person": "third person (elle/il) or name",
        "tense": "present",
        "sentence_structure": "Subject-Verb-Complement",
        "formality": "professional but warm"
    }

def extractTerminology(examples):
    """
    Build terminology database from examples
    """
    terminology = {
        "posture": ["alignement", "équilibre", "placement"],
        "movement": ["coordination", "fluidité", "précision"],
        "rhythm": ["rythme", "musicalité", "tempo"],
        "expression": ["expression", "interprétation", "émotion"],
        "technique": ["exécution", "technique", "contrôle"]
    }

    return terminology
```

### 3. Pattern Application

Apply extracted patterns to new content:

```python
def generateEvaluation(student, observations, patterns):
    """
    Generate evaluation using learned patterns
    """
    evaluation = {
        "title": f"# {student.name} - Évaluation Hip-Hop\n\n",
        "sections": [],
        "total_score": 0
    }

    # Apply APEXX structure
    apexx_components = ["Attitude", "Posture", "Énergie", "Expression", "Exécution"]

    for component in apexx_components:
        score = calculateScore(observations, component)
        evaluation["sections"].append(
            generateSection(
                component=component,
                score=score,
                observations=observations,
                tone_patterns=patterns["tone"],
                language_patterns=patterns["language"],
                terminology=patterns["terminology"]
            )
        )
        evaluation["total_score"] += score

    # Add observations section
    evaluation["sections"].append(
        generateObservations(
            observations,
            patterns["tone"]["constructive_feedback"]
        )
    )

    # Add next steps
    evaluation["sections"].append(
        generateNextSteps(
            observations,
            patterns["tone"]["encouraging_language"]
        )
    )

    return formatEvaluation(evaluation)

def generateSection(component, score, observations, tone_patterns, language_patterns, terminology):
    """
    Generate a single APEXX section
    """
    # Select relevant terminology
    terms = terminology.get(component.lower(), [])

    # Build content using patterns
    content = f"## {component} ({score}/20)\n\n"

    # Use tone patterns for positive framing
    if score >= 16:
        opening = random.choice(tone_patterns["positive_framing"])
    elif score >= 12:
        opening = "montre de bons progrès en"
    else:
        opening = "continue de développer"

    # Use language patterns (third person, present tense)
    content += f"{student.name} {opening} {component.lower()}...\n\n"

    # Add specific observations using relevant terminology
    for obs in observations[component]:
        content += f"- {obs}\n"

    return content
```

## Context Loading

### Loading Strategy

```python
class ContextLoader:
    """
    Manages context loading for task processing
    """

    def __init__(self):
        self.knowledge_base_path = "data/knowledgehub/domain/dance/marie/"
        self.domain_knowledge_path = "core/prompts/domains/DANCE.md"

    def loadContextForTask(self, task):
        """
        Load all relevant context for a task
        """
        context = {
            "examples": self.loadExamples(task),
            "domain_knowledge": self.loadDomainKnowledge(),
            "patterns": None  # Will be extracted from examples
        }

        # Extract patterns from loaded examples
        context["patterns"] = self.extractPatterns(context["examples"])

        return context

    def loadExamples(self, task):
        """
        Load 2-3 relevant example evaluations
        """
        examples = []

        # Load based on task type
        if task.type == "formal_evaluation":
            # Load formal examples
            examples.append(
                self.loadFile(f"{self.knowledge_base_path}/markdown/students-reviews/leanne.md")
            )
            examples.append(
                self.loadFile(f"{self.knowledge_base_path}/pdfs/students-notes/Leanne_Evaluation_Final.pdf")
            )
        elif task.type == "quick_note":
            # Load informal examples
            examples.append(
                self.loadFile(f"{self.knowledge_base_path}/markdown/students-reviews/bile.md")
            )

        # Always include a general reference
        examples.append(
            self.loadFile(f"{self.knowledge_base_path}/markdown/note.md")
        )

        return examples

    def loadDomainKnowledge(self):
        """
        Load dance domain expertise
        """
        return self.loadFile(self.domain_knowledge_path)

    def loadFile(self, path):
        """
        Read file content
        """
        return Read(path)
```

### Context Size Management

To avoid token overflow:

```python
def optimizeContextSize(context):
    """
    Trim context to essential information
    """
    optimized = {
        "examples": [],
        "patterns": context["patterns"],
        "domain_knowledge": summarizeDomainKnowledge(context["domain_knowledge"])
    }

    # Load only most relevant portions of examples
    for example in context["examples"]:
        optimized["examples"].append(
            extractRelevantSections(example, max_length=1000)
        )

    return optimized

def extractRelevantSections(example, max_length):
    """
    Extract most relevant sections from example
    """
    # Priority sections
    sections = [
        "Attitude",
        "Observations",
        "Prochaines Étapes"
    ]

    relevant = ""
    for section in sections:
        section_content = extractSection(example, section)
        if len(relevant) + len(section_content) < max_length:
            relevant += section_content

    return relevant
```

## Pattern Extraction

### Tone Analysis

```python
def analyzeTonePatterns(examples):
    """
    Extract tone patterns from examples
    """
    patterns = {
        "positive": [],
        "constructive": [],
        "encouraging": []
    }

    for example in examples:
        # Find positive phrases
        patterns["positive"].extend(
            findPhrases(example, sentiment="positive")
        )

        # Find constructive feedback phrases
        patterns["constructive"].extend(
            findPhrases(example, context="improvement")
        )

        # Find encouraging phrases
        patterns["encouraging"].extend(
            findPhrases(example, context="motivation")
        )

    # Deduplicate and score by frequency
    for category in patterns:
        patterns[category] = rankByFrequency(patterns[category])

    return patterns
```

### Structure Analysis

```python
def analyzeStructurePatterns(examples):
    """
    Extract structural patterns
    """
    structures = []

    for example in examples:
        structure = {
            "sections": extractSections(example),
            "heading_levels": extractHeadingLevels(example),
            "list_formats": extractListFormats(example),
            "scoring_format": extractScoringFormat(example)
        }
        structures.append(structure)

    # Find consensus structure
    consensus = findConsensusStructure(structures)

    return consensus
```

### Language Pattern Analysis

```python
def analyzeLanguagePatterns(examples):
    """
    Extract language patterns
    """
    patterns = {
        "sentence_structures": [],
        "common_phrases": [],
        "transition_words": [],
        "verb_forms": []
    }

    for example in examples:
        patterns["sentence_structures"].extend(
            extractSentenceStructures(example)
        )
        patterns["common_phrases"].extend(
            extractCommonPhrases(example, min_frequency=2)
        )
        patterns["transition_words"].extend(
            extractTransitionWords(example)
        )
        patterns["verb_forms"].extend(
            extractVerbForms(example)
        )

    # Analyze and summarize
    return summarizePatterns(patterns)
```

## Input/Output Separation

### Critical Principle

**NEVER write generated content to knowledge base**

This is enforced through:

1. **Read-only mounts** (Docker)
2. **Clear path separation** (code)
3. **Documentation warnings** (all docs)
4. **Validation checks** (optional)

### Enforcement Mechanisms

#### Docker Mount Protection

```yaml
# core/docker-compose.yml
services:
  marie:
    volumes:
      # Knowledge base: READ ONLY
      - ./data/knowledgehub:/knowledgehub:ro  # Note the :ro flag

      # Workspace: READ WRITE
      - ../workspaces/dance:/workspace/dance:rw  # Note the :rw flag
```

#### Code Path Validation

```python
def validateOutputPath(path):
    """
    Ensure output path is not in knowledge base
    """
    forbidden_paths = [
        "data/knowledgehub/",
        "/knowledgehub/"
    ]

    for forbidden in forbidden_paths:
        if forbidden in path:
            raise ValueError(
                f"CRITICAL ERROR: Attempted to write to knowledge base!\n"
                f"Path: {path}\n"
                f"Knowledge base is READ ONLY.\n"
                f"Use workspace path: /workspace/dance/evaluations/"
            )

    return True

def writeEvaluation(content, student_name, date):
    """
    Write evaluation with path validation
    """
    # Correct path
    path = f"/workspace/dance/evaluations/formal/{student_name}_Evaluation_{date}.md"

    # Validate before writing
    validateOutputPath(path)

    # Safe to write
    Write(path, content)
```

### Why Separation Matters

#### Problem: Knowledge Pollution

Without separation:

```
Day 1: Generate evaluation using high-quality examples
        ↓
Day 2: New evaluation saved to knowledge base
        ↓
Day 3: New evaluation is now used as example
        ↓
Day 4: Quality degrades (learning from AI-generated content)
        ↓
Day 5: Further degradation (feedback loop)
        ↓
Day N: Poor quality, lost original patterns
```

#### Solution: Strict Separation

With separation:

```
Day 1: Generate evaluation using high-quality examples
        ↓ (saved to workspace, not knowledge base)
Day 2: Generate evaluation using same high-quality examples
        ↓ (saved to workspace, not knowledge base)
Day 3: Generate evaluation using same high-quality examples
        ↓ (consistent quality maintained)
Day N: Same high quality (no degradation)
```

## Knowledge Maintenance

### Adding New Examples

To add new high-quality examples to knowledge base:

```bash
# 1. Create or obtain high-quality evaluation
# 2. Review for quality
# 3. Add to knowledge base (as curator, not as Marie)

# Add new example
cp new_high_quality_evaluation.md \
   data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Commit to version control
git add data/knowledgehub/domain/dance/marie/
git commit -m "Add new reference evaluation for [student-type]"
```

### Quality Criteria for Examples

Examples should be:

- **Accurate**: Factually correct dance terminology
- **Well-structured**: Follow APEXX format
- **Well-written**: French language, professional tone
- **Specific**: Concrete observations, not vague
- **Encouraging**: Warm and supportive
- **Actionable**: Clear next steps

### Removing Poor Examples

```bash
# If an example is low quality
rm data/knowledgehub/domain/dance/marie/markdown/students-reviews/poor_example.md

# Commit removal
git commit -m "Remove low-quality example (reason: vague observations)"
```

### Updating Domain Knowledge

```bash
# Edit domain knowledge
nano core/prompts/domains/DANCE.md

# Add new terminology
# Update teaching methods
# Refine assessment frameworks

# Restart Marie to load new knowledge
docker restart marie
```

## Performance Optimization

### Example Loading Optimization

```python
# Don't load all examples
all_examples = loadAllExamples()  # ❌ Slow, high token usage

# Load only 2-3 relevant examples
relevant_examples = selectRelevantExamples(task, max_count=3)  # ✅ Fast, efficient
```

### Pattern Caching

```python
# Cache extracted patterns (if session persists)
class PatternCache:
    def __init__(self):
        self.cache = {}

    def getPatterns(self, example_set_id):
        if example_set_id not in self.cache:
            examples = loadExamples(example_set_id)
            self.cache[example_set_id] = extractPatterns(examples)
        return self.cache[example_set_id]
```

### Selective Loading

```python
# Load only needed sections
def loadExampleSections(file_path, sections):
    """
    Load only specific sections from example
    """
    content = Read(file_path)
    relevant = ""

    for section in sections:
        section_content = extractSection(content, section)
        relevant += section_content

    return relevant

# Usage
attitude_examples = loadExampleSections(
    "leanne.md",
    sections=["Attitude", "Observations"]
)
```

## Best Practices

### For Users

1. **Never edit knowledge base manually** (use curator process)
2. **Review generated content** (don't add to knowledge base)
3. **Request improvements** (if quality issues, update examples)
4. **Organize workspace** (clean up old evaluations)

### For Developers

1. **Always validate output paths** (prevent knowledge pollution)
2. **Load minimal examples** (2-3 files maximum)
3. **Extract patterns efficiently** (cache when possible)
4. **Test with various examples** (ensure pattern extraction works)
5. **Document knowledge base changes** (version control)

### For Administrators

1. **Curate knowledge base carefully** (high-quality examples only)
2. **Monitor workspace growth** (archive old evaluations)
3. **Version control knowledge base** (track changes)
4. **Backup regularly** (prevent data loss)
5. **Review generated content periodically** (quality checks)

## Conclusion

Marie's memory system enables:

- **Consistent Quality**: Learning from curated examples
- **Language Accuracy**: French patterns from native content
- **Structural Consistency**: Standardized evaluation format
- **Knowledge Protection**: Strict input/output separation
- **Performance**: Efficient context loading

The separation of read-only knowledge base and write-only workspace is critical for maintaining quality over time.

For implementation examples, see [EXAMPLES.md](./EXAMPLES.md).

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: CodeHornets-AI Team
