# End-to-End Testing Guide

Complete guide for testing the CodeHornets AI autonomous multi-agent orchestration system.

## Quick Test (Automated)

The fastest way to test the complete workflow:

```bash
# Run automated end-to-end test
make test-e2e
```

This will:
1. Clean test environment
2. Create a test task for Anga
3. Monitor for 15 seconds
4. Show results (task should be archived)

## Manual Orchestrator Test (Recommended)

Test the complete workflow with manual orchestrator delegation:

### Terminal 1: Start Workflow Monitor

```bash
make watch-workflow
```

This displays real-time updates of:
- System health (all agents)
- Pending tasks per worker
- Pending results
- Archive statistics
- Monitor activity logs

### Terminal 2: Attach to Orchestrator

```bash
make attach-orchestrator
```

### Test Request

Give this request to the orchestrator:

```
I need to create a Python function that validates email addresses using regex.
Can you help delegate this to the right agent?
```

### Expected Flow

1. **Orchestrator analyzes** the request:
   - Recognizes it as a backend/coding task
   - Identifies Anga as the appropriate worker
   - Suggests task assignment

2. **Orchestrator asks for confirmation**:
   ```
   This looks like a coding task. Should I assign this to Anga?
   ```

3. **You confirm**: Type "yes" or "confirm"

4. **Orchestrator creates task file**:
   ```
   shared/tasks/anga/task-TIMESTAMP.json
   ```

5. **Monitor detects task** (watch in Terminal 1):
   ```
   [timestamp] 📢 Created notification for anga (1 tasks)
   [timestamp] 🚀 Auto-woke anga successfully
   ```

6. **Anga processes task**:
   - Receives wake message
   - Reads task from `/tasks`
   - Executes using coding expertise
   - Creates result file

7. **Monitor archives completed task**:
   ```
   [timestamp] 📦 Archived task-TIMESTAMP for anga as success
   ```

8. **Check results**:
   - Task moved from `shared/tasks/anga/` to `shared/archive/anga/success/`
   - Result file also archived
   - Queue is clean

## Testing Different Worker Types

### Marie (Dance Teaching Assistant)

```
I need to create a React component for a user profile card with hover animations.
Can you help delegate this?
```

Expected: Orchestrator suggests Marie

### Anga (Coding Assistant)

```
I need to create a REST API endpoint that handles user authentication with JWT tokens.
Can you help delegate this?
```

Expected: Orchestrator suggests Anga

### Fabien (Marketing Assistant)

```
I need to set up a Docker Compose configuration for a multi-container application with Redis and PostgreSQL.
Can you help delegate this?
```

Expected: Orchestrator suggests Fabien

## Monitoring Commands

### Real-time Workflow Monitor
```bash
make watch-workflow
```

### Monitor Daemon Logs
```bash
make logs-monitor

# Or follow logs in real-time
docker logs -f codehornets-svc-monitor
```

### Worker Logs
```bash
make logs-marie
make logs-anga
make logs-fabien
make logs-orchestrator
```

### System Status
```bash
make status
```

### Check Heartbeats
```bash
make check-heartbeats
```

## Verify Archive

### List All Archived Tasks
```bash
make list-archive
```

### View Archive Statistics
```bash
make view-archive
```

### Inspect Archived Task
```bash
# Find the task file
ls -la shared/archive/anga/success/

# Read task details
cat shared/archive/anga/success/task-TIMESTAMP.json

# Read result details
cat shared/archive/anga/success/task-TIMESTAMP-result.json
```

## Reset Test Environment

Clean all tasks, results, and archives:

```bash
make reset-test
```

## Troubleshooting

### Worker Not Waking Up

**Check monitor logs:**
```bash
docker logs --tail 20 codehornets-svc-monitor
```

**Manually wake worker:**
```bash
make wake-anga
# or
make wake-marie
# or
make wake-fabien
```

### Task Not Being Archived

**Check if result exists:**
```bash
ls -la shared/results/anga/
```

**Monitor should archive every 15 seconds (5 iterations × 3 seconds)**

**Check monitor is running:**
```bash
docker ps --filter name=monitor
```

### Orchestrator Not Authenticated

**Reattach and complete auth:**
```bash
make attach-orchestrator
# Follow browser authentication flow
```

### Permission Prompts Appearing

**All agents should use `bypassPermissions` mode**

**Verify configuration:**
```bash
# Check orchestrator
docker logs codehornets-orchestrator | grep "permission-mode"

# Check workers
docker logs codehornets-worker-anga | grep "permission-mode"
```

## Complete Workflow Verification Checklist

- [ ] Reset test environment (`make reset-test`)
- [ ] Start workflow monitor (`make watch-workflow`)
- [ ] Attach to orchestrator (`make attach-orchestrator`)
- [ ] Give task request to orchestrator
- [ ] Orchestrator analyzes and suggests worker
- [ ] Orchestrator creates task file
- [ ] Monitor detects task (< 3 seconds)
- [ ] Monitor auto-wakes worker
- [ ] Worker processes task
- [ ] Worker creates result
- [ ] Monitor archives task (< 15 seconds)
- [ ] Task removed from queue
- [ ] Verify archive: `make view-archive`

## Performance Expectations

- **Task Detection**: < 3 seconds (monitor polls every 3 seconds)
- **Worker Wake**: < 5 seconds (automation container sends message)
- **Task Processing**: Varies by complexity (simple task: 10-30 seconds)
- **Archival**: < 15 seconds after result created (monitor archives every 5 iterations)

## Architecture Flow

```
User Request
    ↓
Orchestrator (analyzes, delegates)
    ↓
Task File Created (shared/tasks/{worker}/)
    ↓
Monitor Daemon Detects (polls every 3s)
    ↓
Monitor Wakes Worker (via automation container)
    ↓
Worker Processes Task
    ↓
Result File Created (shared/results/{worker}/)
    ↓
Monitor Archives (every 15s)
    ↓
Files Moved to Archive (shared/archive/{worker}/{status}/)
    ↓
Queue Cleaned
```

## Tips for Success

1. **Use two terminals**: One for `watch-workflow`, one for orchestrator
2. **Be specific**: Give clear task descriptions to orchestrator
3. **Wait for suggestions**: Let orchestrator analyze before creating tasks
4. **Monitor in real-time**: Watch the workflow monitor to see autonomous processing
5. **Check archives**: Verify successful completion with `make view-archive`
6. **Reset between tests**: Use `make reset-test` for clean tests

## Advanced Testing

### Test Concurrent Tasks

Create multiple tasks simultaneously:

```bash
# Create tasks for all workers at once
make task-marie &
make task-anga &
make task-fabien &

# Watch all process in parallel
make watch-workflow
```

### Test Error Handling

Create a task with invalid requirements:

```
I need you to create a function that divides by zero and returns infinity.
This should handle all edge cases.
```

Watch how:
- Worker attempts task
- Creates result with error status
- Monitor archives as "failed"

### Stress Test

```bash
# Create 10 tasks rapidly
for i in {1..10}; do
    make task-anga
    sleep 1
done

# Watch monitor handle queue
make watch-workflow
```

## Success Criteria

A successful end-to-end test shows:

✅ Orchestrator correctly identifies worker specialization
✅ Task file created in correct worker directory
✅ Monitor detects task within 3 seconds
✅ Worker automatically woken
✅ Task processed successfully
✅ Result file created
✅ Task archived within 15 seconds
✅ Original task/result removed from active queue
✅ Archive contains both task and result with timestamps

---

**Ready to test? Start with:**
```bash
make test-e2e
```

**For manual testing:**
```bash
# Terminal 1
make watch-workflow

# Terminal 2
make test-orchestrator-flow
```
