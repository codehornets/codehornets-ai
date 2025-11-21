#!/usr/bin/env node

/**
 * Send Message Tool - Interactive message sending between agents
 *
 * Usage from inside a container:
 *   node /tools/send-message.js <target-agent> <message>
 *
 * Example:
 *   node /tools/send-message.js anga "Hello Anga, can you help with code review?"
 */

const AgentBridge = require('docker-agent-bridge');

async function sendMessage() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: send-message <target-agent> <message>');
    console.log('');
    console.log('Available agents:');
    console.log('  - orchestrator');
    console.log('  - marie');
    console.log('  - anga');
    console.log('  - fabien');
    console.log('');
    console.log('Example:');
    console.log('  send-message anga "Hello, can you review my code?"');
    process.exit(1);
  }

  const targetAgent = args[0];
  const message = args.slice(1).join(' ');

  // Detect current agent from environment
  const currentAgent = process.env.AGENT_NAME || 'unknown';
  const targetContainer = targetAgent.startsWith('worker-')
    ? `codehornets-${targetAgent}`
    : `codehornets-${targetAgent === 'orchestrator' ? 'orchestrator' : 'worker-' + targetAgent}`;

  console.log(`\n📤 Sending message from ${currentAgent} to ${targetAgent}...\n`);

  const bridge = new AgentBridge({
    strategy: 'auto',
    debug: true,
    retryAttempts: 3
  });

  try {
    const result = await bridge.send(targetContainer, message, {
      from: currentAgent
    });

    console.log('\n✅ Message sent successfully!');
    console.log(`Strategy used: ${result.strategy}`);
    console.log(`Target: ${result.target}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to send message:', error.message);
    process.exit(1);
  }
}

sendMessage();
