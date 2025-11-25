# 🚀 Quick Test - Agent Communication

## Setup (One-time)

```bash
# 1. Make sure containers are running
docker-compose up -d orchestrator anga

# 2. Make sure shared directories exist
mkdir -p shared/{pipes,messages}
```

## Test Communication

### Terminal 1 - Start Anga's bridge
```bash
docker exec -it codehornets-worker-anga bash
node /tools/start-bridge.js
```

Wait for: `✅ anga communication bridge is active!`

### Terminal 2 - Start Orchestrator's bridge
```bash
docker exec -it codehornets-orchestrator bash
node /tools/start-bridge.js
```

Wait for: `✅ orchestrator communication bridge is active!`

### Terminal 3 - Send message from Orchestrator to Anga
```bash
docker exec -it codehornets-orchestrator bash
node /tools/send-message.js anga "Hello Anga, can you help with code review?"
```

**Expected:** Message appears in Terminal 1 (Anga's terminal)

### Terminal 4 - Send message from Anga to Orchestrator
```bash
docker exec -it codehornets-worker-anga bash
node /tools/send-message.js orchestrator "Sure! I'll help with the code review."
```

**Expected:** Message appears in Terminal 2 (Orchestrator's terminal)

## What You Should See

**When sending (Terminal 3 or 4):**
```
📤 Sending message from orchestrator to anga...
✅ Message sent successfully!
Strategy used: named-pipe
```

**When receiving (Terminal 1 or 2):**
```
[anga] 📨 Message from orchestrator:
════════════════════════════════════════
Hello Anga, can you help with code review?
════════════════════════════════════════
```

## Success! ✅

If both agents can send and receive messages, the integration works!

## Troubleshooting

**Bridge won't start?**
```bash
# Check if package is installed
docker exec -it codehornets-worker-anga ls -la /home/agent/workspace/node_modules/docker-agent-bridge

# If missing, install in the container
docker exec -it codehornets-worker-anga bash
cd /home/agent/workspace
npm install docker-agent-bridge
```

**Messages not appearing?**
```bash
# Check shared volumes
docker exec -it codehornets-worker-anga ls -la /shared/pipes
docker exec -it codehornets-worker-anga ls -la /shared/messages

# Create if missing
docker exec -it codehornets-worker-anga mkdir -p /shared/{pipes,messages}
```
