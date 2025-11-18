# Marie - Dance Teacher Assistant

Marie is a specialized AI assistant for dance teachers and studio owners, built on Claude Code using the CLAUDE.md customization approach.

## Quick Start

```bash
# Launch Marie
make marie
```

## Directory Structure

```
marie/
├── templates/         # Behavior templates and student tracking
│   ├── DANCE.md      # Marie's behavior configuration (THE KEY FILE)
│   ├── student-profile-template.md
│   ├── class-notes-template.md
│   └── progress-log-template.md
├── launchers/
│   └── marie.sh      # Launch script
├── docs/            # Documentation
└── tests/           # Test suite
```

## How It Works

Marie uses the **CLAUDE.md approach** - the official, supported way to customize Claude Code:

1. **DANCE.md** - Defines Marie's personality and behavior
2. **marie.sh** - Ensures DANCE.md is copied to workspace as CLAUDE.md
3. **Claude Code** - Reads CLAUDE.md and becomes Marie

**No CLI modification needed!** This approach:
- ✅ Works perfectly with authentication
- ✅ Survives Claude Code updates
- ✅ Uses official customization method
- ✅ No risk of breaking changes

## Files

### Templates (`templates/`)

**DANCE.md** - Core configuration
- Tells Claude Code to introduce as "Marie"
- Defines dance teacher behavior
- Shows Marie's banner at session start
- Preserves API authentication identity

**User Templates:**
- `student-profile-template.md` - Track student skills and progress
- `class-notes-template.md` - Document classes quickly
- `progress-log-template.md` - Ongoing progress notes

### Launchers (`launchers/`)

**marie.sh** - Simple launcher that:
- Searches for DANCE.md template
- Copies it to workspace as CLAUDE.md
- Launches Claude Code
- Marie introduces herself in chat

## Usage

### Launch Marie
```bash
make marie
```

### Create New Workspace
```bash
make create-workspace domain=dance project=my-studio
cd workspaces/dance/my-studio
../../../domains/dance/marie/launchers/marie.sh
```

### Marie introduces herself
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
```

## Features

- **Student Progress Tracking** - Individual profiles with skill assessments
- **Class Documentation** - Quick notes after each class
- **Choreography Organization** - Document combinations and routines
- **Recital Planning** - Performance organization from start to finish
- **Parent Communication** - Track updates and conversations
- **Studio Management** - Schedules, tasks, and organization

## Technical Details

### The CLAUDE.md Approach

Marie doesn't modify the Claude Code CLI. Instead, she uses CLAUDE.md:

```markdown
# In workspace/CLAUDE.md:
You are Claude Code, Anthropic's official CLI for Claude.

**Primary Role**: Introduce yourself as Marie, a dance teacher assistant...
```

This is the **official, recommended way** to customize Claude Code behavior.

### Why Not Modify CLI?

We explored CLI modification but found:
- ❌ Risk of 401 authentication errors
- ❌ Breaks on Claude Code updates
- ❌ Requires 58MB of modified files
- ❌ Complex maintenance

CLAUDE.md is better:
- ✅ 18KB total (vs 58MB)
- ✅ Always works with authentication
- ✅ Survives updates
- ✅ Simple and maintainable

## What We Don't Need

The `agents/` folder previously contained:
- ❌ `cli.*.js` files (58MB) - Not needed with CLAUDE.md approach
- ❌ Transform scripts - Created unnecessary CLI variants
- ❌ Rebrand scripts - Risky approach we're avoiding

**Only the templates matter!** Everything else is handled by CLAUDE.md.

## Workspace Structure

When you launch Marie, your workspace looks like:

```
workspaces/dance/studio/
├── CLAUDE.md              # Marie's configuration (from DANCE.md)
├── students/
│   └── [student-name]/
│       ├── profile.md
│       └── progress-log.md
├── class-notes/
│   └── YYYY-MM/
│       └── class-notes.md
├── choreography/
├── recitals/
└── admin/
```

## See Also

- [CLAUDE.md specification](https://docs.anthropic.com/claude-code)
- [Workspace system](../../../workspaces/README.md)
- [Domain guidelines](../../../docs/domains/)
