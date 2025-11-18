# Project Restructure Proposal

## Current Issues

1. ❌ **agent-mod/** vs **agents/** confusion
2. ❌ Dance-specific files mixed with generic infrastructure
3. ❌ Multiple `.md` files scattered in root
4. ❌ Hard to add new domains (education, business, etc.)
5. ❌ No clear separation between:
   - Official Claude Code
   - Domain customizations
   - User workspaces
   - Development tools

## Proposed Structure

```
@codehornets-ai/
│
├── 📦 Official Claude Code (untouched)
│   ├── core/
│   ├── plugins/
│   ├── apps/
│   ├── infrastructure/
│   ├── monitoring/
│   ├── tests/
│   └── tools/
│
├── 🎨 domains/                     # Domain-specific customizations
│   │
│   ├── dance/                      # Dance teaching domain
│   │   ├── marie/                  # Marie assistant implementation
│   │   │   ├── cli/               # Modified CLI files
│   │   │   │   ├── cli.marie.js
│   │   │   │   └── cli.original.js
│   │   │   ├── templates/         # Marie-specific templates
│   │   │   │   ├── DANCE.md
│   │   │   │   ├── student-profile-template.md
│   │   │   │   ├── class-notes-template.md
│   │   │   │   └── progress-log-template.md
│   │   │   ├── scripts/           # Marie build/transform scripts
│   │   │   │   ├── rebrand-to-marie.sh
│   │   │   │   ├── transform-dance-teacher.sh
│   │   │   │   └── patch-banner.sh
│   │   │   ├── launchers/         # Launch scripts
│   │   │   │   └── marie.sh
│   │   │   ├── docs/              # Marie documentation
│   │   │   │   ├── README.md
│   │   │   │   ├── QUICKSTART.md
│   │   │   │   └── COMPLETE_GUIDE.md
│   │   │   └── tests/             # Marie-specific tests
│   │   │       └── test1-basic/
│   │   │
│   │   └── README.md              # Dance domain overview
│   │
│   ├── education/                  # Future: Education domain
│   │   ├── tutor/                 # Tutoring assistant
│   │   └── README.md
│   │
│   ├── business/                   # Future: Business domain
│   │   ├── consultant/            # Business consultant assistant
│   │   └── README.md
│   │
│   └── README.md                   # Domains overview & guide
│
├── 🏗️ workspaces/                  # User workspaces (already organized)
│   ├── dance/
│   │   └── studio/
│   ├── education/
│   │   └── tutoring/
│   └── README.md
│
├── 🛠️ dev/                          # Development tools (already exists)
│   ├── scripts/
│   └── tools/
│
├── 📚 docs/                         # Centralized documentation
│   ├── getting-started/
│   │   ├── README.md
│   │   └── QUICKSTART.md
│   ├── domains/
│   │   ├── creating-new-domain.md
│   │   └── domain-guidelines.md
│   ├── architecture/
│   │   ├── project-structure.md
│   │   └── workspace-system.md
│   └── README.md
│
├── 🔧 Root files
│   ├── .claude/
│   ├── .github/
│   ├── Makefile                    # Updated with domain targets
│   ├── README.md                   # Main project overview
│   ├── CHANGELOG.md
│   ├── LICENSE.md
│   └── .gitignore                  # Updated patterns
│
└── 🗑️ To Remove/Archive
    ├── test-suite/                 # Move to domains/dance/marie/tests/
    ├── marie.sh                    # Move to domains/dance/marie/launchers/
    ├── agents/                     # Restructure into domains/
    ├── MARIE_*.md                  # Move to domains/dance/marie/docs/
    └── WORKSPACE_RESTRUCTURE.md    # Archive in docs/
```

## Key Benefits

### 1. Clear Separation of Concerns
```
domains/          → Domain customizations
workspaces/       → User workspaces
core/            → Official Claude Code
dev/             → Development tools
docs/            → All documentation
```

### 2. Scalable Domain Architecture
Each domain is self-contained:
```
domains/{domain}/{assistant}/
├── cli/          # CLI modifications
├── templates/    # Behavior templates
├── scripts/      # Build scripts
├── launchers/    # Launch helpers
├── docs/         # Documentation
└── tests/        # Tests
```

### 3. Easy to Add New Domains
```bash
# Create new domain
mkdir -p domains/education/tutor/{cli,templates,scripts,launchers,docs,tests}
cp domains/_template/* domains/education/tutor/
```

### 4. Better Developer Experience

#### Finding Things
- ✅ All Marie stuff: `domains/dance/marie/`
- ✅ All documentation: `docs/`
- ✅ User workspaces: `workspaces/`
- ✅ Development tools: `dev/`

#### Working on a Domain
```bash
cd domains/dance/marie
./scripts/build.sh
./launchers/marie.sh
```

#### Creating a Workspace
```bash
make create-workspace domain=education project=tutoring
# Creates: workspaces/education/tutoring/
```

## Migration Plan

### Phase 1: Restructure domains/
```bash
# 1. Create structure
mkdir -p domains/dance/marie/{cli,templates,scripts,launchers,docs,tests}

# 2. Move files
mv agents/cli.* domains/dance/marie/cli/
mv agents/templates/* domains/dance/marie/templates/
mv agents/*.sh domains/dance/marie/scripts/
mv marie.sh domains/dance/marie/launchers/
mv test-suite/test1-basic domains/dance/marie/tests/

# 3. Move documentation
mv MARIE_*.md domains/dance/marie/docs/
mv REBRANDING_*.md domains/dance/marie/docs/
```

### Phase 2: Update Makefile
```makefile
# Domain paths
MARIE_ROOT = domains/dance/marie
MARIE_CLI = $(MARIE_ROOT)/cli
MARIE_TEMPLATES = $(MARIE_ROOT)/templates
MARIE_LAUNCHER = $(MARIE_ROOT)/launchers/marie.sh

# Workspace paths (already done)
WORKSPACE_ROOT = workspaces
DANCE_WORKSPACE = $(WORKSPACE_ROOT)/dance/studio

# Targets
marie:
	@cd $(DANCE_WORKSPACE) && $(MARIE_LAUNCHER)

create-domain:
	@./scripts/create-domain.sh $(domain) $(assistant)
```

### Phase 3: Update Documentation
- Consolidate all docs in `docs/`
- Create domain-specific READMEs
- Update all path references

### Phase 4: Clean Up
- Remove old directories
- Archive old .md files
- Update .gitignore

## Updated Makefile Structure

```makefile
# Domain Configuration
MARIE_DOMAIN = domains/dance/marie
TUTOR_DOMAIN = domains/education/tutor

# Workspace Configuration
WORKSPACE_ROOT = workspaces

# === Marie (Dance Teacher) ===
marie-build:
	@cd $(MARIE_DOMAIN) && ./scripts/build.sh

marie:
	@cd $(WORKSPACE_ROOT)/dance/studio && \
		$(MARIE_DOMAIN)/launchers/marie.sh

marie-test:
	@cd $(MARIE_DOMAIN)/tests && ./run-tests.sh

# === Tutor (Education) ===
tutor-build:
	@cd $(TUTOR_DOMAIN) && ./scripts/build.sh

tutor:
	@cd $(WORKSPACE_ROOT)/education/tutoring && \
		$(TUTOR_DOMAIN)/launchers/tutor.sh

# === Utilities ===
create-domain:
	@./dev/scripts/create-domain.sh $(name)

list-domains:
	@ls -1 domains/

# === Workspaces ===
create-workspace:
	@./dev/scripts/create-workspace.sh $(domain) $(project)

list-workspaces:
	@find workspaces -name "CLAUDE.md" -exec dirname {} \;
```

## File Relocation Table

| Current Path | New Path |
|-------------|----------|
| `agents/cli.*.js` | `domains/dance/marie/cli/*.js` |
| `agents/templates/` | `domains/dance/marie/templates/` |
| `agents/*.sh` | `domains/dance/marie/scripts/` |
| `marie.sh` | `domains/dance/marie/launchers/marie.sh` |
| `test-suite/test1-basic/` | `domains/dance/marie/tests/test1-basic/` |
| `MARIE_*.md` | `domains/dance/marie/docs/` |
| `workspaces/` | (unchanged) |

## New Developer Workflows

### Starting with Marie
```bash
# 1. Clone repo
git clone <repo>

# 2. See available domains
make list-domains
# Output: dance, education, business

# 3. Build Marie
make marie-build

# 4. Create workspace
make create-workspace domain=dance project=studio

# 5. Launch
make marie
```

### Creating New Domain
```bash
# 1. Create domain structure
make create-domain name=business/consultant

# 2. Copy templates
cp domains/_template/README.md domains/business/consultant/

# 3. Implement
cd domains/business/consultant
# Edit templates, scripts, etc.

# 4. Add to Makefile
# Add consultant-build, consultant targets

# 5. Test
make consultant-build
make consultant
```

## .gitignore Updates

```gitignore
# Claude Code official (keep)
# (existing patterns)

# Domains - keep structure, ignore builds
domains/*/cli/*.js
!domains/**/cli.original.js

# Workspaces - ignore user content
workspaces/*/*/
!workspaces/README.md
!workspaces/**/README.md

# Development
dev/tmp/
*.log
```

## Documentation Structure

```
docs/
├── README.md                       # Documentation index
├── getting-started/
│   ├── installation.md
│   ├── quickstart.md
│   └── first-domain.md
├── domains/
│   ├── creating-domain.md
│   ├── domain-guidelines.md
│   ├── template-system.md
│   └── launcher-scripts.md
├── workspaces/
│   ├── workspace-system.md
│   ├── claudemd-configuration.md
│   └── multi-workspace.md
├── architecture/
│   ├── project-structure.md
│   ├── makefile-system.md
│   └── build-pipeline.md
└── reference/
    ├── makefile-targets.md
    ├── domain-api.md
    └── troubleshooting.md
```

## Next Steps

1. **Review** this proposal
2. **Approve** the structure
3. **Execute** migration script
4. **Update** Makefile
5. **Test** Marie with new structure
6. **Document** the changes
7. **Create** domain template

Would you like me to:
- A) Execute this restructure immediately
- B) Create a migration script first
- C) Modify the proposal
- D) Start with just the domains/ restructure

