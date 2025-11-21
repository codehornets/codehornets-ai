#!/bin/bash
# Reliable message delivery via file-based inbox
# This actually works because it uses the file system, not TTY injection

set -e

AGENT_NAME="$1"
MESSAGE="$2"

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$AGENT_NAME" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: $0 <agent> \"message\""
    echo "Example: $0 anga \"Hello from orchestrator\""
    exit 1
fi

# Validate agent name
case "$AGENT_NAME" in
    orchestrator|marie|anga|fabien)
        ;;
    *)
        echo -e "${RED}Error: Unknown agent '$AGENT_NAME'${NC}"
        echo "Valid agents: orchestrator, marie, anga, fabien"
        exit 1
        ;;
esac

# Create inbox directory if it doesn't exist
INBOX_DIR="/shared/inbox/${AGENT_NAME}"
mkdir -p "${INBOX_DIR}" 2>/dev/null || INBOX_DIR="./shared/inbox/${AGENT_NAME}"
mkdir -p "${INBOX_DIR}"

# Generate unique message ID
TIMESTAMP=$(date +%s%N)
MESSAGE_ID="msg_${TIMESTAMP}"
MESSAGE_FILE="${INBOX_DIR}/${MESSAGE_ID}.json"

# Create message file
cat > "${MESSAGE_FILE}" <<EOF
{
  "id": "${MESSAGE_ID}",
  "timestamp": "$(date -Iseconds)",
  "to": "${AGENT_NAME}",
  "from": "${SENDER:-unknown}",
  "message": "${MESSAGE}",
  "status": "unread"
}
EOF

echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Message delivered to inbox: ${AGENT_NAME}${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "Message ID: ${MESSAGE_ID}"
echo -e "Inbox: ${MESSAGE_FILE}"
echo ""
echo -e "${GREEN}✓ Message written to inbox successfully${NC}"
echo ""
