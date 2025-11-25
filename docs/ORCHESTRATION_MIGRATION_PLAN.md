# Orchestration Migration Plan
## From MCP Servers to Claude CLI Architecture

**Date**: 2025-11-17
**Status**: Ready for Approval
**Author**: Backend Developer Agent

---

## Executive Summary

Migrating from Model Context Protocol (MCP) server-based orchestration to Anthropic's official Claude CLI orchestration pattern. This aligns with architecture.md specifications and follows Anthropic's documented multi-agent research achieving 90.2% better performance.

---

## Current Architecture Assessment

### What Exists (MCP-based)

```
orchestration/
├── marie/
│   ├── server.ts (MCP server - 775 lines)
│   └── DANCE.md (system prompt)
├── anga/
│   ├── server.ts (MCP server)
│   └── ANGA.md (system prompt)
├── fabien/
│   ├── server.ts (MCP server)
│   └── FABIEN.md (system prompt)
├── orchestrator/
│   └── index.ts (MCP orchestrator - 553 lines)
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── node_modules/ (MCP dependencies)
├── workflows/ (JSON workflow definitions - KEEP)
├── scripts/ (Shell scripts - KEEP & UPDATE)
├── knowledgehub/ (appears unused)
├── docker-compose.yml (MCP version)
└── Dockerfile.all-in-one
```

### What's Preserved (NO CHANGES)

```
apps/ - Application code
libs/ - Shared libraries
domains/ - Domain logic
workspaces/ - User workspaces
docs/ - Documentation
```

---

## Target Architecture (architecture.md Compliant)

### New Structure

```
orchestration/
├── cli/                              # NEW - Python orchestrator
│   ├── orchestrator.py               # Main orchestrator (file-based)
│   ├── worker_loop.py                # Worker file watcher
│   ├── task_queue.py                 # Queue management
│   ├── rate_limiter.py               # API rate limiting
│   ├── docker-compose.yml            # Claude CLI containers
│   ├── .env.example
│   ├── auth-homes/                   # Isolated auth
│   │   ├── orchestrator/.claude/
│   │   ├── marie/.claude/
│   │   ├── anga/.claude/
│   │   └── fabien/.claude/
│   ├── tasks/                        # Task queue
│   │   ├── marie/
│   │   ├── anga/
│   │   └── fabien/
│   └── results/                      # Worker outputs
│       ├── marie/
│       ├── anga/
│       └── fabien/
├── prompts/                          # NEW - System prompts
│   ├── orchestrator.md
│   ├── DANCE.md (from marie/)
│   ├── ANGA.md (from anga/)
│   └── FABIEN.md (from fabien/)
├── workflows/                        # KEEP - workflow definitions
├── scripts/                          # KEEP - utility scripts
└── README.md                         # UPDATE
```

---

## Files to DELETE (Dead Code)

### MCP Server Implementations

```bash
orchestration/marie/server.ts           # 775 lines - MCP server
orchestration/anga/server.ts            # ~500 lines - MCP server
orchestration/fabien/server.ts          # ~500 lines - MCP server
orchestration/orchestrator/index.ts     # 553 lines - MCP orchestrator
```

### MCP Dependencies

```bash
orchestration/shared/package.json       # MCP dependencies
orchestration/shared/tsconfig.json      # TypeScript config for MCP
orchestration/shared/node_modules/      # ~200MB MCP dependencies
```

### Old Docker Config

```bash
orchestration/docker-compose.yml        # MCP version
orchestration/Dockerfile.all-in-one     # MCP container
```

### Unused Directories

```bash
orchestration/knowledgehub/             # Dead code - appears unused
orchestration/examples/                 # Old examples
orchestration/orchestrator/             # Empty after index.ts deleted
orchestration/marie/ (except DANCE.md)  # Empty after server.ts deleted
orchestration/anga/ (except ANGA.md)    # Empty after server.ts deleted
orchestration/fabien/ (except FABIEN.md) # Empty after server.ts deleted
```

---

## Files to PRESERVE

### Workflows (Update for CLI)

```bash
orchestration/workflows/parallel-demo.json
orchestration/workflows/sequential-workflow.json
orchestration/workflows/marie-*.json
orchestration/workflows/batch-evaluation-generated.json
orchestration/workflows/README.md
```

### Scripts (Update for CLI)

```bash
orchestration/scripts/batch-evaluate.sh
orchestration/scripts/create-evaluation.sh
orchestration/scripts/evaluate-student.sh
orchestration/scripts/generate-batch-workflow.sh
orchestration/scripts/marie-add-student.sh
orchestration/scripts/test-agent-introduction.sh
```

### System Prompts (Move to prompts/)

```bash
orchestration/marie/DANCE.md → orchestration/prompts/DANCE.md
orchestration/anga/ANGA.md → orchestration/prompts/ANGA.md
orchestration/fabien/FABIEN.md → orchestration/prompts/FABIEN.md
```

### Configuration

```bash
orchestration/.env.example
orchestration/.env (if exists - user's API keys)
orchestration/README.md (update)
orchestration/QUICKSTART.md (update)
```

---

## Implementation Plan

### Phase 1: Preparation (No Breaking Changes)

**1.1 Create New Structure**

```bash
mkdir -p orchestration/cli/{auth-homes/{orchestrator,marie,anga,fabien},tasks/{marie,anga,fabien},results/{marie,anga,fabien}}
mkdir -p orchestration/prompts
```

**1.2 Move System Prompts**

```bash
mv orchestration/marie/DANCE.md orchestration/prompts/
mv orchestration/anga/ANGA.md orchestration/prompts/
mv orchestration/fabien/FABIEN.md orchestration/prompts/
```

**1.3 Create Python Orchestrator Files**

- `orchestration/cli/orchestrator.py` (from architecture.md)
- `orchestration/cli/worker_loop.py` (from architecture.md)
- `orchestration/cli/task_queue.py` (new)
- `orchestration/cli/rate_limiter.py` (from architecture.md)

**1.4 Create New Docker Configuration**

- `orchestration/cli/docker-compose.yml` (Claude CLI version)
- `orchestration/cli/Dockerfile.worker` (Claude CLI worker)
- `orchestration/cli/requirements.txt` (Python dependencies)

### Phase 2: Delete Dead Code

**2.1 Remove MCP Servers**

```bash
rm orchestration/marie/server.ts
rm orchestration/anga/server.ts
rm orchestration/fabien/server.ts
rm orchestration/orchestrator/index.ts
```

**2.2 Remove MCP Dependencies**

```bash
rm -rf orchestration/shared/node_modules
rm orchestration/shared/package.json
rm orchestration/shared/tsconfig.json
```

**2.3 Remove Old Docker Config**

```bash
mv orchestration/docker-compose.yml orchestration/docker-compose.mcp.old
mv orchestration/Dockerfile.all-in-one orchestration/Dockerfile.mcp.old
```

**2.4 Remove Unused Directories**

```bash
rm -rf orchestration/knowledgehub
rm -rf orchestration/examples
rmdir orchestration/orchestrator (empty after index.ts removed)
rmdir orchestration/marie (empty after DANCE.md moved)
rmdir orchestration/anga (empty after ANGA.md moved)
rmdir orchestration/fabien (empty after FABIEN.md moved)
```

### Phase 3: Update Makefile

**3.1 Update Orchestration Targets**

- Update `orchestration-start` to use `orchestration/cli/docker-compose.yml`
- Update `orchestration-setup` to install Python dependencies
- Update paths to new structure
- Add targets for auth-home setup

**3.2 Add New Targets**

```makefile
cli-setup:           # Setup Claude CLI orchestration
cli-auth:            # Setup isolated authentication
cli-test:            # Test CLI orchestration
```

### Phase 4: Update Documentation

**4.1 Update README Files**

- `orchestration/README.md` - New architecture
- `orchestration/cli/README.md` - CLI usage
- Root `README.md` - Update orchestration section

**4.2 Create Migration Guide**

- Document differences between MCP and CLI
- Provide upgrade path for users
- Update QUICKSTART.md

### Phase 5: Update Scripts

**5.1 Workflow Scripts**

Update scripts to work with new file-based task queue:
- `batch-evaluate.sh` - Write to tasks/ directory
- `create-evaluation.sh` - Use new task format
- `evaluate-student.sh` - Read from results/ directory

**5.2 Test Scripts**

Create new test scripts:
- `test-orchestrator.sh` - Test Python orchestrator
- `test-worker-loop.sh` - Test worker file watcher
- `test-parallel-execution.sh` - Test parallel tasks

---

## New .gitignore Entries

Add to `.gitignore`:

```gitignore
# Claude CLI orchestration
orchestration/cli/auth-homes/**/.claude/*
!orchestration/cli/auth-homes/**/.gitkeep
orchestration/cli/tasks/**/*
!orchestration/cli/tasks/**/.gitkeep
orchestration/cli/results/**/*
!orchestration/cli/results/**/.gitkeep
orchestration/cli/.env
orchestration/cli/*.log

# Old MCP artifacts (if keeping for reference)
orchestration/*.mcp.old
orchestration/shared/node_modules/
```

---

## Risk Assessment

### Low Risk
- Creating new directories (no breaking changes)
- Moving system prompt files (preserves content)
- Updating documentation

### Medium Risk
- Deleting MCP server code (irreversible, but old architecture)
- Updating Makefile targets (may break existing workflows)
- Changing Docker configuration

### Mitigation Strategy
1. Keep old docker-compose.yml as `.mcp.old` for reference
2. Test new CLI orchestration before removing MCP code
3. Create rollback script if needed
4. Document all changes in migration guide

---

## Testing Plan

### Test 1: Basic Orchestration
```bash
cd orchestration/cli
docker-compose up -d
curl http://localhost:8000/health
```

### Test 2: Task Assignment
```bash
# Create task file
echo '{"task_id": "test-001", "description": "Test task"}' > tasks/marie/test-001.json

# Wait for worker to process
sleep 5

# Check result
cat results/marie/test-001.json
```

### Test 3: Parallel Execution
```bash
# Submit tasks to all workers
make cli-test-parallel

# Verify all completed
ls -la results/*/
```

---

## Success Criteria

- [ ] Python orchestrator running in Docker
- [ ] All 3 workers (Marie, Anga, Fabien) responding
- [ ] File-based task queue working
- [ ] Parallel execution confirmed
- [ ] Existing workflow scripts updated and working
- [ ] Makefile targets updated
- [ ] Documentation updated
- [ ] Old MCP code removed
- [ ] New structure documented

---

## Rollback Plan

If issues arise:

```bash
# Restore old docker-compose
mv orchestration/docker-compose.mcp.old orchestration/docker-compose.yml

# Restore old Dockerfile
mv orchestration/Dockerfile.mcp.old orchestration/Dockerfile.all-in-one

# Restore MCP servers from git
git checkout HEAD -- orchestration/marie/server.ts
git checkout HEAD -- orchestration/anga/server.ts
git checkout HEAD -- orchestration/fabien/server.ts
git checkout HEAD -- orchestration/orchestrator/index.ts

# Reinstall MCP dependencies
cd orchestration/shared && npm install
```

---

## Post-Migration Cleanup

After confirming new architecture works:

```bash
# Remove old backup files
rm orchestration/docker-compose.mcp.old
rm orchestration/Dockerfile.mcp.old

# Remove shared directory if completely empty
rmdir orchestration/shared (if empty)
```

---

## Timeline

- **Preparation**: 2 hours
- **Implementation**: 3 hours
- **Testing**: 1 hour
- **Documentation**: 1 hour
- **Total**: 7 hours

---

## Approval Required

Before proceeding with deletion of MCP code, please approve:

1. **Delete MCP server files** (marie/server.ts, anga/server.ts, fabien/server.ts, orchestrator/index.ts)
2. **Delete MCP dependencies** (shared/node_modules, shared/package.json)
3. **Delete unused directories** (knowledgehub/, examples/)
4. **Replace docker-compose.yml** with CLI version

**Type "APPROVED" to proceed with migration.**

---

## Questions for User

1. Are there any custom modifications in the MCP servers we should preserve?
2. Should we keep the old MCP files as `.old` backups?
3. Any specific testing requirements before deletion?
4. Timeline preferences for migration?
