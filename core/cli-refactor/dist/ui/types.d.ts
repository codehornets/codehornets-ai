/**
 * @fileoverview TypeScript interfaces and types for CLI UI components
 * @module ui/types
 *
 * This module defines all TypeScript types used across the terminal UI components,
 * including message types, attachments, tool interactions, and rendering options.
 */
import type { ReactNode } from 'react';
/**
 * Represents different types of content blocks within messages
 */
export type ContentBlockType = 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'redacted_thinking' | 'image';
/**
 * Base interface for all content blocks
 */
export interface ContentBlockBase {
    type: ContentBlockType;
}
/**
 * Text content block for regular message text
 */
export interface TextContentBlock extends ContentBlockBase {
    type: 'text';
    text: string;
}
/**
 * Tool use content block representing an AI tool invocation
 */
export interface ToolUseContentBlock extends ContentBlockBase {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
}
/**
 * Tool result content block containing the output of a tool execution
 */
export interface ToolResultContentBlock extends ContentBlockBase {
    type: 'tool_result';
    tool_use_id: string;
    content: string | ToolResultContent[];
    is_error?: boolean;
}
/**
 * Nested content within tool results
 */
export interface ToolResultContent {
    type: 'text' | 'image';
    text?: string;
    source?: {
        type: 'base64';
        media_type: string;
        data: string;
    };
}
/**
 * Thinking content block for extended thinking output
 */
export interface ThinkingContentBlock extends ContentBlockBase {
    type: 'thinking';
    thinking: string;
}
/**
 * Redacted thinking content block (when thinking is hidden)
 */
export interface RedactedThinkingContentBlock extends ContentBlockBase {
    type: 'redacted_thinking';
    data: string;
}
/**
 * Image content block
 */
export interface ImageContentBlock extends ContentBlockBase {
    type: 'image';
    source: {
        type: 'base64';
        media_type: string;
        data: string;
    };
}
/**
 * Union type for all content blocks
 */
export type ContentBlock = TextContentBlock | ToolUseContentBlock | ToolResultContentBlock | ThinkingContentBlock | RedactedThinkingContentBlock | ImageContentBlock;
/**
 * Metadata about thinking blocks
 */
export interface ThinkingMetadata {
    hasThinking: boolean;
    thinkingTokens?: number;
    thinkingTimeMs?: number;
}
/**
 * User message structure
 */
export interface UserMessage {
    role: 'user';
    content: string | ContentBlock[];
}
/**
 * Assistant message structure
 */
export interface AssistantMessage {
    role: 'assistant';
    content: ContentBlock[];
}
/**
 * Base message type in the conversation
 */
export type MessageType = 'user' | 'assistant' | 'system' | 'attachment' | 'progress';
/**
 * System message subtypes
 */
export type SystemMessageSubtype = 'compact_boundary' | 'local_command' | 'info' | 'warning' | 'error';
/**
 * Normalized message wrapper for rendering
 */
export interface NormalizedMessage {
    type: MessageType;
    message: UserMessage | AssistantMessage;
    subtype?: SystemMessageSubtype;
    content?: string;
    attachment?: Attachment;
    thinkingMetadata?: ThinkingMetadata;
    uuid?: string;
}
/**
 * Base attachment interface
 */
export interface AttachmentBase {
    type: AttachmentType;
}
/**
 * All supported attachment types
 */
export type AttachmentType = 'file' | 'already_read_file' | 'directory' | 'compact_file_reference' | 'selected_lines_in_ide' | 'nested_memory' | 'queued_command' | 'todo' | 'diagnostics' | 'mcp_resource' | 'command_permissions' | 'async_hook_response' | 'hook_blocking_error' | 'hook_non_blocking_error' | 'hook_error_during_execution' | 'hook_success' | 'hook_stopped_continuation' | 'hook_system_message' | 'async_agent_status';
/**
 * File attachment with content
 */
export interface FileAttachment extends AttachmentBase {
    type: 'file' | 'already_read_file';
    filename: string;
    content: FileContent;
    truncated?: boolean;
}
/**
 * File content can be text or notebook
 */
export interface FileContent {
    type: 'text' | 'notebook' | 'image' | 'pdf';
    file: TextFileContent | NotebookFileContent;
}
/**
 * Text file content
 */
export interface TextFileContent {
    numLines: number;
    content: string;
}
/**
 * Notebook file content
 */
export interface NotebookFileContent {
    cells: NotebookCell[];
}
/**
 * Notebook cell structure
 */
export interface NotebookCell {
    type: 'code' | 'markdown';
    source: string;
    outputs?: unknown[];
}
/**
 * Directory attachment
 */
export interface DirectoryAttachment extends AttachmentBase {
    type: 'directory';
    path: string;
}
/**
 * IDE selected lines attachment
 */
export interface IDESelectionAttachment extends AttachmentBase {
    type: 'selected_lines_in_ide';
    filename: string;
    lineStart: number;
    lineEnd: number;
    ideName: string;
}
/**
 * Diagnostics attachment containing IDE diagnostics
 */
export interface DiagnosticsAttachment extends AttachmentBase {
    type: 'diagnostics';
    files: DiagnosticFile[];
}
/**
 * Diagnostic file with issues
 */
export interface DiagnosticFile {
    uri: string;
    diagnostics: Diagnostic[];
}
/**
 * Individual diagnostic entry
 */
export interface Diagnostic {
    range: DiagnosticRange;
    message: string;
    severity: DiagnosticSeverity;
    code?: string | number;
    source?: string;
}
/**
 * Diagnostic range in source file
 */
export interface DiagnosticRange {
    start: Position;
    end: Position;
}
/**
 * Position in a file
 */
export interface Position {
    line: number;
    character: number;
}
/**
 * Diagnostic severity levels
 */
export type DiagnosticSeverity = 1 | 2 | 3 | 4;
/**
 * MCP resource attachment
 */
export interface MCPResourceAttachment extends AttachmentBase {
    type: 'mcp_resource';
    name: string;
    server: string;
    content: string;
}
/**
 * Todo attachment
 */
export interface TodoAttachment extends AttachmentBase {
    type: 'todo';
    itemCount: number;
    context: 'post-compact' | 'normal';
}
/**
 * Command permissions attachment
 */
export interface CommandPermissionsAttachment extends AttachmentBase {
    type: 'command_permissions';
    model?: string;
    allowedTools: string[];
}
/**
 * Hook response attachment
 */
export interface HookResponseAttachment extends AttachmentBase {
    type: 'async_hook_response';
    hookEvent: string;
    response: HookResponse;
}
/**
 * Hook response data
 */
export interface HookResponse {
    systemMessage?: string;
    hookSpecificOutput?: {
        additionalContext?: string;
    };
}
/**
 * Async agent status attachment
 */
export interface AsyncAgentStatusAttachment extends AttachmentBase {
    type: 'async_agent_status';
    status: 'completed' | 'running' | 'failed';
    error?: string;
}
/**
 * Union of all attachment types
 */
export type Attachment = FileAttachment | DirectoryAttachment | IDESelectionAttachment | DiagnosticsAttachment | MCPResourceAttachment | TodoAttachment | CommandPermissionsAttachment | HookResponseAttachment | AsyncAgentStatusAttachment;
/**
 * Tool definition
 */
export interface Tool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
/**
 * Tool use confirmation request
 */
export interface ToolUseConfirm {
    toolUseID: string;
    toolName: string;
    input: Record<string, unknown>;
    riskLevel: 'low' | 'medium' | 'high';
    explanation?: string;
}
/**
 * Tool use context for permission decisions
 */
export interface ToolUseContext {
    abortController: AbortController;
    options: ToolUseOptions;
    messages: NormalizedMessage[];
    readFileState: Map<string, unknown>;
}
/**
 * Tool use options
 */
export interface ToolUseOptions {
    isNonInteractiveSession: boolean;
    tools: Tool[];
    commands: unknown[];
    debug: boolean;
    verbose: boolean;
    mainLoopModel: string;
}
/**
 * Host pattern for sandbox permissions
 */
export interface HostPattern {
    host: string;
    port?: number;
    protocol?: string;
}
/**
 * Permission rule
 */
export interface PermissionRule {
    toolName: string;
    ruleContent: string;
}
/**
 * Permission action for adding rules
 */
export interface AddPermissionRulesAction {
    type: 'addRules';
    rules: PermissionRule[];
    behavior: 'allow' | 'deny';
    destination: 'localSettings' | 'projectSettings';
}
/**
 * Response to sandbox permission request
 */
export interface SandboxPermissionResponse {
    allow: boolean;
    persistToSettings: boolean;
}
/**
 * Elicitation request from MCP server
 */
export interface ElicitationRequest {
    serverName: string;
    request: unknown;
    signal: AbortSignal;
    respond: (response: ElicitationResponse) => void;
}
/**
 * Elicitation response
 */
export interface ElicitationResponse {
    action: string;
    content?: unknown;
}
/**
 * Diff hunk representing a change in a file
 */
export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}
/**
 * Edit operation for generating diffs
 */
export interface EditOperation {
    old_string: string;
    new_string: string;
    replace_all?: boolean;
}
/**
 * Options for diff generation
 */
export interface DiffOptions {
    filePath: string;
    oldContent: string;
    newContent: string;
    ignoreWhitespace?: boolean;
    singleHunk?: boolean;
}
/**
 * Options for generating diff from edits
 */
export interface DiffFromEditsOptions {
    filePath: string;
    fileContents: string;
    edits: EditOperation[];
    ignoreWhitespace?: boolean;
}
/**
 * Screen types for the main UI
 */
export type ScreenType = 'main' | 'sandbox-permission' | 'tool-permission' | 'elicitation' | 'cost' | 'ide-onboarding' | 'init-onboarding' | 'message-selector';
/**
 * Input mode for the prompt
 */
export type InputMode = 'prompt' | 'bash';
/**
 * Todo item structure
 */
export interface TodoItem {
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm?: string;
}
/**
 * Progress message for streaming responses
 */
export interface ProgressMessage {
    type: 'progress';
    content: string;
    toolUseId?: string;
}
/**
 * Application state
 */
export interface AppState {
    messages: NormalizedMessage[];
    toolPermissionContext: ToolPermissionContext;
    fileHistory: Map<string, unknown>;
    elicitation: {
        queue: ElicitationRequest[];
    };
}
/**
 * Tool permission context
 */
export interface ToolPermissionContext {
    additionalWorkingDirectories: Map<string, unknown>;
    allowedTools: Set<string>;
    deniedTools: Set<string>;
}
/**
 * Base props for margin control
 */
export interface MarginProps {
    addMargin?: boolean;
}
/**
 * Props for verbose mode
 */
export interface VerboseProps {
    verbose?: boolean;
}
/**
 * Common props for message components
 */
export interface MessageComponentProps extends MarginProps, VerboseProps {
    width?: number;
}
/**
 * Props for the main message renderer
 */
export interface MessageRendererProps extends MessageComponentProps {
    message: NormalizedMessage;
    messages: NormalizedMessage[];
    tools: Tool[];
    erroredToolUseIDs: Set<string>;
    inProgressToolUseIDs: Set<string>;
    resolvedToolUseIDs: Set<string>;
    progressMessagesForMessage: ProgressMessage[];
    shouldAnimate: boolean;
    shouldShowDot: boolean;
    style?: Record<string, unknown>;
    isTranscriptMode?: boolean;
}
/**
 * Props for attachment rendering
 */
export interface AttachmentRendererProps extends MarginProps, VerboseProps {
    attachment: Attachment;
}
/**
 * Props for diagnostics display
 */
export interface DiagnosticsProps extends VerboseProps {
    attachment: DiagnosticsAttachment;
}
/**
 * Props for diff display
 */
export interface DiffProps {
    hunks: DiffHunk[];
    filePath: string;
    width?: number;
    showLineNumbers?: boolean;
}
/**
 * Props for permission dialog
 */
export interface PermissionDialogProps extends VerboseProps {
    toolUseConfirm: ToolUseConfirm;
    toolUseContext: ToolUseContext;
    onDone: () => void;
    onReject: (reason?: string) => void;
}
/**
 * Props for sandbox permission dialog
 */
export interface SandboxPermissionProps {
    hostPattern: HostPattern;
    onUserResponse: (response: SandboxPermissionResponse) => void;
}
/**
 * Props for the main renderer
 */
export interface MainRendererProps {
    messages: NormalizedMessage[];
    tools: Tool[];
    verbose: boolean;
    isLoading: boolean;
    screen: ScreenType;
    onSubmit: (input: string) => void;
    onExit: () => void;
}
/**
 * Handler for permission decisions
 */
export type PermissionHandler = (allow: boolean, persist?: boolean) => void;
/**
 * Handler for tool use confirmation
 */
export type ToolConfirmHandler = (toolUseId: string, approved: boolean, reason?: string) => void;
/**
 * Handler for message submission
 */
export type SubmitHandler = (input: string, mode?: InputMode) => void;
/**
 * Result of line change calculation
 */
export interface LineChangeStats {
    linesAdded: number;
    linesRemoved: number;
}
/**
 * Severity symbol mapping
 */
export interface SeveritySymbols {
    getSeveritySymbol: (severity: DiagnosticSeverity) => string;
}
/**
 * Theme colors for styled text
 */
export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    dim: string;
}
/**
 * Style configuration for message rendering
 */
export interface MessageStyle {
    theme?: ThemeColors;
    dimColor?: boolean;
    bold?: boolean;
}
/**
 * JSX element with hide flag for conditional rendering
 */
export interface ConditionalJSX {
    jsx: ReactNode;
    shouldHidePromptInput?: boolean;
}
//# sourceMappingURL=types.d.ts.map