# Docker Socket Permissions Fix for CodeHornets Agents

## Problem
The CodeHornets agents (orchestrator, marie, anga, fabien) need Docker socket access to communicate with each other via the `send_agent_message.sh` script. This script uses Docker commands like `docker ps`, `docker exec`, `docker attach`, and `docker logs`.

Previously, only the orchestrator had proper Docker socket access. The worker agents (marie, anga, fabien) had:
- Only group "1001" added (missing root group "0")
- Read-only Docker socket mount (`:ro` instead of `:rw`)

This caused "permission denied" errors when workers tried to use Docker commands.

## Solution
Updated `docker-compose.yml` to grant all agents (orchestrator and workers) full Docker socket access:

### Changes Applied

#### 1. Marie (Dance Teacher Worker)
```yaml
group_add:
  - "0"     # Root group for Docker socket access (ADDED)
  - "1001"  # Docker group on host
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw  # Changed from :ro to :rw
```

#### 2. Anga (Coding Assistant Worker)
```yaml
group_add:
  - "0"     # Root group for Docker socket access (ADDED)
  - "1001"  # Docker group on host
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw  # Changed from :ro to :rw
```

#### 3. Fabien (Marketing Assistant Worker)
```yaml
group_add:
  - "0"     # Root group for Docker socket access (ADDED)
  - "1001"  # Docker group on host
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw  # Changed from :ro to :rw
```

#### 4. Orchestrator (Already Correct)
```yaml
group_add:
  - "0"     # Root group for Docker socket access
  - "1001"  # Docker group on host
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw
```

## Why This Works

### Group "0" (Root Group)
- The Docker socket (`/var/run/docker.sock`) is typically owned by `root:docker` or `root:root`
- Adding group "0" (root group) to the container gives the agent user permission to access the socket
- This is a common pattern in Docker-in-Docker scenarios

### Read-Write Access (`:rw`)
- Workers need to execute Docker commands that modify container state (attach, exec)
- Read-only access (`:ro`) only allows viewing information, not interacting with containers
- The `send_agent_message.sh` script uses `docker attach` which requires write access

## How to Apply

### Step 1: Stop Existing Containers
```bash
cd C:/workspace/@codehornets-ai/libs/multi-agents-orchestration
docker-compose down
```

### Step 2: Restart with New Configuration
```bash
docker-compose up -d
```

### Step 3: Verify All Agents Have Docker Access
```bash
bash test-docker-access.sh
```

Or test manually:
```bash
# Test orchestrator
docker exec codehornets-orchestrator sh -c "docker ps"

# Test marie
docker exec codehornets-worker-marie sh -c "docker ps"

# Test anga
docker exec codehornets-worker-anga sh -c "docker ps"

# Test fabien
docker exec codehornets-worker-fabien sh -c "docker ps"
```

Expected output: Each command should list running containers without "permission denied" errors.

## Security Considerations

### Is This Safe?
Granting Docker socket access to containers is a powerful permission that should be carefully considered:

**Risks:**
- Containers with Docker socket access can control other containers
- A compromised agent could potentially escape the container or affect other containers

**Mitigations in This Setup:**
1. **Trusted Code Only**: All agents run trusted Claude Code sandbox templates
2. **Controlled Scripts**: Docker access is only used via specific scripts (`send_agent_message.sh`)
3. **Local Development**: This setup is for local development/orchestration, not production
4. **Network Isolation**: All agents run in the same Docker network (`claude-network`)
5. **No External Exposure**: Agents don't expose ports or accept external connections

### Alternative Approaches (Future Consideration)
If security is a concern, consider:
1. **Docker API Proxy**: Use a proxy like `tecnativa/docker-socket-proxy` to limit allowed Docker commands
2. **Named Pipes**: Use Unix named pipes for IPC instead of Docker commands
3. **Message Queue**: Use Redis pub/sub for agent communication (already available)
4. **Kubernetes**: Use proper pod-to-pod communication in a K8s environment

## Testing

### Automated Test Script
The `test-docker-access.sh` script verifies:
1. Container is running
2. Agent user has root group membership
3. Docker socket is accessible
4. `docker ps` command works

Run it after applying changes:
```bash
bash test-docker-access.sh
```

### Manual Testing
Test agent communication:
```bash
# Send a message from orchestrator to anga
docker exec codehornets-orchestrator sh -c "/tools/send_agent_message.sh anga 'Test message' logs"

# Send a message from automation container to marie
docker exec codehornets-svc-automation sh -c "/tools/send_agent_message.sh marie 'Test message' logs"
```

## Files Modified
- `docker-compose.yml`: Updated marie, anga, and fabien service configurations

## Files Added
- `test-docker-access.sh`: Automated test script for Docker socket access
- `DOCKER_SOCKET_FIX.md`: This documentation file

## Related Files
- `tools/send_agent_message.sh`: Agent messaging script that requires Docker access
- `tools/entrypoint.sh`: Worker agent entrypoint
- `tools/orchestrator_entrypoint.sh`: Orchestrator entrypoint

## Next Steps
After applying this fix:
1. Verify all agents can execute Docker commands
2. Test agent-to-agent communication via `send_agent_message.sh`
3. Monitor agent logs for any permission errors
4. Consider implementing more secure IPC methods for production use

## References
- Docker socket permissions: https://docs.docker.com/engine/security/
- Docker-in-Docker patterns: https://jpetazzo.github.io/2015/09/03/do-not-use-docker-in-docker-for-ci/
- Claude Code documentation: https://docs.anthropic.com/claude/docs/claude-code
