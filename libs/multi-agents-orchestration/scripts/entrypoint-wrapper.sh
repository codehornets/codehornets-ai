#!/bin/bash
# entrypoint-wrapper.sh - Start Claude CLI via node-pty wrapper for socket-based communication
#
# This script starts Claude CLI through a Node.js wrapper that exposes:
# - Unix socket for sending input
# - Unix socket for receiving output
# - JSON-based communication protocol
#
# Benefits:
# - Programmatic control via sockets
# - Structured JSON communication
# - Better integration with Node.js orchestration tools
# - Real-time output streaming

set -e

AGENT_NAME="${1:-worker}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"
LOG_DIR="${LOG_DIR:-/var/log}"

# Socket paths for this agent
INPUT_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.input.sock"
OUTPUT_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.output.sock"
CONTROL_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.control.sock"

echo "========================================="
echo "CodeHornets AI Agent Startup (wrapper mode)"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "Input Socket: ${INPUT_SOCKET}"
echo "Output Socket: ${OUTPUT_SOCKET}"
echo "Time: $(date -Iseconds)"
echo "========================================="

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

# Clean up old sockets
rm -f "${INPUT_SOCKET}" "${OUTPUT_SOCKET}" "${CONTROL_SOCKET}" 2>/dev/null || true

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

# Create initial heartbeat
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
echo "Creating heartbeat: ${HEARTBEAT_FILE}"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "starting",
  "communication_strategy": "wrapper",
  "input_socket": "${INPUT_SOCKET}",
  "output_socket": "${OUTPUT_SOCKET}",
  "control_socket": "${CONTROL_SOCKET}",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

# Start file watcher in background if hooks are enabled
if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/monitoring/hook_watcher.js" ]; then
    echo "Starting trigger watcher for ${AGENT_NAME}..."
    node /tools/monitoring/hook_watcher.js "${AGENT_NAME}" >> "${LOG_DIR}/${AGENT_NAME}-watcher.log" 2>&1 &
    WATCHER_PID=$!
    echo "Watcher started (PID: ${WATCHER_PID})"
fi

# Start Redis message listener in background
if [ -f "/tools/monitoring/redis_message_listener.js" ]; then
    echo "Starting Redis message listener for ${AGENT_NAME}..."
    node /tools/monitoring/redis_message_listener.js "${AGENT_NAME}" >> "${LOG_DIR}/${AGENT_NAME}-messages.log" 2>&1 &
    MESSAGE_LISTENER_PID=$!
    echo "Message listener started (PID: ${MESSAGE_LISTENER_PID})"
fi

# Update heartbeat to active
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "communication_strategy": "wrapper",
  "input_socket": "${INPUT_SOCKET}",
  "output_socket": "${OUTPUT_SOCKET}",
  "control_socket": "${CONTROL_SOCKET}",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "========================================="
echo "Agent ${AGENT_NAME} ready (wrapper mode)"
echo "========================================="
echo ""
echo "Communication methods:"
echo "  Send input:    echo 'message' | socat - UNIX-CONNECT:${INPUT_SOCKET}"
echo "  Get output:    socat - UNIX-CONNECT:${OUTPUT_SOCKET}"
echo ""

# Check if the wrapper script exists
WRAPPER_SCRIPT="/tools/communication/pty-wrapper.js"
if [ -f "${WRAPPER_SCRIPT}" ]; then
    echo "Starting Claude CLI via node-pty wrapper..."
    exec node "${WRAPPER_SCRIPT}" \
        --agent "${AGENT_NAME}" \
        --input-socket "${INPUT_SOCKET}" \
        --output-socket "${OUTPUT_SOCKET}" \
        --control-socket "${CONTROL_SOCKET}" \
        --command "claude" \
        --args "--permission-mode,bypassPermissions,--add-dir,/tasks,--add-dir,/results,--add-dir,/home/agent/workspace"
else
    echo "Warning: PTY wrapper not found at ${WRAPPER_SCRIPT}"
    echo "Falling back to socat-based socket communication..."
    
    # Create a simple socat-based socket bridge
    # This provides basic socket communication without full PTY support
    
    # Create input socket that forwards to Claude's stdin
    mkfifo "${SOCKET_DIR}/${AGENT_NAME}.fifo" 2>/dev/null || true
    
    # Start Claude CLI with input from FIFO
    claude --permission-mode bypassPermissions \
        --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace \
        < "${SOCKET_DIR}/${AGENT_NAME}.fifo" &
    CLAUDE_PID=$!
    
    # Start socat to accept connections and forward to FIFO
    socat UNIX-LISTEN:"${INPUT_SOCKET}",fork OPEN:"${SOCKET_DIR}/${AGENT_NAME}.fifo",wronly &
    SOCAT_PID=$!
    
    echo "Started Claude (PID: ${CLAUDE_PID}) with socat bridge (PID: ${SOCAT_PID})"
    
    # Wait for Claude to exit
    wait ${CLAUDE_PID}
fi
