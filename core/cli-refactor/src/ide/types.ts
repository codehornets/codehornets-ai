/**
 * IDE Integration Types
 *
 * TypeScript interfaces and types for IDE detection, connection management,
 * and diagnostics tracking.
 */

/**
 * The kind of IDE family
 */
export type IdeKind = 'vscode' | 'jetbrains';

/**
 * Supported IDE type identifiers
 */
export type IdeType =
  | 'vscode'
  | 'cursor'
  | 'windsurf'
  | 'intellij'
  | 'pycharm'
  | 'webstorm'
  | 'phpstorm'
  | 'rubymine'
  | 'clion'
  | 'goland'
  | 'rider'
  | 'datagrip'
  | 'appcode'
  | 'dataspell'
  | 'aqua'
  | 'gateway'
  | 'fleet'
  | 'androidstudio';

/**
 * Configuration for a supported IDE
 */
export interface IdeConfig {
  /** The IDE family (vscode or jetbrains) */
  ideKind: IdeKind;
  /** Human-readable display name */
  displayName: string;
  /** Process keywords to detect on macOS */
  processKeywordsMac: string[];
  /** Process keywords to detect on Windows */
  processKeywordsWindows: string[];
  /** Process keywords to detect on Linux */
  processKeywordsLinux: string[];
}

/**
 * Map of IDE type to its configuration
 */
export type IdeConfigMap = Record<IdeType, IdeConfig>;

/**
 * Supported operating systems
 */
export type Platform = 'macos' | 'windows' | 'linux' | 'wsl';

/**
 * Lock file metadata
 */
export interface LockFileInfo {
  /** Path to the lock file */
  path: string;
  /** Last modification time */
  mtime: Date;
}

/**
 * Parsed lock file content
 */
export interface ParsedLockFile {
  /** Workspace folders registered by the IDE */
  workspaceFolders: string[];
  /** Port number for the connection */
  port: number;
  /** Process ID of the IDE (if available) */
  pid?: number;
  /** IDE name (if available) */
  ideName?: string;
  /** Whether to use WebSocket transport */
  useWebSocket: boolean;
  /** Whether the IDE is running in Windows (relevant for WSL) */
  runningInWindows: boolean;
  /** Authentication token (if available) */
  authToken?: string;
}

/**
 * IDE connection information
 */
export interface IdeConnection {
  /** Connection URL (http://... or ws://...) */
  url: string;
  /** Display name of the IDE */
  name: string;
  /** Workspace folders */
  workspaceFolders: string[];
  /** Connection port */
  port: number;
  /** Whether this connection is valid for the current workspace */
  isValid: boolean;
  /** Authentication token */
  authToken?: string;
  /** Whether the IDE is running in Windows (for WSL) */
  ideRunningInWindows: boolean;
}

/**
 * Result of extension installation attempt
 */
export interface ExtensionInstallResult {
  /** Whether installation succeeded */
  installed: boolean;
  /** Error message if installation failed */
  error: string | null;
  /** Version of the installed extension */
  installedVersion: string | null;
  /** IDE type the extension was installed for */
  ideType: IdeType;
}

/**
 * Diagnostic severity levels (matches LSP specification)
 */
export type DiagnosticSeverity = 'Error' | 'Warning' | 'Info' | 'Hint';

/**
 * Position in a text document
 */
export interface Position {
  /** Zero-based line number */
  line: number;
  /** Zero-based character offset */
  character: number;
}

/**
 * Range in a text document
 */
export interface DiagnosticRange {
  /** Start position */
  start: Position;
  /** End position */
  end: Position;
}

/**
 * A diagnostic item (error, warning, etc.)
 */
export interface Diagnostic {
  /** Human-readable message */
  message: string;
  /** Severity level */
  severity: DiagnosticSeverity;
  /** Source of the diagnostic (e.g., "eslint", "typescript") */
  source?: string;
  /** Diagnostic code */
  code?: string | number;
  /** Location in the document */
  range: DiagnosticRange;
}

/**
 * File diagnostics (all diagnostics for a single file)
 */
export interface FileDiagnostics {
  /** File URI (file://path or _claude_fs_right:path) */
  uri: string;
  /** List of diagnostics for this file */
  diagnostics: Diagnostic[];
}

/**
 * MCP client connection state
 */
export interface McpClientState {
  /** Connection type */
  type: 'connected' | 'disconnected' | 'connecting';
  /** Connection name */
  name?: string;
  /** Configuration details */
  config?: {
    type: 'sse-ide' | 'ws-ide' | string;
    ideName?: string;
  };
}

/**
 * Connected MCP client
 */
export interface ConnectedMcpClient extends McpClientState {
  type: 'connected';
  /** Send notification to the IDE */
  notification(params: { method: string; params: unknown }): Promise<void>;
}

/**
 * Connection state item
 */
export interface ConnectionState {
  type: 'connected' | 'disconnected';
  name: string;
  config?: McpClientState['config'];
}
