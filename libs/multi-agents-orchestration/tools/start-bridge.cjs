#!/usr/bin/env node

/**
 * Start Agent Bridge - Initialize communication for an agent
 *
 * This runs in the background and handles incoming messages
 */

const path = require('path');

// Detect which agent we are
const agentName = process.env.AGENT_NAME || process.env.WORKER_NAME || 'unknown';
const agentRole = process.env.AGENT_ROLE || 'worker';

console.log(`\n🌉 Starting Agent Bridge for ${agentName} (${agentRole})\n`);

// Load appropriate communicator
let Communicator;

if (agentRole === 'orchestrator' || agentName === 'orchestrator') {
  Communicator = require('../orchestrator/agent-communication');
} else {
  // Load specific worker communicator
  switch (agentName) {
    case 'marie':
      Communicator = require('../workers/marie-communication');
      break;
    case 'anga':
      Communicator = require('../workers/anga-communication');
      break;
    case 'fabien':
      Communicator = require('../workers/fabien-communication');
      break;
    default:
      console.error(`❌ Unknown agent: ${agentName}`);
      process.exit(1);
  }
}

// Initialize the communicator
(async () => {
  const communicator = new Communicator({ debug: true });

  try {
    await communicator.initialize();

    console.log(`\n✅ ${agentName} communication bridge is active!`);
    console.log(`\n💡 To send a message, use:`);
    console.log(`   node /tools/send-message.js <target> <message>\n`);

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log(`\n\n[${agentName}] Shutting down bridge...`);
      await communicator.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(`\n\n[${agentName}] Shutting down bridge...`);
      await communicator.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error(`\n❌ Failed to start bridge:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
