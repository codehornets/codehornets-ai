# Architecture.md Implementation Plan

## Current Status vs. Desired Architecture

### What We Have Now (MCP-based)
- ✅ 3 MCP servers (Marie, Anga, Fabien) with tool definitions
- ✅ Express orchestrator API with workflow execution
- ✅ Docker container running orchestrator
- ✅ DANCE.md, ANGA.md, FABIEN.md system prompts ready
- ✅ Workspace structure (`workspaces/dance/studio`, etc.)
- ✅ Workflow JSON definitions
- ✅ Makefile automation for orchestration
- ❌ **No actual Claude CLI instances**
- ❌ **No Claude API calls from workers**
- ❌ **No sub-agent spawning capability**
- ❌ **No true parallel multi-agent orchestration**

### What We Need (architecture.md)
- 🎯 **Multiple Claude Code CLI instances** running in isolated containers
- 🎯 **Orchestrator Claude instance** coordinating workers
- 🎯 **Worker Claude instances** (Marie, Anga, Fabien) with custom system prompts
- 🎯 **File-based or Redis-based** task queue coordination
- 🎯 **Artifact-based communication** (workers write files, orchestrator reads)
- 🎯 **Sub-agent spawning** via Task tool within workers
- 🎯 **Full Claude Code tools** available to each agent (Read, Write, Bash, Grep, etc.)
- 🎯 **Prompt caching** for 90% cost reduction
- 🎯 **Rate limiting** per agent instance

## Implementation Roadmap

### Phase 1: Docker Infrastructure for Multiple Claude CLI Instances

**Goal**: Get 3+ Claude CLI instances running in isolated containers

#### Tasks:
1. **Create Claude CLI containers** (following official Docker sandbox pattern)
   ```yaml
   # docker-compose.yml
   services:
     orchestrator:
       image: docker/sandbox-templates:claude-code
       command: claude --system-prompt-file /workspace/.claude/orchestrator.md
       volumes:
         - ./tasks:/tasks
         - ./results:/results
         - ./auth/orchestrator:/home/agent/.claude:ro
       environment:
         - ANTHROPIC_API_KEY=${ORCHESTRATOR_API_KEY}

     marie:
       image: docker/sandbox-templates:claude-code
       command: python3 /workspace/worker_loop.py marie
       volumes:
         - ./workspaces/dance:/workspace:ro
         - ./results/marie:/results:rw
         - ./tasks/marie:/tasks:ro
         - ./auth/marie:/home/agent/.claude:ro
       environment:
         - ANTHROPIC_API_KEY=${MARIE_API_KEY}

     # Similar for anga, fabien
   ```

2. **Create worker loop script** (`orchestration/worker_loop.py`)
   - Watches `/tasks/{worker}/` directory for new task files
   - Executes `claude --system-prompt-file DANCE.md -p <task>` for each task
   - Writes results to `/results/{worker}/{task_id}.json`
   - Deletes task file when complete

3. **Separate authentication per worker**
   ```bash
   # Setup isolated auth for each agent
   mkdir -p auth-homes/{orchestrator,marie,anga,fabien}

   # Authenticate each separately
   docker run -it --rm \
     -v ./auth-homes/marie:/home/agent/.claude \
     docker/sandbox-templates:claude-code \
     claude  # Interactive auth flow
   ```

### Phase 2: File-Based Task Queue Communication

**Goal**: Orchestrator assigns tasks via files, workers execute and report

#### Tasks:
1. **Task file format** (`tasks/marie/task-001.json`)
   ```json
   {
     "task_id": "sec-001",
     "worker": "marie",
     "description": "Review student Emma Rodriguez progress and create detailed evaluation",
     "dependencies": [],
     "timeout": 300,
     "priority": "high"
   }
   ```

2. **Result file format** (`results/marie/task-001.json`)
   ```json
   {
     "task_id": "sec-001",
     "status": "complete",
     "worker": "marie",
     "findings": ["Student shows excellent progress in turnout", ...],
     "artifacts": ["/results/marie/emma-evaluation.md"],
     "execution_time": 45.2
   }
   ```

3. **Python orchestrator** (`orchestration/orchestrator.py`)
   ```python
   class MultiAgentOrchestrator:
       def analyze_and_decompose(self, user_request: str) -> List[Task]:
           """Use Claude Opus to decompose request"""
           response = anthropic.messages.create(
               model="claude-opus-4-20250514",
               system=[{
                   "type": "text",
                   "text": orchestrator_prompt,
                   "cache_control": {"type": "ephemeral"}
               }],
               messages=[{"role": "user", "content": user_request}]
           )
           # Parse task list from Claude's response

       def assign_tasks(self, tasks: List[Task]):
           """Write task files to worker directories"""
           for task in tasks:
               task_file = f"/tasks/{task.worker}/{task.task_id}.json"
               write_json(task_file, task)

       def wait_for_completion(self, tasks):
           """Poll for result files"""
           while not all_complete:
               check_for_result_files()

       def synthesize_results(self, results):
           """Use Claude Opus to combine worker outputs"""
   ```

### Phase 3: Orchestrator System Prompt

**Goal**: Orchestrator knows how to coordinate workers

#### Create `.claude/orchestrator.md`:
```markdown
You are the orchestrator in a multi-agent system coordinating specialized workers.

## Workers Available
- **Marie** (DANCE.md): Dance teacher - student management, evaluations, choreography
- **Anga** (ANGA.md): Coding assistant - code review, testing, architecture
- **Fabien** (FABIEN.md): Marketing - campaigns, content, analytics

## Orchestration Protocol

### Task Decomposition
When you receive a request:
1. Analyze which domains are involved
2. Create specific, actionable tasks for each worker
3. Determine dependencies (parallel vs sequential)
4. Write task files to /tasks/{worker}/{task_id}.json

### Task Assignment Format
```json
{
  "task_id": "unique-id",
  "worker": "marie|anga|fabien",
  "description": "Clear, actionable task description",
  "dependencies": ["other-task-ids"],
  "priority": "high|medium|low"
}
```

### Synthesis Rules
After all workers complete:
1. Read artifact references from /results/{worker}/
2. Read actual artifacts workers created
3. Identify conflicts or gaps
4. Create unified, actionable response
5. Prioritize by impact/severity

## Never Do
- Don't implement tasks yourself (delegate to workers)
- Don't duplicate worker efforts
- Maintain pure coordination role
```

### Phase 4: Worker System Prompts (Already Have!)

**Status**: ✅ Already created in `orchestration/{agent}/DANCE.md`, etc.

Just need to update them with:
```markdown
## Communication Protocol
When you complete a task:
1. Write detailed results to /results/marie/task-{id}.json
2. Create any artifacts (markdown files, data files) in /results/marie/
3. Use format: {"status": "complete", "findings": [...], "artifacts": [...]}

## Output Format
Always provide:
- Status (complete/failed)
- Detailed findings
- Paths to created artifacts
- Recommendations for next steps
```

### Phase 5: Sub-Agent Support

**Goal**: Workers can spawn sub-agents for complex subtasks

#### Enable in worker containers:
1. **Create sub-agent definitions** in each worker's `.claude/agents/`
   ```markdown
   # .claude/agents/choreography-analyzer.md
   ---
   name: choreography-analyzer
   description: Deep analysis of choreography complexity and student readiness
   tools: Read, Grep
   model: haiku
   ---

   You are a choreography analysis specialist working under Marie.
   Analyze dance routines for age-appropriateness, skill requirements, and progressions.
   ```

2. **Update worker prompts** to use sub-agents:
   ```markdown
   ## Sub-agent Delegation
   For complex tasks, delegate to specialists:
   - Use `/agents` to list available sub-agents
   - Invoke: "Use choreography-analyzer to evaluate this routine"
   - Sub-agents return compressed findings
   - You synthesize into final report
   ```

### Phase 6: Prompt Caching & Rate Limiting

**Goal**: 90% cost reduction and manage API limits

#### Implement caching:
```python
# In orchestrator and workers
system = [
    {
        "type": "text",
        "text": load_system_prompt(),
        "cache_control": {"type": "ephemeral"}  # Cache this!
    },
    {
        "type": "text",
        "text": load_project_context(),
        "cache_control": {"type": "ephemeral"}  # Cache this too!
    }
]
```

#### Rate limiter per worker:
```python
class RateLimiter:
    def __init__(self, max_rpm=1000, max_tpm=100000):
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm

    def wait_if_needed(self, estimated_tokens):
        # Token bucket algorithm
        # Sleep if approaching limits
```

## Migration Strategy

### Option A: Parallel Development (Recommended)
Keep current MCP system, build new CLI orchestration alongside:
```
orchestration/
├── mcp/              # Current implementation (keep)
│   ├── marie/
│   ├── anga/
│   ├── fabien/
│   └── orchestrator/
└── cli/              # New architecture.md implementation
    ├── docker-compose.yml
    ├── orchestrator.py
    ├── worker_loop.py
    ├── auth-homes/
    ├── tasks/
    └── results/
```

### Option B: In-Place Migration
Replace current orchestration/ structure:
1. Backup current MCP implementation
2. Implement CLI orchestration in place
3. Test thoroughly
4. Keep MCP tools as reference

## Testing Plan

### Unit Tests
- Task file creation/parsing
- Result file handling
- Rate limiter logic
- Authentication isolation

### Integration Tests
1. **Single worker test**: Orchestrator → Marie → Result
2. **Parallel test**: 3 workers executing simultaneously
3. **Sequential test**: Tasks with dependencies
4. **Sub-agent test**: Worker spawns sub-agent
5. **Failure handling**: Worker timeout, failed task

### Performance Tests
- 10 parallel tasks across 3 workers
- Token usage tracking
- Cache hit rate measurement
- Time to completion vs single-agent baseline

## Success Metrics

✅ **Multiple Claude CLI instances running** in isolated containers
✅ **Orchestrator decomposes** complex requests into worker tasks
✅ **Workers execute in parallel** when no dependencies
✅ **File-based communication** works reliably
✅ **Sub-agents spawn** correctly within workers
✅ **Prompt caching** achieves >80% cost reduction
✅ **90% improvement** in complex task performance vs single agent
✅ **Cost per task** within expected range ($1-5 for typical workflows)

## Estimated Timeline

- **Phase 1** (Docker Infrastructure): 2-3 days
- **Phase 2** (File Queue): 2-3 days
- **Phase 3** (Orchestrator Prompt): 1 day
- **Phase 4** (Worker Prompts): 1 day (mostly done)
- **Phase 5** (Sub-agents): 2 days
- **Phase 6** (Caching/Limits): 1-2 days

**Total**: ~2 weeks for full implementation

## Next Steps

1. **Decide**: Parallel development (Option A) or in-place migration (Option B)?
2. **Get Docker sandbox**: Pull `docker/sandbox-templates:claude-code`
3. **Authenticate workers**: Set up isolated auth for each agent
4. **Start Phase 1**: Get first Claude CLI worker running
5. **Iterate**: Build incrementally, test each phase

## Resources Needed

- Anthropic API key (Tier 4 recommended for production)
- Docker & Docker Compose
- Python 3.10+ for orchestration scripts
- ~4GB RAM per worker container
- Knowledge of Claude Code CLI flags and options

## Questions to Resolve

1. Single API key shared across workers or separate keys?
2. Redis instead of file-based queue for production?
3. Web UI for monitoring orchestration status?
4. Telemetry/logging strategy?
5. How to handle long-running tasks (>5 min)?
