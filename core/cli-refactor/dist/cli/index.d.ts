/**
 * CLI Module
 *
 * Main entry point for the CLI module. Re-exports all public APIs
 * for argument parsing, command handling, and CLI execution.
 *
 * @module cli
 */
export type { ParsedArgs, CLIOptions, CommandContext, CommandHandler, CommandDefinition, OptionDefinition, ArgumentDefinition, OutputFormat, InputFormat, PermissionMode, MCPTransportType, MCPScope, MCPState, MCPClient, MCPCapabilities, MCPServerConfig, MCPTool, MCPResource, MCPCommandOptions, MCPServeOptions, MCPAddOptions, MCPCallOptions, ToolIdentifier, PluginCommandOptions, PluginValidationResult, ValidationIssue, MarketplaceSource, DoctorCheckResult, UpdateCheckResult, CLIConfig, ExitCode, } from './types.js';
export { ExitCodes } from './types.js';
export { parseArgs, validateScope, validateTransport, validateOutputFormat, validateInputFormat, validatePermissionMode, parseEnvArgs, parseHeaderArgs, parseToolIdentifier, parseJSON, looksLikeUrl, extractSessionId, } from './parser.js';
export { VERSION, PACKAGE_INFO, generateMainHelp, generateMCPHelp, generatePluginHelp, generateDoctorHelp, generateUpdateHelp, generateCommandHelp, generateVersionText, } from './help.js';
export { handleMCPCommand, handleMCPServe, handleMCPAdd, handleMCPRemove, handleMCPList, handleMCPGet, handleMCPAddJSON, handleMCPResetChoices, handleMCPServers, handleMCPTools, handleMCPInfo, handleMCPCall, handleMCPGrep, handleMCPResources, handleMCPRead, handlePluginCommand, handlePluginValidate, handlePluginInstall, handlePluginUninstall, handlePluginEnable, handlePluginDisable, handleMarketplace, handleMarketplaceAdd, handleMarketplaceList, handleMarketplaceRemove, handleMarketplaceUpdate, handleDoctorCommand, handleUpdateCommand, handleInstallCommand, handleMigrateInstallerCommand, handleSetupTokenCommand, COMMAND_HANDLERS, VALID_COMMANDS, COMMAND_ALIASES, resolveCommand, } from './commands/index.js';
export { run, runAndExit, parseAndValidate, } from './runner.js';
export { runInteractiveMode, runInteractiveSession, runSinglePrompt, hasApiKey, createClient, } from './interactive.js';
export type { InteractiveOptions } from './interactive.js';
/**
 * Default export - the main run function.
 * Allows simple usage: `import cli from './cli.js'; cli()`
 */
export { run as default } from './runner.js';
//# sourceMappingURL=index.d.ts.map