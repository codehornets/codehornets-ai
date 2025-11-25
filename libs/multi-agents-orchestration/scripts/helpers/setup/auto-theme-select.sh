#!/bin/bash
# Complete theme selection for all CodeHornets agents
# This script guides you through the theme selection process

set -e

AGENTS=("orchestrator" "marie" "anga" "fabien")

echo "═══════════════════════════════════════════════════"
echo "   CodeHornets Agent Theme Setup"
echo "═══════════════════════════════════════════════════"
echo ""
echo "After containers restart, each agent needs theme selection."
echo "This script will attach to each agent in sequence."
echo ""
echo "For each agent:"
echo "  1. Press ENTER to select 'Dark mode' (default)"
echo "  2. Press Ctrl+P then Ctrl+Q to detach (NOT Ctrl+C!)"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
read -p "Press Enter to begin..."

for agent in "${AGENTS[@]}"; do
    echo ""
    echo "───────────────────────────────────────────────────"
    echo "  Attaching to: $agent"
    echo "───────────────────────────────────────────────────"
    echo "  → Press ENTER for theme"
    echo "  → Then Ctrl+P Ctrl+Q to detach"
    echo ""
    read -p "Press Enter to attach to $agent..."

    # Use correct container name based on agent type
    if [ "$agent" = "orchestrator" ]; then
        docker attach "codehornets-${agent}"
    else
        docker attach "codehornets-worker-${agent}"
    fi

    echo ""
    echo "✓ Detached from $agent"
    sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ All agents configured!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Checking agent logs..."
echo ""

for agent in "${AGENTS[@]}"; do
    echo "--- $agent logs (last 15 lines) ---"
    # Use correct container name based on agent type
    if [ "$agent" = "orchestrator" ]; then
        docker logs "codehornets-${agent}" --tail 15 2>&1 | tail -15
    else
        docker logs "codehornets-worker-${agent}" --tail 15 2>&1 | tail -15
    fi
    echo ""
done
