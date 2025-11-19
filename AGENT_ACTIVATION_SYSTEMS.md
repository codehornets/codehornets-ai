# Agent Activation Systems: Event-Driven Inter-Agent Communication

Making one Claude Code agent "wake up" another agent without polling or relying on the model to check for messages.

## The Problem

Current file-based polling is inefficient:
```python
# Marie worker polls constantly
while True:
    tasks = list(Path("/tasks/marie").glob("*.json"))
    if tasks:
        process(tasks[0])
    time.sleep(1)  # Wasteful, adds latency
```

**We need:** A "doorbell" system where orchestrator rings, worker wakes up instantly.

---

## Solution 1: inotify (Filesystem Watcher) ⭐ RECOMMENDED

**How it works:** OS-level filesystem events (no polling!). When orchestrator writes a file, worker is instantly notified.

### Implementation

```python
# marie_worker_inotify.py
import inotify.adapters
import json
from pathlib import Path

def worker_loop():
    """Marie worker with inotify - NO POLLING!"""
    task_dir = "/tasks/marie"
    Path(task_dir).mkdir(parents=True, exist_ok=True)

    # Create inotify watcher
    i = inotify.adapters.Inotify()
    i.add_watch(task_dir)

    print("Marie: Waiting for tasks... (zero CPU usage)")

    for event in i.event_gen(yield_nones=False):
        (_, type_names, path, filename) = event

        # Triggered when new file created
        if 'IN_CREATE' in type_names and filename.endswith('.json'):
            print(f"🔔 Marie activated! New task: {filename}")

            # Read task
            task_file = Path(path) / filename
            task = json.loads(task_file.read_text())

            # Execute via Claude Code
            result = execute_with_claude(task)

            # Write result
            result_file = Path(f"/results/marie/{task['task_id']}.json")
            result_file.write_text(json.dumps(result))

            # Delete task file
            task_file.unlink()

            print("✅ Marie: Task complete, back to sleep")

def execute_with_claude(task):
    """Execute task using Claude Code CLI"""
    import subprocess

    # Create prompt from task
    prompt = f"""
    Execute this task:
    {task['description']}

    Write results to /results/marie/{task['task_id']}.json
    """

    # Run Claude Code
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True,
        text=True,
        timeout=300
    )

    return {"output": result.stdout, "status": "complete"}

if __name__ == "__main__":
    worker_loop()
```

**Orchestrator side:**
```python
# orchestrator.py
from pathlib import Path
import json

def assign_task_to_marie(task_id, description):
    """Creating file instantly triggers Marie's inotify"""
    task = {
        "task_id": task_id,
        "description": description
    }

    # Writing this file INSTANTLY wakes Marie up!
    task_file = Path(f"/tasks/marie/{task_id}.json")
    task_file.write_text(json.dumps(task))

    print(f"🔔 Rang doorbell for Marie: {task_id}")
```

**Install:**
```bash
pip install inotify
```

**Pros:**
- ✅ Zero CPU usage when idle
- ✅ Instant activation (<1ms)
- ✅ OS-level (very reliable)
- ✅ Works with Docker volumes

**Cons:**
- ❌ Linux/macOS only (use watchdog for cross-platform)

---

## Solution 2: Named Pipes (Blocking FIFO) ⭐ RECOMMENDED

**How it works:** Unix pipes block until data arrives. Writing to pipe = instant wakeup.

### Implementation

```bash
# Setup (run once)
mkfifo /pipes/orchestrator-to-marie
mkfifo /pipes/marie-to-orchestrator
```

```python
# marie_worker_pipe.py
import os
import json
import subprocess

def worker_loop():
    """Marie worker with blocking pipe"""
    pipe_in = "/pipes/orchestrator-to-marie"
    pipe_out = "/pipes/marie-to-orchestrator"

    print("Marie: Opening pipe... (blocks until signal)")

    while True:
        # BLOCKS HERE until orchestrator writes!
        with open(pipe_in, 'r') as pipe:
            signal = pipe.read().strip()

            if signal == "WAKEUP":
                print("🔔 Marie activated!")

                # Check for tasks
                task_files = list(Path("/tasks/marie").glob("*.json"))
                if task_files:
                    task = json.loads(task_files[0].read_text())

                    # Execute
                    result = execute_with_claude(task)

                    # Write result
                    Path(f"/results/marie/{task['task_id']}.json").write_text(
                        json.dumps(result)
                    )

                    # Signal completion
                    with open(pipe_out, 'w') as out_pipe:
                        out_pipe.write("COMPLETE\n")

                    # Cleanup
                    task_files[0].unlink()

if __name__ == "__main__":
    worker_loop()
```

**Orchestrator side:**
```python
# orchestrator.py
def activate_marie(task_id, description):
    """Ring the doorbell via named pipe"""
    # 1. Write task file
    task_file = Path(f"/tasks/marie/{task_id}.json")
    task_file.write_text(json.dumps({
        "task_id": task_id,
        "description": description
    }))

    # 2. Ring doorbell - WAKES MARIE INSTANTLY!
    with open("/pipes/orchestrator-to-marie", 'w') as pipe:
        pipe.write("WAKEUP\n")

    print(f"🔔 Activated Marie for task {task_id}")

    # 3. Wait for completion signal (blocks)
    with open("/pipes/marie-to-orchestrator", 'r') as pipe:
        response = pipe.read().strip()
        if response == "COMPLETE":
            print(f"✅ Marie completed {task_id}")
```

**Pros:**
- ✅ Zero CPU (blocks until signal)
- ✅ Instant wakeup
- ✅ Bidirectional (can signal back)
- ✅ Simple, no dependencies

**Cons:**
- ❌ Needs careful error handling (broken pipes)
- ❌ One reader/writer at a time

---

## Solution 3: Redis Pub/Sub (Event Bus) ⭐ PRODUCTION-READY

**How it works:** Workers subscribe to channels. Publishing = instant wakeup.

### Implementation

```python
# marie_worker_pubsub.py
import redis
import json
import subprocess

def worker_loop():
    """Marie worker with Redis pub/sub"""
    r = redis.from_url("redis://localhost:6379")
    pubsub = r.pubsub()

    # Subscribe to Marie's activation channel
    pubsub.subscribe('activate:marie')

    print("Marie: Subscribed to activation channel... (zero CPU)")

    # BLOCKS HERE until message received!
    for message in pubsub.listen():
        if message['type'] == 'message':
            task_id = message['data'].decode()

            print(f"🔔 Marie activated for task: {task_id}")

            # Get task from Redis
            task_data = r.get(f"task:{task_id}")
            task = json.loads(task_data)

            # Execute with Claude
            result = execute_with_claude(task)

            # Store result
            r.set(f"result:{task_id}", json.dumps(result))

            # Signal completion
            r.publish('complete:marie', task_id)

            print(f"✅ Marie completed {task_id}")

if __name__ == "__main__":
    worker_loop()
```

**Orchestrator side:**
```python
# orchestrator.py
import redis
import json

def activate_marie(task_id, description):
    """Activate Marie via Redis pub/sub"""
    r = redis.from_url("redis://localhost:6379")

    # Store task data
    task = {"task_id": task_id, "description": description}
    r.set(f"task:{task_id}", json.dumps(task))

    # Publish activation - INSTANT WAKEUP!
    r.publish('activate:marie', task_id)

    print(f"🔔 Published activation event for Marie: {task_id}")

    # Subscribe to completion
    pubsub = r.pubsub()
    pubsub.subscribe('complete:marie')

    for message in pubsub.listen():
        if message['type'] == 'message':
            completed_id = message['data'].decode()
            if completed_id == task_id:
                result = json.loads(r.get(f"result:{task_id}"))
                print(f"✅ Received result from Marie")
                return result
```

**Pros:**
- ✅ Zero CPU when idle
- ✅ Instant activation (<1ms)
- ✅ Multiple workers can subscribe
- ✅ Production-ready (clustered)
- ✅ Built-in persistence

**Cons:**
- ❌ Requires Redis server

---

## Solution 4: Unix Signals (Process Kill) ⚠️ ADVANCED

**How it works:** Send SIGUSR1 to worker process = instant wakeup.

### Implementation

```python
# marie_worker_signal.py
import signal
import os
import json
from pathlib import Path

# Global flag
task_available = False

def signal_handler(signum, frame):
    """Called when SIGUSR1 received"""
    global task_available
    print("🔔 Marie: Received activation signal!")
    task_available = True

# Register signal handler
signal.signal(signal.SIGUSR1, signal_handler)

def worker_loop():
    """Marie worker with signal activation"""
    global task_available

    # Write PID for orchestrator to find us
    Path("/tmp/marie.pid").write_text(str(os.getpid()))

    print(f"Marie: Waiting for signals (PID: {os.getpid()})")

    while True:
        if task_available:
            # Process tasks
            task_files = list(Path("/tasks/marie").glob("*.json"))
            if task_files:
                task = json.loads(task_files[0].read_text())
                result = execute_with_claude(task)

                Path(f"/results/marie/{task['task_id']}.json").write_text(
                    json.dumps(result)
                )
                task_files[0].unlink()

            task_available = False

        # Sleep until signal arrives
        signal.pause()  # BLOCKS until signal!

if __name__ == "__main__":
    worker_loop()
```

**Orchestrator side:**
```python
# orchestrator.py
import os
import signal
from pathlib import Path

def activate_marie(task_id, description):
    """Activate Marie via Unix signal"""
    # Write task
    Path(f"/tasks/marie/{task_id}.json").write_text(json.dumps({
        "task_id": task_id,
        "description": description
    }))

    # Get Marie's PID
    marie_pid = int(Path("/tmp/marie.pid").read_text())

    # Send SIGUSR1 signal - INSTANT WAKEUP!
    os.kill(marie_pid, signal.SIGUSR1)

    print(f"🔔 Sent SIGUSR1 to Marie (PID {marie_pid})")
```

**For Docker containers:**
```bash
# From orchestrator container, signal Marie
docker kill --signal=SIGUSR1 marie
```

**Pros:**
- ✅ Zero CPU
- ✅ Instant (<1µs)
- ✅ No dependencies
- ✅ OS-level primitive

**Cons:**
- ❌ Unix/Linux only
- ❌ Complex error handling
- ❌ Signals can be lost

---

## Solution 5: Docker Events API 🐳

**How it works:** Docker emits events when containers start, files change, etc.

### Implementation

```python
# orchestrator.py
import docker
import json
from pathlib import Path

client = docker.from_env()

def activate_marie_via_restart(task_id, description):
    """Activate by restarting Marie's process"""
    # Write task
    Path(f"/tasks/marie/{task_id}.json").write_text(json.dumps({
        "task_id": task_id,
        "description": description
    }))

    # Restart Marie's Claude process (not container)
    marie = client.containers.get("marie")
    marie.exec_run("pkill -SIGUSR1 claude")  # Signal Claude process

    print(f"🔔 Signaled Marie's Claude process")
```

**Or use docker exec to trigger directly:**
```python
def activate_marie_direct(task_id, description):
    """Execute command in Marie's container"""
    Path(f"/tasks/marie/{task_id}.json").write_text(json.dumps({
        "task_id": task_id,
        "description": description
    }))

    marie = client.containers.get("marie")

    # Execute Claude command directly - INSTANT!
    result = marie.exec_run(
        f"claude -p 'Process task {task_id} from /tasks/marie/{task_id}.json'",
        detach=False
    )

    print(f"🔔 Executed Claude command in Marie container")
```

**Pros:**
- ✅ Direct control over containers
- ✅ Can execute commands on-demand
- ✅ No polling needed

**Cons:**
- ❌ Requires Docker API access
- ❌ Less isolation

---

## Solution 6: Webhook Server in Each Agent 🌐

**How it works:** Each worker runs tiny HTTP server. POST = wakeup.

### Implementation

```python
# marie_worker_webhook.py
from flask import Flask, request, jsonify
import subprocess
import json

app = Flask(__name__)

@app.route('/activate', methods=['POST'])
def activate():
    """Webhook endpoint - called by orchestrator"""
    task = request.json
    task_id = task['task_id']

    print(f"🔔 Marie activated via webhook: {task_id}")

    # Execute with Claude
    result = execute_with_claude(task)

    # Return result immediately
    return jsonify(result)

def execute_with_claude(task):
    result = subprocess.run(
        ["claude", "-p", task['description']],
        capture_output=True, text=True, timeout=300
    )
    return {"output": result.stdout, "status": "complete"}

if __name__ == "__main__":
    # Lightweight server, minimal overhead
    app.run(host='0.0.0.0', port=5001, threaded=True)
```

**Orchestrator side:**
```python
# orchestrator.py
import requests

def activate_marie(task_id, description):
    """Activate Marie via HTTP webhook"""
    response = requests.post(
        'http://marie:5001/activate',
        json={"task_id": task_id, "description": description},
        timeout=600  # Wait for completion
    )

    result = response.json()
    print(f"✅ Marie completed: {result}")
    return result
```

**Pros:**
- ✅ Simple, standard HTTP
- ✅ Instant activation
- ✅ Works across networks
- ✅ Easy to debug (curl, Postman)
- ✅ Can return results directly

**Cons:**
- ❌ Each worker needs HTTP server
- ❌ Port management

---

## Solution 7: Watchdog (Cross-Platform File Watcher)

**How it works:** Like inotify but works on Windows/Mac/Linux.

```bash
pip install watchdog
```

```python
# marie_worker_watchdog.py
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import json
from pathlib import Path

class TaskHandler(FileSystemEventHandler):
    def on_created(self, event):
        """Called when new file created"""
        if event.src_path.endswith('.json'):
            print(f"🔔 Marie activated: {event.src_path}")

            # Process task
            task = json.loads(Path(event.src_path).read_text())
            result = execute_with_claude(task)

            # Write result
            Path(f"/results/marie/{task['task_id']}.json").write_text(
                json.dumps(result)
            )

            # Cleanup
            Path(event.src_path).unlink()

def worker_loop():
    event_handler = TaskHandler()
    observer = Observer()
    observer.schedule(event_handler, "/tasks/marie", recursive=False)
    observer.start()

    print("Marie: Watching for tasks... (zero CPU)")

    try:
        while True:
            time.sleep(1)  # Keep alive
    except KeyboardInterrupt:
        observer.stop()

    observer.join()

if __name__ == "__main__":
    worker_loop()
```

**Pros:**
- ✅ Cross-platform (Windows/Mac/Linux)
- ✅ Zero polling
- ✅ Simple API

---

## 📊 Comparison Matrix

| Method | Latency | CPU Idle | Setup | Cross-Platform | Docker-Friendly | Recommended |
|--------|---------|----------|-------|----------------|-----------------|-------------|
| **inotify** | <1ms | 0% | Easy | Linux only | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Named Pipes** | <1ms | 0% | Medium | Unix only | ✅ Yes | ⭐⭐⭐⭐ |
| **Redis Pub/Sub** | <10ms | 0% | Medium | ✅ All | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Unix Signals** | <1µs | 0% | Hard | Unix only | ⚠️ Complex | ⭐⭐⭐ |
| **Docker Events** | <10ms | 0% | Medium | ✅ All | ✅ Yes | ⭐⭐⭐⭐ |
| **Webhooks** | <5ms | Low | Easy | ✅ All | ✅ Yes | ⭐⭐⭐⭐⭐ |
| **Watchdog** | <1ms | 0% | Easy | ✅ All | ✅ Yes | ⭐⭐⭐⭐ |

---

## 🎯 Recommendation for codehornets-ai

### Quick Win: inotify (Linux) or Watchdog (Cross-platform)

**Best immediate upgrade:**
```python
# Replace polling loop with inotify
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class MarieActivator(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return

        if event.src_path.endswith('.json'):
            # INSTANT activation when file created!
            process_task(event.src_path)

observer = Observer()
observer.schedule(MarieActivator(), "/tasks/marie")
observer.start()

# Zero CPU usage while waiting!
```

**Why:**
- ✅ Drop-in replacement (minimal code changes)
- ✅ Keeps file-based approach (debugging friendly)
- ✅ Zero CPU when idle
- ✅ <1ms activation
- ✅ Works with Docker volumes

### Production: Redis Pub/Sub + File Storage (Hybrid)

```python
# Best of both worlds
class HybridActivation:
    def __init__(self):
        self.redis = redis.from_url("redis://localhost:6379")

    def activate_worker(self, worker, task):
        # Store task as file (debugging)
        Path(f"/tasks/{worker}/{task['id']}.json").write_text(
            json.dumps(task)
        )

        # Instant activation via pub/sub
        self.redis.publish(f"activate:{worker}", task['id'])

        # Both activation AND data preserved!
```

**Why:**
- ✅ Instant activation (Redis pub/sub)
- ✅ Preserved debugging (files still written)
- ✅ Production-ready
- ✅ Can inspect tasks even after processing

---

## 🚀 Implementation Plan

### Phase 1: Add Watchdog (1 hour)
```bash
pip install watchdog
```
Replace polling loops with file watchers.

### Phase 2: Add Redis Pub/Sub (2 hours)
```bash
docker-compose.yml:
  redis:
    image: redis:alpine
```
Add pub/sub activation alongside file storage.

### Phase 3: Optional Webhooks (1 hour)
Add tiny Flask servers to workers for HTTP activation.

---

## 🔧 Full Example: Orchestrator + 3 Workers with inotify

```python
# start_system.py
import subprocess
import time
from pathlib import Path

# Create directories
for worker in ['marie', 'anga', 'fabien']:
    Path(f"/tasks/{worker}").mkdir(parents=True, exist_ok=True)
    Path(f"/results/{worker}").mkdir(parents=True, exist_ok=True)

# Start workers (each with file watcher)
workers = []
for worker in ['marie', 'anga', 'fabien']:
    proc = subprocess.Popen([
        "python", f"{worker}_worker_inotify.py"
    ])
    workers.append(proc)
    print(f"✅ Started {worker} worker (PID: {proc.pid})")

print("\n🎯 System ready! Workers listening with ZERO CPU usage.")
print("Create task files in /tasks/{worker}/ to activate them instantly.\n")

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Shutting down workers...")
    for proc in workers:
        proc.terminate()
```

---

## Summary

**Your file-based approach + inotify/watchdog = Perfect solution!**

- Keep the debuggable file system
- Add instant activation (no polling)
- Zero CPU when idle
- <1ms wakeup latency

**This is exactly like a voice activation system:**
1. Marie is "asleep" (zero CPU)
2. Orchestrator "speaks" (writes file)
3. inotify "hears" (filesystem event)
4. Marie "wakes up" instantly (processes task)
5. Marie goes back to sleep

No more polling, no more delays, no more wasted CPU! 🎉
