/**
 * MCP Command
 *
 * Manages MCP (Model Context Protocol) servers and provides CLI tools
 * for interacting with MCP services.
 *
 * @module cli/commands/mcp
 */
import type { CommandContext, MCPAddOptions, MCPServeOptions, MCPCallOptions, ExitCode } from '../types.js';
/**
 * Handles the 'mcp serve' subcommand.
 * Starts the Claude Code MCP server.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPServe(args: string[], options: MCPServeOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp add' subcommand.
 * Adds an MCP server configuration.
 *
 * @param args - Positional arguments [name, commandOrUrl, ...extraArgs]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPAdd(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp remove' subcommand.
 * Removes an MCP server configuration.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPRemove(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp list' subcommand.
 * Lists all configured MCP servers.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPList(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp get' subcommand.
 * Gets details about a specific MCP server.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPGet(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp add-json' subcommand.
 * Adds an MCP server with a JSON configuration string.
 *
 * @param args - Positional arguments [name, json]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPAddJSON(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp reset-project-choices' subcommand.
 * Resets all approved and rejected project-scoped servers.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPResetChoices(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
/**
 * Handles the 'mcp servers' CLI command.
 * Lists all connected MCP servers.
 *
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPServers(options: {
    json?: boolean;
}): Promise<ExitCode>;
/**
 * Handles the 'mcp tools' CLI command.
 * Lists all available MCP tools.
 *
 * @param serverFilter - Optional server name filter
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPTools(serverFilter: string | undefined, options: {
    json?: boolean;
}): Promise<ExitCode>;
/**
 * Handles the 'mcp info' CLI command.
 * Gets detailed information about a tool.
 *
 * @param toolId - Tool identifier (server/tool)
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPInfo(toolId: string, options: {
    json?: boolean;
}): Promise<ExitCode>;
/**
 * Handles the 'mcp call' CLI command.
 * Invokes an MCP tool.
 *
 * @param toolId - Tool identifier (server/tool)
 * @param argsJson - Tool arguments as JSON string or "-" for stdin
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPCall(toolId: string, argsJson: string, options: MCPCallOptions): Promise<ExitCode>;
/**
 * Handles the 'mcp grep' CLI command.
 * Searches tool names and descriptions.
 *
 * @param pattern - Regex pattern to search
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPGrep(pattern: string, options: {
    json?: boolean;
    ignoreCase?: boolean;
}): Promise<ExitCode>;
/**
 * Handles the 'mcp resources' CLI command.
 * Lists MCP resources.
 *
 * @param serverFilter - Optional server name filter
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPResources(serverFilter: string | undefined, options: {
    json?: boolean;
}): Promise<ExitCode>;
/**
 * Handles the 'mcp read' CLI command.
 * Reads an MCP resource.
 *
 * @param resourceId - Resource identifier (server/resource) or server
 * @param uri - Optional direct resource URI
 * @param options - Command options
 * @returns Exit code
 */
export declare function handleMCPRead(resourceId: string, uri: string | undefined, options: MCPCallOptions): Promise<ExitCode>;
/**
 * Main MCP command handler.
 * Routes to appropriate subcommand handler.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleMCPCommand(args: string[], options: MCPAddOptions, context: CommandContext): Promise<ExitCode>;
//# sourceMappingURL=mcp.d.ts.map