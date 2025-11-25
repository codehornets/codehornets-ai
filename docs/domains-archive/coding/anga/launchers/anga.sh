#!/bin/bash

# 💻 Anga - Coding Assistant Launcher
# Ensures CLAUDE.md exists and launches Claude Code

# Check if in workspace
if [ ! -f "CLAUDE.md" ]; then
    echo "⚠️  Setting up Anga for the first time..."

    # Find the ANGA.md template (search up directory tree)
    TEMPLATE=""
    SEARCH_DIR="$PWD"
    for i in {1..5}; do
        if [ -f "$SEARCH_DIR/domains/coding/anga/templates/ANGA.md" ]; then
            TEMPLATE="$SEARCH_DIR/domains/coding/anga/templates/ANGA.md"
            break
        fi
        SEARCH_DIR="$SEARCH_DIR/.."
    done

    if [ -n "$TEMPLATE" ]; then
        cp "$TEMPLATE" ./CLAUDE.md
        echo "✅ Anga configured (CLAUDE.md created)"
        echo ""
    else
        echo "❌ Error: ANGA.md template not found!"
        echo "Please ensure you're in the project root or a workspace"
        exit 1
    fi
fi

# Launch Claude Code
# Anga will introduce himself with his banner in the chat
claude "$@"
