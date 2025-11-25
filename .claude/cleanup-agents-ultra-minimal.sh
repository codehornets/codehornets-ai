#!/bin/bash

# Ultra-minimal - Only keep the absolute essentials
# Use if still getting warnings after previous cleanups

AGENTS_DIR="/home/anga/workspace/.claude/agents"
ARCHIVE_DIR="/home/anga/workspace/.claude/agents-archived"

echo "Creating ultra-minimal set (only 10-12 core agents)..."

# Archive secondary agents
mv "$AGENTS_DIR/tailwind-css-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived tailwind-css-expert"
mv "$AGENTS_DIR/api-architect.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived api-architect"
mv "$AGENTS_DIR/plan-reviewer.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived plan-reviewer"
mv "$AGENTS_DIR/frontend-error-fixer.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived frontend-error-fixer"
mv "$AGENTS_DIR/web-research-specialist.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived web-research-specialist"
mv "$AGENTS_DIR/code-refactor-master.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived code-refactor-master"
mv "$AGENTS_DIR/fastapi-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived fastapi-expert"

echo ""
echo "Ultra-minimal set created!"
echo "Agents remaining:"
find "$AGENTS_DIR" -name "*.md" -type f ! -name "README.md" | wc -l
echo ""
echo "Core kept: code-reviewer, frontend-developer, backend-developer,"
echo "          python-expert, tech-lead-orchestrator, documentation-architect,"
echo "          code-architecture-reviewer, refactor-planner"
