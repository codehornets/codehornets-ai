#!/bin/bash

# Agent cleanup script to reduce token usage
# Creates an archive directory for unused framework-specific agents

AGENTS_DIR="/home/anga/workspace/.claude/agents"
ARCHIVE_DIR="/home/anga/workspace/.claude/agents-archived"

echo "Creating archive directory..."
mkdir -p "$ARCHIVE_DIR/specialized/django"
mkdir -p "$ARCHIVE_DIR/specialized/rails"
mkdir -p "$ARCHIVE_DIR/specialized/laravel"
mkdir -p "$ARCHIVE_DIR/specialized/vue"

echo ""
echo "Archiving unused framework agents..."

# Django agents (3)
mv "$AGENTS_DIR/specialized/django/django-api-developer.md" "$ARCHIVE_DIR/specialized/django/" 2>/dev/null && echo "✓ Archived django-api-developer"
mv "$AGENTS_DIR/specialized/django/django-backend-expert.md" "$ARCHIVE_DIR/specialized/django/" 2>/dev/null && echo "✓ Archived django-backend-expert"
mv "$AGENTS_DIR/specialized/django/django-orm-expert.md" "$ARCHIVE_DIR/specialized/django/" 2>/dev/null && echo "✓ Archived django-orm-expert"

# Rails agents (3)
mv "$AGENTS_DIR/specialized/rails/rails-api-developer.md" "$ARCHIVE_DIR/specialized/rails/" 2>/dev/null && echo "✓ Archived rails-api-developer"
mv "$AGENTS_DIR/specialized/rails/rails-backend-expert.md" "$ARCHIVE_DIR/specialized/rails/" 2>/dev/null && echo "✓ Archived rails-backend-expert"
mv "$AGENTS_DIR/specialized/rails/rails-activerecord-expert.md" "$ARCHIVE_DIR/specialized/rails/" 2>/dev/null && echo "✓ Archived rails-activerecord-expert"

# Laravel agents (2)
mv "$AGENTS_DIR/specialized/laravel/laravel-backend-expert.md" "$ARCHIVE_DIR/specialized/laravel/" 2>/dev/null && echo "✓ Archived laravel-backend-expert"
mv "$AGENTS_DIR/specialized/laravel/laravel-eloquent-expert.md" "$ARCHIVE_DIR/specialized/laravel/" 2>/dev/null && echo "✓ Archived laravel-eloquent-expert"

# Vue agents (3)
mv "$AGENTS_DIR/specialized/vue/vue-component-architect.md" "$ARCHIVE_DIR/specialized/vue/" 2>/dev/null && echo "✓ Archived vue-component-architect"
mv "$AGENTS_DIR/specialized/vue/vue-nuxt-expert.md" "$ARCHIVE_DIR/specialized/vue/" 2>/dev/null && echo "✓ Archived vue-nuxt-expert"
mv "$AGENTS_DIR/specialized/vue/vue-state-manager.md" "$ARCHIVE_DIR/specialized/vue/" 2>/dev/null && echo "✓ Archived vue-state-manager"

# Optional: Also archive Django in root (if present)
mv "$AGENTS_DIR/django-api-developer.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived django-api-developer (root)"
mv "$AGENTS_DIR/django-backend-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived django-backend-expert (root)"
mv "$AGENTS_DIR/django-orm-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived django-orm-expert (root)"
mv "$AGENTS_DIR/django-expert.md" "$ARCHIVE_DIR/" 2>/dev/null && echo "✓ Archived django-expert (root)"

echo ""
echo "Cleanup complete!"
echo ""
echo "Agents remaining:"
find "$AGENTS_DIR" -name "*.md" -type f | wc -l
echo ""
echo "Agents archived:"
find "$ARCHIVE_DIR" -name "*.md" -type f | wc -l
echo ""
echo "To restore an agent:"
echo "  mv $ARCHIVE_DIR/specialized/<framework>/<agent>.md $AGENTS_DIR/specialized/<framework>/"
