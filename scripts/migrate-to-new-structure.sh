#!/bin/bash

# Migration Script: Restructure to Domain-Based Architecture
# This script migrates the current structure to the new scalable domain-based structure

set -e  # Exit on error

echo "🔄 Starting project restructure migration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup first
echo "📦 Creating backup..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r agents "$BACKUP_DIR/" 2>/dev/null || true
cp marie.sh "$BACKUP_DIR/" 2>/dev/null || true
cp -r test-suite "$BACKUP_DIR/" 2>/dev/null || true
cp MARIE*.md "$BACKUP_DIR/" 2>/dev/null || true
cp REBRANDING*.md "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/${NC}"
echo ""

# Phase 1: Create new structure
echo "🏗️  Phase 1: Creating new directory structure..."

# Create domains structure
mkdir -p domains/dance/marie/{cli,templates,scripts,launchers,docs,tests}
mkdir -p domains/education
mkdir -p domains/business
mkdir -p domains/_template/{cli,templates,scripts,launchers,docs,tests}

echo -e "${GREEN}✅ Created domains/ structure${NC}"

# Create docs structure
mkdir -p docs/{getting-started,domains,workspaces,architecture,reference}
echo -e "${GREEN}✅ Created docs/ structure${NC}"

# Create dev structure (if not exists)
mkdir -p dev/{scripts,tools,tmp}
echo -e "${GREEN}✅ Created dev/ structure${NC}"

echo ""

# Phase 2: Move files
echo "📁 Phase 2: Moving files to new locations..."

# Move Marie CLI files
if [ -d "agents" ]; then
    echo "  → Moving CLI files..."
    cp agents/cli.*.js domains/dance/marie/cli/ 2>/dev/null || true

    # Move templates
    echo "  → Moving templates..."
    cp -r agents/templates/* domains/dance/marie/templates/ 2>/dev/null || true

    # Move scripts
    echo "  → Moving scripts..."
    cp agents/*.sh domains/dance/marie/scripts/ 2>/dev/null || true

    # Move README
    cp agents/README.md domains/dance/marie/docs/ 2>/dev/null || true

    echo -e "${GREEN}✅ Moved agents/ content${NC}"
fi

# Move marie.sh launcher
if [ -f "marie.sh" ]; then
    echo "  → Moving marie.sh launcher..."
    cp marie.sh domains/dance/marie/launchers/
    chmod +x domains/dance/marie/launchers/marie.sh
    echo -e "${GREEN}✅ Moved marie.sh${NC}"
fi

# Move test suite
if [ -d "test-suite" ]; then
    echo "  → Moving test suite..."
    cp -r test-suite/* domains/dance/marie/tests/ 2>/dev/null || true
    echo -e "${GREEN}✅ Moved test-suite/${NC}"
fi

# Move Marie documentation
echo "  → Moving Marie documentation..."
cp MARIE*.md domains/dance/marie/docs/ 2>/dev/null || true
cp REBRANDING*.md domains/dance/marie/docs/ 2>/dev/null || true
cp WORKSPACE*.md domains/dance/marie/docs/ 2>/dev/null || true
echo -e "${GREEN}✅ Moved documentation${NC}"

echo ""

# Phase 3: Create README files
echo "📝 Phase 3: Creating README files..."

# domains/README.md
cat > domains/README.md << 'EOF'
# Domains

This directory contains domain-specific customizations for Claude Code.

## Structure

Each domain contains specialized assistants:

```
domains/
├── dance/           # Dance teaching domain
│   └── marie/       # Marie dance teacher assistant
├── education/       # Education domain
│   └── tutor/       # Tutoring assistant (coming soon)
└── business/        # Business domain
    └── consultant/  # Business consultant (coming soon)
```

## Available Domains

### 🩰 Dance
**Marie** - Dance teacher assistant for student tracking, class documentation, and studio management.

- Launch: `make marie`
- Docs: `domains/dance/marie/docs/`

### 📚 Education (Coming Soon)
Tutoring assistant for student progress tracking and lesson planning.

### 💼 Business (Coming Soon)
Business consultant assistant for strategy and analysis.

## Creating a New Domain

See `docs/domains/creating-domain.md` for instructions.
EOF

# domains/dance/README.md
cat > domains/dance/README.md << 'EOF'
# Dance Domain

Domain-specific customizations for dance teaching and studio management.

## Assistants

### Marie - Dance Teacher Assistant

A specialized AI assistant for dance teachers and studio owners.

**Features:**
- Student progress tracking
- Class documentation
- Choreography organization
- Recital planning
- Parent communications

**Quick Start:**
```bash
make marie
```

**Documentation:**
- [Quick Start](marie/docs/MARIE_QUICKSTART.md)
- [Complete Guide](marie/docs/MARIE_FINAL.md)
- [Rebranding Guide](marie/docs/REBRANDING_COMPLETE.md)
EOF

# domains/dance/marie/README.md
cat > domains/dance/marie/README.md << 'EOF'
# Marie - Dance Teacher Assistant

Marie is a specialized AI assistant for dance teachers and studio owners, built on Claude Code.

## Directory Structure

```
marie/
├── cli/           # Modified CLI files
├── templates/     # Behavior templates and student tracking
├── scripts/       # Build and transformation scripts
├── launchers/     # Launch scripts
├── docs/         # Documentation
└── tests/        # Test suite
```

## Quick Start

```bash
# Build Marie
make marie-build

# Launch Marie
make marie
```

## Files

### CLI Files (`cli/`)
- `cli.original.js` - Original Claude Code CLI
- `cli.readable.js` - Beautified version
- `cli.marie.js` - Marie customized version

### Templates (`templates/`)
- `DANCE.md` - Marie behavior configuration
- `student-profile-template.md` - Student tracking template
- `class-notes-template.md` - Class documentation template
- `progress-log-template.md` - Progress tracking template

### Scripts (`scripts/`)
- `transform-dance-teacher.sh` - Build Marie CLI
- `rebrand-to-marie.sh` - Visual rebranding
- `patch-banner.sh` - Banner customization

### Launchers (`launchers/`)
- `marie.sh` - Main launcher script

## Documentation

See `docs/` directory for complete documentation.
EOF

# domains/_template/README.md
cat > domains/_template/README.md << 'EOF'
# Domain Template

Use this template to create new domains.

## Steps to Create New Domain

1. Copy this template:
```bash
cp -r domains/_template domains/{domain-name}/{assistant-name}
```

2. Update files:
   - Edit `templates/BEHAVIOR.md` with assistant behavior
   - Create launcher script in `launchers/`
   - Add build scripts in `scripts/`

3. Add to Makefile:
```makefile
{ASSISTANT}_DOMAIN = domains/{domain}/{assistant}

{assistant}:
	@cd workspaces/{domain}/{project} && \
		$({ASSISTANT}_DOMAIN)/launchers/{assistant}.sh
```

4. Create workspace:
```bash
make create-workspace domain={domain} project={project}
```

5. Test:
```bash
make {assistant}
```
EOF

echo -e "${GREEN}✅ Created README files${NC}"
echo ""

# Phase 4: Update Makefile path references
echo "📝 Phase 4: Updating Makefile..."

# Backup Makefile
cp Makefile Makefile.backup

# Update paths in Makefile
sed -i 's|agent-mod/templates|domains/dance/marie/templates|g' Makefile
sed -i 's|agents/templates|domains/dance/marie/templates|g' Makefile

echo -e "${GREEN}✅ Updated Makefile${NC}"
echo ""

# Phase 5: Update marie.sh launcher paths
echo "📝 Phase 5: Updating launcher paths..."

# Update marie.sh to use new structure
cat > domains/dance/marie/launchers/marie.sh << 'EOFLAUNCH'
#!/bin/bash

# 🩰 Marie - Dance Teacher Assistant Launcher
# Ensures CLAUDE.md exists and launches Claude Code

# Check if in dance studio workspace
if [ ! -f "CLAUDE.md" ]; then
    echo "⚠️  Setting up Marie for the first time..."

    # Find the template file (search up directory tree)
    TEMPLATE=""
    SEARCH_DIR="$PWD"
    for i in {1..5}; do
        if [ -f "$SEARCH_DIR/domains/dance/marie/templates/DANCE.md" ]; then
            TEMPLATE="$SEARCH_DIR/domains/dance/marie/templates/DANCE.md"
            break
        fi
        SEARCH_DIR="$SEARCH_DIR/.."
    done

    if [ -n "$TEMPLATE" ]; then
        cp "$TEMPLATE" ./CLAUDE.md
        echo "✅ Marie configured (CLAUDE.md created)"
        echo ""
    else
        echo "❌ Error: DANCE.md template not found!"
        echo "Please ensure you're in the project root or a workspace"
        exit 1
    fi
fi

# Launch Claude Code
claude "$@"
EOFLAUNCH

chmod +x domains/dance/marie/launchers/marie.sh

echo -e "${GREEN}✅ Updated launcher paths${NC}"
echo ""

# Phase 6: Create helper scripts
echo "🛠️  Phase 6: Creating helper scripts..."

# Create domain creation script
cat > dev/scripts/create-domain.sh << 'EOFSCRIPT'
#!/bin/bash

# Create a new domain from template

if [ -z "$1" ]; then
    echo "Usage: ./create-domain.sh {domain}/{assistant}"
    echo "Example: ./create-domain.sh education/tutor"
    exit 1
fi

DOMAIN_PATH="$1"
FULL_PATH="domains/$DOMAIN_PATH"

echo "Creating new domain: $DOMAIN_PATH"

# Copy template
cp -r domains/_template "$FULL_PATH"

echo "✅ Created: $FULL_PATH"
echo ""
echo "Next steps:"
echo "1. Edit $FULL_PATH/templates/BEHAVIOR.md"
echo "2. Create launcher in $FULL_PATH/launchers/"
echo "3. Add Makefile target"
echo "4. Create workspace: make create-workspace domain=... project=..."
EOFSCRIPT

chmod +x dev/scripts/create-domain.sh

# Create workspace creation script
cat > dev/scripts/create-workspace.sh << 'EOFSCRIPT'
#!/bin/bash

# Create a new workspace

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./create-workspace.sh {domain} {project}"
    echo "Example: ./create-workspace.sh dance studio"
    exit 1
fi

DOMAIN="$1"
PROJECT="$2"
WORKSPACE_PATH="workspaces/$DOMAIN/$PROJECT"

echo "Creating workspace: $WORKSPACE_PATH"

mkdir -p "$WORKSPACE_PATH"

echo "✅ Created: $WORKSPACE_PATH"
echo ""
echo "Next steps:"
echo "1. Add CLAUDE.md configuration"
echo "2. Launch with: make {assistant}"
EOFSCRIPT

chmod +x dev/scripts/create-workspace.sh

echo -e "${GREEN}✅ Created helper scripts${NC}"
echo ""

# Phase 7: Summary
echo "✨ Migration Complete!"
echo ""
echo -e "${YELLOW}📊 Summary:${NC}"
echo "  ✅ Created domains/ structure"
echo "  ✅ Moved Marie files to domains/dance/marie/"
echo "  ✅ Created documentation structure"
echo "  ✅ Updated Makefile paths"
echo "  ✅ Created helper scripts"
echo "  ✅ Backup saved to: $BACKUP_DIR/"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Review the new structure: ls -la domains/"
echo "  2. Update Makefile with new targets (see RESTRUCTURE_PROPOSAL.md)"
echo "  3. Test Marie: make marie"
echo "  4. Archive old files: mv agents/ $BACKUP_DIR/"
echo ""
echo -e "${YELLOW}🗑️  Old Files (safe to remove after testing):${NC}"
echo "  - agents/"
echo "  - marie.sh (root)"
echo "  - test-suite/"
echo "  - MARIE*.md (root)"
echo "  - REBRANDING*.md (root)"
echo ""
echo "Migration script complete! 🎉"
