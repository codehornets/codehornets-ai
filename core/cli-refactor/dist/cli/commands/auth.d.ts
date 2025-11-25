/**
 * Authentication Commands
 *
 * Handles login, logout, and auth status commands.
 *
 * @module cli/commands/auth
 */
import type { CLIOptions, ExitCode, CommandContext } from '../types.js';
/**
 * Handles the login command.
 * Opens browser for OAuth authentication.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export declare function handleLoginCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the logout command.
 * Clears stored OAuth tokens.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export declare function handleLogoutCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the auth status command.
 * Shows current authentication status.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export declare function handleAuthStatusCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
//# sourceMappingURL=auth.d.ts.map