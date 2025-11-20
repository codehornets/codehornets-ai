#!/bin/bash
# Auto-complete theme selection for an agent
# This sends Enter to select the default theme if agent is stuck at theme screen

set -e

AGENT_NAME="$1"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: $0 <agent>"
    echo "Example: $0 anga"
    exit 1
fi

# Map agent to container
case "$AGENT_NAME" in
    orchestrator)
        CONTAINER="codehornets-orchestrator"
        ;;
    anga|marie|fabien)
        CONTAINER="codehornets-worker-${AGENT_NAME}"
        ;;
    *)
        echo "Error: Unknown agent '$AGENT_NAME'"
        exit 1
        ;;
esac

echo "Auto-completing theme selection for $AGENT_NAME..."

# Use automation container to send Enter key
docker exec codehornets-svc-automation sh -c "
expect <<'EXPECT_EOF'
set timeout 5
log_user 0

spawn docker attach ${CONTAINER}
sleep 0.5

# Send Enter to select default theme
send \"\r\"
sleep 1

# Send Enter again in case it needs confirmation
send \"\r\"
sleep 0.5

# Detach
send \"\x10\x11\"
sleep 0.5

expect eof
EXPECT_EOF
" 2>&1 | grep -v "spawn" || true

echo "✓ Theme selection completed for $AGENT_NAME"
