# Architecture Diagrams and Visual Guide for Docker TUI IPC

Complete visual reference for understanding the IPC architecture.

---

## System Architecture Overview

### High-Level System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Host Machine                                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    Docker Environment                           │ │
│  │                                                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │              Wrapper Container                             │ │ │
│  │  │                                                            │ │ │
│  │  │  ┌───────────────────────────────────────────────────┐   │ │ │
│  │  │  │  PTY Wrapper Server (Node.js)                     │   │ │ │
│  │  │  │                                                   │   │ │ │
│  │  │  │  - Listen on: /tmp/sockets/claude.sock          │   │ │ │
│  │  │  │  - Manages: Command Queue                        │   │ │ │
│  │  │  │  - Tracks: Command status, results              │   │ │ │
│  │  │  │                                                   │   │ │ │
│  │  │  └─────────────────────────┬───────────────────────┘   │ │ │
│  │  │                            │ Creates PTY                │ │ │
│  │  │  ┌───────────────────────────────────────────────────┐   │ │ │
│  │  │  │  Child PTY Process (node-pty)                      │   │ │ │
│  │  │  │                                                   │   │ │ │
│  │  │  │  Master Side (Wrapper writes/reads here)         │   │ │ │
│  │  │  │           ↕                                        │   │ │ │
│  │  │  │  Slave Side → Claude Code TUI (bash/shell)       │   │ │ │
│  │  │  │           ↕                                        │   │ │ │
│  │  │  │  stdin/stdout handling                           │   │ │ │
│  │  │  │                                                   │   │ │ │
│  │  │  └───────────────────────────────────────────────────┘   │ │ │
│  │  │                                                            │ │ │
│  │  │  Volume Mount: /tmp/sockets (shared with host)          │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │ │
│  │                            ▲                                 │ │ │
│  │                            │ Unix Socket                     │ │ │
│  │                            │ /tmp/sockets/claude.sock        │ │ │
│  │                            │                                 │ │ │
│  └────────────────────────────┼─────────────────────────────────┘ │
│                              │                                    │
│  ┌───────────────────────────▼──────────────────────────────────┐ │
│  │           Orchestrator (on host or container)               │ │
│  │                                                             │ │
│  │  ┌────────────────────────────────────────────────────┐   │ │
│  │  │  Agent: Marie (Dance/Evaluation)                  │   │ │
│  │  │  Agent: Anga (Coding)                             │   │ │
│  │  │  Agent: Fabien (Marketing)                        │   │ │
│  │  │                                                   │   │ │
│  │  │  All send commands via Socket Client              │   │ │
│  │  │  to: /tmp/sockets/claude.sock                     │   │ │
│  │  └────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────────┘

Key Points:
- Single PTY process handles all commands from all agents
- Unix socket is single point of communication
- Commands queued and executed sequentially
- Results broadcast back to requesting client
```

---

## Communication Flow Sequence Diagram

### Request-Response Sequence (Detailed)

```
Orchestrator Agent              Wrapper Server              PTY Process
      │                              │                          │
      ├─ 1. Connect to socket ──────→│                          │
      │   net.createConnection()     │                          │
      │                              │                          │
      ├─ 2. Send JSON command ──────→│                          │
      │   {method: "execute",        │ 3. Enqueue ──────────┐  │
      │    params: {cmd: "..."},     │    Track ID          │  │
      │    id: 123}                  │    Create timer      │  │
      │                              │    Set state         │  │
      │                              │                      │  │
      │   (wait for enqueued ack)    │←─ ACK enqueued ────  │  │
      │←──────────────────────────────    {id: 123,         │  │
      │   {type: "enqueued",         │     position: 1}     │  │
      │    id: 123,                  │                      │  │
      │    position: 1}              │ 4. Process queue ───→│  │
      │                              │    While processing: │  │
      │                              │    - Write command\r │  │
      │                              │    - Listen to PTY   │  │
      │                              │    - Accumulate      │  │
      │                              │      output          │  │
      │                              │                      ├──→ 5. Process command
      │                              │                      │    Execute in shell
      │                              │                      │    Output via PTY
      │                              │←──────────────────────
      │                              │ 6. Capture output
      │                              │    - Line buffering
      │                              │    - Pattern matching
      │                              │    - Detect prompt
      │                              │
      │   (subscribe to updates)     │ 7. Command complete
      │←──────────────────────────────    {type: "result",
      │   {type: "result",           │     id: 123,
      │    id: 123,                  │     output: "...",
      │    status: "completed",      │     duration: 1234}
      │    output: "...",            │
      │    duration: 1234}           │
      │                              │
      ├─ 8. Disconnect ─────────────→│
      │   socket.end()               │
      │                              │
```

---

## Data Flow Diagram: Complete Round Trip

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Complete Command Execution Flow                   │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: Request Submission
════════════════════════════════════════════════════════════════════════

  Orchestrator (Agent Task)
         │
         ├─ Parse task: "task-master list"
         │
         ├─ Connect to wrapper socket
         │  net.createConnection('/tmp/sockets/claude.sock')
         │
         └─→ Send JSON request
             {
               jsonrpc: "2.0",
               method: "execute",
               params: {
                 command: "task-master list",
                 timeout: 30000
               },
               id: 12345
             }

            │
            ▼

PHASE 2: Queueing and Processing
════════════════════════════════════════════════════════════════════════

  Wrapper Server (PTY Manager)
         │
         ├─ Receive JSON message
         │
         ├─ Validate and parse
         │
         ├─ Add to command queue
         │  CommandQueue {
         │    id: 12345,
         │    command: "task-master list",
         │    status: "pending",
         │    output: "",
         │    startTime: Date.now(),
         │    timeout: 30000
         │  }
         │
         ├─ Send acknowledgment
         │  {
         │    type: "enqueued",
         │    id: 12345,
         │    position: 2,
         │    queueLength: 2
         │  }
         │
         ├─ Check queue state
         │
         ├─ Is processing?
         │  ├─ YES → Wait for current to finish
         │  └─ NO  → Start processing immediately
         │
         └─→ (if ready) Write to PTY
             ptyProcess.write("task-master list\r")

            │
            ▼

PHASE 3: PTY Execution
════════════════════════════════════════════════════════════════════════

  Child PTY (Claude Code TUI)
         │
         ├─ Master receives: "task-master list\r"
         │
         ├─ Pass to slave (bash/shell)
         │
         ├─ Shell processes command
         │  ├─ Find "task-master" binary
         │  ├─ Execute with "list" argument
         │  ├─ Program outputs result
         │  │
         │  ├─ Output samples:
         │  │  ┌──────────────────────────────┐
         │  │  │ Task 1: Implement auth       │
         │  │  │   Status: in-progress        │
         │  │  │ Task 2: Add documentation    │
         │  │  │   Status: pending            │
         │  │  │ $                            │
         │  │  └──────────────────────────────┘
         │  │
         │  └─ Process exits, returns prompt
         │
         └─→ Output sent back to PTY master
             ptyProcess.onData(data => { ... })

            │
            ▼

PHASE 4: Output Capture and Aggregation
════════════════════════════════════════════════════════════════════════

  Wrapper Output Handler
         │
         ├─ Listen to pty.onData()
         │
         ├─ Append to command.output buffer
         │  output += data
         │
         ├─ Check for completion patterns
         │  ├─ Regex test: /\$\s*$/m
         │  ├─ Line count check
         │  ├─ Timeout check
         │  └─ Success pattern match
         │
         ├─ Is complete?
         │  └─ YES → Proceed to PHASE 5
         │
         └─→ Update internal tracking
             results.set(id, {
               status: 'completed',
               output: buffer,
               duration: elapsed
             })

            │
            ▼

PHASE 5: Result Broadcasting
════════════════════════════════════════════════════════════════════════

  Wrapper Result Sender
         │
         ├─ Format result JSON
         │  {
         │    type: "result",
         │    id: 12345,
         │    status: "completed",
         │    output: "Task 1: Implement auth\n...\n$ ",
         │    duration: 2345
         │  }
         │
         ├─ For each connected client:
         │  ├─ Serialize to JSON
         │  ├─ Add newline delimiter
         │  ├─ Write to socket
         │  └─ Handle backpressure
         │
         └─→ Client receives result

            │
            ▼

PHASE 6: Client Processing
════════════════════════════════════════════════════════════════════════

  Orchestrator (awaiting result)
         │
         ├─ Data event on socket
         │  socket.on('data', data => { ... })
         │
         ├─ Append to input buffer
         │  buffer += data
         │
         ├─ Split on newlines
         │
         ├─ Parse JSON
         │
         ├─ Match by ID
         │  if (response.id === 12345) { ... }
         │
         ├─ Resolve promise
         │  resolve(response.result)
         │
         ├─ Close socket
         │  socket.end()
         │
         └─→ Continue with next task
             console.log("Result:", response.output)

            │
            ▼

COMPLETE: Return to orchestrator with results
═══════════════════════════════════════════════════════════════════════
```

---

## State Machine: Command Lifecycle

```
                    ┌──────────────────┐
                    │   NEW REQUEST    │
                    │  (from network)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     VALIDATING   │
                    │ Parse JSON, IDs  │
                    └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │ Valid?          │
                    ├────────┬────────┤
                    │ NO     │ YES    │
                    ▼        ▼
              ┌─────────┐  ┌────────────────┐
              │  ERROR  │  │ QUEUED         │
              │ SEND    │  │ Add to queue   │
              │ RESPONSE│  │ Track ID       │
              └────┬────┘  └────────┬───────┘
                   │               │
                   │               ▼
                   │        ┌──────────────────┐
                   │        │ ENQUEUED         │
                   │        │ Ack sent to      │
                   │        │ client           │
                   │        └────────┬─────────┘
                   │                 │
                   │                 ▼
                   │        ┌──────────────────┐
                   │        │ WAITING_FOR_SLOT │
                   │        │ Wait for         │
                   │        │ processing slot  │
                   │        └────────┬─────────┘
                   │                 │
                   │                 ▼
                   │        ┌──────────────────┐
                   │        │ WRITING_COMMAND  │
                   │        │ pty.write(cmd)   │
                   │        └────────┬─────────┘
                   │                 │
                   │                 ▼
                   │        ┌──────────────────┐
                   │        │ EXECUTING        │
                   │        │ PTY running cmd  │
                   │        │ Capturing output │
                   │        └────────┬─────────┘
                   │                 │
                   │        ┌────────┴──────────┐
                   │        │ Complete?         │
                   │        ├────────┬──────────┤
                   │        │ NO     │ YES      │
                   │        ▼        ▼
                   │   ┌──────┐  ┌──────────────┐
                   │   │ Wait │  │ COMPLETE     │
                   │   │ more │  │ Format result│
                   │   │ data │  └────────┬─────┘
                   │   └──────┘           │
                   │      ▲               │
                   │      └───────────────┘
                   │        (loop)         │
                   │                       ▼
                   │            ┌──────────────────┐
                   │            │ SENDING_RESULT   │
                   │            │ Broadcast JSON   │
                   │            └────────┬─────────┘
                   │                     │
                   └────────┬────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   FINISHED       │
                   │ Remove from      │
                   │ active tracking  │
                   └──────────────────┘


Parallel paths for multiple commands:
════════════════════════════════════════════════════════════════════════

Time ──→

Cmd 1:  QUEUED ──→ WAITING ──→ EXECUTING ──────────────────→ COMPLETE
                                 (5 sec)

Cmd 2:     QUEUED ──→ WAITING ──→ EXECUTING ──────────────────→ COMPLETE
                                    (8 sec)

Cmd 3:        QUEUED ──→ WAITING ──→ EXECUTING ──→ COMPLETE
                                        (3 sec)

Total execution time: 5 + 8 + 3 = 16 seconds (sequential)
```

---

## Network Message Format Diagram

### Wrapper Protocol: JSON-RPC 2.0 with Extensions

```
CLIENT → SERVER MESSAGE:
═══════════════════════════════════════════════════════════════════════

{
  "jsonrpc": "2.0",                    ← JSON-RPC version
  "method": "execute",                 ← Method name
  "params": {                          ← Method parameters
    "command": "task-master list",     ← Shell command to run
    "timeout": 30000                   ← Timeout in milliseconds
  },
  "id": 12345                          ← Request ID (for matching)
}\n                                     ← Newline delimited

Other methods:
- "query"   : Check status of command
- "resize"  : Resize PTY (cols, rows)
- "ping"    : Health check


SERVER → CLIENT MESSAGE (ENQUEUED):
═══════════════════════════════════════════════════════════════════════

{
  "type": "enqueued",                  ← Message type
  "requestId": 12345,                  ← Matches request ID
  "position": 2,                       ← Queue position
  "queueLength": 2,                    ← Total queue size
  "timestamp": "2025-11-22T10:30:00Z"
}\n


SERVER → CLIENT MESSAGE (RESULT):
═══════════════════════════════════════════════════════════════════════

{
  "type": "result",
  "requestId": 12345,
  "status": "completed",               ← "completed", "error", "timeout"
  "output": "Task 1: Implement auth\n  Status: in-progress\n$ ",
  "duration": 2345,                    ← Execution time in ms
  "timestamp": "2025-11-22T10:30:02Z"
}\n


MESSAGE TRANSMISSION:
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│ Single Unix Domain Socket Connection            │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Client writes JSON message                  │ │
│ │ {"jsonrpc":"2.0","method":"execute",...}\n  │ │
│ └─────────────────┬───────────────────────────┘ │
│                   │                               │
│                   ▼                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Server receives, parses JSON                │ │
│ │ Routes to appropriate handler               │ │
│ └─────────────────┬───────────────────────────┘ │
│                   │                               │
│                   ▼                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Server writes ACK/Result JSON message       │ │
│ │ {"type":"enqueued","requestId":12345,...}\n │ │
│ └─────────────────┬───────────────────────────┘ │
│                   │                               │
│                   ▼                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Client receives, parses JSON                │ │
│ │ Resolves promise or updates UI              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘

Note: Bidirectional - each side can send anytime
      Multiplexed - same connection for all messages
      Stateless - each message is self-contained
```

---

## Docker Container Resource Layout

```
┌──────────────────────────────────────────────────────────────┐
│               Wrapper Container Filesystem                   │
└──────────────────────────────────────────────────────────────┘

/
├── app/
│   ├── wrapper.js              ← Main server script
│   ├── lib/
│   │   ├── command-queue.js    ← Queue implementation
│   │   ├── client.js           ← Client library
│   │   └── health-monitor.js   ← Health checks
│   ├── package.json
│   ├── package-lock.json
│   └── config/
│       └── wrapper.config.json
│
├── tmp/
│   └── sockets/                ← Shared volume mount
│       └── claude.sock          ← Unix domain socket
│
├── proc/
│   ├── self/
│   │   ├── fd/                 ← File descriptors
│   │   │   ├── 3               ← Socket FD
│   │   │   ├── 20-100          ← Client connections
│   │   │   └── ...
│   │   └── status
│   │
│   └── <ptypid>/               ← Claude TUI process
│       ├── fd/
│       │   ├── 0               ← stdin (slave PTY)
│       │   ├── 1               ← stdout (slave PTY)
│       │   └── 2               ← stderr (slave PTY)
│       └── cmdline
│
├── dev/
│   ├── pts/
│   │   ├── 0                   ← PTY slave device
│   │   ├── 1                   ← PTY slave device
│   │   └── ...
│   └── null
│
└── var/
    └── log/
        └── wrapper.log         ← Application logs


UNIX SOCKET DETAILS:
═══════════════════════════════════════════════════════════════════════

File: /tmp/sockets/claude.sock
  Type: Socket (l)
  Permissions: 0666 (rw-rw-rw-)
  Owner: root:root (or container user)
  Size: 0 (sockets don't have size)

  Structure in kernel:
  ┌─────────────────────────────────┐
  │ Socket Type: SOCK_STREAM        │
  │ Protocol: AF_UNIX               │
  │ Listening: Yes                  │
  │ Backlog: 10 pending connections │
  │ Connected sockets: 1-5          │
  │ Bound to: /tmp/sockets/claude.sock
  └─────────────────────────────────┘


PTY DEVICE DETAILS:
═══════════════════════════════════════════════════════════════════════

Master Device: /dev/ptmx
  ├─ Used by: Wrapper (PTY Proxy)
  └─ Provides: Master file descriptor (fd#3)

Slave Devices: /dev/pts/0, /dev/pts/1, ...
  ├─ Used by: Claude TUI (bash process)
  ├─ Connected to: stdin/stdout/stderr
  └─ Terminal emulation: xterm-color


PROCESS TREE:
═══════════════════════════════════════════════════════════════════════

init (PID 1)
├── wrapper.js (PID 10)
│   └── bash (Claude TUI) (PID 15)
│       ├── task-master (PID 23) [when executing]
│       ├── node (PID 24) [when executing]
│       └── ... [other child processes]
└── [other processes]
```

---

## Performance Characteristics Diagram

```
THROUGHPUT vs PAYLOAD SIZE:
═══════════════════════════════════════════════════════════════════════

Mbits/sec
   │
800 │     Named Pipes (FIFO)
   │    ╱
700 │   ╱
   │  ╱
600 │ ╱
   │╱                    Unix Domain Sockets
500 │─────────────────────╱
   │                   ╱
400 │                ╱
   │              ╱
300 │           ╱
   │        ╱
200 │─────╱───────────────────
   │   ╱
100 │ ╱
   │╱_________________________________
   └────────────────────────────────── Payload Size (bytes)
   0    100   500   1K    10K   100K  1M

Key insights:
- Named pipes faster for small blocks (<500 bytes)
- Unix sockets faster for large blocks (>10KB)
- Both excellent for most IPC scenarios
- PTY adds negligible overhead compared to direct sockets


LATENCY: Command Execution Timeline
═══════════════════════════════════════════════════════════════════════

                       Command Execution Phases

Timeline (ms):
0       │ ├─ Client connect          (5ms)
5       │ ├─ Send JSON message       (0.1ms)
        │ ├─ Server parse            (0.5ms)
        │ ├─ Queue enqueue           (0.1ms)
        │ ├─ Send ACK                (0.1ms)
        │ │
        │ │ ┌─ Wait for queue slot
10      │ │ │ (depends on queue depth)
        │ │ │
        │ │ ├─ Write to PTY            (1ms)
        │ │ ├─ PTY forward to bash     (2ms)
        │ │ │
        │ │ │ ┌─ Shell execution time
        │ │ │ │ (depends on command)
        │ │ │ │
100     │ │ │ │ ┌─ Quick commands (echo): 10-50ms
        │ │ │ │ │
        │ │ │ │ ├─ Medium commands (ls -la): 50-200ms
        │ │ │ │ │
1000    │ │ │ │ ├─ Long commands (tests): 1-10s
        │ │ │ │ │
        │ │ │ │ └─ Very long (builds): 10s+
        │ │ │ │
        │ │ ├─ Capture output         (2ms)
        │ │ ├─ Detect completion      (1ms)
        │ │ ├─ Format result JSON     (1ms)
        │ │ ├─ Send result            (0.1ms)
        │ │
        │ ├─ Client receive          (variable)
        │ ├─ Client parse JSON       (0.5ms)
        │ ├─ Resolution              (0.1ms)
        └─

Total = (network) + (queue wait) + (command execution) + (capture)
      = ~10ms base + queue_depth_ms + command_ms + ~5ms


MEMORY USAGE: Queue and Buffer Management
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────┐
│ Wrapper Process Memory                  │
├─────────────────────────────────────────┤
│ Base Process              ~40 MB         │
│   - Node.js runtime                     │
│   - Libraries loaded                    │
│                                         │
│ Command Queue             ~0.1-5 MB     │
│   - 10-100 queued commands              │
│   - ~50 KB per command (metadata)       │
│                                         │
│ Output Buffers            ~5-50 MB      │
│   - One large command: 1-10 MB output   │
│   - Multiple small: 100-500 KB          │
│                                         │
│ Connected Clients         ~1 MB         │
│   - Each connection: ~100-200 KB        │
│   - With 5-10 connections: ~1 MB        │
│                                         │
│ Total Typical: ~50-100 MB               │
│ Peak (large output): ~100-200 MB        │
└─────────────────────────────────────────┘

Recommendations:
- Set docker memory limit: 512 MB - 1 GB
- Monitor with: docker stats wrapper
- Consider streaming for output >10 MB
```

---

## Deployment Architecture Variants

### Variant 1: Single Wrapper, Local Orchestrator

```
┌─────────────────────────────────────────┐
│           Host Machine                  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Orchestrator (Node.js)           │  │
│  │ - Runs all agent logic           │  │
│  │ - Connects to /tmp/claude.sock   │  │
│  └──┬───────────────────────────────┘  │
│     │                                   │
│     │ Unix Socket                       │
│     │ /tmp/sockets/claude.sock          │
│     │                                   │
│  ┌──▼───────────────────────────────┐  │
│  │ Docker Container: Wrapper        │  │
│  │ - PTY Wrapper Server             │  │
│  │ - Command Queue                  │  │
│  │ - Claude Code TUI                │  │
│  │ Volume: /tmp/sockets            │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘

Pros:
- Simple setup
- Fast IPC (local Unix socket)
- Minimal network overhead

Cons:
- Single point of failure
- Orchestrator + wrapper on same host
- Scaling requires multiple host machines
```

### Variant 2: Single Wrapper, Distributed Agents

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose Network                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  │ Agent: Marie   │  │ Agent: Anga    │  │ Agent: Fabien  │
│  │ (Container)    │  │ (Container)    │  │ (Container)    │
│  │ Connects to    │  │ Connects to    │  │ Connects to    │
│  │ wrapper:socket │  │ wrapper:socket │  │ wrapper:socket │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
│           │                   │                   │
│           │ (Internal Docker Network on port)     │
│           │  tcp://wrapper:3001 OR               │
│           │  unix://socket (shared volume)       │
│           │                                      │
│           └───────────┬───────────────────────────┘
│                       │
│              ┌────────▼──────────┐
│              │ Wrapper Container │
│              │ - PTY Server      │
│              │ - Queue mgmt      │
│              │ - Claude TUI      │
│              └───────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘

Pros:
- All agents in containers
- Easy horizontal scaling (add more agent containers)
- Managed by docker-compose

Cons:
- Need shared socket volume or TCP port
- TCP adds network overhead vs Unix socket
- Slightly more complex setup
```

### Variant 3: Kubernetes Deployment

```
┌──────────────────────────────────────────────┐
│         Kubernetes Cluster                   │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ Service: wrapper-svc                   │ │
│  │ Type: ClusterIP                        │ │
│  │ Port: 3001 (wrapper API)               │ │
│  │                                        │ │
│  │ PVC: socket-volume                     │ │
│  │ (for Unix socket sharing)              │ │
│  └────────┬───────────────────────────────┘ │
│           │                                  │
│  ┌────────▼──────────┐                     │
│  │ Deployment: Wrapper                    │ │
│  │ Replicas: 1                            │ │
│  │ └─ Pod: Wrapper-xxxxx                  │ │
│  │    ├─ Container: pty-wrapper           │ │
│  │    ├─ Volume: socket-volume            │ │
│  │    └─ Resources:                       │ │
│  │        - Memory: 512Mi                 │ │
│  │        - CPU: 500m                     │ │
│  └────────────────────┘                     │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ Deployment: Agents (Marie/Anga/Fabi)  │   │
│  │ Replicas: 3                            │   │
│  │ ├─ Pod: Agent-marie-xxxxx            │   │
│  │ ├─ Pod: Agent-anga-xxxxx             │   │
│  │ ├─ Pod: Agent-fabien-xxxxx           │   │
│  │ │                                      │   │
│  │ └─ All mount: socket-volume (RO)     │   │
│  │    All connect to: wrapper-svc:3001   │   │
│  └─────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘

YAML Structure:
apiVersion: v1
kind: Service
metadata:
  name: wrapper-svc
spec:
  selector:
    app: wrapper
  ports:
  - port: 3001
    targetPort: 3001

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: wrapper
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wrapper
  template:
    metadata:
      labels:
        app: wrapper
    spec:
      containers:
      - name: pty-wrapper
        image: wrapper:latest
        ports:
        - containerPort: 3001
        volumeMounts:
        - name: socket-volume
          mountPath: /tmp/sockets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: socket-volume
        emptyDir: {}

Pros:
- Enterprise-grade orchestration
- Automatic scaling
- Self-healing
- Resource limits

Cons:
- More complex setup
- Overkill for small teams
- Requires Kubernetes knowledge
```

---

## Error Handling and Recovery Flow

```
COMMAND EXECUTION WITH ERROR SCENARIOS:
═══════════════════════════════════════════════════════════════════════

Normal Path:
  Command → Enqueued → Executing → Complete → Result Sent

Error Path 1: Timeout
  Command → Enqueued → Executing ──(timeout fires)──→ Error Sent
                         ▲                              │
                         └──── Kill command ──────────┘

Error Path 2: Socket Disconnected
  Command → Enqueued → Executing → (socket dies)
                         │
                         └──→ Cleanup ──→ Error Sent to other clients
                                         or log to disk

Error Path 3: PTY Crash
  Command → Enqueued → (PTY exits)
                         │
                         ├──→ Clear queue
                         ├──→ Send errors to all clients
                         ├──→ Attempt restart
                         └──→ If restart fails: Critical alert

Error Path 4: Invalid JSON
  Request → (parse fails) → Immediate error response
            (no queueing)

Error Path 5: Queue Full
  Command → (queue.length >= max) → Reject: "Queue full"
                                     Suggest: retry later


RECOVERY STRATEGY:
═══════════════════════════════════════════════════════════════════════

Wrapper Crash → Docker restarts container
Container restart → Load health check
Health check fails → Docker marks unhealthy
After 3 failures → Compose/K8s restarts service

Health Check Sequence:
  1. Try connect to socket: 3 second timeout
  2. Send ping message
  3. Wait for pong: 5 second timeout
  4. Close connection
  5. If all pass: Healthy
  6. If any fail: Unhealthy

Commands in flight during crash:
  - Lost (clients get connection reset)
  - Clients should implement retry logic
  - Exponential backoff: 100ms → 200ms → 400ms → 800ms → 1.6s
```

---

## Monitoring and Metrics Dashboard

```
METRICS TO TRACK:
═══════════════════════════════════════════════════════════════════════

Real-Time Metrics:
  ├─ Queue size (current length)
  ├─ Active connections (client count)
  ├─ Command throughput (commands/sec)
  ├─ Average command latency (ms)
  ├─ PTY process status (running/crashed)
  ├─ Socket file size (bytes)
  └─ Memory usage (MB)

Cumulative Metrics:
  ├─ Total commands processed (lifetime)
  ├─ Total errors (by type)
  ├─ Total timeout events
  ├─ Crash count (uptime events)
  ├─ Restart count
  └─ Uptime percentage

Performance Metrics:
  ├─ P50 command latency (median)
  ├─ P95 command latency (95th percentile)
  ├─ P99 command latency (99th percentile)
  ├─ Max command latency (peak)
  ├─ Queue wait time (P50/P95/P99)
  └─ Network throughput (Mbps)

System Metrics:
  ├─ CPU usage (%)
  ├─ Memory usage (MB)
  ├─ Open file descriptors (count)
  ├─ Socket connections (count)
  ├─ PTY buffer usage (%)
  └─ Disk I/O (if logging)


EXAMPLE MONITORING OUTPUT:
═══════════════════════════════════════════════════════════════════════

[Wrapper Status Dashboard]

Queue Status:
  Pending: 3
  Processing: 1
  Completed (last 5 min): 47

Clients:
  Connected: 5
  Total lifetime: 234

Performance (last 1 hour):
  Commands: 342
  Throughput: 5.7 cmds/sec
  Avg latency: 234ms
  P95 latency: 1245ms
  P99 latency: 2341ms
  Errors: 2 (0.6%)

Resources:
  Memory: 87 MB (17% of 512 MB limit)
  CPU: 45% (4 cores available)
  Open FDs: 23/1024

Uptime:
  Session started: 2025-11-22 10:30:00 UTC
  Uptime: 14 days, 3 hours
  Restart count: 0
  Crash count: 0

Health:
  Status: HEALTHY
  Last health check: 2s ago
  Health checks passed: 1847/1847 (100%)
```

---

## Summary: Architecture Decision Tree

```
Choose architecture based on:

1. Scale requirements?
   ├─ Small (<10 agents)
   │  └─→ Variant 1 or 2 (Docker Compose)
   ├─ Medium (10-100 agents)
   │  └─→ Variant 2 (Docker Compose with scaling)
   └─ Large (>100 agents)
      └─→ Variant 3 (Kubernetes)

2. Network topology?
   ├─ Same machine
   │  └─→ Unix Domain Socket (/tmp/socket.sock)
   ├─ Same LAN
   │  └─→ TCP port or shared volume mount
   └─ WAN/Cloud
      └─→ TCP with TLS + load balancer

3. Reliability requirements?
   ├─ Dev/test
   │  └─→ Pattern 1 or 2 (simple)
   ├─ Production
   │  └─→ Pattern 3 (production-grade)
   └─ High-availability
      └─→ Pattern 3 + health monitoring + auto-restart

4. Complexity tolerance?
   ├─ Prefer simplicity
   │  └─→ Pattern 2 (minimal complexity)
   ├─ Standard production
   │  └─→ Pattern 3 + Docker Compose
   └─ Enterprise
      └─→ Pattern 3 + Kubernetes + monitoring
```

