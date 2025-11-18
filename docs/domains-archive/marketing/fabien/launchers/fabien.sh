#!/bin/bash

# 📈 Fabien - Marketing Assistant Launcher
# Ensures CLAUDE.md exists and launches Claude Code

# Check if in workspace
if [ ! -f "CLAUDE.md" ]; then
    echo "⚠️  Setting up Fabien for the first time..."

    # Find the FABIEN.md template (search up directory tree)
    TEMPLATE=""
    SEARCH_DIR="$PWD"
    for i in {1..5}; do
        if [ -f "$SEARCH_DIR/domains/marketing/fabien/templates/FABIEN.md" ]; then
            TEMPLATE="$SEARCH_DIR/domains/marketing/fabien/templates/FABIEN.md"
            break
        fi
        SEARCH_DIR="$SEARCH_DIR/.."
    done

    if [ -n "$TEMPLATE" ]; then
        cp "$TEMPLATE" ./CLAUDE.md
        echo "✅ Fabien configured (CLAUDE.md created)"
        echo ""
    else
        echo "❌ Error: FABIEN.md template not found!"
        echo "Please ensure you're in the project root or a workspace"
        exit 1
    fi
fi

# Launch Claude Code
# Fabien will introduce himself with his banner in the chat
claude "$@"
