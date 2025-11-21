#!/bin/bash
# Build all CodeHornets AI agent images

set -e

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}CodeHornets AI - Build Agent Images${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKERFILE_DIR="${SCRIPT_DIR}/dockerfiles"

# Check if Dockerfiles exist
if [ ! -d "$DOCKERFILE_DIR" ]; then
    echo -e "${RED}Error: Dockerfiles directory not found at ${DOCKERFILE_DIR}${NC}"
    exit 1
fi

# Build order (base first, then specialized)
IMAGES=(
    "base"
    "orchestrator"
    "anga"
    "marie"
    "fabien"
)

# Parse arguments
BUILD_ALL=true
BUILD_SPECIFIC=""
NO_CACHE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --agent)
            BUILD_ALL=false
            BUILD_SPECIFIC="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --no-cache        Build without using cache"
            echo "  --agent <name>    Build specific agent (base, orchestrator, anga, marie, fabien)"
            echo "  --help            Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                        # Build all images"
            echo "  $0 --no-cache             # Build all without cache"
            echo "  $0 --agent anga           # Build only anga image"
            echo "  $0 --agent base --no-cache  # Rebuild base without cache"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build function
build_image() {
    local name=$1
    local dockerfile="${DOCKERFILE_DIR}/${name}.Dockerfile"
    local tag="codehornets-${name}:latest"

    if [ "$name" = "base" ]; then
        tag="codehornets-base:latest"
    fi

    echo ""
    echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
    echo -e "  ${YELLOW}Building: ${tag}${NC}"
    echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
    echo -e "Dockerfile: ${dockerfile}"
    echo ""

    if [ ! -f "$dockerfile" ]; then
        echo -e "${RED}Error: Dockerfile not found: ${dockerfile}${NC}"
        return 1
    fi

    # Build the image
    if docker build $NO_CACHE -f "$dockerfile" -t "$tag" "$SCRIPT_DIR"; then
        echo ""
        echo -e "${GREEN}✓ Successfully built: ${tag}${NC}"

        # Show image size
        SIZE=$(docker images --format "{{.Size}}" "$tag" | head -1)
        echo -e "  Image size: ${SIZE}"

        return 0
    else
        echo ""
        echo -e "${RED}✗ Failed to build: ${tag}${NC}"
        return 1
    fi
}

# Build images
if [ "$BUILD_ALL" = true ]; then
    echo "Building all images in order..."
    echo ""

    FAILED=()

    for image in "${IMAGES[@]}"; do
        if ! build_image "$image"; then
            FAILED+=("$image")
        fi
    done

    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

    if [ ${#FAILED[@]} -eq 0 ]; then
        echo -e "  ${GREEN}✓ All images built successfully!${NC}"
    else
        echo -e "  ${RED}✗ Failed to build: ${FAILED[*]}${NC}"
    fi

    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Show all built images
    echo "Built images:"
    docker images | grep codehornets | head -5

else
    # Build specific image
    if [[ ! " ${IMAGES[@]} " =~ " ${BUILD_SPECIFIC} " ]]; then
        echo -e "${RED}Error: Unknown agent '${BUILD_SPECIFIC}'${NC}"
        echo "Valid agents: ${IMAGES[*]}"
        exit 1
    fi

    # If building a specialized agent, ensure base is built
    if [ "$BUILD_SPECIFIC" != "base" ]; then
        if ! docker images | grep -q "codehornets-base"; then
            echo -e "${YELLOW}Base image not found, building it first...${NC}"
            build_image "base" || exit 1
        fi
    fi

    build_image "$BUILD_SPECIFIC"
fi

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml to use custom images"
echo "  2. Run: docker-compose down && docker-compose up -d"
echo ""
