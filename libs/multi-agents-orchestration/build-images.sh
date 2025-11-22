#!/bin/bash
set -e

echo "========================================="
echo "Building CodeHornets AI Agent Images"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "Repository root: $REPO_ROOT"
echo ""

# Verify per-agent CLI files exist
CLI_DIR="libs/multi-agents-orchestration/cli-agents"
for agent in orchestrator marie anga fabien; do
    if [ ! -f "$CLI_DIR/${agent}-cli.js" ]; then
        echo "ERROR: $CLI_DIR/${agent}-cli.js not found!"
        exit 1
    fi
done

echo "All per-agent CLI files found"
echo ""

# Build orchestrator image
echo "[1/4] Building orchestrator image..."
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/orchestrator.Dockerfile \
    -t codehornets-orchestrator:latest \
    .

echo "Orchestrator image built"
echo ""

# Build Marie image
echo "[2/4] Building marie image..."
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/marie.Dockerfile \
    -t codehornets-marie:latest \
    .

echo "Marie image built"
echo ""

# Build Anga image
echo "[3/4] Building anga image..."
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/anga.Dockerfile \
    -t codehornets-anga:latest \
    .

echo "Anga image built"
echo ""

# Build Fabien image
echo "[4/4] Building fabien image..."
docker build \
    -f libs/multi-agents-orchestration/dockerfiles/fabien.Dockerfile \
    -t codehornets-fabien:latest \
    .

echo "Fabien image built"
echo ""

echo "========================================="
echo "All images built successfully!"
echo "========================================="
echo ""
echo "Images created:"
echo "  - codehornets-orchestrator:latest"
echo "  - codehornets-marie:latest"
echo "  - codehornets-anga:latest"
echo "  - codehornets-fabien:latest"
echo ""
echo "To start: make up"
