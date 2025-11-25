# Agent Manager Plugin Structure

Correct Claude Code plugin structure:

```
agent-manager/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (REQUIRED)
├── commands/                 # Custom slash commands
│   └── create-agent.md
├── agents/                   # Custom agents
│   └── agent-creator.md
├── skills/                   # Agent Skills
│   └── agent-management/
│       └── SKILL.md
├── hooks/                    # Event handlers
│   └── hooks.json
├── README.md                 # Plugin documentation
└── STRUCTURE.md             # This file
```

## File Locations

### Metadata (Required)
- `.claude-plugin/plugin.json` - Plugin manifest

### Components (All Optional)
- `commands/*.md` - Slash commands
- `agents/*.md` - Sub-agent definitions
- `skills/*/SKILL.md` - Reusable skills
- `hooks/hooks.json` - Lifecycle hooks
- `README.md` - Documentation

## Installation

### Local (Development)
Already in `.claude/plugins/agent-manager/`

### User-Level (All Projects)
```bash
ln -s "$(pwd)/.claude/plugins/agent-manager" ~/.claude/plugins/agent-manager
```

## Verification

```bash
# Check structure
ls -la .claude/plugins/agent-manager/.claude-plugin/plugin.json

# Validate plugin.json
cat .claude/plugins/agent-manager/.claude-plugin/plugin.json | jq .

# Test components
ls -la .claude/plugins/agent-manager/commands/
ls -la .claude/plugins/agent-manager/agents/
ls -la .claude/plugins/agent-manager/skills/
ls -la .claude/plugins/agent-manager/hooks/
```
