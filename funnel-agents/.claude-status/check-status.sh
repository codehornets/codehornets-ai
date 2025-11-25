#!/bin/bash
# Quick status check for all Claude instances

echo "════════════════════════════════════════════════════════════════"
echo "   Claude Instance Status Dashboard"
echo "════════════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for f in "$SCRIPT_DIR"/instance-*.json; do
  if [ -f "$f" ]; then
    instance=$(basename "$f" .json)
    status=$(cat "$f" | grep -o '"status": *"[^"]*"' | cut -d'"' -f4)
    task=$(cat "$f" | grep -o '"current_task": *"[^"]*"' | cut -d'"' -f4 | head -1)
    service=$(cat "$f" | grep -o '"service": *"[^"]*"' | cut -d'"' -f4)

    # Color based on status
    case $status in
      "active"|"in_progress") color="\033[33m" ;;  # Yellow
      "completed") color="\033[32m" ;;              # Green
      "blocked") color="\033[31m" ;;                # Red
      *) color="\033[37m" ;;                        # Gray
    esac

    echo -e "${color}[$status]${NC} $instance"
    echo "         Service: $service"
    echo "         Task: ${task:-None}"
    echo ""
  fi
done

echo "════════════════════════════════════════════════════════════════"
echo "Run: bash funnel-agents/.claude-status/check-status.sh"
echo "════════════════════════════════════════════════════════════════"
