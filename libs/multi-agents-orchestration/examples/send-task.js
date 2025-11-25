#!/usr/bin/env node
/**
 * Send Task to Worker Example
 *
 * Demonstrates how to send a task to a worker agent using
 * the unified communication API.
 *
 * Usage:
 *   node examples/send-task.js anga "Review the authentication code"
 *   node examples/send-task.js marie "Evaluate student performance" --priority high
 *   node examples/send-task.js fabien "Create marketing campaign" --wait
 */

const path = require('path');
const EventEmitter = require('events');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage: node send-task.js <worker> <task-description> [options]

Workers:
  marie   - Dance Teaching Assistant
  anga    - Coding Assistant
  fabien  - Marketing Assistant

Options:
  --priority <low|normal|high>  Task priority (default: normal)
  --wait                        Wait for task completion
  --timeout <ms>               Timeout in milliseconds (default: 30000)
  --strategy <strategy>         Communication strategy (auto|tmux|pty-wrapper|shared-volume)
  --json                        Output result as JSON

Examples:
  node send-task.js anga "Review PR #123"
  node send-task.js marie "Document ballet class" --priority high
  node send-task.js fabien "Create Q1 campaign" --wait --timeout 60000
`);
  process.exit(0);
}

// Parse arguments
const worker = args[0];
const taskDescription = args[1];
const options = {
  priority: 'normal',
  wait: false,
  timeout: 30000,
  strategy: 'auto',
  json: false
};

for (let i = 2; i < args.length; i++) {
  switch (args[i]) {
    case '--priority':
      options.priority = args[++i];
      break;
    case '--wait':
      options.wait = true;
      break;
    case '--timeout':
      options.timeout = parseInt(args[++i], 10);
      break;
    case '--strategy':
      options.strategy = args[++i];
      break;
    case '--json':
      options.json = true;
      break;
  }
}

// Validate worker
const validWorkers = ['marie', 'anga', 'fabien'];
if (!validWorkers.includes(worker)) {
  console.error(`Error: Invalid worker "${worker}". Valid workers: ${validWorkers.join(', ')}`);
  process.exit(1);
}

// Mock AgentComm for demonstration
// In production, import the real implementation
class MockAgentComm extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.agentName = opts.agentName || 'orchestrator';
    this.strategy = opts.strategy || 'auto';
  }

  async initialize() {
    console.log(`[${this.agentName}] Initializing communication (strategy: ${this.strategy})...`);
    await sleep(100);
    console.log(`[${this.agentName}] Ready`);
  }

  async send(target, message) {
    console.log(`[${this.agentName}] Sending to ${target}...`);
    await sleep(50);

    // Simulate different strategies
    const strategyLatency = {
      'pty-wrapper': 5,
      'tmux': 20,
      'shared-volume': 15,
      'auto': 10
    };

    await sleep(strategyLatency[this.strategy] || 10);

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      strategy: this.strategy === 'auto' ? 'pty-wrapper' : this.strategy
    };
  }

  async request(target, action, data, timeout) {
    const sendResult = await this.send(target, { type: 'request', action, data });

    // Simulate waiting for response
    console.log(`[${this.agentName}] Waiting for response from ${target}...`);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for response from ${target}`));
      }, timeout);

      // Simulate response after delay
      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          status: 'completed',
          result: `Task "${data.description}" processed by ${target}`,
          completedAt: new Date().toISOString()
        });
      }, Math.random() * 2000 + 500);
    });
  }

  async stop() {
    console.log(`[${this.agentName}] Disconnecting...`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function main() {
  const startTime = Date.now();

  // Create task object
  const task = {
    taskId: generateTaskId(),
    type: 'task',
    action: taskDescription,
    priority: options.priority,
    assignedTo: worker,
    createdAt: new Date().toISOString(),
    metadata: {
      source: 'send-task-example',
      options
    }
  };

  if (!options.json) {
    console.log('\n====================================');
    console.log('  Send Task to Worker');
    console.log('====================================\n');
    console.log(`Worker:      ${worker}`);
    console.log(`Task:        ${taskDescription}`);
    console.log(`Priority:    ${options.priority}`);
    console.log(`Wait:        ${options.wait}`);
    console.log(`Strategy:    ${options.strategy}`);
    console.log(`Task ID:     ${task.taskId}`);
    console.log('\n------------------------------------\n');
  }

  // Initialize communication
  const comm = new MockAgentComm({
    agentName: 'orchestrator',
    strategy: options.strategy
  });

  try {
    await comm.initialize();

    if (options.wait) {
      // Send task and wait for response
      if (!options.json) {
        console.log('Sending task and waiting for completion...\n');
      }

      const result = await comm.request(worker, 'executeTask', {
        description: taskDescription,
        ...task
      }, options.timeout);

      const duration = Date.now() - startTime;

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          task,
          result,
          duration
        }, null, 2));
      } else {
        console.log('Task completed successfully!\n');
        console.log(`Status:      ${result.status}`);
        console.log(`Result:      ${result.result}`);
        console.log(`Completed:   ${result.completedAt}`);
        console.log(`Duration:    ${duration}ms`);
        console.log('\n====================================\n');
      }
    } else {
      // Send task without waiting
      const result = await comm.send(worker, task);
      const duration = Date.now() - startTime;

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          task,
          messageId: result.messageId,
          strategy: result.strategy,
          duration
        }, null, 2));
      } else {
        console.log('Task sent successfully!\n');
        console.log(`Message ID:  ${result.messageId}`);
        console.log(`Strategy:    ${result.strategy}`);
        console.log(`Duration:    ${duration}ms`);
        console.log('\nNote: Use --wait to wait for task completion');
        console.log('\n====================================\n');
      }
    }

    await comm.stop();
    process.exit(0);
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        success: false,
        error: error.message,
        task
      }, null, 2));
    } else {
      console.error(`\nError: ${error.message}\n`);
    }
    await comm.stop();
    process.exit(1);
  }
}

main().catch(console.error);
