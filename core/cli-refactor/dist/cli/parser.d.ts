/**
 * CLI Argument Parser
 *
 * Parses command line arguments into structured data for command execution.
 * Supports both short and long flags, boolean and value options, and positional arguments.
 *
 * @module cli/parser
 */
import type { ParsedArgs, MCPScope, MCPTransportType, OutputFormat, InputFormat, PermissionMode } from './types.js';
/**
 * Option specification for parsing.
 */
interface OptionSpec {
    /** Long name (without --) */
    long: string;
    /** Short name (without -) */
    short?: string;
    /** Whether option takes a value */
    takesValue?: boolean;
    /** Whether option can be specified multiple times */
    multiple?: boolean;
    /** Property name in parsed result */
    property?: string;
    /** Default value */
    defaultValue?: unknown;
}
/**
 * Parses command line arguments into a structured format.
 *
 * @param argv - Command line arguments (typically process.argv.slice(2))
 * @param additionalOptions - Additional option specifications to include
 * @returns Parsed arguments object
 *
 * @example
 * ```typescript
 * const args = parseArgs(['mcp', 'list', '--json']);
 * // Returns:
 * // {
 * //   command: 'mcp',
 * //   subcommand: 'list',
 * //   positionals: [],
 * //   options: { json: true }
 * // }
 * ```
 */
export declare function parseArgs(argv: string[], additionalOptions?: OptionSpec[]): ParsedArgs;
/**
 * Validates and converts a scope string to MCPScope type.
 *
 * @param scope - Scope string to validate
 * @returns Valid MCPScope value
 * @throws Error if scope is invalid
 */
export declare function validateScope(scope: string): MCPScope;
/**
 * Validates and converts a transport string to MCPTransportType.
 *
 * @param transport - Transport string to validate
 * @returns Valid MCPTransportType value
 * @throws Error if transport is invalid
 */
export declare function validateTransport(transport: string): MCPTransportType;
/**
 * Validates and converts an output format string.
 *
 * @param format - Format string to validate
 * @returns Valid OutputFormat value
 * @throws Error if format is invalid
 */
export declare function validateOutputFormat(format: string): OutputFormat;
/**
 * Validates and converts an input format string.
 *
 * @param format - Format string to validate
 * @returns Valid InputFormat value
 * @throws Error if format is invalid
 */
export declare function validateInputFormat(format: string): InputFormat;
/**
 * Validates and converts a permission mode string.
 *
 * @param mode - Mode string to validate
 * @returns Valid PermissionMode value
 * @throws Error if mode is invalid
 */
export declare function validatePermissionMode(mode: string): PermissionMode;
/**
 * Parses environment variable arguments into a record.
 *
 * @param envArgs - Array of KEY=value strings
 * @returns Record of environment variables
 *
 * @example
 * ```typescript
 * parseEnvArgs(['API_KEY=secret', 'DEBUG=true'])
 * // Returns: { API_KEY: 'secret', DEBUG: 'true' }
 * ```
 */
export declare function parseEnvArgs(envArgs: string[] | undefined): Record<string, string> | undefined;
/**
 * Parses header arguments into a record.
 *
 * @param headerArgs - Array of "Header-Name: value" strings
 * @returns Record of headers
 *
 * @example
 * ```typescript
 * parseHeaderArgs(['X-Api-Key: abc123', 'Content-Type: application/json'])
 * // Returns: { 'X-Api-Key': 'abc123', 'Content-Type': 'application/json' }
 * ```
 */
export declare function parseHeaderArgs(headerArgs: string[] | undefined): Record<string, string> | undefined;
/**
 * Parses a tool identifier string into server and tool components.
 *
 * @param identifier - Tool identifier in format "server/tool"
 * @returns Object with server and tool properties
 * @throws Error if identifier format is invalid
 *
 * @example
 * ```typescript
 * parseToolIdentifier('filesystem/read_file')
 * // Returns: { server: 'filesystem', tool: 'read_file' }
 * ```
 */
export declare function parseToolIdentifier(identifier: string): {
    server: string;
    tool: string;
};
/**
 * Parses JSON safely with a descriptive error.
 *
 * @param jsonString - JSON string to parse
 * @param context - Context for error message
 * @returns Parsed JSON value
 * @throws Error with context if parsing fails
 */
export declare function parseJSON<T = unknown>(jsonString: string, context?: string): T;
/**
 * Checks if a string looks like a URL.
 *
 * @param str - String to check
 * @returns True if string appears to be a URL
 */
export declare function looksLikeUrl(str: string): boolean;
/**
 * Extracts session ID from a resume argument.
 *
 * @param resume - Resume argument (boolean or string)
 * @returns Session ID if string, undefined otherwise
 */
export declare function extractSessionId(resume: string | boolean | undefined): string | undefined;
export {};
//# sourceMappingURL=parser.d.ts.map