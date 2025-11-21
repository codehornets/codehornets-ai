#!/bin/bash
# Fast message delivery via Redis pub/sub
# This is FAST because it uses Redis, not file system

set -e

AGENT_NAME="$1"
MESSAGE="$2"

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$AGENT_NAME" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <agent> \"message\""
    echo "Example: $0 anga \"Hello from orchestrator\""
    exit 1
fi

# Validate agent name
case "$AGENT_NAME" in
    orchestrator|marie|anga|fabien)
        ;;
    *)
        echo -e "${RED}Error: Unknown agent '$AGENT_NAME'${NC}"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Generate unique message ID
TIMESTAMP=$(date +%s%N)
MESSAGE_ID="msg_${TIMESTAMP}"

# Get sender name
SENDER="${SENDER:-${AGENT_NAME_OVERRIDE:-unknown}}"

# Create JSON message
MESSAGE_JSON=$(cat <<EOF
{
  "id": "${MESSAGE_ID}",
  "timestamp": "$(date -Iseconds)",
  "to": "${AGENT_NAME}",
  "from": "${SENDER}",
  "message": "${MESSAGE}"
}
EOF
)

# Publish to Redis channel
REDIS_URL="${REDIS_URL:-redis://redis:6379}"
CHANNEL="agent:${AGENT_NAME}"

# Use redis-cli to publish (it's installed in the Redis container)
# We can use docker exec or a Redis client
docker exec codehornets-svc-redis redis-cli PUBLISH "${CHANNEL}" "${MESSAGE_JSON}" > /dev/null 2>&1 || {
    # Fallback: try from host if docker exec fails
    echo "${MESSAGE_JSON}" | redis-cli -u "${REDIS_URL}" -x PUBLISH "${CHANNEL}" > /dev/null 2>&1
}

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✉️  Message published to Redis: ${AGENT_NAME}${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "Message ID: ${MESSAGE_ID}"
echo -e "Channel: ${CHANNEL}"
echo -e "From: ${SENDER}"
echo ""
echo -e "${GREEN}✓ Message published successfully${NC}"
echo ""
