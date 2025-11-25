/**
 * @fileoverview Main exports for the CLI UI module
 * @module ui
 *
 * This module provides the complete UI layer for the CLI application,
 * built with React and Ink for terminal rendering.
 *
 * ## Architecture
 *
 * The UI module is organized into several sub-modules:
 *
 * - **components/** - React components for rendering messages, attachments, diffs, etc.
 * - **hooks/** - React hooks for state management
 * - **types.ts** - TypeScript interfaces and types
 * - **diff-utils.ts** - Utilities for generating diffs
 * - **renderer.tsx** - Main UI renderer
 *
 * ## Usage
 *
 * ```typescript
 * import { renderUI, Message, useSession } from './ui.js';
 *
 * // Render the main UI
 * const { unmount, waitUntilExit } = renderUI({
 *   messages: [],
 *   tools: [],
 *   verbose: false,
 *   isLoading: false,
 *   screen: 'main',
 *   onSubmit: (input) => handleSubmit(input),
 *   onExit: () => handleExit(),
 * });
 *
 * // Or use individual components
 * <Message
 *   message={msg}
 *   messages={allMessages}
 *   tools={tools}
 *   // ... other props
 * />
 * ```
 *
 * ## Components
 *
 * - `Message` - Renders different message types (user, assistant, system)
 * - `Attachment` - Renders file attachments, directories, etc.
 * - `Diagnostics` - Renders IDE/LSP diagnostic information
 * - `Diff` - Renders unified diff output
 * - `Permission` - Permission dialogs for tool use and sandbox access
 *
 * ## Hooks
 *
 * - `useSession` - Combined hook for all session state
 * - `useSessionState` - Session message and loading state
 * - `useToolState` - Tool execution state
 * - `usePermissionState` - Permission context state
 * - `useScreenState` - UI screen navigation state
 * - `useInputState` - Prompt input state
 * - `useProgressMessages` - Progress message tracking
 * - `useTerminalDimensions` - Reactive terminal size
 * - `useAnimation` - Animation controls
 *
 * @packageDocumentation
 */
export { Message, MessageRow, CompactBoundary, TextContent, AssistantTextContent, ThinkingContent, RedactedThinking, ToolUseContent, ToolResultContent as ToolResultContentComponent, UserMessageContent, AssistantMessageContent, SystemMessage, Attachment, AttachmentRow, FileAttachmentDisplay, DirectoryAttachmentDisplay, IDESelectionDisplay, MCPResourceDisplay, TodoAttachmentDisplay, CommandPermissionsDisplay, HookResponseDisplay, HookErrorDisplay, HookSuccessDisplay, HookStoppedDisplay, HookSystemMessageDisplay, AsyncAgentStatusDisplay, CompactFileReferenceDisplay, NestedMemoryDisplay, QueuedCommandDisplay, Diagnostics, DiagnosticEntry, FileDiagnostics, DiagnosticsSummary, DetailedSummary, getSeveritySymbol, getSeverityColor, getSeverityName, Diff, DiffLine, AddedLine, RemovedLine, ContextLine, HunkHeader, DiffHunkDisplay, DiffStats, DiffBar, DiffFileHeader, CompactDiff, InlineDiff, ToolPermissionDialog, PermissionDialog, SandboxPermissionDialog, ElicitationDialog, CostThresholdDialog, KeyHint, KeyHintsRow, Divider, RiskBadge, ToolInfoDisplay, } from './components/index.js';
export { useSessionState, useToolState, usePermissionState, useScreenState, useInputState, useProgressMessages, useTerminalDimensions, useAnimation, useSession, } from './hooks/index.js';
export type { SessionState, ToolState, PermissionState, ScreenState, InputState, } from './hooks/index.js';
export { MainRenderer, renderUI, LoadingSpinner, TodoListDisplay, TranscriptToggle, MessageList, InputArea, MessageSelector, } from './renderer.js';
export { createDiffHunks, createDiffFromEdits, calculateLineStats, formatHunkHeader, getLineType, stripDiffPrefix, escapeSpecialChars, unescapeSpecialChars, normalizeLineEndings, splitLines, DEFAULT_CONTEXT_LINES, } from './diff-utils.js';
export type { ContentBlockType, ContentBlockBase, TextContentBlock, ToolUseContentBlock, ToolResultContentBlock, ToolResultContent, ThinkingContentBlock, RedactedThinkingContentBlock, ImageContentBlock, ContentBlock, ThinkingMetadata, UserMessage, AssistantMessage, MessageType, SystemMessageSubtype, NormalizedMessage, AttachmentBase, AttachmentType, FileAttachment, FileContent, TextFileContent, NotebookFileContent, NotebookCell, DirectoryAttachment, IDESelectionAttachment, DiagnosticsAttachment, DiagnosticFile, Diagnostic, DiagnosticRange, Position, DiagnosticSeverity, MCPResourceAttachment, TodoAttachment, CommandPermissionsAttachment, HookResponseAttachment, HookResponse, AsyncAgentStatusAttachment, Attachment as AttachmentUnion, Tool, ToolUseConfirm, ToolUseContext, ToolUseOptions, HostPattern, PermissionRule, AddPermissionRulesAction, SandboxPermissionResponse, ElicitationRequest, ElicitationResponse, DiffHunk, EditOperation, DiffOptions, DiffFromEditsOptions, ScreenType, InputMode, TodoItem, ProgressMessage, AppState, ToolPermissionContext, MarginProps, VerboseProps, MessageComponentProps, MessageRendererProps, AttachmentRendererProps, DiagnosticsProps, DiffProps, PermissionDialogProps, SandboxPermissionProps, MainRendererProps, PermissionHandler, ToolConfirmHandler, SubmitHandler, LineChangeStats, SeveritySymbols, ThemeColors, MessageStyle, ConditionalJSX, } from './types.js';
/**
 * Default export provides the main renderer function
 */
export { renderUI as default } from './renderer.js';
//# sourceMappingURL=index.d.ts.map