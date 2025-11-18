# Domains

This directory contains domain-specific customizations for Claude Code.

## Structure

Each domain contains specialized assistants built using the CLAUDE.md customization approach:

```
domains/
├── dance/           # Dance teaching domain
│   └── marie/       # Marie dance teacher assistant
├── education/       # Education domain (ready to add)
├── business/        # Business domain (ready to add)
└── README.md
```

## Available Domains

### 🩰 Dance
**Marie** - Dance teacher assistant for student tracking, class documentation, and studio management.

- Launch: `make marie`
- Docs: [dance/marie/README.md](dance/marie/README.md)

### 💻 Coding
**Anga** - Coding assistant for code quality, architecture, debugging, and best practices.

- Launch: `make anga`
- Docs: [coding/anga/README.md](coding/anga/README.md)

### 📈 Marketing
**Fabien** - Marketing assistant for content strategy, campaigns, social media, and growth.

- Launch: `make fabien`
- Docs: [marketing/fabien/README.md](marketing/fabien/README.md)

### 📚 Education (Coming Soon)
Tutoring and teaching assistants for various subjects.

### 💼 Business (Coming Soon)
Business consultant and analyst assistants.

## Creating a New Domain

### Option 1: Quick Start
```bash
mkdir -p domains/{domain}/{assistant}/{templates,launchers,docs,tests}
```

### Option 2: Using Helper
```bash
make create-domain domain=education/tutor
```

### Required Structure
```
domains/{domain}/{assistant}/
├── templates/           # REQUIRED
│   └── BEHAVIOR.md     # Defines assistant personality (like DANCE.md)
├── launchers/          # REQUIRED
│   └── {assistant}.sh  # Launch script
├── docs/               # Recommended
│   └── README.md
└── tests/              # Recommended
    └── test1-basic/
```

## Domain Guidelines

### 1. Use CLAUDE.md Approach
All assistants should use the CLAUDE.md customization method:

```markdown
# In templates/BEHAVIOR.md:
You are Claude Code, Anthropic's official CLI for Claude.

**Primary Role**: Introduce yourself as {AssistantName}...
```

**Why:**
- ✅ Official, supported method
- ✅ No authentication issues
- ✅ Survives Claude Code updates
- ✅ Simple and maintainable

### 2. Keep It Lightweight
Don't modify CLI files. Only need:
- Templates (behavior + user templates)
- Launcher script
- Documentation

**Total size should be <100KB per assistant**

### 3. Self-Contained
Each assistant should be independent:
- Own templates
- Own launcher
- Own docs
- Own tests

### 4. Clear Documentation
Each assistant needs:
- README.md explaining what it does
- Quick start instructions
- Template documentation

## Example: Creating Tutor Assistant

```bash
# 1. Create structure
mkdir -p domains/education/tutor/{templates,launchers,docs,tests}

# 2. Create behavior template
cat > domains/education/tutor/templates/TUTOR.md << 'EOF'
You are Claude Code, Anthropic's official CLI for Claude.

**Primary Role**: Introduce yourself as Alex, a specialized tutoring assistant...
EOF

# 3. Create launcher
cat > domains/education/tutor/launchers/tutor.sh << 'EOF'
#!/bin/bash
if [ ! -f "CLAUDE.md" ]; then
    cp ../../../domains/education/tutor/templates/TUTOR.md ./CLAUDE.md
fi
claude "$@"
EOF
chmod +x domains/education/tutor/launchers/tutor.sh

# 4. Add to Makefile
# Add tutor target following marie pattern

# 5. Test
make create-workspace domain=education project=tutoring
make tutor
```

## Best Practices

### Templates
- Keep BEHAVIOR.md focused and clear
- Include session startup instructions
- Define clear personality and role
- Preserve Claude Code identity for auth

### Launchers
- Keep it simple - just ensure CLAUDE.md exists
- Search up directory tree for templates
- Launch Claude Code with args
- No complex logic needed

### Documentation
- Clear README for each assistant
- Quick start guide
- Feature list
- Example usage

### Testing
- Include basic smoke test
- Test CLAUDE.md is read correctly
- Test assistant introduces properly

## Current Domains

| Domain | Assistants | Status | Launch Command |
|--------|-----------|--------|----------------|
| **Dance** | Marie | ✅ Active | `make marie` |
| **Education** | - | 📋 Planned | - |
| **Business** | - | 📋 Planned | - |

## See Also

- [Workspace system](../workspaces/README.md)
- [Makefile targets](../Makefile)
- [CLAUDE.md specification](https://docs.anthropic.com/claude-code)
