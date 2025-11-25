#!/usr/bin/env node
// Simple message sender - runs INSIDE container, writes to shared volume
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\nUsage: node msg-simple.js <target> <message>');
  console.log('\nExamples:');
  console.log('  node msg-simple.js anga "Hello Anga!"');
  console.log('  node msg-simple.js orchestrator "Task complete"');
  process.exit(0);
}

const target = args[0];
const message = args.slice(1).join(' ');
const from = process.env.AGENT_NAME || 'unknown';

const targetContainer = target === 'orchestrator'
  ? 'codehornets-orchestrator'
  : `codehornets-worker-${target}`;

const targetDir = `/shared/messages/${targetContainer}`;
const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const messageFile = path.join(targetDir, `${messageId}.json`);

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Create message object
const msg = {
  from,
  to: targetContainer,
  payload: message,
  timestamp: Date.now(),
  id: messageId
};

// Write message file
try {
  fs.writeFileSync(messageFile, JSON.stringify(msg, null, 2));
  console.log(`✅ Message sent to ${target}`);
  process.exit(0);
} catch (error) {
  console.error(`❌ Failed: ${error.message}`);
  process.exit(1);
}
