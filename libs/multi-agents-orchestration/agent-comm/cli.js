#!/usr/bin/env node

/**
 * Agent Communication CLI
 *
 * Command-line interface for communicating with Claude Code agents.
 *
 * @module agent-comm/cli
 *
 * @example
 * # Send message to agent
 * node agent-comm/cli.js send anga "hello"
 *
 * # Get agent output
 * node agent-comm/cli.js output anga
 *
 * # Get agent status
 * node agent-comm/cli.js status
 * node agent-comm/cli.js status anga
 *
 * # Broadcast message
 * node agent-comm/cli.js broadcast "system message"
 * node agent-comm/cli.js broadcast workers "worker update"
 */

const AgentCommunicator = require('./index');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print error message
 */
function printError(message) {
  console.error(`${colors.red}ERROR: ${message}${colors.reset}`);
}

/**
 * Print success message
 */
function printSuccess(message) {
  console.log(`${colors.green}${message}${colors.reset}`);
}

/**
 * Print help information
 */
function printHelp() {
  const help = `
${colors.bold}Agent Communication CLI${colors.reset}
${colors.gray}Unified interface for communicating with Claude Code agents${colors.reset}

${colors.bold}USAGE:${colors.reset}
  node cli.js <command> [options]

${colors.bold}COMMANDS:${colors.reset}
  ${colors.cyan}send${colors.reset} <agent> <message>     Send message to agent and wait for response
  ${colors.cyan}async${colors.reset} <agent> <message>    Send message without waiting for response
  ${colors.cyan}output${colors.reset} <agent> [lines]     Get current output from agent
  ${colors.cyan}status${colors.reset} [agent]             Get status of one or all agents
  ${colors.cyan}broadcast${colors.reset} <targets> <msg>  Broadcast message to agents
  ${colors.cyan}delegate${colors.reset} <task>            Delegate task to best agent
  ${colors.cyan}help${colors.reset}                       Show this help message

${colors.bold}AGENTS:${colors.reset}
  orchestrator    Task Coordinator
  marie           Dance Teacher Assistant
  anga            Coding Assistant
  fabien          Marketing Assistant

${colors.bold}BROADCAST TARGETS:${colors.reset}
  all             All agents (including orchestrator)
  workers         Worker agents only (marie, anga, fabien)
  <agent,agent>   Comma-separated list of agents

${colors.bold}OPTIONS:${colors.reset}
  --strategy=<type>   Force strategy: tmux, pty-wrapper, file-based
  --timeout=<ms>      Set timeout in milliseconds (default: 30000)
  --debug             Enable debug logging
  --json              Output results as JSON

${colors.bold}EXAMPLES:${colors.reset}
  ${colors.gray}# Send a message to anga${colors.reset}
  node cli.js send anga "analyze this code structure"

  ${colors.gray}# Get output from marie${colors.reset}
  node cli.js output marie 50

  ${colors.gray}# Check all agent statuses${colors.reset}
  node cli.js status

  ${colors.gray}# Broadcast to workers${colors.reset}
  node cli.js broadcast workers "new task available"

  ${colors.gray}# Delegate task automatically${colors.reset}
  node cli.js delegate "review the marketing campaign"

  ${colors.gray}# Force tmux strategy${colors.reset}
  node cli.js send anga "hello" --strategy=tmux

  ${colors.gray}# Get JSON output${colors.reset}
  node cli.js status --json
`;

  console.log(help);
}

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const args = {
    command: null,
    args: [],
    options: {
      strategy: 'auto',
      timeout: 30000,
      debug: false,
      json: false
    }
  };

  const positionalArgs = [];

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');

      if (key === 'debug') {
        args.options.debug = true;
      } else if (key === 'json') {
        args.options.json = true;
      } else if (key === 'strategy') {
        args.options.strategy = value;
      } else if (key === 'timeout') {
        args.options.timeout = parseInt(value, 10);
      } else if (key === 'help') {
        args.command = 'help';
      }
    } else {
      positionalArgs.push(arg);
    }
  }

  if (positionalArgs.length > 0) {
    args.command = positionalArgs[0];
    args.args = positionalArgs.slice(1);
  }

  return args;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Main CLI handler
 */
async function main() {
  const { command, args, options } = parseArgs(process.argv);

  // Handle help or no command
  if (!command || command === 'help') {
    printHelp();
    process.exit(0);
  }

  // Create communicator instance
  const comm = new AgentCommunicator({
    strategy: options.strategy,
    debug: options.debug,
    timeout: options.timeout
  });

  try {
    // Initialize communicator
    if (!options.json) {
      print('Initializing agent communicator...', 'gray');
    }

    await comm.initialize();

    // Execute command
    switch (command) {
      case 'send':
        await handleSend(comm, args, options);
        break;

      case 'async':
        await handleAsync(comm, args, options);
        break;

      case 'output':
        await handleOutput(comm, args, options);
        break;

      case 'status':
        await handleStatus(comm, args, options);
        break;

      case 'broadcast':
        await handleBroadcast(comm, args, options);
        break;

      case 'delegate':
        await handleDelegate(comm, args, options);
        break;

      default:
        printError(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: error.message }, null, 2));
    } else {
      printError(error.message);
    }
    process.exit(1);
  } finally {
    await comm.shutdown();
  }
}

/**
 * Handle 'send' command
 */
async function handleSend(comm, args, options) {
  if (args.length < 2) {
    printError('Usage: send <agent> <message>');
    process.exit(1);
  }

  const [agent, ...messageParts] = args;
  const message = messageParts.join(' ');

  if (!options.json) {
    print(`Sending to ${agent}...`, 'cyan');
  }

  const result = await comm.send(agent, message, {
    timeout: options.timeout
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success) {
      printSuccess(`Message sent successfully (${formatDuration(result.duration)})`);
      if (result.response) {
        print('\nResponse:', 'bold');
        console.log(result.response);
      }
    } else {
      printError(`Failed: ${result.error}`);
      process.exit(1);
    }
  }
}

/**
 * Handle 'async' command
 */
async function handleAsync(comm, args, options) {
  if (args.length < 2) {
    printError('Usage: async <agent> <message>');
    process.exit(1);
  }

  const [agent, ...messageParts] = args;
  const message = messageParts.join(' ');

  if (!options.json) {
    print(`Sending async to ${agent}...`, 'cyan');
  }

  await comm.sendAsync(agent, message);

  if (options.json) {
    console.log(JSON.stringify({ success: true, async: true }));
  } else {
    printSuccess('Message sent (async)');
  }
}

/**
 * Handle 'output' command
 */
async function handleOutput(comm, args, options) {
  if (args.length < 1) {
    printError('Usage: output <agent> [lines]');
    process.exit(1);
  }

  const [agent, linesStr] = args;
  const lines = linesStr ? parseInt(linesStr, 10) : 100;

  if (!options.json) {
    print(`Getting output from ${agent}...`, 'cyan');
  }

  const output = await comm.getOutput(agent, { lines });

  if (options.json) {
    console.log(JSON.stringify({ output }));
  } else {
    print(`\n--- Output from ${agent} ---`, 'bold');
    console.log(output || '(no output)');
  }
}

/**
 * Handle 'status' command
 */
async function handleStatus(comm, args, options) {
  const [agent] = args;

  if (agent) {
    // Single agent status
    const status = await comm.getStatus(agent);

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      print(`\n--- Status: ${agent} ---`, 'bold');
      printStatusEntry(agent, status);
    }
  } else {
    // All agents status
    const statuses = await comm.getAllStatuses();

    if (options.json) {
      console.log(JSON.stringify(statuses, null, 2));
    } else {
      print('\n--- Agent Statuses ---', 'bold');

      for (const [agentName, status] of Object.entries(statuses)) {
        printStatusEntry(agentName, status);
      }
    }
  }
}

/**
 * Print a single status entry
 */
function printStatusEntry(agent, status) {
  const icon = status.available ? colors.green + '[OK]' : colors.red + '[--]';
  const state = status.state || 'unknown';
  const strategy = status.strategy || '';
  const error = status.error ? colors.gray + ` (${status.error})` : '';

  console.log(
    `${icon} ${colors.bold}${agent}${colors.reset}` +
    ` - ${state}${strategy ? ` via ${strategy}` : ''}${error}${colors.reset}`
  );
}

/**
 * Handle 'broadcast' command
 */
async function handleBroadcast(comm, args, options) {
  if (args.length < 1) {
    printError('Usage: broadcast <targets> <message>');
    printError('  targets: all, workers, or comma-separated agent names');
    process.exit(1);
  }

  let targets, message;

  // Check if first arg is a target specifier
  if (['all', 'workers'].includes(args[0]) || args[0].includes(',')) {
    targets = args[0].includes(',') ? args[0].split(',') : args[0];
    message = args.slice(1).join(' ');
  } else {
    // Default to workers
    targets = 'workers';
    message = args.join(' ');
  }

  if (!message) {
    printError('Message is required');
    process.exit(1);
  }

  if (!options.json) {
    print(`Broadcasting to ${typeof targets === 'string' ? targets : targets.join(', ')}...`, 'cyan');
  }

  const results = await comm.broadcast(targets, message, {
    timeout: options.timeout
  });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    print('\n--- Broadcast Results ---', 'bold');

    for (const [agent, result] of Object.entries(results)) {
      const icon = result.success ? colors.green + '[OK]' : colors.red + '[--]';
      const info = result.success
        ? `(${formatDuration(result.duration)})`
        : `(${result.error})`;

      console.log(`${icon} ${agent} ${colors.gray}${info}${colors.reset}`);
    }
  }
}

/**
 * Handle 'delegate' command
 */
async function handleDelegate(comm, args, options) {
  if (args.length < 1) {
    printError('Usage: delegate <task description>');
    process.exit(1);
  }

  const task = args.join(' ');

  if (!options.json) {
    print('Finding best agent for task...', 'cyan');
  }

  const result = await comm.delegateTask(task, {
    timeout: options.timeout
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success) {
      printSuccess(
        `Task delegated to ${result.assignedTo} (${result.assignedRole}) ` +
        `in ${formatDuration(result.duration)}`
      );

      if (result.response) {
        print('\nResponse:', 'bold');
        console.log(result.response);
      }
    } else {
      printError(`Delegation failed: ${result.error}`);
      process.exit(1);
    }
  }
}

// Run main
main().catch((error) => {
  printError(error.message);
  process.exit(1);
});
