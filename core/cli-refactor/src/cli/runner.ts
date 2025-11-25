/**
 * CLI Runner
 *
 * Executes CLI commands by parsing arguments and routing to appropriate handlers.
 * Provides the main entry point for command execution.
 *
 * @module cli/runner
 */

import type {
  ParsedArgs,
  CLIOptions,
  CommandContext,
  ExitCode,
} from './types.js';
import { ExitCodes } from './types.js';
import { parseArgs } from './parser.js';
import {
  generateMainHelp,
  generateVersionText,
  generateMCPHelp,
  generatePluginHelp,
  generateDoctorHelp,
  generateUpdateHelp,
} from './help.js';
import {
  handleMCPCommand,
  handlePluginCommand,
  handleDoctorCommand,
  handleUpdateCommand,
  handleInstallCommand,
  handleMigrateInstallerCommand,
  handleSetupTokenCommand,
  handleLoginCommand,
  handleLogoutCommand,
  handleAuthStatusCommand,
  VALID_COMMANDS,
  resolveCommand,
} from './commands/index.js';
import { runInteractiveMode } from './interactive.js';

/**
 * Console output utilities.
 */
const output = {
  error: (msg: string) => console.error(`\x1B[31m${msg}\x1B[0m`),
  success: (msg: string) => console.log(`\x1B[32m${msg}\x1B[0m`),
  warn: (msg: string) => console.warn(`\x1B[33m${msg}\x1B[0m`),
  info: (msg: string) => console.log(msg),
};

/**
 * Creates the command execution context.
 *
 * @param args - Parsed arguments
 * @returns Command context
 */
function createContext(args: ParsedArgs): CommandContext {
  return {
    cwd: process.cwd(),
    args,
    exitCode: 0,
    isCI: !!(
      process.env.CI ||
      process.env.CONTINUOUS_INTEGRATION ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.TRAVIS
    ),
    isTTY: process.stdout.isTTY ?? false,
    env: process.env as Record<string, string | undefined>,
  };
}

/**
 * Handles the main interactive mode (no command specified).
 * This launches the interactive Claude Code session.
 *
 * @param args - Parsed arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
async function handleInteractiveMode(
  args: ParsedArgs,
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  // Handle print mode (-p flag)
  if (options.print) {
    // Non-interactive print mode
    const prompt = options.prompt || args.positionals.join(' ');
    if (!prompt) {
      output.error('Error: No prompt provided for print mode.');
      output.info('Usage: claude -p "Your prompt here"');
      return ExitCodes.INVALID_ARGS;
    }

    return runInteractiveMode(prompt, {
      model: options.model,
      systemPrompt: options.systemPrompt,
    });
  }

  // Handle continue mode (--continue flag)
  if (options.continue) {
    output.info('Continuing most recent conversation...');
    output.warn('Warning: Continue mode not yet fully implemented - starting fresh session');
    // TODO: Load and continue previous conversation
    return runInteractiveMode(undefined, {
      model: options.model,
      systemPrompt: options.systemPrompt,
    });
  }

  // Handle resume mode (--resume flag)
  if (options.resume) {
    const sessionId = typeof options.resume === 'string' ? options.resume : 'latest';
    output.info(`Resuming session: ${sessionId}`);
    output.warn('Warning: Resume mode not yet fully implemented - starting fresh session');
    // TODO: Load and resume specific session
    return runInteractiveMode(undefined, {
      model: options.model,
      systemPrompt: options.systemPrompt,
    });
  }

  // Default interactive mode - start REPL
  return runInteractiveMode(undefined, {
    model: options.model,
    systemPrompt: options.systemPrompt,
  });
}

/**
 * Routes to the appropriate command handler based on parsed arguments.
 *
 * @param args - Parsed arguments
 * @param context - Command context
 * @returns Exit code
 */
async function routeCommand(
  args: ParsedArgs,
  context: CommandContext
): Promise<ExitCode> {
  const { command, subcommand, positionals, options } = args;

  // Handle version flag
  if (options.version) {
    console.log(generateVersionText());
    return ExitCodes.SUCCESS;
  }

  // Handle help flag with no command
  if (options.help && !command) {
    console.log(generateMainHelp());
    return ExitCodes.SUCCESS;
  }

  // No command specified - interactive mode or prompt
  if (!command) {
    return handleInteractiveMode(args, options, context);
  }

  // Resolve command (handle aliases)
  const resolvedCommand = resolveCommand(command);

  if (!resolvedCommand) {
    // Check if this might be a prompt instead of a command
    if (!command.startsWith('-')) {
      // Treat as prompt if not a recognized command
      args.positionals = [command, ...(subcommand ? [subcommand] : []), ...positionals];
      return handleInteractiveMode(args, options, context);
    }

    output.error(`Unknown command: ${command}`);
    output.info('');
    output.info('Run `claude --help` to see available commands.');
    return ExitCodes.INVALID_ARGS;
  }

  // Build subcommand arguments
  const subArgs = subcommand ? [subcommand, ...positionals] : positionals;

  // Route to appropriate handler
  switch (resolvedCommand) {
    case 'mcp':
      return handleMCPCommand(subArgs, options, context);

    case 'plugin':
      return handlePluginCommand(subArgs, options, context);

    case 'doctor':
      return handleDoctorCommand(subArgs, options, context);

    case 'update':
      return handleUpdateCommand(subArgs, options, context);

    case 'install':
      return handleInstallCommand(subArgs, options as CLIOptions & { force?: boolean }, context);

    case 'migrate-installer':
      return handleMigrateInstallerCommand(subArgs, options, context);

    case 'setup-token':
      return handleSetupTokenCommand(subArgs, options, context);

    case 'login':
      return handleLoginCommand(subArgs, options, context);

    case 'logout':
      return handleLogoutCommand(subArgs, options, context);

    case 'auth':
      return handleAuthStatusCommand(subArgs, options, context);

    default:
      output.error(`Command not implemented: ${resolvedCommand}`);
      return ExitCodes.ERROR;
  }
}

/**
 * Sets up signal handlers for graceful shutdown.
 */
function setupSignalHandlers(): void {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down...');
    process.exit(ExitCodes.INTERRUPTED);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    process.exit(ExitCodes.INTERRUPTED);
  });

  // Ensure cursor is restored on exit
  process.on('exit', () => {
    // Show cursor if it was hidden
    if (process.stdout.isTTY) {
      process.stdout.write('\x1B[?25h');
    }
  });
}

/**
 * Handles uncaught errors.
 *
 * @param error - The error that was thrown
 */
function handleError(error: unknown): ExitCode {
  const message = error instanceof Error ? error.message : String(error);

  output.error(`Error: ${message}`);

  if (process.env.DEBUG || process.env.CLAUDE_DEBUG) {
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }

  return ExitCodes.ERROR;
}

/**
 * Main CLI runner entry point.
 * Parses arguments, routes to commands, and handles errors.
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Exit code
 */
export async function run(argv: string[] = process.argv.slice(2)): Promise<ExitCode> {
  setupSignalHandlers();

  try {
    // Parse arguments
    const args = parseArgs(argv);
    const context = createContext(args);

    // Enable verbose/debug output if requested
    if (args.options.verbose) {
      process.env.VERBOSE = 'true';
    }
    if (args.options.debug) {
      process.env.DEBUG = 'true';
    }

    // Route and execute command
    return await routeCommand(args, context);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Runs the CLI and exits with the appropriate code.
 * This is the main entry point for the CLI executable.
 *
 * @param argv - Command line arguments
 */
export async function runAndExit(argv?: string[]): Promise<never> {
  const exitCode = await run(argv);
  process.exit(exitCode);
}

/**
 * Parses and validates CLI arguments without executing.
 * Useful for testing and validation.
 *
 * @param argv - Command line arguments
 * @returns Parsed arguments and context
 */
export function parseAndValidate(argv: string[]): {
  args: ParsedArgs;
  context: CommandContext;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const args = parseArgs(argv);
    const context = createContext(args);

    // Validate command if specified
    if (args.command) {
      const resolved = resolveCommand(args.command);
      if (!resolved && args.command.startsWith('-')) {
        errors.push(`Unknown command: ${args.command}`);
      }
    }

    // Validate option combinations
    if (args.options.inputFormat === 'stream-json' && args.options.outputFormat !== 'stream-json') {
      errors.push('--input-format=stream-json requires --output-format=stream-json');
    }

    return {
      args,
      context,
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      args: { positionals: [], options: {} },
      context: createContext({ positionals: [], options: {} }),
      isValid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
