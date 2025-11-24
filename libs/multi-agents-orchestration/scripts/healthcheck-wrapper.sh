#!/bin/bash
# healthcheck-wrapper.sh - Check if node-pty wrapper is healthy and sockets are available
#
# Exit codes:
# 0 - Healthy: sockets exist and are responsive
# 1 - Unhealthy: sockets missing or wrapper is not responding
#
# Usage:
#   healthcheck-wrapper.sh [agent_name]

AGENT_NAME="${1:-${AGENT_NAME:-worker}}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"

# Socket paths for this agent
INPUT_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.input.sock"
OUTPUT_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.output.sock"
CONTROL_SOCKET="${SOCKET_DIR}/${AGENT_NAME}.control.sock"

# Check 1: Verify at least the input socket exists
if [ ! -S "${INPUT_SOCKET}" ]; then
    echo "UNHEALTHY: Input socket not found at ${INPUT_SOCKET}"
    exit 1
fi

# Check 2: Verify heartbeat file exists and is recent
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
if [ -f "${HEARTBEAT_FILE}" ]; then
    # Get file modification time
    if command -v stat &> /dev/null; then
        FILE_AGE=$(($(date +%s) - $(stat -c %Y "${HEARTBEAT_FILE}" 2>/dev/null || echo 0)))
        if [ "${FILE_AGE}" -gt 60 ]; then
            echo "UNHEALTHY: Heartbeat is stale (${FILE_AGE}s old)"
            exit 1
        fi
    fi
else
    echo "WARNING: Heartbeat file not found"
fi

# Check 3: Test socket connectivity with timeout
# Try to connect to the control socket if it exists
if [ -S "${CONTROL_SOCKET}" ]; then
    # Send a ping command and expect a response
    RESPONSE=$(echo '{"type":"ping"}' | timeout 5 socat - UNIX-CONNECT:"${CONTROL_SOCKET}" 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "WARNING: Control socket not responding (may be normal during startup)"
    fi
fi

# Check 4: Verify the wrapper process is running
# Look for node process running the pty-wrapper
if pgrep -f "pty-wrapper.js.*${AGENT_NAME}" > /dev/null 2>&1; then
    echo "HEALTHY: PTY wrapper process is running"
elif pgrep -f "node.*claude" > /dev/null 2>&1; then
    echo "HEALTHY: Claude process is running (direct mode)"
else
    # Not necessarily unhealthy - might be running via socat fallback
    echo "WARNING: PTY wrapper process not found"
fi

# All critical checks passed
echo "HEALTHY: Wrapper communication is available for ${AGENT_NAME}"
exit 0
