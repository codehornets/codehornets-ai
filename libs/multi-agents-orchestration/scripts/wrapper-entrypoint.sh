#!/bin/bash
#
# PTY Wrapper Entrypoint Script
#
# Starts the PTY wrapper which then spawns Claude CLI.
# Handles graceful shutdown and signal forwarding.
#

set -e

AGENT_NAME="${1:-worker}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"

echo "========================================="
echo "PTY Wrapper Agent Startup"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "Time: $(date -Iseconds)"
echo "Socket: ${SOCKET_DIR}/${AGENT_NAME}.sock"
echo "========================================="

# Create PID file for tracking
PID_FILE="/tmp/${AGENT_NAME}-wrapper.pid"
echo $$ > "${PID_FILE}"

# Cleanup function
cleanup() {
    echo ""
    echo "[$(date -Iseconds)] Received shutdown signal, cleaning up..."

    # Kill wrapper process if running
    if [ -n "${WRAPPER_PID}" ] && kill -0 "${WRAPPER_PID}" 2>/dev/null; then
        echo "Stopping PTY wrapper (PID: ${WRAPPER_PID})..."
        kill -TERM "${WRAPPER_PID}" 2>/dev/null || true

        # Wait for graceful shutdown
        local count=0
        while kill -0 "${WRAPPER_PID}" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done

        # Force kill if still running
        if kill -0 "${WRAPPER_PID}" 2>/dev/null; then
            echo "Force killing wrapper..."
            kill -9 "${WRAPPER_PID}" 2>/dev/null || true
        fi
    fi

    # Remove socket file
    if [ -f "${SOCKET_DIR}/${AGENT_NAME}.sock" ]; then
        rm -f "${SOCKET_DIR}/${AGENT_NAME}.sock"
        echo "Removed socket file"
    fi

    # Remove PID file
    rm -f "${PID_FILE}"

    # Update heartbeat to stopped
    if [ -d "${HEARTBEAT_DIR}" ]; then
        cat > "${HEARTBEAT_DIR}/${AGENT_NAME}.json" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "stopped",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF
    fi

    echo "Cleanup complete"
    exit 0
}

# Setup signal handlers
trap cleanup SIGTERM SIGINT SIGHUP

# Install Node.js dependencies for tools
if [ -f "/tools/package.json" ]; then
    echo "Installing Node.js dependencies for tools..."
    cd /tools && npm install --quiet --no-audit --no-fund 2>/dev/null || echo "npm install skipped"
    cd /
fi

# Install PTY wrapper dependencies
if [ -f "/pty-wrapper/package.json" ]; then
    echo "Installing PTY wrapper dependencies..."
    cd /pty-wrapper && npm install --quiet --no-audit --no-fund || {
        echo "Error: Failed to install PTY wrapper dependencies"
        exit 1
    }
    cd /
fi

# Install make if not available
if ! command -v make &> /dev/null; then
    echo "Installing make..."
    apt-get update -qq && apt-get install -y -qq make 2>/dev/null || echo "make installation skipped"
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p "${HEARTBEAT_DIR}"
mkdir -p "${TRIGGER_DIR}/${AGENT_NAME}"
mkdir -p "${SOCKET_DIR}"
mkdir -p "/var/log"
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

# Create initial heartbeat
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
echo "Creating heartbeat: ${HEARTBEAT_FILE}"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "starting",
  "mode": "pty-wrapper",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

# Start file watcher in background if hooks are enabled
if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/monitoring/hook_watcher.js" ]; then
    echo "Starting trigger watcher for ${AGENT_NAME}..."
    node /tools/monitoring/hook_watcher.js "${AGENT_NAME}" >> "/var/log/${AGENT_NAME}-watcher.log" 2>&1 &
    WATCHER_PID=$!
    echo "  Watcher started (PID: ${WATCHER_PID})"
fi

# Start Redis message listener in background
if [ -f "/tools/monitoring/redis_message_listener.js" ]; then
    echo "Starting Redis message listener for ${AGENT_NAME}..."
    node /tools/monitoring/redis_message_listener.js "${AGENT_NAME}" >> "/var/log/${AGENT_NAME}-messages.log" 2>&1 &
    MESSAGE_LISTENER_PID=$!
    echo "  Message listener started (PID: ${MESSAGE_LISTENER_PID})"
fi

# Update heartbeat to active
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "mode": "pty-wrapper",
  "socket": "${SOCKET_DIR}/${AGENT_NAME}.sock",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "========================================="
echo "Agent ${AGENT_NAME} ready"
echo "========================================="
echo ""

# Set environment variables for wrapper
export AGENT_NAME="${AGENT_NAME}"
export SOCKET_DIR="${SOCKET_DIR}"
export SOCKET_PATH="${SOCKET_DIR}/${AGENT_NAME}.sock"
export CLAUDE_CLI="claude"
export CLAUDE_ARGS="--permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace"
export DEFAULT_TIMEOUT="${DEFAULT_TIMEOUT:-120000}"
export LOG_LEVEL="${LOG_LEVEL:-info}"

# Start PTY wrapper
echo "Starting PTY wrapper for ${AGENT_NAME}..."
echo "Socket path: ${SOCKET_PATH}"

cd /pty-wrapper
node src/wrapper.js &
WRAPPER_PID=$!

echo "PTY wrapper started (PID: ${WRAPPER_PID})"

# Update heartbeat with wrapper info
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "running",
  "mode": "pty-wrapper",
  "socket": "${SOCKET_PATH}",
  "wrapper_pid": ${WRAPPER_PID},
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

# Wait for wrapper to exit (should run indefinitely)
wait ${WRAPPER_PID}
WRAPPER_EXIT_CODE=$?

echo "PTY wrapper exited with code: ${WRAPPER_EXIT_CODE}"

# If wrapper exits unexpectedly, restart it
if [ ${WRAPPER_EXIT_CODE} -ne 0 ]; then
    echo "Wrapper exited unexpectedly, restarting in 5 seconds..."
    sleep 5
    exec "$0" "$@"
fi
