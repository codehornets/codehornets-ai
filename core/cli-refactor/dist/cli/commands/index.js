/**
 * Command Exports
 *
 * Re-exports all command handlers for use by the CLI runner.
 *
 * @module cli/commands
 */
// MCP Command
export { handleMCPCommand, handleMCPServe, handleMCPAdd, handleMCPRemove, handleMCPList, handleMCPGet, handleMCPAddJSON, handleMCPResetChoices, handleMCPServers, handleMCPTools, handleMCPInfo, handleMCPCall, handleMCPGrep, handleMCPResources, handleMCPRead, } from './mcp.js';
// Plugin Command
export { handlePluginCommand, handlePluginValidate, handlePluginInstall, handlePluginUninstall, handlePluginEnable, handlePluginDisable, handleMarketplace, handleMarketplaceAdd, handleMarketplaceList, handleMarketplaceRemove, handleMarketplaceUpdate, } from './plugin.js';
// Doctor Command
export { handleDoctorCommand } from './doctor.js';
// Update Command
export { handleUpdateCommand, handleInstallCommand, handleMigrateInstallerCommand, handleSetupTokenCommand, } from './update.js';
// Auth Commands
export { handleLoginCommand, handleLogoutCommand, handleAuthStatusCommand, } from './auth.js';
/**
 * Command name to handler mapping.
 * Used by the runner for command routing.
 */
export const COMMAND_HANDLERS = {
    mcp: 'handleMCPCommand',
    plugin: 'handlePluginCommand',
    doctor: 'handleDoctorCommand',
    update: 'handleUpdateCommand',
    install: 'handleInstallCommand',
    'migrate-installer': 'handleMigrateInstallerCommand',
    'setup-token': 'handleSetupTokenCommand',
    login: 'handleLoginCommand',
    logout: 'handleLogoutCommand',
    auth: 'handleAuthStatusCommand',
};
/**
 * List of valid top-level commands.
 */
export const VALID_COMMANDS = Object.keys(COMMAND_HANDLERS);
/**
 * Command aliases mapping.
 */
export const COMMAND_ALIASES = {
    // Add aliases here if needed
    // e.g., 'doc': 'doctor',
    'signin': 'login',
    'signout': 'logout',
    'status': 'auth',
};
/**
 * Resolves a command name, handling aliases.
 *
 * @param command - Command name or alias
 * @returns Resolved command name or undefined if not found
 */
export function resolveCommand(command) {
    if (VALID_COMMANDS.includes(command)) {
        return command;
    }
    return COMMAND_ALIASES[command];
}
//# sourceMappingURL=index.js.map