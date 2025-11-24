/**
 * CLI Argument Parser
 *
 * Parses command line arguments into structured data for command execution.
 * Supports both short and long flags, boolean and value options, and positional arguments.
 *
 * @module cli/parser
 */

import type {
  ParsedArgs,
  CLIOptions,
  MCPScope,
  MCPTransportType,
  OutputFormat,
  InputFormat,
  PermissionMode,
} from './types.js';

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
 * Default option specifications for global CLI options.
 */
const GLOBAL_OPTIONS: OptionSpec[] = [
  { long: 'version', short: 'v', property: 'version' },
  { long: 'help', short: 'h', property: 'help' },
  { long: 'verbose', property: 'verbose' },
  { long: 'debug', short: 'd', property: 'debug' },
  { long: 'debug-stderr', property: 'debugStderr' },
  { long: 'output-format', short: 'o', takesValue: true, property: 'outputFormat' },
  { long: 'input-format', takesValue: true, property: 'inputFormat' },
  { long: 'print', short: 'p', property: 'print' },
  { long: 'model', short: 'm', takesValue: true, property: 'model' },
  { long: 'fallback-model', takesValue: true, property: 'fallbackModel' },
  { long: 'permission-mode', takesValue: true, property: 'permissionMode' },
  { long: 'continue', short: 'c', property: 'continue' },
  { long: 'resume', short: 'r', takesValue: true, property: 'resume' },
  { long: 'prompt', takesValue: true, property: 'prompt' },
  { long: 'system-prompt', takesValue: true, property: 'systemPrompt' },
  { long: 'append-system-prompt', takesValue: true, property: 'appendSystemPrompt' },
  { long: 'allowed-tools', takesValue: true, multiple: true, property: 'allowedTools' },
  { long: 'disallowed-tools', takesValue: true, multiple: true, property: 'disallowedTools' },
  { long: 'max-turns', takesValue: true, property: 'maxTurns' },
  { long: 'max-thinking-tokens', takesValue: true, property: 'maxThinkingTokens' },
  { long: 'json', property: 'json' },
  { long: 'timeout', takesValue: true, property: 'timeout' },
  { long: 'fork-session', property: 'forkSession' },
  { long: 'scope', short: 's', takesValue: true, property: 'scope' },
  { long: 'transport', short: 't', takesValue: true, property: 'transport' },
  { long: 'env', short: 'e', takesValue: true, multiple: true, property: 'env' },
  { long: 'header', short: 'H', takesValue: true, multiple: true, property: 'header' },
  { long: 'force', property: 'force' },
  { long: 'ignore-case', short: 'i', property: 'ignoreCase' },
];

/**
 * Creates a lookup map for options by their long and short names.
 */
function createOptionMap(specs: OptionSpec[]): Map<string, OptionSpec> {
  const map = new Map<string, OptionSpec>();
  for (const spec of specs) {
    map.set(`--${spec.long}`, spec);
    if (spec.short) {
      map.set(`-${spec.short}`, spec);
    }
  }
  return map;
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
export function parseArgs(
  argv: string[],
  additionalOptions: OptionSpec[] = []
): ParsedArgs {
  const optionMap = createOptionMap([...GLOBAL_OPTIONS, ...additionalOptions]);
  const positionals: string[] = [];
  const options: Record<string, unknown> = {};

  let i = 0;
  let seenDoubleDash = false;

  while (i < argv.length) {
    const arg = argv[i];

    // After --, everything is positional
    if (arg === '--') {
      seenDoubleDash = true;
      i++;
      continue;
    }

    if (seenDoubleDash) {
      positionals.push(arg!);
      i++;
      continue;
    }

    // Long option with =
    if (arg && arg.startsWith('--') && arg.includes('=')) {
      const [optPart, ...valueParts] = arg.split('=');
      const value = valueParts.join('=');
      const spec = optPart ? optionMap.get(optPart) : undefined;

      if (spec && spec.property) {
        if (spec.multiple) {
          const existing = options[spec.property] as string[] | undefined;
          options[spec.property] = existing ? [...existing, value] : [value];
        } else {
          options[spec.property] = value;
        }
      }
      i++;
      continue;
    }

    // Long option
    if (arg && arg.startsWith('--')) {
      const spec = optionMap.get(arg);

      if (spec && spec.property) {
        if (spec.takesValue && i + 1 < argv.length && argv[i + 1] !== undefined && !argv[i + 1]!.startsWith('-')) {
          const value = argv[i + 1];
          if (spec.multiple) {
            const existing = options[spec.property] as string[] | undefined;
            options[spec.property] = existing ? [...existing, value] : [value];
          } else {
            options[spec.property] = value;
          }
          i += 2;
        } else {
          options[spec.property] = true;
          i++;
        }
      } else {
        // Unknown option, treat as positional
        positionals.push(arg!);
        i++;
      }
      continue;
    }

    // Short option
    if (arg && arg.startsWith('-') && arg.length > 1) {
      const spec = optionMap.get(arg);

      if (spec && spec.property) {
        if (spec.takesValue && i + 1 < argv.length && argv[i + 1] !== undefined && !argv[i + 1]!.startsWith('-')) {
          const value = argv[i + 1];
          if (spec.multiple) {
            const existing = options[spec.property] as string[] | undefined;
            options[spec.property] = existing ? [...existing, value] : [value];
          } else {
            options[spec.property] = value;
          }
          i += 2;
        } else {
          options[spec.property] = true;
          i++;
        }
      } else {
        // Could be combined short flags like -abc
        const flags = arg!.slice(1);
        for (const flag of flags) {
          const flagSpec = optionMap.get(`-${flag}`);
          if (flagSpec && flagSpec.property) {
            options[flagSpec.property] = true;
          }
        }
        i++;
      }
      continue;
    }

    // Positional argument
    positionals.push(arg!);
    i++;
  }

  // Extract command and subcommand from positionals
  let command: string | undefined;
  let subcommand: string | undefined;
  const remainingPositionals: string[] = [];

  for (let j = 0; j < positionals.length; j++) {
    const pos = positionals[j];
    if (pos === undefined) continue;
    if (!command && !pos.startsWith('-')) {
      command = pos;
    } else if (command && !subcommand && !pos.startsWith('-')) {
      subcommand = pos;
    } else {
      remainingPositionals.push(pos);
    }
  }

  return {
    command,
    subcommand,
    positionals: remainingPositionals,
    options: options as CLIOptions,
  };
}

/**
 * Validates and converts a scope string to MCPScope type.
 *
 * @param scope - Scope string to validate
 * @returns Valid MCPScope value
 * @throws Error if scope is invalid
 */
export function validateScope(scope: string): MCPScope {
  const validScopes: MCPScope[] = ['local', 'user', 'project'];
  if (validScopes.includes(scope as MCPScope)) {
    return scope as MCPScope;
  }
  throw new Error(`Invalid scope "${scope}". Valid options: ${validScopes.join(', ')}`);
}

/**
 * Validates and converts a transport string to MCPTransportType.
 *
 * @param transport - Transport string to validate
 * @returns Valid MCPTransportType value
 * @throws Error if transport is invalid
 */
export function validateTransport(transport: string): MCPTransportType {
  const validTransports: MCPTransportType[] = ['stdio', 'sse', 'http'];
  if (validTransports.includes(transport as MCPTransportType)) {
    return transport as MCPTransportType;
  }
  throw new Error(
    `Invalid transport "${transport}". Valid options: ${validTransports.join(', ')}`
  );
}

/**
 * Validates and converts an output format string.
 *
 * @param format - Format string to validate
 * @returns Valid OutputFormat value
 * @throws Error if format is invalid
 */
export function validateOutputFormat(format: string): OutputFormat {
  const validFormats: OutputFormat[] = ['text', 'json', 'stream-json'];
  if (validFormats.includes(format as OutputFormat)) {
    return format as OutputFormat;
  }
  throw new Error(`Invalid output format "${format}". Valid options: ${validFormats.join(', ')}`);
}

/**
 * Validates and converts an input format string.
 *
 * @param format - Format string to validate
 * @returns Valid InputFormat value
 * @throws Error if format is invalid
 */
export function validateInputFormat(format: string): InputFormat {
  const validFormats: InputFormat[] = ['text', 'stream-json'];
  if (validFormats.includes(format as InputFormat)) {
    return format as InputFormat;
  }
  throw new Error(`Invalid input format "${format}". Valid options: ${validFormats.join(', ')}`);
}

/**
 * Validates and converts a permission mode string.
 *
 * @param mode - Mode string to validate
 * @returns Valid PermissionMode value
 * @throws Error if mode is invalid
 */
export function validatePermissionMode(mode: string): PermissionMode {
  const validModes: PermissionMode[] = ['default', 'bypassPermissions', 'plan'];
  if (validModes.includes(mode as PermissionMode)) {
    return mode as PermissionMode;
  }
  throw new Error(`Invalid permission mode "${mode}". Valid options: ${validModes.join(', ')}`);
}

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
export function parseEnvArgs(envArgs: string[] | undefined): Record<string, string> | undefined {
  if (!envArgs || envArgs.length === 0) {
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const arg of envArgs) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex > 0) {
      const key = arg.slice(0, eqIndex);
      const value = arg.slice(eqIndex + 1);
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

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
export function parseHeaderArgs(
  headerArgs: string[] | undefined
): Record<string, string> | undefined {
  if (!headerArgs || headerArgs.length === 0) {
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const arg of headerArgs) {
    const colonIndex = arg.indexOf(':');
    if (colonIndex > 0) {
      const key = arg.slice(0, colonIndex).trim();
      const value = arg.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

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
export function parseToolIdentifier(identifier: string): { server: string; tool: string } {
  const parts = identifier.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid tool identifier "${identifier}". Expected format: <server>/<tool>`
    );
  }
  return { server: parts[0], tool: parts[1] };
}

/**
 * Parses JSON safely with a descriptive error.
 *
 * @param jsonString - JSON string to parse
 * @param context - Context for error message
 * @returns Parsed JSON value
 * @throws Error with context if parsing fails
 */
export function parseJSON<T = unknown>(jsonString: string, context: string = 'JSON'): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${context}: ${message}`);
  }
}

/**
 * Checks if a string looks like a URL.
 *
 * @param str - String to check
 * @returns True if string appears to be a URL
 */
export function looksLikeUrl(str: string): boolean {
  return (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('localhost') ||
    str.endsWith('/sse') ||
    str.endsWith('/mcp')
  );
}

/**
 * Extracts session ID from a resume argument.
 *
 * @param resume - Resume argument (boolean or string)
 * @returns Session ID if string, undefined otherwise
 */
export function extractSessionId(resume: string | boolean | undefined): string | undefined {
  if (typeof resume === 'string' && resume.length > 0) {
    return resume;
  }
  return undefined;
}
