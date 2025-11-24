#!/bin/bash
# Check tmux session status for all agents
# Usage: ./tmux-status.sh [agent]

set -e

TMUX_SESSION="${TMUX_SESSION:-claude-session}"

# Function to check a single agent
check_agent() {
    local AGENT_NAME="$1"
    local CONTAINER_NAME

    case "$AGENT_NAME" in
        orchestrator)
            CONTAINER_NAME="codehornets-orchestrator"
            ;;
        marie|anga|fabien)
            CONTAINER_NAME="codehornets-worker-${AGENT_NAME}"
            ;;
        *)
            echo "Unknown agent: $AGENT_NAME"
            return 1
            ;;
    esac

    # Check container status
    local CONTAINER_RUNNING="no"
    local TMUX_ACTIVE="no"
    local TMUX_WINDOWS="0"
    local STATUS_ICON="[ ]"
    local STATUS_TEXT="offline"

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        CONTAINER_RUNNING="yes"

        # Check tmux session
        if docker exec "${CONTAINER_NAME}" tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
            TMUX_ACTIVE="yes"
            TMUX_WINDOWS=$(docker exec "${CONTAINER_NAME}" tmux list-windows -t "${TMUX_SESSION}" 2>/dev/null | wc -l)
            STATUS_ICON="[*]"
            STATUS_TEXT="active (tmux)"
        else
            STATUS_ICON="[!]"
            STATUS_TEXT="running (no tmux)"
        fi
    fi

    printf "%-15s %s %-20s container=%-3s tmux=%-3s windows=%s\n" \
        "${AGENT_NAME}:" "${STATUS_ICON}" "${STATUS_TEXT}" \
        "${CONTAINER_RUNNING}" "${TMUX_ACTIVE}" "${TMUX_WINDOWS}"
}

# Function to get detailed status
detailed_status() {
    local AGENT_NAME="$1"
    local CONTAINER_NAME

    case "$AGENT_NAME" in
        orchestrator)
            CONTAINER_NAME="codehornets-orchestrator"
            ;;
        marie|anga|fabien)
            CONTAINER_NAME="codehornets-worker-${AGENT_NAME}"
            ;;
        *)
            return 1
            ;;
    esac

    echo ""
    echo "=== ${AGENT_NAME} Detailed Status ==="
    echo ""

    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Container: NOT RUNNING"
        return 0
    fi

    echo "Container: ${CONTAINER_NAME} (running)"

    if docker exec "${CONTAINER_NAME}" tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
        echo "tmux session: ${TMUX_SESSION} (active)"
        echo ""
        echo "tmux windows:"
        docker exec "${CONTAINER_NAME}" tmux list-windows -t "${TMUX_SESSION}" 2>/dev/null || echo "  (none)"
        echo ""
        echo "tmux panes:"
        docker exec "${CONTAINER_NAME}" tmux list-panes -t "${TMUX_SESSION}" 2>/dev/null || echo "  (none)"
    else
        echo "tmux session: NOT ACTIVE"
    fi

    # Show heartbeat if available
    if [ -f "shared/heartbeats/${AGENT_NAME}.json" ]; then
        echo ""
        echo "Heartbeat:"
        cat "shared/heartbeats/${AGENT_NAME}.json" | python3 -m json.tool 2>/dev/null || cat "shared/heartbeats/${AGENT_NAME}.json"
    fi
}

# Main
if [ -n "$1" ]; then
    # Single agent specified
    AGENT="$1"
    DETAILED="${2:-}"

    if [ "$DETAILED" = "-v" ] || [ "$DETAILED" = "--verbose" ]; then
        detailed_status "$AGENT"
    else
        check_agent "$AGENT"
    fi
else
    # All agents
    echo "=============================================="
    echo "  CodeHornets AI - tmux Session Status"
    echo "=============================================="
    echo ""
    echo "Legend: [*] active  [!] partial  [ ] offline"
    echo ""

    for agent in orchestrator marie anga fabien; do
        check_agent "$agent"
    done

    echo ""
    echo "Commands:"
    echo "  Send message:  ./scripts/tmux-send.sh <agent> <message>"
    echo "  View output:   ./scripts/tmux-output.sh <agent>"
    echo "  Attach:        docker exec -it <container> tmux attach -t ${TMUX_SESSION}"
    echo ""
fi
