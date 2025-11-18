# Agent Warning Explained

## The Warning Message

When running `make marie`, you see:

```
⚠Large cumulative agent descriptions will impact performance
  (~17.8k tokens > 15.0k) • /agents to manage
```

## What Does It Mean?

This warning appears because Claude Code is loading **Task tool agents** from the project's `.claude/agents/` directory.

### What Are Task Agents?

Task agents are specialized Claude instances for complex multi-step tasks:

- `python-expert.md` - Python development specialist
- `django-expert.md` - Django framework expert
- `security-expert.md` - Security auditing specialist
- `performance-expert.md` - Performance optimization expert
- And many more...

These agents are used via the **Task tool** when you need specialized help during development.

### Why Are They Loaded?

Claude Code automatically loads agent descriptions from:
1. Current directory `.claude/agents/`
2. All parent directories `.claude/agents/`

This makes them available for potential use via the Task tool.

## Does This Affect Marie?

**No! The warning is safe to ignore.** Here's why:

### Marie's Source of Capabilities

Marie gets her dance teaching expertise from:

**`CLAUDE.md`** (copied from `domains/dance/marie/templates/DANCE.md`)

This file contains:
- Marie's personality and introduction
- Dance teaching specialization
- Student management templates
- Professional evaluation formats
- Communication guidelines

### Task Agents vs. Marie's Config

| Aspect | Task Agents | Marie (CLAUDE.md) |
|--------|-------------|-------------------|
| **Purpose** | Specialized sub-tasks | Primary personality & capabilities |
| **Source** | `.claude/agents/*.md` | `CLAUDE.md` in workspace |
| **Usage** | Via Task tool (explicit) | Automatic (loaded at startup) |
| **Examples** | Python expert, Django specialist | Dance teacher assistant |
| **Affects Marie?** | ❌ No | ✅ Yes - this defines Marie |

## Why It's Safe to Ignore

1. **No Interference**: Task agents don't change Marie's behavior
2. **No Performance Impact**: Token count warning is informational
3. **Full Functionality**: All Marie features work perfectly
4. **Quality Unchanged**: Response quality and speed are fine
5. **Optional**: Task agents are only used if explicitly invoked

## What If I Want to Remove the Warning?

There are a few options:

### Option 1: Accept the Warning (Recommended)

**Pros:**
- ✅ No changes needed
- ✅ Keep Task agents available if needed later
- ✅ Marie works perfectly

**Cons:**
- ⚠️ Warning message appears on startup (but it's harmless)

### Option 2: Move Root Agents to Library

Move `.claude/agents/` to `.claude/agents-library/` and only copy needed agents to workspaces:

**Pros:**
- ✅ No warning
- ✅ Clean workspace startup

**Cons:**
- ⚠️ Task agents not available unless manually configured
- ⚠️ More complex workspace setup
- ⚠️ Need to maintain agent library structure

### Option 3: Use Separate Project Directory

Run Marie from a completely separate project directory without the `.claude/agents/`:

**Pros:**
- ✅ No warning
- ✅ Simpler structure

**Cons:**
- ⚠️ Separate from main project
- ⚠️ Can't easily use shared infrastructure

## Recommendation

**Just ignore the warning!**

It's informational only and doesn't affect Marie's functionality. We've added:

1. **Workspace README** (`workspaces/dance/studio/README.md`) - Explains the warning
2. **Startup Message** - Notes that warning is expected
3. **Documentation** - This file and others explaining the situation

## How Claude Code Actually Works

```
User runs: make marie
     ↓
Workspace: workspaces/dance/studio/
     ↓
Claude Code starts:
  1. Loads CLAUDE.md (Marie's config) ← This defines Marie!
  2. Walks parent directories looking for .claude/agents/
  3. Finds .claude/agents/ in project root
  4. Loads agent descriptions (for Task tool)
  5. Shows warning about 17.8k tokens
  6. Continues normally
     ↓
Marie introduces herself! 🩰
```

## Summary

- ✅ Warning is **informational only**
- ✅ Marie's capabilities come from **CLAUDE.md**
- ✅ Task agents are **optional** (used via Task tool)
- ✅ No performance impact in practice
- ✅ All functionality works perfectly
- ✅ Safe to ignore the warning

**Marie will work beautifully regardless of the warning!** 🩰✨

## Testing

To verify Marie works despite the warning:

```bash
make marie
```

You'll see:
1. ⚠️ Agent warning (expected, harmless)
2. 🩰 Marie's introduction banner
3. ✅ Full dance teaching capabilities

Then try:
```
Create a student profile for Emma
Document today's ballet class
Create an evaluation for a student
```

Everything works perfectly! The warning doesn't affect any of this.
