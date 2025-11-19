# Marie Agent Architecture

## System Architecture Overview

Marie operates within the CodeHornets-AI multi-agent orchestration system as a specialized worker agent. This document details the technical architecture, component interactions, and design patterns.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Component Breakdown](#component-breakdown)
- [Deployment Modes](#deployment-modes)
- [Data Flow](#data-flow)
- [File System Structure](#file-system-structure)
- [Communication Protocols](#communication-protocols)
- [Technical Specifications](#technical-specifications)
- [Design Patterns](#design-patterns)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CodeHornets-AI System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │ Orchestrator │────────▶│    Tasks     │                    │
│  │   (Anga)     │         │    Queue     │                    │
│  └──────────────┘         └──────┬───────┘                    │
│                                   │                             │
│                                   ▼                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Marie Worker                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐     │  │
│  │  │   Task     │  │  Processor │  │   Result     │     │  │
│  │  │  Monitor   │─▶│   Engine   │─▶│   Writer     │     │  │
│  │  └────────────┘  └────────────┘  └──────────────┘     │  │
│  │         │              │                  │             │  │
│  │         ▼              ▼                  ▼             │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │         Knowledge Base System                │     │  │
│  │  │  • Example Evaluations (33+ files)          │     │  │
│  │  │  • Dance Terminology                         │     │  │
│  │  │  • Template System                           │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                          │                                     │
│                          ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Persistent Workspace                       │  │
│  │  • Student Evaluations                                  │  │
│  │  • Class Documentation                                  │  │
│  │  • Choreography Files                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Task Monitor

**Location**: Core processing loop in Marie agent
**Technology**: Bash with inotify (preferred) or polling fallback
**Responsibility**: Detect new tasks in real-time

#### Implementation

```bash
# Primary: inotify-based monitoring (zero latency)
if command -v inotifywait >/dev/null 2>&1; then
  inotifywait -m -e create,moved_to /tasks/ --format '%f' 2>/dev/null | while read filename; do
    if [[ $filename == *.json ]]; then
      processTask "/tasks/$filename"
    fi
  done
else
  # Fallback: polling every 5 seconds
  while true; do
    for task_file in /tasks/*.json 2>/dev/null; do
      [ -e "$task_file" ] || continue
      processTask "$task_file"
    done
    sleep 5
  done
fi
```

#### Features

- **Real-time Detection**: inotify provides instant notification
- **Graceful Degradation**: Falls back to polling if inotify unavailable
- **Error Handling**: Silent failures, continuous operation
- **File Filtering**: Only processes `.json` files

### 2. Processor Engine

**Location**: Core Claude Code CLI instance
**Technology**: Claude Sonnet 4.5
**Responsibility**: Execute tasks using domain expertise

#### Capabilities

```javascript
{
  "task_types": [
    "student_evaluation",      // APEXX-based assessments
    "class_documentation",     // Class notes and observations
    "choreography_planning",   // Routine organization
    "studio_management",       // Scheduling and communication
    "parent_communication",    // Progress reports
    "recital_planning"         // Event coordination
  ],

  "tools": [
    "Read",      // File reading
    "Write",     // File creation
    "Bash",      // Shell commands
    "Grep"       // File searching
  ],

  "knowledge_sources": [
    "domains/DANCE.md",                           // Dance domain expertise
    "data/knowledgehub/domain/dance/marie/",     // Example evaluations
    "agents/Marie.md"                             // Agent configuration
  ]
}
```

#### Processing Workflow

```javascript
function processTask(taskFile) {
  // 1. Read task
  const taskContent = Read(taskFile);
  const task = JSON.parse(taskContent);

  // 2. Load context (from knowledge base)
  const examples = loadExamples(task.context.student_type);
  const terminology = loadDanceTerminology();

  // 3. Execute task
  let result;
  switch(task.type) {
    case 'evaluation':
      result = createEvaluation(task, examples);
      break;
    case 'class_notes':
      result = documentClass(task);
      break;
    case 'choreography':
      result = planChoreography(task);
      break;
  }

  // 4. Write result
  Write(`/results/${task.task_id}.json`, JSON.stringify(result));

  // 5. Create artifacts (files in workspace)
  if (result.artifacts) {
    result.artifacts.forEach(artifact => {
      Write(artifact.path, artifact.content);
    });
  }

  // 6. Cleanup
  Bash(`rm ${taskFile}`);

  return result;
}
```

### 3. Result Writer

**Location**: Part of processor engine
**Technology**: File system writes
**Responsibility**: Persist results and artifacts

#### Result Structure

```json
{
  "task_id": "task-1763412270-97486d25",
  "worker": "marie",
  "status": "complete",
  "timestamp_start": "2025-11-17T00:00:00Z",
  "timestamp_complete": "2025-11-17T00:05:00Z",
  "execution_time_seconds": 300,

  "findings": {
    "summary": "Brief overview of work completed",
    "details": [
      "Specific observation 1",
      "Specific observation 2",
      "Specific observation 3"
    ],
    "data": {
      "structured_metrics": "quantitative data"
    }
  },

  "artifacts": [
    {
      "type": "student-evaluation",
      "path": "/workspace/dance/evaluations/formal/Emma_Evaluation_2025-11-17.md",
      "description": "Formal APEXX evaluation",
      "format": "markdown"
    }
  ],

  "errors": [],

  "metadata": {
    "model": "claude-sonnet-4-5",
    "agent_version": "1.0",
    "confidence": 0.95
  }
}
```

### 4. Knowledge Base System

**Location**: `data/knowledgehub/domain/dance/marie/`
**Access Mode**: Read-only
**Responsibility**: Provide reference examples and terminology

#### Directory Structure

```
data/knowledgehub/domain/dance/marie/
├── markdown/
│   ├── note.md                          # Master reference (all students)
│   └── students-reviews/
│       ├── leanne.md                    # Example evaluation 1
│       ├── bile.md                      # Example evaluation 2
│       ├── kailua.md                    # Example evaluation 3
│       └── [30 more students...]        # 33 total examples
│
└── pdfs/
    └── students-notes/
        ├── Leanne_Evaluation_Final.pdf
        ├── Marianne_Evaluation_Final.pdf
        └── [7 more PDFs...]
```

#### Usage Pattern

```javascript
// Load examples before generating evaluation
function loadExamples(studentType = 'general') {
  const examples = [];

  // Read 2-3 representative examples
  examples.push(Read('data/knowledgehub/domain/dance/marie/markdown/students-reviews/leanne.md'));
  examples.push(Read('data/knowledgehub/domain/dance/marie/markdown/students-reviews/bile.md'));

  // Extract patterns
  const patterns = analyzeExamples(examples);

  return {
    tone: patterns.tone,              // Warm, encouraging
    structure: patterns.structure,    // Heading organization
    language: patterns.language,      // French phrasing
    terminology: patterns.terminology // Hip-hop terms
  };
}
```

### 5. Workspace Manager

**Location**: `/workspace/dance/`
**Access Mode**: Read/Write
**Responsibility**: Persistent storage of generated content

#### Directory Structure

```
/workspace/dance/
├── students/
│   └── [student-name]/
│       ├── profile.md
│       ├── progress-log.md
│       └── evaluations/
│           ├── 2025-11-17_formal.md
│           ├── 2025-11-10_quick-note.md
│           └── 2025-11-03_formal.md
│
├── class-notes/
│   └── YYYY-MM/
│       └── YYYY-MM-DD-[class-name].md
│
├── choreography/
│   └── [piece-name]/
│       ├── routine.md
│       ├── formations.md
│       └── teaching-plan.md
│
├── recitals/
│   └── [event-name]/
│       ├── overview.md
│       ├── schedule.md
│       └── costumes.md
│
└── evaluations/
    ├── formal/
    │   └── [Student]_Evaluation_YYYY-MM-DD.md
    ├── quick-notes/
    │   └── [student].md
    ├── batch/
    │   └── YYYY-MM-DD_batch_evaluations.md
    └── archive/
        └── YYYY/
            └── [archived-files].md
```

## Deployment Modes

### Mode 1: Standalone Interactive

**Use Case**: Direct teacher interaction
**Launch**: `make marie`
**Session**: Interactive terminal

```bash
# Setup
make marie

# Process
cd workspaces/dance/studio
claude

# Marie displays banner and starts interactive session
# Teacher types requests directly
# Results appear immediately in workspace
```

#### Configuration

```markdown
# workspaces/dance/studio/CLAUDE.md
You are Marie, a specialized dance teacher assistant...

## Session Startup
1. Display banner
2. Introduce capabilities
3. Wait for user request
```

### Mode 2: Orchestrated Worker

**Use Case**: Background task processing
**Launch**: `docker compose up marie -d`
**Session**: Detached container

```yaml
# core/docker-compose.yml
services:
  marie:
    image: docker/sandbox-templates:claude-code
    command: >
      bash -c "
      mkdir -p /home/agent/.claude/output-styles &&
      cp /output-styles/marie.md /home/agent/.claude/output-styles/marie.md &&
      echo '{\"outputStyle\": \"marie\"}' > /home/agent/.claude/settings.local.json &&
      claude
      "
    volumes:
      - ./shared/tasks/marie:/tasks:ro          # Task input
      - ./shared/results/marie:/results:rw      # Result output
      - ../workspaces/dance:/workspace/dance:rw # Workspace
      - ./shared/auth-homes/marie:/home/agent/.claude:rw # Auth
    restart: unless-stopped
```

#### Task Submission

```bash
#!/bin/bash
# send-task-to-marie.sh

TASK_ID="task-$(date +%s)-$(uuidgen)"
TASK_FILE="core/shared/tasks/marie/${TASK_ID}.json"

cat > "$TASK_FILE" << EOF
{
  "task_id": "$TASK_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "worker": "marie",
  "priority": "high",
  "description": "$1",
  "context": {},
  "requirements": [],
  "expected_output": {
    "format": "markdown",
    "artifacts": ["evaluation"]
  }
}
EOF

echo "Task submitted: $TASK_ID"
```

### Mode 3: MCP API Server

**Use Case**: Programmatic integration
**Launch**: MCP server process
**Session**: API endpoint

```typescript
// Potential MCP server structure
interface MarieServer {
  tools: {
    marie_introduce(): BannerResponse;
    marie_evaluate(request: EvaluationRequest): EvaluationResult;
    marie_document(request: DocumentRequest): DocumentResult;
    marie_status(taskId: string): TaskStatus;
  }
}
```

## Data Flow

### Evaluation Workflow

```
┌────────────┐
│   User     │
│  Request   │
└─────┬──────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│                  Task Creation                      │
│  • Generate task ID                                 │
│  • Structure request as JSON                        │
│  • Write to /tasks/                                 │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│               Task Detection                        │
│  • inotify event OR polling discovery               │
│  • Read task file                                   │
│  • Parse JSON                                       │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│            Context Loading                          │
│  • Read example evaluations (2-3 files)             │
│  • Load dance terminology                           │
│  • Extract tone/structure patterns                  │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│           Evaluation Generation                     │
│  • Apply APEXX framework                            │
│  • Use French language                              │
│  • Follow learned patterns                          │
│  • Generate detailed observations                   │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│            Artifact Creation                        │
│  • Write evaluation to workspace                    │
│  • Format as markdown                               │
│  • Save in appropriate directory                    │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│            Result Generation                        │
│  • Create result JSON                               │
│  • Include findings summary                         │
│  • List artifacts created                           │
│  • Write to /results/                               │
└─────┬───────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│               Cleanup                               │
│  • Remove task file                                 │
│  • Log completion                                   │
│  • Resume monitoring                                │
└─────────────────────────────────────────────────────┘
```

## File System Structure

### Container File System

```
/home/agent/                           # Container user home
├── .claude/                           # Claude Code config
│   ├── .credentials.json              # Auth token
│   ├── settings.json                  # Base settings
│   ├── settings.local.json            # Output style override
│   ├── output-styles/
│   │   └── marie.md                   # Marie personality
│   └── history.jsonl                  # Conversation history
│
├── workspace/                         # Container workspace (ephemeral)
│   └── CLAUDE.md                      # Agent configuration
│
/tasks/                                # Task input (read-only mount)
├── task-1234567890-abc123.json
└── task-1234567891-def456.json
│
/results/                              # Result output (read-write mount)
├── task-1234567890-abc123.json
└── task-1234567891-def456.json
│
/workspace/dance/                      # Persistent workspace (read-write mount)
├── students/
├── evaluations/
├── class-notes/
└── choreography/
```

### Host File System

```
codehornets-ai/
├── core/
│   ├── prompts/
│   │   ├── agents/
│   │   │   └── Marie.md                # Agent spec
│   │   └── domains/
│   │       └── DANCE.md                 # Domain knowledge
│   │
│   ├── output-styles/
│   │   └── marie.md                     # Output customization
│   │
│   ├── shared/
│   │   ├── auth-homes/
│   │   │   └── marie/                   # Auth persistence
│   │   ├── tasks/
│   │   │   └── marie/                   # Task queue
│   │   ├── results/
│   │   │   └── marie/                   # Result queue
│   │   └── workspaces/
│   │       └── marie/                   # Container workspace
│   │
│   └── docker-compose.yml               # Container orchestration
│
├── workspaces/
│   └── dance/
│       └── studio/                      # Persistent workspace
│           ├── CLAUDE.md
│           ├── students/
│           ├── evaluations/
│           └── class-notes/
│
└── data/
    └── knowledgehub/
        └── domain/
            └── dance/
                └── marie/               # Knowledge base (read-only)
```

## Communication Protocols

### Task Format Specification

```typescript
interface Task {
  task_id: string;              // "task-{timestamp}-{uuid}"
  timestamp: string;            // ISO 8601 UTC
  worker: "marie";              // Target worker
  priority: "low" | "normal" | "high" | "urgent";

  description: string;          // Human-readable task description

  context: {
    student_name?: string;
    class_name?: string;
    date?: string;
    observations?: string[];
    [key: string]: any;
  };

  requirements: string[];       // Specific requirements

  expected_output: {
    format: "markdown" | "json" | "pdf";
    artifacts: string[];        // Expected artifact types
  };

  timeout_seconds?: number;     // Default: 600
}
```

### Result Format Specification

```typescript
interface Result {
  task_id: string;              // Matches task ID
  worker: "marie";              // Worker identifier
  status: "complete" | "error" | "partial";

  timestamp_start: string;      // ISO 8601 UTC
  timestamp_complete: string;   // ISO 8601 UTC
  execution_time_seconds: number;

  findings: {
    summary: string;            // Brief overview
    details: string[];          // Detailed observations
    data?: Record<string, any>; // Structured data
  };

  artifacts: Array<{
    type: string;               // "student-evaluation", etc.
    path: string;               // Absolute path to file
    description: string;        // What this artifact contains
    format: string;             // "markdown", "pdf", etc.
  }>;

  errors: Array<{
    message: string;
    type: string;
    details?: string;
  }>;

  metadata?: {
    model: string;              // "claude-sonnet-4-5"
    agent_version: string;      // "1.0"
    confidence?: number;        // 0.0 - 1.0
  };
}
```

## Technical Specifications

### System Requirements

**Host Machine**:
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space
- Linux kernel with inotify support (optional but recommended)

**Container**:
- Base image: `docker/sandbox-templates:claude-code`
- Memory limit: 2GB
- CPU limit: 2 cores
- Storage: 5GB persistent volumes

### Performance Characteristics

**Task Processing**:
- Detection latency: <100ms (inotify) or ~5s (polling)
- Evaluation generation: 30-60 seconds
- File writing: <1 second
- Total task time: 45-90 seconds

**Concurrency**:
- Tasks processed: Sequential (one at a time)
- Max queue size: Unlimited (file system limited)
- Backlog handling: FIFO order

**Reliability**:
- Container restart: Automatic (`restart: unless-stopped`)
- Task recovery: Resumes processing on restart
- Error handling: Graceful degradation, continues monitoring

### Security Considerations

**Authentication**:
- Claude Code web auth required
- Credentials stored in `.credentials.json`
- Token rotation handled by CLI

**File Permissions**:
- Tasks directory: Read-only from container
- Results directory: Read-write
- Workspace: Read-write
- Knowledge base: Read-only

**Network**:
- Internal bridge network for multi-agent communication
- No exposed ports (file-based communication only)
- Outbound HTTPS for Claude API

## Design Patterns

### Pattern 1: Knowledge Base Separation

**Problem**: Generated content pollutes reference examples
**Solution**: Strict read-only input, write-only output

```javascript
// NEVER do this
const INPUT_OUTPUT_DIR = "data/knowledgehub/"; // ❌

// ALWAYS do this
const INPUT_DIR = "data/knowledgehub/domain/dance/marie/";  // Read-only
const OUTPUT_DIR = "workspaces/dance/studio/evaluations/";  // Write-only
```

### Pattern 2: Template-Based Learning

**Problem**: Inconsistent evaluation quality
**Solution**: Learn from curated examples

```javascript
function generateEvaluation(student, observations) {
  // 1. Load examples
  const examples = loadKnowledgeBase(student.type);

  // 2. Extract patterns
  const patterns = {
    tone: extractTone(examples),
    structure: extractStructure(examples),
    language: extractLanguagePatterns(examples)
  };

  // 3. Apply patterns
  return applyPatternsToObservations(observations, patterns);
}
```

### Pattern 3: Graceful Degradation

**Problem**: System failures break workflow
**Solution**: Fallbacks at every level

```javascript
// Monitoring: inotify → polling
if (hasInotify) {
  useInotify();
} else {
  usePolling();
}

// Examples: multiple → single → none
let examples = loadAllExamples();
if (!examples.length) {
  examples = loadDefaultExample();
}
if (!examples.length) {
  examples = useBuiltInTemplate();
}
```

### Pattern 4: Immutable Knowledge Base

**Problem**: Reference data gets corrupted
**Solution**: Read-only mounts and clear documentation

```yaml
# Docker Compose - read-only mount
volumes:
  - ./data/knowledgehub:/knowledgehub:ro  # ✅ Read-only
```

```markdown
# Documentation - clear warnings
**CRITICAL: Never write to data/knowledgehub/ - READ ONLY!**
```

### Pattern 5: Self-Describing Artifacts

**Problem**: Files created without context
**Solution**: Embedded metadata in markdown

```markdown
---
type: student-evaluation
student: Emma Rodriguez
date: 2025-11-17
evaluator: marie
methodology: APEXX
language: French
version: 1.0
---

# Évaluation: Emma Rodriguez

[Evaluation content...]
```

## Extension Points

### Adding New Task Types

1. Define task structure in task spec
2. Add processing function to processor engine
3. Create output template in workspace
4. Update result format if needed
5. Document in EXAMPLES.md

### Custom Output Formats

1. Create formatter function
2. Add to artifact generation
3. Update expected_output schema
4. Test with example tasks

### Integration with External Systems

1. Implement result polling mechanism
2. Parse result JSON
3. Extract artifacts from workspace
4. Transform to target system format
5. Handle errors and retries

## Troubleshooting Architecture

### Issue: Tasks Not Being Detected

**Diagnosis**:
```bash
# Check if inotify is available
command -v inotifywait

# Check task directory
ls -la /tasks/

# Check file permissions
stat /tasks/
```

**Solutions**:
- Install inotify-tools: `apt-get install inotify-tools`
- Verify mount permissions in docker-compose.yml
- Check container logs: `docker logs marie`

### Issue: Results Not Written

**Diagnosis**:
```bash
# Check results directory permissions
ls -la /results/

# Check disk space
df -h

# Check processing logs
docker exec marie tail -f /workspace/dance/logs/errors.log
```

**Solutions**:
- Fix mount permissions (should be `rw`)
- Free up disk space
- Check for write errors in logs

### Issue: Poor Evaluation Quality

**Diagnosis**:
- Check if examples are loaded
- Verify knowledge base mount
- Review example file quality

**Solutions**:
- Ensure knowledge base is properly mounted
- Add more high-quality examples
- Verify French language patterns

## Conclusion

Marie's architecture is designed for:

- **Reliability**: Automatic restart, graceful degradation
- **Flexibility**: Multiple deployment modes
- **Quality**: Template-based learning from examples
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Well-defined extension points

For implementation examples, see [EXAMPLES.md](./EXAMPLES.md).
For knowledge base details, see [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md).

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: CodeHornets-AI Team
