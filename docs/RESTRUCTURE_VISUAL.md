# Visual Structure Comparison

## Before: Current Structure (Confusing)

```
@codehornets-ai/
│
├── agents/                         ❌ Unclear name
│   ├── cli.original.js            ❌ Mixed with multiple domains
│   ├── cli.readable.js
│   ├── cli.assistant.js
│   ├── cli.dance-teacher.js
│   ├── cli.marie.js
│   ├── templates/                 ❌ Only Marie templates
│   │   ├── DANCE.md
│   │   ├── student-profile-template.md
│   │   ├── class-notes-template.md
│   │   └── progress-log-template.md
│   ├── transform.sh
│   ├── transform-dance-teacher.sh
│   ├── rebrand-to-marie.sh
│   └── patch-banner.sh
│
├── marie.sh                        ❌ Root-level launcher
├── test-suite/                     ❌ Only Marie tests
│   └── test1-basic/
│
├── workspaces/                     ✅ Good!
│   └── dance/
│       └── studio/
│
├── MARIE_FINAL.md                  ❌ Scattered docs
├── MARIE_QUICKSTART.md
├── REBRANDING_COMPLETE.md
├── WORKSPACE_RESTRUCTURE.md
│
└── Makefile                        ❌ Unscalable targets
```

**Problems:**
- ❌ `agents/` contains only Marie stuff but name suggests generic
- ❌ Can't add education or business domains easily
- ❌ Documentation scattered in root
- ❌ No clear domain separation
- ❌ Launcher in root instead of domain
- ❌ Hard to find Marie-specific files

---

## After: New Structure (Clean & Scalable)

```
@codehornets-ai/
│
├── 🎨 domains/                      # Domain-specific customizations
│   │
│   ├── dance/                       # Dance teaching domain
│   │   ├── marie/                   # Marie assistant
│   │   │   ├── cli/
│   │   │   │   ├── cli.original.js
│   │   │   │   ├── cli.readable.js
│   │   │   │   └── cli.marie.js
│   │   │   ├── templates/
│   │   │   │   ├── DANCE.md
│   │   │   │   ├── student-profile-template.md
│   │   │   │   ├── class-notes-template.md
│   │   │   │   └── progress-log-template.md
│   │   │   ├── scripts/
│   │   │   │   ├── transform-dance-teacher.sh
│   │   │   │   ├── rebrand-to-marie.sh
│   │   │   │   └── patch-banner.sh
│   │   │   ├── launchers/
│   │   │   │   └── marie.sh
│   │   │   ├── docs/
│   │   │   │   ├── README.md
│   │   │   │   ├── QUICKSTART.md
│   │   │   │   ├── COMPLETE_GUIDE.md
│   │   │   │   └── REBRANDING.md
│   │   │   └── tests/
│   │   │       └── test1-basic/
│   │   └── README.md
│   │
│   ├── education/                   # Education domain (ready to add)
│   │   ├── tutor/                   # Tutoring assistant
│   │   │   ├── cli/
│   │   │   ├── templates/
│   │   │   ├── scripts/
│   │   │   ├── launchers/
│   │   │   ├── docs/
│   │   │   └── tests/
│   │   └── README.md
│   │
│   ├── business/                    # Business domain (ready to add)
│   │   ├── consultant/              # Business consultant
│   │   │   ├── cli/
│   │   │   ├── templates/
│   │   │   ├── scripts/
│   │   │   ├── launchers/
│   │   │   ├── docs/
│   │   │   └── tests/
│   │   └── README.md
│   │
│   ├── _template/                   # Template for new domains
│   │   ├── cli/
│   │   ├── templates/
│   │   ├── scripts/
│   │   ├── launchers/
│   │   ├── docs/
│   │   └── README.md
│   │
│   └── README.md
│
├── 🏗️ workspaces/                   # User workspaces
│   ├── dance/
│   │   └── studio/
│   ├── education/
│   │   └── tutoring/
│   ├── business/
│   │   └── consulting/
│   └── README.md
│
├── 🛠️ dev/                           # Development tools
│   ├── scripts/
│   │   ├── create-domain.sh
│   │   └── create-workspace.sh
│   └── tools/
│
├── 📚 docs/                          # Centralized documentation
│   ├── getting-started/
│   ├── domains/
│   ├── workspaces/
│   ├── architecture/
│   └── reference/
│
├── 🧪 scripts/
│   └── migrate-to-new-structure.sh
│
├── Makefile                          # Scalable domain targets
└── README.md                         # Main overview
```

**Benefits:**
- ✅ Clear domain separation (`dance/`, `education/`, `business/`)
- ✅ Each domain is self-contained
- ✅ Easy to add new domains
- ✅ Documentation organized by domain
- ✅ Scalable Makefile structure
- ✅ Template for creating new domains
- ✅ Developer-friendly navigation

---

## Side-by-Side Comparison

### Finding Marie Files

| Task | Before | After |
|------|--------|-------|
| **Marie templates** | `agents/templates/` | `domains/dance/marie/templates/` |
| **Marie launcher** | `marie.sh` (root) | `domains/dance/marie/launchers/marie.sh` |
| **Marie docs** | Scattered in root | `domains/dance/marie/docs/` |
| **Marie CLI** | `agents/cli.marie.js` | `domains/dance/marie/cli/cli.marie.js` |
| **Marie tests** | `test-suite/` | `domains/dance/marie/tests/` |
| **Marie scripts** | `agents/*.sh` | `domains/dance/marie/scripts/` |

### Adding New Domain

| Before | After |
|--------|-------|
| ❌ No clear pattern | ✅ `make create-domain domain=education/tutor` |
| ❌ Files mixed together | ✅ Complete isolation in `domains/education/tutor/` |
| ❌ Makefile needs custom logic | ✅ Standardized Makefile pattern |
| ❌ No template to follow | ✅ Use `domains/_template/` |

---

## Developer Workflows

### Working with Marie

**Before:**
```bash
# Confusing - files scattered
cd agents/
ls  # Which CLI file do I need?
cd ..
cat marie.sh  # Where is this?
cat agents/templates/DANCE.md  # Mixed paths
```

**After:**
```bash
# Clear - everything in one place
cd domains/dance/marie/
ls  # See complete structure
cat templates/DANCE.md
cat launchers/marie.sh
cat docs/README.md
```

### Creating New Domain

**Before:**
```bash
# No guidance, manual process
mkdir some-new-folder
# Copy files from agents/?
# Update Makefile manually
# Create templates manually
# Hope it works
```

**After:**
```bash
# Guided process
make create-domain domain=education/tutor

# Output:
# ✅ Created: domains/education/tutor
# Next steps:
#   1. Edit templates/BEHAVIOR.md
#   2. Create launcher script
#   3. Add Makefile target

# Structure automatically created
domains/education/tutor/
├── cli/
├── templates/
├── scripts/
├── launchers/
├── docs/
└── tests/
```

### Building and Launching

**Before:**
```bash
make marie  # Where does this look for files?
# Hard to understand what happens
```

**After:**
```bash
make marie  # Clear path: domains/dance/marie/
make tutor  # Clear path: domains/education/tutor/
make consultant  # Clear path: domains/business/consultant/

# Makefile clearly shows:
MARIE_DOMAIN = domains/dance/marie
MARIE_LAUNCHER = $(MARIE_DOMAIN)/launchers/marie.sh
```

---

## File Organization

### Before (Flat & Mixed)

```
agents/
├── cli.original.js         ← Original Claude Code
├── cli.readable.js         ← Marie-related
├── cli.assistant.js        ← Generic assistant (orphaned?)
├── cli.dance-teacher.js    ← Marie-related
├── cli.marie.js            ← Marie-related
├── templates/              ← Only Marie templates
├── transform.sh            ← Generic
└── transform-dance-teacher.sh  ← Marie-specific
```

**Issues:**
- Mixed original + Marie + generic files
- Can't tell which files belong to which domain
- No room for education or business domains

### After (Hierarchical & Clear)

```
domains/
├── dance/marie/            ← All Marie files
│   ├── cli/               ← Marie CLI variants
│   ├── templates/         ← Marie templates
│   ├── scripts/           ← Marie scripts
│   └── ...
├── education/tutor/        ← All Tutor files
│   ├── cli/               ← Tutor CLI variants
│   ├── templates/         ← Tutor templates
│   └── ...
└── business/consultant/    ← All Consultant files
    ├── cli/               ← Consultant CLI variants
    ├── templates/         ← Consultant templates
    └── ...
```

**Benefits:**
- Complete isolation
- Clear ownership
- Room to grow
- Easy to navigate

---

## Documentation Organization

### Before

```
(root)/
├── MARIE_FINAL.md
├── MARIE_QUICKSTART.md
├── REBRANDING_COMPLETE.md
├── WORKSPACE_RESTRUCTURE.md
└── (many other .md files)
```

**Issues:**
- Root cluttered with docs
- No organization by topic
- Hard to find what you need

### After

```
domains/dance/marie/docs/
├── README.md               ← Marie overview
├── QUICKSTART.md           ← Getting started
├── COMPLETE_GUIDE.md       ← Full reference
└── REBRANDING.md           ← Rebranding guide

docs/
├── getting-started/        ← General getting started
├── domains/                ← Domain creation guides
├── workspaces/             ← Workspace guides
├── architecture/           ← Architecture docs
└── reference/              ← API reference
```

**Benefits:**
- Marie docs with Marie code
- General docs centralized
- Easy to find what you need
- Clear separation of concerns

---

## Makefile Structure

### Before (Unscalable)

```makefile
# Hard-coded paths
studio:
	@cp agent-mod/templates/DANCE.md dance-studio/CLAUDE.md
	@cd dance-studio && claude

marie:
	@cd dance-studio && ../marie.sh

# How do we add tutor? Copy-paste and modify?
```

### After (Scalable Pattern)

```makefile
# Domain variables
MARIE_DOMAIN = domains/dance/marie
TUTOR_DOMAIN = domains/education/tutor
CONSULTANT_DOMAIN = domains/business/consultant

# Standardized pattern
marie:
	@cd $(MARIE_WORKSPACE) && ../../../$(MARIE_DOMAIN)/launchers/marie.sh

tutor:
	@cd $(TUTOR_WORKSPACE) && ../../../$(TUTOR_DOMAIN)/launchers/tutor.sh

consultant:
	@cd $(CONSULTANT_WORKSPACE) && ../../../$(CONSULTANT_DOMAIN)/launchers/consultant.sh

# Easy to add new domains - just follow the pattern!
```

---

## Summary

### Before
❌ Confusing structure
❌ Mixed domains
❌ Scattered docs
❌ Hard to extend
❌ No templates

### After
✅ Clear structure
✅ Domain isolation
✅ Organized docs
✅ Easy to extend
✅ Domain templates

**Result:** Professional, scalable, developer-friendly architecture! 🎯
