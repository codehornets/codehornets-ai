# Runbook: Debugging Worker Crashes

## Alert Context
**Triggered by:** Worker down alert or watcher heartbeat missing

## Immediate Actions

### 1. Verify Worker Status
```bash
# Check if worker container is running
docker ps -a | grep -E "marie|anga|fabien"

# Check worker process
ps aux | grep -E "watcher|claude"

# Check last heartbeat
for worker in marie anga fabien; do
  echo "=== $worker ==="
  cat /shared/workers/$worker/heartbeat.json 2>/dev/null || echo "No heartbeat file"
done
```

### 2. Check Crash Logs
```bash
# Docker logs
docker logs marie --tail 100 --since 10m
docker logs anga --tail 100 --since 10m
docker logs fabien --tail 100 --since 10m

# System logs
journalctl -u agent-worker-marie -n 100
journalctl -u agent-worker-anga -n 100
journalctl -u agent-worker-fabien -n 100

# Application logs
tail -n 100 /var/log/agents/marie.log
tail -n 100 /var/log/agents/anga.log
tail -n 100 /var/log/agents/fabien.log
```

### 3. Quick Recovery
```bash
# Restart crashed worker
docker restart marie  # or anga, fabien

# Or restart systemd service
systemctl restart agent-worker-marie

# Verify restart
sleep 5
docker ps | grep marie
curl -f http://marie:9091/metrics || echo "Metrics endpoint not responding"
```

## Root Cause Analysis

### 1. Memory Issues
```python
import psutil
import docker

def check_memory_issues(worker_name):
    # Check OOM killer
    with open('/var/log/syslog') as f:
        for line in f:
            if 'oom-killer' in line.lower() and worker_name in line:
                print(f"OOM killer detected for {worker_name}: {line}")

    # Check container limits
    client = docker.from_env()
    try:
        container = client.containers.get(worker_name)
        stats = container.stats(stream=False)

        memory_usage = stats['memory_stats']['usage']
        memory_limit = stats['memory_stats']['limit']

        print(f"Memory Usage: {memory_usage / 1024 / 1024:.2f} MB")
        print(f"Memory Limit: {memory_limit / 1024 / 1024:.2f} MB")
        print(f"Usage %: {memory_usage / memory_limit * 100:.2f}%")

    except docker.errors.NotFound:
        print(f"Container {worker_name} not found")

# Check each worker
for worker in ["marie", "anga", "fabien"]:
    print(f"\n=== {worker} ===")
    check_memory_issues(worker)
```

### 2. File Descriptor Exhaustion
```bash
# Check file descriptor limits
for worker in marie anga fabien; do
  echo "=== $worker ==="
  docker exec $worker sh -c "ulimit -n"
  docker exec $worker sh -c "ls /proc/self/fd | wc -l"
done

# Check system-wide limits
cat /proc/sys/fs/file-nr
sysctl fs.file-max
```

### 3. Deadlock Detection
```python
import threading
import time
from pathlib import Path
import json

def detect_deadlock(worker_name):
    """Check for potential deadlocks in task processing"""

    # Check for tasks stuck in transition
    task_dir = Path(f"/shared/tasks/{worker_name}")

    # Tasks that started processing but never completed
    active_tasks = list((task_dir / "active").glob("*.json"))
    stuck_tasks = []

    for task_file in active_tasks:
        age = time.time() - task_file.stat().st_mtime
        if age > 600:  # Stuck for more than 10 minutes
            with open(task_file) as f:
                task = json.load(f)
                stuck_tasks.append({
                    'id': task.get('id'),
                    'age_minutes': age / 60,
                    'type': task.get('type')
                })

    if stuck_tasks:
        print(f"Potential deadlock detected - {len(stuck_tasks)} stuck tasks:")
        for task in stuck_tasks:
            print(f"  - Task {task['id']}: {task['age_minutes']:.1f} minutes old")

    # Check lock files
    lock_files = list(Path("/shared/locks").glob(f"{worker_name}_*.lock"))
    for lock_file in lock_files:
        age = time.time() - lock_file.stat().st_mtime
        if age > 300:  # Lock held for more than 5 minutes
            print(f"Stale lock detected: {lock_file.name} ({age/60:.1f} minutes old)")
```

### 4. Dependency Issues
```bash
# Check Claude binary
for worker in marie anga fabien; do
  echo "=== $worker ==="
  docker exec $worker which claude || echo "Claude not found"
  docker exec $worker claude --version || echo "Claude not executable"
done

# Check Python dependencies
for worker in marie anga fabien; do
  echo "=== $worker ==="
  docker exec $worker pip list | grep -E "opentelemetry|prometheus|structlog"
done

# Check named pipes
ls -la /shared/pipes/
for pipe in /shared/pipes/*; do
  stat $pipe
done
```

## Recovery Procedures

### 1. Clean Recovery
```python
from pathlib import Path
import shutil
import json
import time

def clean_recovery(worker_name):
    """Perform clean recovery of crashed worker"""

    print(f"Starting clean recovery for {worker_name}")

    # 1. Move active tasks back to pending
    active_dir = Path(f"/shared/tasks/{worker_name}/active")
    pending_dir = Path(f"/shared/tasks/{worker_name}/pending")

    for task_file in active_dir.glob("*.json"):
        print(f"Moving {task_file.name} back to pending")
        with open(task_file) as f:
            task = json.load(f)

        # Add retry information
        task['retry_count'] = task.get('retry_count', 0) + 1
        task['last_failure'] = time.time()
        task['failure_reason'] = 'worker_crash'

        # Write to pending with retry info
        with open(pending_dir / task_file.name, 'w') as f:
            json.dump(task, f, indent=2)

        # Remove from active
        task_file.unlink()

    # 2. Clean up lock files
    lock_dir = Path("/shared/locks")
    for lock_file in lock_dir.glob(f"{worker_name}_*.lock"):
        print(f"Removing stale lock: {lock_file.name}")
        lock_file.unlink()

    # 3. Reset worker state
    state_file = Path(f"/shared/workers/{worker_name}/state.json")
    state = {
        'status': 'recovering',
        'last_crash': time.time(),
        'recovery_count': 1 if not state_file.exists() else json.loads(state_file.read_text()).get('recovery_count', 0) + 1
    }
    state_file.write_text(json.dumps(state, indent=2))

    # 4. Clear temporary files
    tmp_dir = Path(f"/tmp/{worker_name}")
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
        tmp_dir.mkdir()

    print(f"Clean recovery completed for {worker_name}")
```

### 2. Start with Debugging
```bash
# Start worker with verbose logging
docker run -d \
  --name marie-debug \
  -e LOG_LEVEL=DEBUG \
  -e OTEL_TRACES_EXPORTER=otlp \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
  -v /shared:/shared \
  --network observability \
  agent-worker:marie \
  python -u /app/watcher.py --debug

# Watch logs in real-time
docker logs -f marie-debug

# Enable core dumps for post-mortem debugging
docker exec marie-debug sh -c "ulimit -c unlimited"
```

### 3. Gradual Task Resume
```python
import time
from pathlib import Path

def gradual_resume(worker_name, batch_size=5, delay=30):
    """Gradually resume task processing after crash"""

    pending_dir = Path(f"/shared/tasks/{worker_name}/pending")
    staged_dir = Path(f"/shared/tasks/{worker_name}/staged")
    staged_dir.mkdir(exist_ok=True)

    # Get all pending tasks
    pending_tasks = sorted(pending_dir.glob("*.json"),
                          key=lambda p: p.stat().st_mtime)

    print(f"Found {len(pending_tasks)} pending tasks")

    # Process in batches
    for i in range(0, len(pending_tasks), batch_size):
        batch = pending_tasks[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1}: {len(batch)} tasks")

        for task_file in batch:
            # Move to staged for processing
            task_file.rename(staged_dir / task_file.name)

        # Wait for batch to process
        print(f"Waiting {delay}s for batch to process...")
        time.sleep(delay)

        # Check for failures
        failed = list((Path(f"/shared/tasks/{worker_name}/failed")).glob("*.json"))
        if len(failed) > batch_size * 0.5:
            print("High failure rate detected, stopping gradual resume")
            break

    print("Gradual resume completed")
```

## Monitoring During Recovery

### Real-time Health Checks
```python
import time
import requests
from datetime import datetime

def monitor_recovery(worker_name, duration=300):
    """Monitor worker recovery for specified duration"""

    start_time = time.time()
    metrics_url = f"http://{worker_name}:909{1 if worker_name == 'marie' else 2 if worker_name == 'anga' else 3}/metrics"

    print(f"Monitoring {worker_name} recovery for {duration}s")

    while time.time() - start_time < duration:
        try:
            # Check metrics endpoint
            response = requests.get(metrics_url, timeout=5)
            if response.status_code == 200:
                # Parse key metrics
                lines = response.text.split('\n')
                for line in lines:
                    if 'active_tasks' in line and not line.startswith('#'):
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {line.strip()}")
                    elif 'task_failed_total' in line and not line.startswith('#'):
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {line.strip()}")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Metrics endpoint returned {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Failed to reach metrics: {e}")

        time.sleep(10)

    print("Monitoring completed")
```

### Trace Recovery Process
```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

def trace_recovery(worker_name):
    """Create traces for recovery process"""

    tracer = trace.get_tracer(__name__)

    with tracer.start_as_current_span(
        name="worker_recovery",
        attributes={
            "worker.name": worker_name,
            "recovery.type": "crash",
            "recovery.timestamp": datetime.utcnow().isoformat()
        }
    ) as span:
        try:
            # Recovery steps with tracing
            with tracer.start_as_current_span("check_crash_reason"):
                # Check logs for crash reason
                pass

            with tracer.start_as_current_span("clean_state"):
                # Clean worker state
                pass

            with tracer.start_as_current_span("restart_worker"):
                # Restart worker process
                pass

            with tracer.start_as_current_span("verify_health"):
                # Verify worker is healthy
                pass

            span.set_status(Status(StatusCode.OK))
            span.add_event("recovery_completed")

        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise
```

## Prevention Measures

### 1. Resource Limits
```yaml
# docker-compose.yml additions
services:
  marie:
    mem_limit: 2g
    memswap_limit: 2g
    cpu_quota: 100000
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
      nproc:
        soft: 32768
        hard: 32768
```

### 2. Health Checks
```python
def setup_health_checks(worker_name):
    """Configure health checks for worker"""

    health_check = {
        "test": ["CMD", "curl", "-f", f"http://localhost:909{1 if worker_name == 'marie' else 2}/metrics"],
        "interval": "30s",
        "timeout": "10s",
        "retries": 3,
        "start_period": "40s"
    }

    # Write to docker-compose override
    with open("docker-compose.override.yml", "a") as f:
        f.write(f"""
  {worker_name}:
    healthcheck:
      test: {health_check['test']}
      interval: {health_check['interval']}
      timeout: {health_check['timeout']}
      retries: {health_check['retries']}
      start_period: {health_check['start_period']}
""")
```

### 3. Automatic Recovery
```python
import subprocess
import time

class WorkerSupervisor:
    def __init__(self, worker_name, max_restarts=3):
        self.worker_name = worker_name
        self.max_restarts = max_restarts
        self.restart_count = 0
        self.last_restart = 0

    def check_and_restart(self):
        """Check worker health and restart if needed"""

        # Check if worker is running
        result = subprocess.run(
            ["docker", "ps", "-q", "-f", f"name={self.worker_name}"],
            capture_output=True, text=True
        )

        if not result.stdout.strip():
            # Worker not running
            if self.restart_count >= self.max_restarts:
                print(f"Max restarts reached for {self.worker_name}")
                return False

            # Check cooldown
            if time.time() - self.last_restart < 60:
                print(f"Cooldown period for {self.worker_name}")
                return False

            # Restart worker
            print(f"Restarting {self.worker_name}")
            subprocess.run(["docker", "start", self.worker_name])
            self.restart_count += 1
            self.last_restart = time.time()
            return True

        return True

# Run supervisor
supervisors = [
    WorkerSupervisor("marie"),
    WorkerSupervisor("anga"),
    WorkerSupervisor("fabien")
]

while True:
    for supervisor in supervisors:
        supervisor.check_and_restart()
    time.sleep(30)
```

## Post-Recovery Actions

### 1. Analyze Crash Dump
```bash
# If core dump was generated
gdb /usr/local/bin/python /path/to/core
(gdb) bt full
(gdb) info threads
(gdb) thread apply all bt

# Save analysis
(gdb) set logging on crash-analysis.txt
(gdb) thread apply all bt full
```

### 2. Update Monitoring
- Add crash detection alerts
- Implement predictive failure detection
- Set up automatic recovery procedures

### 3. Document Incident
Create post-mortem document with:
- Timeline of events
- Root cause analysis
- Impact assessment
- Action items to prevent recurrence

## Escalation Path

1. **Automated Recovery (0-5 min)**
   - Health check failure triggers auto-restart
   - Tasks automatically redistributed

2. **L1 Response (5-15 min)**
   - Manual restart if auto-recovery fails
   - Check basic logs and metrics

3. **L2 Response (15-30 min)**
   - Deep debugging with traces
   - Resource optimization
   - Clean recovery procedure

4. **L3 Response (30+ min)**
   - Code-level debugging
   - Architecture review
   - Consider switching to backup workers