#!/bin/bash
# setup-communication.sh - Setup and validate communication infrastructure
#
# This script:
# 1. Detects available communication strategies
# 2. Creates necessary directories with proper permissions
# 3. Validates configuration
# 4. Provides recommendations
#
# Usage:
#   setup-communication.sh [check|setup|clean]

ACTION="${1:-check}"
SHARED_DIR="${SHARED_DIR:-./shared}"
SOCKET_DIR="${SOCKET_DIR:-${SHARED_DIR}/sockets}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}  CodeHornets AI Communication Setup${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
}

check_tmux() {
    echo -e "${CYAN}Checking tmux availability...${NC}"
    
    # Check if tmux is installed in containers
    if docker run --rm node:22-slim which tmux > /dev/null 2>&1; then
        echo -e "  ${GREEN}[OK]${NC} tmux is available in base image"
        return 0
    else
        echo -e "  ${YELLOW}[INFO]${NC} tmux will be installed during image build"
        return 0
    fi
}

check_socat() {
    echo -e "${CYAN}Checking socat availability...${NC}"
    
    if docker run --rm node:22-slim which socat > /dev/null 2>&1; then
        echo -e "  ${GREEN}[OK]${NC} socat is available in base image"
        return 0
    else
        echo -e "  ${YELLOW}[INFO]${NC} socat will be installed during image build"
        return 0
    fi
}

check_node_pty() {
    echo -e "${CYAN}Checking node-pty build requirements...${NC}"
    
    # Check for build tools
    if docker run --rm node:22-slim bash -c "which gcc && which g++ && which make" > /dev/null 2>&1; then
        echo -e "  ${YELLOW}[INFO]${NC} Build tools will be installed during image build"
    fi
    
    # node-gyp is needed for building node-pty
    echo -e "  ${YELLOW}[INFO]${NC} node-gyp will be installed globally in containers"
    
    return 0
}

check_directories() {
    echo -e "${CYAN}Checking directory structure...${NC}"
    
    local dirs=(
        "${SHARED_DIR}"
        "${SOCKET_DIR}"
        "${SHARED_DIR}/pipes"
        "${SHARED_DIR}/heartbeats"
        "${SHARED_DIR}/tasks"
        "${SHARED_DIR}/results"
        "${SHARED_DIR}/triggers"
        "${SHARED_DIR}/messages"
        "${SHARED_DIR}/inbox"
    )
    
    for dir in "${dirs[@]}"; do
        if [ -d "${dir}" ]; then
            echo -e "  ${GREEN}[OK]${NC} ${dir}"
        else
            echo -e "  ${YELLOW}[MISSING]${NC} ${dir}"
        fi
    done
}

check_permissions() {
    echo -e "${CYAN}Checking permissions...${NC}"
    
    if [ -d "${SOCKET_DIR}" ]; then
        PERMS=$(stat -c '%a' "${SOCKET_DIR}" 2>/dev/null || stat -f '%Lp' "${SOCKET_DIR}" 2>/dev/null)
        if [ "${PERMS}" = "755" ] || [ "${PERMS}" = "777" ]; then
            echo -e "  ${GREEN}[OK]${NC} Socket directory permissions: ${PERMS}"
        else
            echo -e "  ${YELLOW}[WARN]${NC} Socket directory permissions: ${PERMS} (recommended: 755)"
        fi
    fi
}

check_docker_compose() {
    echo -e "${CYAN}Checking Docker Compose configuration...${NC}"
    
    if [ -f "docker-compose.yml" ]; then
        echo -e "  ${GREEN}[OK]${NC} docker-compose.yml found"
        
        # Check for sockets volume
        if grep -q "sockets" docker-compose.yml; then
            echo -e "  ${GREEN}[OK]${NC} Sockets volume configured"
        else
            echo -e "  ${YELLOW}[MISSING]${NC} Sockets volume not configured"
        fi
        
        # Check for communication strategy env var
        if grep -q "COMMUNICATION_STRATEGY" docker-compose.yml; then
            echo -e "  ${GREEN}[OK]${NC} Communication strategy environment variable found"
        else
            echo -e "  ${YELLOW}[MISSING]${NC} COMMUNICATION_STRATEGY not configured"
        fi
    else
        echo -e "  ${RED}[ERROR]${NC} docker-compose.yml not found"
    fi
    
    # Check for override files
    if [ -f "docker-compose.tmux.yml" ]; then
        echo -e "  ${GREEN}[OK]${NC} docker-compose.tmux.yml found"
    else
        echo -e "  ${YELLOW}[MISSING]${NC} docker-compose.tmux.yml (optional)"
    fi
    
    if [ -f "docker-compose.wrapper.yml" ]; then
        echo -e "  ${GREEN}[OK]${NC} docker-compose.wrapper.yml found"
    else
        echo -e "  ${YELLOW}[MISSING]${NC} docker-compose.wrapper.yml (optional)"
    fi
}

setup_directories() {
    echo -e "${CYAN}Creating directories...${NC}"
    
    local dirs=(
        "${SHARED_DIR}"
        "${SOCKET_DIR}"
        "${SHARED_DIR}/pipes"
        "${SHARED_DIR}/heartbeats"
        "${SHARED_DIR}/tasks"
        "${SHARED_DIR}/results"
        "${SHARED_DIR}/triggers"
        "${SHARED_DIR}/messages"
        "${SHARED_DIR}/inbox"
        "${SHARED_DIR}/watcher-logs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "${dir}"
        echo -e "  ${GREEN}[CREATED]${NC} ${dir}"
    done
    
    # Set proper permissions on sockets directory
    chmod 755 "${SOCKET_DIR}"
    echo -e "  ${GREEN}[SET]${NC} Socket directory permissions: 755"
}

setup_agent_dirs() {
    echo -e "${CYAN}Creating agent-specific directories...${NC}"
    
    local agents=("orchestrator" "marie" "anga" "fabien")
    
    for agent in "${agents[@]}"; do
        mkdir -p "${SHARED_DIR}/tasks/${agent}"
        mkdir -p "${SHARED_DIR}/results/${agent}"
        mkdir -p "${SHARED_DIR}/triggers/${agent}"
        mkdir -p "${SHARED_DIR}/inbox/${agent}"
        mkdir -p "${SHARED_DIR}/auth-homes/${agent}"
        echo -e "  ${GREEN}[CREATED]${NC} Directories for ${agent}"
    done
}

clean_sockets() {
    echo -e "${CYAN}Cleaning up old sockets...${NC}"
    
    if [ -d "${SOCKET_DIR}" ]; then
        find "${SOCKET_DIR}" -name "*.sock" -type s -delete 2>/dev/null
        find "${SOCKET_DIR}" -name "*.tmux" -type f -delete 2>/dev/null
        find "${SOCKET_DIR}" -name "*.fifo" -type p -delete 2>/dev/null
        echo -e "  ${GREEN}[CLEANED]${NC} Old socket files removed"
    fi
}

print_recommendations() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}  Recommendations${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
    echo "1. To start with tmux strategy:"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.tmux.yml up -d"
    echo ""
    echo "2. To start with wrapper strategy:"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.wrapper.yml up -d"
    echo ""
    echo "3. To start with auto-detection (hybrid):"
    echo "   docker-compose up -d"
    echo ""
    echo "4. Using Make commands:"
    echo "   make up-tmux       # Start with tmux"
    echo "   make up-wrapper    # Start with wrapper"
    echo "   make status        # Check all agents"
    echo ""
}

# Main
print_header

case "${ACTION}" in
    check)
        check_tmux
        check_socat
        check_node_pty
        check_directories
        check_permissions
        check_docker_compose
        print_recommendations
        ;;
    setup)
        setup_directories
        setup_agent_dirs
        clean_sockets
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        print_recommendations
        ;;
    clean)
        clean_sockets
        echo -e "${GREEN}Cleanup complete!${NC}"
        ;;
    *)
        echo "Usage: $0 [check|setup|clean]"
        echo ""
        echo "  check  - Check communication infrastructure (default)"
        echo "  setup  - Create directories and set permissions"
        echo "  clean  - Clean up old socket files"
        exit 1
        ;;
esac

exit 0
