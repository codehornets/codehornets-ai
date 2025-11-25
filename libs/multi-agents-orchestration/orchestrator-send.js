#!/usr/bin/env node
// Orchestrator message sender - uses Docker API to send messages to workers
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\nUsage: node orchestrator-send.js <target> <message>');
  console.log('\nExamples:');
  console.log('  node orchestrator-send.js anga "Review this code"');
  console.log('  node orchestrator-send.js marie "Check student progress"');
  console.log('  node orchestrator-send.js fabien "Create marketing campaign"');
  process.exit(0);
}

const target = args[0];
const message = args.slice(1).join(' ');

const targetContainer = target === 'orchestrator'
  ? 'codehornets-orchestrator'
  : `codehornets-worker-${target}`;

const targetDir = `/shared/messages/${targetContainer}`;
const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const messageFile = path.join(targetDir, `${messageId}.json`);

// Create message object
const msg = {
  from: 'orchestrator',
  to: targetContainer,
  payload: message,
  timestamp: Date.now(),
  id: messageId
};

async function sendMessage() {
  try {
    console.log(`\n📤 Orchestrator sending message to ${target}...`);

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write message file
    fs.writeFileSync(messageFile, JSON.stringify(msg, null, 2));

    console.log(`✅ Message sent to ${target}`);
    console.log(`📁 File: ${messageFile}`);
    console.log(`\n📨 Message content:`);
    console.log('═'.repeat(50));
    console.log(message);
    console.log('═'.repeat(50));

    // Optionally, we can also inject into the worker's TTY if it's running
    // This would show the message directly in their terminal
    try {
      const container = docker.getContainer(targetContainer);
      const info = await container.inspect();

      if (info.State.Running) {
        console.log(`\n✅ ${target} container is running`);
        console.log(`   Message will be picked up by their listener`);
      }
    } catch (error) {
      console.log(`\n⚠️  Could not check ${target} status: ${error.message}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Failed to send message: ${error.message}`);
    process.exit(1);
  }
}

sendMessage();
