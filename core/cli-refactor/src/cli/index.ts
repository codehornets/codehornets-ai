/**
 * CLI Module
 *
 * Main entry point for the CLI module. Re-exports all public APIs
 * for argument parsing, command handling, and CLI execution.
 *
 * @module cli
 */

// Types
export type {
  // Core types
  ParsedArgs,
  CLIOptions,
  CommandContext,
  CommandHandler,
  CommandDefinition,
  OptionDefinition,
  ArgumentDefinition,

  // Format types
  OutputFormat,
  InputFormat,
  PermissionMode,

  // MCP types
  MCPTransportType,
  MCPScope,
  MCPState,
  MCPClient,
  MCPCapabilities,
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPCommandOptions,
  MCPServeOptions,
  MCPAddOptions,
  MCPCallOptions,
  ToolIdentifier,

  // Plugin types
  PluginCommandOptions,
  PluginValidationResult,
  ValidationIssue,
  MarketplaceSource,

  // Check types
  DoctorCheckResult,
  UpdateCheckResult,

  // Config types
  CLIConfig,

  // Exit code type
  ExitCode,
} from './types.js';

// Exit codes constant
export { ExitCodes } from './types.js';

// Parser functions
export {
  parseArgs,
  validateScope,
  validateTransport,
  validateOutputFormat,
  validateInputFormat,
  validatePermissionMode,
  parseEnvArgs,
  parseHeaderArgs,
  parseToolIdentifier,
  parseJSON,
  looksLikeUrl,
  extractSessionId,
} from './parser.js';

// Help generation
export {
  VERSION,
  PACKAGE_INFO,
  generateMainHelp,
  generateMCPHelp,
  generatePluginHelp,
  generateDoctorHelp,
  generateUpdateHelp,
  generateCommandHelp,
  generateVersionText,
} from './help.js';

// Command handlers
export {
  // MCP
  handleMCPCommand,
  handleMCPServe,
  handleMCPAdd,
  handleMCPRemove,
  handleMCPList,
  handleMCPGet,
  handleMCPAddJSON,
  handleMCPResetChoices,
  handleMCPServers,
  handleMCPTools,
  handleMCPInfo,
  handleMCPCall,
  handleMCPGrep,
  handleMCPResources,
  handleMCPRead,

  // Plugin
  handlePluginCommand,
  handlePluginValidate,
  handlePluginInstall,
  handlePluginUninstall,
  handlePluginEnable,
  handlePluginDisable,
  handleMarketplace,
  handleMarketplaceAdd,
  handleMarketplaceList,
  handleMarketplaceRemove,
  handleMarketplaceUpdate,

  // Doctor
  handleDoctorCommand,

  // Update
  handleUpdateCommand,
  handleInstallCommand,
  handleMigrateInstallerCommand,
  handleSetupTokenCommand,

  // Command utilities
  COMMAND_HANDLERS,
  VALID_COMMANDS,
  COMMAND_ALIASES,
  resolveCommand,
} from './commands/index.js';

// Runner
export {
  run,
  runAndExit,
  parseAndValidate,
} from './runner.js';

// Interactive mode
export {
  runInteractiveMode,
  runInteractiveSession,
  runSinglePrompt,
  hasApiKey,
  createClient,
} from './interactive.js';

export type { InteractiveOptions } from './interactive.js';

/**
 * Default export - the main run function.
 * Allows simple usage: `import cli from './cli.js'; cli()`
 */
export { run as default } from './runner.js';
