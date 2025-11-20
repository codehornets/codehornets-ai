# How to Fix Docker Socket Security Issue

## 🎯 Four Solutions (From Most to Least Secure)

---

## ✅ Solution 1: Remove Docker Socket (MOST SECURE)

### What Changes
```yaml
# BEFORE (Current - INSECURE)
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw  # ❌ REMOVE THIS

# AFTER (Secure)
volumes:
  # Docker socket removed - agents can't control Docker
```

### Pros & Cons

**✅ Pros:**
- **100% secure** - No container escape possible
- Agents truly isolated
- Peace of mind

**❌ Cons:**
- **Claude Code sandboxing breaks** - Can't run untrusted code in sandbox
- Agents can't use Docker commands
- Some Claude features limited

### When to Use
- You don't need Claude to run Docker commands
- Security is top priority
- Working with sensitive data
- Don't need sandbox features

### Implementation

Create `docker-compose.secure.yml`:

```yaml
name: codehornets-ai

services:
  # Orchestrator - NO Docker socket
  orchestrator:
    image: docker/sandbox-templates:claude-code
    container_name: codehornets-orchestrator
    entrypoint: ["/tools/orchestrator_entrypoint.sh"]
    volumes:
      - ./prompts:/prompts:ro
      - ./hooks-config:/hooks-config:ro
      - ./tools:/tools:ro
      - ./requirements.txt:/requirements.txt:ro
      - ./shared/auth-homes/orchestrator:/home/agent/.claude:rw
      - ./shared/tasks:/tasks:rw
      - ./shared/results:/results:ro
      - ./shared/heartbeats:/shared/heartbeats:rw
      - ./shared/triggers:/shared/triggers:rw
      - ./shared/pipes:/shared/pipes:rw
      - ./shared/watcher-logs:/var/log:rw
      - ./shared/workspaces:/workspaces:ro
      # NO DOCKER SOCKET - Secure
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - REDIS_URL=${REDIS_URL:-redis://redis:6379}
      - HOOKS_MODE=${HOOKS_MODE:-enabled}
      - TRIGGER_DIR=/shared/triggers
      - PIPE_DIR=/shared/pipes
      - TASKS_DIR=/tasks
      - RESULTS_DIR=/results
      - HEARTBEAT_DIR=/shared/heartbeats
      - AGENT_NAME=orchestrator
      - AGENT_ROLE=orchestrator
    networks:
      - claude-network
    stdin_open: true
    tty: true
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
        required: false

  # Marie - NO Docker socket
  marie:
    image: docker/sandbox-templates:claude-code
    container_name: codehornets-worker-marie
    entrypoint: ["/tools/entrypoint.sh"]
    command: ["marie"]
    volumes:
      - ./prompts:/prompts:ro
      - ./hooks-config:/hooks-config:ro
      - ./tools:/tools:ro
      - ./requirements.txt:/requirements.txt:ro
      - ./shared/auth-homes/marie:/home/agent/.claude:rw
      - ./shared/tasks/marie:/tasks:ro
      - ./shared/results/marie:/results:rw
      - ./shared/heartbeats:/shared/heartbeats:rw
      - ./shared/triggers/marie:/shared/triggers:rw
      - ./shared/pipes:/shared/pipes:rw
      - ./shared/watcher-logs:/var/log:rw
      - ./shared/workspaces/marie:/home/agent/workspace:rw
      # NO DOCKER SOCKET - Secure
    environment:
      - ACTIVATION_WRAPPER=${ACTIVATION_WRAPPER:-}
      - ACTIVATION_MODE=${ACTIVATION_MODE:-inotify}
      - HOOKS_MODE=${HOOKS_MODE:-enabled}
      - REDIS_URL=${REDIS_URL:-redis://redis:6379}
      - TASK_DIR=/tasks
      - RESULT_DIR=/results
      - HEARTBEAT_DIR=/shared/heartbeats
      - HEARTBEAT_INTERVAL=${HEARTBEAT_INTERVAL:-10}
      - TRIGGER_DIR=/shared/triggers
      - PIPE_DIR=/shared/pipes
      - WORKER_NAME=marie
      - AGENT_NAME=marie
      - AGENT_ROLE=worker
    networks:
      - claude-network
    stdin_open: true
    tty: true
    stop_grace_period: 60s
    stop_signal: SIGTERM
    restart: unless-stopped

  # Repeat for anga, fabien (same pattern)

  # Keep automation with READ-ONLY socket (for attach only)
  automation:
    image: alpine:latest
    container_name: codehornets-svc-automation
    command: >
      sh -c "
      apk add --no-cache bash expect docker-cli curl &&
      tail -f /dev/null
      "
    volumes:
      - ./tools:/tools:ro
      - ./shared:/workspace/shared:rw
      - /var/run/docker.sock:/var/run/docker.sock:ro  # READ-ONLY
    networks:
      - claude-network
    restart: unless-stopped

networks:
  claude-network:
    driver: bridge

volumes:
  redis-data:
```

### Test Security

```bash
# Start with secure config
docker-compose -f docker-compose.secure.yml up -d

# Try to escape
docker exec -it codehornets-worker-marie sh -c "docker ps"
# Error: Cannot connect to Docker daemon - socket not available

# Agents are truly isolated now
```

---

## 🔒 Solution 2: Docker-in-Docker (Good Balance)

### What Changes

Each agent gets its OWN Docker daemon (not the host's).

```yaml
services:
  marie:
    image: docker:dind  # Docker-in-Docker image
    privileged: true    # Needed for DinD
    volumes:
      - marie-docker-data:/var/lib/docker  # Separate Docker storage
      # NO host Docker socket
```

### How It Works

```
┌────────────────────────────────────────────────┐
│              Host Machine                      │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ Marie Container                          │ │
│  │                                           │ │
│  │   ┌──────────────────────────────────┐  │ │
│  │   │ Marie's Own Docker Daemon        │  │ │
│  │   │ (Running inside container)       │  │ │
│  │   │                                   │  │ │
│  │   │ Can create containers inside     │  │ │
│  │   │ Marie, but NOT on host          │  │ │
│  │   └──────────────────────────────────┘  │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### Pros & Cons

**✅ Pros:**
- Claude sandboxing still works
- Agents can use Docker commands
- Can't escape to host
- Each agent isolated

**❌ Cons:**
- Still needs `privileged: true` (mild security risk)
- More resources (daemon per agent)
- More complex setup
- Nested containers have performance overhead

### Implementation

```yaml
services:
  marie:
    image: docker:24-dind
    container_name: codehornets-worker-marie
    privileged: true  # Required for DinD
    environment:
      - DOCKER_TLS_CERTDIR=/certs
      - CLAUDE_WRAPPER=docker
    volumes:
      - marie-docker-data:/var/lib/docker
      - ./shared/auth-homes/marie:/home/agent/.claude:rw
      - ./shared/tasks/marie:/tasks:ro
      - ./shared/results/marie:/results:rw
    networks:
      - claude-network

volumes:
  marie-docker-data:
  anga-docker-data:
  fabien-docker-data:
```

---

## 🎯 Solution 3: Sysbox Runtime (BEST - If Available)

### What is Sysbox?

Sysbox is a container runtime that enables Docker-in-Docker WITHOUT privileged mode.

### Install Sysbox

```bash
# Install Sysbox (one-time setup)
wget https://downloads.nestybox.com/sysbox/releases/v0.6.3/sysbox-ce_0.6.3-0.linux_amd64.deb
sudo dpkg -i sysbox-ce_0.6.3-0.linux_amd64.deb

# Restart Docker
sudo systemctl restart docker
```

### Configuration

```yaml
services:
  marie:
    image: docker/sandbox-templates:claude-code
    container_name: codehornets-worker-marie
    runtime: sysbox-runc  # Use Sysbox runtime
    volumes:
      # NO Docker socket needed
      # NO privileged mode needed
      - ./shared/auth-homes/marie:/home/agent/.claude:rw
      - ./shared/tasks/marie:/tasks:ro
      - ./shared/results/marie:/results:rw
    networks:
      - claude-network
```

### Pros & Cons

**✅ Pros:**
- **Secure** - No privileged mode needed
- Docker-in-Docker works
- Claude sandboxing works
- Strong isolation

**❌ Cons:**
- Requires Sysbox installation
- Not available on all platforms
- Slightly more complex

---

## 🏢 Solution 4: Dedicated Sandbox Service

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Host Machine                         │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Marie     │  │    Anga      │  │   Fabien     │ │
│  │ (NO socket)  │  │ (NO socket)  │  │ (NO socket)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         │ HTTP Request     │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            ▼                             │
│                  ┌─────────────────┐                    │
│                  │ Sandbox Service │                    │
│                  │ (HAS socket)    │                    │
│                  │ + Authorization │                    │
│                  └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### How It Works

1. Agents send HTTP requests to sandbox service
2. Sandbox service validates request
3. Sandbox service creates container (has socket)
4. Returns result to agent

### Implementation

```yaml
services:
  # Sandbox service (only one with Docker access)
  sandbox-service:
    image: sandbox-service:latest
    container_name: codehornets-sandbox-service
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:rw
    environment:
      - ALLOWED_IMAGES=alpine,python:3.11,node:20
      - MAX_EXECUTION_TIME=300
    networks:
      - claude-network
    ports:
      - "8080:8080"

  # Agents request sandboxing via API
  marie:
    image: docker/sandbox-templates:claude-code
    container_name: codehornets-worker-marie
    volumes:
      # NO Docker socket
      - ./shared/auth-homes/marie:/home/agent/.claude:rw
    environment:
      - SANDBOX_API=http://sandbox-service:8080
    networks:
      - claude-network
```

### Pros & Cons

**✅ Pros:**
- Centralized control
- Can add authorization/limits
- Agents truly isolated
- Audit trail of sandbox usage

**❌ Cons:**
- Requires building sandbox service
- More complex architecture
- Performance overhead (API calls)
- More to maintain

---

## 📊 Comparison Table

| Solution | Security | Complexity | Claude Features | Resource Usage |
|----------|----------|------------|-----------------|----------------|
| **1. No Socket** | ⭐⭐⭐⭐⭐ | ⭐ Easy | ⚠️ Limited | ⭐ Low |
| **2. Docker-in-Docker** | ⭐⭐⭐⭐ | ⭐⭐⭐ Medium | ✅ Full | ⭐⭐⭐ High |
| **3. Sysbox** | ⭐⭐⭐⭐⭐ | ⭐⭐ Medium | ✅ Full | ⭐⭐ Medium |
| **4. Sandbox Service** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ Hard | ✅ Full | ⭐⭐ Medium |
| **Current (Socket)** | ⚠️ None | ⭐ Easy | ✅ Full | ⭐ Low |

---

## 🎯 Recommendation Based on Use Case

### For Personal Use / Learning
→ **Solution 1: No Socket**
- You probably don't need Docker sandboxing
- Maximum security
- Simplest

### For Development Work
→ **Solution 3: Sysbox** (if available)
- Good balance
- Strong security
- Full features

### For Production with Sensitive Data
→ **Solution 4: Sandbox Service**
- Centralized control
- Audit trail
- Authorization

### Current Setup (Keep Socket) Only If:
- You fully trust all agents
- Personal/test environment
- You monitor carefully
- No sensitive data

---

## 🚀 Quick Start: Implementing Solution 1

### Step 1: Backup Current Config

```bash
cd /home/anga/workspace/beta/codehornets-ai/libs/multi-agents-orchestration
cp docker-compose.yml docker-compose.yml.backup
```

### Step 2: Remove Docker Socket

```bash
# Edit docker-compose.yml
# Remove these lines from orchestrator, marie, anga, fabien:
#   - /var/run/docker.sock:/var/run/docker.sock:rw

# Keep it ONLY in automation (for docker attach):
#   - /var/run/docker.sock:/var/run/docker.sock:ro  # READ-ONLY
```

### Step 3: Test

```bash
# Restart system
make down
make up

# Test that agents can't escape
make shell-marie
# Inside container:
docker ps
# Should fail: "Cannot connect to Docker daemon"
```

### Step 4: Verify Security

```bash
# Try the escape exploit
docker exec -it codehornets-worker-marie sh -c \
  "docker run alpine echo 'escaped'"

# Expected: Error - docker command not found or can't connect to daemon
# This means: Secured! ✅
```

---

## ⚠️ What You'll Lose (Solution 1)

Claude Code features that will break:
- ❌ `claude --sandbox` - Can't create sandbox containers
- ❌ Docker commands in tasks - Agents can't run `docker ...`
- ❌ Container management - Can't start/stop other containers

What still works:
- ✅ All file operations
- ✅ All bash commands (non-Docker)
- ✅ Python/Node/other languages
- ✅ Task processing
- ✅ Inter-agent communication
- ✅ 95% of Claude functionality

---

## 💡 Summary

**The Problem:**
```
Docker socket = Master key to entire system
All agents have it = No real security
```

**The Solutions:**
```
1. Remove socket → Maximum security, some features lost
2. Docker-in-Docker → Good balance, more resources
3. Sysbox → Best of both worlds, requires install
4. Sandbox service → Enterprise-grade, complex
```

**The Choice:**
```
Security vs Functionality

Pick based on:
  • How sensitive is your data?
  • Do you need Docker sandboxing?
  • How much effort can you invest?
```

For most users: **Solution 1 (No Socket)** is recommended.
