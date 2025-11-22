#!/bin/bash
set -e

AGENT_NAME="${1:-worker}"
SHARED_DIR="${SHARED_DIR:-/workspace/shared}"
HEARTBEAT_DIR="${HEARTBEAT_DIR:-/shared/heartbeats}"
TRIGGER_DIR="${TRIGGER_DIR:-/shared/triggers}"

echo "========================================="
echo "🤖 CodeHornets AI Agent Startup (Custom CLI)"
echo "========================================="
echo "Agent: ${AGENT_NAME}"
echo "Role: ${AGENT_ROLE:-worker}"
echo "CLI: Custom (core/cli.js)"
echo "Time: $(date -Iseconds)"
echo "========================================="

# Install Node.js dependencies for tools
if [ -f "/tools/package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    cd /tools && npm install --quiet --no-audit --no-fund 2>/dev/null || echo "⚠️  npm install skipped (may already be installed)"
    cd /
fi

# Install make for Makefile support
if ! command -v make &> /dev/null; then
    echo "🔧 Installing make..."
    apt-get update -qq && apt-get install -y -qq make 2>/dev/null || echo "⚠️  make installation skipped"
fi

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
  "tasks_completed": 0,
  "cli_type": "custom"
}
EOF

# Start file watcher in background if hooks are enabled
if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/monitoring/hook_watcher.js" ]; then
    echo "👁️  Starting trigger watcher for ${AGENT_NAME}..."
    node /tools/monitoring/hook_watcher.js "${AGENT_NAME}" >> "/var/log/${AGENT_NAME}-watcher.log" 2>&1 &
    WATCHER_PID=$!
    echo "   Watcher started (PID: ${WATCHER_PID})"
fi

# Start Redis message listener in background
if [ -f "/tools/monitoring/redis_message_listener.js" ]; then
    echo "📡 Starting Redis message listener for ${AGENT_NAME}..."
    node /tools/monitoring/redis_message_listener.js "${AGENT_NAME}" >> "/var/log/${AGENT_NAME}-messages.log" 2>&1 &
    MESSAGE_LISTENER_PID=$!
    echo "   Message listener started (PID: ${MESSAGE_LISTENER_PID})"
fi

# Update heartbeat to active
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "${AGENT_NAME}",
  "status": "active",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0,
  "cli_type": "custom"
}
EOF

echo "========================================="
echo "✅ Agent ${AGENT_NAME} ready (Custom CLI)"
echo "========================================="
echo ""

# Start Custom Claude CLI with permission auto-approval
echo "🚀 Starting Custom Claude CLI..."
echo "   Using: node /opt/claude-cli/cli.js"

# Execute the custom CLI
exec node /opt/claude-cli/cli.js --permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /home/agent/workspace
