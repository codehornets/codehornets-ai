# Runbook: Investigating Slow Task Processing

## Alert Context
**Triggered by:** High task processing latency (P95 > 30s)

## Immediate Actions

### 1. Check Current System Status
```bash
# Check active tasks per worker
curl -s http://prometheus:9090/api/v1/query?query=active_tasks | jq

# Check queue depth
curl -s http://prometheus:9090/api/v1/query?query=task_queue_depth | jq

# Check error rates
curl -s http://prometheus:9090/api/v1/query?query=rate(task_failed_total[5m]) | jq
```

### 2. Identify Slow Tasks
```bash
# Query Jaeger for slow traces
curl -s "http://jaeger:16686/api/traces?service=agent-orchestrator&minDuration=30s&limit=10" | jq

# Get trace details for specific slow task
curl -s "http://jaeger:16686/api/traces/{trace-id}" | jq
```

### 3. Check Worker Health
```python
from observability.instrumentation.metrics import MetricsAggregator
from pathlib import Path
import json

# Check worker watcher status
def check_worker_health(worker_name):
    # Check heartbeat
    heartbeat_file = Path(f"/shared/workers/{worker_name}/heartbeat.json")
    if heartbeat_file.exists():
        with open(heartbeat_file) as f:
            heartbeat = json.load(f)
            print(f"Last heartbeat: {heartbeat['timestamp']}")

    # Check active tasks
    active_dir = Path(f"/shared/tasks/{worker_name}/active")
    active_tasks = list(active_dir.glob("*.json"))
    print(f"Active tasks: {len(active_tasks)}")

    # Check oldest task
    if active_tasks:
        oldest = min(active_tasks, key=lambda p: p.stat().st_mtime)
        age = time.time() - oldest.stat().st_mtime
        print(f"Oldest task: {oldest.name}, Age: {age}s")

# Check each worker
for worker in ["marie", "anga", "fabien"]:
    print(f"\n=== Worker: {worker} ===")
    check_worker_health(worker)
```

## Root Cause Analysis

### 1. Resource Bottlenecks
```bash
# Check CPU usage
curl -s http://prometheus:9090/api/v1/query?query=system_cpu_usage_percent | jq

# Check memory usage
curl -s http://prometheus:9090/api/v1/query?query=system_memory_usage_bytes | jq

# Check disk I/O
curl -s http://prometheus:9090/api/v1/query?query=rate(system_io_operations_total[5m]) | jq
```

### 2. Claude Process Issues
```bash
# Check Claude invocation failures
curl -s http://prometheus:9090/api/v1/query?query=rate(claude_api_errors_total[5m]) | jq

# Check Claude memory usage
curl -s http://prometheus:9090/api/v1/query?query=claude_memory_usage_bytes | jq
```

### 3. Named Pipe Communication
```bash
# Check pipe errors
curl -s http://prometheus:9090/api/v1/query?query=rate(pipe_connection_errors_total[5m]) | jq

# Check pipe write latency
curl -s http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,rate(pipe_write_latency_seconds_bucket[5m])) | jq
```

## Detailed Investigation

### 1. Trace Analysis
```python
from observability.instrumentation.tracing import ObservabilityManager, TaskTracer
import requests

def analyze_slow_trace(trace_id):
    # Get trace from Jaeger
    response = requests.get(f"http://jaeger:16686/api/traces/{trace_id}")
    trace_data = response.json()

    # Analyze spans
    spans = trace_data['data'][0]['spans']

    # Find slowest operations
    slow_ops = sorted(spans, key=lambda s: s['duration'], reverse=True)[:5]

    for span in slow_ops:
        print(f"Operation: {span['operationName']}")
        print(f"Duration: {span['duration'] / 1000}ms")
        print(f"Tags: {span['tags']}")
        print("---")

    # Check for errors
    error_spans = [s for s in spans if any(t['key'] == 'error' and t['value'] for t in s['tags'])]
    if error_spans:
        print("\nError spans found:")
        for span in error_spans:
            print(f"Operation: {span['operationName']}")
            print(f"Error: {[t['value'] for t in span['tags'] if t['key'] == 'error.message']}")
```

### 2. Log Correlation
```bash
# Get logs for specific task
task_id="task-123"
correlation_id="corr-456"

# Query Loki for correlated logs
curl -G -s "http://loki:3100/loki/api/v1/query_range" \
  --data-urlencode "query={job=\"agent-orchestrator\"} |= \"$task_id\"" \
  --data-urlencode "start=$(date -d '1 hour ago' +%s)000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq

# Filter by correlation ID
curl -G -s "http://loki:3100/loki/api/v1/query_range" \
  --data-urlencode "query={job=\"agent-orchestrator\"} | json | correlation_id=\"$correlation_id\"" | jq
```

### 3. Task Replay
```python
from pathlib import Path
import json
import shutil

def replay_slow_task(task_id, worker_name):
    """Replay a slow task for debugging"""

    # Find task file
    task_file = Path(f"/shared/tasks/{worker_name}/failed/{task_id}.json")
    if not task_file.exists():
        task_file = Path(f"/shared/tasks/{worker_name}/completed/{task_id}.json")

    if not task_file.exists():
        print(f"Task {task_id} not found")
        return

    # Load task data
    with open(task_file) as f:
        task_data = json.load(f)

    # Remove trace context for fresh replay
    if '_trace_context' in task_data:
        del task_data['_trace_context']

    # Add debug flag
    task_data['debug'] = True
    task_data['replay'] = True

    # Write to pending queue
    replay_file = Path(f"/shared/tasks/{worker_name}/pending/{task_id}_replay.json")
    with open(replay_file, 'w') as f:
        json.dump(task_data, f, indent=2)

    print(f"Task {task_id} queued for replay at {replay_file}")
```

## Mitigation Actions

### 1. Immediate Relief
```bash
# Scale workers horizontally (if containerized)
docker-compose scale marie=2 anga=2 fabien=2

# Clear stuck tasks
python3 << EOF
from pathlib import Path
import time

worker = "marie"  # Change as needed
active_dir = Path(f"/shared/tasks/{worker}/active")

for task_file in active_dir.glob("*.json"):
    age = time.time() - task_file.stat().st_mtime
    if age > 300:  # Stuck for more than 5 minutes
        # Move to failed queue for investigation
        failed_dir = Path(f"/shared/tasks/{worker}/failed")
        failed_dir.mkdir(exist_ok=True)
        task_file.rename(failed_dir / task_file.name)
        print(f"Moved stuck task: {task_file.name}")
EOF
```

### 2. Performance Tuning
```python
# Adjust batch sizes
def optimize_batch_size(worker_name):
    # Monitor current throughput
    # Adjust based on latency vs throughput trade-off
    config_file = Path(f"/shared/config/{worker_name}.json")
    with open(config_file) as f:
        config = json.load(f)

    # Reduce batch size if latency is high
    if config.get('batch_size', 10) > 5:
        config['batch_size'] = config.get('batch_size', 10) // 2

    with open(config_file, 'w') as f:
        json.dump(config, f)
```

### 3. Circuit Breaker
```python
# Implement circuit breaker for failing workers
class CircuitBreaker:
    def __init__(self, worker_name, failure_threshold=5, timeout=60):
        self.worker_name = worker_name
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure > self.timeout:
                self.state = "HALF_OPEN"
                self.failures = 0
            else:
                raise Exception(f"Circuit breaker OPEN for {self.worker_name}")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure = time.time()

            if self.failures >= self.failure_threshold:
                self.state = "OPEN"
                print(f"Circuit breaker opened for {self.worker_name}")

            raise e
```

## Monitoring During Incident

### Dashboard URLs
- **Task Overview:** http://grafana:3000/d/task-overview
- **Worker Details:** http://grafana:3000/d/worker-details
- **Traces:** http://jaeger:16686/search
- **Logs:** http://grafana:3000/explore (Loki datasource)

### Key Metrics to Watch
1. `task_processing_duration_seconds` - Should decrease
2. `task_queue_depth` - Should stabilize
3. `active_tasks` - Should be within limits
4. `task_failed_total` - Should not increase
5. `system_cpu_usage_percent` - Should be < 80%

## Post-Incident Actions

### 1. Document Findings
```bash
# Create incident report
cat << EOF > /shared/incidents/$(date +%Y%m%d-%H%M%S)-slow-tasks.md
# Incident Report: Slow Task Processing

**Date:** $(date)
**Duration:** [FILL IN]
**Impact:** [FILL IN]

## Root Cause
[FILL IN]

## Resolution
[FILL IN]

## Action Items
- [ ] [FILL IN]

## Metrics
- Peak latency: [FILL IN]
- Tasks affected: [FILL IN]
- Error rate: [FILL IN]
EOF
```

### 2. Update Alerts
- Review alert thresholds
- Add new alerts for discovered issues
- Update runbook with new findings

### 3. Capacity Planning
- Analyze growth trends
- Plan for scaling
- Optimize resource allocation

## Escalation Path

1. **L1 Response (0-15 min)**
   - Follow immediate actions
   - Check dashboards
   - Clear obvious blockers

2. **L2 Response (15-30 min)**
   - Deep trace analysis
   - Log correlation
   - Resource optimization

3. **L3 Response (30+ min)**
   - Code-level debugging
   - Architecture review
   - Consider rollback

## Contact Information

- **On-Call Engineer:** Check PagerDuty
- **Team Lead:** [Contact Info]
- **Architecture Team:** [Contact Info]
- **Infrastructure Team:** [Contact Info]