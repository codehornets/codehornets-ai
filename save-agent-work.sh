#!/bin/bash
# Save agent work and conversation history before container restart

AGENT_NAME="$1"
BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: ./save-agent-work.sh <agent-name>"
    echo "Example: ./save-agent-work.sh marie"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════"
echo "   Saving work from $AGENT_NAME container"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/$AGENT_NAME"

echo "1. Saving container filesystem..."
# Save entire home directory (includes conversation history)
docker cp "$AGENT_NAME:/home/agent/." "$BACKUP_DIR/$AGENT_NAME/home/" 2>/dev/null

echo "2. Saving workspace files..."
# Save workspace
docker cp "$AGENT_NAME:/workspace/." "$BACKUP_DIR/$AGENT_NAME/workspace/" 2>/dev/null || echo "   (No workspace to save)"

echo "3. Saving results..."
# Save results
docker cp "$AGENT_NAME:/results/." "$BACKUP_DIR/$AGENT_NAME/results/" 2>/dev/null || echo "   (No results to save)"

echo ""
echo "✓ Backup saved to: $BACKUP_DIR/$AGENT_NAME/"
echo ""
echo "Contents:"
ls -lh "$BACKUP_DIR/$AGENT_NAME/"
echo ""
echo "To restore conversation history:"
echo "  docker cp $BACKUP_DIR/$AGENT_NAME/home/.claude/. core/shared/auth-homes/$AGENT_NAME/.claude/"
echo ""
