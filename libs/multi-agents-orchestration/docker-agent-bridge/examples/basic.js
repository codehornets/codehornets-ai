/**
 * Basic Example: Simple message sending
 *
 * This example shows how to send a simple message from
 * the orchestrator to a worker agent.
 */

const AgentBridge = require('../src/index');

async function main() {
  // Initialize bridge with auto-strategy selection
  const bridge = new AgentBridge({
    strategy: 'auto',
    debug: true
  });

  console.log('🚀 Docker Agent Bridge - Basic Example\n');

  try {
    // Check if target container is running
    const isRunning = await bridge.isContainerRunning('codehornets-worker-anga');

    if (!isRunning) {
      console.error('❌ Target container "codehornets-worker-anga" is not running');
      console.log('💡 Start it with: docker-compose up -d codehornets-worker-anga');
      process.exit(1);
    }

    console.log('✅ Target container is running\n');

    // Send a simple message
    console.log('📤 Sending message to Anga...\n');

    const result = await bridge.send(
      'codehornets-worker-anga',
      'Hello Anga! This is a test message from the orchestrator.',
      {
        from: 'orchestrator',
        id: 'test-001'
      }
    );

    console.log('\n✅ Message sent successfully!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('\n✨ Basic example completed!');
  process.exit(0);
}

main();
