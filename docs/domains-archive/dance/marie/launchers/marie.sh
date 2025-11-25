#!/bin/bash

# 🩰 Marie - Dance Teacher Assistant Launcher
# Ensures CLAUDE.md exists and launches Claude Code

# Check if in workspace
if [ ! -f "CLAUDE.md" ]; then
    echo "⚠️  Setting up Marie for the first time..."

    # Find the DANCE.md template (search up directory tree)
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
# Marie will introduce herself with her banner in the chat
claude "$@"
