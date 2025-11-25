/**
 * Test script for TmuxController
 * Run: node test.js
 */

const TmuxController = require('./index');

async function runTests() {
  console.log('TmuxController Test Suite');
  console.log('=========================');
  console.log('');

  const controller = new TmuxController({ verbose: true });

  // Test 1: Get all agent status
  console.log('Test 1: Get all agent status');
  console.log('----------------------------');
  try {
    const status = await controller.getAllStatus();
    console.log('Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Test 2: Check individual agent
  console.log('Test 2: Check individual agent (anga)');
  console.log('-------------------------------------');
  try {
    const containerRunning = await controller.isContainerRunning('anga');
    const sessionActive = await controller.isSessionActive('anga');
    console.log(`Anga container running: ${containerRunning}`);
    console.log(`Anga session active: ${sessionActive}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Test 3: Try to get output (will fail if not running)
  console.log('Test 3: Get output from anga');
  console.log('----------------------------');
  try {
    const result = await controller.getOutput('anga', { lines: 20 });
    if (result.success) {
      console.log('Output (last 20 lines):');
      console.log(result.output);
    } else {
      console.log('Could not get output:', result.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Test 4: Agent config validation
  console.log('Test 4: Agent config validation');
  console.log('-------------------------------');
  try {
    const config = controller.getAgentConfig('anga');
    console.log('Anga config:', config);

    // This should throw
    controller.getAgentConfig('invalid');
  } catch (error) {
    console.log('Expected error for invalid agent:', error.message);
  }
  console.log('');

  console.log('Tests complete!');
  console.log('');
  console.log('To run a full test with running containers:');
  console.log('  1. Start containers: make up-tmux');
  console.log('  2. Send a message: node index.js send anga "Hello, this is a test"');
  console.log('  3. Get output: node index.js output anga');
}

runTests().catch(console.error);
