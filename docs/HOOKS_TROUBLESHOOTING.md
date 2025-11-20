# Hooks-Based Communication - Troubleshooting Runbook

Comprehensive troubleshooting guide for hooks-based agent communication system.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Diagnostic Commands](#diagnostic-commands)
3. [Error Messages](#error-messages)
4. [Performance Issues](#performance-issues)
5. [Recovery Procedures](#recovery-procedures)

---

## Common Issues

### Issue 1: Hook Watcher Not Starting

**Symptoms:**
- No watcher log file created
- Triggers not being processed
- Heartbeat file missing

**Diagnosis:**
```bash
# Check if watcher process is running
docker exec marie ps aux | grep hook_watcher

# Check container logs
docker logs marie --tail 50

# Check for Python errors
docker exec marie python3 /tools/hook_watcher.py marie --help
```

**Solutions:**

1. **Missing dependencies:**
```bash
# Install manually
docker exec marie pip install watchdog redis

# Or rebuild with HOOKS_MODE=1
make stop-hooks
make start-hooks
```

2. **Permission issues:**
```bash
# Fix directory permissions
sudo chown -R $(whoami):$(whoami) infrastructure/docker/codehornets-ai/shared/

# Recreate directories
rm -rf infrastructure/docker/codehornets-ai/shared/{triggers,pipes,watcher-logs}
mkdir -p infrastructure/docker/codehornets-ai/shared/{triggers,pipes,watcher-logs}
```

3. **Invalid hook configuration:**
```bash
# Validate JSON syntax
jq . infrastructure/docker/codehornets-ai/hooks-config/marie-hooks.json

# Check if file is mounted
docker exec marie cat /home/agent/.claude/hooks/hooks.json
```

---

### Issue 2: Triggers Not Being Processed

**Symptoms:**
- Trigger files remain in directory
- No log entries in watcher log
- Tasks not executing

**Diagnosis:**
```bash
# Check trigger directory
ls -la infrastructure/docker/codehornets-ai/shared/triggers/marie/

# Check watcher log
tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log

# Monitor inotify events
docker exec marie sh -c "inotifywait -m /shared/triggers/marie/"
```

**Solutions:**

1. **Watchdog not installed:**
```bash
# Check if watchdog is available
docker exec marie python3 -c "import watchdog; print('OK')"

# Install if missing
docker exec marie pip install watchdog
make restart-hooks
```

2. **Directory not being watched:**
```bash
# Verify trigger directory exists and is writable
docker exec marie ls -la /shared/triggers/marie/

# Check watcher startup logs
docker logs marie | grep "inotify listener active"
```

3. **Trigger file format issues:**
```bash
# Test with valid JSON
echo '{"test": true}' > infrastructure/docker/codehornets-ai/shared/triggers/marie/test.trigger

# Wait and check if processed
sleep 3
ls infrastructure/docker/codehornets-ai/shared/triggers/marie/test.trigger
# Should be deleted if processed
```

4. **Too many inotify watches:**
```bash
# Check current limit
cat /proc/sys/fs/inotify/max_user_watches

# Increase limit (Linux host)
echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches

# Make permanent
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Issue 3: Named Pipes Not Working

**Symptoms:**
- Pipe files missing
- Cannot write to control pipe
- Status pipe not readable

**Diagnosis:**
```bash
# Check if pipes exist
ls -la infrastructure/docker/codehornets-ai/shared/pipes/

# Check pipe type
file infrastructure/docker/codehornets-ai/shared/pipes/marie-control

# Test pipe (should block until read)
timeout 1 echo '{"test": true}' > infrastructure/docker/codehornets-ai/shared/pipes/marie-control
```

**Solutions:**

1. **Pipes not created:**
```bash
# Create manually
docker exec marie mkfifo /shared/pipes/marie-control
docker exec marie mkfifo /shared/pipes/marie-status

# Or restart container
make restart-hooks
```

2. **Permission issues:**
```bash
# Fix permissions
docker exec marie chmod 666 /shared/pipes/marie-control
docker exec marie chmod 666 /shared/pipes/marie-status
```

3. **No reader on pipe (blocks writer):**
```bash
# Check if watcher is listening
docker exec marie ps aux | grep hook_watcher

# Test non-blocking write
docker exec marie sh -c "echo '{\"command\": \"status\"}' > /shared/pipes/marie-control || true"
```

---

### Issue 4: High CPU Usage

**Symptoms:**
- Worker container using >10% CPU when idle
- Watcher process consuming excessive resources

**Diagnosis:**
```bash
# Check CPU usage
docker stats marie --no-stream

# Check process CPU
docker exec marie top -b -n 1

# Check if polling fallback is active
docker logs marie | grep "Polling mode"
```

**Solutions:**

1. **Watchdog not available (polling fallback):**
```bash
# Install watchdog for inotify
docker exec marie pip install watchdog
make restart-hooks

# Verify inotify is being used
docker logs marie | grep "inotify listener active"
```

2. **Too many trigger files:**
```bash
# Clean up old triggers
make clean-triggers

# Or manually
find infrastructure/docker/codehornets-ai/shared/triggers/ -name '*.trigger' -delete
```

3. **Infinite loop in watcher:**
```bash
# Check watcher logs for errors
tail -f infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log

# Restart watcher
docker exec marie pkill -f hook_watcher
docker restart marie
```

---

### Issue 5: Redis Connection Failures

**Symptoms:**
- "Redis connection failed" in logs
- Watcher falls back to file-only mode
- No pub/sub messages

**Diagnosis:**
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec marie redis-cli -u redis://redis:6379 ping

# Check Redis logs
docker logs codehornets-redis
```

**Solutions:**

1. **Redis not started:**
```bash
# Start Redis profile
docker-compose --profile hooks up -d redis

# Verify Redis health
docker exec codehornets-redis redis-cli ping
```

2. **Wrong Redis URL:**
```bash
# Check environment variable
docker exec marie env | grep REDIS_URL

# Should be: redis://redis:6379 (Docker Compose) or redis://redis-service:6379 (Kubernetes)
```

3. **Redis authentication required:**
```bash
# Set password in environment
export REDIS_PASSWORD=your_password

# Update connection string
export REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# Restart
make restart-hooks
```

---

### Issue 6: Heartbeat Files Not Updating

**Symptoms:**
- Health checks failing
- Heartbeat timestamp not changing
- Old heartbeat data

**Diagnosis:**
```bash
# Check heartbeat file
cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie-watcher.json

# Watch for updates
watch -n 2 cat infrastructure/docker/codehornets-ai/shared/heartbeats/marie-watcher.json

# Check heartbeat interval
docker exec marie env | grep HEARTBEAT_INTERVAL
```

**Solutions:**

1. **Watcher thread crashed:**
```bash
# Check for thread errors in logs
docker logs marie | grep -i "heartbeat"

# Restart container
docker restart marie
```

2. **Directory not writable:**
```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) infrastructure/docker/codehornets-ai/shared/heartbeats/
chmod 755 infrastructure/docker/codehornets-ai/shared/heartbeats/
```

3. **Disk full:**
```bash
# Check disk space
df -h infrastructure/docker/codehornets-ai/shared/

# Clean up old files
make clean-triggers
make clean-results
```

---

### Issue 7: Kubernetes Pod Fails to Start

**Symptoms:**
- Pod stuck in Pending or CrashLoopBackOff
- Init containers failing
- Volume mount errors

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n codehornets-ai

# Describe pod for events
kubectl describe pod marie-xxx -n codehornets-ai

# Check logs
kubectl logs marie-xxx -n codehornets-ai

# Check init container logs
kubectl logs marie-xxx -n codehornets-ai -c init-directories
```

**Solutions:**

1. **PVC not bound:**
```bash
# Check PVC status
kubectl get pvc -n codehornets-ai

# Check storage class
kubectl get storageclass

# Manually provision PV if needed
kubectl apply -f infrastructure/kubernetes/hooks/pv.yaml
```

2. **ConfigMap missing:**
```bash
# Check if ConfigMaps exist
kubectl get configmaps -n codehornets-ai

# Recreate if missing
kubectl apply -f infrastructure/kubernetes/hooks/configmap-hooks.yaml
```

3. **Secret missing:**
```bash
# Check secrets
kubectl get secrets -n codehornets-ai

# Create from local auth
kubectl create secret generic claude-auth \
  --from-file=marie=infrastructure/docker/codehornets-ai/shared/auth-homes/marie/.credentials.json \
  -n codehornets-ai
```

4. **Init container permission issues:**
```bash
# Check security context
kubectl get pod marie-xxx -n codehornets-ai -o yaml | grep -A 5 securityContext

# If fsGroup mismatch, update deployment:
spec:
  securityContext:
    fsGroup: 1000
    runAsUser: 1000
```

---

## Diagnostic Commands

### Quick Health Check

```bash
# All-in-one status
make hooks-status

# Container health
docker ps -a
docker stats --no-stream marie anga fabien

# Watcher health
ls -l infrastructure/docker/codehornets-ai/shared/watcher-logs/
tail -5 infrastructure/docker/codehornets-ai/shared/watcher-logs/*.log

# Trigger processing
make check-triggers

# Pipe status
make check-pipes
```

### Detailed Inspection

```bash
# Inside container inspection
docker exec -it marie bash

# Check environment
env | grep -E "HOOKS|TRIGGER|PIPE|REDIS"

# Check file system
ls -la /shared/triggers/marie/
ls -la /shared/pipes/
ls -la /var/log/

# Check processes
ps aux | grep -E "hook_watcher|claude|python"

# Check network
ping redis
redis-cli -u $REDIS_URL ping
```

### Performance Analysis

```bash
# CPU and memory
docker stats --no-stream

# I/O operations
docker exec marie iostat -x 1 5

# Network traffic
docker exec marie netstat -an

# File watchers
docker exec marie cat /proc/sys/fs/inotify/max_user_watches
```

---

## Error Messages

### "watchdog not available"

**Meaning:** Python watchdog library not installed, falling back to polling mode.

**Fix:**
```bash
docker exec marie pip install watchdog
make restart-hooks
```

---

### "Redis connection failed"

**Meaning:** Cannot connect to Redis, disabling pub/sub features.

**Fix:**
```bash
# Start Redis
docker-compose --profile hooks up -d redis

# Verify connection
docker exec marie redis-cli -u redis://redis:6379 ping
```

---

### "Trigger file disappeared"

**Meaning:** Trigger file was deleted or moved between detection and processing.

**Fix:** This is usually normal (race condition) but if frequent:
```bash
# Check for filesystem issues
docker exec marie touch /shared/triggers/marie/test
docker exec marie rm /shared/triggers/marie/test

# Check for concurrent access
docker logs marie | grep "Trigger file disappeared"
```

---

### "Permission denied"

**Meaning:** Container cannot write to shared volume.

**Fix:**
```bash
# Fix host permissions
sudo chown -R $(whoami):$(whoami) infrastructure/docker/codehornets-ai/shared/

# Or use Docker user ID
docker exec marie id  # Get UID/GID
sudo chown -R 1000:1000 infrastructure/docker/codehornets-ai/shared/
```

---

### "Pipe write skipped: [Errno 11] Resource temporarily unavailable"

**Meaning:** No reader on named pipe (non-blocking write).

**Fix:** This is normal for status pipes. If persistent on control pipe:
```bash
# Check if watcher is reading control pipe
docker logs marie | grep "Listening on control pipe"

# Restart watcher
docker restart marie
```

---

## Performance Issues

### Slow Trigger Processing

**Symptoms:** >500ms latency for trigger processing

**Diagnosis:**
```bash
# Run benchmark
make test-hooks

# Check watcher log for delays
grep "Trigger detected\|Trigger processed" infrastructure/docker/codehornets-ai/shared/watcher-logs/marie-watcher.log
```

**Solutions:**
1. Ensure inotify mode (not polling)
2. Use memory-backed storage (tmpfs)
3. Reduce trigger file size
4. Clean up old trigger files

---

### Memory Leaks

**Symptoms:** Container memory usage growing over time

**Diagnosis:**
```bash
# Monitor memory
watch -n 5 docker stats marie --no-stream

# Check for orphaned triggers
find infrastructure/docker/codehornets-ai/shared/triggers/ -name '*.trigger' | wc -l

# Check watcher log size
ls -lh infrastructure/docker/codehornets-ai/shared/watcher-logs/
```

**Solutions:**
```bash
# Rotate watcher logs
docker exec marie logrotate /etc/logrotate.d/watcher

# Clean triggers
make clean-triggers

# Restart periodically (if persistent)
make restart-hooks
```

---

## Recovery Procedures

### Full System Reset

```bash
# 1. Stop all containers
make stop-hooks

# 2. Clean up volumes
docker-compose -f infrastructure/docker/codehornets-ai/docker-compose.hooks.yml down -v

# 3. Remove shared directories
rm -rf infrastructure/docker/codehornets-ai/shared/{triggers,pipes,watcher-logs,heartbeats}

# 4. Recreate directories
mkdir -p infrastructure/docker/codehornets-ai/shared/{triggers,pipes,watcher-logs,heartbeats}

# 5. Restart system
make start-hooks

# 6. Verify
make hooks-status
make test-hooks
```

---

### Emergency Shutdown

```bash
# Graceful shutdown (60s grace period)
docker-compose -f infrastructure/docker/codehornets-ai/docker-compose.hooks.yml down

# Force shutdown
docker-compose -f infrastructure/docker/codehornets-ai/docker-compose.hooks.yml down -t 0

# Kill individual container
docker kill marie
```

---

### Backup and Restore

```bash
# Backup critical data
tar czf backup-$(date +%Y%m%d).tar.gz \
  infrastructure/docker/codehornets-ai/shared/auth-homes/ \
  infrastructure/docker/codehornets-ai/shared/workspaces/ \
  infrastructure/docker/codehornets-ai/shared/results/

# Restore
tar xzf backup-20250119.tar.gz
make restart-hooks
```

---

## Getting Help

### Collect Diagnostic Info

```bash
# Save diagnostic bundle
mkdir -p diagnostics/$(date +%Y%m%d)

# Container info
docker ps -a > diagnostics/$(date +%Y%m%d)/containers.txt
docker stats --no-stream > diagnostics/$(date +%Y%m%d)/stats.txt

# Logs
docker logs marie > diagnostics/$(date +%Y%m%d)/marie.log
cp infrastructure/docker/codehornets-ai/shared/watcher-logs/* diagnostics/$(date +%Y%m%d)/

# Configuration
cp infrastructure/docker/codehornets-ai/docker-compose.hooks.yml diagnostics/$(date +%Y%m%d)/
cp infrastructure/docker/codehornets-ai/hooks-config/* diagnostics/$(date +%Y%m%d)/

# Tar it up
tar czf diagnostics-$(date +%Y%m%d).tar.gz diagnostics/$(date +%Y%m%d)/
```

### Report Issues

When reporting issues, include:
1. Mode used (polling/event-driven/hooks/hybrid)
2. Docker/Kubernetes version
3. OS and kernel version
4. Diagnostic bundle
5. Steps to reproduce
6. Expected vs actual behavior

---

## Preventive Maintenance

### Daily Checks

```bash
# Automated daily health check
crontab -e
0 9 * * * cd /path/to/codehornets-ai && make hooks-status | mail -s "Hooks Status" admin@example.com
```

### Weekly Cleanup

```bash
# Clean old triggers and logs
make clean-triggers

# Rotate logs
find infrastructure/docker/codehornets-ai/shared/watcher-logs/ -name '*.log' -mtime +7 -delete
```

### Monthly Tasks

```bash
# Update Claude Code image
docker pull docker/sandbox-templates:claude-code
make rebuild

# Review and optimize hook configurations
jq . infrastructure/docker/codehornets-ai/hooks-config/*.json
```

---

For additional support, consult:
- [Deployment Guide](./HOOKS_DEPLOYMENT_GUIDE.md)
- [Inter-Agent Communication Patterns](./INTER_AGENT_COMMUNICATION_PATTERNS.md)
- [GitHub Issues](https://github.com/codehornets/codehornets-ai/issues)
