# Hooks-Based Agent Communication System

Production-ready multi-mode agent communication for CodeHornets AI with Docker Compose and Kubernetes support.

## Quick Start

```bash
# 1. Start hooks mode
make start-hooks

# 2. Check status
make hooks-status

# 3. View logs
make logs-watcher-marie

# 4. Run tests
make test-hooks

# 5. Attach to orchestrator
make attach
```

## Available Modes

### 1. Polling Mode (Default)
```bash
docker-compose up
```
- **Latency:** ~1s
- **CPU (idle):** ~2%
- **Best for:** Development, debugging

### 2. Event-Driven Mode (Zero-CPU)
```bash
ACTIVATION_WRAPPER=1 docker-compose --profile activated up
```
- **Latency:** <10ms
- **CPU (idle):** ~0%
- **Best for:** Production, resource-constrained environments

### 3. Hooks Mode (NEW)
```bash
HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hooks up
```
- **Latency:** <100ms
- **CPU (idle):** ~1%
- **Best for:** Claude Code integration, observability

### 4. Hybrid Mode (Production Recommended)
```bash
ACTIVATION_WRAPPER=1 HOOKS_MODE=1 docker-compose -f docker-compose.hooks.yml --profile hybrid up
```
- **Latency:** <10ms
- **CPU (idle):** ~0%
- **Best for:** Production with full observability

## Architecture

```
Orchestrator
    │
    ├── Creates trigger files → /shared/triggers/{worker}/task-{id}.trigger
    │
    └── Reads results from → /shared/results/{worker}/result-{id}.json

Workers (marie, anga, fabien)
    │
    ├── hook_watcher.py (background)
    │   ├── Monitors /shared/triggers/{worker}/ (inotify)
    │   ├── Listens on /shared/pipes/{worker}-control
    │   └── Publishes events to Redis (optional)
    │
    └── Claude Code CLI (foreground)
        ├── Loads hooks from /home/agent/.claude/hooks/hooks.json
        ├── Executes tasks
        └── Writes results
```

## Components

### 1. Hook Watcher (`hook_watcher.py`)

Background daemon that monitors file triggers and named pipes.

**Features:**
- inotify-based filesystem monitoring (Linux)
- Named pipe communication for control/status
- Redis pub/sub for cluster-wide events
- Heartbeat monitoring
- Graceful shutdown

**Logs:** `/shared/watcher-logs/{worker}-watcher.log`

### 2. Container Entrypoint (`entrypoint.sh`)

Multi-mode startup script that configures containers based on environment.

**Responsibilities:**
- Install dependencies (watchdog, redis)
- Configure output styles
- Setup hooks configuration
- Create named pipes
- Start hook watcher (if HOOKS_MODE=1)
- Launch Claude CLI or activation wrapper

### 3. Hook Configurations

JSON files defining Claude Code hooks for each worker.

**Location:** `/hooks-config/{worker}-hooks.json`

**Events:**
- `UserPromptSubmit` - Triggered on new prompt
- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `OnError` - Error handling

### 4. Shared Volumes

| Directory | Purpose |
|-----------|---------|
| `/shared/triggers/` | File-based trigger notifications |
| `/shared/pipes/` | Named pipes for IPC |
| `/shared/watcher-logs/` | Hook watcher logs |
| `/shared/heartbeats/` | Health monitoring files |
| `/shared/tasks/` | Task queues |
| `/shared/results/` | Result outputs |

## Makefile Commands

### Hooks System
```bash
make start-hooks          # Start hooks mode
make stop-hooks           # Stop hooks mode
make restart-hooks        # Restart hooks mode
make start-hybrid         # Start hybrid mode (recommended)
```

### Monitoring
```bash
make hooks-status         # Full system status
make logs-watcher-marie   # Marie's watcher logs
make logs-watcher-anga    # Anga's watcher logs
make logs-watcher-fabien  # Fabien's watcher logs
make check-triggers       # Check trigger files
make check-pipes          # Check named pipes
```

### Testing
```bash
make test-hooks           # Run integration tests
make clean-triggers       # Clean trigger files
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOOKS_MODE` | empty | Enable hooks (set to `1`) |
| `ACTIVATION_WRAPPER` | empty | Enable activation wrapper (set to `1`) |
| `ACTIVATION_MODE` | `inotify` | Activation method: inotify, redis, polling |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `TRIGGER_DIR` | `/shared/triggers` | Trigger files directory |
| `PIPE_DIR` | `/shared/pipes` | Named pipes directory |
| `HEARTBEAT_DIR` | `/shared/heartbeats` | Heartbeat files directory |
| `HEARTBEAT_INTERVAL` | `10` | Heartbeat frequency (seconds) |

## File Structure

```
infrastructure/docker/codehornets-ai/
├── docker-compose.hooks.yml        # Multi-mode Docker Compose
├── hooks-config/                   # Hook configurations
│   ├── marie-hooks.json
│   ├── anga-hooks.json
│   ├── fabien-hooks.json
│   └── orchestrator-hooks.json
├── shared/
│   ├── triggers/                   # File triggers
│   │   ├── marie/
│   │   ├── anga/
│   │   ├── fabien/
│   │   └── orchestrator/
│   ├── pipes/                      # Named pipes
│   │   ├── marie-control
│   │   ├── marie-status
│   │   └── ...
│   ├── watcher-logs/              # Watcher logs
│   │   ├── marie-watcher.log
│   │   └── ...
│   └── heartbeats/                # Health checks
│       ├── marie-watcher.json
│       └── ...
└── HOOKS_README.md                # This file
```

## Examples

### Manual Trigger Creation

```bash
# Create trigger file
echo '{"task_id": "test-001", "description": "Test task"}' > \
  infrastructure/docker/codehornets-ai/shared/triggers/marie/test-001.trigger

# Check if processed (file should be deleted)
sleep 3
ls infrastructure/docker/codehornets-ai/shared/triggers/marie/test-001.trigger
# File not found = processed successfully

# Check watcher log
tail infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log
```

### Control Pipe Communication

```bash
# Send control command (non-blocking)
echo '{"command": "status"}' > infrastructure/docker/codehornets-ai/shared/pipes/marie-control &

# Read status from pipe (blocking until written)
cat infrastructure/docker/codehornets-ai/shared/pipes/marie-status
```

### Monitor Heartbeats

```bash
# View current heartbeat
cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie-watcher.json

# Watch for updates
watch -n 2 cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie-watcher.json
```

## Troubleshooting

### Issue: Hook watcher not starting

```bash
# Check container logs
docker logs marie --tail 50

# Verify dependencies
docker exec marie pip list | grep watchdog

# Reinstall if missing
docker exec marie pip install watchdog redis
make restart-hooks
```

### Issue: Triggers not being processed

```bash
# Check watcher log
tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log

# Verify inotify
docker exec marie inotifywait -m /shared/triggers/marie/

# Clean up old triggers
make clean-triggers
```

### Issue: Named pipes blocking

```bash
# Check if watcher is listening
docker exec marie ps aux | grep hook_watcher

# Test non-blocking write
timeout 1 echo '{"test": true}' > infrastructure/docker/codehornets-ai/shared/pipes/marie-control
```

### Issue: High CPU usage

```bash
# Check if polling mode
docker logs marie | grep "Polling mode"

# Should see "inotify listener active" instead
# If not, install watchdog and restart
docker exec marie pip install watchdog
make restart-hooks
```

## Performance Benchmarks

Run benchmark tests:
```bash
make test-hooks
```

Expected results:
- **Polling mode:** ~1000ms average latency
- **Event-driven:** <10ms average latency
- **Hooks mode:** <100ms average latency
- **Hybrid mode:** <10ms average latency

## Production Deployment

### Docker Compose (Simple)

```bash
# Production with hybrid mode
ACTIVATION_WRAPPER=1 HOOKS_MODE=1 \
  docker-compose -f docker-compose.hooks.yml --profile hybrid up -d

# With Redis cluster
REDIS_URL=redis://redis-cluster:6379 \
ACTIVATION_WRAPPER=1 HOOKS_MODE=1 \
  docker-compose -f docker-compose.hooks.yml --profile hybrid up -d
```

### Kubernetes (Enterprise)

See [Deployment Guide](../../../docs/HOOKS_DEPLOYMENT_GUIDE.md) for full Kubernetes setup.

Quick start:
```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/hooks/

# Check status
kubectl get pods -n codehornets-ai

# View logs
kubectl logs -f deployment/marie -n codehornets-ai
```

## CI/CD Integration

GitHub Actions workflow included at `.github/workflows/test-hooks.yml`.

Automated tests run on:
- Push to main/develop
- Pull requests
- Manual workflow dispatch

Test coverage:
- Container health checks
- Trigger file processing
- Named pipe communication
- Performance benchmarks
- Security scanning

## Documentation

- **[Deployment Guide](../../../docs/HOOKS_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Troubleshooting](../../../docs/HOOKS_TROUBLESHOOTING.md)** - Comprehensive troubleshooting runbook
- **[Communication Patterns](../../../docs/INTER_AGENT_COMMUNICATION_PATTERNS.md)** - Inter-agent communication overview

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/codehornets/codehornets-ai/issues
- Documentation: /docs/
- Makefile help: `make help`

## License

See LICENSE file in repository root.
