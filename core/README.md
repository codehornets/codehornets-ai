# Multi-Agent Orchestration System

**Simple, clean orchestration using Claude Code CLI instances**

---

## What This Is

A multi-agent system where one orchestrator coordinates three specialized workers:

- **Orchestrator** - Coordinates tasks and synthesizes results
- **Marie** - Dance teaching expert (student evaluation, choreography)
- **Anga** - Software development expert (code review, architecture)
- **Fabien** - Marketing expert (campaigns, content, social media)

All agents are **full Claude Code CLI instances** running in Docker containers, communicating through a file-based task queue.

---

## Directory Structure

```
core/
├── docker-compose.yml          # Runs all 4 containers
│
├── prompts/                    # PROMPTS (single source of truth)
│   ├── orchestrator.md        # Orchestrator's behavior
│   │
│   ├── domains/               # Domain expertise (WHAT they know)
│   │   ├── DANCE.md          # Dance teaching knowledge
│   │   ├── CODING.md         # Software development knowledge
│   │   └── MARKETING.md      # Marketing knowledge
│   │
│   ├── agents/                # Agent personalities (WHO they are)
│   │   ├── Marie.md          # extends domains/DANCE.md
│   │   ├── Anga.md           # extends domains/CODING.md
│   │   └── Fabien.md         # extends domains/MARKETING.md
│   │
│   └── combine-prompts.sh     # Script to merge agent + domain
│
└── shared/                     # Communication & runtime
    ├── tasks/                  # Task queue (gitignored)
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    ├── results/                # Outputs (gitignored)
    │   ├── marie/
    │   ├── anga/
    │   └── fabien/
    └── auth-homes/             # Web authentication (gitignored)
        ├── orchestrator/
        ├── marie/
        ├── anga/
        └── fabien/
```

### Separation of Concerns

**domains/** = Domain expertise (knowledge base)
- `DANCE.md` - All dance teaching knowledge
- `CODING.md` - All software development knowledge
- `MARKETING.md` - All marketing knowledge

**agents/** = Agent personalities (who they are + orchestration behavior)
- `Marie.md` - Marie's personality + worker mode (uses DANCE.md knowledge)
- `Anga.md` - Anga's personality + worker mode (uses CODING.md knowledge)
- `Fabien.md` - Fabien's personality + worker mode (uses MARKETING.md knowledge)

**At runtime**: `combine-prompts.sh` merges agent personality + domain knowledge into `/workspace/CLAUDE.md`

---

## Quick Start

### Using Make Commands (Recommended)

**Note**: Run all `make` commands from the **root directory**, not from `core/`.

**Easiest - Single Command:**

```bash
# Complete setup with one command (from root)
make all
```

This runs: pull → auth-all → start → shows instructions

**Manual - Step by Step:**

```bash
# From root directory

# 1. Pull Docker image (one-time)
make pull

# 2. Authenticate all agents (one-time)
make auth-all

# 3. Start the system
make start

# 4. Attach to orchestrator
make attach
```

Now you're talking to the orchestrator! Type your requests:

```
"Evaluate all dance students"
"Review the authentication code"
"Create a social media campaign"
"Do all three at once"
```

The orchestrator will automatically delegate to the appropriate workers.

**See all available commands:**
```bash
make help
```

### Manual Setup (Alternative)

If you prefer not to use Make:

**1. Pull Docker Image**

```bash
docker pull docker/sandbox-templates:claude-code
```

**2. Authenticate Each Agent (One-Time Setup)**

```bash
cd core

# Orchestrator
docker run -it --rm \
  -v "$(pwd)/shared/auth-homes/orchestrator:/home/agent/.claude" \
  docker/sandbox-templates:claude-code \
  claude

# Marie
docker run -it --rm \
  -v "$(pwd)/shared/auth-homes/marie:/home/agent/.claude" \
  docker/sandbox-templates:claude-code \
  claude

# Anga
docker run -it --rm \
  -v "$(pwd)/shared/auth-homes/anga:/home/agent/.claude" \
  docker/sandbox-templates:claude-code \
  claude

# Fabien
docker run -it --rm \
  -v "$(pwd)/shared/auth-homes/fabien:/home/agent/.claude" \
  docker/sandbox-templates:claude-code \
  claude
```

Each will open a browser for web authentication. Complete the login for all four.

**3. Start the System**

```bash
docker-compose up -d
```

**4. Attach to Orchestrator**

```bash
docker attach orchestrator
```

---

## How It Works

### You Talk to Orchestrator

```
You: "Evaluate dance students and create marketing for the recital"
```

### Orchestrator Analyzes and Delegates

```javascript
Orchestrator (thinking):
  "This needs:
   - Marie (dance) → student evaluation
   - Fabien (marketing) → campaign creation"

// Creates task files
Write("/tasks/marie/task-001.json", {
  description: "Evaluate intermediate students",
  requirements: [...]
})

Write("/tasks/fabien/task-002.json", {
  description: "Create recital marketing campaign",
  requirements: [...]
})
```

### Workers Monitor and Execute

```javascript
// Marie watches her task directory
while (true) {
  const tasks = Bash("ls /tasks/*.json")

  if (tasks) {
    const task = Read("/tasks/task-001.json")
    // Execute using dance expertise
    // Write results
    Write("/results/task-001.json", { ... })
  }

  sleep(5)
}
```

### Orchestrator Synthesizes Results

```javascript
// Read all results
const marieResult = Read("/results/marie/task-001.json")
const fabienResult = Read("/results/fabien/task-002.json")

// Synthesize
response = `
✅ Student evaluations complete
✅ Marketing campaign created
All materials ready!
`
```

### You Get Complete Answer

The orchestrator presents the combined results from all workers.

---

## Controlling Which Worker

### Let Orchestrator Decide (Automatic)

```
You: "Review the codebase"
Orchestrator: *automatically chooses Anga*
```

### Be Explicit

```
You: "Have Marie evaluate students and Fabien write social posts"
Orchestrator: *uses exactly who you specified*
```

### Ask Orchestrator

```
You: "Who should handle API documentation?"
Orchestrator: "I'd recommend Anga for technical accuracy.
               Want me to assign it?"
```

---

## Make Commands Reference

### Setup Commands

```bash
make pull              # Pull Claude Code Docker image (one-time)
make auth-all          # Authenticate all 4 agents (one-time)
make auth-orchestrator # Authenticate orchestrator only
make auth-marie        # Authenticate Marie only
make auth-anga         # Authenticate Anga only
make auth-fabien       # Authenticate Fabien only
make check-auth        # Verify which agents are authenticated
```

### System Management

```bash
make start      # Start all containers in background
make stop       # Stop all containers
make restart    # Restart all containers
make rebuild    # Rebuild and restart (use after prompt changes)
```

### Monitoring

```bash
make status            # Show container status
make logs              # Show logs from all containers
make logs-orchestrator # Show orchestrator logs only
make logs-marie        # Show Marie logs only
make logs-anga         # Show Anga logs only
make logs-fabien       # Show Fabien logs only
```

### Interaction

```bash
make attach        # Attach to orchestrator (Ctrl+P Ctrl+Q to detach)
make attach-marie  # Attach to Marie
make attach-anga   # Attach to Anga
make attach-fabien # Attach to Fabien
```

### Development Helpers

```bash
make check-tasks   # Show number of tasks in each queue
make check-results # Show number of results available
```

### Cleanup

```bash
make clean         # Stop containers and remove volumes
make clean-tasks   # Clear all task files
make clean-results # Clear all result files
```

---

## Manual Commands (Alternative to Make)

### Check Status

```bash
docker-compose ps
```

### View Logs

```bash
docker-compose logs -f orchestrator
docker-compose logs -f marie
docker-compose logs -f anga
docker-compose logs -f fabien
```

### Check Task Queue

```bash
ls -la shared/tasks/marie/
ls -la shared/tasks/anga/
ls -la shared/tasks/fabien/
```

### Check Results

```bash
ls -la shared/results/marie/
ls -la shared/results/anga/
ls -la shared/results/fabien/
```

### Attach to a Worker

```bash
docker attach marie
# Ctrl+P, Ctrl+Q to detach without stopping
```

---

## System Management

### Start System

```bash
docker-compose up -d
```

### Stop System

```bash
docker-compose down
```

### Restart System

```bash
docker-compose restart
```

### Rebuild (After Prompt Changes)

```bash
docker-compose down
docker-compose up -d --force-recreate
```

---

## How Agents Work Together

### Sequential Tasks (Dependencies)

```
User: "Audit the code, then document findings"

Orchestrator:
1. Assigns audit to Anga (task-001)
2. Waits for completion
3. Assigns documentation to Anga (task-002) with audit results
```

### Parallel Tasks (Independent)

```
User: "Evaluate students, review code, create marketing"

Orchestrator:
1. Assigns all three tasks simultaneously
   - Marie: student evaluation
   - Anga: code review
   - Fabien: marketing campaign
2. All execute in parallel
3. Orchestrator waits for all
4. Synthesizes combined results
```

### Collaborative Tasks

```
User: "Build a feature, test it, and announce it"

Orchestrator:
1. Anga: Build feature
2. Anga: Test feature (depends on step 1)
3. Fabien: Write announcement (can run parallel with step 2)
```

---

## File-Based Communication

### Task File Format

```json
{
  "task_id": "task-1731849600-a1b2",
  "timestamp": "2025-11-17T10:00:00Z",
  "worker": "marie",
  "priority": "high",
  "description": "Evaluate intermediate dance students",
  "context": {
    "user_request": "Original request",
    "focus": "intermediate level"
  },
  "requirements": [
    "Assess technique in ballet, jazz, contemporary",
    "Rate flexibility, strength, musicality"
  ],
  "expected_output": {
    "format": "markdown",
    "artifacts": ["student-evaluations", "summary-report"]
  },
  "timeout_seconds": 600
}
```

### Result File Format

```json
{
  "task_id": "task-1731849600-a1b2",
  "worker": "marie",
  "status": "complete",
  "timestamp_start": "2025-11-17T10:00:05Z",
  "timestamp_complete": "2025-11-17T10:04:30Z",
  "execution_time_seconds": 265,
  "findings": {
    "summary": "Evaluated 8 students. Strong progress overall.",
    "details": [...]
  },
  "artifacts": [
    {
      "type": "evaluations",
      "path": "/results/marie/artifacts/student-evaluations-q4.md"
    }
  ],
  "errors": []
}
```

---

## Key Principles

### 1. All Instances Are CLI

- NOT Python scripts calling APIs
- ALL are full `claude` CLI instances
- Each uses web authentication (browser login)
- Same pricing as Claude Code (not API per-token)

### 2. File-Based Communication

- Orchestrator writes tasks → `/tasks/{worker}/`
- Workers read tasks, execute, write results → `/results/{worker}/`
- No direct agent-to-agent communication
- Asynchronous, decoupled

### 3. Native Tools Only

Each agent uses only Claude's built-in tools:
- **Read** - Read files
- **Write** - Create/update files
- **Bash** - Execute shell commands
- **Grep** - Search file contents

No custom APIs, no external dependencies.

### 4. Single Source of Truth

- **ONE set of prompts** in `core/prompts/`
- No duplicates, no confusion
- Easy to maintain and update

---

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose logs

# Verify authentication
ls shared/auth-homes/orchestrator/.claude/
ls shared/auth-homes/marie/.claude/
ls shared/auth-homes/anga/.claude/
ls shared/auth-homes/fabien/.claude/
```

### Worker Not Picking Up Tasks

```bash
# Attach to worker and check
docker attach marie

# In another terminal, verify task file exists
ls shared/tasks/marie/

# Check worker logs
docker-compose logs marie
```

### Orchestrator Not Responding

```bash
# Restart orchestrator
docker-compose restart orchestrator

# Check logs
docker-compose logs orchestrator
```

---

## Architecture Benefits

✅ **Specialization** - Each worker expert in their domain
✅ **Parallelization** - Independent tasks run simultaneously (90.2% performance improvement)
✅ **Scalability** - Easy to add more workers
✅ **Debuggable** - Attach to any container, inspect files
✅ **Cost-Effective** - Web session auth, Claude Code pricing
✅ **Fault-Tolerant** - Isolated containers, task reassignment
✅ **Simple** - No custom infrastructure, just files and CLI

---

## Adding a New Worker

1. Create prompt file in `core/prompts/`
2. Add service to `docker-compose.yml`
3. Create task/result directories in `shared/`
4. Authenticate the new worker
5. Restart system

Example: Adding "Alex" (finance expert):

```yaml
# docker-compose.yml
alex:
  image: docker/sandbox-templates:claude-code
  container_name: alex
  command: bash -c "cp /prompts/FINANCE.md /workspace/CLAUDE.md && claude"
  volumes:
    - ./prompts:/prompts:ro
    - ./shared/auth-homes/alex:/home/agent/.claude:rw
    - ./shared/tasks/alex:/tasks:ro
    - ./shared/results/alex:/results:rw
```

---

## Documentation

- **Architecture**: `../docs/SIMPLIFIED_ARCHITECTURE.md`
- **How It Works**: `../docs/HOW_IT_WORKS.md`
- **Original Spec**: `../architecture.md`

---

**That's it! Simple, clean, and powerful multi-agent orchestration.**

Start the system, attach to orchestrator, and delegate complex work to specialized experts.
