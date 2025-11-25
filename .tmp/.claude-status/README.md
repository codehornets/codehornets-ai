# Claude Instance Coordination

## Status Files

Each Claude Code instance updates its status file when working:

| File | Instance | Service |
|------|----------|---------|
| `instance-0-coordinator.json` | Project Manager | Infrastructure & coordination |
| `instance-1-adapter.json` | Adapter Layer | web-ui backend adapter |
| `instance-2-auth.json` | Auth Service | auth-service (port 3001) |
| `instance-3-crm.json` | CRM Service | crm-service (port 3002) |
| `instance-4-tasks.json` | Tasks Service | tasks-service (port 3006) |
| `instance-5-agents.json` | Agents Service | agents-service (port 3005) |

## Instructions for Each Instance

**Add this to your prompt when starting a new instance:**

```
COORDINATION PROTOCOL:
1. Before starting work, read your status file:
   cat funnel-agents/.claude-status/instance-X-<service>.json

2. Update your status file after each significant change:
   - Set "status" to "in_progress"
   - Update "current_task" with what you're doing
   - Add files to "files_created" or "files_modified"
   - Move completed items from "pending" to "completed"
   - Update "updated_at" timestamp

3. If you hit a blocker, add it to "blockers" array

4. When done, set "status" to "completed"

5. DO NOT modify files outside your assigned service:
   - Your service: apps/<your-service>/
   - Your domain: libs/domain/src/lib/<your-domain>/
   - Shared only if needed: libs/shared/, libs/interfaces/
```

## Quick Check All Status

```bash
# View all instance statuses
cat funnel-agents/.claude-status/*.json | jq -s '.[] | {instance, status, current_task}'

# Or simple version
for f in funnel-agents/.claude-status/instance-*.json; do
  echo "=== $(basename $f) ==="
  cat $f | grep -E '"(status|current_task)"'
done
```

## Conflict Prevention

| Instance | Can Modify | Cannot Touch |
|----------|------------|--------------|
| 0-coordinator | libs/infrastructure, libs/interfaces, docker, Makefile | apps/* (except gateway routes) |
| 1-adapter | apps/web-ui, apps/api-gateway | Other services |
| 2-auth | apps/auth-service, libs/domain/auth | Other services |
| 3-crm | apps/crm-service, libs/domain/crm | Other services |
| 4-tasks | apps/tasks-service, libs/domain/tasks | Other services |
| 5-agents | apps/agents-service, libs/domain/agents | Other services |
