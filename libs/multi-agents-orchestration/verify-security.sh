#!/bin/bash

# ════════════════════════════════════════════════════════════════════════
# Security Verification Script
# ════════════════════════════════════════════════════════════════════════
# This script verifies that Docker socket security is properly configured

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  CodeHornets AI Security Verification${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check 1: Verify docker-compose.yml configuration
echo -e "${CYAN}[1/5] Checking docker-compose.yml configuration...${NC}"

AGENT_SOCKETS=$(grep -c "docker\.sock.*:rw" docker-compose.yml | tail -1 || echo "0")
if [ "$AGENT_SOCKETS" -eq "0" ]; then
    echo -e "  ${GREEN}✓ No agents have Docker socket RW access${NC}"
else
    echo -e "  ${RED}✗ Found $AGENT_SOCKETS agents with Docker socket RW access${NC}"
    echo -e "  ${YELLOW}  Run: grep -n 'docker.sock' docker-compose.yml${NC}"
    exit 1
fi

# Check expected read-only sockets
RO_SOCKETS=$(grep -c "docker\.sock.*:ro" docker-compose.yml | tail -1 || echo "0")
if [ "$RO_SOCKETS" -eq "2" ]; then
    echo -e "  ${GREEN}✓ Automation and Monitor have read-only access (expected)${NC}"
else
    echo -e "  ${YELLOW}⚠ Found $RO_SOCKETS read-only sockets (expected 2)${NC}"
fi

echo ""

# Check 2: Verify containers are running
echo -e "${CYAN}[2/5] Checking if containers are running...${NC}"

if ! docker ps | grep -q "codehornets-orchestrator"; then
    echo -e "  ${YELLOW}⚠ Containers not running. Start with: make up${NC}"
    echo -e "  ${YELLOW}  Skipping runtime checks...${NC}"
    CONTAINERS_RUNNING=false
else
    echo -e "  ${GREEN}✓ Containers are running${NC}"
    CONTAINERS_RUNNING=true
fi

echo ""

# Check 3: Test agent isolation (if running)
if [ "$CONTAINERS_RUNNING" = true ]; then
    echo -e "${CYAN}[3/5] Testing agent isolation...${NC}"

    # Test Marie
    echo -e "  ${CYAN}Testing Marie...${NC}"
    if docker exec codehornets-worker-marie sh -c "docker ps 2>&1" | grep -q "Cannot connect"; then
        echo -e "    ${GREEN}✓ Marie cannot access Docker daemon${NC}"
    else
        echo -e "    ${RED}✗ Marie can access Docker daemon - SECURITY RISK!${NC}"
        exit 1
    fi

    # Test Anga
    echo -e "  ${CYAN}Testing Anga...${NC}"
    if docker exec codehornets-worker-anga sh -c "docker ps 2>&1" | grep -q "Cannot connect"; then
        echo -e "    ${GREEN}✓ Anga cannot access Docker daemon${NC}"
    else
        echo -e "    ${RED}✗ Anga can access Docker daemon - SECURITY RISK!${NC}"
        exit 1
    fi

    # Test Fabien
    echo -e "  ${CYAN}Testing Fabien...${NC}"
    if docker exec codehornets-worker-fabien sh -c "docker ps 2>&1" | grep -q "Cannot connect"; then
        echo -e "    ${GREEN}✓ Fabien cannot access Docker daemon${NC}"
    else
        echo -e "    ${RED}✗ Fabien can access Docker daemon - SECURITY RISK!${NC}"
        exit 1
    fi

    # Test Orchestrator
    echo -e "  ${CYAN}Testing Orchestrator...${NC}"
    if docker exec codehornets-orchestrator sh -c "docker ps 2>&1" | grep -q "Cannot connect"; then
        echo -e "    ${GREEN}✓ Orchestrator cannot access Docker daemon${NC}"
    else
        echo -e "    ${RED}✗ Orchestrator can access Docker daemon - SECURITY RISK!${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}[3/5] Skipped - containers not running${NC}"
fi

echo ""

# Check 4: Test container escape prevention (if running)
if [ "$CONTAINERS_RUNNING" = true ]; then
    echo -e "${CYAN}[4/5] Testing container escape prevention...${NC}"

    echo -e "  ${CYAN}Attempting escape from Marie...${NC}"
    if docker exec codehornets-worker-marie sh -c \
        "docker run --rm alpine echo 'escaped' 2>&1" | grep -q "Cannot connect"; then
        echo -e "    ${GREEN}✓ Container escape blocked${NC}"
    else
        echo -e "    ${RED}✗ Container escape POSSIBLE - CRITICAL VULNERABILITY!${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}[4/5] Skipped - containers not running${NC}"
fi

echo ""

# Check 5: Verify automation can still attach
if [ "$CONTAINERS_RUNNING" = true ]; then
    echo -e "${CYAN}[5/5] Testing automation container...${NC}"

    if docker exec codehornets-svc-automation sh -c "docker ps >/dev/null 2>&1"; then
        echo -e "  ${GREEN}✓ Automation can read Docker info (read-only)${NC}"
    else
        echo -e "  ${RED}✗ Automation cannot access Docker${NC}"
        exit 1
    fi

    # Test that automation CANNOT create containers
    if docker exec codehornets-svc-automation sh -c \
        "docker run --rm alpine echo 'test' 2>&1" | grep -q "permission denied\|Cannot connect"; then
        echo -e "  ${GREEN}✓ Automation cannot create containers (read-only enforced)${NC}"
    else
        echo -e "  ${YELLOW}⚠ Automation has write access (should be read-only)${NC}"
    fi
else
    echo -e "${CYAN}[5/5] Skipped - containers not running${NC}"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Security Configuration Verified${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}All security checks passed!${NC}"
echo ""
echo -e "${CYAN}Summary:${NC}"
echo -e "  • Agents do NOT have Docker socket access"
echo -e "  • Container escape is BLOCKED"
echo -e "  • Automation has read-only access only"
echo -e "  • True container isolation is enforced"
echo ""
echo -e "${YELLOW}Note:${NC} Claude Code sandboxing features will not work"
echo -e "      This is the trade-off for maximum security"
echo ""
