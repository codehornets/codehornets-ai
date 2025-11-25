/**
 * MCP Tools Module
 *
 * Defines and registers available tools for the MCP server.
 */
import type { MCPToolDefinition, MCPToolCallResult, MCPContentBlock } from '../types.js';
/**
 * Registered tool with handler
 */
interface RegisteredTool {
    definition: MCPToolDefinition;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
}
/**
 * Registers a new tool with the MCP server
 *
 * @param definition - Tool definition
 * @param handler - Function to handle tool calls
 */
export declare function registerTool(definition: MCPToolDefinition, handler: (args: Record<string, unknown>) => Promise<unknown>): void;
/**
 * Unregisters a tool from the MCP server
 *
 * @param name - Name of the tool to unregister
 * @returns True if tool was unregistered
 */
export declare function unregisterTool(name: string): boolean;
/**
 * Gets a registered tool by name
 *
 * @param name - Name of the tool
 * @returns Registered tool or undefined
 */
export declare function getTool(name: string): RegisteredTool | undefined;
/**
 * Lists all registered tools
 *
 * @returns Array of tool definitions
 */
export declare function listTools(): MCPToolDefinition[];
/**
 * Checks if a tool is registered
 *
 * @param name - Name of the tool
 * @returns True if tool is registered
 */
export declare function hasTool(name: string): boolean;
/**
 * Clears all registered tools
 */
export declare function clearTools(): void;
/**
 * Creates a text content block
 *
 * @param text - Text content
 * @returns Text content block
 */
export declare function createTextContent(text: string): MCPContentBlock;
/**
 * Creates an image content block
 *
 * @param base64Data - Base64 encoded image data
 * @param mediaType - Image media type
 * @returns Image content block
 */
export declare function createImageContent(base64Data: string, mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'): MCPContentBlock;
/**
 * Creates a successful tool result
 *
 * @param content - Content blocks
 * @returns Tool call result
 */
export declare function createSuccessResult(content: MCPContentBlock[]): MCPToolCallResult;
/**
 * Creates an error tool result
 *
 * @param errorMessage - Error message
 * @returns Tool call result with error flag
 */
export declare function createErrorResult(errorMessage: string): MCPToolCallResult;
/**
 * Executes a registered tool
 *
 * @param name - Name of the tool to execute
 * @param args - Arguments for the tool
 * @returns Tool call result
 */
export declare function executeTool(name: string, args: Record<string, unknown>): Promise<MCPToolCallResult>;
/**
 * Built-in tool schemas
 */
export declare const BUILTIN_TOOLS: {
    readonly Read: {
        readonly name: "Read";
        readonly description: "Reads a file from the local filesystem";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly file_path: {
                    readonly type: "string";
                    readonly description: "The absolute path to the file to read";
                };
                readonly offset: {
                    readonly type: "number";
                    readonly description: "The line number to start reading from";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly description: "The number of lines to read";
                };
            };
            readonly required: readonly ["file_path"];
        };
    };
    readonly Write: {
        readonly name: "Write";
        readonly description: "Writes content to a file";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly file_path: {
                    readonly type: "string";
                    readonly description: "The absolute path to the file to write";
                };
                readonly content: {
                    readonly type: "string";
                    readonly description: "The content to write to the file";
                };
            };
            readonly required: readonly ["file_path", "content"];
        };
    };
    readonly Edit: {
        readonly name: "Edit";
        readonly description: "Performs exact string replacements in files";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly file_path: {
                    readonly type: "string";
                    readonly description: "The absolute path to the file to modify";
                };
                readonly old_string: {
                    readonly type: "string";
                    readonly description: "The text to replace";
                };
                readonly new_string: {
                    readonly type: "string";
                    readonly description: "The text to replace it with";
                };
                readonly replace_all: {
                    readonly type: "boolean";
                    readonly description: "Replace all occurrences";
                    readonly default: false;
                };
            };
            readonly required: readonly ["file_path", "old_string", "new_string"];
        };
    };
    readonly Bash: {
        readonly name: "Bash";
        readonly description: "Executes a bash command";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly command: {
                    readonly type: "string";
                    readonly description: "The command to execute";
                };
                readonly description: {
                    readonly type: "string";
                    readonly description: "Description of what the command does";
                };
                readonly timeout: {
                    readonly type: "number";
                    readonly description: "Timeout in milliseconds";
                };
            };
            readonly required: readonly ["command"];
        };
    };
    readonly Glob: {
        readonly name: "Glob";
        readonly description: "Fast file pattern matching tool";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly pattern: {
                    readonly type: "string";
                    readonly description: "The glob pattern to match files against";
                };
                readonly path: {
                    readonly type: "string";
                    readonly description: "The directory to search in";
                };
            };
            readonly required: readonly ["pattern"];
        };
    };
    readonly Grep: {
        readonly name: "Grep";
        readonly description: "Search for patterns in files";
        readonly inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly pattern: {
                    readonly type: "string";
                    readonly description: "The regex pattern to search for";
                };
                readonly path: {
                    readonly type: "string";
                    readonly description: "File or directory to search in";
                };
                readonly glob: {
                    readonly type: "string";
                    readonly description: "Glob pattern to filter files";
                };
                readonly type: {
                    readonly type: "string";
                    readonly description: "File type to search";
                };
            };
            readonly required: readonly ["pattern"];
        };
    };
};
/**
 * Gets the definition of a built-in tool
 *
 * @param name - Name of the built-in tool
 * @returns Tool definition or undefined
 */
export declare function getBuiltinToolDefinition(name: keyof typeof BUILTIN_TOOLS): MCPToolDefinition | undefined;
export {};
//# sourceMappingURL=tools.d.ts.map