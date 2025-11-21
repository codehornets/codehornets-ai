# 🌉 Agent Bridge - Manual Testing Guide

This guide shows you how to manually test agent-to-agent communication.

## Quick Start

### Step 1: Start the containers

```bash
docker-compose up -d orchestrator marie anga fabien
```

### Step 2: Start the communication bridge in each container

Open 4 terminals and attach to each container:

**Terminal 1 - Orchestrator:**
```bash
docker exec -it codehornets-orchestrator bash
cd /home/agent/workspace
node /tools/start-bridge.js
```

**Terminal 2 - Marie:**
```bash
docker exec -it codehornets-worker-marie bash
cd /home/agent/workspace
node /tools/start-bridge.js
```

**Terminal 3 - Anga:**
```bash
docker exec -it codehornets-worker-anga bash
cd /home/agent/workspace
node /tools/start-bridge.js
```

**Terminal 4 - Fabien:**
```bash
docker exec -it codehornets-worker-fabien bash
cd /home/agent/workspace
node /tools/start-bridge.js
```

### Step 3: Send messages between agents

Once all bridges are running, you can send messages from any terminal.

**From Orchestrator to Anga:**
```bash
# In orchestrator terminal
node /tools/send-message.js anga "Hello Anga, can you review the authentication code?"
```

**From Anga to Orchestrator:**
```bash
# In anga terminal
node /tools/send-message.js orchestrator "Sure! I'll review the authentication code now."
```

**From Marie to Anga:**
```bash
# In marie terminal
node /tools/send-message.js anga "Hey Anga, can you help me debug the student portal?"
```

**From Anga to Marie:**
```bash
# In anga terminal
node /tools/send-message.js marie "Of course! What's the issue with the student portal?"
```

## Expected Output

### When sending a message:

```
📤 Sending message from anga to marie...

[docker-agent-bridge] Trying strategy: named-pipe
[docker-agent-bridge] ✅ Success with named-pipe strategy

✅ Message sent successfully!
Strategy used: named-pipe
Target: codehornets-worker-marie
```

### When receiving a message:

```
[anga] 📨 Message from marie:
═══════════════════════════════════════════════
📨 MESSAGE FROM: marie
TO: anga
════════════════════════════════════════════════
Hey Anga, can you help me debug the student portal?
════════════════════════════════════════════════
```

## Testing Scenarios

### Scenario 1: Orchestrator delegates a task

**In Orchestrator terminal:**
```bash
node /tools/send-message.js anga "Task: Review PR #123 for authentication system"
```

You should see the message appear in Anga's terminal.

### Scenario 2: Worker reports back to Orchestrator

**In Anga terminal:**
```bash
node /tools/send-message.js orchestrator "Task completed: PR #123 reviewed. Found 2 issues."
```

You should see the message appear in Orchestrator's terminal.

### Scenario 3: Workers communicate with each other

**In Marie terminal:**
```bash
node /tools/send-message.js fabien "Can you help create marketing materials for the recital?"
```

**In Fabien terminal (you'll see the message, then respond):**
```bash
node /tools/send-message.js marie "Absolutely! I'll create a campaign for the Spring Recital."
```

### Scenario 4: Broadcast from Orchestrator

You can use the orchestrator's broadcast feature by modifying the send-message script or using the Node.js REPL:

**In Orchestrator terminal:**
```bash
node
```

Then in the Node REPL:
```javascript
const OrchestratorCommunicator = require('/orchestrator/agent-communication');
const orch = new OrchestratorCommunicator({ debug: true });
await orch.initialize();
await orch.announceToWorkers('System maintenance in 10 minutes!');
```

## Troubleshooting

### Messages not appearing?

1. **Check bridges are running:**
   - Each terminal should show "✅ agent communication bridge is active!"

2. **Check container names:**
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```

3. **Enable debug mode:**
   - The bridges already run in debug mode, check the output

4. **Check shared volumes:**
   ```bash
   docker exec -it codehornets-worker-anga ls -la /shared/pipes
   docker exec -it codehornets-worker-anga ls -la /shared/messages
   ```

### Container not found?

Make sure containers are running:
```bash
docker-compose ps
```

If stopped, start them:
```bash
docker-compose up -d
```

### Permission errors?

Make sure the shared directories exist:
```bash
mkdir -p shared/{pipes,messages}
chmod 777 shared/{pipes,messages}
```

## Advanced Usage

### Sending JSON messages

```bash
node /tools/send-message.js anga '{"type":"task","action":"review","pr":123}'
```

### Using different strategies

Edit `/tools/send-message.js` and change the strategy:

```javascript
const bridge = new AgentBridge({
  strategy: 'tty',  // or 'named-pipe', 'shared-volume', 'signal', 'exec'
  debug: true
});
```

## Integration with Claude Code

You can also use this from within Claude Code sessions running in the containers:

1. Attach to a container with Claude Code running
2. In the Claude Code session, you can execute:
   ```
   Can you send a message to anga saying "Hello from orchestrator"?
   ```

3. Claude will use the send-message tool to communicate

## Communication Patterns

### Request-Response

**Orchestrator sends request:**
```javascript
// In Node REPL in orchestrator
const result = await orch.request('anga', 'get_status', {});
console.log('Anga status:', result);
```

### Task Assignment

**Orchestrator assigns task:**
```javascript
const task = await orch.delegateTask('Review authentication code', {
  priority: 'high'
});
```

The worker will automatically process and respond.

## Files and Structure

```
multi-agents-orchestration/
├── tools/
│   ├── send-message.js          # Send messages between agents
│   └── start-bridge.js          # Start communication bridge
├── orchestrator/
│   └── agent-communication.js   # Orchestrator communicator
├── workers/
│   ├── marie-communication.js   # Marie's communicator
│   ├── anga-communication.js    # Anga's communicator
│   └── fabien-communication.js  # Fabien's communicator
├── utils/
│   └── agent-bridge.js          # Base communicator class
└── docker-agent-bridge/         # The npm package
```

## Next Steps

1. Test basic message sending between all agents
2. Try task delegation from orchestrator to workers
3. Test worker-to-worker communication
4. Implement your own message handlers
5. Build automated workflows

---

**Happy Testing! 🎉**
