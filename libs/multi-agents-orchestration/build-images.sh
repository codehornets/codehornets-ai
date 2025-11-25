#!/bin/bash
set -e

# Parse arguments
BUILD_MODE="${1:-standard}"

echo "========================================="
echo "Building CodeHornets AI Agent Images"
echo "========================================="
echo "Mode: $BUILD_MODE"
echo ""

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

# Build based on mode
if [ "$BUILD_MODE" = "pty" ]; then
    # PTY Wrapper Mode - builds images with node-pty support
    echo "Building PTY wrapper mode images..."
    echo ""

    # Build orchestrator image
    echo "[1/4] Building PTY orchestrator image..."
    docker build \
        -f libs/multi-agents-orchestration/dockerfiles/pty-orchestrator.Dockerfile \
        -t codehornets-pty-orchestrator:latest \
        .

    echo "PTY Orchestrator image built"
    echo ""

    # Build Marie image
    echo "[2/4] Building PTY marie image..."
    docker build \
        -f libs/multi-agents-orchestration/dockerfiles/pty-marie.Dockerfile \
        -t codehornets-pty-marie:latest \
        .

    echo "PTY Marie image built"
    echo ""

    # Build Anga image
    echo "[3/4] Building PTY anga image..."
    docker build \
        -f libs/multi-agents-orchestration/dockerfiles/pty-anga.Dockerfile \
        -t codehornets-pty-anga:latest \
        .

    echo "PTY Anga image built"
    echo ""

    # Build Fabien image
    echo "[4/4] Building PTY fabien image..."
    docker build \
        -f libs/multi-agents-orchestration/dockerfiles/pty-fabien.Dockerfile \
        -t codehornets-pty-fabien:latest \
        .

    echo "PTY Fabien image built"
    echo ""

    echo "========================================="
    echo "All PTY images built successfully!"
    echo "========================================="
    echo ""
    echo "Images created:"
    echo "  - codehornets-pty-orchestrator:latest"
    echo "  - codehornets-pty-marie:latest"
    echo "  - codehornets-pty-anga:latest"
    echo "  - codehornets-pty-fabien:latest"
    echo ""
    echo "To start: make pty-up"

else
    # Standard Mode - original images without PTY wrapper
    echo "Building standard mode images..."
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
fi
