# CodeHornets AI - Docker Infrastructure

**Unified Docker Compose configuration** for multi-agent orchestration system.

---

## 📁 Directory Structure

```
infrastructure/docker/codehornets-ai/
├── docker-compose.yml                   # Main compose file (with profiles)
├── docker-compose.override.yml.example  # Local dev customization template
├── .env.example                         # Environment variables template
├── README.md                            # This file
├── prompts/                             # Agent system prompts
│   ├── orchestrator.md
│   ├── agents/
│   │   ├── Marie.md                    # Dance teacher
│   │   ├── Anga.md                     # Coding assistant
│   │   └── Fabien.md                   # Marketing specialist
│   └── domains/
│       ├── DANCE.md
│       ├── CODING.md
│       └── MARKETING.md
├── output-styles/                       # Agent output formatting
│   ├── marie.md
│   ├── anga.md
│   └── fabien.md
├── shared/                              # Runtime data (created automatically)
│   ├── auth-homes/                     # Authentication tokens
│   │   ├── orchestrator/
│   │   ├── marie/
│   │   ├── anga/
│   │   └── fabien/
│   ├── tasks/                          # Task queue
│   │   ├── marie/
│   │   ├── anga/
│   │   └── fabien/
│   ├── results/                        # Task results
│   │   ├── marie/
│   │   ├── anga/
│   │   └── fabien/
│   ├── heartbeats/                     # Worker health monitoring
│   │   ├── marie.json
│   │   ├── anga.json
│   │   └── fabien.json
│   └── workspaces/                     # Agent working directories
│       ├── marie/
│       ├── anga/
│       └── fabien/
└── memory-system/                       # Long-term memory (optional)
```

---

## 🚀 Quick Start

### 1. Default Mode (Polling)

```bash
cd infrastructure/docker/codehornets-ai
docker-compose up -d
```

**Behavior**: Workers poll for tasks every 1 second (simple, works everywhere).

### 2. Event-Driven Mode (Zero CPU Idle)

```bash
cd infrastructure/docker/codehornets-ai
ACTIVATION_WRAPPER=1 docker-compose --profile activated up -d
```

**Behavior**: Workers sleep with 0% CPU until task arrives, instant wakeup.

### 3. Local Development with Overrides

```bash
# Copy and customize override file
cp docker-compose.override.yml.example docker-compose.override.yml
nano docker-compose.override.yml

# Start with overrides (automatically merged)
docker-compose up
```

---

## 🎛️ Modes Explained

### Polling Mode (Default)

- Workers check for tasks every 1 second
- 5-10% CPU usage when idle
- No external dependencies
- Simple and reliable

**When to use**: Development, testing, simple deployments.

### Event-Driven Mode

- Workers wake instantly on task arrival (<1ms)
- 0% CPU usage when idle
- Requires `activation_wrapper.py`
- Three activation methods available

**When to use**: Production, high efficiency needed.

### Activation Methods

| Method | Latency | CPU Idle | Clusterable | Platform |
|--------|---------|----------|-------------|----------|
| `inotify` | <1ms | 0% | No | Linux |
| `redis` | <10ms | 0% | Yes | All |
| `polling` | ~1000ms | 0%* | No | All |

*Still 0% because uses blocking wait, not active polling

---

## 🔧 Configuration

### Environment Variables

Create `.env` file or set via environment:

```bash
# Mode Selection
ACTIVATION_WRAPPER=1              # Enable event-driven mode (blank = polling)
ACTIVATION_MODE=inotify           # inotify|redis|polling (default: inotify)

# System Configuration
NODE_ENV=production               # Environment mode
REDIS_URL=redis://redis:6379      # Redis connection (for redis mode)
HEARTBEAT_INTERVAL=10             # Health check interval (seconds)

# Advanced
TASK_DIR=/tasks                   # Task directory inside container
RESULT_DIR=/results               # Results directory inside container
HEARTBEAT_DIR=/shared/heartbeats  # Heartbeat directory inside container
```

### Custom Overrides

`docker-compose.override.yml` is automatically merged and takes precedence:

```yaml
# Example: Custom ports for debugging
services:
  marie:
    ports:
      - "8001:8001"  # Expose for debugging
    environment:
      - DEBUG=true   # Enable debug logs
```

---

## 📊 Monitoring

### Check Worker Status

```bash
# Container status
docker-compose ps

# Worker logs
docker-compose logs -f marie

# Health checks
docker-compose exec orchestrator cat /shared/heartbeats/marie.json
```

### Heartbeat Format

```json
{
  "worker": "marie",
  "timestamp": "2025-11-19T15:30:00Z",
  "current_task": "task-123",
  "queue_size": 2,
  "status": "alive"
}
```

---

## 🔄 Common Operations

### Start System

```bash
# Default mode
docker-compose up -d

# Event-driven mode
ACTIVATION_WRAPPER=1 docker-compose --profile activated up -d

# With Redis pub/sub
ACTIVATION_WRAPPER=1 ACTIVATION_MODE=redis docker-compose --profile activated up -d
```

### Stop System

```bash
docker-compose down
```

### Restart Workers

```bash
# Restart all workers
docker-compose restart marie anga fabien

# Restart with fresh prompts
docker-compose down marie anga fabien
docker-compose up -d marie anga fabien
```

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific worker
docker-compose logs -f marie

# Last 100 lines
docker-compose logs --tail 100 marie
```

### Send Test Task

```bash
cat > shared/tasks/marie/test-001.json <<EOF
{
  "task_id": "test-001",
  "description": "Evaluate intermediate dance students"
}
EOF
```

---

## 🐛 Troubleshooting

### Workers Not Starting

```bash
# Check logs
docker-compose logs marie

# Common issues:
# - Authentication missing: Run authentication first
# - Port conflicts: Check if ports are already in use
# - Volume permissions: Check file ownership
```

### Zero CPU Not Working

```bash
# Verify activation wrapper is running
docker-compose logs marie | grep "activation wrapper"

# Check ACTIVATION_WRAPPER env var is set
docker-compose exec marie env | grep ACTIVATION

# Verify heartbeat updates
watch -n 1 cat shared/heartbeats/marie.json
```

### Redis Connection Issues

```bash
# Check Redis is running (in activated mode)
docker-compose ps redis

# Test Redis connectivity
docker-compose exec marie redis-cli -h redis ping

# Switch to inotify if Redis unavailable
ACTIVATION_MODE=inotify docker-compose up
```

---

## 🔐 Authentication

Agents require browser authentication (one-time):

```bash
# From project root, use Makefile commands
make auth-all           # Authenticate all agents
make auth-marie         # Authenticate Marie only
make auth-anga          # Authenticate Anga only
make auth-fabien        # Authenticate Fabien only
```

Credentials stored in `shared/auth-homes/<agent>/`.

---

## 📝 Best Practices

### Development

✅ Use `docker-compose.override.yml` for local customization
✅ Keep `docker-compose.yml` committed to git
✅ Add `docker-compose.override.yml` to `.gitignore`
✅ Use polling mode for simplicity

### Production

✅ Use event-driven mode for efficiency
✅ Enable Redis for clustering
✅ Monitor heartbeats for worker health
✅ Set proper resource limits
✅ Use orchestration (Kubernetes/Swarm) for scale

### Testing

✅ Test both polling and event-driven modes
✅ Verify graceful shutdown works
✅ Check heartbeats update correctly
✅ Test task queueing under load

---

## 🔗 Related Documentation

- [Activation System Guide](../../../docs/AGENT_ACTIVATION_INTEGRATION.md)
- [Codebase Audit](../../../docs/CODEBASE_AUDIT_ISSUES.md)
- [Main README](../../../README.md)
- [Makefile Commands](../../../Makefile)

---

**Questions?** Check the main project README or create an issue.
