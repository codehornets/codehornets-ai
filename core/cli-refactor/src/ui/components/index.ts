/**
 * @fileoverview Component exports for CLI UI
 * @module ui/components
 *
 * This module re-exports all React components used for rendering
 * the terminal UI.
 */

// Message components
export {
  Message,
  MessageRow,
  CompactBoundary,
  TextContent,
  AssistantTextContent,
  ThinkingContent,
  RedactedThinking,
  ToolUseContent,
  ToolResultContent,
  UserMessageContent,
  AssistantMessageContent,
  SystemMessage,
} from './Message.js';
export { default as MessageDefault } from './Message.js';

// Attachment components
export {
  Attachment,
  AttachmentRow,
  FileAttachmentDisplay,
  DirectoryAttachmentDisplay,
  IDESelectionDisplay,
  MCPResourceDisplay,
  TodoAttachmentDisplay,
  CommandPermissionsDisplay,
  HookResponseDisplay,
  HookErrorDisplay,
  HookSuccessDisplay,
  HookStoppedDisplay,
  HookSystemMessageDisplay,
  AsyncAgentStatusDisplay,
  CompactFileReferenceDisplay,
  NestedMemoryDisplay,
  QueuedCommandDisplay,
} from './Attachment.js';
export { default as AttachmentDefault } from './Attachment.js';

// Diagnostics components
export {
  Diagnostics,
  DiagnosticEntry,
  FileDiagnostics,
  DiagnosticsSummary,
  DetailedSummary,
  getSeveritySymbol,
  getSeverityColor,
  getSeverityName,
} from './Diagnostics.js';
export { default as DiagnosticsDefault } from './Diagnostics.js';

// Diff components
export {
  Diff,
  DiffLine,
  AddedLine,
  RemovedLine,
  ContextLine,
  HunkHeader,
  DiffHunkDisplay,
  DiffStats,
  DiffBar,
  DiffFileHeader,
  CompactDiff,
  InlineDiff,
} from './Diff.js';
export { default as DiffDefault } from './Diff.js';

// Permission components
export {
  ToolPermissionDialog,
  PermissionDialog,
  SandboxPermissionDialog,
  ElicitationDialog,
  CostThresholdDialog,
  KeyHint,
  KeyHintsRow,
  Divider,
  RiskBadge,
  ToolInfoDisplay,
} from './Permission.js';
export { default as PermissionDefault } from './Permission.js';
