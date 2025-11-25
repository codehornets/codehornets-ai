/**
 * @fileoverview Attachment rendering components for the CLI UI
 * @module ui/components/Attachment
 *
 * This module provides React components for rendering various types
 * of attachments in messages, including files, directories, and
 * diagnostic information.
 */
import React from 'react';
import type { AttachmentRendererProps, FileAttachment, DirectoryAttachment, IDESelectionAttachment, MCPResourceAttachment, TodoAttachment, CommandPermissionsAttachment, HookResponseAttachment, AsyncAgentStatusAttachment, MarginProps, VerboseProps } from '../types.js';
/**
 * Props for attachment row
 */
interface AttachmentRowProps {
    children: React.ReactNode;
    dimColor?: boolean;
    color?: 'error' | 'warning' | 'success' | 'info';
}
/**
 * Base container for attachment display with consistent styling
 */
export declare const AttachmentRow: React.FC<AttachmentRowProps>;
/**
 * Props for file attachment
 */
interface FileAttachmentDisplayProps extends MarginProps, VerboseProps {
    attachment: FileAttachment;
}
/**
 * Renders a file attachment display
 */
export declare const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps>;
/**
 * Props for directory attachment
 */
interface DirectoryAttachmentDisplayProps extends MarginProps, VerboseProps {
    attachment: DirectoryAttachment;
}
/**
 * Renders a directory listing attachment
 */
export declare const DirectoryAttachmentDisplay: React.FC<DirectoryAttachmentDisplayProps>;
/**
 * Props for IDE selection attachment
 */
interface IDESelectionDisplayProps extends MarginProps, VerboseProps {
    attachment: IDESelectionAttachment;
}
/**
 * Renders an IDE selected lines attachment
 */
export declare const IDESelectionDisplay: React.FC<IDESelectionDisplayProps>;
/**
 * Props for MCP resource attachment
 */
interface MCPResourceDisplayProps extends MarginProps, VerboseProps {
    attachment: MCPResourceAttachment;
}
/**
 * Renders an MCP resource attachment
 */
export declare const MCPResourceDisplay: React.FC<MCPResourceDisplayProps>;
/**
 * Props for todo attachment
 */
interface TodoAttachmentDisplayProps extends MarginProps, VerboseProps {
    attachment: TodoAttachment;
}
/**
 * Renders a todo list attachment
 */
export declare const TodoAttachmentDisplay: React.FC<TodoAttachmentDisplayProps>;
/**
 * Props for command permissions attachment
 */
interface CommandPermissionsDisplayProps extends MarginProps, VerboseProps {
    attachment: CommandPermissionsAttachment;
}
/**
 * Renders command permissions attachment
 */
export declare const CommandPermissionsDisplay: React.FC<CommandPermissionsDisplayProps>;
/**
 * Props for hook response attachment
 */
interface HookResponseDisplayProps extends MarginProps, VerboseProps {
    attachment: HookResponseAttachment;
}
/**
 * Renders a hook response attachment
 */
export declare const HookResponseDisplay: React.FC<HookResponseDisplayProps>;
/**
 * Hook error attachment types
 */
interface HookErrorAttachment {
    type: 'hook_blocking_error' | 'hook_non_blocking_error' | 'hook_error_during_execution';
    hookName: string;
    blockingError?: {
        blockingError: string;
    };
    stderr?: string;
    content?: string;
}
/**
 * Props for hook error display
 */
interface HookErrorDisplayProps extends MarginProps, VerboseProps {
    attachment: HookErrorAttachment;
}
/**
 * Renders hook error attachments
 */
export declare const HookErrorDisplay: React.FC<HookErrorDisplayProps>;
/**
 * Hook success attachment type
 */
interface HookSuccessAttachment {
    type: 'hook_success';
    hookName: string;
    content: string;
}
/**
 * Props for hook success display
 */
interface HookSuccessDisplayProps extends MarginProps, VerboseProps {
    attachment: HookSuccessAttachment;
}
/**
 * Renders hook success attachments (verbose only)
 */
export declare const HookSuccessDisplay: React.FC<HookSuccessDisplayProps>;
/**
 * Hook continuation stopped attachment
 */
interface HookStoppedAttachment {
    type: 'hook_stopped_continuation';
    hookName: string;
    message: string;
}
/**
 * Renders hook stopped continuation attachment
 */
export declare const HookStoppedDisplay: React.FC<{
    attachment: HookStoppedAttachment;
}>;
/**
 * Hook system message attachment
 */
interface HookSystemMessageAttachment {
    type: 'hook_system_message';
    hookName: string;
    content: string;
}
/**
 * Renders hook system message attachment
 */
export declare const HookSystemMessageDisplay: React.FC<{
    attachment: HookSystemMessageAttachment;
}>;
/**
 * Props for async agent status
 */
interface AsyncAgentStatusDisplayProps extends MarginProps, VerboseProps {
    attachment: AsyncAgentStatusAttachment;
}
/**
 * Renders async agent status attachment
 */
export declare const AsyncAgentStatusDisplay: React.FC<AsyncAgentStatusDisplayProps>;
/**
 * Compact file reference attachment type
 */
interface CompactFileReferenceAttachment {
    type: 'compact_file_reference';
    filename: string;
}
/**
 * Renders compact file reference
 */
export declare const CompactFileReferenceDisplay: React.FC<{
    attachment: CompactFileReferenceAttachment;
}>;
/**
 * Nested memory attachment type
 */
interface NestedMemoryAttachment {
    type: 'nested_memory';
    path: string;
}
/**
 * Renders nested memory attachment
 */
export declare const NestedMemoryDisplay: React.FC<{
    attachment: NestedMemoryAttachment;
}>;
/**
 * Queued command attachment type
 */
interface QueuedCommandAttachment {
    type: 'queued_command';
    prompt: string | unknown[];
}
/**
 * Renders queued command attachment
 */
export declare const QueuedCommandDisplay: React.FC<{
    attachment: QueuedCommandAttachment;
    addMargin?: boolean;
    verbose?: boolean;
}>;
/**
 * Main attachment renderer that dispatches to specific attachment
 * components based on attachment type.
 *
 * @param props - Attachment renderer props
 * @returns Rendered attachment component
 *
 * @example
 * ```tsx
 * <Attachment
 *   attachment={fileAttachment}
 *   addMargin={true}
 *   verbose={false}
 * />
 * ```
 */
export declare const Attachment: React.FC<AttachmentRendererProps>;
export default Attachment;
//# sourceMappingURL=Attachment.d.ts.map