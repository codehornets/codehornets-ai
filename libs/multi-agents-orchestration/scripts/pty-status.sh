#!/bin/bash
#
# PTY Status Script
#
# Check status of all PTY wrapper sockets.
#
# Usage:
#   ./scripts/pty-status.sh
#   ./scripts/pty-status.sh <agent>
#

AGENT="${1:-}"
SOCKET_DIR="${SOCKET_DIR:-./shared/sockets}"

# Check if running inside Docker
if [ -d "/shared/sockets" ]; then
    SOCKET_DIR="/shared/sockets"
fi

# List of all agents
AGENTS="orchestrator marie anga fabien"

# If specific agent requested
if [ -n "$AGENT" ]; then
    AGENTS="$AGENT"
fi

echo "PTY Wrapper Status"
echo "=================="
echo ""
echo "Socket directory: $SOCKET_DIR"
echo ""

# Create socket dir if it doesn't exist
mkdir -p "$SOCKET_DIR" 2>/dev/null || true

for agent in $AGENTS; do
    SOCKET_PATH="${SOCKET_DIR}/${agent}.sock"

    printf "%-15s: " "$agent"

    if [ -S "$SOCKET_PATH" ]; then
        # Try to ping the socket
        RESPONSE=$(echo '{"type":"ping"}' | timeout 3 nc -U -q 1 "$SOCKET_PATH" 2>/dev/null | head -n 2)

        if echo "$RESPONSE" | grep -q '"type":"pong"' 2>/dev/null; then
            echo "ONLINE (socket active)"
        elif echo "$RESPONSE" | grep -q '"type":"connected"' 2>/dev/null; then
            echo "ONLINE (connected)"
        else
            echo "SOCKET EXISTS (not responding)"
        fi
    else
        # Check if container is running
        CONTAINER_NAME="codehornets-$agent"
        if [ "$agent" != "orchestrator" ]; then
            CONTAINER_NAME="codehornets-worker-$agent"
        fi

        if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
            echo "STARTING (container running, no socket yet)"
        else
            echo "OFFLINE"
        fi
    fi
done

echo ""

# Show socket files
echo "Socket Files:"
echo "-------------"
if ls -la "$SOCKET_DIR"/*.sock 2>/dev/null; then
    :
else
    echo "  (no socket files)"
fi

echo ""

# Show heartbeats for comparison
HEARTBEAT_DIR="${HEARTBEAT_DIR:-./shared/heartbeats}"
if [ -d "/shared/heartbeats" ]; then
    HEARTBEAT_DIR="/shared/heartbeats"
fi

echo "Heartbeat Status:"
echo "-----------------"
for agent in orchestrator marie anga fabien; do
    HEARTBEAT_FILE="${HEARTBEAT_DIR}/${agent}.json"
    printf "%-15s: " "$agent"

    if [ -f "$HEARTBEAT_FILE" ]; then
        STATUS=$(jq -r '.status // "unknown"' "$HEARTBEAT_FILE" 2>/dev/null)
        MODE=$(jq -r '.mode // "standard"' "$HEARTBEAT_FILE" 2>/dev/null)
        UPDATED=$(jq -r '.last_updated // "?"' "$HEARTBEAT_FILE" 2>/dev/null)
        echo "$STATUS ($MODE) - $UPDATED"
    else
        echo "no heartbeat"
    fi
done
