/**
 * Plugin Command
 *
 * Manages Claude Code plugins and marketplaces.
 * Supports plugin installation, validation, and marketplace configuration.
 *
 * @module cli/commands/plugin
 */
import type { CommandContext, CLIOptions, ExitCode } from '../types.js';
/**
 * Handles the 'plugin validate' subcommand.
 * Validates a plugin or marketplace manifest.
 *
 * @param args - Positional arguments [path]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginValidate(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin install' subcommand.
 * Installs a plugin from available marketplaces.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginInstall(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin uninstall' subcommand.
 * Uninstalls an installed plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginUninstall(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin enable' subcommand.
 * Enables a disabled plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginEnable(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin disable' subcommand.
 * Disables an enabled plugin.
 *
 * @param args - Positional arguments [plugin]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginDisable(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin marketplace add' subcommand.
 * Adds a marketplace from a URL, path, or GitHub repo.
 *
 * @param args - Positional arguments [source]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMarketplaceAdd(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin marketplace list' subcommand.
 * Lists all configured marketplaces.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMarketplaceList(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin marketplace remove' subcommand.
 * Removes a configured marketplace.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMarketplaceRemove(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin marketplace update' subcommand.
 * Updates marketplace(s) from their source.
 *
 * @param args - Positional arguments [name?]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMarketplaceUpdate(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'plugin marketplace' subcommand router.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMarketplace(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Main plugin command handler.
 * Routes to appropriate subcommand handler.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handlePluginCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
//# sourceMappingURL=plugin.d.ts.map