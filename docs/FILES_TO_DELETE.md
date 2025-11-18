# Files to Delete - Detailed List
## Orchestration Migration: MCP to Claude CLI

**IMPORTANT**: This document lists all files that will be DELETED during migration.
Review carefully before approving.

---

## MCP Server Files (Total: ~1,800 lines of code)

### Marie MCP Server
```
orchestration/marie/server.ts (775 lines)
├── MCP tool handlers
├── Student management
├── Class documentation
├── Choreography tracking
└── Evaluation system
```

**Status**: Complete MCP implementation
**Replacement**: Claude CLI with DANCE.md system prompt
**Preserve**: `orchestration/marie/DANCE.md` (move to prompts/)

### Anga MCP Server
```
orchestration/anga/server.ts (~500 lines)
├── Code review tools
├── Testing utilities
├── Architecture analysis
└── Deployment helpers
```

**Status**: Complete MCP implementation
**Replacement**: Claude CLI with ANGA.md system prompt
**Preserve**: `orchestration/anga/ANGA.md` (move to prompts/)

### Fabien MCP Server
```
orchestration/fabien/server.ts (~500 lines)
├── Campaign management
├── Content generation
├── Analytics tools
└── Social media calendar
```

**Status**: Complete MCP implementation
**Replacement**: Claude CLI with FABIEN.md system prompt
**Preserve**: `orchestration/fabien/FABIEN.md` (move to prompts/)

### Orchestrator MCP Server
```
orchestration/orchestrator/index.ts (553 lines)
├── Express API server
├── Workflow execution engine
├── Agent lifecycle management
├── Parallel/sequential task coordination
└── Health check endpoints
```

**Status**: Complete MCP orchestration implementation
**Replacement**: Python file-based orchestrator (architecture.md)

---

## MCP Dependencies (~200MB)

### Node Modules
```
orchestration/shared/node_modules/
├── @modelcontextprotocol/sdk/
├── @anthropic-ai/sdk/
├── express/
├── cors/
├── typescript/
└── 200+ other packages
```

**Size**: ~200MB
**Reason**: MCP-specific dependencies not needed for CLI approach
**Replacement**: Python requirements.txt (minimal dependencies)

### Package Configuration
```
orchestration/shared/package.json
└── Dependencies:
    ├── @modelcontextprotocol/sdk: "^1.7.0"
    ├── @anthropic-ai/sdk: "latest"
    ├── express: "^4.18.2"
    ├── cors: "^2.8.5"
    └── typescript: "^5.0.0"
```

```
orchestration/shared/tsconfig.json
└── TypeScript configuration for MCP servers
```

**Reason**: Not needed for Python orchestrator

---

## Docker Configuration (Old MCP Version)

### Docker Compose
```
orchestration/docker-compose.yml (30 lines)
├── Orchestrator service (all-in-one MCP container)
├── Port 8080:8000
├── MCP environment variables
└── Volume mounts for workspaces
```

**Status**: MCP-based orchestration
**Replacement**: `orchestration/cli/docker-compose.yml` (Claude CLI containers)
**Action**: Rename to `.mcp.old` as backup

### Dockerfile
```
orchestration/Dockerfile.all-in-one
├── Node.js base image
├── MCP server installation
├── TypeScript build
└── Entry point for orchestrator
```

**Status**: MCP server container
**Replacement**: Claude CLI official Docker image
**Action**: Rename to `.mcp.old` as backup

---

## Unused/Dead Code

### Knowledge Hub
```
orchestration/knowledgehub/
└── domain/
    └── (appears empty or unused)
```

**Analysis**: No references found in code
**Status**: Dead code
**Action**: DELETE

### Examples
```
orchestration/examples/
└── (old example files)
```

**Status**: Superseded by workflows/
**Action**: DELETE

---

## Empty Directories (After File Moves)

These directories will become empty after moving system prompts:

```
orchestration/marie/ (after DANCE.md moved to prompts/)
orchestration/anga/ (after ANGA.md moved to prompts/)
orchestration/fabien/ (after FABIEN.md moved to prompts/)
orchestration/orchestrator/ (after index.ts deleted)
orchestration/shared/ (after node_modules deleted)
```

**Action**: Remove empty directories

---

## Configuration Files to Update (NOT DELETE)

### Makefile
```
Makefile (515 lines)
└── Update orchestration targets:
    ├── orchestration-start → use cli/docker-compose.yml
    ├── orchestration-setup → install Python deps
    └── Add new CLI-specific targets
```

**Action**: UPDATE (not delete)

### .gitignore
```
.gitignore
└── Add entries:
    ├── orchestration/cli/auth-homes/**/.claude/*
    ├── orchestration/cli/tasks/**/*
    ├── orchestration/cli/results/**/*
    └── orchestration/cli/.env
```

**Action**: APPEND (not delete)

---

## Summary

### Files to DELETE

| Category | Count | Size | Lines |
|----------|-------|------|-------|
| MCP Servers | 4 files | ~50KB | ~1,800 |
| Node Modules | ~1,000 files | ~200MB | N/A |
| Config Files | 2 files | <1KB | <100 |
| Docker Files | 2 files | <5KB | <100 |
| Dead Code | ~10 files | <10KB | <500 |
| **TOTAL** | **~1,020 files** | **~200MB** | **~2,500 lines** |

### Files to PRESERVE

| Category | Count | Action |
|----------|-------|--------|
| System Prompts | 3 files | Move to prompts/ |
| Workflows | 8 files | Keep & update |
| Scripts | 6 files | Keep & update |
| Documentation | 3 files | Keep & update |
| **TOTAL** | **20 files** | **Preserve** |

---

## Verification Checklist

Before deletion, verify:

- [ ] All system prompts backed up (DANCE.md, ANGA.md, FABIEN.md)
- [ ] Workflows directory preserved
- [ ] Scripts directory preserved
- [ ] Docker files renamed to .mcp.old (not deleted)
- [ ] Git status clean (can rollback if needed)
- [ ] New CLI structure created
- [ ] Python orchestrator files in place
- [ ] Documentation updated

---

## Deletion Script

Once approved, this script will perform the deletion:

```bash
#!/bin/bash
# orchestration-cleanup.sh

set -e

echo "🧹 Orchestration Cleanup - Removing MCP Code"
echo ""

# Backup docker files
echo "📦 Backing up Docker configuration..."
mv orchestration/docker-compose.yml orchestration/docker-compose.mcp.old
mv orchestration/Dockerfile.all-in-one orchestration/Dockerfile.mcp.old

# Delete MCP servers
echo "🗑️  Deleting MCP server files..."
rm orchestration/marie/server.ts
rm orchestration/anga/server.ts
rm orchestration/fabien/server.ts
rm orchestration/orchestrator/index.ts

# Delete MCP dependencies
echo "🗑️  Deleting node_modules (~200MB)..."
rm -rf orchestration/shared/node_modules
rm orchestration/shared/package.json
rm orchestration/shared/tsconfig.json

# Delete unused directories
echo "🗑️  Deleting dead code..."
rm -rf orchestration/knowledgehub
rm -rf orchestration/examples

# Remove empty directories
echo "🗑️  Removing empty directories..."
rmdir orchestration/orchestrator 2>/dev/null || true
rmdir orchestration/marie 2>/dev/null || true
rmdir orchestration/anga 2>/dev/null || true
rmdir orchestration/fabien 2>/dev/null || true
rmdir orchestration/shared 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "   - Removed ~1,020 files (~200MB)"
echo "   - Removed ~2,500 lines of MCP code"
echo "   - Preserved workflows/ and scripts/"
echo "   - Backed up Docker files as .mcp.old"
echo ""
```

---

## Approval Required

To proceed with deletion, please confirm:

1. **Reviewed all files in this list**
2. **Understand MCP code will be deleted**
3. **Confirm system prompts will be preserved**
4. **Acknowledge Docker config backed up as .mcp.old**
5. **Ready to proceed with Claude CLI architecture**

**Type "DELETE APPROVED" to run cleanup script.**
