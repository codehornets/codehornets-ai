# Installation Guide

## Prerequisites

- Python 3.10 or higher
- pip or uv package manager
- Claude CLI (for actual task execution)
- Linux system (for inotify support)

## Quick Install

### Using pip

```bash
# Navigate to tools directory
cd /home/anga/workspace/beta/codehornets-ai/tools

# Install dependencies
pip install -r requirements-watcher.txt
```

### Using uv (Faster)

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to tools directory
cd /home/anga/workspace/beta/codehornets-ai/tools

# Install dependencies
uv pip install -r requirements-watcher.txt
```

## Verify Installation

```bash
# Test imports
python3 -c "
import watcher_config
import worker_watcher
import orchestrator_listener
print('✅ All modules imported successfully')
"

# Run tests
pytest test_watcher.py -v

# Show demo options
python demo_watcher.py --help
```

## Dependencies

### Core Dependencies (Required)

- **watchdog** (>=3.0.0): File system event monitoring
- **pydantic** (>=2.0.0): Configuration validation

### Optional Dependencies

- **prometheus-client** (>=0.19.0): Metrics export
- **redis** (>=5.0.0): Redis support

### Testing Dependencies

- **pytest** (>=7.4.0): Test framework
- **pytest-asyncio** (>=0.21.0): Async test support
- **pytest-cov** (>=4.1.0): Coverage reporting

### Development Dependencies

- **black** (>=23.12.0): Code formatting
- **ruff** (>=0.1.9): Linting
- **mypy** (>=1.8.0): Type checking

## Claude CLI Installation

The worker watcher executes tasks using Claude CLI. Install it:

```bash
# Install Claude CLI
curl -fsSL https://raw.githubusercontent.com/anthropics/claude-cli/main/install.sh | sh

# Verify installation
claude --version

# Authenticate
claude auth
```

## Setup Demo Environment

```bash
# Create directory structure
python demo_watcher.py --setup

# Export environment variables
export TASK_DIR="/tmp/watcher_demo/tasks"
export TRIGGER_DIR="/tmp/watcher_demo/triggers"
export RESULT_DIR="/tmp/watcher_demo/results"
export HEARTBEAT_DIR="/tmp/watcher_demo/heartbeats"
export DLQ_DIR="/tmp/watcher_demo/dlq"

# Or add to ~/.bashrc for persistence
cat >> ~/.bashrc << 'EOF'
# Watcher System
export TASK_DIR="/tmp/watcher_demo/tasks"
export TRIGGER_DIR="/tmp/watcher_demo/triggers"
export RESULT_DIR="/tmp/watcher_demo/results"
export HEARTBEAT_DIR="/tmp/watcher_demo/heartbeats"
export DLQ_DIR="/tmp/watcher_demo/dlq"
EOF
```

## Verify Setup

```bash
# Check directory structure
ls -la /tmp/watcher_demo/

# Should show:
# tasks/
# triggers/
# results/
# heartbeats/
# dlq/

# Check environment variables
echo $TASK_DIR
# Should print: /tmp/watcher_demo/tasks
```

## Test Run

```bash
# Terminal 1: Start worker
python worker_watcher.py marie --log-level DEBUG

# Terminal 2: Create test task
cat > /tmp/watcher_demo/tasks/marie/test-001.json << EOF
{
  "task_id": "test-001",
  "description": "echo 'Hello from test task'",
  "worker": "marie"
}
EOF

# Watch Terminal 1 for processing output

# Check result
cat /tmp/watcher_demo/results/marie/test-001.json | jq
```

## Production Setup

For production deployment:

1. **Use proper directories:**
   ```bash
   export TASK_DIR="/shared/tasks"
   export TRIGGER_DIR="/shared/triggers"
   export RESULT_DIR="/shared/results"
   export HEARTBEAT_DIR="/shared/heartbeats"
   export DLQ_DIR="/shared/dlq"
   ```

2. **Configure logging:**
   ```bash
   export LOG_LEVEL="INFO"
   export LOG_FORMAT="json"
   ```

3. **Enable metrics:**
   ```bash
   export ENABLE_METRICS="true"
   export METRICS_PORT="9090"
   ```

4. **Set resource limits:**
   ```bash
   export MAX_CONCURRENT_TASKS="3"
   export TASK_TIMEOUT="600"
   export MAX_RETRIES="3"
   ```

## Docker Setup (Optional)

```bash
# Build image
docker build -t watcher-system -f Dockerfile.watcher .

# Run worker
docker run -d \
  --name marie-watcher \
  -e WORKER_NAME=marie \
  -e MAX_CONCURRENT_TASKS=3 \
  -v /shared:/shared \
  watcher-system \
  python worker_watcher.py marie
```

## Troubleshooting

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'watchdog'`

**Solution:**
```bash
pip install watchdog pydantic
# or
uv pip install watchdog pydantic
```

### Permission Errors

**Problem:** `PermissionError: [Errno 13] Permission denied`

**Solution:**
```bash
# Fix directory permissions
chmod -R 755 /tmp/watcher_demo/
# or
sudo chown -R $USER:$USER /tmp/watcher_demo/
```

### Claude CLI Not Found

**Problem:** `FileNotFoundError: [Errno 2] No such file or directory: 'claude'`

**Solution:**
```bash
# Install Claude CLI
curl -fsSL https://raw.githubusercontent.com/anthropics/claude-cli/main/install.sh | sh

# Add to PATH if needed
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### inotify Limit Exceeded

**Problem:** `OSError: inotify instance limit reached`

**Solution:**
```bash
# Increase inotify limits (temporary)
sudo sysctl fs.inotify.max_user_instances=512
sudo sysctl fs.inotify.max_user_watches=524288

# Make permanent
echo "fs.inotify.max_user_instances=512" | sudo tee -a /etc/sysctl.conf
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Uninstall

```bash
# Remove demo environment
rm -rf /tmp/watcher_demo/

# Uninstall Python packages
pip uninstall watchdog pydantic prometheus-client -y

# Remove from bashrc
# (edit ~/.bashrc and remove watcher exports)
```

## Next Steps

After installation:

1. Read [README_WATCHER.md](./README_WATCHER.md) for usage guide
2. Review [WATCHER_INTEGRATION_GUIDE.md](./WATCHER_INTEGRATION_GUIDE.md) for integration
3. Run tests: `pytest test_watcher.py -v`
4. Try demo: `python demo_watcher.py --examples`

## Support

For issues:
- Check [README_WATCHER.md](./README_WATCHER.md) troubleshooting section
- Run tests: `pytest test_watcher.py -v`
- Check logs with `--log-level DEBUG`
- Review [WATCHER_IMPLEMENTATION_SUMMARY.md](./WATCHER_IMPLEMENTATION_SUMMARY.md)
