#!/bin/bash
# Quick script to send a task to Marie

TASK_ID="task-$(date +%s)-$(uuidgen 2>/dev/null || echo $RANDOM)"
TASK_FILE="core/shared/tasks/marie/${TASK_ID}.json"

# Get task description from command line or prompt
if [ -z "$1" ]; then
    echo "Task description for Marie:"
    read -r DESCRIPTION
else
    DESCRIPTION="$*"
fi

# Create task JSON
cat > "$TASK_FILE" << EOF
{
  "task_id": "$TASK_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "worker": "marie",
  "priority": "high",
  "description": "$DESCRIPTION",
  "context": {
    "user_request": "Direct task from user"
  },
  "requirements": [
    "Use your dance expertise and file organization skills",
    "Create detailed, organized output",
    "Follow professional dance documentation standards"
  ],
  "expected_output": {
    "format": "markdown",
    "artifacts": ["evaluation", "documentation"]
  },
  "timeout_seconds": 600
}
EOF

echo "✓ Task created: $TASK_ID"
echo "  File: $TASK_FILE"
echo ""
echo "Task description:"
echo "  $DESCRIPTION"
echo ""
echo "Waking up Marie..."

# Wake Marie (if docker is accessible)
docker exec marie pkill -USR1 -f claude 2>/dev/null || echo "Note: Could not send wake signal (Marie will pick up task within 5 seconds)"

echo ""
echo "✓ Task sent to Marie!"
