# Inter-Agent Communication Patterns & Methodologies

A comprehensive guide to making AI agents communicate with each other, comparing industry approaches and what's implemented in codehornets-ai.

## Overview

When you have multiple AI agents (like Claude CLI instances) running in different containers/processes, they need to communicate. This is similar to **Inter-Process Communication (IPC)** in distributed systems, but adapted for AI agent orchestration.

---

## 🏗️ Patterns Implemented in codehornets-ai

### 1. File-Based Artifacts (Primary - Anthropic Pattern)

**Status:** ✅ **Implemented** in codehornets-ai

**How it works:**
- Orchestrator writes task files to `/tasks/{worker}/`
- Workers poll for new task files
- Workers execute and write results to `/results/{worker}/`
- Orchestrator reads result artifacts
- Files are deleted after processing

**Implementation:**
```python
# Orchestrator creates task
task = {
    "task_id": "sec-001",
    "worker": "marie",
    "description": "Review auth.py for security issues"
}
Path("/tasks/marie/sec-001.json").write_text(json.dumps(task))

# Worker polls and processes
while True:
    task_files = list(Path("/tasks/marie").glob("*.json"))
    if task_files:
        task = json.loads(task_files[0].read_text())
        result = execute_task(task)
        Path(f"/results/marie/{task['task_id']}.json").write_text(result)
        task_files[0].unlink()  # Delete task file
    time.sleep(1)

# Orchestrator reads result
result = json.loads(Path("/results/marie/sec-001.json").read_text())
```

**Pros:**
- ✅ Simple, debuggable (human-readable JSON files)
- ✅ No external dependencies (just filesystem)
- ✅ Works perfectly with Docker volumes
- ✅ Inspectable at any point
- ✅ Crash-resistant (files persist)

**Cons:**
- ❌ Polling overhead (1-second delays)
- ❌ Not real-time
- ❌ File I/O slower than memory
- ❌ Potential race conditions with concurrent access

**Best for:** Development, debugging, moderate throughput (< 100 tasks/sec)

---

### 2. Redis Task Queue (Documented)

**Status:** 📖 **Documented** but not actively used in current codehornets-ai

**How it works:**
- Redis as central message broker
- Workers use `BRPOP` (blocking pop) for zero-latency task pickup
- Pub/Sub for completion notifications
- Hash storage for task status and results

**Implementation:**
```python
import redis
r = redis.from_url("redis://localhost:6379")

# Orchestrator: Submit task
task = {"task_id": "sec-001", "description": "Review auth.py"}
r.lpush("queue:marie", json.dumps(task))
r.hset("task:sec-001", "status", "queued")

# Worker: Blocking wait for task (NO POLLING!)
task_json = r.brpop("queue:marie", timeout=0)  # Blocks until task available
task = json.loads(task_json[1])

# Worker: Execute and store result
r.hset(f"task:{task['task_id']}", "status", "complete")
r.hset(f"task:{task['task_id']}", "result", result_data)
r.publish("task-complete", task["task_id"])

# Orchestrator: Wait for completion notification
pubsub = r.pubsub()
pubsub.subscribe("task-complete")
for message in pubsub.listen():
    if message["data"] == "sec-001":
        result = r.hget("task:sec-001", "result")
        break
```

**Pros:**
- ✅ Real-time (blocking pop = zero polling delay)
- ✅ Atomic operations (no race conditions)
- ✅ Pub/Sub for instant notifications
- ✅ Built-in persistence
- ✅ High throughput (100k+ ops/sec)

**Cons:**
- ❌ External dependency (Redis server)
- ❌ Single point of failure (need Redis cluster for HA)
- ❌ More complex setup
- ❌ Debugging requires Redis CLI

**Best for:** Production, high throughput (> 1000 tasks/sec), real-time requirements

---

### 3. MCP Servers (Model Context Protocol)

**Status:** 📖 **Documented** in architecture

**How it works:**
- MCP server exposes standardized tool interfaces
- Agents call MCP tools instead of direct communication
- MCP server handles orchestration logic
- Standardized JSON-RPC protocol

**Implementation:**
```typescript
// orchestrator-mcp-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server({ name: "orchestrator", version: "1.0.0" });

// Tool: Assign task to worker
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "assign_task") {
    const { worker, task_id, description } = request.params.arguments;

    // Create task file
    await fs.writeFile(`/tasks/${worker}/${task_id}.json`,
      JSON.stringify({ task_id, description }));

    // Trigger worker
    await execAsync(`docker exec ${worker} claude -p "Process task ${task_id}"`);

    return { content: [{ type: "text", text: `Task ${task_id} assigned` }] };
  }
});

// Configure in .claude/mcp.json
{
  "mcpServers": {
    "orchestrator": {
      "command": "node",
      "args": ["orchestrator-mcp-server.js"]
    }
  }
}
```

**Pros:**
- ✅ Standardized protocol (works across AI tools)
- ✅ Type-safe interfaces
- ✅ Built-in tool discovery
- ✅ Native Claude Code support

**Cons:**
- ❌ Relatively new standard (evolving)
- ❌ Adds abstraction layer
- ❌ Requires Node.js server process

**Best for:** Integration with multiple AI tools, standardization across platforms

---

## 🌐 Industry-Wide Communication Patterns

### 4. Named Pipes / Unix Sockets (POSIX IPC)

**Status:** ⚡ **Not implemented** - Alternative approach

**How it works:**
- Create named pipes (FIFOs) for each communication channel
- Bidirectional or unidirectional streams
- Kernel-managed buffers

**Implementation:**
```bash
# Create named pipes
mkfifo /tmp/orchestrator-to-marie
mkfifo /tmp/marie-to-orchestrator

# Orchestrator writes task
echo '{"task": "review auth.py"}' > /tmp/orchestrator-to-marie

# Marie reads task
task=$(cat /tmp/orchestrator-to-marie)
# Process...
echo '{"status": "complete"}' > /tmp/marie-to-orchestrator

# Orchestrator reads result
result=$(cat /tmp/marie-to-orchestrator)
```

**Pros:**
- ✅ Native OS support (no dependencies)
- ✅ Low latency (kernel buffers)
- ✅ Stream-based (can send continuous data)

**Cons:**
- ❌ Complex with multiple workers (need many pipes)
- ❌ Blocking I/O (need careful design)
- ❌ Not network-transparent (local only)
- ❌ Limited cross-platform (Docker adds complexity)

**Best for:** Single-machine, low-latency, streaming data

---

### 5. HTTP/REST APIs

**Status:** ⚡ **Not implemented** - Industry standard

**How it works:**
- Each agent runs HTTP server
- RESTful endpoints for task submission and status
- Orchestrator makes HTTP requests

**Implementation:**
```python
from flask import Flask, request, jsonify

# Worker (Marie) runs HTTP server
app = Flask(__name__)

@app.route("/tasks", methods=["POST"])
def receive_task():
    task = request.json
    result = execute_task(task)
    return jsonify({"status": "complete", "result": result})

app.run(host="0.0.0.0", port=8001)

# Orchestrator sends HTTP request
import requests
response = requests.post("http://marie:8001/tasks",
    json={"description": "Review auth.py"})
result = response.json()
```

**Pros:**
- ✅ Industry standard
- ✅ Network-transparent (works across machines)
- ✅ Rich ecosystem (load balancers, API gateways)
- ✅ Stateless (easy to scale)
- ✅ Debugging tools (curl, Postman, browser)

**Cons:**
- ❌ HTTP overhead (headers, TCP handshakes)
- ❌ Each worker needs HTTP server
- ❌ More complex than files
- ❌ Requires port management

**Best for:** Multi-machine orchestration, web integration, microservices

---

### 6. gRPC (Google Remote Procedure Call)

**Status:** ⚡ **Not implemented** - High-performance RPC

**How it works:**
- Protocol Buffers for schema definition
- HTTP/2 for transport (multiplexing, streaming)
- Bidirectional streaming support

**Implementation:**
```protobuf
// task.proto
service WorkerService {
  rpc ExecuteTask(TaskRequest) returns (TaskResult) {}
  rpc StreamTasks(stream TaskRequest) returns (stream TaskResult) {}
}

message TaskRequest {
  string task_id = 1;
  string description = 2;
}

message TaskResult {
  string task_id = 1;
  string status = 2;
  string result = 3;
}
```

```python
# Worker server
import grpc
from concurrent import futures
import task_pb2_grpc

class WorkerServicer(task_pb2_grpc.WorkerServiceServicer):
    def ExecuteTask(self, request, context):
        result = execute_task(request.description)
        return task_pb2.TaskResult(
            task_id=request.task_id,
            status="complete",
            result=result
        )

server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
task_pb2_grpc.add_WorkerServiceServicer_to_server(WorkerServicer(), server)
server.add_insecure_port('[::]:50051')
server.start()

# Orchestrator client
channel = grpc.insecure_channel('marie:50051')
stub = task_pb2_grpc.WorkerServiceStub(channel)
response = stub.ExecuteTask(task_pb2.TaskRequest(
    task_id="sec-001",
    description="Review auth.py"
))
```

**Pros:**
- ✅ Very fast (HTTP/2, binary Protocol Buffers)
- ✅ Type-safe schemas
- ✅ Bidirectional streaming
- ✅ Built-in load balancing
- ✅ Multi-language support

**Cons:**
- ❌ Complex setup (protobuf compilation)
- ❌ Steeper learning curve
- ❌ Not human-readable (binary)
- ❌ Debugging harder than REST

**Best for:** High-performance, low-latency, large-scale systems

---

### 7. Message Queues (RabbitMQ, Kafka, NATS)

**Status:** ⚡ **Not implemented** - Enterprise messaging

#### RabbitMQ (AMQP)

**How it works:**
- Exchanges route messages to queues
- Durable queues survive restarts
- Acknowledgments ensure delivery

```python
import pika

# Orchestrator publishes task
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='marie_tasks', durable=True)
channel.basic_publish(
    exchange='',
    routing_key='marie_tasks',
    body=json.dumps({"task": "review auth.py"}),
    properties=pika.BasicProperties(delivery_mode=2)  # Persistent
)

# Marie consumes tasks
def callback(ch, method, properties, body):
    task = json.loads(body)
    result = execute_task(task)
    ch.basic_publish(exchange='', routing_key='results', body=json.dumps(result))
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue='marie_tasks', on_message_callback=callback)
channel.start_consuming()
```

**Pros:**
- ✅ Enterprise-grade reliability
- ✅ Complex routing (exchanges, bindings)
- ✅ Dead letter queues (failed messages)
- ✅ Priority queues
- ✅ Message TTL, expiration

**Cons:**
- ❌ Heavy infrastructure (Erlang VM)
- ❌ Complex to configure properly
- ❌ Overkill for simple use cases

#### Apache Kafka

**How it works:**
- Distributed commit log
- Topic partitions for parallelism
- Consumer groups for scalability

```python
from kafka import KafkaProducer, KafkaConsumer

# Orchestrator produces
producer = KafkaProducer(bootstrap_servers='localhost:9092')
producer.send('marie-tasks', json.dumps({"task": "review auth.py"}).encode())

# Marie consumes
consumer = KafkaConsumer('marie-tasks', bootstrap_servers='localhost:9092')
for message in consumer:
    task = json.loads(message.value)
    result = execute_task(task)
    producer.send('results', json.dumps(result).encode())
```

**Pros:**
- ✅ Extremely high throughput (millions/sec)
- ✅ Persistent log (replay messages)
- ✅ Horizontal scaling
- ✅ Stream processing integration

**Cons:**
- ❌ Complex infrastructure (Zookeeper/KRaft)
- ❌ Overkill for < 10k msg/sec
- ❌ Higher latency than Redis

#### NATS

**How it works:**
- Lightweight pub/sub
- Subject-based routing
- Clustering built-in

```python
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")

    # Subscribe to results
    async def message_handler(msg):
        result = json.loads(msg.data.decode())
        print(f"Received: {result}")

    await nc.subscribe("marie.results", cb=message_handler)

    # Publish task
    await nc.publish("marie.tasks", json.dumps({"task": "review"}).encode())

asyncio.run(main())
```

**Pros:**
- ✅ Very lightweight (single binary)
- ✅ Low latency (< 1ms)
- ✅ Simple setup
- ✅ Built-in clustering

**Cons:**
- ❌ Less feature-rich than RabbitMQ
- ❌ No message persistence by default
- ❌ Smaller ecosystem

---

### 8. WebSockets (Real-Time Bidirectional)

**Status:** ⚡ **Not implemented** - Real-time communication

**How it works:**
- Persistent connection between orchestrator and workers
- Full-duplex communication
- Push notifications from workers

**Implementation:**
```python
# Worker (Marie) WebSocket server
from fastapi import FastAPI, WebSocket
app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Receive task from orchestrator
        task = await websocket.receive_json()

        # Process task
        result = execute_task(task)

        # Send result back
        await websocket.send_json(result)

# Orchestrator WebSocket client
import websockets

async def send_task():
    async with websockets.connect('ws://marie:8001/ws') as websocket:
        await websocket.send(json.dumps({"task": "review auth.py"}))
        result = await websocket.recv()
        print(json.loads(result))
```

**Pros:**
- ✅ True real-time (no polling)
- ✅ Bidirectional (workers can push updates)
- ✅ Efficient (persistent connection)
- ✅ Progress updates during long tasks

**Cons:**
- ❌ Connection state management
- ❌ Harder to debug than REST
- ❌ Firewall issues in some networks
- ❌ Scaling requires sticky sessions

**Best for:** Real-time dashboards, progress tracking, streaming results

---

### 9. Server-Sent Events (SSE)

**Status:** ⚡ **Not implemented** - One-way streaming

**How it works:**
- HTTP-based server push
- One-way: server → client
- Automatic reconnection

**Implementation:**
```python
# Worker streams progress updates
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.get("/task/{task_id}/stream")
async def stream_progress(task_id: str):
    async def event_generator():
        yield f"data: {json.dumps({'status': 'started'})}\n\n"

        # Execute task with progress updates
        for progress in execute_task_with_progress(task_id):
            yield f"data: {json.dumps(progress)}\n\n"

        yield f"data: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Orchestrator consumes stream
import requests

response = requests.get('http://marie:8001/task/sec-001/stream', stream=True)
for line in response.iter_lines():
    if line:
        event = json.loads(line.decode().replace('data: ', ''))
        print(event)
```

**Pros:**
- ✅ Simple (built on HTTP)
- ✅ Automatic reconnection
- ✅ Progress updates during execution
- ✅ Works through firewalls

**Cons:**
- ❌ One-way only (server → client)
- ❌ Limited browser support for large streams
- ❌ Not as efficient as WebSockets

**Best for:** Progress monitoring, log streaming, status updates

---

### 10. GraphQL Subscriptions

**Status:** ⚡ **Not implemented** - Real-time with type safety

**How it works:**
- GraphQL schema defines subscriptions
- WebSocket transport for real-time
- Type-safe queries

**Implementation:**
```python
import strawberry
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class Task:
    id: str
    status: str
    result: str

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def task_updates(self, task_id: str) -> Task:
        # Stream task updates
        while True:
            task = get_task_status(task_id)
            yield task
            if task.status == "complete":
                break
            await asyncio.sleep(1)

schema = strawberry.Schema(subscription=Subscription)
app = GraphQLRouter(schema)

# Orchestrator subscribes
subscription = """
subscription {
  taskUpdates(taskId: "sec-001") {
    id
    status
    result
  }
}
"""
```

**Pros:**
- ✅ Type-safe schema
- ✅ Flexible queries
- ✅ Real-time subscriptions
- ✅ Rich tooling (GraphiQL)

**Cons:**
- ❌ Complex setup
- ❌ Overhead for simple use cases
- ❌ Requires GraphQL server

**Best for:** Complex data requirements, real-time dashboards, type safety

---

### 11. Shared Memory (SHM)

**Status:** ⚡ **Not implemented** - Ultra-low latency

**How it works:**
- Memory-mapped files shared between processes
- Direct memory access (no serialization)
- Semaphores for synchronization

**Implementation:**
```python
from multiprocessing import shared_memory
import numpy as np

# Orchestrator creates shared memory
shm = shared_memory.SharedMemory(create=True, size=1024*1024)  # 1MB
shm_array = np.ndarray((1024,), dtype=np.uint8, buffer=shm.buf)

# Write task data
task_data = b"review auth.py"
shm_array[:len(task_data)] = np.frombuffer(task_data, dtype=np.uint8)

# Worker accesses shared memory
shm = shared_memory.SharedMemory(name='task_shm')
shm_array = np.ndarray((1024,), dtype=np.uint8, buffer=shm.buf)
task = shm_array[:100].tobytes().decode()

# Cleanup
shm.close()
shm.unlink()
```

**Pros:**
- ✅ Fastest possible (direct memory access)
- ✅ Zero-copy (no serialization)
- ✅ Sub-microsecond latency

**Cons:**
- ❌ Complex synchronization (race conditions)
- ❌ Local machine only
- ❌ Dangerous (memory corruption risks)
- ❌ Not compatible with Docker isolation

**Best for:** Ultra-low latency (< 100µs), large data transfer, single machine

---

### 12. Database as Message Queue

**Status:** ⚡ **Not implemented** - Simple but slow

**How it works:**
- Use database table as task queue
- Polling with SELECT queries
- Status updates via UPDATE

**Implementation:**
```python
import sqlite3

# Orchestrator creates task
conn = sqlite3.connect('/shared/tasks.db')
conn.execute('''CREATE TABLE IF NOT EXISTS tasks
                (id TEXT PRIMARY KEY, worker TEXT, description TEXT,
                 status TEXT, result TEXT)''')
conn.execute("INSERT INTO tasks VALUES (?, ?, ?, ?, ?)",
             ("sec-001", "marie", "Review auth.py", "pending", None))
conn.commit()

# Worker polls for tasks
while True:
    cursor = conn.execute(
        "SELECT * FROM tasks WHERE worker='marie' AND status='pending' LIMIT 1"
    )
    task = cursor.fetchone()
    if task:
        task_id, worker, description, status, result = task

        # Update status to in-progress
        conn.execute("UPDATE tasks SET status='in-progress' WHERE id=?", (task_id,))
        conn.commit()

        # Execute task
        result = execute_task(description)

        # Update with result
        conn.execute("UPDATE tasks SET status='complete', result=? WHERE id=?",
                    (result, task_id))
        conn.commit()

    time.sleep(1)
```

**Pros:**
- ✅ Simple (no additional infrastructure)
- ✅ ACID guarantees
- ✅ Persistent
- ✅ Queryable (debugging, analytics)

**Cons:**
- ❌ Slow (disk I/O, SQL overhead)
- ❌ Polling overhead
- ❌ Database locks with high concurrency
- ❌ Not designed for messaging

**Best for:** Low-volume, simple setups, when you already have a database

---

### 13. ZeroMQ (ØMQ)

**Status:** ⚡ **Not implemented** - Socket library

**How it works:**
- Brokerless messaging (peer-to-peer)
- Various patterns: REQ/REP, PUB/SUB, PUSH/PULL
- Async I/O

**Implementation:**
```python
import zmq

# Worker (Marie) - REP (Reply) socket
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5555")

while True:
    task = socket.recv_json()
    result = execute_task(task)
    socket.send_json(result)

# Orchestrator - REQ (Request) socket
context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://marie:5555")

socket.send_json({"task": "review auth.py"})
result = socket.recv_json()
```

**Pros:**
- ✅ No broker needed (lightweight)
- ✅ Multiple patterns (REQ/REP, PUB/SUB, PUSH/PULL)
- ✅ Very fast
- ✅ Automatic reconnection

**Cons:**
- ❌ No persistence (messages lost on restart)
- ❌ No message routing/filtering
- ❌ Manual load balancing
- ❌ Debugging harder

**Best for:** High-performance, low-overhead, simple patterns

---

## 📊 Comparison Matrix

| Pattern | Latency | Throughput | Complexity | Reliability | Best Use Case |
|---------|---------|------------|------------|-------------|---------------|
| **Files** (current) | ~1s (polling) | Low (< 100/s) | ⭐ Simple | ⭐⭐⭐ Good | Development, debugging |
| **Redis Queue** | < 10ms | High (100k/s) | ⭐⭐ Moderate | ⭐⭐⭐⭐ Excellent | Production, real-time |
| **MCP** | ~100ms | Low | ⭐⭐ Moderate | ⭐⭐⭐ Good | Cross-platform AI tools |
| **Named Pipes** | < 1ms | Medium | ⭐⭐⭐ Complex | ⭐⭐ Fair | Local, streaming |
| **HTTP/REST** | ~50ms | Medium | ⭐⭐ Moderate | ⭐⭐⭐⭐ Excellent | Multi-machine, web |
| **gRPC** | ~5ms | Very High | ⭐⭐⭐⭐ Complex | ⭐⭐⭐⭐ Excellent | High-performance RPC |
| **RabbitMQ** | ~10ms | High | ⭐⭐⭐⭐ Complex | ⭐⭐⭐⭐⭐ Excellent | Enterprise messaging |
| **Kafka** | ~50ms | Massive (millions/s) | ⭐⭐⭐⭐⭐ Very Complex | ⭐⭐⭐⭐⭐ Excellent | Big data streaming |
| **NATS** | < 1ms | Very High | ⭐⭐ Moderate | ⭐⭐⭐⭐ Excellent | Microservices |
| **WebSockets** | < 10ms | Medium | ⭐⭐⭐ Complex | ⭐⭐⭐ Good | Real-time bidirectional |
| **SSE** | ~100ms | Medium | ⭐⭐ Moderate | ⭐⭐⭐ Good | Progress streaming |
| **GraphQL** | ~100ms | Medium | ⭐⭐⭐⭐ Complex | ⭐⭐⭐ Good | Type-safe real-time |
| **Shared Memory** | < 100µs | Extreme | ⭐⭐⭐⭐⭐ Very Complex | ⭐ Poor | Ultra-low latency |
| **Database** | ~500ms | Very Low | ⭐ Simple | ⭐⭐⭐⭐ Excellent | Simple, persistent |
| **ZeroMQ** | < 1ms | Very High | ⭐⭐⭐ Complex | ⭐⭐ Fair | High-perf P2P |

---

## 🎯 Recommendations

### For codehornets-ai Current Architecture

**Keep file-based** for:
- Development and debugging
- Visual inspection of tasks/results
- Simplicity

**Consider adding Redis** when:
- Response time < 100ms required
- Throughput > 1000 tasks/second needed
- Moving to production deployment

**Add WebSockets** if:
- Real-time progress updates needed
- Interactive agent collaboration required
- Building a UI dashboard

### Migration Path

```
Phase 1 (Current): File-based
  ↓
Phase 2 (Production-Ready): File-based + Redis (hybrid)
  ↓
Phase 3 (Scale): Full Redis with WebSocket dashboards
  ↓
Phase 4 (Enterprise): Kafka/RabbitMQ for massive scale
```

### Hybrid Approach (Recommended)

```python
class HybridCommunicator:
    """Use files for debugging, Redis for production"""
    def __init__(self, mode="file"):
        self.mode = mode
        if mode == "redis":
            self.redis = redis.from_url("redis://localhost:6379")

    def send_task(self, worker, task):
        if self.mode == "file":
            # Current file-based approach
            Path(f"/tasks/{worker}/{task['id']}.json").write_text(json.dumps(task))
        elif self.mode == "redis":
            # Production Redis approach
            self.redis.lpush(f"queue:{worker}", json.dumps(task))

    def get_result(self, worker, task_id):
        if self.mode == "file":
            return json.loads(Path(f"/results/{worker}/{task_id}.json").read_text())
        elif self.mode == "redis":
            return json.loads(self.redis.hget(f"task:{task_id}", "result"))

# Use file mode in development
comm = HybridCommunicator(mode="file")

# Switch to Redis in production
# comm = HybridCommunicator(mode="redis")
```

---

## 🚀 Conclusion

**codehornets-ai's file-based approach is excellent for:**
- Transparency (you can see exactly what's happening)
- Debugging (inspect files at any point)
- Simplicity (no dependencies)
- Docker compatibility (volumes just work)

**When to upgrade:**
- Need < 100ms latency → **Redis**
- Need real-time updates → **WebSockets**
- Multi-machine deployment → **HTTP/gRPC**
- Millions of messages → **Kafka**
- Enterprise reliability → **RabbitMQ**

The current architecture is **production-ready for most use cases**. The 90.2% performance improvement comes from **parallel execution**, not communication speed. File-based IPC is a feature, not a limitation—it makes the system inspectable, debuggable, and maintainable.
