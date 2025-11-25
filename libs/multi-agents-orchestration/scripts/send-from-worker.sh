#!/bin/bash
# Send message from a worker agent to another agent
# This script is meant to be run FROM INSIDE a worker container
# It uses the automation container as a relay

set -e

TARGET_AGENT="$1"
MESSAGE="$2"
FROM_AGENT="${AGENT_NAME:-worker}"

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$TARGET_AGENT" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <target_agent> \"message\""
    echo ""
    echo "Examples:"
    echo "  $0 orchestrator \"Task completed\""
    echo "  $0 marie \"Need student data format\""
    echo "  $0 fabien \"API deployed\""
    exit 1
fi

# Map agent name to container name
case "$TARGET_AGENT" in
    orchestrator)
        CONTAINER="codehornets-orchestrator"
        ;;
    anga)
        CONTAINER="codehornets-worker-anga"
        ;;
    marie)
        CONTAINER="codehornets-worker-marie"
        ;;
    fabien)
        CONTAINER="codehornets-worker-fabien"
        ;;
    *)
        echo -e "${RED}Error: Unknown agent '$TARGET_AGENT'${NC}"
        exit 1
        ;;
esac

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Sending from ${FROM_AGENT} to ${TARGET_AGENT}${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Use automation container as relay
docker exec codehornets-svc-automation sh -c "
expect <<'EXPECT_EOF'
set timeout 5
log_user 0

spawn docker attach --no-stdin ${CONTAINER}

# Don't wait for output, just attach and send
sleep 1

send \"${MESSAGE}\\r\"
sleep 5
send \"\\x10\\x11\"
sleep 1

exit 0
EXPECT_EOF
" 2>&1 | grep -v "spawn\|EXPECT_EOF" || true

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Message sent to ${TARGET_AGENT}${NC}"
else
    echo -e "${RED}✗ Failed to send message${NC}"
    exit 1
fi
