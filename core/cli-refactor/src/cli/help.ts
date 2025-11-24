/**
 * CLI Help Text Generation
 *
 * Generates formatted help text for commands and subcommands.
 *
 * @module cli/help
 */

import type { CommandDefinition, OptionDefinition, ArgumentDefinition } from './types.js';

/**
 * Version information for the CLI.
 */
export const VERSION = '2.0.37';

/**
 * Package information constants.
 */
export const PACKAGE_INFO = {
  name: '@anthropic-ai/claude-code',
  description:
    "Use Claude, Anthropic's AI assistant, right from your terminal. Claude can understand your codebase, edit files, run terminal commands, and handle entire workflows for you.",
  homepage: 'https://github.com/anthropics/claude-code',
  issues: 'https://github.com/anthropics/claude-code/issues',
  docs: 'https://docs.claude.com/s/claude-code',
};

/**
 * ANSI escape codes for terminal styling.
 */
const styles = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  cyan: '\x1B[36m',
};

/**
 * Checks if terminal supports colors.
 */
function supportsColor(): boolean {
  if (process.env.FORCE_COLOR === 'true' || process.env.FORCE_COLOR === '1') {
    return true;
  }
  if (process.env.FORCE_COLOR === 'false' || process.env.FORCE_COLOR === '0') {
    return false;
  }
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  return process.stdout.isTTY ?? false;
}

/**
 * Applies style to text if colors are supported.
 */
function style(text: string, ...codes: string[]): string {
  if (!supportsColor()) {
    return text;
  }
  return codes.join('') + text + styles.reset;
}

/**
 * Formats a command name with styling.
 */
function formatCommand(name: string): string {
  return style(name, styles.cyan, styles.bold);
}

/**
 * Formats an option name with styling.
 */
function formatOption(name: string): string {
  return style(name, styles.green);
}

/**
 * Formats a section header with styling.
 */
function formatHeader(text: string): string {
  return style(text, styles.bold);
}

/**
 * Formats dim/secondary text.
 */
function formatDim(text: string): string {
  return style(text, styles.dim);
}

/**
 * Pads a string to a minimum length.
 */
function padEnd(str: string, length: number): string {
  return str + ' '.repeat(Math.max(0, length - str.length));
}

/**
 * Wraps text to fit within a specified width.
 */
function wrapText(text: string, width: number, indent: string = ''): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > width) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = indent + word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

/**
 * Generates the main CLI help text.
 *
 * @returns Formatted help string
 */
export function generateMainHelp(): string {
  const lines: string[] = [];

  lines.push(formatHeader('Claude Code CLI') + ` v${VERSION}`);
  lines.push('');
  lines.push(PACKAGE_INFO.description);
  lines.push('');

  lines.push(formatHeader('Usage:'));
  lines.push('  claude [options] [prompt]');
  lines.push('  claude <command> [options]');
  lines.push('');

  lines.push(formatHeader('Commands:'));
  const commands = [
    ['mcp', 'Configure and manage MCP servers'],
    ['plugin', 'Manage Claude Code plugins'],
    ['doctor', 'Check the health of your Claude Code installation'],
    ['update', 'Check for updates and install if available'],
    ['install', 'Install Claude Code native build'],
    ['migrate-installer', 'Migrate from global npm to local installation'],
    ['setup-token', 'Set up a long-lived authentication token'],
  ];

  const maxCmdLen = Math.max(...commands.map(([cmd]) => (cmd ?? "").length));
  for (const entry of commands) { const cmd = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatCommand(padEnd(cmd, maxCmdLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('Options:'));
  const options = [
    ['-v, --version', 'Output the version number'],
    ['-h, --help', 'Display help for command'],
    ['-p, --print', 'Run in non-interactive (print) mode'],
    ['-c, --continue', 'Continue the most recent conversation'],
    ['-r, --resume <id>', 'Resume a specific conversation'],
    ['-m, --model <model>', 'Model to use for generation'],
    ['--verbose', 'Enable verbose output'],
    ['--debug', 'Enable debug mode'],
    ['--output-format <fmt>', 'Output format: text, json, stream-json'],
    ['--system-prompt <text>', 'Override system prompt'],
    ['--allowed-tools <list>', 'Comma-separated list of allowed tools'],
    ['--max-turns <n>', 'Maximum conversation turns'],
  ];

  const maxOptLen = Math.max(...options.map(([opt]) => (opt ?? "").length));
  for (const entry of options) { const opt = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatOption(padEnd(opt, maxOptLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('Examples:'));
  lines.push(`  ${formatDim('# Start interactive session')}`);
  lines.push('  claude');
  lines.push('');
  lines.push(`  ${formatDim('# Run a single prompt')}`);
  lines.push('  claude -p "Explain this error"');
  lines.push('');
  lines.push(`  ${formatDim('# List MCP servers')}`);
  lines.push('  claude mcp list');
  lines.push('');

  lines.push(formatHeader('Documentation:'));
  lines.push(`  ${PACKAGE_INFO.docs}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates help text for the MCP command.
 *
 * @returns Formatted help string
 */
export function generateMCPHelp(): string {
  const lines: string[] = [];

  lines.push(formatHeader('MCP - Model Context Protocol Server Management'));
  lines.push('');
  lines.push('Configure and manage MCP servers that extend Claude Code capabilities.');
  lines.push('');

  lines.push(formatHeader('Usage:'));
  lines.push('  claude mcp <command> [options]');
  lines.push('');

  lines.push(formatHeader('Commands:'));
  const commands = [
    ['serve', 'Start the Claude Code MCP server'],
    ['add', 'Add an MCP server configuration'],
    ['remove', 'Remove an MCP server'],
    ['list', 'List configured MCP servers'],
    ['get', 'Get details about an MCP server'],
    ['add-json', 'Add an MCP server with a JSON configuration'],
    ['add-from-claude-desktop', 'Import MCP servers from Claude Desktop'],
    ['reset-project-choices', 'Reset project-scoped server approvals'],
  ];

  const maxCmdLen = Math.max(...commands.map(([cmd]) => (cmd ?? "").length));
  for (const entry of commands) { const cmd = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatCommand(padEnd(cmd, maxCmdLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('MCP CLI Commands') + formatDim(' (within Claude Code session):'));
  const mcpCliCommands = [
    ['servers', 'List all connected MCP servers'],
    ['tools', 'List all available tools'],
    ['info', 'Get detailed information about a tool'],
    ['call', 'Invoke an MCP tool'],
    ['grep', 'Search tool names and descriptions'],
    ['resources', 'List MCP resources'],
    ['read', 'Read an MCP resource'],
  ];

  for (const entry of mcpCliCommands) { const cmd = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatCommand(padEnd(cmd, maxCmdLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('Add Examples:'));
  lines.push(`  ${formatDim('# Add HTTP server:')}`);
  lines.push('  claude mcp add --transport http sentry https://mcp.sentry.dev/mcp');
  lines.push('');
  lines.push(`  ${formatDim('# Add SSE server:')}`);
  lines.push('  claude mcp add --transport sse asana https://mcp.asana.com/sse');
  lines.push('');
  lines.push(`  ${formatDim('# Add stdio server:')}`);
  lines.push(
    '  claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY -- npx -y airtable-mcp-server'
  );
  lines.push('');

  lines.push(formatHeader('Options:'));
  const options = [
    ['-s, --scope <scope>', 'Configuration scope: local, user, or project'],
    ['-t, --transport <type>', 'Transport type: stdio, sse, http'],
    ['-e, --env <KEY=value>', 'Set environment variables (can be repeated)'],
    ['-H, --header <header>', 'Set HTTP headers (can be repeated)'],
    ['-h, --help', 'Display help for command'],
  ];

  const maxOptLen = Math.max(...options.map(([opt]) => (opt ?? "").length));
  for (const entry of options) { const opt = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatOption(padEnd(opt, maxOptLen + 2))} ${desc}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates help text for the plugin command.
 *
 * @returns Formatted help string
 */
export function generatePluginHelp(): string {
  const lines: string[] = [];

  lines.push(formatHeader('Plugin Management'));
  lines.push('');
  lines.push('Manage Claude Code plugins and marketplaces.');
  lines.push('');

  lines.push(formatHeader('Usage:'));
  lines.push('  claude plugin <command> [options]');
  lines.push('');

  lines.push(formatHeader('Commands:'));
  const commands = [
    ['validate <path>', 'Validate a plugin or marketplace manifest'],
    ['install <plugin>', 'Install a plugin from available marketplaces'],
    ['uninstall <plugin>', 'Uninstall an installed plugin'],
    ['enable <plugin>', 'Enable a disabled plugin'],
    ['disable <plugin>', 'Disable an enabled plugin'],
    ['marketplace', 'Manage plugin marketplaces'],
  ];

  const maxCmdLen = Math.max(...commands.map(([cmd]) => (cmd ?? "").length));
  for (const entry of commands) { const cmd = entry[0] ?? ""; const desc = entry[1] ?? ""
    lines.push(`  ${formatCommand(padEnd(cmd, maxCmdLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('Marketplace Subcommands:'));
  const marketplaceCommands = [
    ['marketplace add <source>', 'Add a marketplace from URL, path, or GitHub repo'],
    ['marketplace list', 'List all configured marketplaces'],
    ['marketplace remove <name>', 'Remove a configured marketplace'],
    ['marketplace update [name]', 'Update marketplace(s) from their source'],
  ];

  for (const [cmd, desc] of marketplaceCommands) { if (!cmd) continue;
    lines.push(`  ${formatCommand(padEnd(cmd, maxCmdLen + 2))} ${desc}`);
  }
  lines.push('');

  lines.push(formatHeader('Examples:'));
  lines.push(`  ${formatDim('# Validate a plugin manifest')}`);
  lines.push('  claude plugin validate ./my-plugin/manifest.json');
  lines.push('');
  lines.push(`  ${formatDim('# Install a plugin')}`);
  lines.push('  claude plugin install my-plugin@my-marketplace');
  lines.push('');
  lines.push(`  ${formatDim('# Add a GitHub marketplace')}`);
  lines.push('  claude plugin marketplace add owner/repo');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates help text for the doctor command.
 *
 * @returns Formatted help string
 */
export function generateDoctorHelp(): string {
  const lines: string[] = [];

  lines.push(formatHeader('Doctor - System Health Check'));
  lines.push('');
  lines.push('Check the health of your Claude Code installation and auto-updater.');
  lines.push('');

  lines.push(formatHeader('Usage:'));
  lines.push('  claude doctor');
  lines.push('');

  lines.push(formatHeader('Checks Performed:'));
  const checks = [
    'Node.js version compatibility',
    'npm installation status',
    'Authentication configuration',
    'MCP server connectivity',
    'Auto-updater status',
    'Configuration file validity',
  ];

  for (const check of checks) {
    lines.push(`  - ${check}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates help text for the update command.
 *
 * @returns Formatted help string
 */
export function generateUpdateHelp(): string {
  const lines: string[] = [];

  lines.push(formatHeader('Update - Check and Install Updates'));
  lines.push('');
  lines.push('Check for updates and install if available.');
  lines.push('');

  lines.push(formatHeader('Usage:'));
  lines.push('  claude update');
  lines.push('');

  lines.push(formatHeader('Options:'));
  lines.push(`  ${formatOption('-h, --help')}  Display help for command`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates help text for a specific command definition.
 *
 * @param command - Command definition to generate help for
 * @returns Formatted help string
 */
export function generateCommandHelp(command: CommandDefinition): string {
  const lines: string[] = [];

  lines.push(formatHeader(command.name));
  lines.push('');
  lines.push(command.description);
  lines.push('');

  // Usage
  lines.push(formatHeader('Usage:'));
  let usage = `  claude ${command.name}`;
  if (command.subcommands && command.subcommands.length > 0) {
    usage += ' <command>';
  }
  if (command.arguments && command.arguments.length > 0) {
    for (const arg of command.arguments) {
      usage += arg.required ? ` <${arg.name}>` : ` [${arg.name}]`;
      if (arg.variadic) {
        usage += '...';
      }
    }
  }
  usage += ' [options]';
  lines.push(usage);
  lines.push('');

  // Subcommands
  if (command.subcommands && command.subcommands.length > 0) {
    lines.push(formatHeader('Commands:'));
    const visibleSubcommands = command.subcommands.filter((sub) => !sub.hidden);
    const maxLen = Math.max(...visibleSubcommands.map((sub) => sub.name.length));

    for (const sub of visibleSubcommands) {
      lines.push(`  ${formatCommand(padEnd(sub.name, maxLen + 2))} ${sub.description}`);
    }
    lines.push('');
  }

  // Arguments
  if (command.arguments && command.arguments.length > 0) {
    lines.push(formatHeader('Arguments:'));
    const maxLen = Math.max(...command.arguments.map((arg) => arg.name.length));

    for (const arg of command.arguments) {
      const required = arg.required ? formatDim(' (required)') : '';
      lines.push(`  ${padEnd(arg.name, maxLen + 2)} ${arg.description}${required}`);
    }
    lines.push('');
  }

  // Options
  if (command.options && command.options.length > 0) {
    lines.push(formatHeader('Options:'));
    const optionStrs = command.options.map((opt) => {
      let str = '';
      if (opt.short) {
        str = `-${opt.short}, --${opt.name}`;
      } else {
        str = `--${opt.name}`;
      }
      if (opt.takesValue) {
        str += ` <${opt.name}>`;
      }
      return str;
    });

    const maxLen = Math.max(...optionStrs.map((s) => s.length));
    for (let i = 0; i < command.options.length; i++) {
      const opt = command.options[i];
      lines.push(`  ${formatOption(padEnd(optionStrs[i] ?? '', maxLen + 2))} ${opt?.description ?? ''}`);
    }
    lines.push('');
  }

  // Aliases
  if (command.aliases && command.aliases.length > 0) {
    lines.push(formatHeader('Aliases:'));
    lines.push(`  ${command.aliases.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates version text.
 *
 * @returns Formatted version string
 */
export function generateVersionText(): string {
  return `${VERSION} (Claude Code)`;
}
