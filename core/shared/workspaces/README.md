# Agent Workspace Directories

## Purpose

These directories are mounted to `/home/agent/workspace` inside each agent's container. This ensures:

1. **Conversation History Persists** - Claude Code stores session data in `/home/agent/workspace/.claude/`
2. **Work Files Persist** - Any files agents create in their workspace survive container restarts
3. **No Data Loss** - Everything is saved to the host filesystem

## Directory Structure

```
core/shared/workspaces/
├── marie/          → mounted to marie:/home/agent/workspace
├── anga/           → mounted to anga:/home/agent/workspace
└── fabien/         → mounted to fabien:/home/agent/workspace
```

## What Gets Saved Here

Each agent's workspace directory will contain:

- `.claude/` - Claude Code session data and conversation history
- `CLAUDE.md` - The combined prompt file (generated at startup)
- Any files the agent creates in `/home/agent/workspace/`
- Temporary work files

## Important Notes

1. **This is in addition to domain workspaces**:
   - Marie also has `/workspace/dance/` for dance-related files
   - Anga also has `/workspace/coding/` for coding projects
   - Fabien also has `/workspace/marketing/` for marketing materials

2. **Conversation history is now preserved**:
   - Previously lost on container restart
   - Now persisted to host at `core/shared/workspaces/{agent}/.claude/`

3. **Cleaning up**:
   - These directories can grow large over time
   - Use `make clean-workspace` to clear them if needed
   - Conversation history is in `.claude/` subdirectory

## Volume Mounts in docker-compose.yml

```yaml
marie:
  volumes:
    - ./shared/workspaces/marie:/home/agent/workspace:rw  # NEW - persists everything
    - ../workspaces/dance:/workspace/dance:rw             # Domain-specific files
    - ./shared/auth-homes/marie:/home/agent/.claude:rw    # Authentication
```

## Viewing Conversation History

Each agent's conversation history is stored at:
```
core/shared/workspaces/{agent}/.claude/
```

To view Marie's conversation history:
```bash
ls -la core/shared/workspaces/marie/.claude/
```

Note: Claude Code stores conversation data in SQLite databases and JSON files in this directory.
