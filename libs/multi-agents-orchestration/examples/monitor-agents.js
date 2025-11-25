#!/usr/bin/env node
/**
 * Monitor Agents Example
 *
 * Demonstrates how to monitor the status of all agents in the
 * orchestration system in real-time.
 *
 * Usage:
 *   node examples/monitor-agents.js
 *   node examples/monitor-agents.js --interval 5000
 *   node examples/monitor-agents.js --once
 */

const EventEmitter = require('events');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  interval: 2000,  // Refresh interval in ms
  once: false      // Single check mode
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--interval':
      options.interval = parseInt(args[++i], 10);
      break;
    case '--once':
      options.once = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Monitor Agents - Real-time agent status monitoring

Usage: node monitor-agents.js [options]

Options:
  --interval <ms>   Refresh interval (default: 2000)
  --once            Check once and exit
  --help, -h        Show this help

Output:
  Shows status of all agents including:
  - Connection status
  - Current task (if any)
  - Message statistics
  - Health indicators
`);
      process.exit(0);
  }
}

// Agent definitions
const AGENTS = {
  orchestrator: {
    name: 'Orchestrator',
    role: 'Task Coordinator',
    container: 'codehornets-orchestrator'
  },
  marie: {
    name: 'Marie',
    role: 'Dance Teaching',
    container: 'codehornets-worker-marie',
    emoji: '🩰'
  },
  anga: {
    name: 'Anga',
    role: 'Coding',
    container: 'codehornets-worker-anga',
    emoji: '💻'
  },
  fabien: {
    name: 'Fabien',
    role: 'Marketing',
    container: 'codehornets-worker-fabien',
    emoji: '📈'
  }
};

// Mock Docker/Communication API for demonstration
class MockMonitor extends EventEmitter {
  constructor() {
    super();
    this.agentStats = new Map();

    // Initialize mock stats
    for (const [key, agent] of Object.entries(AGENTS)) {
      this.agentStats.set(key, {
        status: Math.random() > 0.1 ? 'running' : 'stopped',
        uptime: Math.floor(Math.random() * 86400),
        tasksCurrent: key === 'orchestrator' ? 0 : Math.floor(Math.random() * 3),
        tasksCompleted: Math.floor(Math.random() * 50),
        messagesSent: Math.floor(Math.random() * 200),
        messagesReceived: Math.floor(Math.random() * 200),
        lastHeartbeat: Date.now() - Math.floor(Math.random() * 10000),
        cpuUsage: Math.random() * 50,
        memoryMB: Math.floor(Math.random() * 500) + 100,
        currentTask: null
      });

      // Simulate current tasks for workers
      if (key !== 'orchestrator' && Math.random() > 0.5) {
        this.agentStats.get(key).currentTask = {
          id: `task_${Math.random().toString(36).substr(2, 9)}`,
          description: getRandomTask(key),
          startedAt: Date.now() - Math.floor(Math.random() * 60000)
        };
      }
    }
  }

  async getAgentStatus(agentKey) {
    const stats = this.agentStats.get(agentKey);
    if (!stats) return null;

    // Simulate some variation
    stats.cpuUsage = Math.max(0, Math.min(100, stats.cpuUsage + (Math.random() - 0.5) * 10));
    stats.memoryMB = Math.max(100, stats.memoryMB + Math.floor((Math.random() - 0.5) * 20));
    stats.lastHeartbeat = Date.now();

    // Randomly complete/start tasks
    if (Math.random() > 0.9 && stats.currentTask) {
      stats.tasksCompleted++;
      stats.currentTask = null;
    } else if (Math.random() > 0.95 && !stats.currentTask && agentKey !== 'orchestrator') {
      stats.currentTask = {
        id: `task_${Math.random().toString(36).substr(2, 9)}`,
        description: getRandomTask(agentKey),
        startedAt: Date.now()
      };
    }

    return { ...stats };
  }

  async getAllStatuses() {
    const statuses = {};
    for (const key of Object.keys(AGENTS)) {
      statuses[key] = await this.getAgentStatus(key);
    }
    return statuses;
  }
}

function getRandomTask(agent) {
  const tasks = {
    marie: [
      'Evaluating student performances',
      'Documenting choreography',
      'Reviewing class notes',
      'Preparing recital schedule'
    ],
    anga: [
      'Reviewing pull request',
      'Debugging authentication',
      'Writing unit tests',
      'Refactoring API endpoint'
    ],
    fabien: [
      'Creating email campaign',
      'Analyzing social metrics',
      'Writing blog post',
      'Designing landing page'
    ]
  };

  const agentTasks = tasks[agent] || ['Processing task'];
  return agentTasks[Math.floor(Math.random() * agentTasks.length)];
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

function formatTime(ms) {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function getStatusIcon(status) {
  switch (status) {
    case 'running': return '\x1b[32m●\x1b[0m';  // Green dot
    case 'busy': return '\x1b[33m●\x1b[0m';     // Yellow dot
    case 'stopped': return '\x1b[31m●\x1b[0m';  // Red dot
    default: return '\x1b[90m●\x1b[0m';         // Gray dot
  }
}

function getHealthStatus(stats) {
  const heartbeatAge = (Date.now() - stats.lastHeartbeat) / 1000;

  if (stats.status !== 'running') return { icon: '❌', status: 'Offline' };
  if (heartbeatAge > 30) return { icon: '⚠️', status: 'Stale' };
  if (stats.cpuUsage > 80) return { icon: '🔥', status: 'High CPU' };
  if (stats.memoryMB > 900) return { icon: '💾', status: 'High Memory' };
  return { icon: '✅', status: 'Healthy' };
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function printDashboard(statuses) {
  const now = new Date().toLocaleTimeString();

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    CODEHORNETS AGENT MONITOR                               ║');
  console.log(`║                    Last Update: ${now.padEnd(42)}║`);
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');

  // Agent summary table
  console.log('║  Agent          Status    Health    Tasks    Messages    CPU    Memory    ║');
  console.log('╟────────────────────────────────────────────────────────────────────────────╢');

  for (const [key, agent] of Object.entries(AGENTS)) {
    const stats = statuses[key];
    const statusIcon = getStatusIcon(stats?.currentTask ? 'busy' : stats?.status);
    const health = getHealthStatus(stats || { status: 'stopped', lastHeartbeat: 0, cpuUsage: 0, memoryMB: 0 });

    const emoji = agent.emoji || '🎯';
    const name = `${emoji} ${agent.name}`.padEnd(14);
    const status = (stats?.status || 'unknown').padEnd(8);
    const healthStr = health.status.padEnd(10);
    const tasks = stats ? `${stats.tasksCurrent}/${stats.tasksCompleted}`.padEnd(8) : '-'.padEnd(8);
    const messages = stats ? `${stats.messagesSent}/${stats.messagesReceived}`.padEnd(10) : '-'.padEnd(10);
    const cpu = stats ? `${stats.cpuUsage.toFixed(0)}%`.padEnd(6) : '-'.padEnd(6);
    const memory = stats ? `${stats.memoryMB}MB`.padEnd(8) : '-'.padEnd(8);

    console.log(`║  ${name} ${statusIcon} ${status} ${health.icon} ${healthStr} ${tasks} ${messages} ${cpu} ${memory}║`);
  }

  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  CURRENT TASKS                                                             ║');
  console.log('╟────────────────────────────────────────────────────────────────────────────╢');

  let hasActiveTasks = false;
  for (const [key, agent] of Object.entries(AGENTS)) {
    const stats = statuses[key];
    if (stats?.currentTask) {
      hasActiveTasks = true;
      const taskTime = formatTime(stats.currentTask.startedAt);
      const emoji = agent.emoji || '🎯';
      console.log(`║  ${emoji} ${agent.name}: ${stats.currentTask.description.substring(0, 40).padEnd(40)} ${taskTime.padStart(10)} ║`);
    }
  }

  if (!hasActiveTasks) {
    console.log('║  No active tasks                                                           ║');
  }

  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  LEGEND: Tasks = Current/Completed  |  Messages = Sent/Received            ║');
  console.log('║  Press Ctrl+C to exit                                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
}

async function main() {
  const monitor = new MockMonitor();

  console.log('Starting agent monitor...\n');

  if (options.once) {
    // Single check mode
    const statuses = await monitor.getAllStatuses();
    printDashboard(statuses);
    process.exit(0);
  }

  // Continuous monitoring mode
  const refresh = async () => {
    try {
      clearScreen();
      const statuses = await monitor.getAllStatuses();
      printDashboard(statuses);
    } catch (error) {
      console.error('Error refreshing status:', error.message);
    }
  };

  // Initial display
  await refresh();

  // Set up refresh interval
  const intervalId = setInterval(refresh, options.interval);

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log('\n\nMonitor stopped.\n');
    process.exit(0);
  });
}

main().catch(console.error);
