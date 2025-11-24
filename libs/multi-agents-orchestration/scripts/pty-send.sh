#!/bin/bash
#
# PTY Send Script
#
# Send a command to a worker agent via PTY wrapper socket.
#
# Usage:
#   ./scripts/pty-send.sh <agent> <message>
#   ./scripts/pty-send.sh anga "hello"
#   ./scripts/pty-send.sh marie "status"
#

set -e

AGENT="${1:-}"
MESSAGE="${2:-}"
TIMEOUT="${3:-60000}"

if [ -z "$AGENT" ]; then
    echo "Usage: $0 <agent> <message> [timeout_ms]"
    echo ""
    echo "Agents: orchestrator, marie, anga, fabien"
    echo ""
    echo "Examples:"
    echo "  $0 anga 'Hello, what can you do?'"
    echo "  $0 marie status"
    echo "  $0 orchestrator ping"
    exit 1
fi

# Determine socket path
SOCKET_DIR="${SOCKET_DIR:-./shared/sockets}"
SOCKET_PATH="${SOCKET_DIR}/${AGENT}.sock"

# Check if running inside Docker
if [ -d "/shared/sockets" ]; then
    SOCKET_DIR="/shared/sockets"
    SOCKET_PATH="${SOCKET_DIR}/${AGENT}.sock"
fi

# Check if socket exists
if [ ! -S "$SOCKET_PATH" ]; then
    echo "Error: Socket not found at $SOCKET_PATH"
    echo ""
    echo "Make sure the PTY wrapper is running for $AGENT"
    echo "  Run: make pty-up"
    exit 1
fi

echo "Connecting to $AGENT via $SOCKET_PATH..."
echo "Sending: $MESSAGE"
echo "Timeout: ${TIMEOUT}ms"
echo "---"

# Generate unique request ID
REQUEST_ID="$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "req-$(date +%s)")"

# Create the JSON request
REQUEST=$(cat <<EOF
{"type":"command","id":"$REQUEST_ID","input":"$MESSAGE","timeout":$TIMEOUT}
EOF
)

# Send request and read response using netcat
# Using temporary file for response collection
RESPONSE_FILE=$(mktemp)
trap "rm -f $RESPONSE_FILE" EXIT

# Connect and send/receive
echo "$REQUEST" | nc -U -q 30 "$SOCKET_PATH" > "$RESPONSE_FILE" 2>&1 &
NC_PID=$!

# Wait for response with timeout
TIMEOUT_SEC=$((TIMEOUT / 1000 + 5))
WAITED=0
while [ $WAITED -lt $TIMEOUT_SEC ]; do
    sleep 1
    WAITED=$((WAITED + 1))

    # Check if complete response received
    if grep -q '"type":"complete"' "$RESPONSE_FILE" 2>/dev/null; then
        break
    fi

    # Check if error received
    if grep -q '"type":"error"' "$RESPONSE_FILE" 2>/dev/null; then
        break
    fi
done

# Kill nc if still running
kill $NC_PID 2>/dev/null || true

# Parse and display output
if [ -f "$RESPONSE_FILE" ]; then
    echo ""
    echo "=== Response ==="

    # Extract and display output data
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            TYPE=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)
            case "$TYPE" in
                "connected")
                    echo "[Connected to $AGENT]"
                    ;;
                "queued")
                    POSITION=$(echo "$line" | jq -r '.position // "?"')
                    echo "[Queued at position $POSITION]"
                    ;;
                "output")
                    DATA=$(echo "$line" | jq -r '.data // empty' 2>/dev/null)
                    if [ -n "$DATA" ]; then
                        printf "%s" "$DATA"
                    fi
                    ;;
                "complete")
                    echo ""
                    echo "[Complete]"
                    ;;
                "error")
                    ERROR=$(echo "$line" | jq -r '.error // "Unknown error"')
                    echo "[Error: $ERROR]"
                    exit 1
                    ;;
            esac
        fi
    done < "$RESPONSE_FILE"
else
    echo "Error: No response received"
    exit 1
fi

echo ""
echo "---"
echo "Done"
