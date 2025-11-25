#!/bin/bash
# entrypoint-hybrid.sh - Auto-detect best communication strategy and start Claude CLI
#
# This script automatically detects the best available communication strategy:
# 1. node-pty wrapper (if available and working)
# 2. tmux (fallback for persistent sessions)
# 3. Direct execution (last resort)
#
# The strategy can also be forced via COMMUNICATION_STRATEGY environment variable:
# - COMMUNICATION_STRATEGY=tmux
# - COMMUNICATION_STRATEGY=wrapper
# - COMMUNICATION_STRATEGY=direct
# - COMMUNICATION_STRATEGY=auto (default)

set -e

AGENT_NAME="${1:-worker}"
COMMUNICATION_STRATEGY="${COMMUNICATION_STRATEGY:-auto}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"
LOG_DIR="${LOG_DIR:-/var/log}"

echo "========================================="
echo "CodeHornets AI Agent Startup (hybrid mode)"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "Requested Strategy: ${COMMUNICATION_STRATEGY}"
echo "Time: $(date -Iseconds)"
echo "========================================="

# Function to check if node-pty wrapper is available and working
check_wrapper_available() {
    local wrapper_script="/tools/communication/pty-wrapper.js"
    
    # Check if wrapper script exists
    if [ ! -f "${wrapper_script}" ]; then
        echo "Wrapper script not found at ${wrapper_script}"
        return 1
    fi
    
    # Check if node-pty module is installed
    if ! node -e "require('node-pty')" 2>/dev/null; then
        echo "node-pty module not available"
        return 1
    fi
    
    echo "node-pty wrapper is available"
    return 0
}

# Function to check if tmux is available and working
check_tmux_available() {
    if ! command -v tmux &> /dev/null; then
        echo "tmux not found"
        return 1
    fi
    
    # Test if tmux can create a session
    if ! tmux new-session -d -s "test-session-$$" 2>/dev/null; then
        echo "tmux cannot create sessions"
        return 1
    fi
    tmux kill-session -t "test-session-$$" 2>/dev/null || true
    
    echo "tmux is available"
    return 0
}

# Determine the best strategy
determine_strategy() {
    case "${COMMUNICATION_STRATEGY}" in
        wrapper)
            if check_wrapper_available; then
                echo "wrapper"
            else
                echo "Using wrapper strategy failed, falling back to tmux"
                echo "tmux"
            fi
            ;;
        tmux)
            if check_tmux_available; then
                echo "tmux"
            else
                echo "Using tmux strategy failed, falling back to direct"
                echo "direct"
            fi
            ;;
        direct)
            echo "direct"
            ;;
        auto|*)
            # Auto-detect: prefer wrapper, then tmux, then direct
            if check_wrapper_available; then
                echo "wrapper"
            elif check_tmux_available; then
                echo "tmux"
            else
                echo "direct"
            fi
            ;;
    esac
}

# Common setup tasks
common_setup() {
    # Install Node.js dependencies for tools
    if [ -f "/tools/package.json" ]; then
        echo "Installing Node.js dependencies..."
        cd /tools && npm install --quiet --no-audit --no-fund 2>/dev/null || echo "npm install skipped"
        cd /
    fi
    
    # Install make for Makefile support
    if ! command -v make &> /dev/null; then
        echo "Installing make..."
        apt-get update -qq && apt-get install -y -qq make 2>/dev/null || echo "make installation skipped"
    fi
    
    # Create necessary directories
    echo "Creating directories..."
    mkdir -p "${HEARTBEAT_DIR}"
    mkdir -p "${TRIGGER_DIR}/${AGENT_NAME}"
    mkdir -p "${SOCKET_DIR}"
    mkdir -p "${LOG_DIR}"
    mkdir -p "/home/agent/.claude/hooks"
    
    # Copy worker prompt as CLAUDE.md
    if [ -f "/prompts/${AGENT_NAME}.md" ]; then
        echo "Loading ${AGENT_NAME} prompt..."
        cp "/prompts/${AGENT_NAME}.md" "/home/agent/.claude/CLAUDE.md"
    else
        echo "Warning: No prompt found at /prompts/${AGENT_NAME}.md"
    fi
    
    # Copy hooks configuration
    if [ -f "/hooks-config/${AGENT_NAME}-hooks.json" ]; then
        echo "Loading ${AGENT_NAME} hooks configuration..."
        cp "/hooks-config/${AGENT_NAME}-hooks.json" "/home/agent/.claude/hooks.json"
    else
        echo "Warning: No hooks config found at /hooks-config/${AGENT_NAME}-hooks.json"
    fi
    
    # Start file watcher in background if hooks are enabled
    if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/monitoring/hook_watcher.js" ]; then
        echo "Starting trigger watcher for ${AGENT_NAME}..."
        node /tools/monitoring/hook_watcher.js "${AGENT_NAME}" >> "${LOG_DIR}/${AGENT_NAME}-watcher.log" 2>&1 &
        echo "Watcher started"
    fi
    
    # Start Redis message listener in background
    if [ -f "/tools/monitoring/redis_message_listener.js" ]; then
        echo "Starting Redis message listener for ${AGENT_NAME}..."
        node /tools/monitoring/redis_message_listener.js "${AGENT_NAME}" >> "${LOG_DIR}/${AGENT_NAME}-messages.log" 2>&1 &
        echo "Message listener started"
    fi
}

# Run common setup
common_setup

# Determine and use the best strategy
DETECTED_STRATEGY=$(determine_strategy)
echo ""
echo "Using communication strategy: ${DETECTED_STRATEGY}"
echo ""

# Create heartbeat with strategy info
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "starting",
  "communication_strategy": "${DETECTED_STRATEGY}",
  "requested_strategy": "${COMMUNICATION_STRATEGY}",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

case "${DETECTED_STRATEGY}" in
    wrapper)
        echo "Delegating to wrapper entrypoint..."
        exec /scripts/entrypoint-wrapper.sh "${AGENT_NAME}"
        ;;
    tmux)
        echo "Delegating to tmux entrypoint..."
        exec /scripts/entrypoint-tmux.sh "${AGENT_NAME}"
        ;;
    direct)
        echo "Using direct execution (limited communication support)..."
        # Update heartbeat
        cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "communication_strategy": "direct",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF
        echo "========================================="
        echo "Agent ${AGENT_NAME} ready (direct mode)"
        echo "========================================="
        # Start Claude CLI directly
        exec claude --permission-mode bypassPermissions \
            --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace
        ;;
esac
