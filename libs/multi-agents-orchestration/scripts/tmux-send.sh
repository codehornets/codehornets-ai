#!/bin/bash
# Send a message to an agent's Claude TUI via tmux
# Usage: ./tmux-send.sh <agent> <message>

set -e

AGENT_NAME="$1"
MESSAGE="$2"
TMUX_SESSION="${TMUX_SESSION:-claude-session}"

if [ -z "$AGENT_NAME" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <agent> <message>"
    echo ""
    echo "Arguments:"
    echo "  agent   - orchestrator, marie, anga, or fabien"
    echo "  message - The message to send to Claude"
    echo ""
    echo "Examples:"
    echo "  $0 anga 'Create a Python function to validate emails'"
    echo "  $0 orchestrator 'List all pending tasks'"
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
    echo "Start it with: docker-compose up -d ${AGENT_NAME}"
    exit 1
fi

# Check if tmux session exists
if ! docker exec "${CONTAINER_NAME}" tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
    echo "Error: tmux session '${TMUX_SESSION}' not found in ${CONTAINER_NAME}"
    echo "The agent may not be using tmux mode. Check entrypoint configuration."
    exit 1
fi

echo "Sending message to ${AGENT_NAME}..."
echo "Container: ${CONTAINER_NAME}"
echo "Session: ${TMUX_SESSION}"
echo "Message: ${MESSAGE}"
echo ""

# Send the message via tmux send-keys
# The message is typed into the Claude prompt, then Enter is pressed
docker exec "${CONTAINER_NAME}" tmux send-keys -t "${TMUX_SESSION}" "${MESSAGE}" Enter

echo "Message sent successfully"
echo ""
echo "To view output:"
echo "  ./scripts/tmux-output.sh ${AGENT_NAME}"
echo ""
echo "To attach interactively:"
echo "  docker exec -it ${CONTAINER_NAME} tmux attach -t ${TMUX_SESSION}"
