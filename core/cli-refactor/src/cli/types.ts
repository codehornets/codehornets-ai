/**
 * CLI Types and Interfaces
 *
 * TypeScript interfaces for CLI argument parsing, command options,
 * and execution context.
 *
 * @module cli/types
 */

/**
 * Supported output format types for command results.
 */
export type OutputFormat = 'text' | 'json' | 'stream-json';

/**
 * Supported input format types for command input.
 */
export type InputFormat = 'text' | 'stream-json';

/**
 * Permission mode for tool execution.
 */
export type PermissionMode = 'default' | 'bypassPermissions' | 'plan';

/**
 * MCP transport types for server connections.
 */
export type MCPTransportType = 'stdio' | 'sse' | 'http';

/**
 * MCP configuration scope levels.
 */
export type MCPScope = 'local' | 'user' | 'project';

/**
 * Base interface for parsed CLI arguments.
 */
export interface ParsedArgs {
  /** Command name if specified */
  command?: string;
  /** Subcommand name if specified */
  subcommand?: string;
  /** Positional arguments */
  positionals: string[];
  /** Flag options */
  options: CLIOptions;
}

/**
 * Global CLI options applicable to all commands.
 */
export interface CLIOptions {
  /** Print version and exit */
  version?: boolean;
  /** Print help and exit */
  help?: boolean;
  /** Enable verbose output */
  verbose?: boolean;
  /** Enable debug mode */
  debug?: boolean;
  /** Debug output to stderr */
  debugStderr?: boolean;
  /** Output format */
  outputFormat?: OutputFormat;
  /** Input format */
  inputFormat?: InputFormat;
  /** Run in print mode (non-interactive) */
  print?: boolean;
  /** Model to use */
  model?: string;
  /** Fallback model */
  fallbackModel?: string;
  /** Permission mode */
  permissionMode?: PermissionMode;
  /** Continue previous conversation */
  continue?: boolean;
  /** Resume specific session */
  resume?: string | boolean;
  /** Initial prompt */
  prompt?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Append to system prompt */
  appendSystemPrompt?: string;
  /** Allowed tools list */
  allowedTools?: string[];
  /** Disallowed tools list */
  disallowedTools?: string[];
  /** Maximum turns */
  maxTurns?: number;
  /** Maximum thinking tokens */
  maxThinkingTokens?: number;
  /** JSON output format */
  json?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Fork session instead of continuing */
  forkSession?: boolean;
}

/**
 * MCP command options.
 */
export interface MCPCommandOptions extends CLIOptions {
  /** Configuration scope */
  scope?: MCPScope;
  /** Transport type */
  transport?: MCPTransportType;
  /** Environment variables */
  env?: string[];
  /** HTTP headers */
  headers?: string[];
}

/**
 * MCP serve subcommand options.
 */
export interface MCPServeOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * MCP add subcommand options.
 */
export interface MCPAddOptions {
  /** Configuration scope */
  scope?: MCPScope;
  /** Transport type */
  transport?: MCPTransportType;
  /** Environment variables */
  env?: string[];
  /** HTTP headers */
  header?: string[];
  /** Show help */
  help?: boolean;
  /** Output in JSON format */
  json?: boolean;
  /** Case-insensitive search */
  ignoreCase?: boolean;
}

/**
 * MCP tool call options.
 */
export interface MCPCallOptions {
  /** Output in JSON format */
  json?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Show debug output */
  debug?: boolean;
}

/**
 * MCP CLI state containing server and tool information.
 */
export interface MCPState {
  /** Connected MCP clients */
  clients: MCPClient[];
  /** Server configurations */
  configs: Record<string, MCPServerConfig>;
  /** Available tools */
  tools: MCPTool[];
  /** Available resources by server */
  resources: Record<string, MCPResource[]>;
}

/**
 * MCP client connection status.
 */
export interface MCPClient {
  /** Server name */
  name: string;
  /** Connection type/status */
  type: 'connected' | 'failed' | 'connecting' | 'disconnected';
  /** Server capabilities (when connected) */
  capabilities?: MCPCapabilities;
  /** Error message (when failed) */
  error?: string;
}

/**
 * MCP server capabilities.
 */
export interface MCPCapabilities {
  /** Server supports tools */
  tools?: boolean;
  /** Server supports resources */
  resources?: boolean;
  /** Server supports prompts */
  prompts?: boolean;
}

/**
 * MCP server configuration.
 */
export interface MCPServerConfig {
  /** Transport type */
  type: MCPTransportType;
  /** Command (for stdio) */
  command?: string;
  /** Arguments (for stdio) */
  args?: string[];
  /** Environment variables (for stdio) */
  env?: Record<string, string>;
  /** URL (for sse/http) */
  url?: string;
  /** Headers (for sse/http) */
  headers?: Record<string, string>;
  /** Configuration scope */
  scope?: MCPScope;
}

/**
 * MCP tool definition.
 */
export interface MCPTool {
  /** Full tool name (mcp__server__tool) */
  name: string;
  /** Tool description */
  description: string;
  /** JSON schema for input parameters */
  inputJSONSchema: Record<string, unknown>;
  /** Whether this is an MCP tool */
  isMcp: boolean;
  /** Server name */
  server: string;
}

/**
 * MCP resource definition.
 */
export interface MCPResource {
  /** Resource name */
  name?: string;
  /** Resource URI */
  uri: string;
  /** Server name */
  server: string;
  /** MIME type */
  mimeType?: string;
}

/**
 * Plugin command options.
 */
export interface PluginCommandOptions extends CLIOptions {
  /** Plugin identifier */
  plugin?: string;
}

/**
 * Plugin validation result.
 */
export interface PluginValidationResult {
  /** Whether validation passed */
  success: boolean;
  /** File type (plugin or marketplace) */
  fileType: 'plugin' | 'marketplace';
  /** File path validated */
  filePath: string;
  /** Validation errors */
  errors: ValidationIssue[];
  /** Validation warnings */
  warnings: ValidationIssue[];
}

/**
 * Validation issue (error or warning).
 */
export interface ValidationIssue {
  /** Path within the manifest */
  path: string;
  /** Issue message */
  message: string;
}

/**
 * Marketplace source configuration.
 */
export interface MarketplaceSource {
  /** Source type */
  source: 'github' | 'git' | 'url' | 'directory' | 'file';
  /** Repository (for github) */
  repo?: string;
  /** URL (for git/url) */
  url?: string;
  /** Path (for directory/file) */
  path?: string;
}

/**
 * Doctor check result.
 */
export interface DoctorCheckResult {
  /** Check name */
  name: string;
  /** Check passed */
  passed: boolean;
  /** Status message */
  message: string;
  /** Additional details */
  details?: string;
}

/**
 * Update check result.
 */
export interface UpdateCheckResult {
  /** Current version */
  currentVersion: string;
  /** Latest available version */
  latestVersion: string;
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Release notes URL */
  releaseNotesUrl?: string;
}

/**
 * Command execution context.
 */
export interface CommandContext {
  /** Working directory */
  cwd: string;
  /** Parsed arguments */
  args: ParsedArgs;
  /** Exit code to return */
  exitCode: number;
  /** Whether running in CI environment */
  isCI: boolean;
  /** Whether terminal is TTY */
  isTTY: boolean;
  /** Environment variables */
  env: Record<string, string | undefined>;
}

/**
 * Command handler function signature.
 */
export type CommandHandler<T extends CLIOptions = CLIOptions> = (
  args: string[],
  options: T,
  context: CommandContext
) => Promise<number>;

/**
 * Command definition for registration.
 */
export interface CommandDefinition<T extends CLIOptions = CLIOptions> {
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command aliases */
  aliases?: string[];
  /** Subcommands */
  subcommands?: CommandDefinition[];
  /** Command handler */
  handler?: CommandHandler<T>;
  /** Option definitions */
  options?: OptionDefinition[];
  /** Argument definitions */
  arguments?: ArgumentDefinition[];
  /** Whether command is hidden from help */
  hidden?: boolean;
}

/**
 * Command option definition.
 */
export interface OptionDefinition {
  /** Option name (long form) */
  name: string;
  /** Option short form */
  short?: string;
  /** Option description */
  description: string;
  /** Whether option takes a value */
  takesValue?: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Whether option is required */
  required?: boolean;
  /** Whether option can be specified multiple times */
  multiple?: boolean;
}

/**
 * Command argument definition.
 */
export interface ArgumentDefinition {
  /** Argument name */
  name: string;
  /** Argument description */
  description: string;
  /** Whether argument is required */
  required?: boolean;
  /** Whether argument accepts multiple values */
  variadic?: boolean;
}

/**
 * Tool identifier parsed from server/tool format.
 */
export interface ToolIdentifier {
  /** Server name */
  server: string;
  /** Tool name */
  tool: string;
}

/**
 * CLI configuration loaded from file.
 */
export interface CLIConfig {
  /** Configured MCP servers */
  mcpServers?: Record<string, MCPServerConfig>;
  /** Enabled MCP servers from .mcp.json */
  enabledMcpjsonServers?: string[];
  /** Disabled MCP servers from .mcp.json */
  disabledMcpjsonServers?: string[];
  /** Enable all project MCP servers */
  enableAllProjectMcpServers?: boolean;
  /** Default model */
  model?: string;
  /** Verbose mode */
  verbose?: boolean;
}

/**
 * Exit codes for CLI operations.
 */
export const ExitCodes = {
  /** Successful execution */
  SUCCESS: 0,
  /** General error */
  ERROR: 1,
  /** Invalid arguments */
  INVALID_ARGS: 2,
  /** Command not found */
  NOT_FOUND: 127,
  /** Interrupted (SIGINT) */
  INTERRUPTED: 130,
} as const;

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes];
