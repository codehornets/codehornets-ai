# Simplified Architecture - The Truth

**Date**: 2025-11-17

---

## You Were Right to Be Confused! 🎯

The folder structure was unnecessarily complex. Here's what you ACTUALLY need:

---

## The ONLY Structure You Need

```
@codehornets-ai/
├── core/                          # Everything for orchestration
│   ├── docker-compose.yml         # Runs 4 containers
│   ├── prompts/                   # THE ONLY PROMPTS
│   │   ├── orchestrator.md       # Orchestrator behavior
│   │   ├── DANCE.md              # Marie's expertise
│   │   ├── ANGA.md               # Anga's expertise
│   │   └── FABIEN.md             # Fabien's expertise
│   └── shared/
│       ├── tasks/                # Task queue
│       │   ├── marie/
│       │   ├── anga/
│       │   └── fabien/
│       ├── results/              # Outputs
│       │   ├── marie/
│       │   ├── anga/
│       │   └── fabien/
│       └── auth-homes/           # Web auth
│           ├── orchestrator/
│           ├── marie/
│           ├── anga/
│           └── fabien/
│
└── workspaces/                    # Where agents work
    ├── dance/                    # Marie's workspace
    ├── coding/                   # Anga's workspace
    └── marketing/                # Fabien's workspace
```

**That's it. Nothing else needed.**

---

## What About domains/?

**Answer**: It was for a DIFFERENT use case (standalone assistants) that you DON'T need.

**What to do**: Ignore it or delete it.

---

## How It Actually Works

### Step 1: You Talk to Orchestrator

```
You: "Evaluate all dance students and create a marketing campaign"
```

### Step 2: Orchestrator Analyzes

```javascript
// Orchestrator (using orchestrator.md prompt) thinks:
"This needs:
 - Dance evaluation → Marie (DANCE.md)
 - Marketing campaign → Fabien (FABIEN.md)"
```

### Step 3: Orchestrator Creates Tasks

```javascript
// Write task for Marie
Write("/tasks/marie/task-001.json", {
  task_id: "task-001",
  description: "Evaluate all intermediate dance students",
  requirements: ["Assess technique", "Rate skills", ...]
})

// Write task for Fabien
Write("/tasks/fabien/task-002.json", {
  task_id: "task-002",
  description: "Create marketing campaign for recital",
  requirements: ["Social posts", "Email template", ...]
})
```

### Step 4: Workers Pick Up Tasks

**Marie** (running with DANCE.md prompt):
```javascript
// Marie's loop (defined in DANCE.md)
while (true) {
  // Check for tasks
  const tasks = Bash("ls /tasks/*.json")

  if (tasks) {
    // Read task
    const task = Read("/tasks/task-001.json")

    // Execute using dance expertise
    // ... evaluate students ...

    // Write result
    Write("/results/task-001.json", {
      status: "complete",
      findings: "Evaluated 8 students...",
      artifacts: ["student-evaluations.md"]
    })

    // Clean up
    Bash("rm /tasks/task-001.json")
  }

  sleep(5)
}
```

**Fabien** (running with FABIEN.md prompt):
```javascript
// Same pattern, different expertise
while (true) {
  const tasks = Bash("ls /tasks/*.json")
  // ... create marketing campaign ...
  // ... write results ...
}
```

### Step 5: Orchestrator Collects Results

```javascript
// Orchestrator monitors
while (pendingTasks > 0) {
  const results = Bash("ls /results/*.json")
  // When all done, read them
}

const marieResult = Read("/results/task-001.json")
const fabienResult = Read("/results/task-002.json")
```

### Step 6: Orchestrator Synthesizes

```javascript
// Combine both results
response = `
✅ Student Evaluations Complete
${marieResult.findings}

✅ Marketing Campaign Created
${fabienResult.findings}

All materials ready for review!
`
```

### Step 7: You Get Answer

```
Orchestrator: "I've completed both tasks:

Student Evaluations:
- Evaluated 8 intermediate students
- Overall strong progress
- [details...]

Marketing Campaign:
- 6-week social media calendar
- Email template series
- [details...]

All files created in workspaces/"
```

---

## There's Only ONE Marie

**Not two Maries!** Just one:
- Container: `marie` (Docker)
- Prompt: `core/prompts/DANCE.md`
- Workspace: `workspaces/dance/`

Same for Anga and Fabien.

---

## How You Control Which Worker

### Option 1: Let Orchestrator Decide (Recommended)

```
You: "Review the codebase for bugs"

Orchestrator: *automatically chooses Anga (coding expert)*
```

### Option 2: Be Explicit

```
You: "Have Marie evaluate the students and Fabien create social posts"

Orchestrator: *uses exactly who you specified*
```

### Option 3: Ask Orchestrator

```
You: "Which agent should handle user onboarding documentation?"

Orchestrator: "I'd use Anga for technical docs and Fabien for
               user-facing copy. Want me to assign both?"
```

---

## The Complete Flow (Real Example)

**Your request**:
```
"Audit the authentication code, document findings, and write a blog post about our security improvements"
```

**What happens**:

```
1. Orchestrator analyzes:
   - Audit code → Anga
   - Document findings → Anga
   - Blog post → Fabien

2. Orchestrator creates tasks:
   Write("/tasks/anga/audit-001.json")
   Write("/tasks/anga/docs-002.json") // depends on audit-001
   Write("/tasks/fabien/blog-003.json") // depends on audit-001

3. Workers execute in parallel where possible:
   Anga: Audits code → writes result
   (orchestrator waits)

   Anga: Documents findings → writes result
   Fabien: Writes blog post → writes result
   (these run in parallel)

4. Orchestrator collects:
   auditResult = Read("/results/anga/audit-001.json")
   docsResult = Read("/results/anga/docs-002.json")
   blogResult = Read("/results/fabien/blog-003.json")

5. Orchestrator synthesizes:
   "Security audit complete! Found 3 issues (all fixed).
    Documentation updated in /docs/security.md
    Blog post ready at /blog/security-update.md"

6. You get complete answer with all work done
```

---

## File Structure Clarity

```
core/prompts/DANCE.md        ← Marie's brain (expertise + orchestration behavior)
core/prompts/ANGA.md         ← Anga's brain
core/prompts/FABIEN.md       ← Fabien's brain
core/prompts/orchestrator.md ← Orchestrator's brain

These are the ONLY prompt files.
No duplicates. No confusion.
```

---

## Deploy and Use

### 1. Authenticate
```bash
cd core

# Auth each agent (one time)
docker run -it --rm \
  -v $(pwd)/shared/auth-homes/orchestrator:/home/agent/.claude \
  docker/sandbox-templates:claude-code claude

# Repeat for marie, anga, fabien
```

### 2. Start System
```bash
docker-compose up -d
```

### 3. Talk to Orchestrator
```bash
docker attach orchestrator

# Now just talk naturally:
"Evaluate dance students"
"Review my code"
"Create marketing content"
"Do all three things at once"
```

---

## Key Points

1. **One set of prompts** in core/prompts/
2. **Orchestrator decides** which worker(s) to use
3. **You can be explicit** if you want ("Have Marie do X")
4. **Workers run automatically** in Docker containers
5. **File-based communication** (tasks/ and results/)
6. **No manual worker spawning** - they're always running

---

## What You DON'T Need

❌ domains/ folder (different use case)
❌ Multiple versions of prompts
❌ Manual worker management
❌ Separate launcher scripts
❌ Complex coordination code

---

## What You DO Need

✅ core/prompts/ (4 prompt files)
✅ core/docker-compose.yml
✅ core/shared/ (tasks + results + auth)
✅ workspaces/ (where work happens)

---

**The architecture is actually SIMPLE once you strip away the confusion!**

You talk to orchestrator → it delegates → workers execute → you get results.

That's it. 🎯
