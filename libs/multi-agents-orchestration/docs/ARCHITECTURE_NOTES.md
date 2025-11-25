# CodeHornets AI - Architecture Notes

## Container Roles

### Worker Containers (Marie, Anga, Fabien)
- **Image**: `docker/sandbox-templates:claude-code`
- **User**: `agent` (non-root)
- **Purpose**: Run persistent Claude Code sessions
- **Permission Mode**: `bypassPermissions`
- **Auto-approved directories**: `/tasks`, `/results`, `/home/agent/workspace`

**Key Points**:
- Workers do NOT have `expect` installed (can't install as non-root)
- Workers wait at Claude CLI prompt for activation
- Workers process tasks when activated by automation container

### Automation Container
- **Image**: `alpine:latest`
- **User**: `root`
- **Purpose**: Send commands to workers via `docker attach`
- **Tools**: `bash`, `expect`, `docker-cli`, `curl`

**Key Points**:
- Has `expect` pre-installed
- Uses `expect` to automate `docker attach` interactions
- Sends messages to persistent worker sessions (PID 1)
- Handles proper detach sequence (Ctrl+P Ctrl+Q)

### Orchestrator Container
- **Image**: `docker/sandbox-templates:claude-code`
- **User**: `agent`
- **Purpose**: Coordinate workers, decompose tasks
- **Permission Mode**: `bypassPermissions`
- **Auto-approved directories**: `/tasks`, `/results`, `/workspaces`

### Monitor Container
- **Image**: `python:3.11-slim`
- **Purpose**: Observe system state, create notifications
- **Optional LLM**: Ollama integration for AI-powered recaps

### Redis Container
- **Image**: `redis:7-alpine`
- **Purpose**: Optional coordination/messaging (currently unused)

## Communication Flow

```
User Request
    ↓
Orchestrator (decomposes task)
    ↓
Creates task file in shared/tasks/{worker}/
    ↓
Monitor detects new task
    ↓
Creates notification in shared/triggers/{worker}/
    ↓
User runs: make wake-{worker}
    ↓
Automation container uses expect
    ↓
Sends message via docker attach
    ↓
Worker processes task (persistent session)
    ↓
Worker writes result to shared/results/{worker}/
    ↓
Orchestrator aggregates results
```

## Why This Architecture?

### Problem: Interactive TUI
Claude CLI is an interactive Terminal User Interface (TUI). Standard approaches don't work:
- ❌ `echo "message" | claude` - Ignored by TUI
- ❌ `claude -p "message"` - Spawns NEW instance, not persistent agent
- ❌ Named pipes - TUI doesn't read from pipes
- ❌ Docker exec - Creates new process, not same session

### Solution: Expect + Docker Attach
- ✅ `expect` automates terminal interaction
- ✅ `docker attach` connects to existing session (PID 1)
- ✅ Sends keystrokes to persistent Claude agent
- ✅ Proper cleanup (Ctrl+P Ctrl+Q detach)

## Permission Strategy

### Why `bypassPermissions`?

Workers run in **sandboxed containers** with:
- No internet access by default
- Isolated filesystems
- Restricted volume mounts
- Dedicated workspaces

Operations that need auto-approval:
- Reading task files from `/tasks`
- Writing results to `/results`
- Working in `/home/agent/workspace`
- Running Bash commands in allowed directories

This is safe because:
1. Containers are isolated
2. Workers can't access host filesystem beyond mounted volumes
3. No network access to external resources
4. Operations are scoped to designated directories

### Alternative Modes

If you need tighter control:
```bash
# Auto-approve edits, ask for Bash
--permission-mode acceptEdits

# Default (ask for everything)
--permission-mode default

# Planning mode (research only)
--permission-mode plan
```

## File Structure

```
shared/
├── auth-homes/           # Per-agent .claude configurations
│   ├── orchestrator/     # Orchestrator's config & auth
│   ├── marie/            # Marie's config & auth
│   ├── anga/             # Anga's config & auth
│   └── fabien/           # Fabien's config & auth
│
├── tasks/                # Task files (JSON)
│   ├── marie/            # Tasks for Marie
│   ├── anga/             # Tasks for Anga
│   └── fabien/           # Tasks for Fabien
│
├── results/              # Result files (JSON)
│   ├── marie/            # Results from Marie
│   ├── anga/             # Results from Anga
│   └── fabien/           # Results from Fabien
│
├── heartbeats/           # Agent health status
│   ├── orchestrator.json
│   ├── marie.json
│   ├── anga.json
│   └── fabien.json
│
├── triggers/             # Event trigger files
│   ├── orchestrator/
│   ├── marie/
│   ├── anga/
│   └── fabien/
│
├── pipes/                # Named pipes (IPC)
├── watcher-logs/         # System logs
└── workspaces/           # Agent working directories
    ├── marie/
    ├── anga/
    └── fabien/
```

## Worker Activation Sequence

### Step 1: Create Task
```bash
make task-anga TITLE="Fix API" DESC="Update endpoint"
```
Creates: `shared/tasks/anga/task-{uuid}.json`

### Step 2: Monitor Detects
Monitor daemon watches `shared/tasks/` and creates notification:
```
shared/triggers/anga/NOTIFICATION_{timestamp}.txt
```

### Step 3: Wake Worker
```bash
make wake-anga
```

Executes in automation container:
```bash
docker exec codehornets-svc-automation /tools/send_to_worker.sh anga "Check for pending tasks"
```

### Step 4: Expect Automation
```tcl
spawn docker attach codehornets-worker-anga
send "\x03"                    # Ctrl+C (clear line)
send "Check for pending tasks\r"  # Message + Enter
send "\x7F"                    # Backspace (clean newline)
send "\r"                      # Final Enter (submit)
sleep 2                        # Wait for processing
send "\x10\x11"                # Ctrl+P Ctrl+Q (detach)
```

### Step 5: Worker Processes
Persistent Claude agent (PID 1) receives message and:
1. Reads task file from `/tasks`
2. Executes work (no permission prompts!)
3. Writes result to `/results`
4. Updates heartbeat

## Key Design Decisions

### 1. Persistent vs Ephemeral Agents
**Decision**: Persistent agents (run continuously)
- ✅ Maintains context between tasks
- ✅ Faster response (no cold start)
- ✅ Can maintain state/memory
- ❌ Uses more resources

### 2. File-based vs Network Communication
**Decision**: File-based (JSON files in shared volumes)
- ✅ Simple, debuggable
- ✅ Survives container restarts
- ✅ Easy to inspect/audit
- ✅ Language-agnostic
- ❌ Not as fast as Redis/gRPC

### 3. Expect vs Alternative Automation
**Decision**: Expect for worker activation
- ✅ Works with interactive TUIs
- ✅ Mature, stable tool
- ✅ Handles terminal control sequences
- ❌ Requires separate container
- ❌ Somewhat brittle with timing

### 4. Permission Auto-Approval
**Decision**: `bypassPermissions` mode
- ✅ Fully autonomous workers
- ✅ No manual intervention
- ✅ Safe in sandboxed environment
- ❌ Less control over individual operations

## Security Considerations

### Container Isolation
- Workers run as non-root `agent` user
- Limited volume mounts (only needed directories)
- No host network access
- No privileged mode

### Permission Scope
- Auto-approval scoped to specific directories
- Workers can't access:
  - Host filesystem
  - Other workers' directories (without explicit mount)
  - Docker socket
  - System files

### Audit Trail
- All tasks logged in task files
- All results logged in result files
- Heartbeats track agent activity
- Watcher logs record events

## Troubleshooting

### Workers Not Processing Tasks
1. Check worker is running: `docker ps`
2. Check heartbeat: `cat shared/heartbeats/anga.json`
3. Wake worker: `make wake-anga`
4. Check logs: `make logs-anga`

### Permission Prompts Appearing
1. Verify permission mode: `docker logs codehornets-worker-anga | grep "bypass permissions"`
2. Restart worker: `docker-compose restart anga`
3. Check entrypoint: Workers should show "auto-approval enabled"

### Expect Not Working
1. Check automation container: `docker ps | grep automation`
2. Verify expect installed: `docker exec codehornets-svc-automation which expect`
3. Test manually: `docker exec codehornets-svc-automation /tools/send_to_worker.sh anga "test"`

### Tasks Not Created
1. Check orchestrator: `docker logs codehornets-orchestrator`
2. Verify task directory: `ls -la shared/tasks/anga/`
3. Check permissions: Task directories should be writable

## Performance Considerations

### Resource Usage
- Each Claude agent: ~200-500 MB RAM
- Redis: ~20 MB RAM
- Monitor: ~50 MB RAM
- Automation: ~10 MB RAM

**Total**: ~1-2 GB for full system

### Response Times
- Task creation: <1s
- Worker wake: ~3-5s (expect + attach)
- Task processing: Variable (depends on task)
- Result aggregation: <1s

### Scaling
Current architecture supports:
- ✅ 3-10 workers comfortably
- ✅ 100s of tasks per hour
- ⚠️ Limited by Claude API rate limits
- ⚠️ File I/O becomes bottleneck at scale

For larger scale:
- Use Redis for coordination
- Implement work queues
- Add load balancing
- Consider message broker (RabbitMQ)

## Future Enhancements

### Potential Improvements
1. **Auto-wake on Task Creation**: Monitor triggers worker activation
2. **Task Prioritization**: Priority queue for urgent tasks
3. **Worker Specialization**: Dynamic routing based on task type
4. **Result Streaming**: Real-time result updates
5. **Web Dashboard**: Monitor system via web UI
6. **Metrics & Analytics**: Track performance, success rates
7. **Auto-scaling**: Spawn workers on demand
8. **Distributed Mode**: Workers on different hosts

### Known Limitations
1. No automatic retry on failure
2. No task timeout enforcement
3. No circular dependency detection
4. Limited error propagation
5. No transaction semantics
6. File-based I/O latency

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
- [Expect Automation](https://core.tcl-lang.org/expect/index)
- [Docker Attach](https://docs.docker.com/engine/reference/commandline/attach/)
