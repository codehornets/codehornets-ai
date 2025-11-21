/**
 * Listener Example: Receiving messages
 *
 * This example shows how to set up a listener
 * to receive messages from other agents.
 *
 * Run this in a container to listen for incoming messages.
 */

const AgentBridge = require('../src/index');

async function main() {
  const containerName = process.argv[2] || 'codehornets-worker-anga';

  const bridge = new AgentBridge({
    strategy: 'auto',
    debug: true
  });

  console.log(`🎧 Docker Agent Bridge - Listener Example`);
  console.log(`📥 Listening for messages to: ${containerName}\n`);

  try {
    // Check if container is running
    const isRunning = await bridge.isContainerRunning(containerName);

    if (!isRunning) {
      console.error(`❌ Container "${containerName}" is not running`);
      console.log(`💡 Start it with: docker-compose up -d ${containerName}`);
      process.exit(1);
    }

    // Set up message handler
    bridge.on('message', (message) => {
      console.log('\n' + '═'.repeat(60));
      console.log('📨 NEW MESSAGE RECEIVED');
      console.log('═'.repeat(60));
      console.log(`From:      ${message.from}`);
      console.log(`To:        ${message.to}`);
      console.log(`ID:        ${message.id}`);
      console.log(`Timestamp: ${new Date(message.timestamp).toLocaleString()}`);
      console.log('─'.repeat(60));
      console.log('Payload:');
      console.log(typeof message.payload === 'string'
        ? message.payload
        : JSON.stringify(message.payload, null, 2));
      console.log('═'.repeat(60) + '\n');
    });

    // Start listening
    console.log('👂 Starting listeners on all available strategies...\n');

    await bridge.listen(containerName);

    console.log('✅ Listeners active');
    console.log('💡 Send messages using the basic.js or advanced.js examples');
    console.log('🛑 Press Ctrl+C to stop\n');

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping listeners...');
      await bridge.stop();
      console.log('✅ Stopped');
      process.exit(0);
    });

    // Prevent exit
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
