# Marie's Dance Studio Workspace

Welcome to Marie's workspace! 🩰

## Quick Start

Marie is configured and ready to help with:
- Student progress tracking and evaluations
- Class documentation
- Choreography organization
- Recital planning
- Parent communications

Just start chatting and Marie will introduce herself!

## About the Agent Warning

You may see this message when Marie starts:
```
⚠Large cumulative agent descriptions will impact performance
  (~17.8k tokens > 15.0k)
```

**This is normal and safe to ignore.** Here's why:

### What Are Those Agents?

The agents being loaded are **Task tool agents** from the project root (`.claude/agents/`):
- Python/Django specialists
- Code review experts
- Testing specialists
- Other development agents

### Does This Affect Marie?

**No!** Marie's dance teaching capabilities come from **CLAUDE.md**, not from those Task agents. The warning is informational only and doesn't impact:

- ✅ Marie's functionality
- ✅ Her dance expertise
- ✅ Student management features
- ✅ Evaluation capabilities
- ✅ Response quality or speed

### Why Are They Loaded?

Claude Code loads Task agents from parent directories to make them available via the Task tool (for running specialized sub-agents). Even though Marie doesn't use them, they're loaded for potential use.

### Can I Disable Them?

The agents are loaded by Claude Code's core functionality. They don't interfere with Marie's operation, so there's no need to disable them.

## Marie's Configuration

Marie's personality, capabilities, and instructions come from:

**`CLAUDE.md`** - Copied from `domains/dance/marie/templates/DANCE.md`

This configuration includes:
- Dance teaching expertise
- Student management templates
- Professional evaluation formats (APEXX)
- File organization patterns
- Communication guidelines

## Workspace Structure

```
workspaces/dance/studio/
├── CLAUDE.md                 # Marie's configuration
├── .claude/
│   ├── settings.json         # Workspace settings
│   └── agents/README.md      # Agent info
├── students/                 # Student profiles & progress
├── class-notes/              # Daily class documentation
├── choreography/             # Piece documentation
├── recitals/                 # Performance planning
└── admin/                    # Studio management
```

## Get Help

If you need assistance with Marie:
1. Check `CLAUDE.md` for her complete configuration
2. See `docs/MAKE_MARIE_COMMAND.md` for usage guide
3. Review `domains/dance/marie/templates/DANCE.md` for templates

Happy dancing! 🩰✨
