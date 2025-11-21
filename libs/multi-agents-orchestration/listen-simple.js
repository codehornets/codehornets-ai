#!/usr/bin/env node
// Simple listener - runs INSIDE container, reads from shared volume
const fs = require('fs');
const path = require('path');

const agentName = process.env.AGENT_NAME || 'unknown';
const containerName = agentName === 'orchestrator'
  ? 'codehornets-orchestrator'
  : `codehornets-worker-${agentName}`;

const inboxDir = `/shared/messages/${containerName}`;

console.log(`\n🎧 ${agentName} listening for messages...`);
console.log(`📂 Watching: ${inboxDir}\n`);

// Ensure inbox exists
if (!fs.existsSync(inboxDir)) {
  fs.mkdirSync(inboxDir, { recursive: true });
}

// Poll for new message files
let processedFiles = new Set();

function checkMessages() {
  try {
    const files = fs.readdirSync(inboxDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(inboxDir, f));

    for (const file of files) {
      if (!processedFiles.has(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const message = JSON.parse(content);

          console.log('\n' + '═'.repeat(50));
          console.log(`📨 FROM: ${message.from}`);
          console.log('═'.repeat(50));
          console.log(message.payload);
          console.log('═'.repeat(50) + '\n');

          // Delete the file after reading
          fs.unlinkSync(file);
          processedFiles.add(file);
        } catch (error) {
          console.error(`Error processing ${file}:`, error.message);
        }
      }
    }
  } catch (error) {
    // Ignore directory read errors
  }
}

console.log('✅ Listening active\n');

// Check for messages every 500ms
setInterval(checkMessages, 500);

// Keep alive
process.on('SIGINT', () => {
  console.log('\n👋 Stopping listener...\n');
  process.exit(0);
});
