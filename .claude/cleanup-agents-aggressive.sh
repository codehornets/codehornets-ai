#!/bin/bash

# Aggressive cleanup - archives even more specialized agents
# Only keep core, universal, orchestrators, and essential Python agents

AGENTS_DIR="/home/anga/workspace/.claude/agents"
ARCHIVE_DIR="/home/anga/workspace/.claude/agents-archived"

echo "Aggressive cleanup - archiving additional specialized agents..."

# Archive React if you don't use it
mkdir -p "$ARCHIVE_DIR/specialized/react"
mv "$AGENTS_DIR/specialized/react/react-component-architect.md" "$ARCHIVE_DIR/specialized/react/" 2>/dev/null && echo "✓ Archived react-component-architect"
mv "$AGENTS_DIR/specialized/react/react-nextjs-expert.md" "$ARCHIVE_DIR/specialized/react/" 2>/dev/null && echo "✓ Archived react-nextjs-expert"

# Archive Python specialized agents if you only need the basic python-expert
mkdir -p "$ARCHIVE_DIR/specialized/python"
mv "$AGENTS_DIR/specialized/python/ml-data-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived ml-data-expert"
mv "$AGENTS_DIR/specialized/python/security-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived security-expert"
mv "$AGENTS_DIR/specialized/python/testing-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived testing-expert"
mv "$AGENTS_DIR/specialized/python/performance-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived performance-expert"
mv "$AGENTS_DIR/specialized/python/devops-cicd-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived devops-cicd-expert"
mv "$AGENTS_DIR/specialized/python/web-scraping-expert.md" "$ARCHIVE_DIR/specialized/python/" 2>/dev/null && echo "✓ Archived web-scraping-expert"

echo ""
echo "Aggressive cleanup complete!"
echo "Agents remaining:"
find "$AGENTS_DIR" -name "*.md" -type f | wc -l
