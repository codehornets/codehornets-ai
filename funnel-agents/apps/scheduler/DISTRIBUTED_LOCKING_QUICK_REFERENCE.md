# Distributed Locking Quick Reference

## Overview
Redis-based distributed locking prevents duplicate task execution across multiple scheduler instances using the Redlock algorithm.

## Quick Start

### 1. Environment Setup
```bash
# .env
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

### 2. Basic Usage

```typescript
import { DistributedLockService } from '@funnelagents/infrastructure';

// Inject service
constructor(private readonly lockService: DistributedLockService) {}

// Acquire lock
const result = await lockService.acquire('my-lock', {
  ttl: 30000,        // 30 seconds
  retryCount: 3,     // Retry 3 times
  retryDelay: 200,   // 200ms between retries
});

if (result.acquired) {
  try {
    // Do protected work
  } finally {
    await lockService.release('my-lock', result.lockId);
  }
}

// Or use helper
const data = await lockService.executeWithLock(
  'my-lock',
  async () => {
    // Do work
    return result;
  }
);
```

## Lock Keys in Scheduler

| Component | Lock Key Format | Purpose |
|-----------|----------------|---------|
| System Cron | `scheduler:check-due-tasks` | Prevent overlapping checks |
| Cleanup | `scheduler:cleanup-executions` | Single instance cleanup |
| Task Execution | `scheduler:task:{taskId}` | Prevent duplicate execution |
| Workflow | `workflow:dispatch:{id}:{taskId}` | Prevent duplicate workflows |
| Report | `report:dispatch:{id}:{taskId}` | Prevent duplicate reports |
| Agent | `agent:dispatch:{id}:{taskId}` | Prevent duplicate agents |
| Custom | `custom:dispatch:{taskId}` | Prevent duplicate custom tasks |

## Configuration Options

```typescript
interface LockOptions {
  ttl?: number;           // Lock duration (ms), default: 30000
  retryCount?: number;    // Retry attempts, default: 3
  retryDelay?: number;    // Retry delay (ms), default: 200
  extendThreshold?: number; // Auto-extend threshold (ms)
}
```

## Common Patterns

### Pattern 1: Skip if Locked (System Cron Jobs)
```typescript
const result = await lockService.acquire('scheduler:check-due-tasks', {
  ttl: 50000,
  retryCount: 0,  // Don't retry, just skip
});

if (!result.acquired) {
  logger.debug('Skipping - another instance is running');
  return;
}

try {
  // Do work
} finally {
  await lockService.release('scheduler:check-due-tasks', result.lockId);
}
```

### Pattern 2: Task Execution Lock
```typescript
const lockKey = `scheduler:task:${taskId}`;
const lockTtl = Math.max(taskTimeout * 1000 + 10000, 60000);

const result = await lockService.acquire(lockKey, {
  ttl: lockTtl,
  retryCount: 0,
  extendThreshold: lockTtl / 3, // Auto-extend
});

if (!result.acquired) {
  logger.debug('Task already executing elsewhere');
  return;
}

// Execute task...
```

### Pattern 3: Dispatcher Lock with Retry
```typescript
const lockKey = `workflow:dispatch:${workflowId}:${taskId}`;

const result = await lockService.acquire(lockKey, {
  ttl: timeout * 1000 + 5000,
  retryCount: 1,      // Retry once
  retryDelay: 500,    // Wait 500ms
});

if (!result.acquired) {
  throw new Error('Workflow dispatch already in progress');
}

// Dispatch workflow...
```

## Monitoring

### Check Lock Metrics
```typescript
const metrics = lockService.getMetrics();

console.log({
  totalAttempts: metrics.totalAcquisitions,
  successRate: metrics.successfulAcquisitions / metrics.totalAcquisitions,
  contentionRate: metrics.contentions / metrics.totalAcquisitions,
  activeLocks: metrics.activeLocksCount,
});
```

### Health Check
```typescript
const healthy = await lockService.healthCheck();
if (!healthy) {
  logger.error('Redis connection issue - locking unavailable');
}
```

## Troubleshooting

### Lock Never Released
**Symptom**: Task doesn't execute for long periods
**Solution**: Locks auto-expire via TTL, check:
```bash
# Check lock TTL in Redis
redis-cli PTTL "funnel-agents:lock:scheduler:task:123"
```

### High Contention
**Symptom**: Many "already executing" messages
**Solution**:
- Check if multiple instances running same tasks
- Verify cron schedules not overlapping
- Check metrics: `lockService.getMetrics()`

### Redis Unavailable
**Symptom**: All lock acquisitions fail
**Solution**:
- Check Redis connection: `redis-cli PING`
- Verify environment variables
- Check network/firewall
- System falls back to single-instance mode

### Task Stuck
**Symptom**: Task shows as running but isn't
**Solution**: Lock will auto-expire, or manually delete:
```bash
redis-cli DEL "funnel-agents:lock:scheduler:task:123"
```

## Testing

### Unit Test Example
```typescript
it('should skip task if locked', async () => {
  mockLockService.acquire.mockResolvedValue({
    acquired: false,
    lockId: null,
  });

  await service.executeTask(mockTask);

  expect(dispatcher.dispatch).not.toHaveBeenCalled();
});
```

### Integration Test
```bash
# Start two instances
npm run serve scheduler &
npm run serve scheduler &

# Trigger same task - only one executes
curl -X POST http://localhost:3010/scheduler/tasks/123/trigger
```

## Best Practices

1. **Always use finally**: Ensure locks are released
2. **Set appropriate TTL**: At least 2x expected duration
3. **Don't retry system jobs**: Skip execution if locked
4. **Use auto-extension**: For tasks > 30 seconds
5. **Monitor metrics**: Watch contention rate
6. **Log lock failures**: Debug concurrent execution

## Lock TTL Guidelines

| Task Duration | Recommended TTL | Notes |
|--------------|----------------|-------|
| < 10s | 60s | Use minimum 60s |
| 10-60s | duration + 10s | Add buffer |
| 60-300s | duration + 30s | Add larger buffer |
| > 300s | Use auto-extend | Set extendThreshold |

## Redis Commands

```bash
# View all locks
redis-cli KEYS "funnel-agents:lock:*"

# Check specific lock
redis-cli GET "funnel-agents:lock:scheduler:task:123"

# Check TTL (milliseconds)
redis-cli PTTL "funnel-agents:lock:scheduler:task:123"

# Delete lock (emergency)
redis-cli DEL "funnel-agents:lock:scheduler:task:123"

# Delete all locks (DANGER)
redis-cli DEL $(redis-cli KEYS "funnel-agents:lock:*")
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Redis not available` | Connection issue | Check REDIS_URL |
| `Lock acquisition timeout` | High contention | Increase TTL or reduce concurrency |
| `Failed to release lock` | Lock expired | Increase TTL |
| `Lock not owned` | Trying to release expired lock | Normal, ignore |

## Environment Variables

```bash
# Required (one of):
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional
REDIS_PASSWORD=secret
```

## Files Reference

```
libs/infrastructure/src/lib/locks/
├── distributed-lock.service.ts      # Main service
├── distributed-lock.module.ts       # NestJS module
└── decorators/
    └── with-lock.decorator.ts      # @WithLock decorator

apps/scheduler/src/
├── cron-jobs/cron-jobs.service.ts   # System jobs with locks
└── dispatchers/
    ├── workflow-dispatcher.service.ts  # Workflow locks
    ├── report-dispatcher.service.ts    # Report locks
    ├── agent-dispatcher.service.ts     # Agent locks
    └── custom-dispatcher.service.ts    # Custom locks
```

## Quick Checklist

- [ ] Redis running and accessible
- [ ] REDIS_URL or REDIS_HOST configured
- [ ] DistributedLockModule imported in app.module
- [ ] Lock service injected in constructors
- [ ] Locks acquired before critical sections
- [ ] Locks released in finally blocks
- [ ] TTL set appropriately for task duration
- [ ] Metrics monitored for contention
- [ ] Health checks implemented
- [ ] Tests cover lock scenarios

## Support

For issues or questions:
1. Check logs for lock-related messages
2. Verify Redis connection: `await lockService.healthCheck()`
3. Check metrics: `lockService.getMetrics()`
4. Review implementation report for detailed design

---

**Remember**: Distributed locks prevent duplicate execution but add ~2-5ms overhead per operation. Use judiciously.
