# Marie Migration Guide

## Overview

This guide provides step-by-step instructions for upgrading existing Marie instances to the enhanced version with orchestration support, knowledge base integration, and performance optimizations.

## Table of Contents

- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Paths](#migration-paths)
- [Step-by-Step Migration](#step-by-step-migration)
- [Verification](#verification)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Pre-Migration Checklist

### System Requirements

Before migrating, ensure you have:

- [ ] **Docker 20.10+** installed
- [ ] **Docker Compose 2.0+** installed
- [ ] **4GB RAM** available (8GB recommended)
- [ ] **10GB disk space** available
- [ ] **Git** installed for version control
- [ ] **Backup** of existing workspace data

### Data Backup

**CRITICAL**: Back up all existing data before migration!

```bash
# Create backup directory
mkdir -p ~/marie-backup-$(date +%Y%m%d)

# Backup existing workspace
cp -r workspaces/dance ~/marie-backup-$(date +%Y%m%d)/workspace-backup

# Backup existing configuration
cp -r .claude ~/marie-backup-$(date +%Y%m%d)/claude-config-backup

# Backup any custom files
cp CLAUDE.md ~/marie-backup-$(date +%Y%m%d)/CLAUDE.md.backup

# Verify backup
ls -la ~/marie-backup-$(date +%Y%m%d)/
```

### Version Check

Determine your current Marie version:

```bash
# Check for existing Marie configuration
if [ -f "CLAUDE.md" ]; then
  echo "Marie configuration found"
  grep -i "marie" CLAUDE.md | head -5
else
  echo "No Marie configuration found (new installation)"
fi

# Check for Docker setup
if [ -f "docker-compose.yml" ]; then
  echo "Docker Compose found"
  grep -A 5 "marie:" docker-compose.yml
else
  echo "No Docker setup (standalone mode)"
fi
```

## Migration Paths

### Path A: Fresh Installation

**Best for**: New Marie users or complete rebuild

**Duration**: 15-30 minutes

**Steps**:
1. Clone CodeHornets-AI repository
2. Configure knowledge base
3. Setup Docker environment
4. Initialize workspace
5. Test functionality

### Path B: Standalone to Orchestrated

**Best for**: Existing standalone Marie upgrading to orchestrated mode

**Duration**: 30-45 minutes

**Steps**:
1. Backup existing data
2. Update repository
3. Migrate workspace structure
4. Configure Docker Compose
5. Populate knowledge base
6. Migrate existing evaluations
7. Test orchestrated mode

### Path C: Configuration Update Only

**Best for**: Existing Marie with working setup, only updating configs

**Duration**: 10-15 minutes

**Steps**:
1. Backup configuration
2. Update CLAUDE.md
3. Update output styles
4. Optimize workspace
5. Test functionality

## Step-by-Step Migration

### Path A: Fresh Installation

#### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/codehornets-ai.git
cd codehornets-ai

# Verify structure
ls -la core/
ls -la workspaces/
```

#### Step 2: Configure Knowledge Base

```bash
# Create knowledge base directory
mkdir -p data/knowledgehub/domain/dance/marie/markdown/students-reviews
mkdir -p data/knowledgehub/domain/dance/marie/pdfs/students-notes

# Add example evaluations (if you have them)
# Copy 2-3 high-quality evaluations to:
cp ~/my-evaluations/*.md data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Or use placeholder examples
echo "# Example Student Evaluation" > data/knowledgehub/domain/dance/marie/markdown/students-reviews/example.md
```

#### Step 3: Setup Docker Environment

```bash
# Navigate to core directory
cd core

# Verify docker-compose.yml
cat docker-compose.yml | grep -A 20 "marie:"

# Create required directories
mkdir -p shared/tasks/marie
mkdir -p shared/results/marie
mkdir -p shared/auth-homes/marie
mkdir -p shared/workspaces/marie

# Set permissions
chmod 755 shared/tasks/marie
chmod 755 shared/results/marie
chmod 700 shared/auth-homes/marie
```

#### Step 4: Initialize Workspace

```bash
# Use Makefile to create workspace (if available)
make marie

# Or manually create workspace
mkdir -p ../workspaces/dance/studio
cp prompts/domains/DANCE.md ../workspaces/dance/studio/CLAUDE.md
mkdir -p ../workspaces/dance/studio/evaluations/{formal,quick-notes,batch,archive}
mkdir -p ../workspaces/dance/studio/students
mkdir -p ../workspaces/dance/studio/class-notes
mkdir -p ../workspaces/dance/studio/choreography

# Create optimization files
mkdir -p ../workspaces/dance/studio/.claude/agents
echo '{"agentConfig": {"enabled": false}}' > ../workspaces/dance/studio/.claude/settings.json
```

#### Step 5: Start Marie

```bash
# Start Marie container
docker compose up marie -d

# Check logs
docker logs marie

# Wait for authentication
# Open browser to authenticate when prompted

# Verify container is running
docker ps | grep marie
```

#### Step 6: Test Functionality

```bash
# Submit test task
./send-task-to-marie.sh "Create a test evaluation for TestStudent"

# Wait for result (30-60 seconds)
sleep 60

# Check result
ls -la shared/results/marie/

# Check workspace
ls -la ../workspaces/dance/studio/evaluations/formal/
```

### Path B: Standalone to Orchestrated

#### Step 1: Backup Existing Data

```bash
# Already covered in Pre-Migration Checklist
# Verify backup exists
ls -la ~/marie-backup-$(date +%Y%m%d)/
```

#### Step 2: Update Repository

```bash
# Fetch latest changes
git fetch origin

# Check for breaking changes
git log --oneline origin/main ^HEAD

# Merge or rebase
git pull origin main

# Resolve conflicts if any
git status
```

#### Step 3: Migrate Workspace Structure

```bash
# Create new directory structure
mkdir -p workspaces/dance/studio/evaluations/{formal,quick-notes,batch,archive}
mkdir -p workspaces/dance/studio/students
mkdir -p workspaces/dance/studio/class-notes
mkdir -p workspaces/dance/studio/choreography

# Move existing evaluations
if [ -d "old-workspace/evaluations" ]; then
  # Identify evaluation types and move to appropriate directories
  for file in old-workspace/evaluations/*.md; do
    if grep -q "Score Total" "$file"; then
      # Formal evaluation
      cp "$file" workspaces/dance/studio/evaluations/formal/
    else
      # Quick note
      cp "$file" workspaces/dance/studio/evaluations/quick-notes/
    fi
  done
fi

# Move student files
if [ -d "old-workspace/students" ]; then
  cp -r old-workspace/students/* workspaces/dance/studio/students/
fi

# Verify migration
tree workspaces/dance/studio/
```

#### Step 4: Configure Docker Compose

```bash
# Navigate to core directory
cd core

# Verify docker-compose.yml has marie service
grep -A 30 "marie:" docker-compose.yml

# Create shared directories
mkdir -p shared/tasks/marie
mkdir -p shared/results/marie
mkdir -p shared/auth-homes/marie

# Copy existing authentication if available
if [ -d "$HOME/.claude" ]; then
  cp -r $HOME/.claude/* shared/auth-homes/marie/
fi
```

#### Step 5: Populate Knowledge Base

```bash
# Create knowledge base structure
mkdir -p data/knowledgehub/domain/dance/marie/markdown/students-reviews
mkdir -p data/knowledgehub/domain/dance/marie/pdfs/students-notes

# Move high-quality evaluations to knowledge base
# IMPORTANT: Only move curated, high-quality examples!
# Do NOT move all generated evaluations

# Select 2-3 best evaluations manually
cp workspaces/dance/studio/evaluations/formal/BestExample1.md \
   data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Create master note (optional)
echo "# Master Student Notes" > data/knowledgehub/domain/dance/marie/markdown/note.md
```

#### Step 6: Update Configuration

```bash
# Update CLAUDE.md with new structure
cp core/prompts/agents/Marie.md workspaces/dance/studio/CLAUDE.md

# Add output style
mkdir -p workspaces/dance/studio/.claude/output-styles
cp core/output-styles/marie.md workspaces/dance/studio/.claude/output-styles/

# Create local settings
echo '{"outputStyle": "marie"}' > workspaces/dance/studio/.claude/settings.local.json

# Add optimization
mkdir -p workspaces/dance/studio/.claude/agents
echo '{"agentConfig": {"enabled": false}}' > workspaces/dance/studio/.claude/settings.json
```

#### Step 7: Test Orchestrated Mode

```bash
# Start Marie container
docker compose up marie -d

# Check logs for authentication
docker logs -f marie

# Submit test task
../send-task-to-marie.sh "Test evaluation for migration verification"

# Wait and check results
sleep 60
ls -la shared/results/marie/
```

### Path C: Configuration Update Only

#### Step 1: Update CLAUDE.md

```bash
# Backup current configuration
cp CLAUDE.md CLAUDE.md.backup

# Update with new version
cp core/prompts/agents/Marie.md CLAUDE.md

# Or manually merge changes
diff CLAUDE.md.backup core/prompts/agents/Marie.md
```

#### Step 2: Update Output Styles

```bash
# Create output styles directory
mkdir -p .claude/output-styles

# Copy Marie output style
cp core/output-styles/marie.md .claude/output-styles/

# Update settings
echo '{"outputStyle": "marie"}' > .claude/settings.local.json
```

#### Step 3: Optimize Workspace

```bash
# Create agent configuration
mkdir -p .claude/agents
echo '{"agentConfig": {"enabled": false}}' > .claude/settings.json
echo "# Marie workspace - agents disabled for performance" > .claude/agents/README.md
```

#### Step 4: Test Functionality

```bash
# Restart Claude Code session
# cd to workspace
cd workspaces/dance/studio

# Start Claude Code
claude

# Test Marie introduction
# Should display banner with 🩰💃🩰

# Test evaluation creation
# "Create a formal evaluation for TestStudent with observations..."
```

## Verification

### Verification Checklist

After migration, verify:

- [ ] **Marie displays banner** on first response
- [ ] **Introduces herself as Marie** (not as Claude Code)
- [ ] **Can access knowledge base** (read example evaluations)
- [ ] **Can create evaluations** (writes to workspace)
- [ ] **Uses French language** by default
- [ ] **Follows APEXX framework** (5 components + total score)
- [ ] **Files saved to correct location** (`/workspace/dance/`)
- [ ] **No token warning** or warning is informational only
- [ ] **Task processing works** (orchestrated mode)
- [ ] **Output style applied** (warm, encouraging tone with emojis)

### Verification Commands

```bash
# 1. Check workspace structure
tree -L 3 workspaces/dance/studio/

# Expected output:
# workspaces/dance/studio/
# ├── CLAUDE.md
# ├── evaluations/
# │   ├── formal/
# │   ├── quick-notes/
# │   ├── batch/
# │   └── archive/
# ├── students/
# ├── class-notes/
# └── choreography/

# 2. Check knowledge base
ls -la data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Should have 2+ example files

# 3. Check Docker container (orchestrated mode)
docker ps | grep marie
docker logs marie | tail -20

# 4. Check file permissions
ls -la core/shared/tasks/marie/
ls -la core/shared/results/marie/

# 5. Test task submission
./send-task-to-marie.sh "Test evaluation"
sleep 30
ls -la core/shared/results/marie/
```

### Quality Verification

Create a test evaluation and verify quality:

```bash
# In standalone mode
cd workspaces/dance/studio
claude

# Or submit task in orchestrated mode
./send-task-to-marie.sh "Create formal evaluation for TestStudent: Attitude 16/20 good engagement, Posture 14/20 needs work on alignment, Energy 18/20 excellent, Expression 15/20 developing, Execution 16/20 solid technique"

# Wait for result
sleep 60

# Read generated evaluation
cat workspaces/dance/studio/evaluations/formal/TestStudent_Evaluation_*.md

# Verify:
# - In French
# - Has APEXX sections (Attitude, Posture, Énergie, Expression, Exécution)
# - Has scores (/20 for each, /100 total)
# - Has observations section
# - Has next steps section
# - Warm, encouraging tone
# - Specific, actionable feedback
```

## Rollback Procedures

### If Migration Fails

#### Rollback to Previous Version

```bash
# Stop Docker containers
docker compose down

# Restore backup
cp -r ~/marie-backup-$(date +%Y%m%d)/workspace-backup/* workspaces/dance/
cp -r ~/marie-backup-$(date +%Y%m%d)/claude-config-backup/* .claude/
cp ~/marie-backup-$(date +%Y%m%d)/CLAUDE.md.backup CLAUDE.md

# Revert git changes (if needed)
git reset --hard HEAD~1  # Or specific commit
git clean -fd

# Restart in standalone mode
cd workspaces/dance/studio
claude
```

#### Partial Rollback (Keep Some Changes)

```bash
# Keep new workspace structure but revert configuration
cp ~/marie-backup-$(date +%Y%m%d)/CLAUDE.md.backup CLAUDE.md

# Or keep configuration but revert workspace
rm -rf workspaces/dance/studio/*
cp -r ~/marie-backup-$(date +%Y%m%d)/workspace-backup/* workspaces/dance/studio/
```

### Data Recovery

If data is lost during migration:

```bash
# Check backup
ls -la ~/marie-backup-*/

# Restore specific files
cp ~/marie-backup-*/workspace-backup/evaluations/formal/ImportantEvaluation.md \
   workspaces/dance/studio/evaluations/formal/

# Restore all evaluations
cp -r ~/marie-backup-*/workspace-backup/evaluations/* \
   workspaces/dance/studio/evaluations/

# Verify restoration
diff -r ~/marie-backup-*/workspace-backup/evaluations/ \
        workspaces/dance/studio/evaluations/
```

## Troubleshooting

### Issue 1: Marie Not Starting

**Symptoms**: Container exits immediately, authentication fails

**Diagnosis**:
```bash
# Check container logs
docker logs marie

# Check for authentication errors
docker logs marie | grep -i auth

# Check volume mounts
docker inspect marie | grep -A 20 Mounts
```

**Solutions**:
```bash
# Solution 1: Re-authenticate
docker exec -it marie claude

# Solution 2: Fix permissions
chmod 700 core/shared/auth-homes/marie
chown -R $(whoami) core/shared/auth-homes/marie

# Solution 3: Rebuild container
docker compose down
docker compose up marie -d
```

### Issue 2: Tasks Not Being Processed

**Symptoms**: Tasks written to `/tasks/` but no results in `/results/`

**Diagnosis**:
```bash
# Check if tasks exist
ls -la core/shared/tasks/marie/

# Check container is running
docker ps | grep marie

# Check logs for errors
docker logs marie | tail -50

# Check if inotifywait is working
docker exec marie which inotifywait
```

**Solutions**:
```bash
# Solution 1: Verify task format
cat core/shared/tasks/marie/task-*.json

# Should be valid JSON

# Solution 2: Check permissions
ls -la core/shared/tasks/marie/
ls -la core/shared/results/marie/

# Fix if needed
chmod 755 core/shared/tasks/marie
chmod 755 core/shared/results/marie

# Solution 3: Manually trigger processing
docker exec marie ls /tasks/
```

### Issue 3: Knowledge Base Not Accessible

**Symptoms**: Evaluations lack French language, inconsistent format

**Diagnosis**:
```bash
# Check knowledge base exists
ls -la data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Check Docker mount
docker inspect marie | grep knowledgehub
```

**Solutions**:
```bash
# Solution 1: Verify mount in docker-compose.yml
grep -A 5 "knowledgehub" core/docker-compose.yml

# Solution 2: Add example evaluations
cp example-evaluations/*.md \
   data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Solution 3: Restart container to pick up changes
docker restart marie
```

### Issue 4: Output Quality Issues

**Symptoms**: Wrong language, poor formatting, missing sections

**Diagnosis**:
```bash
# Check output style configuration
cat .claude/settings.local.json

# Check CLAUDE.md configuration
grep -i "french\|apexx" CLAUDE.md

# Check example evaluations quality
head -50 data/knowledgehub/domain/dance/marie/markdown/students-reviews/*.md
```

**Solutions**:
```bash
# Solution 1: Verify output style is loaded
cat .claude/settings.local.json
# Should contain: {"outputStyle": "marie"}

# Solution 2: Add high-quality examples
cp high-quality-french-evaluation.md \
   data/knowledgehub/domain/dance/marie/markdown/students-reviews/

# Solution 3: Update CLAUDE.md with clear instructions
# Add explicit instructions for French language, APEXX format
```

### Issue 5: Token Warning Persists

**Symptoms**: Large agent warning even after optimization

**Diagnosis**:
```bash
# Check workspace settings
cat workspaces/dance/studio/.claude/settings.json

# Check if agents are actually disabled
ls -la workspaces/dance/studio/.claude/agents/
```

**Solutions**:
```bash
# Solution 1: This warning is expected and harmless!
# Marie's capabilities come from CLAUDE.md, not Task agents
# Warning can be safely ignored

# Solution 2: Add informational README
cat > workspaces/dance/studio/README.md << 'EOF'
# Marie Workspace

Note: You may see a warning about large agent descriptions (~17.7k tokens).
This is expected and does NOT affect Marie's functionality.

Marie's capabilities come from CLAUDE.md, not from Task agents.
The agents are available via the Task tool if needed, but Marie doesn't use them.
EOF

# Solution 3: Document in workspace
echo "✅ Token warning is informational only - Marie works perfectly!"
```

## FAQ

### Q: Do I need to migrate existing evaluations?

**A**: It depends on your needs:

- **New structure only**: No, keep evaluations in original location
- **Knowledge base examples**: Yes, but only move 2-3 high-quality examples
- **Workspace organization**: Yes, move to new directory structure for better organization

### Q: Will migration delete my existing data?

**A**: No, if you follow the backup steps. Always:
1. Create backup before migration
2. Test migration in separate directory first
3. Verify backup before proceeding

### Q: Can I use both standalone and orchestrated modes?

**A**: Yes! Marie can operate in both modes:
- Standalone: Direct Claude Code CLI session
- Orchestrated: Background Docker container

Use standalone for interactive work, orchestrated for automated workflows.

### Q: How long does migration take?

**A**: Depends on migration path:
- Fresh installation: 15-30 minutes
- Standalone to orchestrated: 30-45 minutes
- Configuration update only: 10-15 minutes

### Q: What if I don't have example evaluations?

**A**: You can:
1. Create 2-3 placeholder examples manually
2. Generate evaluations first, then curate best ones for knowledge base
3. Start with empty knowledge base (Marie will work but may be less consistent)

### Q: Is the MCP server required?

**A**: No, MCP integration is optional. Marie works perfectly in:
- Standalone mode (file-based only)
- Orchestrated mode (file-based only)
- MCP mode (API-based, if implemented)

### Q: Can I customize Marie's personality?

**A**: Yes! Edit:
- `core/output-styles/marie.md` for tone and style
- `core/prompts/agents/Marie.md` for capabilities and behavior
- `core/prompts/domains/DANCE.md` for domain knowledge

### Q: What happens to old evaluations after migration?

**A**: They remain in place. Migration creates new structure but doesn't delete old files. You can:
- Leave them where they are
- Move to new structure manually
- Archive old evaluations in `evaluations/archive/`

## Next Steps

After successful migration:

1. **Test thoroughly** with real evaluation requests
2. **Review generated evaluations** for quality
3. **Populate knowledge base** with more high-quality examples
4. **Document customizations** for your specific use case
5. **Train users** on new workflow
6. **Monitor performance** and adjust as needed

For usage examples, see [EXAMPLES.md](./EXAMPLES.md).

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: CodeHornets-AI Team
