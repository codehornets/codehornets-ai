#!/bin/bash
# Wake a worker by sending a prompt to the PERSISTENT Claude agent
# Supports multiple activation modes for different environments

set -e

# Parse arguments
WORKER_NAME=""
MESSAGE="Check for pending tasks and start monitoring"
MODE="auto"  # auto, noninteractive, tmux, expect, manual

while [[ $# -gt 0 ]]; do
    case $1 in
        --mode=*)
            MODE="${1#*=}"
            shift
            ;;
        --mode)
            MODE="$2"
            shift 2
            ;;
        --timeout=*)
            TIMEOUT="${1#*=}"
            shift
            ;;
        -h|--help)
            cat <<EOF
Usage: $0 <worker_name> [options] [message]

Arguments:
  worker_name              marie, anga, or fabien

Options:
  --mode=MODE              Activation mode (auto, noninteractive, tmux, expect, manual)
  --timeout=SECONDS        Timeout for expect operations (default: 10)
  -h, --help              Show this help message

Modes:
  auto                    Try all methods in order (default)
  noninteractive          Use Claude CLI -p flag (non-interactive)
  tmux                    Use tmux send-keys (TUI-aware)
  expect                  Use expect automation only
  manual                  Manual activation instructions only

Examples:
  $0 marie
  $0 anga "Start task monitoring"
  $0 fabien --mode=noninteractive "Process tasks"
  $0 marie --mode=tmux --timeout=5

This script wakes the PERSISTENT worker agent by trying methods in order.
EOF
            exit 0
            ;;
        *)
            if [ -z "$WORKER_NAME" ]; then
                WORKER_NAME="$1"
            else
                MESSAGE="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$WORKER_NAME" ]; then
    echo "Error: Worker name required"
    echo "Run: $0 --help"
    exit 1
fi

CONTAINER_NAME="codehornets-worker-${WORKER_NAME}"

# Check if worker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running"
    echo "Start it with: make start-${WORKER_NAME}"
    exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  Waking Worker: ${WORKER_NAME}"
echo "  Mode: ${MODE}"
echo "════════════════════════════════════════════════════════════"
echo ""

# Function: Non-interactive mode (Claude CLI -p flag)
try_noninteractive() {
    echo "Method: Claude CLI Non-Interactive (-p flag)"
    echo "Message: ${MESSAGE}"
    echo ""

    docker exec ${CONTAINER_NAME} bash -c "
cd /home/agent/workspace
echo '${MESSAGE}' | claude -p --output-format json --dangerously-skip-permissions 2>&1
" && {
        echo ""
        echo "✓ Command executed in non-interactive mode"
        echo ""
        echo "Check results: ls shared/results/${WORKER_NAME}/"
        return 0
    }

    echo "Warning: Non-interactive mode failed"
    return 1
}

# Function: tmux mode (TUI-aware)
try_tmux() {
    if ! docker ps --format '{{.Names}}' | grep -q "^codehornets-svc-automation$"; then
        echo "Warning: Automation container not running (required for tmux mode)"
        return 1
    fi

    echo "Method: tmux send-keys (TUI-aware)"
    echo "Message: ${MESSAGE}"
    echo ""

    docker exec codehornets-svc-automation sh -c "
        # Check if tmux session exists for this worker
        if ! tmux has-session -t ${WORKER_NAME} 2>/dev/null; then
            echo 'Creating tmux session...'
            tmux new-session -d -s ${WORKER_NAME} \"docker attach ${CONTAINER_NAME}\"
            sleep 2
        fi

        echo 'Sending message via tmux send-keys...'
        tmux send-keys -t ${WORKER_NAME}: \"${MESSAGE}\" Enter
        sleep 1

        # Detach from container (Ctrl+P Ctrl+Q)
        tmux send-keys -t ${WORKER_NAME}: C-p C-q

        echo '✓ Message sent via tmux'
    " && {
        echo ""
        echo "Check worker logs: make logs-${WORKER_NAME}"
        return 0
    }

    echo "Warning: tmux mode failed"
    return 1
}

# Function: expect automation
try_expect() {
    local TIMEOUT_VAL="${TIMEOUT:-10}"

    # Try automation container first
    if docker ps --format '{{.Names}}' | grep -q "^codehornets-svc-automation$"; then
        echo "Method: Automation container with 'expect'"
        echo "Message: ${MESSAGE}"
        echo ""

        # Use the send_to_worker.sh script inside automation container
        if docker exec codehornets-svc-automation /tools/helpers/monitoring/send_to_worker.sh "${WORKER_NAME}" "${MESSAGE}"; then
            echo ""
            echo "Check worker logs: make logs-${WORKER_NAME}"
            return 0
        fi

        echo "Warning: Automation container method failed"
    fi

    # Try using expect on host (if installed)
    if command -v expect >/dev/null 2>&1; then
        echo "Method: Using 'expect' to automate interaction"
        echo "Message: ${MESSAGE}"
        echo ""

        expect <<EOF >/dev/null 2>&1 || true
set timeout ${TIMEOUT_VAL}
log_user 0

spawn docker attach ${CONTAINER_NAME}
sleep 0.5
send "${MESSAGE}\r"
sleep 2
send "\x10\x11"
sleep 0.5
expect eof
EOF

        echo "✓ Message sent via expect"
        echo ""
        echo "Check worker logs: make logs-${WORKER_NAME}"
        return 0
    fi

    echo "Warning: expect not available"
    return 1
}

# Function: Manual activation instructions
show_manual_instructions() {
    echo "Note: Automation not available - manual activation required"
    echo ""

    TRIGGER_DIR="shared/triggers/${WORKER_NAME}"
    mkdir -p "$TRIGGER_DIR"

    NOTIFICATION_FILE="${TRIGGER_DIR}/MANUAL_WAKE_$(date +%Y%m%d_%H%M%S).txt"

    cat > "$NOTIFICATION_FILE" <<EOFNOTIF
════════════════════════════════════════════════════════════
WAKE UP - MANUAL ACTIVATION REQUIRED
════════════════════════════════════════════════════════════

Time: $(date -Iseconds)
Worker: ${WORKER_NAME}

MESSAGE FROM ORCHESTRATOR:
${MESSAGE}

ACTION REQUIRED:
You are currently idle at the Claude CLI prompt. To activate:

1. Read your CLAUDE.md system prompt
2. Execute the "Session Startup" instructions
3. Begin monitoring /tasks directory for work
4. Process any pending tasks

PENDING TASKS: $(ls shared/tasks/${WORKER_NAME}/*.json 2>/dev/null | wc -l)

════════════════════════════════════════════════════════════
EOFNOTIF

    echo "✓ Created notification: $(basename $NOTIFICATION_FILE)"
    echo ""

    # Show pending tasks
    TASK_COUNT=$(ls shared/tasks/${WORKER_NAME}/*.json 2>/dev/null | wc -l || echo 0)

    if [ "$TASK_COUNT" -gt 0 ]; then
        echo "⚠ Worker has $TASK_COUNT pending task(s)"
        echo ""
    fi

    echo "Manual activation required:"
    echo "─────────────────────────────────────────────────────────────"
    echo "  1. Attach to worker:"
    echo "       make attach-${WORKER_NAME}"
    echo ""
    echo "  2. Send message:"
    echo "       ${MESSAGE}"
    echo ""
    echo "  3. Press ENTER"
    echo ""
    echo "  4. Detach (important!):"
    echo "       Press: Ctrl+P then Ctrl+Q"
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    echo "To enable automation (choose one):"
    echo ""
    echo "  Option 1: Start automation container (recommended)"
    echo "    docker-compose up -d automation"
    echo "    make wake-${WORKER_NAME}"
    echo ""
    echo "  Option 2: Install 'expect' on host"
    echo "    sudo apt-get install expect      # Debian/Ubuntu"
    echo "    brew install expect               # macOS"
    echo ""
}

# Main: Execute based on mode
case "$MODE" in
    noninteractive)
        try_noninteractive && exit 0
        echo "Error: Non-interactive mode failed"
        exit 1
        ;;
    tmux)
        try_tmux && exit 0
        echo "Error: tmux mode failed"
        exit 1
        ;;
    expect)
        try_expect && exit 0
        echo "Error: expect mode failed"
        exit 1
        ;;
    manual)
        show_manual_instructions
        exit 0
        ;;
    auto|*)
        # Try all methods in order
        try_expect && exit 0
        try_tmux && exit 0
        try_noninteractive && exit 0

        # All automated methods failed - show manual instructions
        show_manual_instructions
        exit 0
        ;;
esac
