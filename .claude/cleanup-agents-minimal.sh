#!/bin/bash

# Minimal agent set - keep only the most essential agents
# Archives duplicates and specialized agents

AGENTS_DIR="/home/anga/workspace/.claude/agents"
ARCHIVE_DIR="/home/anga/workspace/.claude/agents-archived"

echo "Creating minimal agent set..."

# Archive django-expert (redundant with python-expert + fastapi-expert)
mv "$AGENTS_DIR/django-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived django-expert"

# Archive auth-specific agents (project-specific, not always needed)
mkdir -p "$ARCHIVE_DIR/project-specific"
mv "$AGENTS_DIR/auth-route-debugger.md" "$ARCHIVE_DIR/project-specific/" 2>/dev/null && echo "✓ Archived auth-route-debugger"
mv "$AGENTS_DIR/auth-route-tester.md" "$ARCHIVE_DIR/project-specific/" 2>/dev/null && echo "✓ Archived auth-route-tester"

# Archive auto-error-resolver (can be done manually)
mv "$AGENTS_DIR/auto-error-resolver.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived auto-error-resolver"

# Archive documentation-specialist (redundant with documentation-architect)
mv "$AGENTS_DIR/documentation-specialist.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived documentation-specialist"

# Archive code-archaeologist (use on-demand)
mv "$AGENTS_DIR/core/code-archaeologist.md" "$ARCHIVE_DIR/core/" 2>/dev/null && echo "✓ Archived code-archaeologist"

# Archive performance-optimizer (redundant with tech-lead-orchestrator)
mv "$AGENTS_DIR/core/performance-optimizer.md" "$ARCHIVE_DIR/core/" 2>/dev/null && echo "✓ Archived performance-optimizer"

# Archive team-configurator (one-time use)
mv "$AGENTS_DIR/orchestrators/team-configurator.md" "$ARCHIVE_DIR/orchestrators/" 2>/dev/null && echo "✓ Archived team-configurator"

# Archive project-analyst (redundant with tech-lead-orchestrator)
mv "$AGENTS_DIR/orchestrators/project-analyst.md" "$ARCHIVE_DIR/orchestrators/" 2>/dev/null && echo "✓ Archived project-analyst"

echo ""
echo "Minimal set created!"
echo ""
echo "Agents remaining:"
find "$AGENTS_DIR" -name "*.md" -type f | wc -l
echo ""
echo "Total archived:"
find "$ARCHIVE_DIR" -name "*.md" -type f | wc -l
echo ""
echo "Core agents kept:"
echo "  • code-reviewer (code quality)"
echo "  • frontend-developer (UI work)"
echo "  • backend-developer (API work)"
echo "  • python-expert (Python code)"
echo "  • fastapi-expert (FastAPI)"
echo "  • tech-lead-orchestrator (planning)"
echo "  • documentation-architect (docs)"
echo "  • code-architecture-reviewer (review)"
echo "  • refactor-planner (refactoring)"
echo "  • And other essential agents"
