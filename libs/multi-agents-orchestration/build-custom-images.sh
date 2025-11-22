#!/bin/bash
set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Building CodeHornets AI Custom CLI Images${NC}"
echo -e "${CYAN}=========================================${NC}"

# Navigate to repo root for context
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo -e "${GREEN}Repository root: $REPO_ROOT${NC}"
echo ""

# Verify per-agent CLI files exist
CLI_DIR="libs/multi-agents-orchestration/cli-agents"
for agent in orchestrator marie anga fabien; do
    if [ ! -f "$CLI_DIR/${agent}-cli.js" ]; then
        echo -e "${RED}ERROR: $CLI_DIR/${agent}-cli.js not found!${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All per-agent CLI files found${NC}"
echo ""

# Build orchestrator image
echo -e "${YELLOW}[1/4] Building orchestrator-custom image...${NC}"
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/orchestrator-custom.Dockerfile \
    -t codehornets-orchestrator-custom:latest \
    .

echo -e "${GREEN}✓ Orchestrator image built${NC}"
echo ""

# Build Marie image
echo -e "${YELLOW}[2/4] Building marie-custom image...${NC}"
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/marie-custom.Dockerfile \
    -t codehornets-marie-custom:latest \
    .

echo -e "${GREEN}✓ Marie image built${NC}"
echo ""

# Build Anga image
echo -e "${YELLOW}[3/4] Building anga-custom image...${NC}"
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/anga-custom.Dockerfile \
    -t codehornets-anga-custom:latest \
    .

echo -e "${GREEN}✓ Anga image built${NC}"
echo ""

# Build Fabien image
echo -e "${YELLOW}[4/4] Building fabien-custom image...${NC}"
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/fabien-custom.Dockerfile \
    -t codehornets-fabien-custom:latest \
    .

echo -e "${GREEN}✓ Fabien image built${NC}"
echo ""

echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}✓ All custom images built successfully!${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "Images created:"
echo -e "  - codehornets-orchestrator-custom:latest"
echo -e "  - codehornets-marie-custom:latest"
echo -e "  - codehornets-anga-custom:latest"
echo -e "  - codehornets-fabien-custom:latest"
echo ""
echo -e "To start: ${CYAN}make up-custom${NC}"
