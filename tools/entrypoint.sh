#!/bin/bash
# Multi-Mode Container Entrypoint
# Supports: polling, activation_wrapper, hooks, and hybrid modes
#
# Usage: entrypoint.sh <worker_name>
# Mode selection via environment variables:
#   - ACTIVATION_WRAPPER=1  -> Use activation_wrapper.py
#   - HOOKS_MODE=1          -> Use hook_watcher.py
#   - Both set             -> Hybrid mode

set -e

WORKER_NAME=${1:-${WORKER_NAME:-"worker"}}

echo "════════════════════════════════════════════════════════════════"
echo "  CodeHornets AI - Multi-Mode Container Startup"
echo "  Worker: ${WORKER_NAME}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# =============================================================================
# 1. DEPENDENCY INSTALLATION
# =============================================================================

echo "🔧 Installing dependencies..."

# Base dependencies for all workers
DEPS="reportlab"

# Add dependencies based on enabled modes
if [ -n "${ACTIVATION_WRAPPER}" ] || [ -n "${HOOKS_MODE}" ]; then
    DEPS="${DEPS} watchdog redis"
fi

if [ -n "${DEPS}" ]; then
    pip install --quiet --break-system-packages ${DEPS}
    echo "✅ Dependencies installed: ${DEPS}"
fi

# =============================================================================
# 2. OUTPUT STYLE CONFIGURATION
# =============================================================================

echo "🎨 Configuring output style..."

mkdir -p /home/agent/.claude/output-styles

if [ -f "/output-styles/${WORKER_NAME}.md" ]; then
    cp "/output-styles/${WORKER_NAME}.md" "/home/agent/.claude/output-styles/${WORKER_NAME}.md"
    echo "{\"outputStyle\": \"${WORKER_NAME}\"}" > /home/agent/.claude/settings.local.json
    echo "✅ Output style configured: ${WORKER_NAME}"
else
    echo "⚠️  No output style found for ${WORKER_NAME}, skipping"
fi

# =============================================================================
# 3. HOOKS MODE SETUP
# =============================================================================

if [ -n "${HOOKS_MODE}" ]; then
    echo ""
    echo "🪝 Setting up hooks-based communication..."

    # Create hooks directory
    mkdir -p /home/agent/.claude/hooks

    # Copy hook configuration
    if [ -f "/hooks-config/${WORKER_NAME}-hooks.json" ]; then
        cp "/hooks-config/${WORKER_NAME}-hooks.json" /home/agent/.claude/hooks/hooks.json
        echo "✅ Hook configuration loaded: ${WORKER_NAME}-hooks.json"
    else
        echo "⚠️  No hook configuration found, creating default"
        cat > /home/agent/.claude/hooks/hooks.json <<EOF
{
  "hooks": [
    {
      "event": "UserPromptSubmit",
      "action": "trigger",
      "target": "${TRIGGER_DIR}/${WORKER_NAME}/prompt-submitted.trigger"
    },
    {
      "event": "PreToolUse",
      "action": "log",
      "target": "/var/log/${WORKER_NAME}-tool-use.log"
    }
  ]
}
EOF
    fi

    # Create trigger and pipe directories
    mkdir -p "${TRIGGER_DIR}/${WORKER_NAME}"
    mkdir -p "${PIPE_DIR}"

    # Create named pipes (ignore if exists)
    mkfifo "${PIPE_DIR}/${WORKER_NAME}-control" 2>/dev/null || true
    mkfifo "${PIPE_DIR}/${WORKER_NAME}-status" 2>/dev/null || true

    echo "✅ Trigger directory: ${TRIGGER_DIR}/${WORKER_NAME}"
    echo "✅ Named pipes: ${PIPE_DIR}/${WORKER_NAME}-{control,status}"

    # Start hook watcher in background
    if [ -f "/tools/hook_watcher.py" ]; then
        echo "🎯 Starting hook watcher in background..."
        python3 /tools/hook_watcher.py "${WORKER_NAME}" > "/var/log/${WORKER_NAME}-watcher.log" 2>&1 &
        WATCHER_PID=$!
        echo "✅ Hook watcher started (PID: ${WATCHER_PID})"
    else
        echo "⚠️  hook_watcher.py not found, hooks may not function"
    fi
fi

# =============================================================================
# 4. MODE SELECTION AND STARTUP
# =============================================================================

echo ""
echo "🚀 Starting ${WORKER_NAME}..."
echo ""

# Determine startup mode
if [ -n "${ACTIVATION_WRAPPER}" ] && [ -n "${HOOKS_MODE}" ]; then
    # HYBRID MODE: activation_wrapper + hooks
    echo "📡 Mode: HYBRID (activation_wrapper + hooks)"
    echo "   - activation_wrapper.py for zero-CPU idle"
    echo "   - hook_watcher.py for Claude Code hooks"
    echo "   - Activation method: ${ACTIVATION_MODE:-inotify}"
    echo ""

    if [ ! -f "/tools/activation_wrapper.py" ]; then
        echo "❌ ERROR: activation_wrapper.py not found"
        exit 1
    fi

    python3 /tools/activation_wrapper.py "${WORKER_NAME}" --mode "${ACTIVATION_MODE:-inotify}"

elif [ -n "${ACTIVATION_WRAPPER}" ]; then
    # ACTIVATION WRAPPER MODE: event-driven, zero CPU
    echo "⚡ Mode: EVENT-DRIVEN (activation_wrapper.py only)"
    echo "   - Zero CPU when idle"
    echo "   - Activation method: ${ACTIVATION_MODE:-inotify}"
    echo ""

    if [ ! -f "/tools/activation_wrapper.py" ]; then
        echo "❌ ERROR: activation_wrapper.py not found"
        exit 1
    fi

    python3 /tools/activation_wrapper.py "${WORKER_NAME}" --mode "${ACTIVATION_MODE:-inotify}"

elif [ -n "${HOOKS_MODE}" ]; then
    # HOOKS MODE: Claude Code hooks only
    echo "🪝 Mode: HOOKS-BASED (Claude Code hooks only)"
    echo "   - File triggers: ${TRIGGER_DIR}/${WORKER_NAME}/"
    echo "   - Named pipes: ${PIPE_DIR}/${WORKER_NAME}-*"
    echo "   - Watcher logs: /var/log/${WORKER_NAME}-watcher.log"
    echo ""

    # Standard Claude CLI with hooks pre-configured
    exec claude

else
    # POLLING MODE: original, simple
    echo "🔄 Mode: POLLING (default)"
    echo "   - Polls every 1 second"
    echo "   - No external dependencies"
    echo ""

    exec claude
fi

# =============================================================================
# CLEANUP (runs on container stop)
# =============================================================================

cleanup() {
    echo ""
    echo "🛑 Shutting down ${WORKER_NAME}..."

    # Kill watcher if running
    if [ -n "${WATCHER_PID}" ]; then
        kill "${WATCHER_PID}" 2>/dev/null || true
        echo "✅ Hook watcher stopped"
    fi

    # Clean up named pipes
    rm -f "${PIPE_DIR}/${WORKER_NAME}-control" 2>/dev/null || true
    rm -f "${PIPE_DIR}/${WORKER_NAME}-status" 2>/dev/null || true

    echo "✅ Cleanup complete"
}

trap cleanup EXIT SIGTERM SIGINT
