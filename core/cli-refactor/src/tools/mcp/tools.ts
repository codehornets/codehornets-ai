/**
 * MCP Tools Module
 *
 * Defines and registers available tools for the MCP server.
 */

import type { MCPToolDefinition, MCPToolCallResult, MCPContentBlock } from '../types.js';

// =============================================================================
// Tool Registry
// =============================================================================

/**
 * Registry of all available MCP tools
 */
const toolRegistry = new Map<string, RegisteredTool>();

/**
 * Registered tool with handler
 */
interface RegisteredTool {
  definition: MCPToolDefinition;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// =============================================================================
// Tool Registration
// =============================================================================

/**
 * Registers a new tool with the MCP server
 *
 * @param definition - Tool definition
 * @param handler - Function to handle tool calls
 */
export function registerTool(
  definition: MCPToolDefinition,
  handler: (args: Record<string, unknown>) => Promise<unknown>
): void {
  if (toolRegistry.has(definition.name)) {
    throw new Error(`Tool already registered: ${definition.name}`);
  }

  toolRegistry.set(definition.name, { definition, handler });
}

/**
 * Unregisters a tool from the MCP server
 *
 * @param name - Name of the tool to unregister
 * @returns True if tool was unregistered
 */
export function unregisterTool(name: string): boolean {
  return toolRegistry.delete(name);
}

/**
 * Gets a registered tool by name
 *
 * @param name - Name of the tool
 * @returns Registered tool or undefined
 */
export function getTool(name: string): RegisteredTool | undefined {
  return toolRegistry.get(name);
}

/**
 * Lists all registered tools
 *
 * @returns Array of tool definitions
 */
export function listTools(): MCPToolDefinition[] {
  return Array.from(toolRegistry.values()).map((t) => t.definition);
}

/**
 * Checks if a tool is registered
 *
 * @param name - Name of the tool
 * @returns True if tool is registered
 */
export function hasTool(name: string): boolean {
  return toolRegistry.has(name);
}

/**
 * Clears all registered tools
 */
export function clearTools(): void {
  toolRegistry.clear();
}

// =============================================================================
// Tool Execution
// =============================================================================

/**
 * Creates a text content block
 *
 * @param text - Text content
 * @returns Text content block
 */
export function createTextContent(text: string): MCPContentBlock {
  return { type: 'text', text };
}

/**
 * Creates an image content block
 *
 * @param base64Data - Base64 encoded image data
 * @param mediaType - Image media type
 * @returns Image content block
 */
export function createImageContent(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): MCPContentBlock {
  return {
    type: 'image',
    source: {
      type: 'base64',
      data: base64Data,
      media_type: mediaType,
    },
  };
}

/**
 * Creates a successful tool result
 *
 * @param content - Content blocks
 * @returns Tool call result
 */
export function createSuccessResult(content: MCPContentBlock[]): MCPToolCallResult {
  return { content, isError: false };
}

/**
 * Creates an error tool result
 *
 * @param errorMessage - Error message
 * @returns Tool call result with error flag
 */
export function createErrorResult(errorMessage: string): MCPToolCallResult {
  return {
    content: [createTextContent(errorMessage)],
    isError: true,
  };
}

/**
 * Executes a registered tool
 *
 * @param name - Name of the tool to execute
 * @param args - Arguments for the tool
 * @returns Tool call result
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<MCPToolCallResult> {
  const tool = toolRegistry.get(name);

  if (!tool) {
    return createErrorResult(`Unknown tool: ${name}`);
  }

  try {
    const result = await tool.handler(args);

    // Convert result to content blocks
    if (typeof result === 'string') {
      return createSuccessResult([createTextContent(result)]);
    }

    if (result && typeof result === 'object') {
      return createSuccessResult([
        createTextContent(JSON.stringify(result, null, 2)),
      ]);
    }

    return createSuccessResult([createTextContent(String(result))]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResult(`Tool execution failed: ${message}`);
  }
}

// =============================================================================
// Built-in Tool Definitions
// =============================================================================

/**
 * Built-in tool schemas
 */
export const BUILTIN_TOOLS = {
  Read: {
    name: 'Read',
    description: 'Reads a file from the local filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to read',
        },
        offset: {
          type: 'number',
          description: 'The line number to start reading from',
        },
        limit: {
          type: 'number',
          description: 'The number of lines to read',
        },
      },
      required: ['file_path'],
    },
  },
  Write: {
    name: 'Write',
    description: 'Writes content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['file_path', 'content'],
    },
  },
  Edit: {
    name: 'Edit',
    description: 'Performs exact string replacements in files',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the file to modify',
        },
        old_string: {
          type: 'string',
          description: 'The text to replace',
        },
        new_string: {
          type: 'string',
          description: 'The text to replace it with',
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences',
          default: false,
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },
  Bash: {
    name: 'Bash',
    description: 'Executes a bash command',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute',
        },
        description: {
          type: 'string',
          description: 'Description of what the command does',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
        },
      },
      required: ['command'],
    },
  },
  Glob: {
    name: 'Glob',
    description: 'Fast file pattern matching tool',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to match files against',
        },
        path: {
          type: 'string',
          description: 'The directory to search in',
        },
      },
      required: ['pattern'],
    },
  },
  Grep: {
    name: 'Grep',
    description: 'Search for patterns in files',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regex pattern to search for',
        },
        path: {
          type: 'string',
          description: 'File or directory to search in',
        },
        glob: {
          type: 'string',
          description: 'Glob pattern to filter files',
        },
        type: {
          type: 'string',
          description: 'File type to search',
        },
      },
      required: ['pattern'],
    },
  },
} as const;

/**
 * Gets the definition of a built-in tool
 *
 * @param name - Name of the built-in tool
 * @returns Tool definition or undefined
 */
export function getBuiltinToolDefinition(
  name: keyof typeof BUILTIN_TOOLS
): MCPToolDefinition | undefined {
  return BUILTIN_TOOLS[name] as MCPToolDefinition | undefined;
}
