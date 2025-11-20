#!/bin/bash
# Universal agent messaging script
# Sends messages to ANY agent (orchestrator or workers) via persistent session
# Uses docker attach + expect to communicate with running Claude instances

set -e

AGENT_NAME="$1"
MESSAGE="$2"
SHOW_LOGS="${3:-no}"  # Set to "logs" to show cleaned response

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$AGENT_NAME" ] || [ -z "$MESSAGE" ]; then
    cat <<EOF
Usage: $0 <agent> "message" [logs]

Arguments:
  agent       - Agent name: orchestrator, marie, anga, or fabien
  message     - Message to send to the agent
  logs        - (Optional) Show cleaned logs after sending

Examples:
  $0 orchestrator "What are your capabilities?"
  $0 anga "Review the auth code" logs
  $0 marie "Evaluate student progress"
  $0 fabien "Create social media post" logs

EOF
    exit 1
fi

# Map agent name to container name
case "$AGENT_NAME" in
    orchestrator)
        CONTAINER="codehornets-orchestrator"
        DISPLAY_NAME="Orchestrator"
        ;;
    anga)
        CONTAINER="codehornets-worker-anga"
        DISPLAY_NAME="Anga (Coding Assistant)"
        ;;
    marie)
        CONTAINER="codehornets-worker-marie"
        DISPLAY_NAME="Marie (Dance Teacher)"
        ;;
    fabien)
        CONTAINER="codehornets-worker-fabien"
        DISPLAY_NAME="Fabien (Marketing Assistant)"
        ;;
    *)
        echo -e "${RED}Error: Unknown agent '$AGENT_NAME'${NC}"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}Error: Container ${CONTAINER} is not running${NC}"
    echo "Start it with: docker-compose up -d $AGENT_NAME"
    exit 1
fi

# Check if automation container is running
if ! docker ps --format '{{.Names}}' | grep -q "^codehornets-svc-automation$"; then
    echo -e "${RED}Error: Automation container is not running${NC}"
    echo "Start it with: docker-compose up -d automation"
    exit 1
fi

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Sending message to: ${DISPLAY_NAME}${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "Container: ${CONTAINER}"
echo -e "Message: ${MESSAGE}"
echo ""

# Use automation container's expect to send message to persistent session
docker exec codehornets-svc-automation sh -c "
expect <<'EXPECT_EOF'
set timeout 30
log_user 0

# Attach to agent container
spawn docker attach ${CONTAINER}
sleep 1

# Send the message directly (overwrites any placeholder text)
send \"${MESSAGE}\"
sleep 0.5

# Press Enter to submit
send \"\\r\"

# Wait for Claude to process and respond (10 seconds)
sleep 10

# Detach properly without stopping container (Ctrl+P Ctrl+Q)
send \"\\x10\\x11\"
sleep 0.5

expect eof
EXPECT_EOF
" 2>&1 | grep -v "spawn\|EXPECT_EOF" || true

echo -e "${GREEN}✓ Message sent to ${DISPLAY_NAME}${NC}"
echo ""

if [ "$SHOW_LOGS" = "logs" ]; then
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}Response (cleaned, last 60 lines):${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Get logs, strip ALL ANSI escape codes, filter empty lines
    docker logs ${CONTAINER} --tail 200 2>&1 | \
        sed 's/\x1b\[[0-9;]*[mGKHJhl]//g' | \
        sed 's/\x1b\[?[0-9]*[hl]//g' | \
        sed 's/\r//g' | \
        grep -v "^[[:space:]]*$" | \
        tail -60

    echo ""
else
    echo "To see the response with ANSI codes stripped:"
    echo "  $0 \"$AGENT_NAME\" \"$MESSAGE\" logs"
    echo ""
    echo "Or view raw logs:"
    echo "  docker logs ${CONTAINER} --tail 50"
fi
