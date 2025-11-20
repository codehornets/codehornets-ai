# Watcher System Integration Guide

## Overview

This guide explains how to integrate the production-ready watcher scripts with the existing `activation_wrapper.py` for a complete hooks-based agent communication system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Orchestrator                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  orchestrator_listener.py                              │ │
│  │  - Monitors all worker results                         │ │
│  │  - Aggregates completions                              │ │
│  │  - Notifies orchestrator                               │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Marie   │   │  Anga   │   │ Fabien  │
    │ Worker  │   │ Worker  │   │ Worker  │
    └─────────┘   └─────────┘   └─────────┘
         │             │             │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │ worker_ │   │ worker_ │   │ worker_ │
    │watcher.py│   │watcher.py│   │watcher.py│
    └─────────┘   └─────────┘   └─────────┘
         │             │             │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │activation│   │activation│   │activation│
    │_wrapper.py│   │_wrapper.py│   │_wrapper.py│
    └─────────┘   └─────────┘   └─────────┘
```

## Component Relationships

### activation_wrapper.py (Existing)
- **Purpose**: Zero-CPU idle mode, instant task wakeup
- **Features**: inotify/Redis activation, subprocess management
- **Scope**: Single worker, basic task execution

### worker_watcher.py (New)
- **Purpose**: Production-ready task processing with advanced error handling
- **Features**: Retry logic, circuit breaker, DLQ, metrics
- **Scope**: Enhanced worker with observability

### orchestrator_listener.py (New)
- **Purpose**: Multi-worker coordination
- **Features**: Result aggregation, worker health monitoring
- **Scope**: System-wide coordination

## Integration Approach

### Option 1: Replace activation_wrapper.py (Recommended)

Use `worker_watcher.py` as a complete replacement for `activation_wrapper.py`.

**Advantages:**
- Single process per worker
- Comprehensive error handling
- Production-ready observability
- Simpler deployment

**Migration:**
```bash
# Old
python activation_wrapper.py marie --mode inotify

# New
python worker_watcher.py marie --max-concurrent 3
```

### Option 2: Coexistence (Hybrid)

Run both `activation_wrapper.py` and `worker_watcher.py` together.

**Use case:** Gradual migration or A/B testing

**Architecture:**
```
activation_wrapper.py (watches tasks/)
    │
    ├─> Executes claude CLI
    │
worker_watcher.py (watches results/)
    │
    ├─> Monitors execution
    ├─> Handles retries
    └─> Manages DLQ
```

**Coordination:**
- `activation_wrapper.py`: Handles initial task execution
- `worker_watcher.py`: Monitors results, handles failures

**Implementation:**
```python
# activation_wrapper.py modification
# After task completion, write metadata for watcher
result_meta = {
    "task_id": task_id,
    "execution_time": duration,
    "status": "completed" if exit_code == 0 else "needs_retry"
}
Path(f"/shared/execution_meta/{task_id}.json").write_text(json.dumps(result_meta))
```

### Option 3: Wrapper as Executor (Delegation)

Use `worker_watcher.py` as coordinator, delegate to `activation_wrapper.py`.

**Architecture:**
```
worker_watcher.py
    │
    └─> subprocess: activation_wrapper.py --once task-001.json
```

**Not Recommended:** Adds complexity without significant benefit.

## Configuration

### Environment Variables

Create `/shared/.env`:

```bash
# Worker Configuration
MAX_CONCURRENT_TASKS=3
TASK_TIMEOUT=600
HEARTBEAT_INTERVAL=10

# Retry Configuration
MAX_RETRIES=3
RETRY_BACKOFF=2.0
INITIAL_RETRY_DELAY=1.0

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60

# Directories
TASK_DIR=/shared/tasks
TRIGGER_DIR=/shared/triggers
RESULT_DIR=/shared/results
HEARTBEAT_DIR=/shared/heartbeats
DLQ_DIR=/shared/dlq

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Metrics
ENABLE_METRICS=true
METRICS_PORT=9090

# Claude CLI
CLAUDE_COMMAND=claude
```

### Directory Structure

```
/shared/
├── tasks/
│   ├── marie/           # Worker-specific task queues
│   ├── anga/
│   └── fabien/
├── triggers/
│   ├── marie/           # Task receipt signals
│   ├── anga/
│   ├── fabien/
│   └── orchestrator/    # Orchestrator notifications
├── results/
│   ├── marie/           # Worker results
│   ├── anga/
│   └── fabien/
├── heartbeats/
│   ├── marie.json       # Worker health status
│   ├── anga.json
│   └── fabien.json
├── dlq/
│   ├── marie/           # Dead letter queue
│   ├── anga/
│   └── fabien/
└── pipes/               # Named pipes (optional)
    ├── marie.pipe
    ├── anga.pipe
    └── fabien.pipe
```

## Deployment

### Single Host

```bash
# Terminal 1: Marie Worker
python worker_watcher.py marie

# Terminal 2: Anga Worker
python worker_watcher.py anga

# Terminal 3: Fabien Worker
python worker_watcher.py fabien

# Terminal 4: Orchestrator Listener
python orchestrator_listener.py
```

### Docker Compose

Create `docker-compose.watcher.yml`:

```yaml
version: '3.8'

services:
  marie-watcher:
    build:
      context: .
      dockerfile: Dockerfile.watcher
    environment:
      - WORKER_NAME=marie
      - MAX_CONCURRENT_TASKS=3
      - LOG_LEVEL=INFO
    volumes:
      - ./shared:/shared
      - ./prompts:/prompts:ro
    command: python worker_watcher.py marie
    restart: unless-stopped

  anga-watcher:
    build:
      context: .
      dockerfile: Dockerfile.watcher
    environment:
      - WORKER_NAME=anga
      - MAX_CONCURRENT_TASKS=3
      - LOG_LEVEL=INFO
    volumes:
      - ./shared:/shared
      - ./prompts:/prompts:ro
    command: python worker_watcher.py anga
    restart: unless-stopped

  fabien-watcher:
    build:
      context: .
      dockerfile: Dockerfile.watcher
    environment:
      - WORKER_NAME=fabien
      - MAX_CONCURRENT_TASKS=3
      - LOG_LEVEL=INFO
    volumes:
      - ./shared:/shared
      - ./prompts:/prompts:ro
    command: python worker_watcher.py fabien
    restart: unless-stopped

  orchestrator-listener:
    build:
      context: .
      dockerfile: Dockerfile.watcher
    environment:
      - WORKERS=marie,anga,fabien
      - LOG_LEVEL=INFO
    volumes:
      - ./shared:/shared
    command: python orchestrator_listener.py
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

volumes:
  prometheus-data:
```

### Dockerfile

Create `Dockerfile.watcher`:

```dockerfile
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI
RUN curl -fsSL https://raw.githubusercontent.com/anthropics/claude-cli/main/install.sh | sh

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy watcher scripts
COPY tools/watcher_config.py /app/
COPY tools/worker_watcher.py /app/
COPY tools/orchestrator_listener.py /app/

WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD test -f /shared/heartbeats/${WORKER_NAME}.json || exit 1

CMD ["python", "worker_watcher.py"]
```

## Monitoring

### Prometheus Metrics

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'marie-watcher'
    static_configs:
      - targets: ['marie-watcher:9090']

  - job_name: 'anga-watcher'
    static_configs:
      - targets: ['anga-watcher:9090']

  - job_name: 'fabien-watcher'
    static_configs:
      - targets: ['fabien-watcher:9090']
```

### Available Metrics

- `watcher_tasks_processed_total{worker, status}` - Total tasks processed
- `watcher_tasks_failed_total{worker, reason}` - Total failed tasks
- `watcher_task_duration_seconds{worker}` - Task execution duration histogram
- `watcher_task_queue_size{worker}` - Current queue size
- `watcher_active_tasks{worker}` - Currently executing tasks
- `watcher_circuit_breaker_state{worker}` - Circuit breaker state (0=closed, 1=open, 2=half-open)

### Grafana Dashboard

Import the provided dashboard JSON:

```json
{
  "dashboard": {
    "title": "Agent Watcher Metrics",
    "panels": [
      {
        "title": "Task Throughput",
        "targets": [
          {
            "expr": "rate(watcher_tasks_processed_total[5m])"
          }
        ]
      },
      {
        "title": "Task Duration (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(watcher_task_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Queue Size",
        "targets": [
          {
            "expr": "watcher_task_queue_size"
          }
        ]
      }
    ]
  }
}
```

## Health Checks

### Worker Health

Check worker heartbeat:

```bash
# Check heartbeat file age
python -c "
import json, time
from pathlib import Path

heartbeat = json.loads(Path('/shared/heartbeats/marie.json').read_text())
age = time.time() - float(heartbeat['timestamp'])
print(f'Age: {age:.1f}s, Status: {heartbeat[\"status\"]}')
"
```

### System Health

```bash
# Check all workers
for worker in marie anga fabien; do
    if [ -f /shared/heartbeats/$worker.json ]; then
        echo "$worker: $(jq -r .status /shared/heartbeats/$worker.json)"
    else
        echo "$worker: MISSING"
    fi
done
```

## Testing

### Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest tools/test_watcher.py -v

# With coverage
pytest tools/test_watcher.py --cov=tools --cov-report=html

# Run specific test
pytest tools/test_watcher.py::TestWorkerWatcher::test_circuit_breaker -v
```

### Integration Test

```bash
# Create test task
cat > /shared/tasks/marie/test-001.json << EOF
{
  "task_id": "test-001",
  "description": "Echo 'Hello from integration test'",
  "worker": "marie"
}
EOF

# Monitor result
watch -n 1 'ls -lh /shared/results/marie/'

# Check result
cat /shared/results/marie/test-001.json | jq
```

### Load Test

```bash
# Generate 100 tasks
for i in {1..100}; do
    cat > /shared/tasks/marie/load-$(printf %03d $i).json << EOF
{
  "task_id": "load-$(printf %03d $i)",
  "description": "Load test task $i",
  "worker": "marie"
}
EOF
done

# Monitor processing
watch -n 1 'echo "Pending: $(ls /shared/tasks/marie/ | wc -l)"; echo "Completed: $(ls /shared/results/marie/ | wc -l)"'
```

## Troubleshooting

### Issue: Tasks Not Processing

**Symptoms:** Tasks remain in queue, no results generated

**Checks:**
```bash
# 1. Check worker health
cat /shared/heartbeats/marie.json | jq

# 2. Check worker logs
docker logs marie-watcher

# 3. Check queue size
ls -la /shared/tasks/marie/

# 4. Check circuit breaker state
# (Check metrics endpoint or logs)
```

**Solutions:**
- Restart worker if unhealthy
- Check Claude CLI authentication
- Verify file permissions
- Review circuit breaker state

### Issue: High Failure Rate

**Symptoms:** Many tasks in DLQ, circuit breaker open

**Checks:**
```bash
# 1. Check DLQ
ls -la /shared/dlq/marie/

# 2. Examine failed task
cat /shared/dlq/marie/task-*.json | jq

# 3. Check error logs
docker logs marie-watcher 2>&1 | grep ERROR
```

**Solutions:**
- Review task format
- Check Claude CLI availability
- Adjust retry configuration
- Investigate task-specific errors

### Issue: Slow Processing

**Symptoms:** Long queue, slow throughput

**Checks:**
```bash
# Check metrics
curl http://localhost:9090/metrics | grep watcher_task_duration

# Check concurrent tasks
cat /shared/heartbeats/marie.json | jq .active_tasks
```

**Solutions:**
- Increase `MAX_CONCURRENT_TASKS`
- Optimize task descriptions
- Check for resource constraints
- Scale horizontally (more workers)

## Migration Checklist

- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Create directory structure (`/shared/*`)
- [ ] Configure environment variables (`.env`)
- [ ] Update system prompts (`/prompts/*.md`)
- [ ] Test single worker (`python worker_watcher.py marie`)
- [ ] Verify task processing (create test task)
- [ ] Start orchestrator listener
- [ ] Configure monitoring (Prometheus + Grafana)
- [ ] Set up health checks
- [ ] Deploy with Docker Compose
- [ ] Run integration tests
- [ ] Configure alerting
- [ ] Document custom workflows
- [ ] Train team on new system

## Performance Benchmarks

Expected performance (3 workers, default config):

- **Task detection latency**: < 100ms (inotify)
- **Task processing throughput**: 3-9 tasks/minute (depends on task complexity)
- **Idle CPU usage**: < 1% (zero-CPU mode)
- **Active CPU usage**: 50-200% per worker (during Claude execution)
- **Memory usage**: 200-500MB per worker
- **Metrics overhead**: < 5% CPU

## Best Practices

1. **Task Design**
   - Keep tasks atomic and idempotent
   - Include clear, specific descriptions
   - Set realistic timeouts
   - Add context in metadata

2. **Error Handling**
   - Review DLQ regularly
   - Set appropriate retry limits
   - Monitor circuit breaker state
   - Investigate failure patterns

3. **Monitoring**
   - Set up alerting on key metrics
   - Monitor worker health continuously
   - Track task duration trends
   - Review logs regularly

4. **Scaling**
   - Start with 3 concurrent tasks per worker
   - Scale horizontally before vertically
   - Monitor API rate limits
   - Use circuit breaker to prevent cascading failures

5. **Security**
   - Isolate worker file access
   - Rotate credentials regularly
   - Review DLQ for sensitive data
   - Encrypt results at rest

## Support

For issues or questions:
- Check logs: `docker logs <container>`
- Review metrics: `http://localhost:9090/metrics`
- Examine heartbeats: `cat /shared/heartbeats/*.json`
- Run tests: `pytest tools/test_watcher.py -v`

## References

- [activation_wrapper.py](./activation_wrapper.py) - Original wrapper
- [worker_watcher.py](./worker_watcher.py) - Enhanced worker
- [orchestrator_listener.py](./orchestrator_listener.py) - Coordinator
- [watcher_config.py](./watcher_config.py) - Configuration
- [Watchdog Documentation](https://python-watchdog.readthedocs.io/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)
