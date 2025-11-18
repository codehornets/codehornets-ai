# How to Verify the Orchestrator Works Properly

**Date**: 2025-11-17

---

## Quick Verification Test

Once you trust the folder in Claude Code, ask the orchestrator:

```
"Explain your role and what you can do"
```

**Expected Response**: The orchestrator should describe itself as a coordinator that manages Marie (dance), Anga (coding), and Fabien (marketing), and explain the file-based task delegation system.

---

## What the Orchestrator Knows

The orchestrator has been configured with these capabilities:

### 1. Core Identity

✅ **Knows it's an orchestrator** coordinating multiple workers
✅ **Knows the three workers**:
   - Marie (Dance teaching expert)
   - Anga (Software development expert)
   - Fabien (Marketing expert)
✅ **Understands file-based communication** through `/tasks/` and `/results/`

### 2. Key Capabilities

The orchestrator knows how to:

1. **Analyze requests** - Break down complex tasks
2. **Delegate to workers** - Choose the right expert
3. **Create task files** - Write JSON files to `/tasks/{worker}/`
4. **Monitor progress** - Check for task completion
5. **Read results** - Get outputs from `/results/{worker}/`
6. **Synthesize responses** - Combine multiple worker outputs

### 3. Worker Expertise

**Marie (Dance)**:
- Student evaluations
- Choreography planning
- Technique analysis
- Performance preparation

**Anga (Coding)**:
- Code implementation
- Bug fixing
- Architecture design
- Code reviews

**Fabien (Marketing)**:
- Marketing campaigns
- Social media content
- Promotional materials
- Brand messaging

---

## Verification Tests

### Test 1: Self-Awareness

**Ask**: `"What is your role?"`

**Expected**: Should explain orchestrator role, mention the three workers, describe file-based communication.

### Test 2: Worker Knowledge

**Ask**: `"Who are your available workers and what can they do?"`

**Expected**: Should list Marie, Anga, and Fabien with their expertise areas.

### Test 3: Simple Delegation

**Ask**: `"Have Marie evaluate a student named Test Student"`

**Expected**: Orchestrator should:
1. Recognize this is a dance task
2. Create a task file in `/tasks/marie/`
3. Wait for Marie to process it
4. Read the result from `/results/marie/`
5. Present the evaluation

**You can verify by opening another terminal and running**:
```bash
# Watch task creation
watch -n 1 'ls -la core/shared/tasks/marie/'

# Watch results
watch -n 1 'ls -la core/shared/results/marie/'
```

### Test 4: Parallel Delegation

**Ask**: `"Evaluate a dance student, review some code, and create a social media post"`

**Expected**: Orchestrator should:
1. Create 3 tasks (one for each worker)
2. All three execute in parallel
3. Synthesize all results into one response

**Verify**:
```bash
# Check all task directories
ls -la core/shared/tasks/*/
```

---

## How the Orchestrator Workflow Works

### Step 1: User Request
```
You: "Evaluate Emma Rodriguez's dance progress"
```

### Step 2: Orchestrator Analysis
```javascript
Orchestrator thinks:
- This is about dance → Marie is the expert
- Need student evaluation → Marie's specialty
- Create task for Marie
```

### Step 3: Task Creation
```bash
# Orchestrator executes:
Write("/tasks/marie/task-1731849600-abc123.json", {
  task_id: "task-1731849600-abc123",
  description: "Evaluate Emma Rodriguez's dance progress",
  requirements: [
    "Assess technique in ballet, jazz, contemporary",
    "Rate flexibility, strength, musicality"
  ]
})
```

### Step 4: Worker Picks Up Task
```javascript
// Marie (running in her container) checks every 5 seconds:
const tasks = Bash("ls /tasks/*.json")
if (tasks) {
  const task = Read("/tasks/task-1731849600-abc123.json")
  // Execute evaluation using dance expertise
}
```

### Step 5: Worker Writes Result
```bash
Write("/results/marie/task-1731849600-abc123.json", {
  status: "complete",
  findings: {
    summary: "Emma shows strong progress...",
    details: [...]
  }
})
```

### Step 6: Orchestrator Reads Result
```javascript
const result = Read("/results/marie/task-1731849600-abc123.json")
```

### Step 7: Orchestrator Responds
```
Orchestrator: "✓ Evaluation complete for Emma Rodriguez.

[Presents Marie's findings in formatted way]"
```

---

## Configuration Verification

### Check Orchestrator Prompt is Loaded

The orchestrator's behavior is defined in:
```
core/prompts/orchestrator.md
```

This file is copied to `/workspace/CLAUDE.md` inside the container at startup:
```yaml
# In docker-compose.yml
command: >
  bash -c "
  cp /prompts/orchestrator.md /workspace/CLAUDE.md &&
  claude
  "
```

### Check Workers Are Running

```bash
# From another terminal
make status

# Should show:
# NAME            IMAGE                                   STATUS
# orchestrator    docker/sandbox-templates:claude-code    Up
# marie           docker/sandbox-templates:claude-code    Up
# anga            docker/sandbox-templates:claude-code    Up
# fabien          docker/sandbox-templates:claude-code    Up
```

### Check Worker Prompts

Workers use combined prompts (agent + domain):

```bash
# Marie uses combine-prompts.sh
/prompts/combine-prompts.sh \
  /prompts/agents/Marie.md \
  /prompts/domains/DANCE.md \
  /workspace/CLAUDE.md
```

---

## Common Issues and Solutions

### Issue: Orchestrator doesn't know about workers

**Symptom**: Orchestrator says "I don't have access to workers" or similar

**Solution**: Check `core/prompts/orchestrator.md` has the worker definitions

**Verify**:
```bash
grep -A 10 "Available Workers" core/prompts/orchestrator.md
```

### Issue: Tasks aren't being picked up

**Symptom**: Task files created but workers never process them

**Solution**: Check workers are running and monitoring tasks

**Verify**:
```bash
# Check if workers are running
make status

# Attach to a worker to see what it's doing
make attach-marie

# Check worker logs
make logs-marie
```

### Issue: Results not appearing

**Symptom**: Workers process tasks but orchestrator doesn't see results

**Solution**: Check file permissions and paths

**Verify**:
```bash
# Check results directory exists
ls -la core/shared/results/*/

# Check permissions
ls -ld core/shared/results/
```

---

## Interactive Verification Session

Try this conversation with the orchestrator:

```
You: "Explain your role"
[Verify orchestrator describes coordination role]

You: "List your available workers"
[Verify Marie, Anga, Fabien are mentioned]

You: "What can Marie do?"
[Verify dance expertise is described]

You: "What can Anga do?"
[Verify coding expertise is described]

You: "What can Fabien do?"
[Verify marketing expertise is described]

You: "How do you communicate with workers?"
[Verify file-based system is described]

You: "Create a simple test task for Marie"
[Verify orchestrator creates task file]
```

---

## Success Indicators

The orchestrator is working properly if:

✅ It describes its role as coordinator
✅ It knows about Marie, Anga, and Fabien
✅ It can explain each worker's expertise
✅ It understands file-based communication
✅ It can create task files when you request something
✅ It monitors for results
✅ It synthesizes multi-worker responses

---

## Live Monitoring

While testing, keep these running in separate terminals:

**Terminal 1**: Orchestrator
```bash
make attach
```

**Terminal 2**: Task monitoring
```bash
watch -n 1 'find core/shared/tasks -name "*.json" 2>/dev/null'
```

**Terminal 3**: Results monitoring
```bash
watch -n 1 'find core/shared/results -name "*.json" 2>/dev/null'
```

**Terminal 4**: Worker logs
```bash
make logs
```

---

## Next Steps

1. **Trust the folder** in Claude Code (press 1)
2. **Ask self-awareness question**: `"What is your role?"`
3. **Test simple delegation**: `"Have Marie evaluate a test student"`
4. **Monitor files** in another terminal
5. **Verify result** appears and orchestrator synthesizes it
6. **Try parallel tasks**: Multiple workers at once

If all these work, your orchestrator is functioning correctly! 🎯

---

**Generated**: 2025-11-17
**Status**: Verification guide
**Purpose**: Help verify orchestrator is properly configured
