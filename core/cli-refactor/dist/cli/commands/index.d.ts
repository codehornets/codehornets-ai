/**
 * Command Exports
 *
 * Re-exports all command handlers for use by the CLI runner.
 *
 * @module cli/commands
 */
export { handleMCPCommand, handleMCPServe, handleMCPAdd, handleMCPRemove, handleMCPList, handleMCPGet, handleMCPAddJSON, handleMCPResetChoices, handleMCPServers, handleMCPTools, handleMCPInfo, handleMCPCall, handleMCPGrep, handleMCPResources, handleMCPRead, } from './mcp.js';
export { handlePluginCommand, handlePluginValidate, handlePluginInstall, handlePluginUninstall, handlePluginEnable, handlePluginDisable, handleMarketplace, handleMarketplaceAdd, handleMarketplaceList, handleMarketplaceRemove, handleMarketplaceUpdate, } from './plugin.js';
export { handleDoctorCommand } from './doctor.js';
export { handleUpdateCommand, handleInstallCommand, handleMigrateInstallerCommand, handleSetupTokenCommand, } from './update.js';
export { handleLoginCommand, handleLogoutCommand, handleAuthStatusCommand, } from './auth.js';
/**
 * Command name to handler mapping.
 * Used by the runner for command routing.
 */
export declare const COMMAND_HANDLERS: {
    readonly mcp: "handleMCPCommand";
    readonly plugin: "handlePluginCommand";
    readonly doctor: "handleDoctorCommand";
    readonly update: "handleUpdateCommand";
    readonly install: "handleInstallCommand";
    readonly 'migrate-installer': "handleMigrateInstallerCommand";
    readonly 'setup-token': "handleSetupTokenCommand";
    readonly login: "handleLoginCommand";
    readonly logout: "handleLogoutCommand";
    readonly auth: "handleAuthStatusCommand";
};
/**
 * List of valid top-level commands.
 */
export declare const VALID_COMMANDS: string[];
/**
 * Command aliases mapping.
 */
export declare const COMMAND_ALIASES: Record<string, string>;
/**
 * Resolves a command name, handling aliases.
 *
 * @param command - Command name or alias
 * @returns Resolved command name or undefined if not found
 */
export declare function resolveCommand(command: string): string | undefined;
//# sourceMappingURL=index.d.ts.map