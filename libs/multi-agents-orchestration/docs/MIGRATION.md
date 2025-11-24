# Migration Guide

This guide covers migrating from the file-based communication approach to the new tmux/PTY wrapper communication solutions.

## Table of Contents

- [Overview](#overview)
- [Current File-Based Approach](#current-file-based-approach)
- [Migration Path](#migration-path)
- [Step-by-Step Migration](#step-by-step-migration)
- [Backward Compatibility](#backward-compatibility)
- [Rollback Procedure](#rollback-procedure)
- [Testing Migration](#testing-migration)

## Overview

### Why Migrate?

The file-based approach has served well but has limitations:

| Aspect | File-Based | New Approaches |
|--------|------------|----------------|
| Latency | 50-200ms | 5-25ms |
| Throughput | ~20 msg/sec | ~100+ msg/sec |
| Real-time | Polling-based | Event-driven |
| Complexity | Simple | Medium |
| Reliability | File locks needed | Direct communication |

### Migration Goals

1. Reduce message latency by 80%+
2. Enable real-time bidirectional communication
3. Maintain backward compatibility during transition
4. Zero downtime migration

## Current File-Based Approach

### How It Works

```
┌──────────────┐                              ┌──────────────┐
│              │   1. Write JSON file         │              │
│ Orchestrator ├─────────────────────────────▶│   /shared/   │
│              │                              │   messages/  │
└──────────────┘                              └──────┬───────┘
                                                     │
                                              2. Poll for files
                                                     │
                                              ┌──────▼───────┐
                                              │              │
                                              │    Worker    │
                                              │              │
                                              └──────────────┘
```

### Current Message Flow

```javascript
// Current: Orchestrator sends message
function sendMessage(target, message) {
  const messageFile = `/shared/messages/${target}/${generateId()}.json`;
  fs.writeFileSync(messageFile, JSON.stringify(message));
}

// Current: Worker polls for messages
setInterval(() => {
  const files = fs.readdirSync(`/shared/messages/${agentName}`);
  for (const file of files) {
    const message = JSON.parse(fs.readFileSync(file));
    handleMessage(message);
    fs.unlinkSync(file);
  }
}, 500);
```

### Current Directory Structure

```
shared/
├── messages/
│   ├── orchestrator/
│   │   └── msg_123.json
│   ├── worker-marie/
│   │   └── msg_456.json
│   ├── worker-anga/
│   └── worker-fabien/
├── tasks/
│   ├── marie/
│   ├── anga/
│   └── fabien/
└── results/
    ├── marie/
    ├── anga/
    └── fabien/
```

## Migration Path

### Phase 1: Add New Communication Layer (Week 1)

- Install new communication dependencies
- Add tmux/PTY wrapper support
- Keep file-based as fallback

### Phase 2: Parallel Operation (Week 2)

- Run both systems simultaneously
- Migrate orchestrator to use new API
- Monitor for issues

### Phase 3: Worker Migration (Week 3)

- Update workers to use new communication
- Maintain file-based for edge cases
- Performance validation

### Phase 4: Deprecate File-Based (Week 4+)

- Remove file polling code
- Clean up shared directories
- Document new system

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
# Add to package.json
npm install node-pty eventemitter3

# For tmux approach, ensure tmux is in container
# Add to Dockerfile:
# RUN apt-get update && apt-get install -y tmux
```

### Step 2: Create Unified Communication API

Create `lib/agent-comm.js`:

```javascript
const EventEmitter = require('events');

class AgentComm extends EventEmitter {
  constructor(options = {}) {
    super();
    this.strategy = options.strategy || 'auto';
    this.fallbackToFiles = options.fallbackToFiles !== false;

    // Initialize strategies
    this.strategies = {
      tmux: null,
      'pty-wrapper': null,
      'shared-volume': new SharedVolumeStrategy(options)
    };
  }

  async initialize() {
    // Try to initialize preferred strategies
    if (this.strategy === 'auto' || this.strategy === 'pty-wrapper') {
      try {
        this.strategies['pty-wrapper'] = new PtyWrapperStrategy();
        await this.strategies['pty-wrapper'].initialize();
      } catch (e) {
        console.log('PTY wrapper not available, trying tmux...');
      }
    }

    if (this.strategy === 'auto' || this.strategy === 'tmux') {
      try {
        this.strategies.tmux = new TmuxStrategy();
        await this.strategies.tmux.initialize();
      } catch (e) {
        console.log('tmux not available, using shared volume...');
      }
    }

    // Shared volume is always available as fallback
    await this.strategies['shared-volume'].initialize();
  }

  async send(target, message) {
    // Try strategies in order
    const order = ['pty-wrapper', 'tmux', 'shared-volume'];

    for (const strategyName of order) {
      const strategy = this.strategies[strategyName];
      if (strategy?.isAvailable()) {
        try {
          return await strategy.send(target, message);
        } catch (error) {
          console.warn(`${strategyName} failed:`, error.message);
        }
      }
    }

    throw new Error('All communication strategies failed');
  }
}

module.exports = AgentComm;
```

### Step 3: Update Orchestrator

Replace direct file operations with new API:

```javascript
// Before (file-based)
const fs = require('fs');

class Orchestrator {
  async delegateTask(worker, task) {
    const taskFile = `/shared/tasks/${worker}/${task.id}.json`;
    fs.writeFileSync(taskFile, JSON.stringify(task));
  }

  pollResults() {
    setInterval(() => {
      for (const worker of this.workers) {
        const files = fs.readdirSync(`/shared/results/${worker}`);
        // ...process files
      }
    }, 500);
  }
}

// After (new API)
const AgentComm = require('./lib/agent-comm');

class Orchestrator {
  constructor() {
    this.comm = new AgentComm({ strategy: 'auto' });
  }

  async initialize() {
    await this.comm.initialize();

    // Listen for messages instead of polling
    this.comm.on('message', (message) => {
      this.handleMessage(message);
    });
  }

  async delegateTask(worker, task) {
    // New direct communication
    await this.comm.send(worker, {
      type: 'task',
      ...task
    });
  }

  handleMessage(message) {
    if (message.type === 'result') {
      this.processResult(message);
    }
  }
}
```

### Step 4: Update Workers

```javascript
// Before (file-based)
class Worker {
  constructor(name) {
    this.name = name;
    this.pollForTasks();
  }

  pollForTasks() {
    setInterval(() => {
      const files = fs.readdirSync(`/shared/tasks/${this.name}`);
      for (const file of files) {
        const task = JSON.parse(fs.readFileSync(file));
        this.processTask(task);
        fs.unlinkSync(file);
      }
    }, 500);
  }

  reportResult(result) {
    const resultFile = `/shared/results/${this.name}/${result.id}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(result));
  }
}

// After (new API)
class Worker {
  constructor(name) {
    this.name = name;
    this.comm = new AgentComm({
      agentName: name,
      strategy: 'auto'
    });
  }

  async initialize() {
    await this.comm.initialize();

    this.comm.on('message', (message) => {
      if (message.type === 'task') {
        this.processTask(message);
      }
    });
  }

  async reportResult(result) {
    await this.comm.send('orchestrator', {
      type: 'result',
      ...result
    });
  }
}
```

### Step 5: Update Docker Configuration

Add tmux to containers:

```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y tmux && rm -rf /var/lib/apt/lists/*
```

Update docker-compose.yml:

```yaml
version: '3.8'

services:
  orchestrator:
    # ... existing config ...
    environment:
      - COMM_STRATEGY=auto
    volumes:
      - agent-sockets:/var/run/agents
      - ./shared:/shared  # Keep for backward compatibility

  worker-anga:
    # ... existing config ...
    environment:
      - COMM_STRATEGY=auto
      - AGENT_NAME=anga
    volumes:
      - agent-sockets:/var/run/agents
      - ./shared:/shared

volumes:
  agent-sockets:
```

### Step 6: Add Migration Feature Flags

```javascript
// config.js
module.exports = {
  communication: {
    // Enable new communication system
    useNewComm: process.env.USE_NEW_COMM === 'true',

    // Strategy preference
    strategy: process.env.COMM_STRATEGY || 'auto',

    // Keep file-based as fallback
    fileFallback: process.env.FILE_FALLBACK !== 'false',

    // Parallel mode: send via both systems
    parallelMode: process.env.PARALLEL_MODE === 'true'
  }
};
```

## Backward Compatibility

### Dual-Mode Operation

During migration, support both systems:

```javascript
class DualModeComm {
  constructor(options) {
    this.newComm = new AgentComm(options);
    this.fileComm = new SharedVolumeStrategy(options);
    this.parallelMode = options.parallelMode || false;
  }

  async send(target, message) {
    if (this.parallelMode) {
      // Send via both systems
      await Promise.all([
        this.newComm.send(target, message).catch(e => console.warn('New comm failed:', e)),
        this.fileComm.send(target, message).catch(e => console.warn('File comm failed:', e))
      ]);
    } else {
      // Try new, fallback to file
      try {
        await this.newComm.send(target, message);
      } catch (error) {
        console.warn('Falling back to file-based:', error.message);
        await this.fileComm.send(target, message);
      }
    }
  }
}
```

### Message Format Compatibility

Keep message format consistent:

```javascript
// Compatible message format (works with both systems)
const message = {
  id: 'msg_123',           // Required
  type: 'task',            // Required
  from: 'orchestrator',    // Required
  to: 'worker-anga',       // Required
  timestamp: Date.now(),   // Required
  payload: { ... }         // Application data
};
```

### Graceful Degradation

```javascript
class RobustComm {
  async send(target, message) {
    const strategies = [
      () => this.ptyWrapper?.send(target, message),
      () => this.tmux?.send(target, message),
      () => this.fileComm.send(target, message)
    ];

    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error) {
        console.warn('Strategy failed, trying next:', error.message);
      }
    }

    throw new Error('All communication strategies failed');
  }
}
```

## Rollback Procedure

### Quick Rollback

If issues arise, rollback immediately:

```bash
# Set environment variable to force file-based
export COMM_STRATEGY=shared-volume

# Or disable new communication entirely
export USE_NEW_COMM=false

# Restart containers
docker-compose down && docker-compose up -d
```

### Full Rollback

1. Revert code changes:
```bash
git revert HEAD~3  # Revert migration commits
```

2. Remove new dependencies:
```bash
npm uninstall node-pty
```

3. Restart services:
```bash
docker-compose down
docker-compose up -d --build
```

### Rollback Checklist

- [ ] Set `COMM_STRATEGY=shared-volume`
- [ ] Verify file polling is active
- [ ] Check message directories have correct permissions
- [ ] Monitor for message backlog
- [ ] Verify all agents receiving messages

## Testing Migration

### Pre-Migration Tests

```bash
# Run existing tests to establish baseline
npm test

# Measure current performance
node tests/benchmark.js --strategy shared-volume --output baseline.json
```

### Migration Tests

```javascript
// tests/migration.test.js
describe('Migration Tests', () => {
  it('should fall back to files when new comm fails', async () => {
    const comm = new DualModeComm({
      strategy: 'pty-wrapper',
      fileFallback: true
    });

    // Simulate PTY failure
    comm.newComm.strategies['pty-wrapper'].simulateFailure = true;

    // Should succeed via file fallback
    const result = await comm.send('anga', { type: 'test' });
    expect(result.success).toBe(true);
  });

  it('should maintain message format compatibility', async () => {
    const oldMessage = createFileBasedMessage('test');
    const newMessage = createNewCommMessage('test');

    // Both should have same required fields
    expect(oldMessage.id).toBeDefined();
    expect(newMessage.id).toBeDefined();
    expect(oldMessage.type).toEqual(newMessage.type);
  });

  it('should handle parallel mode correctly', async () => {
    const comm = new DualModeComm({ parallelMode: true });

    await comm.send('anga', { type: 'test' });

    // Verify both systems received message
    expect(newCommSpy.called).toBe(true);
    expect(fileCommSpy.called).toBe(true);
  });
});
```

### Post-Migration Verification

```bash
# Run full test suite
npm test

# Compare performance
node tests/benchmark.js --strategy auto --output post-migration.json

# Compare results
node scripts/compare-benchmarks.js baseline.json post-migration.json
```

### Performance Validation

```javascript
// Verify latency improvement
const baseline = require('./baseline.json');
const postMigration = require('./post-migration.json');

const improvement = ((baseline.avgMs - postMigration.avgMs) / baseline.avgMs) * 100;
console.log(`Latency improvement: ${improvement.toFixed(1)}%`);

// Should see >50% improvement
assert(improvement > 50, 'Expected significant latency improvement');
```

## Migration Checklist

### Preparation
- [ ] Review current message flow
- [ ] Document all integrations
- [ ] Set up monitoring for both systems
- [ ] Create rollback plan

### Phase 1: Infrastructure
- [ ] Install dependencies
- [ ] Add tmux to containers
- [ ] Create socket volumes
- [ ] Test individual strategies

### Phase 2: Code Migration
- [ ] Create unified API
- [ ] Update orchestrator
- [ ] Update workers
- [ ] Add feature flags

### Phase 3: Testing
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Performance benchmarks
- [ ] Chaos testing (kill connections)

### Phase 4: Deployment
- [ ] Deploy to staging
- [ ] Monitor metrics
- [ ] Gradual rollout to production
- [ ] Monitor for issues

### Phase 5: Cleanup
- [ ] Remove parallel mode
- [ ] Remove file fallback
- [ ] Clean up old directories
- [ ] Update documentation

## Related Documentation

- [Communication Architecture](./COMMUNICATION.md)
- [tmux Guide](./TMUX-GUIDE.md)
- [PTY Wrapper Guide](./PTY-WRAPPER-GUIDE.md)
- [Testing Guide](./TESTING_GUIDE.md)
