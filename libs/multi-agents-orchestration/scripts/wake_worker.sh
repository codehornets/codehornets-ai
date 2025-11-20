#!/bin/bash
# Wake an agent (orchestrator or worker) by sending a prompt to the PERSISTENT Claude instance
# Supports multiple activation modes for different environments

set -e

# Parse arguments
AGENT_NAME=""
MESSAGE="Check for pending tasks and start monitoring"
MODE="auto"  # auto, expect, manual

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
Usage: $0 <agent_name> [options] [message]

Arguments:
  agent_name               orchestrator, marie, anga, or fabien

Options:
  --mode=MODE              Activation mode (auto, expect, manual)
  --timeout=SECONDS        Timeout for expect operations (default: 10)
  -h, --help              Show this help message

Modes:
  auto                    Try expect, then show manual instructions (default)
  expect                  Use expect automation only
  manual                  Manual activation instructions only

Examples:
  $0 orchestrator
  $0 marie
  $0 anga "Start task monitoring"
  $0 fabien --mode=expect "Process tasks"
  $0 orchestrator --timeout=5

This script wakes the PERSISTENT agent by sending a message to the running Claude instance.
EOF
            exit 0
            ;;
        *)
            if [ -z "$AGENT_NAME" ]; then
                AGENT_NAME="$1"
            else
                MESSAGE="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$AGENT_NAME" ]; then
    echo "Error: Agent name required"
    echo "Run: $0 --help"
    exit 1
fi

# Map agent name to container name
case "$AGENT_NAME" in
    orchestrator)
        CONTAINER_NAME="codehornets-orchestrator"
        ;;
    marie|anga|fabien)
        CONTAINER_NAME="codehornets-worker-${AGENT_NAME}"
        ;;
    *)
        echo "Error: Unknown agent '$AGENT_NAME'"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Check if agent container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running"
    echo "Start it with: docker-compose up -d ${AGENT_NAME}"
    exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  Waking Agent: ${AGENT_NAME}"
echo "  Mode: ${MODE}"
echo "════════════════════════════════════════════════════════════"
echo ""

# Function: expect automation (primary method)
try_expect() {
    local TIMEOUT_VAL="${TIMEOUT:-10}"

    # Check if automation container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^codehornets-svc-automation$"; then
        echo "Warning: Automation container not running"
        return 1
    fi

    echo "Method: Automation container with 'expect'"
    echo "Message: ${MESSAGE}"
    echo ""

    # Use expect in automation container to send message
    docker exec codehornets-svc-automation sh -c "
expect <<'EXPECT_EOF'
set timeout ${TIMEOUT_VAL}
log_user 0

# Attach to agent container
spawn docker attach ${CONTAINER_NAME}
sleep 1

# Send the message
send \"${MESSAGE}\"
sleep 0.5

# Press Enter
send \"\\r\"
sleep 3

# Detach properly (Ctrl+P Ctrl+Q)
send \"\\x10\\x11\"
sleep 0.5

expect eof
EXPECT_EOF
" 2>&1 | grep -v "spawn\|EXPECT_EOF" || true

    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Message sent via expect"
        echo ""
        echo "Check logs: docker logs ${CONTAINER_NAME} --tail 50"
        return 0
    fi

    echo "Warning: expect automation failed"
    return 1
}

# Function: Manual activation instructions
show_manual_instructions() {
    echo "Note: Automation not available - manual activation required"
    echo ""

    TRIGGER_DIR="shared/triggers/${AGENT_NAME}"
    mkdir -p "$TRIGGER_DIR"

    NOTIFICATION_FILE="${TRIGGER_DIR}/MANUAL_WAKE_$(date +%Y%m%d_%H%M%S).txt"

    cat > "$NOTIFICATION_FILE" <<EOFNOTIF
════════════════════════════════════════════════════════════
WAKE UP - MANUAL ACTIVATION REQUIRED
════════════════════════════════════════════════════════════

Time: $(date -Iseconds)
Agent: ${AGENT_NAME}

MESSAGE:
${MESSAGE}

ACTION REQUIRED:
You are currently idle at the Claude CLI prompt. To activate:

1. Read your CLAUDE.md system prompt
2. Execute the "Session Startup" instructions
3. Begin monitoring /tasks directory for work
4. Process any pending tasks

PENDING TASKS: $(ls shared/tasks/${AGENT_NAME}/*.json 2>/dev/null | wc -l)

════════════════════════════════════════════════════════════
EOFNOTIF

    echo "✓ Created notification: $(basename $NOTIFICATION_FILE)"
    echo ""

    # Show pending tasks (skip for orchestrator)
    if [ "$AGENT_NAME" != "orchestrator" ]; then
        TASK_COUNT=$(ls shared/tasks/${AGENT_NAME}/*.json 2>/dev/null | wc -l || echo 0)

        if [ "$TASK_COUNT" -gt 0 ]; then
            echo "⚠ Agent has $TASK_COUNT pending task(s)"
            echo ""
        fi
    fi

    echo "Manual activation required:"
    echo "─────────────────────────────────────────────────────────────"
    echo "  1. Attach to agent:"
    echo "       docker attach ${CONTAINER_NAME}"
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
    echo "To enable automation:"
    echo "  docker-compose up -d automation"
    echo "  $0 ${AGENT_NAME}"
    echo ""
}

# Main: Execute based on mode
case "$MODE" in
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
        # Try expect, if it fails show manual instructions
        try_expect && exit 0

        # Automation failed - show manual instructions
        show_manual_instructions
        exit 0
        ;;
esac
