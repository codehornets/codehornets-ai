# Output Styles Migration Guide

## Overview

The CodeHornets-AI multi-agent system has been migrated from custom prompt merging to **Claude Code's native output styles** feature. This provides better personality differentiation, automatic reminder hooks, and cleaner architecture.

## What Changed

### Before (Custom Prompt Merging)
```bash
# Old approach in docker-compose.yml
command: >
  bash -c "
  /prompts/combine-prompts.sh /prompts/agents/Marie.md /prompts/domains/DANCE.md /home/agent/workspace/CLAUDE.md &&
  claude
  "
```

**Problems:**
- Manual script to merge agent + domain prompts
- No automatic reminders during conversation
- Hacky approach not leveraging Claude Code features
- Harder to maintain and update

### After (Native Output Styles)
```bash
# New approach in docker-compose.yml
command: >
  bash -c "
  mkdir -p /home/agent/.claude/output-styles &&
  cp /output-styles/marie.md /home/agent/.claude/output-styles/marie.md &&
  echo '{\"outputStyle\": \"marie\"}' > /home/agent/.claude/settings.local.json &&
  claude
  "
```

**Benefits:**
- ✅ Native Claude Code feature (not a hack)
- ✅ Automatic reminder hooks during conversation
- ✅ Cleaner than `combine-prompts.sh`
- ✅ Per-agent customization in `.claude/settings.local.json`
- ✅ `keep-coding-instructions: true` for Anga, `false` for Marie/Fabien

## File Structure Changes

### New Files Created

```
beta/codehornets-ai/core/
├── output-styles/          # NEW - Output style definitions
│   ├── marie.md           # Marie's personality + dance domain
│   ├── anga.md            # Anga's personality + coding domain
│   └── fabien.md          # Fabien's personality + marketing domain
└── docker-compose.yml      # UPDATED - Uses output styles
```

### Output Style Format

Each output style file has frontmatter and content:

```markdown
---
name: Marie (Dance Expert)
description: Warm, encouraging dance teacher assistant
keep-coding-instructions: false
---

# Marie - Dance Teacher Assistant

You are **Marie**, a specialized dance teacher assistant...

[Agent personality + domain expertise combined]
```

### Key Frontmatter Fields

- **name**: Display name (shown in UI)
- **description**: Brief description of the agent
- **keep-coding-instructions**:
  - `true` for Anga (needs coding tools)
  - `false` for Marie/Fabien (non-coding domains)

## Docker Compose Changes

### Volume Mounts

**Old:**
```yaml
volumes:
  - ./prompts:/prompts:ro
```

**New:**
```yaml
volumes:
  - ./output-styles:/output-styles:ro
  - ./shared/auth-homes/marie:/home/agent/.claude:rw
```

### Startup Commands

Each agent now:
1. Creates output-styles directory in `.claude/`
2. Copies its output-style file
3. Creates `settings.local.json` with `outputStyle` field
4. Starts Claude Code (which automatically loads the style)

## How to Use

### 1. Rebuild After Changes

If you modify an output-style file:

```bash
make rebuild
```

This will:
- Stop all containers
- Remove old containers
- Start fresh with updated output styles

### 2. Restart Individual Agents

To restart just the workers (Marie, Anga, Fabien):

```bash
make restart-workers
```

### 3. Check Agent Personalities

Connect to each agent and verify their personality:

```bash
# Attach to Marie
make attach-marie

# Attach to Anga
make attach-anga

# Attach to Fabien
make attach-fabien
```

Each should display their unique banner and personality.

## Output Style Customization

### Modifying Agent Personalities

1. Edit the output-style file:
   ```bash
   vim core/output-styles/marie.md
   ```

2. Modify personality traits, communication style, or domain knowledge

3. Rebuild to apply changes:
   ```bash
   make rebuild
   ```

### Adding New Agents

To add a new agent:

1. Create output-style file:
   ```bash
   touch core/output-styles/new-agent.md
   ```

2. Add frontmatter and content:
   ```markdown
   ---
   name: Agent Name
   description: Brief description
   keep-coding-instructions: false
   ---

   # Agent Name

   [Personality and domain expertise]
   ```

3. Update `docker-compose.yml`:
   ```yaml
   new-agent:
     image: docker/sandbox-templates:claude-code
     container_name: new-agent
     command: >
       bash -c "
       mkdir -p /home/agent/.claude/output-styles &&
       cp /output-styles/new-agent.md /home/agent/.claude/output-styles/new-agent.md &&
       echo '{\"outputStyle\": \"new-agent\"}' > /home/agent/.claude/settings.local.json &&
       claude
       "
     volumes:
       - ./output-styles:/output-styles:ro
       - ./shared/auth-homes/new-agent:/home/agent/.claude:rw
       - ./shared/tasks/new-agent:/tasks:ro
       - ./shared/results/new-agent:/results:rw
   ```

4. Authenticate and start:
   ```bash
   make auth-new-agent
   make start
   ```

## Technical Details

### How Output Styles Work

1. **System Prompt Modification**:
   - Output styles directly modify Claude Code's system prompt
   - All styles exclude default efficiency instructions
   - Custom styles exclude coding instructions unless `keep-coding-instructions: true`

2. **Reminder Hooks**:
   - Claude Code automatically triggers reminders during conversations
   - Helps agents stay in character
   - Enforces consistent personality

3. **Settings Priority**:
   ```
   User level:    ~/.claude/output-styles/
   Project level: .claude/output-styles/
   Container:     /home/agent/.claude/output-styles/
   ```

### Container Startup Flow

```
Container Start
    ↓
Create /home/agent/.claude/output-styles/
    ↓
Copy output-style file from /output-styles/
    ↓
Create settings.local.json with {"outputStyle": "agent-name"}
    ↓
Start Claude Code
    ↓
Load output style from .claude/output-styles/
    ↓
Apply personality to system prompt
    ↓
Ready to process tasks
```

## Comparison to Related Features

### Output Styles vs CLAUDE.md

- **CLAUDE.md**: Added as user message after system prompt
- **Output Styles**: Directly modify system prompt
- **Use case**: Output styles are better for personality/role changes

### Output Styles vs Agents (Task tool)

- **Output Styles**: Affect main agent loop, system prompt only
- **Agents**: Invoked for specific tasks, can specify model/tools
- **Use case**: Use both - output styles for personality, agents for specialized tasks

### Output Styles vs Slash Commands

- **Output Styles**: "Stored system prompts"
- **Slash Commands**: "Stored prompts"
- **Use case**: Different purposes, can be used together

## Troubleshooting

### Agent Not Using Correct Personality

1. Check if output-style file exists in container:
   ```bash
   docker exec marie ls -la /home/agent/.claude/output-styles/
   ```

2. Check settings.local.json:
   ```bash
   docker exec marie cat /home/agent/.claude/settings.local.json
   ```

3. Rebuild to force fresh load:
   ```bash
   make rebuild
   ```

### Changes Not Applying

- Output style files are mounted **read-only** from host
- Changes to `.md` files require container recreation
- Use `make rebuild` after editing output-style files

### Agent Shows Default Personality

1. Verify output-style file has correct frontmatter
2. Check file is being copied in docker-compose command
3. Ensure settings.local.json is created correctly
4. Restart container: `make restart-workers`

## Migration Checklist

- [x] Create output-style files (marie.md, anga.md, fabien.md)
- [x] Update docker-compose.yml to use output styles
- [x] Remove dependency on combine-prompts.sh
- [x] Test rebuild process
- [ ] Verify each agent's personality
- [ ] Update documentation
- [ ] Archive old prompts/agents/ and prompts/domains/ (optional)

## Future Enhancements

### Planned Improvements

1. **Dynamic Output Style Loading**:
   - Allow runtime switching of personalities
   - Hot-reload without container restart

2. **Output Style Library**:
   - Pre-built personalities for common roles
   - Community-contributed styles

3. **Hybrid Approach**:
   - Combine output styles with CLAUDE.md for project context
   - Use both personality (output style) + project knowledge (CLAUDE.md)

4. **Testing Framework**:
   - Automated tests for agent personalities
   - Verify agents maintain character during tasks

## References

- [Claude Code Output Styles Documentation](https://code.claude.com/docs/en/output-styles)
- Original multi-agent system: `beta/codehornets-ai/`
- Example output styles: `core/output-styles/`

## Support

For questions or issues:
- Check container logs: `make logs-marie` / `make logs-anga` / `make logs-fabien`
- Verify authentication: `make check-auth`
- Rebuild system: `make rebuild`
- Review this guide: `docs/OUTPUT_STYLES_MIGRATION.md`

---

**Migration completed**: 2025-11-18
**System version**: CodeHornets-AI v1.0 with native output styles
