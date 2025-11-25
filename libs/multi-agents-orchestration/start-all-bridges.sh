#!/bin/bash

# Start Communication Bridges in All Containers with tmux

echo "🌉 Starting Agent Communication Bridges in tmux sessions..."
echo ""

# Function to start bridge in tmux
start_bridge() {
  local container=$1
  local agent=$2

  echo "Starting bridge in $container..."

  # Create bridge script
  docker exec $container bash -c "cat > /tmp/run-bridge.sh << 'EOF'
#!/bin/bash
cd /home/agent/workspace
export AGENT_NAME=$agent
node -e \"
const AgentBridge = require('docker-agent-bridge');
const bridge = new AgentBridge({ debug: true });

console.log('\\n🎧 $agent listening for messages...\\n');

bridge.on('message', (msg) => {
  console.log('\\n' + '═'.repeat(60));
  console.log('📨 MESSAGE FROM: ' + msg.from);
  console.log('═'.repeat(60));
  console.log(msg.payload);
  console.log('═'.repeat(60) + '\\n');
});

bridge.listen('$container').then(() => {
  console.log('✅ Bridge active for $agent\\n');
}).catch(err => {
  console.error('❌ Error:', err.message);
});

setInterval(() => {}, 1000);
\"
EOF
chmod +x /tmp/run-bridge.sh
"

  # Start in tmux
  docker exec $container tmux new-session -d -s bridge "bash /tmp/run-bridge.sh"

  echo "  ✅ $agent bridge started in tmux session 'bridge'"
}

# Start bridges in all containers
start_bridge "codehornets-orchestrator" "orchestrator"
start_bridge "codehornets-worker-marie" "marie"
start_bridge "codehornets-worker-anga" "anga"
start_bridge "codehornets-worker-fabien" "fabien"

echo ""
echo "✅ All bridges started!"
echo ""
echo "📋 To view a bridge session:"
echo "   docker exec -it codehornets-worker-anga tmux attach -t bridge"
echo ""
echo "📋 To send a message:"
echo "   node tools/send-message.cjs anga \"Hello Anga!\""
echo ""
echo "📋 To detach from tmux: Press Ctrl+B then D"
echo ""
