# Production-Ready Watcher System

Production-grade Python watcher scripts for hooks-based agent communication in multi-agent orchestration systems.

## Overview

This system provides enterprise-ready file watchers for coordinating work between an orchestrator and multiple worker agents (marie, anga, fabien) with comprehensive error handling, retry logic, observability, and zero-CPU idle mode.

## Components

### 1. `watcher_config.py`
Configuration module with Pydantic validation.

**Features:**
- Environment variable support
- Type validation
- Path management
- Sensible defaults

**Key Classes:**
- `WatcherConfig` - Worker configuration
- `OrchestratorConfig` - Orchestrator configuration
- `MetricsConfig` - Metrics settings

### 2. `worker_watcher.py`
Production-ready worker watcher with advanced error handling.

**Features:**
- ✅ inotify-based file watching (zero-CPU idle)
- ✅ Concurrent task execution (configurable semaphore)
- ✅ Exponential backoff retry logic
- ✅ Circuit breaker pattern
- ✅ Dead letter queue (DLQ)
- ✅ File locking (prevents duplicate processing)
- ✅ Structured logging (JSON/text)
- ✅ Prometheus metrics
- ✅ Health check heartbeat
- ✅ Graceful shutdown
- ✅ Trigger file creation

**Usage:**
```bash
python worker_watcher.py marie
python worker_watcher.py anga --max-concurrent 5 --log-level DEBUG
python worker_watcher.py fabien --metrics-port 9091
```

### 3. `orchestrator_listener.py`
Multi-worker coordination and result aggregation.

**Features:**
- ✅ Monitors all worker result directories
- ✅ Worker health monitoring (heartbeat checking)
- ✅ Task timeout detection
- ✅ State persistence (survives restarts)
- ✅ Orchestrator notifications
- ✅ Completion aggregation
- ✅ Worker disconnection handling

**Usage:**
```bash
python orchestrator_listener.py
python orchestrator_listener.py --workers marie,anga,fabien --log-level DEBUG
```

### 4. `test_watcher.py`
Comprehensive unit test suite.

**Features:**
- Configuration validation tests
- Circuit breaker tests
- Worker watcher tests
- Orchestrator listener tests
- Integration tests
- Performance tests

**Usage:**
```bash
pytest test_watcher.py -v
pytest test_watcher.py --cov=. --cov-report=html
pytest test_watcher.py::TestCircuitBreaker -v
```

### 5. `demo_watcher.py`
Demo script with example workflows.

**Features:**
- Directory structure setup
- Sample task creation
- Batch task generation
- System status monitoring

**Usage:**
```bash
python demo_watcher.py --setup
python demo_watcher.py --task marie "Evaluate student"
python demo_watcher.py --batch 10 --worker anga
python demo_watcher.py --status
```

## Quick Start

### 1. Installation

```bash
# Install dependencies
pip install -r requirements-watcher.txt

# Or with uv (faster)
uv pip install -r requirements-watcher.txt
```

### 2. Setup

```bash
# Create directory structure
python demo_watcher.py --setup

# Export environment variables
export TASK_DIR="/tmp/watcher_demo/tasks"
export TRIGGER_DIR="/tmp/watcher_demo/triggers"
export RESULT_DIR="/tmp/watcher_demo/results"
export HEARTBEAT_DIR="/tmp/watcher_demo/heartbeats"
export DLQ_DIR="/tmp/watcher_demo/dlq"
```

### 3. Start Workers

```bash
# Terminal 1: Marie worker
python worker_watcher.py marie

# Terminal 2: Anga worker
python worker_watcher.py anga

# Terminal 3: Fabien worker
python worker_watcher.py fabien
```

### 4. Start Orchestrator Listener

```bash
# Terminal 4: Orchestrator listener
python orchestrator_listener.py
```

### 5. Create Tasks

```bash
# Create single task
cat > /tmp/watcher_demo/tasks/marie/test-001.json << EOF
{
  "task_id": "test-001",
  "description": "List files in current directory",
  "worker": "marie"
}
EOF

# Or use demo script
python demo_watcher.py --task marie "List files"
```

### 6. Monitor

```bash
# Watch status
watch -n 1 'python demo_watcher.py --status'

# Check metrics
curl http://localhost:9090/metrics

# View heartbeats
cat /tmp/watcher_demo/heartbeats/marie.json | jq
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Orchestrator System               │
│  ┌───────────────────────────────────────┐ │
│  │   orchestrator_listener.py            │ │
│  │   • Monitors worker results           │ │
│  │   • Checks worker health              │ │
│  │   • Aggregates completions            │ │
│  │   • Persists state                    │ │
│  └───────────────────────────────────────┘ │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Marie  │ │  Anga   │ │ Fabien  │
│  Worker │ │ Worker  │ │ Worker  │
└─────────┘ └─────────┘ └─────────┘
     │         │         │
     ▼         ▼         ▼
┌──────────────────────────────────┐
│    worker_watcher.py             │
│    • Watches task directory      │
│    • Executes Claude CLI         │
│    • Handles retries             │
│    • Manages DLQ                 │
│    • Emits metrics               │
│    • Writes heartbeat            │
└──────────────────────────────────┘
```

## File Structure

```
/shared/
├── tasks/
│   ├── marie/          # Input: Task files
│   ├── anga/
│   └── fabien/
├── triggers/
│   ├── marie/          # Output: Task receipt signals
│   ├── anga/
│   ├── fabien/
│   └── orchestrator/   # Output: Completion notifications
├── results/
│   ├── marie/          # Output: Task results
│   ├── anga/
│   └── fabien/
├── heartbeats/
│   ├── marie.json      # Output: Worker health status
│   ├── anga.json
│   └── fabien.json
└── dlq/
    ├── marie/          # Output: Failed tasks
    ├── anga/
    └── fabien/
```

## Configuration

### Environment Variables

```bash
# Worker Configuration
MAX_CONCURRENT_TASKS=3          # Concurrent task limit
TASK_TIMEOUT=600                # Task timeout (seconds)
HEARTBEAT_INTERVAL=10           # Heartbeat frequency (seconds)

# Retry Configuration
MAX_RETRIES=3                   # Maximum retry attempts
RETRY_BACKOFF=2.0               # Backoff multiplier
INITIAL_RETRY_DELAY=1.0         # Initial delay (seconds)

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5     # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=60      # Timeout before retry (seconds)

# Directories
TASK_DIR=/shared/tasks
TRIGGER_DIR=/shared/triggers
RESULT_DIR=/shared/results
HEARTBEAT_DIR=/shared/heartbeats
DLQ_DIR=/shared/dlq

# Logging
LOG_LEVEL=INFO                  # DEBUG|INFO|WARNING|ERROR
LOG_FORMAT=json                 # json|text

# Metrics
ENABLE_METRICS=true
METRICS_PORT=9090

# Claude CLI
CLAUDE_COMMAND=claude
```

### Task File Format

```json
{
  "task_id": "unique-task-id",
  "worker": "marie",
  "description": "Task description for Claude CLI",
  "timeout": 600,
  "priority": "high",
  "dependencies": ["other-task-id"],
  "metadata": {
    "custom": "data"
  }
}
```

### Result File Format

```json
{
  "task_id": "unique-task-id",
  "worker": "marie",
  "status": "completed",
  "exit_code": 0,
  "stdout": "Task output...",
  "stderr": "",
  "duration_seconds": 45.2,
  "timestamp": "2025-11-19T10:30:00Z",
  "retry_count": 0
}
```

## Monitoring & Observability

### Metrics (Prometheus)

Available at `http://localhost:9090/metrics`:

- `watcher_tasks_processed_total{worker, status}`
- `watcher_tasks_failed_total{worker, reason}`
- `watcher_task_duration_seconds{worker}`
- `watcher_task_queue_size{worker}`
- `watcher_active_tasks{worker}`
- `watcher_circuit_breaker_state{worker}`

### Logging

Structured JSON logging (configurable to text):

```json
{
  "timestamp": "2025-11-19T10:30:00Z",
  "level": "INFO",
  "logger": "worker_watcher",
  "worker": "marie",
  "message": "Task completed",
  "task_id": "task-001",
  "duration": "45.2s"
}
```

### Health Checks

Heartbeat file updated every 10 seconds:

```json
{
  "worker": "marie",
  "timestamp": "2025-11-19T10:30:00Z",
  "uptime_seconds": 3600,
  "queue_size": 5,
  "active_tasks": 2,
  "circuit_breaker_state": "closed",
  "stats": {
    "tasks_processed": 150,
    "tasks_failed": 3,
    "tasks_retried": 5,
    "tasks_dlq": 1
  },
  "status": "healthy"
}
```

## Error Handling

### Retry Logic

Exponential backoff with configurable attempts:

```
Attempt 1: 1.0s delay
Attempt 2: 2.0s delay (1.0 * 2^1)
Attempt 3: 4.0s delay (1.0 * 2^2)
```

After max retries, task moves to DLQ.

### Circuit Breaker

Prevents cascading failures:

1. **CLOSED**: Normal operation
2. **OPEN**: After N failures, blocks new tasks
3. **HALF_OPEN**: After timeout, allows test request

### Dead Letter Queue (DLQ)

Failed tasks moved to DLQ with metadata:

```json
{
  "task_id": "failed-task",
  "description": "Original task",
  "dlq_reason": "max_retries_exceeded",
  "dlq_timestamp": "2025-11-19T10:30:00Z",
  "retry_count": 3
}
```

## Testing

### Unit Tests

```bash
# Run all tests
pytest test_watcher.py -v

# Run specific test class
pytest test_watcher.py::TestWorkerWatcher -v

# Run with coverage
pytest test_watcher.py --cov=. --cov-report=html

# Run specific test
pytest test_watcher.py::TestCircuitBreaker::test_circuit_breaker_opens_after_threshold -v
```

### Integration Testing

```bash
# 1. Setup demo environment
python demo_watcher.py --setup

# 2. Start workers (in separate terminals)
python worker_watcher.py marie
python worker_watcher.py anga
python worker_watcher.py fabien

# 3. Create test tasks
python demo_watcher.py --batch 10 --worker marie

# 4. Monitor status
watch -n 1 'python demo_watcher.py --status'

# 5. Verify results
ls -lh /tmp/watcher_demo/results/marie/
```

### Load Testing

```bash
# Generate 100 tasks
python demo_watcher.py --batch 100 --worker marie

# Monitor throughput
time python -c "
import time
from pathlib import Path

start = time.time()
while True:
    pending = len(list(Path('/tmp/watcher_demo/tasks/marie').glob('*.json')))
    completed = len(list(Path('/tmp/watcher_demo/results/marie').glob('*.json')))

    if pending == 0:
        break

    print(f'Pending: {pending}, Completed: {completed}')
    time.sleep(1)

print(f'Total time: {time.time() - start:.2f}s')
"
```

## Troubleshooting

### Tasks Not Processing

**Problem:** Tasks remain in queue

**Checks:**
```bash
# Check worker health
cat /tmp/watcher_demo/heartbeats/marie.json

# Check logs
# (if running in terminal, check output)

# Check file permissions
ls -la /tmp/watcher_demo/tasks/marie/
```

**Solutions:**
- Restart worker
- Check Claude CLI auth
- Verify directory permissions
- Review logs for errors

### High Failure Rate

**Problem:** Many tasks in DLQ

**Checks:**
```bash
# Check DLQ contents
ls -la /tmp/watcher_demo/dlq/marie/

# Examine failed task
cat /tmp/watcher_demo/dlq/marie/*.json | jq

# Check circuit breaker
cat /tmp/watcher_demo/heartbeats/marie.json | jq .circuit_breaker_state
```

**Solutions:**
- Review task format
- Check Claude CLI availability
- Adjust retry settings
- Investigate specific errors

### Slow Processing

**Problem:** Long queue times

**Checks:**
```bash
# Check metrics
curl http://localhost:9090/metrics | grep task_duration

# Check active tasks
cat /tmp/watcher_demo/heartbeats/marie.json | jq .active_tasks
```

**Solutions:**
- Increase `MAX_CONCURRENT_TASKS`
- Optimize task descriptions
- Add more workers
- Review task complexity

## Performance

Expected performance with default configuration:

| Metric | Value |
|--------|-------|
| Task detection latency | < 100ms |
| Idle CPU usage | < 1% |
| Active CPU usage | 50-200% per worker |
| Memory usage | 200-500MB per worker |
| Task throughput | 3-9 tasks/minute |
| Max concurrent tasks | 3 (configurable) |

## Integration with activation_wrapper.py

The new watcher system can replace or coexist with `activation_wrapper.py`:

### Option 1: Replace (Recommended)
Use `worker_watcher.py` as a complete replacement.

### Option 2: Coexist
Run both together for gradual migration.

### Option 3: Delegate
Use `worker_watcher.py` as coordinator.

See [WATCHER_INTEGRATION_GUIDE.md](./WATCHER_INTEGRATION_GUIDE.md) for details.

## Production Deployment

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.watcher.yml up -d

# View logs
docker-compose -f docker-compose.watcher.yml logs -f

# Stop services
docker-compose -f docker-compose.watcher.yml down
```

### Kubernetes

```bash
# Deploy workers
kubectl apply -f k8s/worker-deployment.yaml

# Deploy orchestrator
kubectl apply -f k8s/orchestrator-deployment.yaml

# Check status
kubectl get pods -l app=watcher
```

## Best Practices

1. **Task Design**
   - Keep tasks atomic and idempotent
   - Use clear, specific descriptions
   - Set realistic timeouts
   - Include context in metadata

2. **Error Handling**
   - Monitor DLQ regularly
   - Set appropriate retry limits
   - Track circuit breaker state
   - Investigate failure patterns

3. **Monitoring**
   - Alert on key metrics
   - Monitor worker health
   - Track duration trends
   - Review logs regularly

4. **Scaling**
   - Start with 3 concurrent tasks
   - Scale horizontally first
   - Monitor API rate limits
   - Use circuit breaker properly

5. **Security**
   - Isolate worker file access
   - Rotate credentials regularly
   - Review DLQ for sensitive data
   - Encrypt results at rest

## License

See main repository LICENSE file.

## Contributing

1. Run tests: `pytest test_watcher.py -v`
2. Format code: `black *.py`
3. Lint code: `ruff check *.py`
4. Type check: `mypy *.py`

## Support

For issues or questions:
- Review documentation in this README
- Check [WATCHER_INTEGRATION_GUIDE.md](./WATCHER_INTEGRATION_GUIDE.md)
- Run `python demo_watcher.py --examples`
- Examine logs and metrics
- Run unit tests

## References

- [activation_wrapper.py](./activation_wrapper.py) - Original activation system
- [Watchdog Documentation](https://python-watchdog.readthedocs.io/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Architecture Documentation](../docs/NEW_ORCHESTRATION_STRUCTURE.md)
