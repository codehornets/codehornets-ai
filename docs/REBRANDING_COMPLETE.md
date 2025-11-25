# 🩰 Marie Rebranding - Complete Guide

## ✅ What's Ready

### Files Created:
- ✅ `marie.sh` - Branded launcher with Marie banner
- ✅ `agent-mod/rebrand-to-marie.sh` - CLI rebranding script (advanced)
- ✅ `agent-mod/templates/DANCE.md` - Marie behavior configuration
- ✅ `Makefile` - Added `make marie` command
- ✅ `REBRANDING_PLAN.md` - Complete rebranding guide
- ✅ `MARIE_QUICKSTART.md` - Quick start guide

---

## 🚀 Two Ways to Launch Marie

### Option 1: Direct Launch (Standard)

**Launch:**
```bash
cd dance-studio
claude
```

**What You See:**
```
Terminal:
 ▐▛███▜▌   Claude Code v2.0.42
▝▜█████▛▘  Sonnet 4.5 · Claude Max

Chat (Marie's first message):
═══════════════════════════════════════════════
  🩰💃🩰   Marie v1.0
  ✨🎭✨   Dance Teacher Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Hi! I'm Marie, your dance teacher assistant! 🩰
```

### Option 2: Using marie.sh Wrapper (Recommended)

**Launch:**
```bash
make marie
# or
cd dance-studio && ../marie.sh
```

**What You Get:**
- ✅ Automatic CLAUDE.md setup (first time)
- ✅ Marie banner in chat
- ✅ Marie behavior and personality
- ✅ No cli.js modification needed
- ✅ No authentication issues
- ✅ Survives Claude Code updates

**Result:** Same as Option 1, but marie.sh ensures CLAUDE.md is configured

---

## 🎯 Step-by-Step Setup

### Step 1: Quick Setup
```bash
make quick-setup
```

### Step 2: Test CLAUDE.md (Critical!)
```bash
cd test-suite/test1-basic
claude
> banana
```

**Must see:** "🍌 TEST PASSED: CLAUDE.md is being read!"

### Step 3: Launch Marie
```bash
# Option A: Standard
make studio

# Option B: With branded banner
make marie
```

### Step 4: Test Marie
```
> what can you do?
```

**Should say:**
```
Hi! I'm Marie, your dance teacher assistant! 🩰
I'm here to help you with:
- Student tracking and progress notes
- Class documentation
...
```

---

## 🎨 What marie.sh Does

```bash
#!/bin/bash
# 1. Checks if CLAUDE.md exists
# 2. Creates CLAUDE.md from template if missing
# 3. Launches Claude Code normally
# 4. Marie introduces herself in chat with banner
```

**How It Works:**
- Terminal shows normal Claude Code banner
- Marie shows HER banner as first chat message (from CLAUDE.md)
- Marie introduces herself and explains what she can do
- Clean separation: Terminal = technical, Chat = Marie's personality

**Advantages:**
- ✅ No CLI modification needed!
- ✅ Marie identity clear from first message
- ✅ CLAUDE.md behavior active
- ✅ Authentication always works
- ✅ Survives Claude Code updates
- ✅ No double banners in terminal

---

## 🔧 Advanced: Full CLI Rebrand (Optional)

If you want to modify cli.js directly:

```bash
cd agent-mod
./rebrand-to-marie.sh
```

**This changes:**
- Version display
- Window title
- All user-facing text

**WARNING:**
- ⚠️ Test for 401 errors immediately!
- ⚠️ Breaks on Claude Code updates
- ⚠️ API identity strings must be preserved

**Only do this if:**
- You've tested CLAUDE.md works
- You understand the risks
- You want complete visual rebrand

---

## 📊 Comparison

| Aspect | Direct Launch | make marie | CLI Rebrand |
|--------|---------------|------------|-------------|
| **Terminal Banner** | "Claude Code" | "Claude Code" | "Marie" |
| **Chat Banner** | Marie | Marie | Marie |
| **Behavior** | Marie | Marie | Marie |
| **Setup** | Manual CLAUDE.md | Auto setup | Complex |
| **Auth Risk** | None | None | Medium |
| **Updates** | Safe | Safe | Breaks |
| **Effort** | Copy CLAUDE.md | 1 command | Complex |
| **Recommended** | ✅ Yes | ✅ Best | ⚠️ Not needed |

---

## ✅ Success Checklist

After setup, verify:

- [ ] `make quick-setup` completed
- [ ] Test 1 passed (CLAUDE.md works)
- [ ] Studio workspace created
- [ ] Marie introduces herself properly
- [ ] No 401 authentication errors
- [ ] Can create student profiles
- [ ] Class notes work
- [ ] CLAUDE.md is in workspace

---

## 🎯 Quick Commands Reference

```bash
# Setup
make quick-setup        # One-time setup

# Launch Options
make studio            # Standard (CLAUDE.md only)
make marie             # Branded banner + CLAUDE.md

# Testing
cd test-suite/test1-basic && claude
> banana               # Test CLAUDE.md

# Utilities
make help              # Show all commands
make templates         # Show templates
make docs              # List documentation
```

---

## 💡 Understanding the Layers

```
┌─────────────────────────────────────┐
│  Terminal Layer (technical)         │
│  - Claude Code banner in terminal   │ ← Technical identity
│  - Shows version, model info        │
├─────────────────────────────────────┤
│  Chat Layer (personality)           │
│  - Marie banner in first message    │ ← User-facing identity
│  - Marie introduces herself         │
│  - CLAUDE.md defines behavior       │
├─────────────────────────────────────┤
│  Authentication Layer (API)         │
│  - "You are Claude Code..." string  │ ← NEVER CHANGE
│  - Required for Anthropic API       │
└─────────────────────────────────────┘
```

**New Approach:**
- Terminal = Claude Code (technical, accurate)
- Chat = Marie (personality, specialized role)
- Clean separation of concerns
- No conflicting banners!

**CLAUDE.md changes:** Chat personality only
**marie.sh:** Setup helper only
**API identity:** ALWAYS unchanged!

---

## 🚨 Troubleshooting

### "CLAUDE.md not being read"
```bash
# Make sure you're IN the workspace
cd dance-studio
claude
```

### "Still says Claude Code"
```bash
# Use branded wrapper:
make marie

# Instead of:
make studio
```

### "401 Authentication Error"
```bash
# You modified API identity strings!
# Restore from backup:
cp agent-mod/cli.original.js agent-mod/cli.marie.js
```

### "Marie doesn't introduce herself"
```bash
# Check CLAUDE.md exists:
ls dance-studio/CLAUDE.md

# Recreate if missing:
cp agent-mod/templates/DANCE.md dance-studio/CLAUDE.md
```

---

## 📚 Documentation

- `REBRANDING_PLAN.md` - Complete rebranding strategy
- `MARIE_QUICKSTART.md` - Quick start guide
- `TESTING_PROTOCOL.md` - Test suite
- `PAUSE_FOR_TESTING.md` - Why test first
- `marie.sh` - Branded launcher script

---

## 🎉 You're Ready!

```bash
# Run these now:
make quick-setup
make marie
```

Then try:
```
> Create a student profile for Emma Johnson
```

**Marie will handle it!** 🩰✨

---

## ⚡ Next Steps

1. **Test CLAUDE.md works** (Test 1)
2. **Launch Marie** (`make marie`)
3. **Create first student**
4. **Document first class**
5. **Experience the magic!** ✨

**Welcome to Marie, your dance teacher assistant!** 🩰
