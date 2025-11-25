/**
 * Tools/MCP Module Type Definitions
 *
 * This module contains TypeScript interfaces and types for:
 * - File processing (reading, images, PDFs, notebooks)
 * - MCP (Model Context Protocol) server operations
 * - Plugin management
 * - Hook system
 */

// =============================================================================
// File Processing Types
// =============================================================================

/**
 * Supported image MIME types
 */
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

/**
 * File encoding types supported by the file reader
 */
export type FileEncoding = 'utf8' | 'utf16le' | 'ascii';

/**
 * Line ending types
 */
export type LineEnding = 'LF' | 'CRLF';

/**
 * Base file read result
 */
export interface BaseFileResult {
  filePath: string;
}

/**
 * Text file read result
 */
export interface TextFileResult extends BaseFileResult {
  type: 'text';
  file: {
    filePath: string;
    content: string;
    numLines: number;
    startLine: number;
    totalLines: number;
  };
}

/**
 * Image file read result
 */
export interface ImageFileResult extends BaseFileResult {
  type: 'image';
  file: {
    base64: string;
    type: ImageMimeType;
    originalSize: number;
  };
}

/**
 * Notebook cell structure
 */
export interface NotebookCell {
  cellType: 'code' | 'markdown' | 'raw';
  source: string | string[];
  outputs?: NotebookOutput[];
  executionCount?: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Notebook output structure
 */
export interface NotebookOutput {
  outputType: string;
  text?: string | string[];
  data?: Record<string, unknown>;
  name?: string;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

/**
 * Notebook file read result
 */
export interface NotebookFileResult extends BaseFileResult {
  type: 'notebook';
  file: {
    filePath: string;
    cells: NotebookCell[];
  };
}

/**
 * PDF file read result
 */
export interface PDFFileResult extends BaseFileResult {
  type: 'pdf';
  file: {
    filePath: string;
    base64: string;
    originalSize: number;
  };
}

/**
 * Union type for all file read results
 */
export type FileReadResult =
  | TextFileResult
  | ImageFileResult
  | NotebookFileResult
  | PDFFileResult;

/**
 * File read options
 */
export interface FileReadOptions {
  filePath: string;
  offset?: number;
  limit?: number;
}

/**
 * Attachment metadata
 */
export interface AttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  encoding?: FileEncoding;
  checksum?: string;
  createdAt?: Date;
  modifiedAt?: Date;
}

// =============================================================================
// MCP Server Types
// =============================================================================

/**
 * MCP Server info
 */
export interface MCPServerInfo {
  name: string;
  version: string;
}

/**
 * MCP Server capabilities
 */
export interface MCPServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
}

/**
 * MCP Server options
 */
export interface MCPServerOptions {
  capabilities?: MCPServerCapabilities;
  instructions?: string;
}

/**
 * MCP Tool definition
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/**
 * MCP Tool call request
 */
export interface MCPToolCallRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * MCP Tool call result
 */
export interface MCPToolCallResult {
  content: MCPContentBlock[];
  isError?: boolean;
}

/**
 * MCP Content block types
 */
export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
  source: {
    type: 'base64';
    data: string;
    media_type: ImageMimeType;
  };
}

export type MCPContentBlock = MCPTextContent | MCPImageContent;

/**
 * MCP Request handler type
 */
export type MCPRequestHandler<TParams, TResult> = (
  params: TParams
) => Promise<TResult>;

/**
 * MCP Notification handler type
 */
export type MCPNotificationHandler<TParams> = (params: TParams) => void;

/**
 * MCP Transport interface
 */
export interface MCPTransport {
  start(): Promise<void>;
  close(): Promise<void>;
  send(message: Record<string, unknown>): Promise<void>;
  onmessage?: (message: Record<string, unknown>) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
}

// =============================================================================
// Plugin Types
// =============================================================================

/**
 * Plugin manifest
 */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  main?: string;
  dependencies?: Record<string, string>;
}

/**
 * Plugin status
 */
export type PluginStatus = 'loaded' | 'unloaded' | 'error' | 'disabled';

/**
 * Plugin instance
 */
export interface Plugin {
  manifest: PluginManifest;
  status: PluginStatus;
  instance?: PluginInstance;
  error?: Error;
  loadedAt?: Date;
}

/**
 * Plugin instance interface - what a loaded plugin provides
 */
export interface PluginInstance {
  initialize?(): Promise<void>;
  destroy?(): Promise<void>;
  getTools?(): MCPToolDefinition[];
  handleToolCall?(name: string, args: Record<string, unknown>): Promise<unknown>;
}

/**
 * Plugin load options
 */
export interface PluginLoadOptions {
  force?: boolean;
  timeout?: number;
}

/**
 * Plugin manager events
 */
export interface PluginManagerEvents {
  'plugin:loaded': (plugin: Plugin) => void;
  'plugin:unloaded': (name: string) => void;
  'plugin:error': (name: string, error: Error) => void;
}

// =============================================================================
// Hook System Types
// =============================================================================

/**
 * Hook event types
 */
export type HookEventType =
  | 'PreToolExecution'
  | 'PostToolExecution'
  | 'Notification'
  | 'Stop'
  | 'SessionStart'
  | 'SessionEnd'
  | 'PreCompact'
  | 'UserPromptSubmit';

/**
 * Base hook definition
 */
export interface BaseHook {
  matcher?: string;
  timeout?: number;
}

/**
 * Command hook - executes a shell command
 */
export interface CommandHook extends BaseHook {
  type: 'command';
  command: string;
}

/**
 * Prompt hook - sends to LLM for evaluation
 */
export interface PromptHook extends BaseHook {
  type: 'prompt';
  prompt: string;
}

/**
 * Callback hook - calls a registered function
 */
export interface CallbackHook extends BaseHook {
  type: 'callback';
  callback: string;
}

/**
 * Union type for all hook types
 */
export type Hook = CommandHook | PromptHook | CallbackHook;

/**
 * Hook configuration per event type
 */
export interface HookConfig {
  matcher?: string;
  hooks: Hook[];
}

/**
 * Hook settings structure
 */
export type HookSettings = {
  [K in HookEventType]?: HookConfig[];
};

/**
 * Hook input for PreToolExecution
 */
export interface PreToolExecutionInput {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
  session_id: string;
  cwd: string;
}

/**
 * Hook input for PostToolExecution
 */
export interface PostToolExecutionInput {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: unknown;
  session_id: string;
  cwd: string;
}

/**
 * Hook input for Notification
 */
export interface NotificationHookInput {
  hook_event_name: 'Notification';
  notification_type: string;
  message: string;
  session_id: string;
  cwd: string;
}

/**
 * Hook input for Stop
 */
export interface StopHookInput {
  hook_event_name: 'Stop';
  reason: string;
  session_id: string;
  cwd: string;
}

/**
 * Union type for all hook inputs
 */
export type HookInput =
  | PreToolExecutionInput
  | PostToolExecutionInput
  | NotificationHookInput
  | StopHookInput;

/**
 * Hook execution result - success
 */
export interface HookSuccessResult {
  outcome: 'success';
  hook: Hook;
  message?: {
    type: 'hook_success';
    hookName: string;
    hookEvent: HookEventType;
    content?: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
  };
  additionalContext?: string;
  permissionBehavior?: 'allow' | 'deny' | 'ask';
  updatedInput?: Record<string, unknown>;
}

/**
 * Hook execution result - blocking error
 */
export interface HookBlockingResult {
  outcome: 'blocking';
  hook: Hook;
  blockingError: {
    blockingError: string;
    command: string;
  };
  preventContinuation?: boolean;
  stopReason?: string;
}

/**
 * Hook execution result - non-blocking error
 */
export interface HookNonBlockingErrorResult {
  outcome: 'non_blocking_error';
  hook: Hook;
  message: {
    type: 'hook_non_blocking_error';
    hookName: string;
    hookEvent: HookEventType;
    stderr: string;
    stdout: string;
    exitCode: number;
  };
}

/**
 * Hook execution result - cancelled
 */
export interface HookCancelledResult {
  outcome: 'cancelled';
  hook: Hook;
}

/**
 * Union type for all hook execution results
 */
export type HookExecutionResult =
  | HookSuccessResult
  | HookBlockingResult
  | HookNonBlockingErrorResult
  | HookCancelledResult;

/**
 * Async hook response JSON schema
 */
export interface AsyncHookResponse {
  async: true;
  processId?: string;
}

/**
 * Hook JSON output schema
 */
export interface HookJsonOutput {
  continue?: boolean;
  suppressOutput?: boolean;
  stopReason?: string;
  decision?: 'approve' | 'block';
  reason?: string;
  systemMessage?: string;
  permissionDecision?: 'allow' | 'deny' | 'ask';
  hookSpecificOutput?: HookSpecificOutput;
}

/**
 * Hook-specific output types
 */
export type HookSpecificOutput =
  | PreToolUseHookOutput
  | PostToolUseHookOutput
  | UserPromptSubmitHookOutput
  | SessionStartHookOutput;

export interface PreToolUseHookOutput {
  hookEventName: 'PreToolUse';
  permissionDecision?: 'allow' | 'deny' | 'ask';
  permissionDecisionReason?: string;
  updatedInput?: Record<string, unknown>;
}

export interface PostToolUseHookOutput {
  hookEventName: 'PostToolUse';
  additionalContext?: string;
  updatedMCPToolOutput?: unknown;
}

export interface UserPromptSubmitHookOutput {
  hookEventName: 'UserPromptSubmit';
  additionalContext: string;
}

export interface SessionStartHookOutput {
  hookEventName: 'SessionStart';
  additionalContext?: string;
}
