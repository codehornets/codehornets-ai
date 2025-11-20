# Codebase Audit: Duplication & Organizational Issues

**Date**: 2025-11-19
**Status**: 🔴 Critical organizational debt identified
**Impact**: Maintenance burden, confusion, wasted storage

---

## 🔴 Critical Issues Found

### 1. **Docker Files Duplication** (CRITICAL)

**Problem**: Two nearly identical docker-compose files with 95% duplicate code.

```
core/docker-compose.yml                  # 103 lines - polling mode
core/docker-compose-activated.yml        # 206 lines - event-driven mode
```

**Duplication**:
- 3 worker services (marie, anga, fabien) duplicated
- 1 orchestrator service duplicated
- Only differences: activation wrapper command, environment vars, Redis service

**Impact**:
- ❌ 200+ lines of duplicate code
- ❌ Changes must be made in 2 places
- ❌ High risk of divergence
- ❌ Confusing for contributors

**Fix**: Consolidate into ONE file using Docker Compose profiles or environment variables.

---

### 2. **Infrastructure Scattered Across Directories** (HIGH)

**Problem**: Infrastructure code split between `core/` and `infrastructure/`.

```
core/
├── docker-compose.yml          ❌ Should be in infrastructure/
├── docker-compose-activated.yml ❌ Should be in infrastructure/
├── prompts/                    ❌ Should be in infrastructure/
├── output-styles/              ❌ Should be in infrastructure/
├── shared/                     ❌ Should be in infrastructure/
├── memory-system/              ❌ Should be in infrastructure/
└── vendor/                     ❌ 3rd party binaries

infrastructure/
├── docker/
│   ├── docker-compose.yml      ⚠️ Different project (handymate)
│   └── docker-compose.unified.yml
├── kubernetes/
├── terraform/
└── ...
```

**Issues**:
- ✗ `core/` contains infrastructure (docker, prompts, runtime data)
- ✗ `infrastructure/docker/docker-compose.yml` is for a DIFFERENT project (handymate)
- ✗ No clear separation of concerns
- ✗ 84MB in `core/` directory

**Expected Structure**:
```
infrastructure/
└── docker/
    └── codehornets-ai/          # Our project
        ├── docker-compose.yml   # Consolidated
        ├── prompts/
        ├── output-styles/
        └── shared/
```

---

### 3. **Shell Scripts Scattered at Root** (MEDIUM)

**Problem**: 4 utility scripts at project root instead of `tools/` or `scripts/`.

```
./ (root)
├── send-task-to-marie.sh           ❌ Should be in tools/
├── auto-configure-agents.sh        ❌ Should be in tools/
├── setup-workers-interactive.sh    ❌ Should be in tools/
└── save-agent-work.sh              ❌ Should be in tools/

tools/
├── activation_wrapper.py           ✅ Correct location
└── test_activation.sh              ✅ Correct location
```

**Impact**:
- Clutters root directory
- Inconsistent organization (some in tools/, some at root)
- Harder to find utilities

---

### 4. **Prompts in Multiple Locations** (MEDIUM)

**Problem**: Agent prompts scattered across 3 different directories.

**Found**:
- `core/prompts/agents/` - 7 prompt files (Marie, Anga, Fabien, Effenco agents)
- `core/prompts/domains/` - 3 domain files (CODING, DANCE, MARKETING)
- `libs/digital-agency/agents/*/prompts/` - 24+ prompt files

**Count**:
```bash
$ find . -name "*.md" -path "*/prompts/*" | wc -l
24
```

**Questions**:
- Are `libs/digital-agency` prompts used? (125MB in libs/)
- Why are prompts in both `core/` and `libs/`?
- Which are active vs archived?

**Recommendation**: Centralize active prompts in ONE location.

---

### 5. **Apps Directory Purpose Unclear** (LOW)

**Problem**: `apps/` contains 6 full applications. Are these used?

```
apps/
├── claude-code-ui          # Frontend for Claude Code?
├── kurrier                 # Unknown
├── nocodb                  # Database UI
├── opcode                  # Unknown
├── super-productivity      # Productivity app
└── trendradar              # Unknown
```

**Questions**:
- Are these actively used or archived?
- Do they belong in this repo or separate repos?
- Are they dependencies or standalone projects?

**Impact**: Clutters repository, unclear dependencies.

---

### 6. **Libs Directory Size** (LOW)

**Problem**: 125MB in `libs/`, unclear if all are used.

```
libs/ (125MB)
├── agents-main/
├── claude-task-master/     # Used (MCP integration)
├── cocoindex/              # Unknown usage
├── code-mode/
├── deepwiki/               # Unknown usage
├── digital-agency/         # Contains duplicate prompts
├── dlt/                    # Unknown usage
├── scrapegraphai/          # Unknown usage
└── vibe-log-cli/
```

**Questions**:
- Which libs are actually imported/used?
- Can unused libs be removed or archived?
- Are these dependencies or development tools?

---

### 7. **Claude Cleanup Scripts Duplication** (LOW)

**Problem**: 4 nearly identical cleanup scripts in `.claude/`.

```
.claude/
├── cleanup-agents.sh                    #
├── cleanup-agents-aggressive.sh         # Similar
├── cleanup-agents-minimal.sh            # Similar
├── cleanup-agents-ultra-minimal.sh      # Similar
```

**Fix**: Consolidate into ONE script with flags:
```bash
cleanup-agents.sh --level [minimal|normal|aggressive|ultra]
```

---

### 8. **Infrastructure Docker Confusion** (HIGH)

**Problem**: `infrastructure/docker/docker-compose.yml` is for a DIFFERENT project.

```yaml
# infrastructure/docker/docker-compose.yml
name: handymate  # ❌ Not codehornets-ai!

services:
  developer:
    container_name: handymate-developer
    # ...
```

**This is confusing**:
- File is in `codehornets-ai` repo
- But configures `handymate` project
- Suggests copy-paste from another project

**Fix**: Remove or move to separate repo.

---

## 📊 Summary Statistics

| Issue | Severity | Lines Duplicated | Files Affected |
|-------|----------|------------------|----------------|
| Docker compose duplication | 🔴 Critical | 200+ lines | 2 files |
| Infrastructure scattered | 🔴 High | N/A | 15+ files |
| Prompts in multiple locations | 🟡 Medium | N/A | 24+ files |
| Scripts at root | 🟡 Medium | N/A | 4 files |
| Infrastructure/docker confusion | 🔴 High | N/A | 3 files |
| Cleanup scripts duplication | 🟢 Low | 50+ lines | 4 files |
| Apps directory unclear | 🟢 Low | N/A | 6 directories |
| Libs directory bloat | 🟢 Low | N/A | 125MB |

**Total Duplicate/Scattered Code**: ~300+ lines
**Total Misplaced Files**: ~40+ files
**Storage Wasted**: ~125MB+ (if unused libs)

---

## ✅ Proposed Fixes (Priority Order)

### Phase 1: Critical Infrastructure Cleanup

**1.1 Consolidate Docker Files** (2 hours)
```bash
# Before
core/docker-compose.yml
core/docker-compose-activated.yml

# After
infrastructure/docker/codehornets-ai/docker-compose.yml
infrastructure/docker/codehornets-ai/.env.example
```

**1.2 Move Infrastructure to Proper Location** (1 hour)
```bash
# Move everything from core/ to infrastructure/
mv core/docker-compose*.yml infrastructure/docker/codehornets-ai/
mv core/prompts infrastructure/docker/codehornets-ai/
mv core/output-styles infrastructure/docker/codehornets-ai/
mv core/shared infrastructure/docker/codehornets-ai/
```

**1.3 Remove/Separate Handymate Config** (30 min)
```bash
# Remove or move to separate repo
rm infrastructure/docker/docker-compose.yml
# OR
mv infrastructure/docker/docker-compose.yml ../handymate/
```

### Phase 2: Scripts Organization

**2.1 Move Scripts to tools/** (30 min)
```bash
mv send-task-to-marie.sh tools/
mv auto-configure-agents.sh tools/
mv setup-workers-interactive.sh tools/
mv save-agent-work.sh tools/
```

**2.2 Consolidate Cleanup Scripts** (1 hour)
```bash
# Merge 4 cleanup scripts into one with flags
tools/cleanup-agents.sh --level [minimal|normal|aggressive|ultra]
```

### Phase 3: Prompts & Config Cleanup

**3.1 Centralize Active Prompts** (2 hours)
- Audit which prompts are actually used
- Move active prompts to `infrastructure/docker/codehornets-ai/prompts/`
- Archive unused prompts or delete

**3.2 Review libs/** (1 hour)
- Identify which libs are actually imported
- Remove or archive unused libraries
- Document remaining dependencies

### Phase 4: Documentation

**4.1 Update Makefile** (1 hour)
- Update all paths to reference new structure
- Add comments explaining organization

**4.2 Update README** (30 min)
- Document new directory structure
- Explain where everything is

---

## 🎯 Expected Benefits After Cleanup

✅ **-200+ lines of duplicate code removed**
✅ **Clear separation of concerns** (infrastructure vs source vs tools)
✅ **Single source of truth** for Docker configuration
✅ **Easier onboarding** - clear, logical structure
✅ **Lower maintenance burden** - change once, not twice
✅ **Smaller repo size** - remove unused deps
✅ **Faster builds** - less to scan/copy

---

## 🚀 Next Steps

1. **Review this audit** with team
2. **Prioritize fixes** (start with Phase 1)
3. **Create backup branch** before refactoring
4. **Execute refactor** phase by phase
5. **Update documentation** as changes are made
6. **Test thoroughly** after each phase

---

## 📝 Questions to Answer

1. **What is the purpose of `apps/` directory?** Are these active projects or archived?
2. **Which `libs/` are actually used?** Can we remove unused ones?
3. **Why is `handymate` config in `codehornets-ai` repo?** Should it be separate?
4. **Are `libs/digital-agency` prompts used?** Or just archived examples?
5. **What should stay in `core/`?** (Just core application logic?)

---

**Priority**: Start with Phase 1 (Critical Infrastructure Cleanup) ASAP.
**Estimated Total Time**: 8-10 hours
**Risk**: Low (if backed up properly)
**Impact**: High (significantly improves maintainability)
