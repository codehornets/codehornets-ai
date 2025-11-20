#!/bin/bash
set -e

AGENT_NAME="${1:-worker}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"

echo "========================================="
echo "🤖 CodeHornets AI Agent Startup"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "Time: $(date -Iseconds)"
echo "========================================="

# Install Node.js dependencies for tools
if [ -f "/tools/package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    cd /tools && npm install --quiet --no-audit --no-fund 2>/dev/null || echo "⚠️  npm install skipped (may already be installed)"
    cd /
fi

# Note: expect is not needed in worker containers
# The automation container has expect and handles all worker activation

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "${HEARTBEAT_DIR}"
mkdir -p "${TRIGGER_DIR}/${AGENT_NAME}"
mkdir -p "/var/log"
mkdir -p "/home/agent/.claude/hooks"

# Copy worker prompt as CLAUDE.md
if [ -f "/prompts/${AGENT_NAME}.md" ]; then
    echo "📝 Loading ${AGENT_NAME} prompt..."
    cp "/prompts/${AGENT_NAME}.md" "/home/agent/.claude/CLAUDE.md"
else
    echo "⚠️  Warning: No prompt found at /prompts/${AGENT_NAME}.md"
fi

# Copy hooks configuration
if [ -f "/hooks-config/${AGENT_NAME}-hooks.json" ]; then
    echo "🪝 Loading ${AGENT_NAME} hooks configuration..."
    cp "/hooks-config/${AGENT_NAME}-hooks.json" "/home/agent/.claude/hooks.json"
else
    echo "⚠️  Warning: No hooks config found at /hooks-config/${AGENT_NAME}-hooks.json"
fi

# Create initial heartbeat
HEARTBEAT_FILE="${HEARTBEAT_DIR}/${AGENT_NAME}.json"
echo "💓 Creating heartbeat: ${HEARTBEAT_FILE}"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "starting",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

# Start file watcher in background if hooks are enabled
if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/monitoring/hook_watcher.js" ]; then
    echo "👁️  Starting trigger watcher for ${AGENT_NAME}..."
    node /tools/monitoring/hook_watcher.js "${AGENT_NAME}" >> "/var/log/${AGENT_NAME}-watcher.log" 2>&1 &
    WATCHER_PID=$!
    echo "   Watcher started (PID: ${WATCHER_PID})"
fi

# Update heartbeat to active
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "========================================="
echo "✅ Agent ${AGENT_NAME} ready"
echo "========================================="
echo ""

# Start Claude CLI with auto-activation
echo "🚀 Starting Claude CLI..."

# Start Claude CLI with permission auto-approval
# Workers are activated by the automation container using 'expect'
echo "🚀 Starting Claude CLI (auto-approval enabled)..."
echo "   Workers will be activated via automation container"
exec claude --permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace
