# CodeHornets-AI: Marie Agent Architecture Analysis

**Analysis Date**: 2025-11-18
**System Version**: Current production state
**Focus**: Marie (Dance Expert) agent integration and improvements

---

## Executive Summary

The CodeHornets-AI system implements a **file-based orchestration pattern** where multiple specialized Claude Code CLI agents communicate through JSON task/result files. Marie, the dance expert agent, operates as an autonomous worker monitoring a task queue and processing dance-related requests.

**Key Findings**:
- ✅ Clean separation of concerns through file-based communication
- ✅ Docker containerization provides isolation and persistence
- ⚠️ Limited context persistence across container restarts
- ⚠️ No task history or learning mechanism
- ⚠️ Memory management relies solely on workspace files
- 🔧 Opportunities for MCP integration and enhanced memory systems

---

## 1. Current Architecture: Marie Agent Data Flow

### 1.1 Complete Data Flow Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR                                   │
│  Container: orchestrator                                                 │
│  Prompt: core/prompts/orchestrator.md                                   │
│  Role: Decomposes user requests → Creates tasks → Synthesizes results   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 1. Create task JSON
                             │
                             ▼
           ┌─────────────────────────────────────────────┐
           │     TASK QUEUE (File-based)                 │
           │     Location: core/shared/tasks/marie/      │
           │     Format: task-{timestamp}-{uuid}.json    │
           │     Mounted: Read-only to Marie             │
           └─────────────────┬───────────────────────────┘
                             │
                             │ 2. inotify/polling detection
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARIE AGENT                                      │
│  Container: marie                                                        │
│  Image: docker/sandbox-templates:claude-code                            │
│  Prompt: core/prompts/agents/Marie.md                                   │
│  Output Style: core/output-styles/marie.md                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TASK PROCESSING LOOP                                            │  │
│  │                                                                   │  │
│  │  1. Monitor: /tasks/*.json (inotify or 5s polling)              │  │
│  │  2. Read: Parse task JSON                                        │  │
│  │  3. Execute: Apply dance expertise from CLAUDE.md               │  │
│  │  4. Create: Generate evaluation/choreography/notes              │  │
│  │  5. Write: Result JSON to /results/{task-id}.json               │  │
│  │  6. Cleanup: Delete processed task file                          │  │
│  │  7. Repeat                                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Volume Mounts:                                                          │
│  • /tasks → core/shared/tasks/marie (ro)                                │
│  • /results → core/shared/results/marie (rw)                            │
│  • /workspace/dance → workspaces/dance (rw) ← PERSISTENT               │
│  • /home/agent/.claude → core/shared/auth-homes/marie (rw)             │
│  • /home/agent/workspace → core/shared/workspaces/marie (rw)           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ 3. Write result + artifacts
                             │
                             ▼
           ┌─────────────────────────────────────────────┐
           │     RESULT QUEUE (File-based)               │
           │     Location: core/shared/results/marie/    │
           │     Format: task-{timestamp}-{uuid}.json    │
           │     Mounted: Read-only to Orchestrator      │
           └─────────────────┬───────────────────────────┘
                             │
                             │ 4. Read results + artifacts
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR                                   │
│  • Collects all worker results                                          │
│  • Synthesizes findings                                                  │
│  • Responds to user                                                      │
└─────────────────────────────────────────────────────────────────────────┘


PERSISTENT ARTIFACTS (survive restart):
┌────────────────────────────────────────────────────────────────┐
│  /workspace/dance/                                             │
│  ├── students/{name}/                                          │
│  │   ├── profile.md                                            │
│  │   ├── progress-log.md                                       │
│  │   └── evaluations/evaluation_YYYY-MM-DD.md                 │
│  ├── class-notes/YYYY-MM/YYYY-MM-DD-{class}.md                │
│  ├── choreography/{piece-name}.md                             │
│  └── evaluations/formal/{student}_Evaluation_YYYY-MM-DD.md    │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Task Schema (Orchestrator → Marie)

**File**: `/core/shared/tasks/marie/task-{timestamp}-{uuid}.json`

```json
{
  "task_id": "task-1763412270-97486d25",
  "timestamp": "2025-11-17T00:00:00Z",
  "worker": "marie",
  "priority": "high|medium|low",
  "description": "Evaluate Emma Rodriguez's ballet and jazz technique",
  "context": {
    "user_request": "Original user request text",
    "student_name": "Emma Rodriguez",
    "dance_styles": ["ballet", "jazz"],
    "previous_evaluations": [...],
    "class_observations": [...]
  },
  "requirements": [
    "Assess technique in ballet and jazz",
    "Provide specific growth recommendations",
    "Create formal evaluation document"
  ],
  "dependencies": [],
  "expected_output": {
    "format": "markdown",
    "artifacts": ["student-evaluation", "progress-chart"]
  },
  "timeout_seconds": 600,
  "metadata": {
    "session_id": "uuid",
    "user_id": "if-applicable"
  }
}
```

### 1.3 Result Schema (Marie → Orchestrator)

**File**: `/core/shared/results/marie/task-{task-id}.json`

```json
{
  "task_id": "task-1763412270-97486d25",
  "worker": "marie",
  "status": "complete",
  "timestamp_start": "2025-11-17T00:00:00Z",
  "timestamp_complete": "2025-11-17T00:05:00Z",
  "execution_time_seconds": 300,
  "findings": {
    "summary": "Completed Emma Rodriguez evaluation - strong ballet technique, working on jazz transitions",
    "details": [
      "Ballet: Excellent posture and turnout (8/10)",
      "Jazz: Good isolations, needs work on quick direction changes (7/10)",
      "Recommended: Continue intermediate ballet, add jazz technique drills"
    ],
    "data": {
      "overall_score": 7.5,
      "technical_skills": { "balance": 8, "flexibility": 7, "coordination": 8 },
      "artistic_expression": { "stage_presence": 7, "emotional_connection": 8 }
    }
  },
  "artifacts": [
    {
      "type": "student-evaluation",
      "path": "/workspace/dance/students/emma-rodriguez/evaluation-2025-11-17.md",
      "description": "Formal APEXX evaluation document"
    },
    {
      "type": "progress-chart",
      "path": "/workspace/dance/students/emma-rodriguez/progress.json",
      "description": "Historical progress data"
    }
  ],
  "logs": [
    "Task started at 2025-11-17T00:00:00Z",
    "Loaded student profile",
    "Analyzed technique observations",
    "Generated recommendations",
    "Created evaluation document",
    "Task completed at 2025-11-17T00:05:00Z"
  ],
  "errors": []
}
```

---

## 2. Integration Points Analysis

### 2.1 Orchestrator ↔ Marie Integration

**Communication Protocol**: File-based asynchronous messaging

| Component | Path | Access | Purpose |
|-----------|------|--------|---------|
| Task Queue | `/core/shared/tasks/marie/` | Orchestrator: RW, Marie: RO | Task distribution |
| Result Queue | `/core/shared/results/marie/` | Marie: RW, Orchestrator: RO | Result collection |
| Workspace | `/workspaces/dance/` | Marie: RW, Others: RO | Persistent artifacts |
| Auth Home | `/core/shared/auth-homes/marie/` | Marie: RW | Authentication, settings |

**Task Distribution Flow**:
```bash
# Orchestrator creates task
Write("/tasks/marie/task-123.json", taskData)

# Optional: Wake worker immediately (vs 5s polling)
Bash("docker exec marie pkill -USR1 -f claude 2>/dev/null || true")

# Marie monitors with inotify (real-time) or polling (fallback)
inotifywait -m -e create,moved_to /tasks/ --format '%f' | while read filename; do
  processTask "/tasks/$filename"
  rm "/tasks/$filename"
done
```

**Result Collection Flow**:
```bash
# Orchestrator waits for result
while ! Bash("test -f /results/marie/task-123.json && echo 'done'"); do
  Bash("sleep 2")
done

# Read result
result = Read("/results/marie/task-123.json")

# Read artifacts
result.artifacts.forEach(artifact => {
  Read(artifact.path)  # e.g., /workspace/dance/students/.../evaluation.md
})
```

### 2.2 Marie ↔ Other Agents (Anga, Fabien)

**Current State**: No direct communication

**Potential Integration Points**:
1. **Marie → Anga**: Website updates, database management
   - Marie creates student data → Anga updates studio website
   - Marie schedules recital → Anga generates registration forms

2. **Marie → Fabien**: Marketing materials, parent communications
   - Marie completes evaluations → Fabien drafts parent emails
   - Marie plans recital → Fabien creates promotional materials

**Proposed Handoff Mechanism**:
```json
{
  "artifacts": [
    {
      "type": "handoff-to-anga",
      "description": "Update website with new class schedule",
      "data": {
        "schedule": {...},
        "action": "update-class-schedule"
      }
    }
  ]
}
```

### 2.3 Session Persistence Architecture

**Authentication Persistence**:
```
/core/shared/auth-homes/marie/
├── .credentials.json        # Web auth session (survives restart)
├── settings.json            # Agent configuration
├── settings.local.json      # Output style: {"outputStyle": "marie"}
├── history.jsonl            # Conversation history
├── projects/                # Project-specific state
├── todos/                   # Task tracking
└── output-styles/marie.md   # Communication style template
```

**Workspace Persistence** (Critical - NEVER use /home/agent/workspace):
```
/workspaces/dance/           # ← Host-mounted, survives restart
├── students/
│   └── {student-name}/
│       ├── profile.md       # Student bio, goals, history
│       ├── progress-log.md  # Chronological progress
│       └── evaluations/     # Formal assessments
├── class-notes/             # Daily class documentation
├── choreography/            # Routine documentation
└── evaluations/formal/      # APEXX format evaluations
```

**What Gets Lost on Restart**:
- ❌ Conversation context (unless backed up from history.jsonl)
- ❌ In-progress tasks (if container crashes mid-task)
- ❌ Memory of recent interactions (no semantic memory)

**What Persists**:
- ✅ Authentication credentials
- ✅ All workspace files (student records, evaluations, notes)
- ✅ Settings and output style preferences
- ✅ Conversation history (in JSONL format)

---

## 3. Current Limitations & Pain Points

### 3.1 Context/Memory System

**Problem**: No semantic memory across sessions

```
Session 1:
User: "Evaluate Emma Rodriguez"
Marie: [Creates detailed evaluation, learns Emma struggles with pirouettes]

Container Restart

Session 2:
User: "How is Emma doing with pirouettes?"
Marie: [No context - must re-read evaluation files]
```

**Current Workaround**: Read workspace files
```bash
# Marie must manually search workspace
Bash("find /workspace/dance/students/emma-rodriguez -name '*.md'")
Read("/workspace/dance/students/emma-rodriguez/evaluation-2025-11-17.md")
```

### 3.2 Task History Tracking

**Problem**: No centralized task history

**Current State**:
- Tasks deleted after processing (`rm /tasks/task-123.json`)
- Results remain in `/results/marie/` until manually cleaned
- No structured history or analytics

**Missing Capabilities**:
- Cannot answer "How many students have I evaluated this month?"
- Cannot track "What were the common themes in recent evaluations?"
- Cannot identify "Which students need follow-up?"

### 3.3 Learning from Past Interactions

**Problem**: Each task processed in isolation

**Example Scenario**:
```
Task 1: Evaluate Emma (finds: needs pirouette work)
Task 2: Evaluate Sarah (finds: needs pirouette work)
Task 3: Evaluate Lisa (finds: needs pirouette work)

Marie cannot recognize pattern: "Class-wide pirouette technique issue"
```

**No Feedback Loop**:
- Cannot improve recommendations based on past success
- Cannot track which teaching strategies work best
- Cannot identify recurring studio-wide challenges

---

## 4. Proposed Architecture Improvements

### 4.1 Context/Memory System Design

**Architecture**: Hybrid memory with episodic recall

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARIE MEMORY SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. WORKING MEMORY (Session Context)                     │  │
│  │     • Current task context                                │  │
│  │     • Recently accessed student files                     │  │
│  │     • Active conversation thread                          │  │
│  │     Storage: In-memory (lost on restart)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  2. EPISODIC MEMORY (Structured History)                 │  │
│  │     Location: /workspace/dance/.marie-memory/            │  │
│  │     Format: SQLite database                               │  │
│  │                                                           │  │
│  │     Tables:                                               │  │
│  │     • tasks_history                                       │  │
│  │       - task_id, timestamp, type, student_name           │  │
│  │       - summary, key_findings, artifacts                  │  │
│  │     • student_interactions                                │  │
│  │       - student_id, timestamp, interaction_type          │  │
│  │       - context, outcome                                  │  │
│  │     • teaching_insights                                   │  │
│  │       - insight_text, evidence, confidence_score         │  │
│  │       - tags (e.g., "technique-issue", "class-wide")     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3. SEMANTIC MEMORY (Knowledge Base)                     │  │
│  │     • Student profiles (parsed from markdown)            │  │
│  │     • Technique patterns                                  │  │
│  │     • Choreography library                                │  │
│  │     • Teaching strategies effectiveness                   │  │
│  │     Storage: Vector embeddings (future: MCP integration) │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  4. PROCEDURAL MEMORY (Learned Behaviors)                │  │
│  │     • Evaluation templates (refined over time)           │  │
│  │     • Common student issues → solutions mapping          │  │
│  │     • Optimal communication patterns                      │  │
│  │     Storage: JSON configuration files                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Plan**:

**Phase 1: Task History Database**
```sql
-- /workspace/dance/.marie-memory/history.db

CREATE TABLE tasks_completed (
  task_id TEXT PRIMARY KEY,
  timestamp_start TEXT,
  timestamp_complete TEXT,
  task_type TEXT,  -- 'evaluation', 'choreography', 'class-notes'
  student_names TEXT,  -- JSON array
  summary TEXT,
  key_findings TEXT,  -- JSON
  artifacts TEXT,     -- JSON array of file paths
  execution_time_seconds INTEGER
);

CREATE TABLE student_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT,
  timestamp TEXT,
  event_type TEXT,  -- 'evaluation', 'class', 'recital', 'goal-set'
  description TEXT,
  outcome TEXT,
  related_task_id TEXT,
  FOREIGN KEY (related_task_id) REFERENCES tasks_completed(task_id)
);

CREATE TABLE insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  insight_type TEXT,  -- 'pattern', 'recommendation', 'teaching-strategy'
  insight_text TEXT,
  evidence TEXT,  -- JSON array of task IDs
  confidence REAL,
  tags TEXT  -- JSON array
);
```

**Phase 2: Memory Integration in Task Processing**
```bash
# Marie's enhanced task loop

# 1. Task arrival
Read("/tasks/task-123.json")

# 2. CONTEXT RETRIEVAL (before processing)
# Query memory: "Recent interactions with Emma Rodriguez"
Bash("sqlite3 /workspace/dance/.marie-memory/history.db \
  'SELECT summary FROM student_timeline WHERE student_name=\"Emma Rodriguez\" \
   ORDER BY timestamp DESC LIMIT 5'")

# Query memory: "Similar evaluations in past 30 days"
# This provides context: "Other students had pirouette issues recently"

# 3. TASK PROCESSING (enhanced with context)
# Use historical context to inform evaluation
# Reference past patterns in recommendations

# 4. MEMORY WRITING (after processing)
Bash("sqlite3 /workspace/dance/.marie-memory/history.db \
  'INSERT INTO tasks_completed VALUES (...)'")

Bash("sqlite3 /workspace/dance/.marie-memory/history.db \
  'INSERT INTO student_timeline VALUES (...)'")

# 5. PATTERN DETECTION (async, low priority)
# If 3+ students struggle with same technique in 7 days:
#   → Create insight: "Class-wide pirouette technique gap"
#   → Recommend: "Schedule focused pirouette workshop"
```

### 4.2 Task History Tracking System

**Architecture**: Append-only event log + queryable database

```
/workspace/dance/.marie-memory/
├── history.db                  # SQLite database (queryable)
├── task-log.jsonl             # Append-only event log (backup)
├── insights/                   # Generated insights
│   ├── 2025-11-17-class-pirouette-pattern.md
│   └── 2025-11-18-emma-progress-summary.md
└── analytics/                  # Pre-computed analytics
    ├── monthly-stats.json
    └── student-progress-trends.json
```

**Query Interface**:
```bash
# Marie can now answer analytical questions

"How many students evaluated this month?"
→ Query: SELECT COUNT(*) FROM tasks_completed
         WHERE task_type='evaluation'
         AND timestamp >= '2025-11-01'

"Which students need follow-up on flexibility?"
→ Query: SELECT student_name FROM student_timeline
         WHERE description LIKE '%flexibility%'
         AND event_type='evaluation'
         ORDER BY timestamp DESC

"What are common themes in recent evaluations?"
→ Aggregate key_findings from recent tasks
→ Use LLM to extract patterns
```

### 4.3 Learning from Past Interactions

**Architecture**: Feedback loop with insight generation

```
┌─────────────────────────────────────────────────────────────────┐
│                   LEARNING SYSTEM                                │
└─────────────────────────────────────────────────────────────────┘

1. PATTERN DETECTION (Background Process)
   ┌─────────────────────────────────────────────────────────┐
   │  Every 24 hours:                                        │
   │  • Analyze completed tasks from past 7 days             │
   │  • Extract common themes/challenges                     │
   │  • Generate insights document                           │
   │                                                         │
   │  Example Output:                                        │
   │  "Insight: 5 intermediate students struggled with       │
   │   pirouettes this week. Common issue: spotting.         │
   │   Recommendation: Add spotting drills to warm-up."      │
   └─────────────────────────────────────────────────────────┘

2. RECOMMENDATION REFINEMENT
   ┌─────────────────────────────────────────────────────────┐
   │  Track recommendation effectiveness:                    │
   │  • Recommendation made: "Practice pirouettes 10min/day" │
   │  • Follow-up evaluation (30 days): Improvement noted?   │
   │  • If YES: Increase recommendation confidence           │
   │  • If NO: Refine approach                               │
   └─────────────────────────────────────────────────────────┘

3. TEMPLATE EVOLUTION
   ┌─────────────────────────────────────────────────────────┐
   │  Learn which evaluation formats work best:              │
   │  • Track teacher feedback (implicit from follow-ups)    │
   │  • Identify successful communication patterns           │
   │  • Update procedural memory templates                   │
   └─────────────────────────────────────────────────────────┘
```

**Implementation**: Periodic background task
```bash
# Scheduled task (cron-like, or orchestrator-triggered)

# Daily insight generation
Bash("
  # Aggregate recent tasks
  tasks=$(sqlite3 /workspace/dance/.marie-memory/history.db \
    'SELECT key_findings FROM tasks_completed
     WHERE timestamp >= date(\"now\", \"-7 days\")')

  # Use Claude to extract patterns
  # (This would be a self-reflection task for Marie)
  # Write insights to /workspace/dance/.marie-memory/insights/
")

# Weekly trend analysis
# Monthly progress reports
# Quarterly teaching strategy review
```

### 4.4 MCP Integration Points

**Proposed MCP Servers for Marie**:

#### 4.4.1 Memory MCP Server
```json
{
  "mcpServers": {
    "marie-memory": {
      "command": "node",
      "args": ["/path/to/marie-memory-server.js"],
      "env": {
        "MEMORY_DB_PATH": "/workspace/dance/.marie-memory/history.db"
      }
    }
  }
}
```

**Tools Provided**:
```javascript
{
  "tools": [
    {
      "name": "query_task_history",
      "description": "Query past tasks by date, student, or type",
      "parameters": {
        "query_type": "date_range|student|task_type",
        "filters": {...}
      }
    },
    {
      "name": "get_student_context",
      "description": "Retrieve all context for a specific student",
      "parameters": {
        "student_name": "Emma Rodriguez"
      }
    },
    {
      "name": "detect_patterns",
      "description": "Analyze recent tasks for patterns/insights",
      "parameters": {
        "lookback_days": 7,
        "min_occurrences": 3
      }
    },
    {
      "name": "store_insight",
      "description": "Store a generated insight with evidence",
      "parameters": {
        "insight": {...}
      }
    }
  ]
}
```

#### 4.4.2 Studio Management MCP Server
```javascript
{
  "tools": [
    {
      "name": "get_class_roster",
      "description": "Retrieve current class enrollment",
      "parameters": {
        "class_name": "Intermediate Ballet"
      }
    },
    {
      "name": "get_student_profile",
      "description": "Get comprehensive student profile",
      "parameters": {
        "student_name": "Emma Rodriguez"
      }
    },
    {
      "name": "update_student_progress",
      "description": "Update student's progress tracking",
      "parameters": {
        "student_name": "...",
        "progress_data": {...}
      }
    },
    {
      "name": "schedule_recital_tasks",
      "description": "Create tasks for recital preparation",
      "parameters": {
        "recital_date": "2025-12-15",
        "pieces": [...]
      }
    }
  ]
}
```

#### 4.4.3 Analytics MCP Server
```javascript
{
  "tools": [
    {
      "name": "generate_monthly_report",
      "description": "Generate analytics report for studio owner",
      "parameters": {
        "month": "2025-11",
        "include_charts": true
      }
    },
    {
      "name": "track_skill_progression",
      "description": "Track student skill levels over time",
      "parameters": {
        "student_name": "...",
        "skill_category": "balance|flexibility|coordination"
      }
    },
    {
      "name": "identify_at_risk_students",
      "description": "Find students who may need additional support",
      "parameters": {
        "criteria": "no_improvement|attendance|engagement"
      }
    }
  ]
}
```

**MCP Integration in Marie's Workflow**:
```bash
# Enhanced task processing with MCP

# 1. Task arrival: Evaluate Emma Rodriguez
Read("/tasks/task-123.json")

# 2. Context retrieval via MCP
MCP("marie-memory", "get_student_context", {
  "student_name": "Emma Rodriguez"
})
# Returns: Last 5 evaluations, recent class notes, progress trends

# 3. Studio data via MCP
MCP("studio-management", "get_student_profile", {
  "student_name": "Emma Rodriguez"
})
# Returns: Enrollment history, attendance, parent contact

# 4. Process evaluation with enriched context

# 5. Store results via MCP
MCP("marie-memory", "store_task_result", {
  "task_id": "task-123",
  "summary": "...",
  "insights": [...]
})

# 6. Analytics integration
MCP("analytics", "track_skill_progression", {
  "student_name": "Emma Rodriguez",
  "new_scores": {...}
})
```

---

## 5. Recommended Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Basic memory persistence

- [ ] Create SQLite schema for task history
- [ ] Modify Marie's task loop to write to history.db
- [ ] Implement basic query functions
- [ ] Add task history cleanup script (archive old tasks)

**Files to Create**:
- `/workspace/dance/.marie-memory/schema.sql`
- `/core/scripts/marie-memory-init.sh`
- `/core/scripts/marie-memory-query.sh`

**Deliverables**:
- Marie can answer: "How many tasks completed this month?"
- Task history persists across restarts
- Basic analytics available

### Phase 2: Context Enhancement (Weeks 3-4)
**Goal**: Intelligent context retrieval

- [ ] Implement student timeline tracking
- [ ] Add context retrieval before task processing
- [ ] Create student context summary function
- [ ] Test improved evaluation quality

**Files to Create**:
- `/core/prompts/agents/Marie-enhanced.md` (with memory queries)
- `/workspace/dance/.marie-memory/context-templates/`

**Deliverables**:
- Marie references past evaluations automatically
- Evaluations include historical context
- Student progress tracking across sessions

### Phase 3: Pattern Detection (Weeks 5-6)
**Goal**: Automated insights

- [ ] Implement daily pattern detection script
- [ ] Create insight generation workflow
- [ ] Add insight storage and retrieval
- [ ] Test class-wide pattern detection

**Files to Create**:
- `/core/scripts/marie-generate-insights.sh`
- `/workspace/dance/.marie-memory/insights/`
- `/core/prompts/marie-pattern-detection.md`

**Deliverables**:
- Marie identifies recurring challenges
- Weekly insights document generated
- Proactive teaching recommendations

### Phase 4: MCP Integration (Weeks 7-8)
**Goal**: External tool integration

- [ ] Build memory MCP server (Node.js/TypeScript)
- [ ] Build studio management MCP server
- [ ] Update Marie's .mcp.json configuration
- [ ] Test MCP tools in task processing

**Files to Create**:
- `/core/mcp-servers/marie-memory/`
- `/core/mcp-servers/studio-management/`
- `/core/shared/auth-homes/marie/.mcp.json`

**Deliverables**:
- MCP tools available to Marie
- Simplified context retrieval
- Foundation for advanced features

### Phase 5: Learning Loop (Weeks 9-10)
**Goal**: Recommendation refinement

- [ ] Track recommendation outcomes
- [ ] Implement feedback scoring
- [ ] Update procedural memory templates
- [ ] Generate effectiveness reports

**Deliverables**:
- Marie learns which recommendations work
- Templates improve over time
- Teaching strategy effectiveness tracking

---

## 6. File Paths Reference

### Critical System Paths

| Path | Purpose | Persistence | Notes |
|------|---------|-------------|-------|
| `/home/anga/workspace/beta/codehornets-ai/core/docker-compose.yml` | Container orchestration | Host | Defines all agents |
| `/home/anga/workspace/beta/codehornets-ai/core/prompts/agents/Marie.md` | Marie's identity/instructions | Host | Copied to CLAUDE.md |
| `/home/anga/workspace/beta/codehornets-ai/core/output-styles/marie.md` | Communication style | Host | Controls tone/emojis |
| `/home/anga/workspace/beta/codehornets-ai/core/shared/tasks/marie/` | Task queue | Host (temp) | Cleared after processing |
| `/home/anga/workspace/beta/codehornets-ai/core/shared/results/marie/` | Result queue | Host (temp) | Cleared periodically |
| `/home/anga/workspace/beta/codehornets-ai/core/shared/auth-homes/marie/` | Authentication/session | Host (persistent) | Critical for auth |
| `/home/anga/workspace/beta/codehornets-ai/workspaces/dance/` | Student data/artifacts | Host (persistent) | **Never use /home/agent/workspace** |

### Inside Marie Container

| Container Path | Host Mount | Access | Purpose |
|----------------|------------|--------|---------|
| `/tasks/` | `core/shared/tasks/marie/` | RO | Incoming tasks |
| `/results/` | `core/shared/results/marie/` | RW | Outgoing results |
| `/workspace/dance/` | `workspaces/dance/` | RW | Persistent storage |
| `/home/agent/.claude/` | `core/shared/auth-homes/marie/` | RW | Session data |
| `/home/agent/workspace/` | `core/shared/workspaces/marie/` | RW | Claude's working dir |
| `/output-styles/marie.md` | `core/output-styles/marie.md` | RO | Communication style |

### Proposed Memory System Paths

| Path | Purpose | Format |
|------|---------|--------|
| `/workspace/dance/.marie-memory/history.db` | Task history database | SQLite |
| `/workspace/dance/.marie-memory/task-log.jsonl` | Append-only event log | JSONL |
| `/workspace/dance/.marie-memory/insights/` | Generated insights | Markdown |
| `/workspace/dance/.marie-memory/analytics/` | Pre-computed stats | JSON |
| `/workspace/dance/.marie-memory/schemas/` | Database schemas | SQL |

---

## 7. Integration Patterns

### 7.1 Current: File-Based Orchestration

**Pros**:
- ✅ Simple, transparent communication
- ✅ No network dependencies
- ✅ Easy debugging (inspect JSON files)
- ✅ Natural async processing
- ✅ Language-agnostic

**Cons**:
- ❌ No real-time bidirectional communication
- ❌ Limited to same host (without NFS/shared storage)
- ❌ Polling latency (5s default, mitigated by inotify)
- ❌ No built-in task priority/routing
- ❌ Manual cleanup required

### 7.2 Proposed: Hybrid File + MCP

**Architecture**:
```
Orchestrator ←─(files)─→ Marie ←─(MCP)─→ Memory/Studio/Analytics Servers
                          ↓
                       (files)
                          ↓
                    Persistent Storage
```

**Benefits**:
- ✅ Preserves simple file-based task distribution
- ✅ Adds rich tool ecosystem via MCP
- ✅ Enables external integrations (databases, APIs)
- ✅ Maintains agent autonomy

### 7.3 Alternative: Full MCP Orchestration

**Architecture**: Replace file-based tasks with MCP calls

```javascript
// Orchestrator calls Marie via MCP
MCP("marie-agent", "evaluate_student", {
  "student_name": "Emma Rodriguez",
  "evaluation_type": "formal",
  "context": {...}
})
```

**Trade-offs**:
- ✅ Real-time responses
- ✅ Rich parameter validation
- ❌ Tighter coupling
- ❌ Requires MCP server implementation
- ❌ Loss of simple file-based debugging

**Recommendation**: Stick with file-based orchestration, add MCP for tools/integrations

---

## 8. Security & Performance Considerations

### 8.1 Security

**Current State**:
- ✅ Containers isolated via Docker
- ✅ Read-only mounts for task queue
- ✅ Separate auth-homes per agent
- ⚠️ Shared workspace (all agents can write to /workspaces/dance)

**Recommendations**:
1. **Workspace Permissions**: Consider per-agent subdirectories with restricted access
2. **Task Validation**: Sanitize task JSON before processing
3. **Rate Limiting**: Prevent task queue flooding
4. **Audit Logging**: Track all workspace modifications

### 8.2 Performance

**Current Bottlenecks**:
1. **Task Polling**: 5s latency (mitigated by inotify)
2. **File I/O**: Reading large workspace files
3. **LLM Processing**: Claude API latency (2-10s per task)

**Optimizations**:
1. **inotify**: Already implemented for instant task detection
2. **Task Batching**: Process multiple similar tasks together
3. **Caching**: Cache frequently accessed student profiles
4. **Async Processing**: Parallelize artifact creation

**Proposed Caching Layer**:
```bash
# Cache student profiles in memory (Redis-like)
# Check cache before reading file
if cached=$(Bash("cat /tmp/marie-cache/students/emma-rodriguez.json 2>/dev/null")); then
  student_data="$cached"
else
  student_data=$(Read("/workspace/dance/students/emma-rodriguez/profile.md"))
  Bash("echo '$student_data' > /tmp/marie-cache/students/emma-rodriguez.json")
fi
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Per Component)

**Marie Task Processing**:
```bash
# Test: Task JSON parsing
# Test: Evaluation generation
# Test: Result formatting
# Test: Error handling (invalid JSON, missing student)
```

**Memory System**:
```bash
# Test: SQLite schema creation
# Test: Task history insertion
# Test: Query functions (by date, student, type)
# Test: Pattern detection algorithm
```

**MCP Servers**:
```bash
# Test: Tool parameter validation
# Test: Database queries
# Test: Error responses
# Test: Concurrent access
```

### 9.2 Integration Tests (End-to-End)

**Scenario 1: Student Evaluation Flow**
```bash
# 1. Orchestrator creates task
# 2. Marie processes evaluation
# 3. Result written with artifacts
# 4. Memory system updated
# 5. Orchestrator reads result
# Assert: Evaluation file created in workspace
# Assert: History database updated
```

**Scenario 2: Context Retrieval**
```bash
# 1. Pre-populate memory with 5 evaluations
# 2. Create new evaluation task
# 3. Marie retrieves context from memory
# Assert: Evaluation references past observations
```

**Scenario 3: Pattern Detection**
```bash
# 1. Create 5 tasks with similar findings
# 2. Trigger insight generation
# Assert: Insight document created
# Assert: Pattern identified correctly
```

### 9.3 Performance Tests

**Load Test**:
```bash
# Create 100 tasks simultaneously
# Measure: Task processing time
# Measure: Memory usage
# Measure: File system I/O
# Target: <10s per task, <500MB RAM
```

---

## 10. Migration Plan (From Current to Enhanced)

### Step 1: Preserve Current Functionality
```bash
# Backup current system
make backup-all

# Tag current state
git tag v1.0-baseline
```

### Step 2: Add Memory System (Non-Breaking)
```bash
# Add memory initialization to Marie startup
# Update docker-compose.yml:
#   command: |
#     bash -c "
#     /scripts/marie-memory-init.sh &&
#     cp /output-styles/marie.md /home/agent/.claude/output-styles/marie.md &&
#     claude
#     "

# Marie continues to work without memory (fallback)
# Memory gradually populates as tasks complete
```

### Step 3: Gradual Prompt Enhancement
```bash
# Update Marie.md to use memory queries
# Add section: "Before processing tasks, check memory for context"
# Test with single evaluation task
# Verify backward compatibility (works without memory)
```

### Step 4: MCP Integration (Optional Features)
```bash
# Add MCP servers as optional enhancement
# Update .mcp.json only if servers available
# Marie works without MCP (graceful degradation)
```

### Step 5: Validation & Rollout
```bash
# A/B test: Evaluate with/without memory
# Compare evaluation quality
# Monitor performance impact
# Gradual rollout to all task types
```

---

## 11. Conclusion & Next Steps

### Summary of Findings

**Current Architecture**:
- ✅ **Strengths**: Clean file-based orchestration, simple debugging, Docker isolation
- ⚠️ **Limitations**: No context persistence, no learning, no task history analytics
- 🔧 **Opportunities**: Memory systems, MCP integration, pattern detection

### Recommended Immediate Actions

1. **Quick Win (Week 1)**: Implement task history database
   - Low effort, high value
   - Enables analytics immediately
   - Foundation for future features

2. **High Impact (Weeks 2-4)**: Add context retrieval to evaluations
   - Significantly improves evaluation quality
   - Demonstrates value of memory system
   - Builds confidence for further investment

3. **Strategic (Weeks 5-8)**: Build MCP servers
   - Future-proof architecture
   - Enable external integrations
   - Unlock advanced features

### Success Metrics

**Quantitative**:
- Task processing time: <10s average (maintain current performance)
- Context recall: >90% of relevant past interactions retrieved
- Pattern detection: Identify class-wide issues within 7 days

**Qualitative**:
- Evaluation quality: More personalized, historically-informed
- Teacher satisfaction: Reduced need to re-explain student context
- System maintainability: Easier debugging, clearer architecture

### Long-Term Vision

**Marie becomes a true teaching assistant**:
- Remembers every student interaction
- Learns which teaching strategies work
- Proactively identifies studio challenges
- Seamlessly integrates with studio management tools
- Provides data-driven insights to studio owners

---

**Document Prepared By**: System Architecture Analysis
**Last Updated**: 2025-11-18
**Version**: 1.0
**Next Review**: After Phase 1 implementation
