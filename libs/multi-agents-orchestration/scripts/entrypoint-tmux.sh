#!/bin/bash
# entrypoint-tmux.sh - Start Claude CLI in a tmux session for persistent communication
# 
# This script creates a named tmux session that allows external processes to:
# - Send input via: tmux send-keys -t claude-session "message" Enter
# - Capture output via: tmux capture-pane -t claude-session -p
# - Monitor activity via: tmux list-sessions
#
# Benefits:
# - Persistent session survives process restarts
# - Full PTY support with proper terminal emulation
# - Easy to attach for debugging: tmux attach -t claude-session
# - Output scrollback buffer for history retrieval

set -e

AGENT_NAME="${1:-worker}"
TMUX_SESSION="${TMUX_SESSION:-claude-session}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"
LOG_DIR="${LOG_DIR:-/var/log}"

echo "========================================="
echo "CodeHornets AI Agent Startup (tmux mode)"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "Session: ${TMUX_SESSION}"
echo "Time: $(date -Iseconds)"
echo "========================================="

# Install Node.js dependencies for tools
if [ -f "/tools/package.json" ]; then
    echo "Installing Node.js dependencies..."
    cd /tools && npm install --quiet --no-audit --no-fund 2>/dev/null || echo "npm install skipped (may already be installed)"
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

# Create initial heartbeat with tmux strategy info
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
echo "Creating heartbeat: ${HEARTBEAT_FILE}"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "starting",
  "communication_strategy": "tmux",
  "tmux_session": "${TMUX_SESSION}",
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

# Kill any existing tmux session with the same name
tmux kill-session -t "${TMUX_SESSION}" 2>/dev/null || true

# Create the tmux session with custom options for better control
# -d: detached mode
# -s: session name
# -x/-y: initial window size (large to avoid wrapping issues)
echo "Creating tmux session: ${TMUX_SESSION}..."
tmux new-session -d -s "${TMUX_SESSION}" -x 200 -y 50

# Configure tmux session for Claude CLI communication
# - Increase scrollback buffer for output history
# - Set proper terminal settings
tmux set-option -t "${TMUX_SESSION}" history-limit 50000
tmux set-option -t "${TMUX_SESSION}" default-terminal "xterm-256color"

# Update heartbeat to indicate tmux session is ready
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "communication_strategy": "tmux",
  "tmux_session": "${TMUX_SESSION}",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "========================================="
echo "Agent ${AGENT_NAME} ready (tmux mode)"
echo "========================================="
echo ""
echo "Communication methods:"
echo "  Send input:    tmux send-keys -t ${TMUX_SESSION} 'your message' Enter"
echo "  Get output:    tmux capture-pane -t ${TMUX_SESSION} -p"
echo "  Attach:        tmux attach -t ${TMUX_SESSION}"
echo ""

# Start Claude CLI inside the tmux session
echo "Starting Claude CLI in tmux session..."
tmux send-keys -t "${TMUX_SESSION}" "claude --permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace" Enter

# Create a status file to indicate tmux session is running
echo "${TMUX_SESSION}" > "${SOCKET_DIR}/${AGENT_NAME}.tmux"

# Keep the container running and monitor the tmux session
echo "Monitoring tmux session..."
while true; do
    if ! tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
        echo "ERROR: tmux session ${TMUX_SESSION} died, restarting..."
        tmux new-session -d -s "${TMUX_SESSION}" -x 200 -y 50
        tmux set-option -t "${TMUX_SESSION}" history-limit 50000
        tmux send-keys -t "${TMUX_SESSION}" "claude --permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace" Enter
    fi
    
    # Update heartbeat
    cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "communication_strategy": "tmux",
  "tmux_session": "${TMUX_SESSION}",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF
    
    sleep 10
done
