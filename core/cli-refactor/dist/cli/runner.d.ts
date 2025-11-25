/**
 * CLI Runner
 *
 * Executes CLI commands by parsing arguments and routing to appropriate handlers.
 * Provides the main entry point for command execution.
 *
 * @module cli/runner
 */
import type { ParsedArgs, CommandContext, ExitCode } from './types.js';
/**
 * Main CLI runner entry point.
 * Parses arguments, routes to commands, and handles errors.
 *
 * @param argv - Command line arguments (defaults to process.argv.slice(2))
 * @returns Exit code
 */
export declare function run(argv?: string[]): Promise<ExitCode>;
/**
 * Runs the CLI and exits with the appropriate code.
 * This is the main entry point for the CLI executable.
 *
 * @param argv - Command line arguments
 */
export declare function runAndExit(argv?: string[]): Promise<never>;
/**
 * Parses and validates CLI arguments without executing.
 * Useful for testing and validation.
 *
 * @param argv - Command line arguments
 * @returns Parsed arguments and context
 */
export declare function parseAndValidate(argv: string[]): {
    args: ParsedArgs;
    context: CommandContext;
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=runner.d.ts.map