#!/bin/bash
# Script to apply Docker socket permissions fix and verify it works
# Run this from the multi-agents-orchestration directory

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Applying Docker Socket Permissions Fix${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Verify we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the multi-agents-orchestration directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verifying docker-compose.yml changes...${NC}"
if grep -q 'group_add:' docker-compose.yml && \
   grep -A1 "# Marie" docker-compose.yml | grep -q '"0"'; then
    echo -e "${GREEN}✓ docker-compose.yml has been updated with the fix${NC}"
else
    echo -e "${RED}✗ docker-compose.yml doesn't have the required changes${NC}"
    echo "Please ensure the file has been modified with group_add: [\"0\", \"1001\"]"
    exit 1
fi
echo ""

# Step 2: Stop containers
echo -e "${YELLOW}Step 2: Stopping all containers...${NC}"
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 3: Restart containers
echo -e "${YELLOW}Step 3: Starting containers with new configuration...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Step 4: Wait for containers to be ready
echo -e "${YELLOW}Step 4: Waiting for containers to be ready...${NC}"
sleep 5
echo -e "${GREEN}✓ Containers should be ready${NC}"
echo ""

# Step 5: Verify Docker socket access
echo -e "${YELLOW}Step 5: Testing Docker socket access on all agents...${NC}"
echo ""

# Make test script executable
chmod +x test-docker-access.sh

# Run the test script
if bash test-docker-access.sh; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ Fix Applied Successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "All agents now have Docker socket access and can communicate!"
    echo ""
    echo "Next steps:"
    echo "  1. Test agent messaging:"
    echo "     bash tools/send_agent_message.sh anga \"Test message\" logs"
    echo ""
    echo "  2. View container logs:"
    echo "     docker-compose logs -f orchestrator"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  ✗ Fix Failed${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Some agents still don't have Docker socket access."
    echo "Please check the logs above for details."
    echo ""
    exit 1
fi
