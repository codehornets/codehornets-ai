# Architecture for Claude CLI Orchestrator/Workers Pattern

Anthropic's official multi-agent research system achieves **90.2% better performance** than single-agent approaches through orchestrator-worker patterns. This guide provides a complete architecture for implementing this pattern using multiple Claude Code CLI instances with custom system prompts and container isolation.

## Architecture overview

The orchestrator-worker pattern operates with a lead agent coordinating multiple specialized worker agents that execute tasks in parallel. Each worker has isolated context, preventing pollution while enabling true parallelization. Workers can spawn their own sub-agents for further task decomposition.

**Core architecture diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│           (Claude CLI with orchestrator prompt)              │
│  • Analyzes user requests                                    │
│  • Develops task decomposition strategy                      │
│  • Spawns specialized workers                                │
│  • Synthesizes results from workers                          │
└──────────────┬────────────────┬──────────────┬──────────────┘
               │                │              │
       ┌───────▼──────┐ ┌──────▼──────┐ ┌────▼──────────┐
       │  WORKER 1    │ │  WORKER 2   │ │  WORKER 3     │
       │   (Marie)    │ │   (Anga)    │ │  (Fabien)     │
       │  DANCE.md    │ │  ANGA.md    │ │  FABIEN.md    │
       │  Container   │ │  Container  │ │  Container    │
       └──────┬───────┘ └──────┬──────┘ └───────┬───────┘
              │                │                 │
        ┌─────▼──────┐   ┌────▼─────┐    ┌─────▼──────┐
        │ Sub-agent  │   │Sub-agent │    │ Sub-agent  │
        │ (via Task) │   │(via Task)│    │ (via Task) │
        └────────────┘   └──────────┘    └────────────┘

                     ┌──────────────────┐
                     │  SHARED STATE    │
                     │  Redis/FS/Queue  │
                     └──────────────────┘
```

**Communication flow:**

1. User request → Orchestrator
2. Orchestrator analyzes and creates task descriptions
3. Orchestrator spawns workers in parallel (Marie, Anga, Fabien)
4. Workers execute with isolated contexts and custom system prompts
5. Workers can spawn sub-agents using Task tool for further decomposition
6. Workers write results to shared filesystem/artifacts
7. Orchestrator reads artifacts (not full context) and synthesizes
8. Final response returned to user

## Implementation strategy

### Running multiple Claude CLI instances

Anthropic provides three official approaches for running multiple Claude instances, each with distinct isolation characteristics:

**Approach 1: Docker Sandbox (Official, Recommended)**

Anthropic's official Docker sandboxes provide secure, isolated environments for each worker.

```bash
# Official Anthropic image
docker pull docker/sandbox-templates:claude-code

# Start orchestrator
docker run -d --name orchestrator \
  -v ~/project:/workspace \
  -v ~/auth/orchestrator:/home/agent/.claude:ro \
  -e ANTHROPIC_API_KEY="$ORCHESTRATOR_KEY" \
  docker/sandbox-templates:claude-code \
  claude --system-prompt-file /workspace/.claude/orchestrator.md

# Start worker: Marie (DANCE.md)
docker run -d --name marie \
  -v ~/project:/workspace \
  -v ~/auth/marie:/home/agent/.claude:ro \
  -v ~/results/marie:/results:rw \
  docker/sandbox-templates:claude-code \
  claude --system-prompt-file /workspace/.claude/DANCE.md

# Start worker: Anga (ANGA.md)
docker run -d --name anga \
  -v ~/project:/workspace \
  -v ~/auth/anga:/home/agent/.claude:ro \
  -v ~/results/anga:/results:rw \
  docker/sandbox-templates:claude-code \
  claude --system-prompt-file /workspace/.claude/ANGA.md

# Start worker: Fabien (FABIEN.md)
docker run -d --name fabien \
  -v ~/project:/workspace \
  -v ~/auth/fabien:/home/agent/.claude:ro \
  -v ~/results/fabien:/results:rw \
  docker/sandbox-templates:claude-code \
  claude --system-prompt-file /workspace/.claude/FABIEN.md
```

**Approach 2: tmux Sessions (Lightweight, Development)**

AWS's CAO pattern uses tmux for orchestrating multiple CLI instances with lower overhead.

```bash
#!/bin/bash
# orchestrator-tmux.sh

WORKSPACE="$1"

# Create orchestrator session
tmux new-session -d -s orchestrator -c "$WORKSPACE" \
  "claude --system-prompt-file .claude/orchestrator.md"

# Spawn worker sessions
tmux new-session -d -s marie -c "$WORKSPACE" \
  "claude --system-prompt-file .claude/DANCE.md"

tmux new-session -d -s anga -c "$WORKSPACE" \
  "claude --system-prompt-file .claude/ANGA.md"

tmux new-session -d -s fabien -c "$WORKSPACE" \
  "claude --system-prompt-file .claude/FABIEN.md"

# Function to send task to worker
send_task() {
    worker=$1
    task=$2
    tmux send-keys -t "$worker" "$task" C-m
}

# Send tasks in parallel
send_task marie "Review authentication security"
send_task anga "Optimize database queries"
send_task fabien "Write integration tests"

# Monitor and capture results
for worker in marie anga fabien; do
    tmux capture-pane -t "$worker" -p > "results/$worker-output.txt"
done

echo "Attach to orchestrator: tmux attach -t orchestrator"
```

**Approach 3: Git Worktrees (Official Anthropic Pattern)**

For parallel development on different branches, Anthropic recommends git worktrees.

```bash
# Create isolated worktrees for each worker
git worktree add ../project-marie -b marie-auth-work
git worktree add ../project-anga -b anga-perf-work
git worktree add ../project-fabien -b fabien-test-work

# Each gets its own Claude instance
cd ../project-marie && claude --system-prompt-file DANCE.md &
cd ../project-anga && claude --system-prompt-file ANGA.md &
cd ../project-fabien && claude --system-prompt-file FABIEN.md &
```

### Modifying system prompts per worker

Claude CLI provides three flags for system prompt modification, with critical authentication considerations:

**System prompt flags:**

```bash
# Option 1: Complete replacement (removes all defaults)
claude --system-prompt "You are Marie, a security expert..."

# Option 2: File-based replacement
claude --system-prompt-file .claude/DANCE.md

# Option 3: Append to defaults (RECOMMENDED)
claude --append-system-prompt "Additional instructions for this worker"
```

**Best practice:** Use `--system-prompt-file` with complete worker definitions to ensure consistent behavior. The `--append-system-prompt` preserves Claude Code's default capabilities but may cause conflicts with custom orchestration protocols.

**Worker system prompt structure:**

```markdown
---
# .claude/DANCE.md (Marie's system prompt)
---

You are Marie, a specialized security code reviewer in a multi-agent system.

## Role
You focus exclusively on authentication, authorization, and security vulnerabilities.

## Communication Protocol
When you complete a task:
1. Write results to /results/marie/task-{id}.json
2. Use format: {"status": "complete", "findings": [...], "artifacts": [...]}
3. Post "DONE:marie:{task_id}" to orchestrator

## Capabilities
You have access to:
- Read, Grep, Glob tools for code analysis
- Bash tool for running security scanners
- Can spawn sub-agents for deep vulnerability analysis

## Sub-agent Spawning
For complex security audits, create specialized sub-agents:
- Create `.claude/agents/sec-audit.md` for focused reviews
- Use /agents command to manage sub-agents
- Sub-agents inherit your security focus

## Output Format
Always provide:
- Severity level (CRITICAL, HIGH, MEDIUM, LOW)
- Code location with line numbers
- Remediation steps
- Example secure code

## Boundaries
- Do NOT modify code (read-only analysis)
- Do NOT review performance or style (other workers)
- Focus only on security concerns
```

**Orchestrator prompt structure:**

```markdown
---
# .claude/orchestrator.md
---

You are the orchestrator in a multi-agent system coordinating specialized workers.

## Workers Available
- Marie (DANCE.md): Security expert, authentication, vulnerabilities
- Anga (ANGA.md): Performance specialist, optimization, scalability
- Fabien (FABIEN.md): Testing expert, coverage, quality assurance

## Orchestration Protocol

### Task Decomposition
1. Analyze user request
2. Identify which domains are involved
3. Create specific task descriptions for each worker
4. Determine dependencies between tasks
5. Plan execution order (parallel vs sequential)

### Task Assignment Format
Create task files in /tasks/ directory:
```json
{
  "task_id": "sec-001",
  "worker": "marie",
  "description": "Review auth.py for SQL injection vulnerabilities",
  "dependencies": [],
  "timeout": 300,
  "priority": "high"
}
```

### Worker Coordination
- For parallel tasks: Assign all simultaneously
- For dependent tasks: Use topological ordering
- Monitor /results/{worker}/ for completion signals
- Read artifact references only, not full outputs

### Synthesis Rules
1. Collect all worker artifacts
2. Identify conflicts or overlaps
3. Prioritize based on severity/impact
4. Create unified, actionable response
5. Include specific recommendations

## Never Do
- Do not implement code yourself
- Do not execute tasks that workers should handle
- Do not duplicate worker efforts
- Maintain pure coordination role
```

### Authentication and isolation

**Multi-organization authentication pattern:**

Each worker requires isolated authentication to prevent credential confusion and enable different accounts/tiers.

```bash
# Directory structure
~/auth-homes/
├── orchestrator/
│   ├── .claude/
│   │   └── config.json
│   └── .claude.json
├── marie/
│   ├── .claude/
│   │   ├── config.json
│   │   └── agents/  # Worker-specific sub-agents
│   └── .claude.json
├── anga/
│   ├── .claude/
│   └── .claude.json
└── fabien/
    ├── .claude/
    └── .claude.json

# Authentication setup per worker
# First-time setup for each worker
docker run -it --rm \
  -v ~/auth-homes/marie:/home/agent/.claude \
  docker/sandbox-templates:claude-code \
  claude  # Interactive auth flow

# After authentication, mount read-only
docker run -d --name marie \
  -v ~/auth-homes/marie:/home/agent/.claude:ro \
  -v ~/project:/workspace \
  docker/sandbox-templates:claude-code
```

**Environment variable alternative:**

```bash
# Separate API keys per worker (different accounts or rate limits)
docker run -d --name marie \
  -e ANTHROPIC_API_KEY="$MARIE_API_KEY" \
  -v ~/project:/workspace:ro \
  -v ~/results/marie:/results:rw \
  docker/sandbox-templates:claude-code

# For development with single account
export ANTHROPIC_API_KEY="sk-ant-..."
# All workers share same key but have isolated contexts
```

### Container isolation strategy

**Granular filesystem mounting (security-focused):**

```bash
#!/bin/bash
# isolated-worker.sh

docker run -d --name marie \
  # Code: Read-only to prevent accidental modifications
  -v ~/project/src:/workspace/src:ro \
  -v ~/project/tests:/workspace/tests:ro \
  \
  # Results: Write-only for output
  -v ~/results/marie:/results:rw \
  \
  # Auth: Read-only to prevent credential theft
  -v ~/auth-homes/marie:/home/agent/.claude:ro \
  \
  # Config: Read-only for worker-specific settings
  -v ~/project/.claude/DANCE.md:/workspace/.claude/DANCE.md:ro \
  \
  # Temp: Writable scratch space
  --tmpfs /tmp:rw,noexec,nosuid,size=1g \
  \
  # Resource limits
  --memory="4g" \
  --memory-swap="4g" \
  --cpus="2.0" \
  \
  # Security constraints
  --user 1000:1000 \
  --cap-drop=ALL \
  --read-only \
  --security-opt=no-new-privileges \
  \
  # Network isolation (whitelist pattern)
  --network=restricted \
  \
  docker/sandbox-templates:claude-code \
  claude --system-prompt-file /workspace/.claude/DANCE.md
```

**Network isolation with firewall:**

```bash
#!/bin/bash
# create-restricted-network.sh

# Create isolated Docker network
docker network create --driver bridge restricted

# Apply iptables rules (whitelist Anthropic API only)
docker run -d --name marie --network restricted \
  docker/sandbox-templates:claude-code

docker exec marie bash -c '
  iptables -P OUTPUT DROP
  iptables -A OUTPUT -d api.anthropic.com --dport 443 -j ACCEPT
  iptables -A OUTPUT -d registry.npmjs.org --dport 443 -j ACCEPT
  iptables -A OUTPUT -p udp --dport 53 -j ACCEPT  # DNS
'
```

**Process-level isolation:**

Each worker gets separate:
- Context window (prevents pollution)
- Conversation history
- File system view
- Tool execution environment
- Rate limit tracking

### Inter-CLI communication protocols

**Protocol 1: File-based artifacts (Anthropic pattern)**

Workers write artifacts and return lightweight references instead of full content.

```python
# orchestrator.py
import json
import subprocess
from pathlib import Path

class FileArtifactOrchestrator:
    def __init__(self):
        self.tasks_dir = Path("/tasks")
        self.results_dir = Path("/results")
        
    def create_task(self, worker, task_id, description):
        """Create task file for worker to pick up"""
        task = {
            "task_id": task_id,
            "worker": worker,
            "description": description,
            "status": "pending"
        }
        
        task_file = self.tasks_dir / worker / f"{task_id}.json"
        task_file.parent.mkdir(parents=True, exist_ok=True)
        task_file.write_text(json.dumps(task, indent=2))
        
        return task_file
    
    def assign_task(self, worker, task_file):
        """Send task to worker container"""
        subprocess.run([
            "docker", "exec", worker,
            "bash", "-c",
            f"cat {task_file} | claude -p 'Execute this task and write results to /results/{worker}/'"
        ])
    
    def read_result(self, worker, task_id):
        """Read worker result artifact"""
        result_file = self.results_dir / worker / f"{task_id}.json"
        
        # Wait for completion signal
        while not result_file.exists():
            time.sleep(1)
        
        return json.loads(result_file.read_text())
    
    def synthesize(self, results):
        """Aggregate results from all workers"""
        all_findings = []
        for worker, result in results.items():
            all_findings.extend(result.get("findings", []))
        
        # Use orchestrator to create synthesis
        synthesis_prompt = f"""
        Synthesize these findings from multiple workers:
        {json.dumps(all_findings, indent=2)}
        
        Create a unified, prioritized action plan.
        """
        
        result = subprocess.run(
            ["docker", "exec", "orchestrator", "claude", "-p", synthesis_prompt],
            capture_output=True, text=True
        )
        
        return result.stdout

# Usage
orchestrator = FileArtifactOrchestrator()

# Parallel task assignment
marie_task = orchestrator.create_task("marie", "sec-001", "Review auth.py for security issues")
anga_task = orchestrator.create_task("anga", "perf-001", "Profile database queries")
fabien_task = orchestrator.create_task("fabien", "test-001", "Add integration tests")

# Spawn workers in parallel
from concurrent.futures import ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=3) as executor:
    executor.submit(orchestrator.assign_task, "marie", marie_task)
    executor.submit(orchestrator.assign_task, "anga", anga_task)
    executor.submit(orchestrator.assign_task, "fabien", fabien_task)

# Collect results
results = {
    "marie": orchestrator.read_result("marie", "sec-001"),
    "anga": orchestrator.read_result("anga", "perf-001"),
    "fabien": orchestrator.read_result("fabien", "test-001")
}

# Synthesize
final_report = orchestrator.synthesize(results)
print(final_report)
```

**Protocol 2: Redis task queue**

For production systems requiring robust queueing and coordination.

```python
# redis_orchestrator.py
import redis
import json
import subprocess
import threading
from typing import Dict, List

class RedisOrchestrator:
    def __init__(self, redis_url="redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.workers = ["marie", "anga", "fabien"]
        
    def submit_task(self, worker: str, task: Dict):
        """Add task to worker's queue"""
        task_id = task["task_id"]
        
        # Add to worker's queue
        self.redis.lpush(f"queue:{worker}", json.dumps(task))
        
        # Track task status
        self.redis.hset(f"task:{task_id}", "status", "queued")
        self.redis.hset(f"task:{task_id}", "worker", worker)
        
        return task_id
    
    def worker_loop(self, worker_name: str):
        """Worker process that polls Redis queue"""
        while True:
            # Blocking pop from queue
            task_json = self.redis.brpop(f"queue:{worker_name}", timeout=1)
            
            if not task_json:
                continue
            
            task = json.loads(task_json[1])
            task_id = task["task_id"]
            
            try:
                # Update status
                self.redis.hset(f"task:{task_id}", "status", "running")
                
                # Execute via Claude CLI
                result = subprocess.run([
                    "docker", "exec", worker_name,
                    "claude", "-p", task["description"]
                ], capture_output=True, text=True, timeout=300)
                
                # Store result
                self.redis.hset(f"task:{task_id}", "status", "complete")
                self.redis.hset(f"task:{task_id}", "result", result.stdout)
                
                # Publish completion event
                self.redis.publish("task-complete", task_id)
                
            except Exception as e:
                self.redis.hset(f"task:{task_id}", "status", "failed")
                self.redis.hset(f"task:{task_id}", "error", str(e))
    
    def start_workers(self):
        """Start worker threads"""
        threads = []
        for worker in self.workers:
            t = threading.Thread(target=self.worker_loop, args=(worker,))
            t.daemon = True
            t.start()
            threads.append(t)
        return threads
    
    def wait_for_completion(self, task_ids: List[str], timeout=600):
        """Wait for all tasks to complete"""
        pubsub = self.redis.pubsub()
        pubsub.subscribe("task-complete")
        
        completed = set()
        for message in pubsub.listen():
            if message["type"] == "message":
                task_id = message["data"].decode()
                if task_id in task_ids:
                    completed.add(task_id)
                    
                if len(completed) == len(task_ids):
                    break
        
        # Fetch results
        results = {}
        for task_id in task_ids:
            results[task_id] = {
                "status": self.redis.hget(f"task:{task_id}", "status").decode(),
                "result": self.redis.hget(f"task:{task_id}", "result").decode()
            }
        
        return results

# Usage
orchestrator = RedisOrchestrator()
orchestrator.start_workers()

# Submit parallel tasks
task_ids = [
    orchestrator.submit_task("marie", {
        "task_id": "sec-001",
        "description": "Review authentication for SQL injection"
    }),
    orchestrator.submit_task("anga", {
        "task_id": "perf-001",
        "description": "Profile API response times"
    }),
    orchestrator.submit_task("fabien", {
        "task_id": "test-001",
        "description": "Write tests for user registration"
    })
]

# Wait for completion
results = orchestrator.wait_for_completion(task_ids)
print(json.dumps(results, indent=2))
```

**Protocol 3: MCP servers (structured communication)**

Model Context Protocol enables standardized tool interfaces between agents.

```typescript
// orchestrator-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "orchestrator",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Tool: Assign task to worker
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "assign_task") {
    const { worker, task_id, description } = request.params.arguments;
    
    // Create task file
    const task = { task_id, description, status: "pending" };
    await fs.writeFile(`/tasks/${worker}/${task_id}.json`, JSON.stringify(task));
    
    // Trigger worker
    await execAsync(`docker exec ${worker} claude -p "Process /tasks/${worker}/${task_id}.json"`);
    
    return {
      content: [{
        type: "text",
        text: `Task ${task_id} assigned to ${worker}`
      }]
    };
  }
  
  if (request.params.name === "get_worker_result") {
    const { worker, task_id } = request.params.arguments;
    const result = await fs.readFile(`/results/${worker}/${task_id}.json`, "utf-8");
    
    return {
      content: [{
        type: "text",
        text: result
      }]
    };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

Configure in orchestrator's `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "orchestrator": {
      "command": "node",
      "args": ["orchestrator-mcp-server.js"],
      "env": {
        "WORKERS": "marie,anga,fabien"
      }
    }
  }
}
```

### Enabling workers to spawn sub-agents

Claude Code's built-in sub-agent system enables workers to delegate further. This follows Anthropic's official pattern where **subagents cannot spawn other subagents** (prevents infinite nesting).

**Worker sub-agent configuration:**

```bash
# In worker container: /workspace/.claude/agents/
mkdir -p .claude/agents

# Marie's security sub-agent
cat > .claude/agents/vuln-scanner.md << 'EOF'
---
name: vuln-scanner
description: Deep vulnerability analysis for specific code patterns
tools: Read, Grep, Bash
model: sonnet
---

You are a vulnerability scanning specialist working under Marie.

Focus on:
- SQL injection patterns
- XSS vulnerabilities
- Insecure deserialization
- Authentication bypasses

Output format:
{
  "vulnerability": "SQL Injection",
  "location": "auth.py:45",
  "severity": "CRITICAL",
  "evidence": "Unsanitized user input in query",
  "fix": "Use parameterized queries"
}
EOF

# Anga's performance sub-agent
cat > .claude/agents/profiler.md << 'EOF'
---
name: profiler
description: Execute performance profiling and identify bottlenecks
tools: Bash, Read
model: haiku
---

Run performance profiling tools and analyze results.

Tools available:
- py-spy for Python profiling
- node --prof for Node.js
- perf for system-level analysis

Return: profiling report with hotspots identified
EOF
```

**Worker prompt section for sub-agent usage:**

```markdown
## Sub-agent Delegation

When you encounter complex subtasks:

1. Check available sub-agents: Use `/agents` command
2. Assess if sub-agent is needed (task requires specialized tools or deep focus)
3. Invoke explicitly: "Use the vuln-scanner subagent to analyze auth.py"
4. Automatic invocation: Claude will match task to subagent description
5. Synthesize sub-agent results into your final report

Sub-agents operate in isolated contexts and return compressed findings only.

Example workflow:
- You (Marie) receive: "Audit entire codebase for security"
- You spawn 3 sub-agents in parallel:
  - vuln-scanner for auth.py
  - vuln-scanner for api.py
  - vuln-scanner for database.py
- You synthesize their findings into unified security report
- You write report to /results/marie/audit-complete.json
```

**Task tool invocation (internal):**

The Task tool is Claude Code's internal mechanism for spawning sub-agents. It's automatically invoked when you create sub-agents or Claude determines a sub-agent should be used.

**Hooks for sub-agent monitoring:**

```json
// .claude/hooks.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[SUBAGENT START]' >> /logs/subagent-activity.log"
          }
        ]
      }
    ],
    "TaskEnd": [
      {
        "type": "command",
        "command": "echo '[SUBAGENT COMPLETE]' >> /logs/subagent-activity.log"
      }
    ]
  }
}
```

## Cost and performance considerations

### API rate limits (Tier 4 - Production)

For multi-agent orchestration, **Tier 4 is minimum viable** for production use:

- **Requests per minute:** 4,000 (66.7/second)
- **Input tokens per minute:** 400,000 (6,667/second)
- **Output tokens per minute:** 80,000 (1,333/second)
- **Tokens per day:** 2,000,000

**With 3 workers + 1 orchestrator (4 instances):**
- Per-instance capacity: ~1,000 RPM, ~100k input TPM, ~20k output TPM
- Sufficient for most development workflows
- Output tokens typically limiting factor

**Rate limit strategies:**

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_rpm=1000, max_tpm=100000):
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm
        self.request_times = deque()
        self.token_usage = deque()
    
    def wait_if_needed(self, estimated_tokens=1000):
        """Implement token bucket algorithm"""
        now = time.time()
        
        # Remove requests older than 1 minute
        while self.request_times and self.request_times[0] < now - 60:
            self.request_times.popleft()
        
        while self.token_usage and self.token_usage[0][0] < now - 60:
            self.token_usage.popleft()
        
        # Check if we're at limits
        current_rpm = len(self.request_times)
        current_tpm = sum(t[1] for t in self.token_usage)
        
        if current_rpm >= self.max_rpm or current_tpm + estimated_tokens >= self.max_tpm:
            # Wait until oldest request expires
            sleep_time = 60 - (now - self.request_times[0])
            time.sleep(max(0, sleep_time))
        
        # Record this request
        self.request_times.append(now)
        self.token_usage.append((now, estimated_tokens))

# Usage per worker
marie_limiter = RateLimiter(max_rpm=1000, max_tpm=100000)
marie_limiter.wait_if_needed(estimated_tokens=5000)
```

### Pricing and token economics

**Model selection strategy for orchestrator/workers:**

```
Orchestrator: Claude 4 Opus ($15 input, $75 output per MTok)
- Strategic planning, task decomposition, synthesis
- High-value decisions justify premium cost
- Typically lower volume than workers

Workers: Claude 4 Sonnet ($3 input, $15 output per MTok)
- Task execution, analysis, implementation
- 5× cheaper than Opus
- Higher volume but routine work

Sub-agents: Claude 3.5 Haiku ($0.25 input, $1.25 output per MTok)
- Simple, focused subtasks
- 12× cheaper than Sonnet
- Very high volume, lightweight operations
```

**Real-world cost example (10-agent research task):**

```
Orchestrator (Opus):
  Planning: 2,000 input + 500 output = $0.067
  Synthesis: 50,000 input + 2,000 output = $0.90

Workers (3x Sonnet):
  Research: 150,000 input + 30,000 output = $1.80

Sub-agents (6x Haiku):
  Focused tasks: 240,000 input + 12,000 output = $0.075

Total: ~$2.84 per complex research query
Daily (100 queries): ~$284
Monthly: ~$8,500

Compare to: Engineer time ($50k/month) for equivalent research depth
ROI: Positive for high-value, parallelizable tasks
```

### Context optimization with prompt caching

Prompt caching provides **up to 90% cost reduction** on repeated context. Essential for multi-agent systems where workers share common knowledge.

**Caching strategy for orchestrator:**

```python
# orchestrator_cached.py
import anthropic

client = anthropic.Anthropic()

# Define shared context (cached)
system_context = [
    {
        "type": "text",
        "text": open(".claude/orchestrator.md").read(),
        "cache_control": {"type": "ephemeral"}  # Cache system prompt
    },
    {
        "type": "text", 
        "text": open("project-context.md").read(),
        "cache_control": {"type": "ephemeral"}  # Cache project info
    }
]

# Variable content (not cached)
def orchestrate_task(user_request):
    messages = [{
        "role": "user",
        "content": user_request
    }]
    
    response = client.messages.create(
        model="claude-4-opus-20250514",
        max_tokens=4096,
        system=system_context,  # Cached on repeated calls
        messages=messages
    )
    
    return response

# First call: Writes cache (~$0.0225/MTok for Opus)
# Subsequent calls within 5min: Reads cache (~$0.0015/MTok)
# 90% savings on system context
```

**Worker caching pattern:**

```python
# marie_worker_cached.py
def review_security(file_path):
    # Cache Marie's system prompt + security knowledge base
    system = [
        {
            "type": "text",
            "text": open(".claude/DANCE.md").read(),
            "cache_control": {"type": "ephemeral"}
        },
        {
            "type": "text",
            "text": open("security-patterns.md").read(),  # 50KB knowledge base
            "cache_control": {"type": "ephemeral"}
        }
    ]
    
    # Variable: file content (not cached)
    messages = [{
        "role": "user",
        "content": f"Review this file:\n\n{open(file_path).read()}"
    }]
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        system=system,
        messages=messages
    )
    
    return response

# Analyzing 100 files:
# Without caching: ~$150 (60K tokens system × 100 × $0.003/1K)
# With caching: ~$18 (cache write once + 99 cache reads)
# Savings: $132 (88%)
```

### Performance optimization patterns

**Parallel execution benefits (Anthropic data):**

Multi-agent systems achieve dramatic performance improvements through parallelization:

- **Single agent:** Sequential tool calls, single context window
- **Multi-agent (3-5 workers):** 90.2% improvement on complex research tasks
- **Time reduction:** Up to 90% faster on parallelizable queries
- **Token usage:** 15× more tokens but distributed efficiently

**Optimization techniques:**

```python
# Pattern 1: Parallel tool calls per subagent
# Each subagent should invoke 3+ tools simultaneously
def worker_with_parallel_tools(task):
    """Worker pattern: Use parallel tool calling"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        messages=[{
            "role": "user",
            "content": f"""
            Analyze this codebase for {task}.
            
            Use these tools IN PARALLEL:
            1. Grep to find relevant files
            2. Read to examine code
            3. Bash to run tests
            
            Execute all 3 simultaneously for speed.
            """
        }]
    )

# Pattern 2: Spawn workers in parallel, not sequentially
from concurrent.futures import ThreadPoolExecutor

def orchestrate_parallel(tasks):
    """Launch all workers simultaneously"""
    with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        futures = [
            executor.submit(spawn_worker, worker, task)
            for worker, task in tasks.items()
        ]
        results = [f.result() for f in futures]
    return results

# Pattern 3: Context isolation prevents bottlenecks
# Each worker has independent context window
# Orchestrator reads artifacts (not full context)
# Avoids "telephone game" degradation
```

**Batch API for cost optimization:**

```python
# For non-urgent orchestration tasks
import anthropic

client = anthropic.Anthropic()

# Submit batch of tasks
batch = client.batches.create(
    requests=[
        {
            "custom_id": "marie-sec-001",
            "params": {
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "user", "content": "Review auth.py"}]
            }
        },
        {
            "custom_id": "anga-perf-001",
            "params": {
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "user", "content": "Profile queries"}]
            }
        }
    ]
)

# 50% cost savings
# Original: $3 input, $15 output
# Batch: $1.50 input, $7.50 output
```

## File structure and implementation

### Complete project structure

```
project/
├── .claude/
│   ├── orchestrator.md          # Orchestrator system prompt
│   ├── DANCE.md                 # Marie worker prompt
│   ├── ANGA.md                  # Anga worker prompt
│   ├── FABIEN.md                # Fabien worker prompt
│   ├── project-context.md       # Shared project knowledge
│   ├── agents/                  # Sub-agent definitions
│   │   ├── vuln-scanner.md
│   │   ├── profiler.md
│   │   └── test-generator.md
│   ├── hooks.json               # Lifecycle hooks
│   └── mcp.json                 # MCP server config
│
├── orchestration/
│   ├── docker-compose.yml       # Container orchestration
│   ├── orchestrator.py          # Main orchestrator script
│   ├── redis_coordinator.py     # Redis-based coordination
│   ├── file_coordinator.py      # File-based coordination
│   └── rate_limiter.py          # Rate limit management
│
├── auth-homes/                  # Isolated authentication
│   ├── orchestrator/
│   │   ├── .claude/
│   │   └── .claude.json
│   ├── marie/
│   ├── anga/
│   └── fabien/
│
├── tasks/                       # Task queue (file-based)
│   ├── marie/
│   ├── anga/
│   └── fabien/
│
├── results/                     # Worker outputs
│   ├── marie/
│   ├── anga/
│   └── fabien/
│
└── logs/
    ├── orchestrator.log
    └── subagent-activity.log
```

### Docker Compose orchestration

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  orchestrator:
    image: docker/sandbox-templates:claude-code
    container_name: orchestrator
    volumes:
      - ./project:/workspace
      - ./auth-homes/orchestrator:/home/agent/.claude:ro
      - ./results:/results
      - ./tasks:/tasks
    environment:
      - ANTHROPIC_API_KEY=${ORCHESTRATOR_API_KEY}
    command: >
      bash -c "
      cd /workspace &&
      claude --system-prompt-file .claude/orchestrator.md
      "
    depends_on:
      - redis

  marie:
    image: docker/sandbox-templates:claude-code
    container_name: marie
    volumes:
      - ./project:/workspace:ro
      - ./auth-homes/marie:/home/agent/.claude:ro
      - ./results/marie:/results:rw
      - ./tasks/marie:/tasks:ro
    environment:
      - ANTHROPIC_API_KEY=${MARIE_API_KEY}
    command: >
      bash -c "
      cd /workspace &&
      python3 /workspace/orchestration/worker_loop.py marie
      "
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  anga:
    image: docker/sandbox-templates:claude-code
    container_name: anga
    volumes:
      - ./project:/workspace:ro
      - ./auth-homes/anga:/home/agent/.claude:ro
      - ./results/anga:/results:rw
      - ./tasks/anga:/tasks:ro
    environment:
      - ANTHROPIC_API_KEY=${ANGA_API_KEY}
    command: >
      bash -c "
      cd /workspace &&
      python3 /workspace/orchestration/worker_loop.py anga
      "
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

  fabien:
    image: docker/sandbox-templates:claude-code
    container_name: fabien
    volumes:
      - ./project:/workspace:ro
      - ./auth-homes/fabien:/home/agent/.claude:ro
      - ./results/fabien:/results:rw
      - ./tasks/fabien:/tasks:ro
    environment:
      - ANTHROPIC_API_KEY=${FABIEN_API_KEY}
    command: >
      bash -c "
      cd /workspace &&
      python3 /workspace/orchestration/worker_loop.py fabien
      "
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

volumes:
  redis-data:
```

### Worker loop implementation

```python
# orchestration/worker_loop.py
import os
import sys
import json
import subprocess
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class TaskHandler(FileSystemEventHandler):
    def __init__(self, worker_name):
        self.worker_name = worker_name
        self.system_prompt = f"/workspace/.claude/{worker_name.upper()}.md"
        if worker_name == "marie":
            self.system_prompt = "/workspace/.claude/DANCE.md"
    
    def on_created(self, event):
        """Process new task files"""
        if event.is_directory or not event.src_path.endswith('.json'):
            return
        
        print(f"[{self.worker_name}] New task: {event.src_path}")
        
        try:
            # Read task
            with open(event.src_path) as f:
                task = json.load(f)
            
            # Execute via Claude CLI
            result = subprocess.run([
                "claude",
                "--system-prompt-file", self.system_prompt,
                "-p", task["description"]
            ], capture_output=True, text=True, timeout=600)
            
            # Write result
            result_file = f"/results/{self.worker_name}/{task['task_id']}.json"
            with open(result_file, 'w') as f:
                json.dump({
                    "task_id": task["task_id"],
                    "status": "complete",
                    "output": result.stdout,
                    "worker": self.worker_name
                }, f, indent=2)
            
            # Signal completion
            print(f"[{self.worker_name}] Completed {task['task_id']}")
            
            # Remove task file
            os.remove(event.src_path)
            
        except Exception as e:
            print(f"[{self.worker_name}] Error: {e}")
            with open(result_file, 'w') as f:
                json.dump({
                    "task_id": task["task_id"],
                    "status": "failed",
                    "error": str(e)
                }, f)

def main(worker_name):
    """Start worker event loop"""
    print(f"[{worker_name}] Starting worker...")
    
    tasks_dir = f"/tasks/{worker_name}"
    Path(tasks_dir).mkdir(parents=True, exist_ok=True)
    
    event_handler = TaskHandler(worker_name)
    observer = Observer()
    observer.schedule(event_handler, tasks_dir, recursive=False)
    observer.start()
    
    print(f"[{worker_name}] Watching {tasks_dir}")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()

if __name__ == "__main__":
    worker_name = sys.argv[1]
    main(worker_name)
```

### Complete orchestrator implementation

```python
# orchestration/orchestrator.py
import json
import time
from pathlib import Path
from typing import List, Dict
import anthropic

class MultiAgentOrchestrator:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.workers = ["marie", "anga", "fabien"]
        self.tasks_dir = Path("/tasks")
        self.results_dir = Path("/results")
        
        # Load orchestrator system prompt
        with open(".claude/orchestrator.md") as f:
            self.orchestrator_prompt = f.read()
        
        # Load shared project context
        with open(".claude/project-context.md") as f:
            self.project_context = f.read()
    
    def analyze_and_decompose(self, user_request: str) -> List[Dict]:
        """Use orchestrator to decompose user request into tasks"""
        
        # Use prompt caching for orchestrator context
        system = [
            {
                "type": "text",
                "text": self.orchestrator_prompt,
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": self.project_context,
                "cache_control": {"type": "ephemeral"}
            }
        ]
        
        response = self.client.messages.create(
            model="claude-4-opus-20250514",
            max_tokens=4096,
            system=system,
            messages=[{
                "role": "user",
                "content": f"""
                Analyze this request and create specific task assignments:
                
                REQUEST: {user_request}
                
                For each task, provide:
                - worker: Which specialized worker (marie/anga/fabien)
                - task_id: Unique identifier
                - description: Specific, actionable task description
                - dependencies: List of task_ids that must complete first
                - priority: high/medium/low
                
                Output as JSON array of tasks.
                """
            }]
        )
        
        # Parse task list
        tasks_json = response.content[0].text
        tasks = json.loads(tasks_json)
        
        return tasks
    
    def assign_tasks(self, tasks: List[Dict]):
        """Write task files for workers to pick up"""
        for task in tasks:
            worker = task["worker"]
            task_file = self.tasks_dir / worker / f"{task['task_id']}.json"
            task_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(task_file, 'w') as f:
                json.dump(task, f, indent=2)
            
            print(f"Assigned {task['task_id']} to {worker}")
    
    def wait_for_completion(self, tasks: List[Dict], timeout=600):
        """Wait for all tasks to complete"""
        task_ids = {task["task_id"] for task in tasks}
        completed = set()
        
        start_time = time.time()
        while len(completed) < len(task_ids):
            if time.time() - start_time > timeout:
                raise TimeoutError("Tasks did not complete in time")
            
            # Check for result files
            for task_id in task_ids - completed:
                for worker in self.workers:
                    result_file = self.results_dir / worker / f"{task_id}.json"
                    if result_file.exists():
                        completed.add(task_id)
                        print(f"Task {task_id} completed")
                        break
            
            time.sleep(1)
        
        # Collect all results
        results = {}
        for task in tasks:
            task_id = task["task_id"]
            worker = task["worker"]
            result_file = self.results_dir / worker / f"{task_id}.json"
            
            with open(result_file) as f:
                results[task_id] = json.load(f)
        
        return results
    
    def synthesize_results(self, results: Dict) -> str:
        """Use orchestrator to synthesize worker results"""
        
        results_summary = json.dumps(results, indent=2)
        
        system = [
            {
                "type": "text",
                "text": self.orchestrator_prompt,
                "cache_control": {"type": "ephemeral"}
            }
        ]
        
        response = self.client.messages.create(
            model="claude-4-opus-20250514",
            max_tokens=8192,
            system=system,
            messages=[{
                "role": "user",
                "content": f"""
                Synthesize these results from specialized workers:
                
                {results_summary}
                
                Create a unified, actionable response:
                1. Identify key findings from each worker
                2. Resolve any conflicts or overlaps
                3. Prioritize recommendations
                4. Provide specific next steps
                
                Format as clear, structured report.
                """
            }]
        )
        
        return response.content[0].text
    
    def orchestrate(self, user_request: str) -> str:
        """Main orchestration flow"""
        print(f"Orchestrating: {user_request}")
        
        # Step 1: Decompose into tasks
        print("1. Analyzing and decomposing tasks...")
        tasks = self.analyze_and_decompose(user_request)
        print(f"   Created {len(tasks)} tasks")
        
        # Step 2: Assign to workers
        print("2. Assigning tasks to workers...")
        self.assign_tasks(tasks)
        
        # Step 3: Wait for completion
        print("3. Waiting for workers to complete...")
        results = self.wait_for_completion(tasks)
        print(f"   All {len(results)} tasks completed")
        
        # Step 4: Synthesize
        print("4. Synthesizing results...")
        final_report = self.synthesize_results(results)
        
        return final_report

def main():
    orchestrator = MultiAgentOrchestrator()
    
    # Example usage
    request = """
    Conduct a comprehensive code review of the authentication system:
    - Security vulnerabilities and fixes (Marie)
    - Performance bottlenecks and optimizations (Anga)
    - Test coverage and additional tests needed (Fabien)
    """
    
    result = orchestrator.orchestrate(request)
    
    print("\n" + "="*80)
    print("FINAL REPORT")
    print("="*80)
    print(result)

if __name__ == "__main__":
    main()
```

## Production deployment guide

### Step-by-step implementation

**Step 1: Environment setup**

```bash
# Clone project structure
mkdir -p project/{.claude/agents,orchestration,auth-homes/{orchestrator,marie,anga,fabien},tasks/{marie,anga,fabien},results/{marie,anga,fabien},logs}

# Create system prompts
cat > project/.claude/orchestrator.md << 'EOF'
[Your orchestrator prompt here - see examples above]
EOF

cat > project/.claude/DANCE.md << 'EOF'
[Your Marie worker prompt here]
EOF

# Repeat for ANGA.md, FABIEN.md

# Set up authentication
export ANTHROPIC_API_KEY="your-key"

# Authenticate each worker context
for worker in orchestrator marie anga fabien; do
    docker run -it --rm \
        -v ~/project/auth-homes/$worker:/home/agent/.claude \
        docker/sandbox-templates:claude-code \
        claude  # Complete interactive auth
done
```

**Step 2: Start orchestration system**

```bash
# Start with Docker Compose
cd project
docker-compose up -d

# Verify all containers running
docker ps

# Check logs
docker-compose logs -f orchestrator
```

**Step 3: Submit orchestration request**

```bash
# Using CLI
python3 orchestration/orchestrator.py

# Or via API
curl -X POST http://localhost:8000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Review codebase for security, performance, and test coverage"
  }'
```

**Step 4: Monitor execution**

```bash
# Watch task queue
watch -n 1 'ls -la tasks/*/'

# Watch results
watch -n 1 'ls -la results/*/'

# View orchestrator decisions
tail -f logs/orchestrator.log

# View sub-agent activity
tail -f logs/subagent-activity.log
```

### Troubleshooting common issues

**Issue 1: Rate limit errors**

```bash
# Symptoms: HTTP 429 errors in logs
# Solution: Verify tier and implement rate limiting

# Check current tier usage
# View at https://console.anthropic.com/settings/usage

# Implement client-side rate limiter (see rate_limiter.py above)
```

**Issue 2: Context pollution**

```bash
# Symptoms: Workers referencing each other's work inappropriately
# Solution: Verify isolation and artifact-only communication

# Check volume mounts are isolated
docker inspect marie | grep -A 20 Mounts

# Verify workers write artifacts, not full context
# Orchestrator should read artifact files, not stderr/stdout
```

**Issue 3: Sub-agents not spawning**

```bash
# Symptoms: Workers not delegating to sub-agents
# Solution: Verify sub-agent files exist and are accessible

# Check sub-agent definitions
docker exec marie ls -la /workspace/.claude/agents/

# Test sub-agent invocation
docker exec marie claude "/agents"  # Should list available sub-agents
```

## Key recommendations

### Critical success factors

**Start at Tier 4:** Lower tiers too restrictive for parallel orchestration with 4+ instances. Minimum 4,000 RPM needed for responsive multi-agent system.

**Use Sonnet for workers, Opus for orchestrator:** Optimal cost/performance. Workers do high-volume routine tasks (Sonnet at $3/$15), orchestrator does strategic reasoning (Opus at $15/$75).

**Implement aggressive caching:** System prompts, project context, and knowledge bases should be cached. Provides 90% cost reduction on repeated context. Critical for economic viability.

**Artifacts over full outputs:** Workers should write results to files and return references only. Prevents context pollution and "telephone game" degradation.

**Parallel execution is key:** Performance benefits come from parallelization. Spawn 3-5 workers simultaneously for complex tasks, not sequentially.

**Quality gates at integration:** Before orchestrator synthesizes, validate worker outputs for correctness, conflicts, and completeness. Revert and reassign on failure.

**Monitor real-time:** Non-deterministic agent behavior requires comprehensive observability. Track decision patterns, not conversation content (privacy).

**Explicit coordination protocols:** Define clear handoff formats, completion signals, and artifact structures. Prevents emergent behavior and confusion.

### When to use this architecture

**Ideal use cases:**
- Research requiring multiple independent directions
- Code review across security/performance/testing dimensions
- Tasks exceeding single context window (200K+ tokens)
- High-value work justifying 15× token multiplier
- Parallelizable workflows with minimal inter-agent dependencies

**Not recommended for:**
- Simple, sequential tasks (use single agent)
- Heavy inter-agent coordination requirements
- Cost-sensitive applications without clear ROI
- Real-time latency requirements (synchronous subagents add delay)

### Future enhancements

**Anthropic's production system includes:**
- Asynchronous subagent execution (vs current synchronous)
- Real-time steering of subagents mid-execution
- Inter-subagent communication for collaboration
- Advanced error handling with agent self-diagnosis

**Community patterns to explore:**
- LangGraph StateGraph for complex workflows
- CrewAI Flows for event-driven coordination
- Agent2Agent protocol for standardized communication
- Custom MCP servers for domain-specific tools

This architecture provides production-ready orchestration of multiple Claude CLI instances following Anthropic's official lead-agent/sub-agent pattern, with battle-tested strategies for isolation, communication, cost optimization, and performance at scale.