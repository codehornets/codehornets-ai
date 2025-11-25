# Quick Start: Apply Docker Socket Fix

## TL;DR
Run this single command to apply the fix and verify it works:

```bash
bash APPLY_FIX.sh
```

## What This Does
The fix grants Docker socket access to all CodeHornets agents (orchestrator, marie, anga, fabien) so they can:
- Execute Docker commands (`docker ps`, `docker exec`, etc.)
- Communicate with each other via `send_agent_message.sh`
- Run bash scripts that interact with other containers

## Manual Steps (if you prefer)

### 1. Stop containers
```bash
docker-compose down
```

### 2. Restart with new configuration
```bash
docker-compose up -d
```

### 3. Test Docker access
```bash
bash test-docker-access.sh
```

### 4. Test agent communication
```bash
# Send message to Anga
bash tools/send_agent_message.sh anga "Test message" logs

# Send message to Marie
bash tools/send_agent_message.sh marie "Test message" logs

# Send message to Fabien
bash tools/send_agent_message.sh fabien "Test message" logs
```

## What Changed

### docker-compose.yml
All worker agents (marie, anga, fabien) now have:

1. **Root group added**:
   ```yaml
   group_add:
     - "0"     # Root group for Docker socket access
     - "1001"  # Docker group on host
   ```

2. **Read-write Docker socket**:
   ```yaml
   volumes:
     - /var/run/docker.sock:/var/run/docker.sock:rw  # Changed from :ro
   ```

## Verification Commands

### Check groups inside containers
```bash
docker exec codehornets-orchestrator sh -c "groups"
docker exec codehornets-worker-marie sh -c "groups"
docker exec codehornets-worker-anga sh -c "groups"
docker exec codehornets-worker-fabien sh -c "groups"
```

Expected output: `agent sudo root 1001` (should include "root")

### Test docker ps inside containers
```bash
docker exec codehornets-orchestrator sh -c "docker ps"
docker exec codehornets-worker-marie sh -c "docker ps"
docker exec codehornets-worker-anga sh -c "docker ps"
docker exec codehornets-worker-fabien sh -c "docker ps"
```

Expected output: List of running containers (no permission denied errors)

## Troubleshooting

### "Permission denied" errors persist
1. Ensure you stopped containers: `docker-compose down`
2. Verify docker-compose.yml has the changes
3. Restart containers: `docker-compose up -d`
4. Wait 5-10 seconds for containers to initialize
5. Run test script: `bash test-docker-access.sh`

### Containers won't start
1. Check logs: `docker-compose logs`
2. Verify Docker is running: `docker info`
3. Check disk space: `df -h`

### Test script fails
1. Ensure containers are running: `docker ps`
2. Check individual container logs: `docker logs codehornets-worker-anga`
3. Verify Docker socket exists: `ls -la /var/run/docker.sock`

## Documentation
- Full details: See `DOCKER_SOCKET_FIX.md`
- Security considerations: See `DOCKER_SOCKET_FIX.md` section "Security Considerations"

## Next Steps
After successful application:
1. Test agent-to-agent communication
2. Monitor agent logs for errors
3. Use `send_agent_message.sh` to interact with agents
