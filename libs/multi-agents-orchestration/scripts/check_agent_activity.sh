#!/bin/bash
# Check if an agent is actively responding (busy) or idle
# Works like Slack/Teams status: 🟢 Idle, 🟡 Busy, 🔴 Offline

set -e

AGENT_NAME="$1"
CHECK_DURATION="${2:-3}"  # seconds to monitor activity

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

if [ -z "$AGENT_NAME" ]; then
    cat <<EOF
Usage: $0 <agent> [duration]

Arguments:
  agent       - Agent name: orchestrator, marie, anga, or fabien
  duration    - Seconds to monitor for activity (default: 3)

Examples:
  $0 orchestrator
  $0 anga 5
  $0 marie

Status Indicators:
  🟢 IDLE         - Agent is at prompt, ready for messages
  🟡 BUSY         - Agent is actively responding/processing
  🔵 INITIALIZING - Agent at setup/theme selection screen
  🔴 OFFLINE      - Agent container is not running
  ⚪ UNKNOWN      - Cannot determine status

EOF
    exit 1
fi

# Map agent name to container name
case "$AGENT_NAME" in
    orchestrator)
        CONTAINER="codehornets-orchestrator"
        DISPLAY_NAME="Orchestrator"
        ;;
    anga)
        CONTAINER="codehornets-worker-anga"
        DISPLAY_NAME="Anga"
        ;;
    marie)
        CONTAINER="codehornets-worker-marie"
        DISPLAY_NAME="Marie"
        ;;
    fabien)
        CONTAINER="codehornets-worker-fabien"
        DISPLAY_NAME="Fabien"
        ;;
    *)
        echo -e "${RED}Error: Unknown agent '$AGENT_NAME'${NC}"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}🔴 OFFLINE${NC} - ${DISPLAY_NAME}"
    echo "   Container ${CONTAINER} is not running"
    echo "   Start it with: docker-compose up -d $AGENT_NAME"
    exit 1
fi

# Get recent logs to analyze content
RECENT_LOGS=$(docker logs ${CONTAINER} --tail 50 2>&1)

# Capture initial log line count
INITIAL_LINES=$(docker logs ${CONTAINER} --tail 100 2>&1 | wc -l)

# Wait and check for new output
sleep ${CHECK_DURATION}

# Capture final log line count
FINAL_LINES=$(docker logs ${CONTAINER} --tail 100 2>&1 | wc -l)

# Calculate difference (if logs are actively being written, line count changes)
LINE_DIFF=$((FINAL_LINES - INITIAL_LINES))

# Also check last few lines for rapid output
RECENT_OUTPUT=$(docker logs ${CONTAINER} --since ${CHECK_DURATION}s 2>&1 | wc -l)
DIFF=$RECENT_OUTPUT

# Display header
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  Agent Status: ${DISPLAY_NAME}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# STATE DETECTION LOGIC (Priority order matters!)

# 1. Check for initialization states (highest priority - false idle detection)
if echo "$RECENT_LOGS" | grep -q "Choose the text style"; then
    echo -e "Status: ${BLUE}🔵 INITIALIZING${NC}"
    echo "   Agent is at theme selection screen"
    echo "   Waiting for: Theme preference selection"
    echo ""
    echo "Suggestion: Complete initialization by selecting a theme"
    echo "            Use: make attach-${AGENT_NAME} and press Enter to select default"
    exit 0
fi

if echo "$RECENT_LOGS" | grep -q "authentication required"; then
    echo -e "Status: ${BLUE}🔵 INITIALIZING${NC}"
    echo "   Agent is at authentication prompt"
    echo "   Waiting for: API key or authentication"
    echo ""
    echo "Suggestion: Complete authentication setup"
    exit 0
fi

if echo "$RECENT_LOGS" | grep -q "Welcome to Claude Code"; then
    echo -e "Status: ${BLUE}🔵 INITIALIZING${NC}"
    echo "   Agent is at welcome/setup screen"
    echo "   Waiting for: Initial setup completion"
    echo ""
    echo "Suggestion: Complete the initial setup wizard"
    exit 0
fi

# 2. Check for active processing (high activity)
if [ $DIFF -gt 10 ]; then
    # Significant output = agent is busy responding
    echo -e "Status: ${YELLOW}🟡 BUSY${NC}"
    echo "   Agent is actively responding/processing"
    echo "   Output lines: ${DIFF} in ${CHECK_DURATION}s"
    echo ""
    echo "Suggestion: Wait for agent to finish, then send your message"
    exit 0
fi

# 3. Check for possible activity (moderate output)
if [ $DIFF -gt 2 ]; then
    # Small output = might be heartbeat updates or minor activity
    echo -e "Status: ${YELLOW}🟡 BUSY (possibly)${NC}"
    echo "   Small amount of output detected"
    echo "   Output lines: ${DIFF} in ${CHECK_DURATION}s"
    echo ""
    echo "Suggestion: Check again or wait a moment"
    exit 0
fi

# 4. Check for actual ready state (idle with proper prompt indicators)
# Look for Claude prompt indicators in recent logs
# Common patterns: "> ", "❯ ", "bypass permissions", input cursor position
if echo "$RECENT_LOGS" | grep -qE "(bypass permissions|> \[7m|❯|What would you like|I can help)"; then
    echo -e "Status: ${GREEN}🟢 IDLE${NC}"
    echo "   Agent is at prompt, ready for messages"
    echo "   No new output in ${CHECK_DURATION}s"
    echo ""
    echo "Suggestion: Agent is ready to receive messages"
    exit 0
fi

# 5. Default: Unknown state (no clear indicators)
echo -e "Status: ⚪ UNKNOWN"
echo "   Cannot determine agent state from logs"
echo "   No activity in ${CHECK_DURATION}s, but no clear prompt detected"
echo ""
echo "Suggestion: Attach to agent manually to check: make attach-${AGENT_NAME}"
exit 0
