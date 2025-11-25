# Cleanup Analysis - What Do We Actually Need?

## Current agents/ Folder (58MB!)

```
agents/
├── cli.original.js (9.8MB)           ❓ Do we need?
├── cli.readable.js (16MB)            ❓ Do we need?
├── cli.assistant.js (16MB)           ❓ Do we need?
├── cli.dance-teacher.js (16MB)       ❓ Do we need?
├── transform.sh (1.5KB)              ❓ Do we need?
├── transform-dance-teacher.sh (1.6KB) ❓ Do we need?
├── rebrand-to-marie.sh (2.4KB)       ❓ Do we need?
├── patch-banner.sh (2.8KB)           ❓ Do we need?
└── templates/                        ✅ NEED THIS!
    ├── DANCE.md
    ├── student-profile-template.md
    ├── class-notes-template.md
    └── progress-log-template.md
```

## What We Learned

### ✅ The Right Approach
1. **CLAUDE.md** - Official customization method
2. **marie.sh** - Simple launcher that ensures CLAUDE.md exists
3. **Templates** - User-facing templates for students, classes, etc.

### ❌ What Doesn't Work Well
1. **Modified CLI files** - Can cause 401 authentication errors
2. **CLI rebranding** - Breaks on Claude Code updates
3. **Banner patches** - Unnecessary complexity

## Decision Matrix

### 🗑️ Can DELETE (49MB saved!)

| File | Size | Why Remove |
|------|------|------------|
| `cli.assistant.js` | 16MB | ❌ Orphaned generic version, never used |
| `cli.dance-teacher.js` | 16MB | ❌ Not needed - we use CLAUDE.md approach |
| `cli.readable.js` | 16MB | ❌ Only for reading code, not runtime |
| `transform.sh` | 1.5KB | ❌ Creates unnecessary CLI variants |
| `transform-dance-teacher.sh` | 1.6KB | ❌ Creates unnecessary CLI variants |
| `rebrand-to-marie.sh` | 2.4KB | ❌ Risky approach we're avoiding |
| `patch-banner.sh` | 2.8KB | ❌ Approach we decided against |

**Total saved:** 49MB of unnecessary files!

### 📦 Can ARCHIVE (keep for reference)

| File | Size | Why Archive |
|------|------|-------------|
| `cli.original.js` | 9.8MB | 📦 Reference only - original Claude Code CLI |

**Purpose:** Historical reference, understanding Claude Code structure
**Location:** Move to `docs/reference/` or `archive/`

### ✅ MUST KEEP

| File/Folder | Size | Why Essential |
|-------------|------|---------------|
| `templates/DANCE.md` | ~11KB | ✅ Marie's behavior configuration (core!) |
| `templates/student-profile-template.md` | ~2.5KB | ✅ User-facing template |
| `templates/class-notes-template.md` | ~1.6KB | ✅ User-facing template |
| `templates/progress-log-template.md` | ~2.7KB | ✅ User-facing template |

**Total essential:** ~18KB

## Simplified Structure

### Current (Confusing)
```
agents/
├── cli.original.js (9.8MB)
├── cli.readable.js (16MB)
├── cli.assistant.js (16MB)
├── cli.dance-teacher.js (16MB)
├── 4 scripts (8KB)
└── templates/
    └── 4 files (18KB)
```
**Total:** 58MB, 9 files, confusing

### Proposed (Clean)
```
domains/dance/marie/
├── templates/                # Only what matters
│   ├── DANCE.md
│   ├── student-profile-template.md
│   ├── class-notes-template.md
│   └── progress-log-template.md
├── launchers/
│   └── marie.sh
└── docs/
    └── README.md

archive/reference/            # Optional historical reference
└── cli.original.js (9.8MB)
```
**Total:** 18KB + launcher + docs, crystal clear

## Why This Works

### The Only Things That Matter

1. **CLAUDE.md (DANCE.md)** - Tells Claude Code to be Marie
   ```markdown
   You are Claude Code, Anthropic's official CLI for Claude.

   **Primary Role**: Introduce yourself as Marie...
   ```

2. **marie.sh** - Ensures CLAUDE.md exists, launches Claude
   ```bash
   cp DANCE.md ./CLAUDE.md
   claude
   ```

3. **User Templates** - Help users track students, classes
   - student-profile-template.md
   - class-notes-template.md
   - progress-log-template.md

**That's it!** Everything else is:
- ❌ Outdated approaches we moved away from
- ❌ Generated files that can be recreated
- ❌ Complex solutions for problems we solved simply

## Impact of Cleanup

### Before Cleanup
```bash
cd agents/
ls -lh
# 58MB of files
# Which do I need?
# Which are deprecated?
# Confusing!
```

### After Cleanup
```bash
cd domains/dance/marie/templates/
ls -lh
# 18KB of templates
# Clear purpose
# Everything here is used!
```

## Recommended Cleanup Plan

### Step 1: Archive Reference Material
```bash
mkdir -p archive/reference
mv agents/cli.original.js archive/reference/
```

### Step 2: Delete Obsolete Files
```bash
cd agents/
rm cli.assistant.js         # 16MB - orphaned
rm cli.dance-teacher.js     # 16MB - CLAUDE.md approach is better
rm cli.readable.js          # 16MB - just for reading
rm transform.sh             # Creates unnecessary variants
rm transform-dance-teacher.sh
rm rebrand-to-marie.sh      # Risky approach
rm patch-banner.sh          # Decided against this
```

### Step 3: Keep Only Templates
```bash
# agents/ now only has:
agents/templates/
├── DANCE.md
├── student-profile-template.md
├── class-notes-template.md
└── progress-log-template.md
```

### Step 4: Move to Domain Structure (as planned)
```bash
# Migration script will move templates to:
domains/dance/marie/templates/
```

**Result:** 49MB saved, crystal clear structure!

## What If We Need CLI Modification Later?

**Option 1: Generate on Demand**
```bash
# If ever needed:
beautify cli.js > cli.readable.js
# Edit as needed
# Delete when done
```

**Option 2: Use git history**
```bash
# All the transform scripts are in git history
git log --all --full-history -- agents/
git show <commit>:agents/transform-dance-teacher.sh
```

**Option 3: We probably won't need it**
- CLAUDE.md is the official, supported way
- No authentication issues
- Survives updates
- Recommended by Anthropic

## Summary

| Category | Current | Proposed | Savings |
|----------|---------|----------|---------|
| **CLI Files** | 58MB | 0MB | 58MB |
| **Scripts** | 8KB | 0KB | 8KB |
| **Templates** | 18KB | 18KB | 0KB |
| **Total** | 58MB | 18KB | **99.97% reduction!** |

**Clarity:** From confusing mess → clear purpose

## Decision

### Keep
- ✅ `templates/DANCE.md` and all .md templates
- ✅ `marie.sh` launcher
- ✅ Documentation

### Archive (optional)
- 📦 `cli.original.js` → `archive/reference/`

### Delete
- 🗑️ All `cli.*.js` (except original)
- 🗑️ All `.sh` scripts in agents/

### Result
Clean, focused, maintainable structure that follows the CLAUDE.md approach we know works!

---

**Recommendation:** Execute cleanup during the restructure migration.

The migration script should:
1. Copy templates to `domains/dance/marie/templates/`
2. Skip all the obsolete CLI files
3. Create fresh `marie.sh` in `domains/dance/marie/launchers/`
4. Optionally archive `cli.original.js`

This gives us a clean slate with only what we actually use!
