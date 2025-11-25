#!/bin/bash
# Test Docker socket access for all CodeHornets agents
# This script verifies that all agents can execute docker commands

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Testing Docker Socket Access for All Agents${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Array of agents to test
AGENTS=(
    "codehornets-orchestrator:Orchestrator"
    "codehornets-worker-marie:Marie (Dance Teacher)"
    "codehornets-worker-anga:Anga (Coding Assistant)"
    "codehornets-worker-fabien:Fabien (Marketing Assistant)"
)

FAILED=0
PASSED=0

for agent_entry in "${AGENTS[@]}"; do
    IFS=':' read -r container display_name <<< "$agent_entry"

    echo -e "${YELLOW}Testing: ${display_name}${NC}"
    echo -e "Container: ${container}"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${RED}  ✗ Container not running${NC}"
        echo ""
        FAILED=$((FAILED + 1))
        continue
    fi

    # Test 1: Check groups
    echo -n "  Checking groups... "
    GROUPS_OUTPUT=$(docker exec "$container" sh -c "groups 2>&1" || echo "FAILED")
    if echo "$GROUPS_OUTPUT" | grep -q "root"; then
        echo -e "${GREEN}✓ (has root group)${NC}"
    else
        echo -e "${RED}✗ Missing root group${NC}"
        echo "    Output: $GROUPS_OUTPUT"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi

    # Test 2: Check Docker socket permissions
    echo -n "  Checking socket permissions... "
    SOCKET_PERMS=$(docker exec "$container" sh -c "ls -la /var/run/docker.sock 2>&1" || echo "FAILED")
    if echo "$SOCKET_PERMS" | grep -q "docker.sock"; then
        echo -e "${GREEN}✓${NC}"
        echo "    $SOCKET_PERMS"
    else
        echo -e "${RED}✗ Socket not accessible${NC}"
        FAILED=$((FAILED + 1))
        echo ""
        continue
    fi

    # Test 3: Test docker ps command
    echo -n "  Testing 'docker ps' command... "
    DOCKER_PS_OUTPUT=$(docker exec "$container" sh -c "docker ps --format '{{.Names}}' 2>&1" || echo "FAILED")
    if [ "$DOCKER_PS_OUTPUT" = "FAILED" ] || echo "$DOCKER_PS_OUTPUT" | grep -q "permission denied"; then
        echo -e "${RED}✗ Permission denied${NC}"
        echo "    Error: $DOCKER_PS_OUTPUT"
        FAILED=$((FAILED + 1))
    else
        # Count containers visible
        CONTAINER_COUNT=$(echo "$DOCKER_PS_OUTPUT" | wc -l)
        echo -e "${GREEN}✓ Can see ${CONTAINER_COUNT} containers${NC}"
        PASSED=$((PASSED + 1))
    fi

    echo ""
done

# Summary
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Test Summary${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All agents have Docker socket access!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some agents failed Docker socket access tests${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Stop all containers: docker-compose down"
    echo "  2. Restart with new configuration: docker-compose up -d"
    echo "  3. Re-run this test: bash test-docker-access.sh"
    exit 1
fi
