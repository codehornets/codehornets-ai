#!/bin/bash
# Helper script to send messages using Method 2: Expect + Docker Attach
# This script uses the standalone Expect script

set -e

AGENT_NAME="$1"
MESSAGE="$2"

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$AGENT_NAME" ] || [ -z "$MESSAGE" ]; then
    cat <<EOF
${CYAN}════════════════════════════════════════════════════════════${NC}
  ${GREEN}Send Message via Expect + Docker Attach (Method 2)${NC}
${CYAN}════════════════════════════════════════════════════════════${NC}

Usage: $0 <agent> "message"

Arguments:
  agent    - Agent name: orchestrator, marie, anga, or fabien
  message  - Message to send

Examples:
  $0 anga "Please review the authentication code"
  $0 marie "Evaluate Emma's progress"
  $0 orchestrator "Task completed"

${CYAN}════════════════════════════════════════════════════════════${NC}
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
        DISPLAY_NAME="Anga 💻"
        ;;
    marie)
        CONTAINER="codehornets-worker-marie"
        DISPLAY_NAME="Marie 🩰"
        ;;
    fabien)
        CONTAINER="codehornets-worker-fabien"
        DISPLAY_NAME="Fabien 📈"
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown agent '$AGENT_NAME'${NC}"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Method 2: Expect + Docker Attach${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# Check if container is running
echo -n "Checking if ${DISPLAY_NAME} is running... "
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: Container ${CONTAINER} is not running${NC}"
    echo "Start it with: docker-compose up -d $AGENT_NAME"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check if expect is available
echo -n "Checking if expect is installed... "
if ! command -v expect &> /dev/null; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: expect is not installed${NC}"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install expect"
    echo "  Alpine: apk add expect"
    echo "  macOS: brew install expect"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check if docker is accessible
echo -n "Checking Docker access... "
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: Cannot access Docker${NC}"
    echo "Make sure Docker socket is mounted or you have permissions"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "Target: ${CYAN}${DISPLAY_NAME}${NC}"
echo -e "Container: ${CONTAINER}"
echo -e "Message: \"${MESSAGE}\""
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPECT_SCRIPT="${SCRIPT_DIR}/send-message-expect.exp"

# Check if expect script exists
if [ ! -f "$EXPECT_SCRIPT" ]; then
    echo -e "${RED}❌ Error: Expect script not found at ${EXPECT_SCRIPT}${NC}"
    exit 1
fi

# Make it executable
chmod +x "$EXPECT_SCRIPT"

# Run the expect script
echo -e "${YELLOW}⏳ Sending message...${NC}"
echo ""

if expect "$EXPECT_SCRIPT" "$CONTAINER" "$MESSAGE"; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}✅ Message delivered to ${DISPLAY_NAME}${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "To see the response:"
    echo "  docker logs ${CONTAINER} --tail 30"
    echo ""
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${RED}❌ Failed to deliver message${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check container logs: docker logs ${CONTAINER}"
    echo "  2. Verify container is running: docker ps | grep ${CONTAINER}"
    echo "  3. Try attaching manually: docker attach --no-stdin ${CONTAINER}"
    echo ""
    exit 1
fi
