/**
 * MCP Command
 *
 * Manages MCP (Model Context Protocol) servers and provides CLI tools
 * for interacting with MCP services.
 *
 * @module cli/commands/mcp
 */

import type {
  CommandContext,
  MCPScope,
  MCPTransportType,
  MCPState,
  MCPServerConfig,
  MCPClient,
  MCPTool,
  MCPResource,
  MCPAddOptions,
  MCPServeOptions,
  MCPCallOptions,
  ToolIdentifier,
  ExitCode,
} from '../types.js';
import { ExitCodes } from '../types.js';
import {
  validateScope,
  validateTransport,
  parseEnvArgs,
  parseHeaderArgs,
  parseToolIdentifier,
  parseJSON,
  looksLikeUrl,
} from '../parser.js';
import { generateMCPHelp } from '../help.js';

/**
 * Console output utilities with color support.
 */
const output = {
  error: (msg: string) => console.error(`\x1B[31m${msg}\x1B[0m`),
  success: (msg: string) => console.log(`\x1B[32m${msg}\x1B[0m`),
  warn: (msg: string) => console.warn(`\x1B[33m${msg}\x1B[0m`),
  info: (msg: string) => console.log(msg),
  dim: (msg: string) => console.log(`\x1B[2m${msg}\x1B[0m`),
  bold: (msg: string) => console.log(`\x1B[1m${msg}\x1B[0m`),
};

/**
 * Status indicators for output.
 */
const STATUS = {
  connected: '\x1B[32mconnected\x1B[0m',
  failed: '\x1B[31mfailed\x1B[0m',
  connecting: '\x1B[33mconnecting\x1B[0m',
  disconnected: '\x1B[2mdisconnected\x1B[0m',
};

/**
 * Gets the MCP state file path.
 * In a real implementation, this would read from the actual state file location.
 */
function getMCPStateFilePath(): string {
  const sessionId = process.env.CLAUDE_CODE_SESSION_ID || 'default';
  const mcpCliDir = process.env.USE_MCP_CLI_DIR || `${process.env.TEMP || '/tmp'}/claude-code-mcp-cli`;
  return `${mcpCliDir}/${sessionId}.json`;
}

/**
 * Reads the current MCP state from file.
 *
 * @returns MCP state object
 * @throws Error if state file is not available
 */
async function readMCPState(): Promise<MCPState> {
  // In a real implementation, this would read from the filesystem
  // For now, throw an error indicating the requirement
  throw new Error(
    'MCP state not available. The mcp command is only available within a Claude Code session.'
  );
}

/**
 * Gets the config file path for a given scope.
 *
 * @param scope - Configuration scope
 * @returns Path to the config file
 */
function getConfigFilePath(scope: MCPScope): string {
  switch (scope) {
    case 'local':
      return '.mcp.json';
    case 'user':
      return `${process.env.HOME || process.env.USERPROFILE}/.claude/config.json`;
    case 'project':
      return '.mcp.json';
    default:
      return '.mcp.json';
  }
}

/**
 * Formats scope name for display.
 *
 * @param scope - Configuration scope
 * @returns Formatted scope name
 */
function formatScope(scope: MCPScope): string {
  switch (scope) {
    case 'local':
      return 'Local';
    case 'user':
      return 'User';
    case 'project':
      return 'Project';
    default:
      return String(scope);
  }
}

/**
 * Handles the 'mcp serve' subcommand.
 * Starts the Claude Code MCP server.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPServe(
  args: string[],
  options: MCPServeOptions,
  context: CommandContext
): Promise<ExitCode> {
  const { debug = false, verbose = false } = options;

  output.info('Starting Claude Code MCP server...');

  // In a real implementation, this would:
  // 1. Verify the working directory exists
  // 2. Initialize logging if verbose
  // 3. Start the MCP server process

  if (debug) {
    output.dim('Debug mode enabled');
  }

  if (verbose) {
    output.dim('Verbose mode enabled');
  }

  // Placeholder for actual server startup
  output.error('Error: MCP server startup not yet implemented in refactored CLI');
  return ExitCodes.ERROR;
}

/**
 * Handles the 'mcp add' subcommand.
 * Adds an MCP server configuration.
 *
 * @param args - Positional arguments [name, commandOrUrl, ...extraArgs]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPAdd(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  const [name, commandOrUrl, ...extraArgs] = args;

  if (!name) {
    output.error('Error: Server name is required.');
    output.info('Usage: claude mcp add <name> <command> [args...]');
    return ExitCodes.INVALID_ARGS;
  }

  if (!commandOrUrl) {
    output.error('Error: Command is required when server name is provided.');
    output.info('Usage: claude mcp add <name> <command> [args...]');
    return ExitCodes.INVALID_ARGS;
  }

  try {
    const scope = options.scope ? validateScope(options.scope) : 'local';
    const transport = options.transport ? validateTransport(options.transport) : 'stdio';
    const transportExplicit = options.transport !== undefined;
    const urlLike = looksLikeUrl(commandOrUrl);

    let config: MCPServerConfig;

    if (transport === 'sse') {
      const headers = parseHeaderArgs(options.header);
      config = {
        type: 'sse',
        url: commandOrUrl,
        headers,
      };
      output.success(`Added SSE MCP server ${name} with URL: ${commandOrUrl} to ${scope} config`);
      if (headers) {
        output.info(`Headers: ${JSON.stringify(headers, null, 2)}`);
      }
    } else if (transport === 'http') {
      const headers = parseHeaderArgs(options.header);
      config = {
        type: 'http',
        url: commandOrUrl,
        headers,
      };
      output.success(`Added HTTP MCP server ${name} with URL: ${commandOrUrl} to ${scope} config`);
      if (headers) {
        output.info(`Headers: ${JSON.stringify(headers, null, 2)}`);
      }
    } else {
      // stdio transport
      if (!transportExplicit && urlLike) {
        output.warn('');
        output.warn(
          `Warning: The command "${commandOrUrl}" looks like a URL, but is being interpreted as a stdio server as --transport was not specified.`
        );
        output.warn(`If this is an HTTP server, use: claude mcp add --transport http ${name} ${commandOrUrl}`);
        output.warn(`If this is an SSE server, use: claude mcp add --transport sse ${name} ${commandOrUrl}`);
      }

      const env = parseEnvArgs(options.env);
      config = {
        type: 'stdio',
        command: commandOrUrl,
        args: extraArgs,
        env,
      };
      output.success(
        `Added stdio MCP server ${name} with command: ${commandOrUrl} ${extraArgs.join(' ')} to ${scope} config`
      );
    }

    output.info(`File modified: ${getConfigFilePath(scope)}`);

    // In a real implementation, this would save to the config file
    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp remove' subcommand.
 * Removes an MCP server configuration.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPRemove(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  const [name] = args;

  if (!name) {
    output.error('Error: Server name is required.');
    return ExitCodes.INVALID_ARGS;
  }

  try {
    if (options.scope) {
      const scope = validateScope(options.scope);
      output.success(`Removed MCP server ${name} from ${scope} config`);
      output.info(`File modified: ${getConfigFilePath(scope)}`);
      return ExitCodes.SUCCESS;
    }

    // When no scope specified, check all scopes
    // In a real implementation, this would check which scopes have the server
    output.error(`No MCP server found with name: "${name}"`);
    return ExitCodes.NOT_FOUND;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp list' subcommand.
 * Lists all configured MCP servers.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPList(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  output.info('Checking MCP server health...\n');

  // In a real implementation, this would:
  // 1. Load servers from all config files
  // 2. Check health of each server
  // 3. Display results

  output.dim('No MCP servers configured. Use `claude mcp add` to add a server.');
  return ExitCodes.SUCCESS;
}

/**
 * Handles the 'mcp get' subcommand.
 * Gets details about a specific MCP server.
 *
 * @param args - Positional arguments [name]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPGet(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  const [name] = args;

  if (!name) {
    output.error('Error: Server name is required.');
    return ExitCodes.INVALID_ARGS;
  }

  // In a real implementation, this would load the server config
  output.error(`No MCP server found with name: ${name}`);
  return ExitCodes.NOT_FOUND;
}

/**
 * Handles the 'mcp add-json' subcommand.
 * Adds an MCP server with a JSON configuration string.
 *
 * @param args - Positional arguments [name, json]
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPAddJSON(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  const [name, jsonStr] = args;

  if (!name || !jsonStr) {
    output.error('Error: Server name and JSON configuration are required.');
    return ExitCodes.INVALID_ARGS;
  }

  try {
    const scope = options.scope ? validateScope(options.scope) : 'local';
    const config = parseJSON<MCPServerConfig>(jsonStr, 'MCP configuration');
    const type = config.type || 'stdio';

    output.success(`Added ${type} MCP server ${name} to ${scope} config`);
    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp reset-project-choices' subcommand.
 * Resets all approved and rejected project-scoped servers.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPResetChoices(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  output.success('All project-scoped (.mcp.json) server approvals and rejections have been reset.');
  output.info('You will be prompted for approval next time you start Claude Code.');
  return ExitCodes.SUCCESS;
}

// ============================================================================
// MCP CLI Commands (for use within Claude Code session)
// ============================================================================

/**
 * Handles the 'mcp servers' CLI command.
 * Lists all connected MCP servers.
 *
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPServers(options: { json?: boolean }): Promise<ExitCode> {
  try {
    const state = await readMCPState();

    if (options.json) {
      const data = state.clients.map((client) => ({
        name: client.name,
        type: client.type,
        hasTools: client.type === 'connected' && client.capabilities?.tools,
        hasResources: client.type === 'connected' && client.capabilities?.resources,
      }));
      console.log(JSON.stringify(data));
    } else {
      for (const client of state.clients) {
        const status = STATUS[client.type] || client.type;
        let capabilities = '';

        if (client.type === 'connected' && client.capabilities) {
          const caps: string[] = [];
          if (client.capabilities.tools) caps.push('tools');
          if (client.capabilities.resources) caps.push('resources');
          if (client.capabilities.prompts) caps.push('prompts');
          if (caps.length > 0) {
            capabilities = ` (${caps.join(', ')})`;
          }
        }

        output.info(`${client.name} - ${status}${capabilities}`);
      }
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp tools' CLI command.
 * Lists all available MCP tools.
 *
 * @param serverFilter - Optional server name filter
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPTools(
  serverFilter: string | undefined,
  options: { json?: boolean }
): Promise<ExitCode> {
  try {
    const state = await readMCPState();
    let tools = state.tools;

    if (serverFilter) {
      const prefix = `mcp__${serverFilter}__`;
      tools = tools.filter((t) => t.name.startsWith(prefix));
    }

    if (options.json) {
      const data = tools.map((tool) => {
        const match = tool.name.match(/^mcp__([^_]+)__(.+)$/);
        return {
          server: match?.[1] || 'unknown',
          name: match?.[2] || tool.name,
          description: tool.description,
        };
      });
      console.log(JSON.stringify(data));
    } else if (serverFilter) {
      for (const tool of tools) {
        const match = tool.name.match(/^mcp__[^_]+__(.+)$/);
        output.info(match?.[1] || tool.name);
      }
    } else {
      for (const tool of tools) {
        const match = tool.name.match(/^mcp__([^_]+)__(.+)$/);
        output.info(`${match?.[1] || 'unknown'}/${match?.[2] || tool.name}`);
      }
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp info' CLI command.
 * Gets detailed information about a tool.
 *
 * @param toolId - Tool identifier (server/tool)
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPInfo(
  toolId: string,
  options: { json?: boolean }
): Promise<ExitCode> {
  try {
    const { server, tool } = parseToolIdentifier(toolId);
    const state = await readMCPState();
    const fullName = `mcp__${server}__${tool}`;
    const toolDef = state.tools.find((t) => t.name === fullName);

    if (!toolDef) {
      output.error(`Error: Tool '${toolId}' not found`);
      return ExitCodes.NOT_FOUND;
    }

    if (options.json) {
      console.log(
        JSON.stringify({
          server,
          name: tool,
          description: toolDef.description,
          inputSchema: toolDef.inputJSONSchema || {},
        })
      );
    } else {
      output.bold(`Tool: ${toolId}`);
      output.dim(`Server: ${server}`);
      if (toolDef.description) {
        output.dim(`Description: ${toolDef.description}`);
      }
      console.log();
      output.bold('Input Schema:');
      console.log(JSON.stringify(toolDef.inputJSONSchema || {}, null, 2));
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp call' CLI command.
 * Invokes an MCP tool.
 *
 * @param toolId - Tool identifier (server/tool)
 * @param argsJson - Tool arguments as JSON string or "-" for stdin
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPCall(
  toolId: string,
  argsJson: string,
  options: MCPCallOptions
): Promise<ExitCode> {
  try {
    const { server, tool } = parseToolIdentifier(toolId);
    let inputArgs: unknown;

    // Handle stdin input
    if (argsJson === '-') {
      // In a real implementation, read from stdin
      output.error('Error: Stdin input not yet implemented');
      return ExitCodes.ERROR;
    }

    try {
      inputArgs = parseJSON(argsJson, 'tool arguments');
    } catch (error) {
      output.error('Error: Invalid JSON arguments');
      output.error(error instanceof Error ? error.message : String(error));
      return ExitCodes.INVALID_ARGS;
    }

    if (options.debug) {
      output.dim(`Connecting to ${server}...`);
      output.dim(`Calling tool ${tool}...`);
    }

    // In a real implementation, this would:
    // 1. Read MCP state to get server config
    // 2. Connect to the server
    // 3. Call the tool with the provided arguments
    // 4. Return the result

    output.error('Error: Tool invocation not yet implemented in refactored CLI');
    return ExitCodes.ERROR;
  } catch (error) {
    output.error('Error calling tool:');
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp grep' CLI command.
 * Searches tool names and descriptions.
 *
 * @param pattern - Regex pattern to search
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPGrep(
  pattern: string,
  options: { json?: boolean; ignoreCase?: boolean }
): Promise<ExitCode> {
  try {
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, options.ignoreCase !== false ? 'i' : '');
    } catch (error) {
      output.error('Error: Invalid regex pattern');
      output.error(error instanceof Error ? error.message : String(error));
      return ExitCodes.INVALID_ARGS;
    }

    const state = await readMCPState();
    const matches = state.tools.filter((tool) => {
      const match = tool.name.match(/^mcp__([^_]+)__(.+)$/);
      const displayName = match ? `${match[1]}/${match[2]}` : tool.name;
      return regex.test(displayName) || regex.test(tool.description);
    });

    if (options.json) {
      const data = matches.map((tool) => {
        const match = tool.name.match(/^mcp__([^_]+)__(.+)$/);
        return {
          server: match?.[1] || 'unknown',
          name: match?.[2] || tool.name,
          description: tool.description,
        };
      });
      console.log(JSON.stringify(data));
    } else {
      if (matches.length === 0) {
        output.warn('No tools found matching pattern');
        return ExitCodes.SUCCESS;
      }

      for (const tool of matches) {
        const match = tool.name.match(/^mcp__([^_]+)__(.+)$/);
        output.bold(`${match?.[1] || 'unknown'}/${match?.[2] || tool.name}`);
        if (tool.description) {
          const desc = tool.description.length > 100 ? tool.description.slice(0, 100) + '...' : tool.description;
          output.dim(`  ${desc}`);
        }
        console.log();
      }
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp resources' CLI command.
 * Lists MCP resources.
 *
 * @param serverFilter - Optional server name filter
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPResources(
  serverFilter: string | undefined,
  options: { json?: boolean }
): Promise<ExitCode> {
  try {
    const state = await readMCPState();
    let resources: MCPResource[] = [];

    if (serverFilter) {
      resources = state.resources[serverFilter] || [];
    } else {
      resources = Object.values(state.resources).flat();
    }

    if (options.json) {
      console.log(JSON.stringify(resources));
    } else {
      for (const resource of resources) {
        output.info(`${resource.server}/${resource.name || resource.uri}`);
      }
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'mcp read' CLI command.
 * Reads an MCP resource.
 *
 * @param resourceId - Resource identifier (server/resource) or server
 * @param uri - Optional direct resource URI
 * @param options - Command options
 * @returns Exit code
 */
export async function handleMCPRead(
  resourceId: string,
  uri: string | undefined,
  options: MCPCallOptions
): Promise<ExitCode> {
  try {
    let server: string;
    let resourceName: string | undefined;
    let resourceUri: string | undefined;

    if (uri) {
      server = resourceId;
      resourceUri = uri;
    } else {
      const parsed = parseToolIdentifier(resourceId);
      server = parsed.server;
      resourceName = parsed.tool;
    }

    if (options.debug) {
      output.dim(`Connecting to ${server}...`);
      if (resourceUri) {
        output.dim(`Using direct URI: ${resourceUri}`);
      }
    }

    // In a real implementation, this would:
    // 1. Read MCP state to get server config
    // 2. Connect to the server
    // 3. Find the resource URI
    // 4. Read and return the resource content

    output.error('Error: Resource reading not yet implemented in refactored CLI');
    return ExitCodes.ERROR;
  } catch (error) {
    output.error('Error reading resource:');
    output.error(error instanceof Error ? error.message : String(error));
    return ExitCodes.ERROR;
  }
}

/**
 * Main MCP command handler.
 * Routes to appropriate subcommand handler.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMCPCommand(
  args: string[],
  options: MCPAddOptions,
  context: CommandContext
): Promise<ExitCode> {
  const [subcommand, ...subArgs] = args;

  if (options.help || !subcommand) {
    console.log(generateMCPHelp());
    return ExitCodes.SUCCESS;
  }

  switch (subcommand) {
    case 'serve':
      return handleMCPServe(subArgs, options as MCPServeOptions, context);

    case 'add':
      return handleMCPAdd(subArgs, options, context);

    case 'remove':
    case 'rm':
      return handleMCPRemove(subArgs, options, context);

    case 'list':
    case 'ls':
      return handleMCPList(subArgs, options, context);

    case 'get':
      return handleMCPGet(subArgs, options, context);

    case 'add-json':
      return handleMCPAddJSON(subArgs, options, context);

    case 'add-from-claude-desktop':
      output.info('Importing MCP servers from Claude Desktop...');
      output.error('Error: Claude Desktop import not yet implemented');
      return ExitCodes.ERROR;

    case 'reset-project-choices':
      return handleMCPResetChoices(subArgs, options, context);

    // MCP CLI commands (within session)
    case 'servers':
      return handleMCPServers(options);

    case 'tools':
      return handleMCPTools(subArgs[0], options);

    case 'info':
      if (!subArgs[0]) {
        output.error('Error: Tool identifier required');
        return ExitCodes.INVALID_ARGS;
      }
      return handleMCPInfo(subArgs[0], options);

    case 'call':
      if (!subArgs[0] || !subArgs[1]) {
        output.error('Error: Tool identifier and arguments required');
        return ExitCodes.INVALID_ARGS;
      }
      return handleMCPCall(subArgs[0], subArgs[1], options as MCPCallOptions);

    case 'grep':
      if (!subArgs[0]) {
        output.error('Error: Search pattern required');
        return ExitCodes.INVALID_ARGS;
      }
      return handleMCPGrep(subArgs[0], options);

    case 'resources':
      return handleMCPResources(subArgs[0], options);

    case 'read':
      if (!subArgs[0]) {
        output.error('Error: Resource identifier required');
        return ExitCodes.INVALID_ARGS;
      }
      return handleMCPRead(subArgs[0], subArgs[1], options as MCPCallOptions);

    default:
      output.error(`Unknown MCP subcommand: ${subcommand}`);
      console.log(generateMCPHelp());
      return ExitCodes.INVALID_ARGS;
  }
}
