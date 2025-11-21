# 🚀 Quick Start Guide

Get started with Docker Agent Bridge in 5 minutes.

## Prerequisites

- Node.js 14+ installed
- Docker installed and running
- At least one Docker container running

## Installation

```bash
npm install docker-agent-bridge
```

## Basic Example (30 seconds)

Create a file `test.js`:

```javascript
const AgentBridge = require('docker-agent-bridge');

async function main() {
  const bridge = new AgentBridge({ debug: true });

  // Send a message
  await bridge.send(
    'your-container-name',
    'Hello from Docker Agent Bridge!'
  );

  console.log('✅ Message sent!');
}

main();
```

Run it:

```bash
node test.js
```

## Integration with CodeHornets

If you're using the CodeHornets multi-agent system:

```javascript
const AgentBridge = require('docker-agent-bridge');

async function orchestrate() {
  const bridge = new AgentBridge({
    strategy: 'auto',
    debug: true
  });

  // Assign tasks to workers
  await bridge.send('codehornets-worker-marie', {
    type: 'task',
    action: 'evaluate_students',
    details: 'Review Spring Recital performances'
  });

  await bridge.send('codehornets-worker-anga', {
    type: 'task',
    action: 'code_review',
    details: 'Review authentication system PR'
  });

  await bridge.send('codehornets-worker-fabien', {
    type: 'task',
    action: 'create_campaign',
    details: 'Q1 marketing campaign'
  });

  console.log('✅ Tasks assigned to all workers');
}

orchestrate();
```

## Testing in Your Environment

1. **List your containers:**
   ```bash
   docker ps --format "{{.Names}}"
   ```

2. **Pick a container name** and update the example

3. **Run the example:**
   ```bash
   node test.js
   ```

4. **Check the container** to see if the message appeared:
   ```bash
   docker logs your-container-name
   ```

## Common Patterns

### Pattern 1: Task Assignment

```javascript
const bridge = new AgentBridge();

await bridge.send('worker-container', {
  taskId: 123,
  action: 'process',
  data: { ... }
});
```

### Pattern 2: Broadcast Announcements

```javascript
const workers = ['worker-1', 'worker-2', 'worker-3'];

await bridge.broadcast(workers, {
  type: 'announcement',
  message: 'System maintenance in 5 minutes'
});
```

### Pattern 3: Request-Response

```javascript
// Send request
await bridge.send('worker', { type: 'request', action: 'status' });

// Listen for response
bridge.on('message', (msg) => {
  if (msg.type === 'response') {
    console.log('Status:', msg.data);
  }
});

await bridge.listen('orchestrator');
```

## Next Steps

- Read the [full README](../README.md)
- Check out [examples](../examples)
- Learn about [strategies](./STRATEGIES.md)
- Review [API documentation](./API.md)

## Troubleshooting

**Message not appearing?**
- Enable debug mode: `new AgentBridge({ debug: true })`
- Check container is running: `docker ps`
- Try specific strategy: `new AgentBridge({ strategy: 'exec' })`

**Connection errors?**
- Verify Docker is running: `docker ps`
- Check socket path: `/var/run/docker.sock`
- Ensure permissions on Docker socket

**Still stuck?**
- Open an issue on GitHub
- Check existing issues
- Review example code
