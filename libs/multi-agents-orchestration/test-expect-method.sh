#!/bin/bash
# Test script for Method 2: Expect + Docker Attach
# Demonstrates how to send messages between containers

set -e

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

cat <<EOF
${CYAN}════════════════════════════════════════════════════════════${NC}
  ${GREEN}Method 2: Expect + Docker Attach Test${NC}
${CYAN}════════════════════════════════════════════════════════════${NC}

This script demonstrates how to send messages from one container
to another using the Expect + Docker Attach method.

${CYAN}════════════════════════════════════════════════════════════${NC}
EOF

# Check prerequisites
echo ""
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo ""

echo -n "  • Docker is accessible... "
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: Cannot access Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

echo -n "  • Containers are running... "
RUNNING_CONTAINERS=$(docker ps --format '{{.Names}}' | grep codehornets | wc -l)
if [ "$RUNNING_CONTAINERS" -lt 2 ]; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: Need at least 2 containers running${NC}"
    echo "Start them with: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓${NC} ($RUNNING_CONTAINERS containers)"

echo -n "  • Automation container is running... "
if ! docker ps --format '{{.Names}}' | grep -q "codehornets-svc-automation"; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: Automation container is not running${NC}"
    echo "Start it with: docker-compose up -d automation"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

echo -n "  • Expect is installed in automation container... "
if ! docker exec codehornets-svc-automation command -v expect &> /dev/null; then
    echo -e "${RED}❌${NC}"
    echo -e "${RED}Error: expect is not installed${NC}"
    echo "Installing expect..."
    docker exec codehornets-svc-automation apk add --no-cache expect
fi
echo -e "${GREEN}✓${NC}"

# List available agents
echo ""
echo -e "${BLUE}Step 2: Available Agents${NC}"
echo ""

docker ps --format 'table {{.Names}}\t{{.Status}}' | grep codehornets | while read line; do
    echo "  • $line"
done

# Test scenarios
echo ""
echo -e "${BLUE}Step 3: Test Scenarios${NC}"
echo ""

echo -e "${YELLOW}Choose a test scenario:${NC}"
echo ""
echo "  1) Send message from orchestrator to anga"
echo "  2) Send message from any container to marie"
echo "  3) Send message from any container to fabien"
echo "  4) Custom: Choose sender and receiver"
echo "  5) Exit"
echo ""
echo -n "Enter your choice (1-5): "
read choice

case $choice in
    1)
        SENDER="orchestrator"
        RECEIVER="anga"
        MESSAGE="Hello Anga! Can you review the authentication code in /workspace/api/auth?"
        ;;
    2)
        SENDER="orchestrator"
        RECEIVER="marie"
        MESSAGE="Hello Marie! Please evaluate Emma Rodriguez's progress this week."
        ;;
    3)
        SENDER="orchestrator"
        RECEIVER="fabien"
        MESSAGE="Hello Fabien! Can you create a social media post for the upcoming recital?"
        ;;
    4)
        echo ""
        echo -n "Sender agent (orchestrator/marie/anga/fabien): "
        read SENDER
        echo -n "Receiver agent (orchestrator/marie/anga/fabien): "
        read RECEIVER
        echo -n "Message: "
        read MESSAGE
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Map sender to container
case "$SENDER" in
    orchestrator)
        SENDER_CONTAINER="codehornets-orchestrator"
        ;;
    anga)
        SENDER_CONTAINER="codehornets-worker-anga"
        ;;
    marie)
        SENDER_CONTAINER="codehornets-worker-marie"
        ;;
    fabien)
        SENDER_CONTAINER="codehornets-worker-fabien"
        ;;
    *)
        echo -e "${RED}Invalid sender agent${NC}"
        exit 1
        ;;
esac

# Verify containers are running
if ! docker ps --format '{{.Names}}' | grep -q "^${SENDER_CONTAINER}$"; then
    echo -e "${RED}Error: Sender container ${SENDER_CONTAINER} is not running${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 4: Sending Message${NC}"
echo ""
echo -e "  From: ${CYAN}${SENDER}${NC}"
echo -e "  To: ${CYAN}${RECEIVER}${NC}"
echo -e "  Message: \"${MESSAGE}\""
echo ""

# Copy expect script to sender container
echo "Copying expect script to sender container..."
docker cp scripts/send-message-expect.exp ${SENDER_CONTAINER}:/tmp/

# Execute from sender container
echo ""
echo -e "${YELLOW}⏳ Executing message send...${NC}"
echo ""

# Method 2: Run expect from automation container
docker exec codehornets-svc-automation sh -c "
cat > /tmp/send-msg.exp <<'EXPECT_SCRIPT'
#!/usr/bin/expect -f
set timeout 30
log_user 0

set receiver \"${RECEIVER}\"
set message \"${MESSAGE}\"

# Map to container name
switch \$receiver {
    \"orchestrator\" { set container \"codehornets-orchestrator\" }
    \"anga\" { set container \"codehornets-worker-anga\" }
    \"marie\" { set container \"codehornets-worker-marie\" }
    \"fabien\" { set container \"codehornets-worker-fabien\" }
    default {
        puts \"Invalid receiver\"
        exit 1
    }
}

puts \"\"
puts \"════════════════════════════════════════════════════════════\"
puts \"📤 Docker Attach + Expect Message Send\"
puts \"════════════════════════════════════════════════════════════\"
puts \"Container: \$container\"
puts \"Message: \$message\"
puts \"\"

# Spawn docker attach
spawn docker attach --no-stdin \$container

# Wait for ready
expect {
    -re \".+\" {
        puts \"✓ Container responsive\"
    }
    timeout {
        puts \"❌ Timeout\"
        exit 1
    }
}

sleep 0.5

# Send message
send \"\$message\"
puts \"✓ Message sent\"

sleep 0.5

# Submit
send \"\\r\"
puts \"✓ Enter pressed\"

# Wait for processing
puts \"⏳ Waiting for processing...\"
sleep 10

# Detach
send \"\\x10\\x11\"
puts \"✓ Detached\"

sleep 0.5

puts \"\"
puts \"════════════════════════════════════════════════════════════\"
puts \"✅ Message delivered!\"
puts \"════════════════════════════════════════════════════════════\"
puts \"\"

exit 0
EXPECT_SCRIPT

chmod +x /tmp/send-msg.exp
expect /tmp/send-msg.exp
"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}✅ Test Completed Successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "To verify message was received:"
    echo "  docker logs codehornets-worker-${RECEIVER} --tail 30"
    echo ""
    echo "To send more messages:"
    echo "  bash scripts/send-via-expect.sh ${RECEIVER} \"Your message\""
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${RED}❌ Test Failed${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Check logs for details:"
    echo "  docker logs ${SENDER_CONTAINER} --tail 20"
    echo "  docker logs codehornets-worker-${RECEIVER} --tail 20"
fi

echo ""
