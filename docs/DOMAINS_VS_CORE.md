# domains/ vs core/ - What's the Difference? 🤔

**Date**: 2025-11-17

---

## TL;DR

```
domains/  → Knowledge & Capabilities (What they know)
            Templates, skills, documentation
            Size: 150KB (lightweight)

core/     → Runtime & Orchestration (How they run)
            Docker containers, task queue, results
            Size: 100MB (infrastructure)
```

---

## The Simple Analogy

Think of it like **employees at a company**:

### domains/ = The Employee Handbook 📚
- **What**: Job descriptions, expertise, training materials
- **Contains**: Knowledge, templates, skills, documentation
- **For**: Defining what each specialist knows and how they behave
- **Size**: Lightweight (150KB total)

### core/ = The Office Building 🏢
- **What**: The workplace infrastructure where employees actually work
- **Contains**: Desks (containers), task queue (inbox), file system (shared drive)
- **For**: Running the multi-agent orchestration system
- **Size**: Heavy (100MB - Docker infrastructure)

---

## Detailed Breakdown

### 📚 domains/ - Knowledge Repository

**Purpose**: Store domain-specific knowledge, behavior definitions, and templates

**Structure**:
```
domains/
├── dance/marie/           # Marie's knowledge base
│   ├── templates/         # Behavior & document templates
│   │   ├── DANCE.md      # "Who is Marie" - behavior definition
│   │   ├── student-profile-template.md
│   │   ├── class-notes-template.md
│   │   └── progress-log-template.md
│   ├── skills/           # Domain-specific skills
│   │   └── dance-terminology.md
│   ├── agents/           # Sub-agents for specialized tasks
│   │   ├── choreography-assistant.md
│   │   └── progress-tracker.md
│   ├── evaluations/      # Example evaluation workflows
│   ├── knowledge/        # Domain knowledge base
│   ├── docs/             # Documentation
│   ├── tests/            # Test scenarios
│   └── launchers/        # Launch scripts
│       └── marie.sh
│
├── coding/anga/          # Anga's knowledge base
│   ├── templates/
│   │   └── ANGA.md      # "Who is Anga"
│   ├── docs/
│   ├── launchers/
│   └── tests/
│
└── marketing/fabien/     # Fabien's knowledge base
    ├── templates/
    │   └── FABIEN.md    # "Who is Fabien"
    ├── docs/
    ├── launchers/
    └── tests/
```

**What it contains**:
- ✅ **Behavior definitions** (DANCE.md, ANGA.md, FABIEN.md)
- ✅ **Templates** (student profiles, class notes, reports)
- ✅ **Skills** (domain-specific knowledge)
- ✅ **Documentation** (how to use each assistant)
- ✅ **Launchers** (scripts to start each assistant standalone)
- ✅ **Tests** (validation scenarios)

**Use case**: Running assistants **standalone** in workspaces
```bash
# Navigate to workspace
cd workspaces/dance/studio

# Launch Marie standalone (not orchestrated)
../../../domains/dance/marie/launchers/marie.sh

# Marie introduces herself with her DANCE.md personality
```

**Key point**: domains/ is for **individual use** - each assistant can work independently

---

### 🏢 core/ - Runtime Infrastructure

**Purpose**: Multi-agent orchestration system where multiple agents work together

**Structure**:
```
core/
├── docker-compose.yml          # Defines 4 containers
├── prompts/                    # System prompts for orchestration
│   ├── orchestrator-correct.md  # Orchestrator behavior
│   ├── DANCE.md                # Marie's orchestration role
│   ├── ANGA.md                 # Anga's orchestration role
│   └── FABIEN.md               # Fabien's orchestration role
├── shared/                     # Communication layer
│   ├── tasks/                  # Task queue
│   │   ├── marie/              # Tasks for Marie
│   │   ├── anga/               # Tasks for Anga
│   │   └── fabien/             # Tasks for Fabien
│   ├── results/                # Completed work
│   │   ├── marie/              # Marie's outputs
│   │   ├── anga/               # Anga's outputs
│   │   └── fabien/             # Fabien's outputs
│   └── auth-homes/             # Web session auth
│       ├── orchestrator/
│       ├── marie/
│       ├── anga/
│       └── fabien/
├── agents/                     # Agent-specific configs
│   ├── orchestrator/
│   ├── marie/
│   ├── anga/
│   └── fabien/
├── node_modules/              # Dependencies (100MB)
└── vendor/                    # Vendored tools
```

**What it contains**:
- ✅ **Docker infrastructure** (docker-compose.yml)
- ✅ **Orchestrator** (coordinates multiple agents)
- ✅ **Task queue system** (file-based communication)
- ✅ **Shared file system** (tasks/, results/, auth-homes/)
- ✅ **Runtime dependencies** (node_modules, vendor tools)
- ✅ **Orchestration prompts** (how agents work together)

**Use case**: Running assistants **together** in orchestrated system
```bash
# Start all 4 agents (orchestrator + marie + anga + fabien)
cd core
docker-compose up -d

# Attach to orchestrator
docker attach orchestrator

# Make a complex request
"Evaluate all students, update the website, and create a marketing campaign"

# Orchestrator decomposes into tasks:
# - Marie: Evaluate students
# - Anga: Update website
# - Fabien: Create campaign
```

**Key point**: core/ is for **collaborative use** - agents work together on complex tasks

---

## Why Two Separate Folders?

### Separation of Concerns

**domains/** = **WHAT** they know (portable knowledge)
- Can be used standalone
- Easy to add new domains
- Lightweight and maintainable
- Reusable across different deployments

**core/** = **HOW** they collaborate (orchestration runtime)
- Multi-agent coordination
- Task queue and results
- Docker infrastructure
- Runtime dependencies

---

## Visual Comparison

### Standalone Use (domains/)

```
┌─────────────────────────────────────┐
│  User in dance studio workspace     │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │  marie.sh launcher │
    │  (copies DANCE.md) │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────┐
    │   Claude Code      │
    │   with DANCE.md    │
    │   personality      │
    └────────────────────┘
             │
    User talks directly to Marie
```

**Files used**:
- `domains/dance/marie/templates/DANCE.md`
- `domains/dance/marie/templates/*.md` (templates)
- `workspaces/dance/studio/` (user workspace)

---

### Orchestrated Use (core/)

```
┌────────────────────────────────────────┐
│  User talks to Orchestrator            │
└───────────┬────────────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │   Orchestrator     │  (reads orchestrator-correct.md)
   │   (Docker)         │
   └────────┬───────────┘
            │ Creates task files
            ▼
   ┌─────────────────────────────┐
   │   Task Queue (shared/)      │
   │   /tasks/marie/task-1.json  │
   │   /tasks/anga/task-2.json   │
   │   /tasks/fabien/task-3.json │
   └──────┬──────┬────────┬──────┘
          │      │        │
   Workers monitor queues
          ▼      ▼        ▼
   ┌──────┐ ┌─────┐ ┌────────┐
   │Marie │ │Anga │ │Fabien  │  (each reads their DANCE/ANGA/FABIEN.md)
   │(CLI) │ │(CLI)│ │(CLI)   │
   └───┬──┘ └──┬──┘ └───┬────┘
       │       │        │
   Write results
       ▼       ▼        ▼
   ┌─────────────────────────────┐
   │   Results (shared/)         │
   │   /results/marie/result.json│
   │   /results/anga/result.json │
   └────────────┬────────────────┘
                │
   Orchestrator synthesizes
                ▼
           User gets answer
```

**Files used**:
- `core/docker-compose.yml`
- `core/prompts/orchestrator-correct.md`
- `core/prompts/DANCE.md` (copied from domains/)
- `core/prompts/ANGA.md` (copied from domains/)
- `core/prompts/FABIEN.md` (copied from domains/)
- `core/shared/tasks/` (task queue)
- `core/shared/results/` (outputs)

---

## File Relationship

### domains/ prompts → core/ prompts

The prompts in `core/prompts/` are **modified versions** of the domain templates:

**Original** (domains/):
```markdown
# domains/dance/marie/templates/DANCE.md

You are Marie, a dance teacher assistant.
Focus on student tracking and studio management.
```

**Orchestration version** (core/):
```markdown
# core/prompts/DANCE.md

You are Marie, a dance teacher assistant in a multi-agent system.

[Same expertise as domains/ version]

PLUS:

## Worker Mode (Orchestration)
- Monitor /tasks/ directory for new task files
- Read task JSON, process it
- Write results to /results/
- Delete task file when done
```

The core/ prompts **extend** the domain knowledge with orchestration behavior.

---

## When to Use Each

### Use domains/ when:
✅ You want to work with **one specialist** at a time
✅ You're in a **specific domain workspace** (dance studio, coding project, marketing campaign)
✅ You want **quick access** to a specialist
✅ You don't need coordination between specialists

**Example**:
```bash
cd workspaces/dance/my-studio
make marie
# Just talk to Marie about dance students
```

### Use core/ when:
✅ You have **complex tasks** requiring multiple specialists
✅ You need **coordination** between different domains
✅ You want **parallel processing** of independent tasks
✅ You need **orchestrated workflows**

**Example**:
```bash
cd core
docker-compose up -d
docker attach orchestrator

# "Evaluate all students, update the website code,
#  and create a marketing campaign for the recital"

# Orchestrator delegates to Marie, Anga, and Fabien
```

---

## Analogy: Restaurant

### domains/ = Recipe Books
- **Dance recipes** (Marie's cookbook)
- **Coding recipes** (Anga's cookbook)
- **Marketing recipes** (Fabien's cookbook)

Each chef can follow their recipes independently in their own kitchen.

### core/ = Restaurant Kitchen Management
- **Head chef** (Orchestrator) coordinates the team
- **Order system** (task queue)
- **Plating station** (results)
- **Multiple chefs** working together on complex meals

When a customer orders a full 5-course meal, the head chef splits work across specialists.

---

## Summary Table

| Aspect | domains/ | core/ |
|--------|----------|-------|
| **Purpose** | Knowledge & templates | Runtime & orchestration |
| **Size** | 150KB (lightweight) | 100MB (infrastructure) |
| **Usage** | Standalone assistants | Multi-agent system |
| **Contains** | Behavior, templates, skills | Docker, task queue, runtime |
| **Launch** | `make marie` (one agent) | `docker-compose up` (all agents) |
| **Communication** | Direct user ↔ agent | File-based task queue |
| **Dependencies** | None (just templates) | Docker, node_modules |
| **Portable** | ✅ Yes (just copy files) | ❌ No (needs infrastructure) |
| **Extendable** | ✅ Easy (add new domain) | ✅ Easy (add to docker-compose) |

---

## The Relationship

```
domains/               core/
  ↓                     ↑
  └─ DANCE.md ─────────┐
                       ├─→ core/prompts/DANCE.md
  └─ ANGA.md ──────────┤    + orchestration behavior
                       │    + file monitoring
  └─ FABIEN.md ────────┘    + task processing
```

**domains/** provides the **base knowledge**
**core/** adds **orchestration capabilities**

---

## Best Practices

### For domains/:
1. Keep it lightweight (templates, docs, skills)
2. Focus on domain expertise
3. Make each domain independently usable
4. No infrastructure or runtime dependencies

### For core/:
1. Keep orchestration logic separate from domain knowledge
2. Use docker-compose for infrastructure
3. Maintain task/result schemas
4. Monitor system health and performance

---

## Future Expansion

### Adding a new domain (e.g., Finance)

**Step 1**: Create in domains/
```bash
mkdir -p domains/finance/alex
# Add templates, launchers, docs
```

**Step 2**: Add to core/ orchestration
```yaml
# core/docker-compose.yml
alex:
  image: docker/sandbox-templates:claude-code
  command: bash -c "cp /prompts/FINANCE.md /workspace/CLAUDE.md && claude"
  volumes:
    - ./shared/tasks/alex:/tasks:ro
    - ./shared/results/alex:/results:rw
```

**Now you have**:
- ✅ Standalone finance assistant (`make alex`)
- ✅ Orchestrated finance specialist (part of multi-agent system)

---

**Generated**: 2025-11-17
**Key takeaway**: domains/ is the knowledge, core/ is the runtime
