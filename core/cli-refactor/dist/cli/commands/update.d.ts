/**
 * Update Command
 *
 * Checks for available updates and installs them.
 * Supports both npm-based and local installation updates.
 *
 * @module cli/commands/update
 */
import type { CommandContext, CLIOptions, ExitCode } from '../types.js';
/**
 * Main update command handler.
 * Checks for updates and optionally installs them.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleUpdateCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'install' command.
 * Installs Claude Code native build with optional target version.
 *
 * @param args - Positional arguments [target?]
 * @param options - Command options (including force)
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleInstallCommand(args: string[], options: CLIOptions & {
    force?: boolean;
}, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'migrate-installer' command.
 * Migrates from global npm installation to local installation.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMigrateInstallerCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'setup-token' command.
 * Sets up long-lived authentication token.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleSetupTokenCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
//# sourceMappingURL=update.d.ts.map