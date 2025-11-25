#!/bin/bash
# Get current screen output from an agent's Claude TUI via tmux
# Usage: ./tmux-output.sh <agent> [lines]

set -e

AGENT_NAME="$1"
LINES="${2:-100}"  # Default to 100 lines of history
TMUX_SESSION="${TMUX_SESSION:-claude-session}"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: $0 <agent> [lines]"
    echo ""
    echo "Arguments:"
    echo "  agent - orchestrator, marie, anga, or fabien"
    echo "  lines - Number of history lines to capture (default: 100)"
    echo ""
    echo "Examples:"
    echo "  $0 anga          # Get last 100 lines"
    echo "  $0 marie 50      # Get last 50 lines"
    echo "  $0 orchestrator 200  # Get last 200 lines"
    exit 1
fi

# Map agent name to container name
case "$AGENT_NAME" in
    orchestrator)
        CONTAINER_NAME="codehornets-orchestrator"
        ;;
    marie|anga|fabien)
        CONTAINER_NAME="codehornets-worker-${AGENT_NAME}"
        ;;
    *)
        echo "Error: Unknown agent '$AGENT_NAME'"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running"
    exit 1
fi

# Check if tmux session exists
if ! docker exec "${CONTAINER_NAME}" tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
    echo "Error: tmux session '${TMUX_SESSION}' not found in ${CONTAINER_NAME}"
    exit 1
fi

echo "=== ${AGENT_NAME} screen output (last ${LINES} lines) ==="
echo ""

# Capture pane content with scrollback history
docker exec "${CONTAINER_NAME}" tmux capture-pane -t "${TMUX_SESSION}" -p -S -"${LINES}"

echo ""
echo "=== End of output ==="
