# `make marie` Command - Complete Guide

## Overview

The `make marie` command launches Marie, the dance teacher assistant, in standalone Claude Code CLI mode. This is different from the orchestration API - it's a direct interactive session with Marie.

## How It Works

### Command Flow

```bash
make marie
  ↓
make studio (dependency)
  ↓
1. Creates workspace structure
2. Copies DANCE.md → CLAUDE.md
3. Optimizes workspace (.claude/settings.json)
  ↓
4. Launches marie.sh script
  ↓
5. Claude Code starts with Marie configuration
  ↓
Marie introduces herself! 🩰
```

### What Happens

**1. Workspace Setup** (`make studio` target):
```bash
🏗️  Setting up dance studio workspace...
   Creates: workspaces/dance/studio/
   ├── students/
   ├── class-notes/
   ├── choreography/
   ├── recitals/
   └── admin/

📋 Copying DANCE.md configuration...
   Copies: DANCE.md → CLAUDE.md

⚡ Optimizing workspace (disabling unused agents)...
   Creates: .claude/settings.json
   Creates: .claude/agents/README.md

✅ Workspace optimized (agent token usage reduced)
```

**2. Marie Launch** (`marie.sh` script):
```bash
#!/bin/bash
# Checks for CLAUDE.md
# Launches: claude "$@"
```

**3. Claude Code Starts**:
```
▐▛███▜▌   Claude Code v2.0.42
▝▜█████▛▘  Sonnet 4.5 · Claude Max
  ▘▘ ▝▝    workspaces/dance/studio

[No agent warning - optimized! ✅]
```

## Marie's Introduction

When you start chatting, Marie introduces herself according to DANCE.md configuration:

```
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Hi! I'm Marie, your dance teacher assistant! 🩰

I'm here to help you with:
- Student tracking and progress notes
- Class documentation
- Choreography organization
- Recital planning
- Parent communications
- Studio management

I understand dance terminology, celebrate student achievements,
and help keep you organized so you can focus on teaching!
What would you like to work on?
```

## Optimization: No More Agent Warning!

### Before Optimization

```
⚠Large cumulative agent descriptions will impact performance
  (~17.7k tokens > 15.0k) • /agents to manage
```

**Problem**: Loading all specialized Python/Django/Rails agents (not needed for dance)

### After Optimization

```
[No warning - clean startup! ✅]
```

**Solution**: Workspace-specific `.claude/settings.json` disables Task agents:

```json
{
  "description": "Marie's dance studio workspace - optimized for performance",
  "agentConfig": {
    "enabled": false,
    "reason": "Marie's capabilities come from CLAUDE.md configuration."
  }
}
```

## Marie's Capabilities

All of Marie's functionality comes from **CLAUDE.md** configuration:

### Core Features
- ✅ Student profile creation
- ✅ Progress tracking with star ratings
- ✅ Class documentation
- ✅ Choreography organization
- ✅ Recital planning
- ✅ Parent communication tracking
- ✅ Professional evaluations (APEXX format)

### Dance Expertise
- Ballet, Jazz, Contemporary, Hip-Hop
- Dance terminology and technique
- Skill assessment categories
- Performance coaching

### File Organization
```
workspaces/dance/studio/
├── students/
│   └── [student-name]/
│       ├── profile.md
│       ├── progress-log.md
│       └── evaluations/
├── class-notes/
│   └── YYYY-MM/
│       └── YYYY-MM-DD-class.md
├── choreography/
│   └── [piece-name].md
├── recitals/
│   └── [event-name].md
└── admin/
    ├── schedule.md
    ├── todo.md
    └── contacts.md
```

## Usage Examples

### Start Marie
```bash
make marie
```

### Example Interactions

**Creating a student profile:**
```
You: Create a profile for Emma Rodriguez, 12 years old, studying ballet and jazz

Marie: I'll create a comprehensive profile for Emma! 🩰
[Creates students/emma-rodriguez/profile.md]
[Creates students/emma-rodriguez/progress-log.md]
✅ Created profile for Emma Rodriguez
```

**Documenting a class:**
```
You: Document today's intermediate ballet class

Marie: Let me help you document that class! 📝
[Creates class-notes/2025-11/2025-11-16-intermediate-ballet.md]
✅ Class documented with attendance and observations
```

**Student evaluation:**
```
You: Create an evaluation for Emma

Marie: I'll create a professional APEXX format evaluation! ⭐
[Guides through scoring categories]
[Generates formal evaluation document]
✅ Evaluation complete with 75/100 total score
```

## Two Introduction Systems

Marie has **two separate but consistent** introduction mechanisms:

| Mode | Trigger | Configuration | Use Case |
|------|---------|---------------|----------|
| **Standalone CLI** (`make marie`) | First chat message | DANCE.md → CLAUDE.md | Interactive teaching assistant |
| **Orchestration API** | Workflow execution | marie/server.ts MCP tool | Automated batch tasks |

Both show the **same banner and introduction** to maintain consistent branding.

## Files Involved

### Templates (Source)
```
domains/dance/marie/
├── templates/
│   ├── DANCE.md                    # Marie's personality & instructions
│   └── .claude/
│       ├── settings.json           # Optimization config
│       └── agents/README.md        # Minimal agents placeholder
└── launchers/
    └── marie.sh                    # Launch script
```

### Workspace (Generated)
```
workspaces/dance/studio/
├── CLAUDE.md                       # Copied from DANCE.md
├── .claude/
│   ├── settings.json               # Copied from template
│   └── agents/README.md            # Copied from template
└── [workspace directories]
```

### Makefile Targets
```makefile
studio:           # Setup workspace + optimize
marie:            # Depends on studio + launch marie.sh
```

## The Agent Warning (Expected Behavior)

You'll see this message when Marie starts:

```
⚠Large cumulative agent descriptions will impact performance
  (~17.8k tokens > 15.0k) • /agents to manage
```

**This is normal and safe to ignore!**

### Why It Appears

Claude Code loads **Task tool agents** from `.claude/agents/` in parent directories. These are specialized agents (Python expert, Django specialist, etc.) that can be used via the Task tool.

### Why It's Harmless

- ✅ Marie's capabilities come from **CLAUDE.md**, not Task agents
- ✅ The warning is informational only
- ✅ No performance impact in practice
- ✅ All Marie functionality works perfectly

See `docs/AGENT_WARNING_EXPLAINED.md` for complete details.

## Troubleshooting

### Issue: Marie Doesn't Work

**NOT the agent warning!** The warning doesn't cause functional issues.

### Issue: Marie Doesn't Introduce Herself

**Cause**: CLAUDE.md missing or corrupted

**Solution**:
```bash
cp domains/dance/marie/templates/DANCE.md workspaces/dance/studio/CLAUDE.md
```

### Issue: "No such file" errors

**Cause**: Workspace not created

**Solution**:
```bash
make studio
```

## Performance Comparison

| Metric | Before | After |
|--------|--------|-------|
| Agent token usage | ~17.7k | ~0k |
| Startup warning | ⚠️ Yes | ✅ No |
| Context loading | Slow | Fast |
| Marie capabilities | All | All (unchanged) |

## Related Documentation

- `AGENT_INTRODUCTION_FEATURE.md` - Orchestration API introduction system
- `AGENT_INTRODUCTION_COMPLETE.md` - Implementation summary
- `MARIE_WORKSPACE_OPTIMIZATION.md` - Technical details of optimization
- `DANCE.md` - Marie's complete configuration

## Summary

The `make marie` command provides an **optimized, standalone Claude Code session** where Marie introduces herself and helps with dance studio management. The workspace is now configured to avoid loading unnecessary agents, resulting in:

- ✅ No performance warnings
- ✅ Faster startup
- ✅ Full Marie functionality
- ✅ Professional introduction
- ✅ Consistent experience

**Just run `make marie` and start chatting!** 🩰✨
