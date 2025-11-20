#!/bin/bash
set -e

echo "========================================="
echo "🎯 CodeHornets AI Orchestrator Startup"
echo "========================================="
echo "Agent: orchestrator"
echo "Role: Coordinator"
echo "Time: $(date -Iseconds)"
echo "========================================="

# Install Python dependencies for hooks
if [ -n "${HOOKS_MODE}" ]; then
    echo "📦 Installing hooks dependencies..."
    pip install --quiet --break-system-packages watchdog redis 2>/dev/null || echo "⚠️  Warning: Failed to install some dependencies"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /shared/heartbeats
mkdir -p /shared/triggers/orchestrator
mkdir -p /shared/pipes
mkdir -p /var/log
mkdir -p /home/agent/.claude/hooks

# Copy orchestrator prompt as CLAUDE.md
if [ -f "/prompts/orchestrator.md" ]; then
    echo "📝 Loading orchestrator prompt..."
    cp "/prompts/orchestrator.md" "/home/agent/workspace/CLAUDE.md"
else
    echo "⚠️  Warning: No prompt found at /prompts/orchestrator.md"
fi

# Copy hooks configuration
if [ -f "/hooks-config/orchestrator-hooks.json" ]; then
    echo "🪝 Loading orchestrator hooks configuration..."
    cp "/hooks-config/orchestrator-hooks.json" "/home/agent/.claude/hooks.json"
    # Also copy to hooks directory for reference
    mkdir -p "/home/agent/.claude/hooks"
    cp "/hooks-config/orchestrator-hooks.json" "/home/agent/.claude/hooks/hooks.json"
else
    echo "⚠️  Warning: No hooks config found at /hooks-config/orchestrator-hooks.json"
fi

# Create named pipe for control if needed
if [ -n "${HOOKS_MODE}" ]; then
    mkfifo /shared/pipes/orchestrator-control 2>/dev/null || true
fi

# Create initial heartbeat
HEARTBEAT_FILE="/shared/heartbeats/orchestrator.json"
echo "💓 Creating heartbeat: ${HEARTBEAT_FILE}"
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "orchestrator",
  "status": "starting",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

# Start hook watcher in background if enabled
if [ -n "${HOOKS_MODE}" ] && [ -f "/tools/hook_watcher.py" ]; then
    echo "👁️  Starting hook watcher for orchestrator..."
    python3 /tools/hook_watcher.py orchestrator >> "/var/log/orchestrator-watcher.log" 2>&1 &
    WATCHER_PID=$!
    echo "   Watcher started (PID: ${WATCHER_PID})"
fi

# Update heartbeat to active
cat > "${HEARTBEAT_FILE}" <<EOF
{
  "agent_name": "orchestrator",
  "status": "active",
  "last_updated": "$(date -Iseconds)",
  "current_task": null,
  "tasks_completed": 0
}
EOF

echo "========================================="
echo "✅ Orchestrator ready"
echo "========================================="
echo ""

# Start Claude CLI with permission auto-approval
echo "🚀 Starting Claude CLI (auto-approval enabled)..."
exec claude --permission-mode bypassPermissions --add-dir /tasks --add-dir /results --add-dir /workspaces
