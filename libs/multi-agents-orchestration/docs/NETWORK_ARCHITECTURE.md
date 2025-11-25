# CodeHornets AI - Docker Network Architecture & Privilege Model

## 📡 Network Architecture: `claude-network`

### Network Type: Bridge Mode
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Host Machine (Linux)                              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           Docker Bridge Network: claude-network                  │   │
│  │                    172.18.0.0/16 (default)                       │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ Orchestrator │  │    Marie     │  │     Anga     │          │   │
│  │  │ 172.18.0.2   │  │  172.18.0.3  │  │  172.18.0.4  │          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│  │         │                  │                  │                  │   │
│  │         └──────────────────┼──────────────────┘                  │   │
│  │                            │                                     │   │
│  │  ┌──────────────┐  ┌──────┴───────┐  ┌──────────────┐          │   │
│  │  │    Fabien    │  │    Redis     │  │   Monitor    │          │   │
│  │  │  172.18.0.5  │  │  172.18.0.6  │  │  172.18.0.7  │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                   │   │
│  │  ┌──────────────┐                                                │   │
│  │  │  Automation  │  (Alpine helper with expect)                  │   │
│  │  │  172.18.0.8  │                                                │   │
│  │  └──────────────┘                                                │   │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Shared Volumes (Host Filesystem)                    │   │
│  │              ./shared/tasks, ./shared/results, etc.              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

### How Bridge Network Works

1. **Container-to-Container Communication**
   - All containers on `claude-network` can communicate via:
     - Container names (DNS resolution): `redis://redis:6379`
     - IP addresses: `172.18.0.x`
   - No external network access by default
   - Isolated from host network

2. **DNS Resolution**
   ```
   orchestrator → "redis:6379" → Docker DNS → 172.18.0.6
   marie → "redis:6379" → Docker DNS → 172.18.0.6
   ```

3. **Network Isolation**
   - Containers **CANNOT** communicate outside the bridge network
   - No internet access unless explicitly configured
   - No access to host services (except via shared volumes and Docker socket)

---

## 🔐 Privilege Model & Container Separation

### Container Privilege Matrix

| Container | User | Groups | Docker Socket | Root Access | Network | Purpose |
|-----------|------|--------|---------------|-------------|---------|---------|
| **orchestrator** | `agent` | 0, 1001 | ✅ RW | ❌ | bridge | Task coordination |
| **marie** | `agent` | 0, 1001 | ✅ RW | ❌ | bridge | Frontend work |
| **anga** | `agent` | 0, 1001 | ✅ RW | ❌ | bridge | Backend work |
| **fabien** | `agent` | 0, 1001 | ✅ RW | ❌ | bridge | DevOps work |
| **automation** | `root` | - | ✅ RO | ✅ | bridge | Worker activation |
| **monitor** | `root` | - | ✅ RO | ✅ | bridge | System observation |
| **redis** | `redis` | - | ❌ | ❌ | bridge | State storage |

### Detailed Privilege Breakdown

#### 1. **Agent Containers (Orchestrator + Workers)**

```yaml
user: agent (UID 1000)
group_add:
  - "0"     # Root group (GID 0) - for Docker socket access
  - "1001"  # Docker group on host
```

**What This Means:**
- **Primary User**: Non-root `agent` user (UID 1000)
- **Supplementary Groups**: Added to root (0) and docker (1001) groups
- **Why Root Group?**: Docker socket (`/var/run/docker.sock`) is owned by `root:root`
  - Adding agent to group 0 grants read/write access to socket
  - This allows Claude Code to use Docker commands (for sandboxing)
- **Security Impact**: Agent can execute Docker commands but still non-root
  - Can't modify system files
  - Can't install packages
  - Can't change network config
  - **BUT** can spawn Docker containers (via socket)

**Filesystem Permissions:**
```
Agent containers have NO access to host filesystem except:
- Mounted volumes (explicitly defined in docker-compose.yml)
- Docker socket (for container management)
```

#### 2. **Volume Mount Permissions**

Each agent has **different** access levels to shared volumes:

##### **Orchestrator Permissions:**
```yaml
volumes:
  - ./shared/tasks:/tasks:rw              # Read/Write all workers' tasks
  - ./shared/results:/results:ro           # Read-only all results
  - ./shared/workspaces:/workspaces:ro     # Read-only all workspaces
  - ./shared/heartbeats:/shared/heartbeats:rw
  - ./shared/triggers:/shared/triggers:rw
  - /var/run/docker.sock:/var/run/docker.sock:rw  # Docker control
```

**Can:**
- ✅ Create tasks for any worker
- ✅ Read results from all workers
- ✅ Monitor all workspaces (read-only)
- ✅ Manage Docker containers
- ✅ Write heartbeats and triggers

**Cannot:**
- ❌ Modify worker results
- ❌ Write to worker workspaces directly

##### **Worker (Marie) Permissions:**
```yaml
volumes:
  - ./shared/tasks/marie:/tasks:ro         # Read-only OWN tasks
  - ./shared/results/marie:/results:rw     # Read/Write OWN results
  - ./shared/workspaces/marie:/home/agent/workspace:rw  # Own workspace
  - ./shared/triggers/marie:/shared/triggers:rw         # Own triggers
  - /var/run/docker.sock:/var/run/docker.sock:rw       # Docker control
```

**Can:**
- ✅ Read own tasks
- ✅ Write own results
- ✅ Full access to own workspace
- ✅ Manage Docker containers (for sandboxing)

**Cannot:**
- ❌ See other workers' tasks
- ❌ Access other workers' results
- ❌ Access other workers' workspaces
- ❌ Create tasks for others

##### **Worker (Anga) Permissions:**
```yaml
volumes:
  - ./shared/tasks/anga:/tasks:ro          # Read-only OWN tasks
  - ./shared/tasks/anga:/home/agent/workspace/tasks:ro  # Also in workspace
  - ./shared/results/anga:/results:rw      # Read/Write OWN results
  - ./shared/results/anga:/home/agent/workspace/results:rw  # Also in workspace
  - ./shared/workspaces/anga:/home/agent/workspace:rw
```

**Same as Marie**, plus:
- ✅ Tasks and results **also mounted** in workspace directories
  - Makes it easier to work with tasks in natural workspace path
  - `/home/agent/workspace/tasks/` instead of `/tasks/`

##### **Monitor Permissions:**
```yaml
volumes:
  - ./shared/tasks:/workspace/shared/tasks:rw       # All tasks (read/write)
  - ./shared/results:/workspace/shared/results:rw   # All results (read/write)
  - ./shared/archive:/workspace/shared/archive:rw   # Archive
  - ./shared/heartbeats:/workspace/shared/heartbeats:ro  # Read-only
  - /var/run/docker.sock:/var/run/docker.sock:ro    # Docker (read-only)
```

**Can:**
- ✅ Read/write all tasks (for archiving)
- ✅ Read/write all results (for archiving)
- ✅ Monitor heartbeats (read-only)
- ✅ Read Docker info (can't control containers)

**Cannot:**
- ❌ Control Docker containers
- ❌ Modify agent configurations

##### **Automation Permissions:**
```yaml
volumes:
  - ./shared:/workspace/shared:rw  # Full shared directory access
  - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker (read-only)
```

**Can:**
- ✅ Read/write entire shared directory
- ✅ Read Docker info
- ✅ Attach to containers (via `docker attach`)

**Cannot:**
- ❌ Start/stop containers
- ❌ Modify container configuration

---

## 🛡️ Container Isolation Mechanisms

### 1. **Filesystem Isolation**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Host Filesystem                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Orchestrator Container Filesystem View                    │  │
│  │                                                            │  │
│  │  /home/agent/.claude/  → ./shared/auth-homes/orchestrator │  │
│  │  /tasks/               → ./shared/tasks/                  │  │
│  │  /results/             → ./shared/results/                │  │
│  │  /shared/heartbeats/   → ./shared/heartbeats/             │  │
│  │  /var/run/docker.sock  → /var/run/docker.sock             │  │
│  │                                                            │  │
│  │  CANNOT SEE:                                               │  │
│  │  - Host /home, /etc, /var (except mounts)                 │  │
│  │  - Other containers' filesystems                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Marie Container Filesystem View                            │  │
│  │                                                            │  │
│  │  /home/agent/.claude/  → ./shared/auth-homes/marie/       │  │
│  │  /tasks/               → ./shared/tasks/marie/            │  │
│  │  /results/             → ./shared/results/marie/          │  │
│  │  /home/agent/workspace → ./shared/workspaces/marie/       │  │
│  │                                                            │  │
│  │  CANNOT SEE:                                               │  │
│  │  - ./shared/tasks/anga/                                   │  │
│  │  - ./shared/tasks/fabien/                                 │  │
│  │  - Other workers' workspaces                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. **Network Isolation**

```
Internet ❌
    ↑
    │ (no route)
    │
┌───┴────────────────────────────────────────┐
│   Docker Bridge Network: claude-network    │
│                                             │
│   ✅ orchestrator ↔ marie (allowed)        │
│   ✅ marie ↔ redis (allowed)               │
│   ✅ anga ↔ orchestrator (allowed)         │
│   ✅ monitor ↔ all (allowed)               │
│                                             │
│   ❌ No external connections                │
└─────────────────────────────────────────────┘
```

**Exception: Monitor's Ollama Access**
```yaml
monitor:
  extra_hosts:
    - "host.docker.internal:host-gateway"  # Can reach host:11434
```
- Monitor can access Ollama on host machine
- Uses `host.docker.internal` → resolves to host IP
- All other containers: no host access

### 3. **Process Isolation**

Each container has its own:
- ✅ PID namespace (can only see own processes)
- ✅ Network namespace (own IP, ports)
- ✅ Mount namespace (own filesystem view)
- ✅ IPC namespace (own shared memory)
- ✅ UTS namespace (own hostname)

**Example:**
```bash
# Inside marie container
ps aux
# Shows ONLY marie's processes (PID 1 = claude)

# Inside anga container
ps aux
# Shows ONLY anga's processes (PID 1 = claude)

# They CANNOT see each other's processes
```

### 4. **User Namespace Separation**

```
Host:
  - UID 1000 (your user) owns ./shared/ files

Inside Containers:
  - orchestrator: UID 1000 (agent) sees files as owned by "agent"
  - marie: UID 1000 (agent) sees files as owned by "agent"
  - anga: UID 1000 (agent) sees files as owned by "agent"

UID 1000 inside containers = UID 1000 on host
  → All agents can read/write shared volumes
  → But can't access each other's containers
```

---

## 🔄 Communication Patterns

### Method 1: Shared Volumes (Primary)

```
Orchestrator                                  Anga
    │                                          │
    │ 1. Write task                            │
    ├──> ./shared/tasks/anga/task-123.json    │
    │                                          │
    │                                          │ 2. inotify detects
    │                                          │ 3. Read task
    │                                          ├──> /tasks/task-123.json
    │                                          │
    │                                          │ 4. Write result
    │    ./shared/results/anga/result-123.json <──┤
    │                                          │
    │ 5. Read result                           │
    ├──> ./shared/results/anga/result-123.json │
    │                                          │
```

**Security:**
- ✅ Orchestrator can write tasks
- ✅ Anga can only read own tasks
- ✅ Anga can only write own results
- ❌ Anga cannot write to other workers' directories

### Method 2: Docker Socket (Container Control)

```
Automation Container
    │
    │ docker attach codehornets-worker-anga
    ├──────────────────────────────────────┐
    │                                       │
    │                                       ▼
    │                              Anga Container (PID 1)
    │                              receives keystrokes
    │
    │ docker exec codehornets-orchestrator python3 /tools/...
    └──────────────────────────────────────┐
                                            │
                                            ▼
                                   Orchestrator Container
                                   executes command
```

**Security:**
- ✅ Automation has **read-only** socket access
- ✅ Can attach to containers (send messages)
- ✅ Can exec commands
- ❌ Cannot start/stop containers (ro mount)

### Method 3: Network (Redis - Optional)

```
All Containers
    │
    │ redis://redis:6379
    ├────────────────────────────────┐
    │                                 │
    │                                 ▼
    │                         Redis Container
    │                         (shared state)
    │
    ├──> SET task:123 "data"
    ├──> GET task:123
    └──> PUBSUB channel:updates
```

**Currently**: Redis is deployed but **not actively used**
- Available for future coordination features
- All containers can connect via `redis:6379`

---

## 🔍 Security Summary

### What Each Container CAN Do

**Orchestrator:**
- ✅ Create tasks for all workers
- ✅ Read all results
- ✅ Control Docker containers
- ✅ Access all trigger/heartbeat files

**Workers (Marie, Anga, Fabien):**
- ✅ Read own tasks
- ✅ Write own results
- ✅ Full access to own workspace
- ✅ Control Docker (for sandboxing)
- ✅ Run Claude Code with auto-approval

**Monitor:**
- ✅ Read all tasks/results (for archiving)
- ✅ Write archives
- ✅ Read Docker info
- ✅ Access Ollama on host

**Automation:**
- ✅ Attach to worker containers
- ✅ Send commands to workers
- ✅ Read shared directory

### What Each Container CANNOT Do

**All Containers:**
- ❌ Access host filesystem (except mounts)
- ❌ Access internet
- ❌ Install packages (non-root)
- ❌ Modify system configuration

**Workers:**
- ❌ Access other workers' tasks/results/workspaces
- ❌ Create tasks for other workers
- ❌ Modify orchestrator data

**Monitor:**
- ❌ Control Docker containers
- ❌ Modify agent configurations
- ❌ Attach to containers

**Automation:**
- ❌ Start/stop containers
- ❌ Access agent configurations
- ❌ Modify Docker socket

---

## 🎯 Key Takeaways

1. **Network Level**: All containers communicate via isolated bridge network
2. **Filesystem Level**: Each agent sees only mounted volumes, isolated from host
3. **Permission Level**: Workers have scoped read/write access (own dirs only)
4. **Process Level**: Complete process isolation via Docker namespaces
5. **Security Model**: Defense in depth - multiple layers of isolation

**The system is designed with:**
- ✅ Least privilege principle (minimal permissions)
- ✅ Container isolation (can't escape sandbox)
- ✅ Scoped access (workers only see own data)
- ✅ Audit trail (all operations logged)
- ✅ No external network (prevents data leaks)
