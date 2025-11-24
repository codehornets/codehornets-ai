#!/bin/bash
# healthcheck-tmux.sh - Check if tmux session is healthy and Claude is responsive
#
# Exit codes:
# 0 - Healthy: tmux session exists and Claude is running
# 1 - Unhealthy: tmux session missing or Claude is not responding
#
# Usage:
#   healthcheck-tmux.sh [agent_name] [session_name]

AGENT_NAME="${1:-${AGENT_NAME:-worker}}"
TMUX_SESSION="${2:-${TMUX_SESSION:-claude-session}}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
SOCKET_DIR="${SOCKET_DIR:-/shared/sockets}"

# Check 1: Verify tmux session exists
if ! tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
    echo "UNHEALTHY: tmux session '${TMUX_SESSION}' not found"
    exit 1
fi

# Check 2: Verify tmux session has at least one window
WINDOW_COUNT=$(tmux list-windows -t "${TMUX_SESSION}" 2>/dev/null | wc -l)
if [ "${WINDOW_COUNT}" -lt 1 ]; then
    echo "UNHEALTHY: tmux session has no windows"
    exit 1
fi

# Check 3: Verify heartbeat file exists and is recent (within last 60 seconds)
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
if [ -f "${HEARTBEAT_FILE}" ]; then
    # Get file modification time
    if command -v stat &> /dev/null; then
        # Linux stat
        FILE_AGE=$(($(date +%s) - $(stat -c %Y "${HEARTBEAT_FILE}" 2>/dev/null || echo 0)))
        if [ "${FILE_AGE}" -gt 60 ]; then
            echo "UNHEALTHY: Heartbeat is stale (${FILE_AGE}s old)"
            exit 1
        fi
    fi
fi

# Check 4: Verify tmux status file exists
TMUX_STATUS_FILE="${SOCKET_DIR}/${AGENT_NAME}.tmux"
if [ ! -f "${TMUX_STATUS_FILE}" ]; then
    echo "WARNING: tmux status file not found, but session exists"
    # Not a critical failure, session might still be starting
fi

# Check 5: Try to capture some output from the tmux pane
# This verifies the pane is responsive
OUTPUT=$(tmux capture-pane -t "${TMUX_SESSION}" -p 2>/dev/null | tail -5)
if [ $? -ne 0 ]; then
    echo "UNHEALTHY: Cannot capture output from tmux pane"
    exit 1
fi

# All checks passed
echo "HEALTHY: tmux session '${TMUX_SESSION}' is running"
exit 0
