# Automation Container

## Overview

The `codehornets-svc-automation` container provides automation capabilities for the multi-agent system, primarily for waking workers programmatically. It runs entirely in Docker without requiring any host dependencies.

## What It Does

The automation container:
- Installs `expect` (for automating interactive programs)
- Has access to Docker socket (can control other containers)
- Provides a platform for running automation scripts
- Enables fully automated worker activation

## Container Details

**Image:** `alpine:latest` (lightweight)
**Name:** `codehornets-svc-automation`
**Tools installed:**
- bash
- expect
- docker-cli
- curl

**Volumes:**
- `./tools:/tools:ro` - Access to automation scripts
- `./shared:/workspace/shared:rw` - Access to shared data
- `/var/run/docker.sock:/var/run/docker.sock:ro` - Docker control

## Quick Start

### Start the Container

```bash
# Option 1: Start with everything
make up

# Option 2: Start just automation
make start-automation

# Option 3: Using docker-compose
docker-compose up -d automation
```

### Verify It's Running

```bash
docker ps | grep automation
# Should show: codehornets-svc-automation

docker logs codehornets-svc-automation
# Should show: ✓ Automation tools ready
```

### Use It

```bash
# Wake a specific worker
make wake-anga
make wake-marie
make wake-fabien

# Wake all workers
make wake-all
```

## How It Works

### Worker Wake Flow

1. **You run:** `make wake-anga`
2. **Script checks:** Is automation container running?
3. **If yes:** Executes expect script inside automation container
4. **Expect:**
   - Attaches to worker container
   - Sends activation message
   - Waits briefly
   - Detaches cleanly (Ctrl+P Ctrl+Q)
5. **Worker:** Receives message and starts monitoring tasks

### Technical Implementation

```bash
# The script runs this inside automation container:
docker exec codehornets-svc-automation bash -c "
expect <<'EOF'
spawn docker attach codehornets-worker-anga
send \"Check for pending tasks\r\"
sleep 2
send \"\x10\x11\"  # Ctrl+P Ctrl+Q
EOF
"
```

The automation container can control other containers because it has access to the Docker socket.

## Benefits

### 1. No Host Dependencies
- **Before:** Required `expect` installed on host machine
- **After:** Everything runs in Docker

### 2. Works Everywhere
- Linux, macOS, Windows (with Docker)
- WSL2
- Cloud environments
- CI/CD pipelines

### 3. Consistent Environment
- Same tools on every machine
- No version conflicts
- Easy to reproduce

### 4. Simple Setup
```bash
make up          # That's it!
make wake-anga   # Works immediately
```

## Commands

### Container Management

```bash
make start-automation    # Start automation container
make stop-automation     # Stop automation container
docker-compose logs automation  # View logs
```

### Worker Wake Commands

```bash
make wake-marie      # Wake Marie
make wake-anga       # Wake Anga
make wake-fabien     # Wake Fabien
make wake-all        # Wake all workers
```

### Direct Script Usage

```bash
# Using the Docker-based script directly
./tools/wake_worker_docker.sh anga
./tools/wake_worker_docker.sh marie "Custom message"

# Using the wrapper (tries automation first, then fallback)
./tools/wake_worker.sh anga
```

## Fallback Behavior

The wake scripts check for automation in this order:

1. **Automation container** (preferred) ✓
   - Fully automated
   - No host dependencies
   - Works across all platforms

2. **Host `expect`** (fallback)
   - If automation container not running
   - Requires `expect` installed on host
   - Still fully automated

3. **Manual instructions** (last resort)
   - If neither above available
   - Provides step-by-step guide
   - Creates notification trigger

## Troubleshooting

### Container Not Starting

**Check status:**
```bash
docker-compose ps automation
```

**View logs:**
```bash
docker logs codehornets-svc-automation
```

**Common issues:**
- Docker socket not accessible
- Port conflicts (none used)
- Resource limits

**Solution:**
```bash
docker-compose down automation
docker-compose up -d automation
```

### Wake Command Not Working

**Verify automation is running:**
```bash
docker ps | grep automation
```

**Check worker is running:**
```bash
docker ps | grep codehornets-worker-anga
```

**Test expect directly:**
```bash
docker exec codehornets-svc-automation expect -v
# Should show expect version
```

**Check Docker socket access:**
```bash
docker exec codehornets-svc-automation docker ps
# Should list containers
```

### Permission Denied

The automation container needs access to Docker socket:

```bash
# Check socket permissions
ls -la /var/run/docker.sock

# If needed, adjust docker-compose.yml volume mount
# Current: /var/run/docker.sock:/var/run/docker.sock:ro
```

## Security Considerations

### Docker Socket Access

The automation container has **read-only** access to Docker socket:
```yaml
- /var/run/docker.sock:/var/run/docker.sock:ro
```

This allows it to:
- ✓ List containers
- ✓ Execute commands in containers
- ✓ Attach to containers
- ✗ Create new containers
- ✗ Delete containers
- ✗ Modify docker daemon

### Why This Is Safe

1. **Read-only socket:** Cannot modify Docker infrastructure
2. **Limited scope:** Only interacts with CodeHornets containers
3. **No network exposure:** Container doesn't expose ports
4. **Isolated:** Runs in same network as other agents
5. **Stateless:** No persistent data, can be rebuilt anytime

### Production Considerations

For production environments, consider:

1. **Use specific Docker API version:**
   ```yaml
   environment:
     - DOCKER_API_VERSION=1.41
   ```

2. **Restrict container access:**
   - Only allow exec on specific containers
   - Implement access control in scripts

3. **Audit logging:**
   - Log all automation actions
   - Monitor Docker socket usage

4. **Alternative approaches:**
   - Use Docker API instead of socket
   - Implement message queue system
   - Use Kubernetes-native solutions

## Comparison: Before vs After

### Before (Host Dependencies)

```bash
# Setup required on EVERY machine:
sudo apt-get install expect  # Linux
brew install expect           # macOS
# Windows: Not available

# Then could use:
make wake-anga
```

### After (Docker-Only)

```bash
# Setup: (already done when you start the system)
make up

# Use immediately:
make wake-anga  # Works everywhere!
```

## Integration with Main System

The automation container is part of the main system:

```yaml
# docker-compose.yml includes:
services:
  automation:    # Automation helper
  monitor:       # System monitor
  orchestrator:  # Task coordinator
  marie:         # Frontend worker
  anga:          # Backend worker
  fabien:        # DevOps worker
  redis:         # Coordination
```

**Start everything:**
```bash
make up
# Starts all services including automation
```

## Advanced Usage

### Custom Expect Scripts

Run custom expect scripts inside automation container:

```bash
docker exec codehornets-svc-automation bash -c "
expect <<'EOF'
# Your expect script here
spawn docker attach codehornets-worker-marie
send \"Your custom command\r\"
send \"\x10\x11\"
EOF
"
```

### Batch Operations

Wake multiple workers with delays:

```bash
for worker in marie anga fabien; do
  make wake-$worker
  sleep 5  # Wait between wakes
done
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Start CodeHornets
  run: make up

- name: Wake all workers
  run: make wake-all

- name: Create test task
  run: make task-anga TITLE="Test" DESC="Run tests"

- name: Monitor completion
  run: make logs-monitor
```

## Summary

The automation container provides a **Docker-native**, **dependency-free** way to automate worker activation. It's lightweight, portable, and works identically across all platforms.

**Key advantages:**
- ✓ No host dependencies (except Docker)
- ✓ Works on Linux, macOS, Windows, WSL2
- ✓ Fully automated worker wake
- ✓ Part of the main system (`make up`)
- ✓ Secure (read-only Docker socket)
- ✓ Lightweight (Alpine-based, ~50MB)

**Simple to use:**
```bash
make up          # Start everything
make wake-anga   # Wake a worker
```
