# New Orchestration Structure
## Claude CLI Architecture Implementation

**Architecture**: Claude CLI Orchestrator/Workers Pattern (architecture.md)
**Performance**: 90.2% better than single-agent (Anthropic research)
**Approach**: File-based task queue with Docker isolation

---

## Complete Directory Structure

```
orchestration/
├── cli/                                      # NEW - Python orchestrator
│   ├── orchestrator.py                       # Main orchestrator (file-based coordination)
│   ├── worker_loop.py                        # Worker file watcher (monitors tasks/)
│   ├── task_queue.py                         # Task queue management
│   ├── rate_limiter.py                       # API rate limiting (Tier 4)
│   ├── requirements.txt                      # Python dependencies
│   ├── docker-compose.yml                    # Claude CLI containers
│   ├── Dockerfile.orchestrator               # Orchestrator container
│   ├── Dockerfile.worker                     # Worker container
│   ├── .env.example                          # Environment template
│   ├── README.md                             # CLI usage guide
│   │
│   ├── auth-homes/                           # Isolated authentication
│   │   ├── orchestrator/
│   │   │   ├── .claude/
│   │   │   │   └── config.json               # Auth session
│   │   │   └── .gitkeep
│   │   ├── marie/
│   │   │   ├── .claude/
│   │   │   │   ├── config.json               # Marie's auth
│   │   │   │   └── agents/                   # Marie's sub-agents
│   │   │   └── .gitkeep
│   │   ├── anga/
│   │   │   ├── .claude/
│   │   │   │   ├── config.json
│   │   │   │   └── agents/
│   │   │   └── .gitkeep
│   │   └── fabien/
│   │       ├── .claude/
│   │       │   ├── config.json
│   │       │   └── agents/
│   │       └── .gitkeep
│   │
│   ├── tasks/                                # Task queue (file-based)
│   │   ├── marie/
│   │   │   ├── .gitkeep
│   │   │   └── (task-001.json, task-002.json, ...)
│   │   ├── anga/
│   │   │   ├── .gitkeep
│   │   │   └── (task-001.json, ...)
│   │   └── fabien/
│   │       ├── .gitkeep
│   │       └── (task-001.json, ...)
│   │
│   └── results/                              # Worker outputs
│       ├── marie/
│       │   ├── .gitkeep
│       │   └── (task-001-result.json, ...)
│       ├── anga/
│       │   ├── .gitkeep
│       │   └── (task-001-result.json, ...)
│       └── fabien/
│           ├── .gitkeep
│           └── (task-001-result.json, ...)
│
├── prompts/                                  # NEW - System prompts
│   ├── orchestrator.md                       # Orchestrator system prompt
│   ├── DANCE.md                              # Marie worker prompt
│   ├── ANGA.md                               # Anga worker prompt
│   ├── FABIEN.md                             # Fabien worker prompt
│   └── README.md                             # Prompt documentation
│
├── workflows/                                # PRESERVED - Workflow definitions
│   ├── parallel-demo.json                    # Parallel execution example
│   ├── sequential-workflow.json              # Sequential execution
│   ├── marie-new-student.json                # Marie workflows
│   ├── marie-evaluate-student.json
│   ├── marie-review-and-note-students.json
│   ├── batch-evaluation-generated.json       # Batch workflows
│   ├── complex-choreography.json
│   └── README.md                             # Workflow documentation
│
├── scripts/                                  # PRESERVED - Utility scripts
│   ├── batch-evaluate.sh                     # Batch student evaluation
│   ├── create-evaluation.sh                  # Create single evaluation
│   ├── evaluate-student.sh                   # Evaluate from workflow file
│   ├── generate-batch-workflow.sh            # Generate batch workflow
│   ├── marie-add-student.sh                  # Add new student
│   └── test-agent-introduction.sh            # Test agent responses
│
├── .env.example                              # Environment template (root)
├── .env                                      # User API keys (gitignored)
├── README.md                                 # Main orchestration guide
└── QUICKSTART.md                             # Quick start guide
```

---

## File Descriptions

### Core Python Files

#### `cli/orchestrator.py`
```python
# Main orchestrator - coordinates task assignment and synthesis
class MultiAgentOrchestrator:
    def analyze_and_decompose(request)    # Break down user request
    def assign_tasks(tasks)               # Write task files
    def wait_for_completion(tasks)        # Monitor results/
    def synthesize_results(results)       # Create unified response
```

**Key Features**:
- File-based task queue (no Redis required for basic usage)
- Prompt caching for cost optimization
- Parallel task assignment
- Artifact-only synthesis (no context pollution)

#### `cli/worker_loop.py`
```python
# Worker file watcher - monitors tasks/ directory
class TaskHandler(FileSystemEventHandler):
    def on_created(event)                 # New task file detected
    def execute_task(task)                # Run Claude CLI
    def write_result(result)              # Output to results/
```

**Key Features**:
- Watches tasks/{worker}/ for new .json files
- Executes claude --system-prompt-file
- Writes results to results/{worker}/
- Removes processed task files

#### `cli/task_queue.py`
```python
# Task queue management (optional - for Redis integration)
class TaskQueue:
    def enqueue(worker, task)
    def dequeue(worker)
    def get_status(task_id)
```

**Purpose**: Alternative to file-based queue for production

#### `cli/rate_limiter.py`
```python
# API rate limiting (Tier 4: 4,000 RPM, 400K TPM)
class RateLimiter:
    def wait_if_needed(estimated_tokens)
    def track_usage()
```

**Purpose**: Prevent 429 errors with multiple workers

---

## Docker Configuration

### `cli/docker-compose.yml`
```yaml
services:
  orchestrator:
    image: docker/sandbox-templates:claude-code
    volumes:
      - ./auth-homes/orchestrator:/home/agent/.claude:ro
      - ./tasks:/tasks:rw
      - ./results:/results:rw
      - ../prompts:/prompts:ro
    environment:
      - ANTHROPIC_API_KEY
    command: python3 orchestrator.py

  marie:
    image: docker/sandbox-templates:claude-code
    volumes:
      - ./auth-homes/marie:/home/agent/.claude:ro
      - ./tasks/marie:/tasks:ro
      - ./results/marie:/results:rw
      - ../prompts/DANCE.md:/prompts/DANCE.md:ro
    command: python3 worker_loop.py marie

  anga:
    image: docker/sandbox-templates:claude-code
    volumes:
      - ./auth-homes/anga:/home/agent/.claude:ro
      - ./tasks/anga:/tasks:ro
      - ./results/anga:/results:rw
      - ../prompts/ANGA.md:/prompts/ANGA.md:ro
    command: python3 worker_loop.py anga

  fabien:
    image: docker/sandbox-templates:claude-code
    volumes:
      - ./auth-homes/fabien:/home/agent/.claude:ro
      - ./tasks/fabien:/tasks:ro
      - ./results/fabien:/results:rw
      - ../prompts/FABIEN.md:/prompts/FABIEN.md:ro
    command: python3 worker_loop.py fabien
```

**Key Features**:
- Official Claude CLI Docker image
- Isolated auth per worker
- Read-only task access (prevents corruption)
- Read-only prompts (immutable)
- Write-only results (output)

---

## System Prompts

### `prompts/orchestrator.md`
```markdown
You are the orchestrator in a multi-agent system.

## Workers Available
- Marie (DANCE.md): Dance teacher, student management, evaluations
- Anga (ANGA.md): Code review, testing, architecture
- Fabien (FABIEN.md): Marketing campaigns, content, analytics

## Orchestration Protocol
1. Analyze user request
2. Decompose into specific tasks
3. Assign to appropriate workers
4. Monitor completion signals
5. Synthesize results (artifacts only, not full context)

## Task Assignment Format
{
  "task_id": "unique-id",
  "worker": "marie|anga|fabien",
  "description": "specific, actionable task",
  "dependencies": ["task-id-1", "task-id-2"],
  "priority": "high|medium|low"
}
```

### `prompts/DANCE.md` (Marie)
```markdown
You are Marie, a specialized dance teacher assistant.

## Role
Focus exclusively on:
- Student management and progress tracking
- Class documentation
- Choreography notes
- Professional evaluations (APEXX format)

## Communication Protocol
When you complete a task:
1. Write results to /results/marie/{task_id}.json
2. Format: {"status": "complete", "findings": [...], "artifacts": [...]}
3. Remove task file after completion

## Output Format
Always provide:
- Student-specific feedback
- Progress metrics
- Next steps
- Professional format (French for evaluations)
```

**Similar structure for ANGA.md and FABIEN.md**

---

## Task File Format

### Input: `tasks/marie/eval-001.json`
```json
{
  "task_id": "eval-001",
  "worker": "marie",
  "description": "Create hip-hop evaluation for Emma Rodriguez. Scores: Expression 8/10, Coordination 9/10, Effort 10/10...",
  "dependencies": [],
  "priority": "high",
  "context": {
    "student_name": "Emma Rodriguez",
    "date": "2025-11-17",
    "evaluation_type": "hip-hop"
  }
}
```

### Output: `results/marie/eval-001.json`
```json
{
  "task_id": "eval-001",
  "status": "complete",
  "worker": "marie",
  "completed_at": "2025-11-17T10:30:00Z",
  "artifacts": [
    "workspaces/dance/studio/students/emma-rodriguez/evaluations/evaluation_2025-11-17_10-30.md"
  ],
  "summary": "Created professional hip-hop evaluation for Emma Rodriguez. Total score: 87/100. Evaluation saved to student folder.",
  "findings": [
    "Strong foundation in coordination and effort",
    "Recommend focus on musicality development"
  ]
}
```

---

## Workflow Execution Flow

### 1. User Request
```
User: "Evaluate all students in my hip-hop class"
```

### 2. Orchestrator Analysis
```python
orchestrator.analyze_and_decompose(request)
# Returns:
[
  {
    "task_id": "eval-emma-001",
    "worker": "marie",
    "description": "Evaluate Emma Rodriguez (hip-hop)..."
  },
  {
    "task_id": "eval-sophia-002",
    "worker": "marie",
    "description": "Evaluate Sophia Chen (hip-hop)..."
  },
  {
    "task_id": "eval-lucas-003",
    "worker": "marie",
    "description": "Evaluate Lucas Martinez (hip-hop)..."
  }
]
```

### 3. Task Assignment
```python
# Orchestrator writes task files
tasks/marie/eval-emma-001.json
tasks/marie/eval-sophia-002.json
tasks/marie/eval-lucas-003.json
```

### 4. Worker Execution (Parallel)
```python
# Marie worker loop detects new tasks
# Executes 3 tasks in parallel (separate Claude instances)
claude --system-prompt-file /prompts/DANCE.md -p "task description"

# Writes results
results/marie/eval-emma-001.json
results/marie/eval-sophia-002.json
results/marie/eval-lucas-003.json
```

### 5. Orchestrator Synthesis
```python
# Orchestrator reads result artifacts
results = [
  read_json("results/marie/eval-emma-001.json"),
  read_json("results/marie/eval-sophia-002.json"),
  read_json("results/marie/eval-lucas-003.json")
]

# Synthesizes unified response
final_report = orchestrator.synthesize(results)
```

### 6. User Response
```
3 students evaluated successfully:
- Emma Rodriguez: 87/100 (strong coordination, work on musicality)
- Sophia Chen: 92/100 (excellent foundation, ready for advanced)
- Lucas Martinez: 78/100 (focus on effort and endurance)

All evaluations saved to student folders.
Next steps: Schedule follow-up with Lucas for technique review.
```

---

## Makefile Integration

### New Targets

```makefile
# Setup
cli-setup:
    @echo "Setting up Claude CLI orchestration..."
    @mkdir -p orchestration/cli/{auth-homes,tasks,results}/{orchestrator,marie,anga,fabien}
    @pip install -r orchestration/cli/requirements.txt
    @echo "✅ CLI orchestration ready"

cli-auth:
    @echo "Setting up authentication for each worker..."
    @cd orchestration/cli && ./scripts/setup-auth.sh

# Operations
cli-start:
    @cd orchestration/cli && docker-compose up -d
    @echo "✅ All workers running"

cli-stop:
    @cd orchestration/cli && docker-compose down

cli-status:
    @cd orchestration/cli && docker-compose ps
    @echo ""
    @echo "Task queue:"
    @ls -la orchestration/cli/tasks/*/ | grep -v total

cli-logs:
    @cd orchestration/cli && docker-compose logs -f

# Testing
cli-test-parallel:
    @echo "Testing parallel execution..."
    @python3 orchestration/cli/test_parallel.py

cli-test-sequential:
    @echo "Testing sequential workflow..."
    @python3 orchestration/cli/test_sequential.py
```

---

## Migration from Current Makefile

### Update Existing Targets

```makefile
# OLD (MCP-based)
orchestration-start:
    @cd orchestration && docker-compose up -d

# NEW (CLI-based)
orchestration-start:
    @cd orchestration/cli && docker-compose up -d
```

---

## Usage Examples

### Example 1: Single Student Evaluation
```bash
# Create task
cat > orchestration/cli/tasks/marie/eval-001.json << EOF
{
  "task_id": "eval-001",
  "worker": "marie",
  "description": "Evaluate Emma Rodriguez for hip-hop class",
  "context": {
    "student": "Emma Rodriguez",
    "date": "2025-11-17"
  }
}
EOF

# Wait for completion
while [ ! -f orchestration/cli/results/marie/eval-001.json ]; do
  sleep 1
done

# Read result
cat orchestration/cli/results/marie/eval-001.json
```

### Example 2: Batch Evaluation
```bash
make batch-evaluate STUDENTS=orchestration/example-class-roster.txt
```

### Example 3: Parallel Code Review
```bash
# Submit 3 tasks to different workers
make orchestration-cli-submit-tasks WORKFLOW=workflows/parallel-demo.json
```

---

## Performance Characteristics

### File-based Queue
- **Latency**: ~100ms per task
- **Throughput**: 10 tasks/second
- **Concurrency**: Limited by worker count (3 workers = 3 parallel tasks)

### Docker Isolation
- **Memory**: ~500MB per worker
- **CPU**: 2 cores per worker recommended
- **Startup**: ~5 seconds per container

### API Rate Limits (Tier 4)
- **Per Worker**: 1,000 RPM, 100K input TPM, 20K output TPM
- **Total System**: 4,000 RPM, 400K TPM (with orchestrator)

---

## Cost Optimization

### Model Selection
```
Orchestrator: Claude 4 Opus ($15 input, $75 output)
Workers: Claude 4 Sonnet ($3 input, $15 output)
Sub-agents: Claude 3.5 Haiku ($0.25 input, $1.25 output)
```

### Prompt Caching
- System prompts: 90% cost reduction
- Project context: Cached across requests
- Cache TTL: 5 minutes

### Estimated Costs
```
Single evaluation: $0.05
Batch 10 students: $0.30 (parallel)
Daily (100 evals): $5.00
Monthly: $150
```

---

## Security Considerations

### Authentication Isolation
- Each worker has separate .claude/ auth
- Read-only mounts prevent credential theft
- No shared API keys between workers

### File System Isolation
- Workers can only read their task directory
- Workers can only write to their results directory
- Prompts are read-only

### Network Isolation
- Workers cannot communicate directly
- All coordination through file system
- No network access except Anthropic API

---

## Rollback Procedure

If migration fails:

```bash
# Restore MCP docker-compose
mv orchestration/docker-compose.mcp.old orchestration/docker-compose.yml

# Restore MCP servers from git
git checkout HEAD -- orchestration/marie/server.ts
git checkout HEAD -- orchestration/anga/server.ts
git checkout HEAD -- orchestration/fabien/server.ts
git checkout HEAD -- orchestration/orchestrator/index.ts

# Reinstall dependencies
cd orchestration/shared && npm install

# Start old system
make orchestration-start
```

---

## Success Metrics

- [ ] All workers start successfully
- [ ] Task files processed within 5 seconds
- [ ] Results written correctly
- [ ] Parallel execution confirmed
- [ ] No 429 rate limit errors
- [ ] Existing scripts still work
- [ ] Documentation complete
