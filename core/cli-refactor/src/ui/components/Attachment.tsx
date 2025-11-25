/**
 * @fileoverview Attachment rendering components for the CLI UI
 * @module ui/components/Attachment
 *
 * This module provides React components for rendering various types
 * of attachments in messages, including files, directories, and
 * diagnostic information.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type {
  Attachment as AttachmentType,
  AttachmentRendererProps,
  FileAttachment,
  DirectoryAttachment,
  IDESelectionAttachment,
  DiagnosticsAttachment,
  MCPResourceAttachment,
  TodoAttachment,
  CommandPermissionsAttachment,
  HookResponseAttachment,
  AsyncAgentStatusAttachment,
  MarginProps,
  VerboseProps,
} from '../types.js';
import { Diagnostics } from './Diagnostics.js';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets relative path from the current working directory
 *
 * @param fullPath - Full file path
 * @param cwd - Current working directory
 * @returns Relative path
 */
function getRelativePath(fullPath: string, cwd: string = process.cwd()): string {
  if (fullPath.startsWith(cwd)) {
    const relative = fullPath.slice(cwd.length);
    return relative.startsWith('/') || relative.startsWith('\\')
      ? relative.slice(1)
      : relative;
  }
  return fullPath;
}

/**
 * Formats file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ============================================================================
// Base Attachment Row Component
// ============================================================================

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
export const AttachmentRow: React.FC<AttachmentRowProps> = ({
  children,
  dimColor = true,
  color,
}) => {
  let textColor: string | undefined;
  switch (color) {
    case 'error':
      textColor = 'red';
      break;
    case 'warning':
      textColor = 'yellow';
      break;
    case 'success':
      textColor = 'green';
      break;
    case 'info':
      textColor = 'cyan';
      break;
    default:
      textColor = undefined;
  }

  return (
    <Box flexDirection="row" width="100%">
      <Text dimColor={dimColor && !textColor} color={textColor} wrap="wrap">
        {children}
      </Text>
    </Box>
  );
};

// ============================================================================
// File Attachment Components
// ============================================================================

/**
 * Props for file attachment
 */
interface FileAttachmentDisplayProps extends MarginProps, VerboseProps {
  attachment: FileAttachment;
}

/**
 * Renders a file attachment display
 */
export const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({
  attachment,
  verbose = false,
}) => {
  const relativePath = getRelativePath(attachment.filename);
  const contentType = attachment.content.type;

  // Handle notebook files
  if (contentType === 'notebook' && 'cells' in attachment.content.file) {
    const cellCount = attachment.content.file.cells.length;
    return (
      <AttachmentRow dimColor={false}>
        <Text dimColor>Read </Text>
        <Text bold>{relativePath}</Text>
        <Text> </Text>
        <Text dimColor>({cellCount} cells)</Text>
      </AttachmentRow>
    );
  }

  // Handle text files
  if (contentType === 'text' && 'numLines' in attachment.content.file) {
    const numLines = attachment.content.file.numLines;
    const truncatedIndicator = attachment.truncated ? '+' : '';

    return (
      <AttachmentRow dimColor={false}>
        <Text dimColor>Read </Text>
        <Text bold>{relativePath}</Text>
        <Text> </Text>
        <Text dimColor>
          ({numLines}
          {truncatedIndicator} lines)
        </Text>
      </AttachmentRow>
    );
  }

  // Handle image/pdf files (show size)
  if ('originalSize' in attachment.content.file) {
    const size = formatFileSize(attachment.content.file.originalSize as number);
    return (
      <AttachmentRow dimColor={false}>
        <Text dimColor>Read </Text>
        <Text bold>{relativePath}</Text>
        <Text> </Text>
        <Text dimColor>({size})</Text>
      </AttachmentRow>
    );
  }

  // Default file display
  return (
    <AttachmentRow dimColor={false}>
      <Text dimColor>Read </Text>
      <Text bold>{relativePath}</Text>
    </AttachmentRow>
  );
};

// ============================================================================
// Directory Attachment Component
// ============================================================================

/**
 * Props for directory attachment
 */
interface DirectoryAttachmentDisplayProps extends MarginProps, VerboseProps {
  attachment: DirectoryAttachment;
}

/**
 * Renders a directory listing attachment
 */
export const DirectoryAttachmentDisplay: React.FC<DirectoryAttachmentDisplayProps> = ({
  attachment,
}) => {
  const relativePath = getRelativePath(attachment.path);
  const separator = process.platform === 'win32' ? '\\' : '/';

  return (
    <AttachmentRow>
      <Text>Listed directory </Text>
      <Text bold>
        {relativePath}
        {separator}
      </Text>
    </AttachmentRow>
  );
};

// ============================================================================
// IDE Selection Attachment Component
// ============================================================================

/**
 * Props for IDE selection attachment
 */
interface IDESelectionDisplayProps extends MarginProps, VerboseProps {
  attachment: IDESelectionAttachment;
}

/**
 * Renders an IDE selected lines attachment
 */
export const IDESelectionDisplay: React.FC<IDESelectionDisplayProps> = ({
  attachment,
}) => {
  const relativePath = getRelativePath(attachment.filename);
  const lineCount = attachment.lineEnd - attachment.lineStart + 1;

  return (
    <AttachmentRow dimColor={false}>
      <Text dimColor>{'<>'} Selected </Text>
      <Text bold>{lineCount}</Text>
      <Text> </Text>
      <Text dimColor>lines from </Text>
      <Text bold>{relativePath}</Text>
      <Text> </Text>
      <Text dimColor>in {attachment.ideName}</Text>
    </AttachmentRow>
  );
};

// ============================================================================
// MCP Resource Attachment Component
// ============================================================================

/**
 * Props for MCP resource attachment
 */
interface MCPResourceDisplayProps extends MarginProps, VerboseProps {
  attachment: MCPResourceAttachment;
}

/**
 * Renders an MCP resource attachment
 */
export const MCPResourceDisplay: React.FC<MCPResourceDisplayProps> = ({
  attachment,
}) => {
  return (
    <AttachmentRow dimColor={false}>
      <Text dimColor>Read MCP resource </Text>
      <Text bold>{attachment.name}</Text>
      <Text> </Text>
      <Text dimColor>from {attachment.server}</Text>
    </AttachmentRow>
  );
};

// ============================================================================
// Todo Attachment Component
// ============================================================================

/**
 * Props for todo attachment
 */
interface TodoAttachmentDisplayProps extends MarginProps, VerboseProps {
  attachment: TodoAttachment;
}

/**
 * Renders a todo list attachment
 */
export const TodoAttachmentDisplay: React.FC<TodoAttachmentDisplayProps> = ({
  attachment,
}) => {
  // Only show for post-compact context
  if (attachment.context !== 'post-compact') {
    return null;
  }

  const itemWord = attachment.itemCount === 1 ? 'item' : 'items';

  return (
    <AttachmentRow>
      <Text>
        Todo list read ({attachment.itemCount} {itemWord})
      </Text>
    </AttachmentRow>
  );
};

// ============================================================================
// Command Permissions Attachment Component
// ============================================================================

/**
 * Props for command permissions attachment
 */
interface CommandPermissionsDisplayProps extends MarginProps, VerboseProps {
  attachment: CommandPermissionsAttachment;
}

/**
 * Renders command permissions attachment
 */
export const CommandPermissionsDisplay: React.FC<CommandPermissionsDisplayProps> = ({
  attachment,
  verbose = false,
}) => {
  return (
    <Box flexDirection="column" paddingLeft={0}>
      {attachment.model && (
        <AttachmentRow dimColor={false}>
          <Text dimColor>Model: </Text>
          <Text dimColor bold>
            {attachment.model}
          </Text>
        </AttachmentRow>
      )}
      {attachment.allowedTools.length > 0 && (
        <>
          <AttachmentRow dimColor={false}>
            <Text dimColor>Allowed </Text>
            <Text dimColor bold>
              {attachment.allowedTools.length}
            </Text>
            <Text dimColor> tools for this command</Text>
          </AttachmentRow>
          {verbose && (
            <AttachmentRow dimColor={false}>
              <Text dimColor>{attachment.allowedTools.join(', ')}</Text>
            </AttachmentRow>
          )}
        </>
      )}
    </Box>
  );
};

// ============================================================================
// Hook Response Attachment Components
// ============================================================================

/**
 * Props for hook response attachment
 */
interface HookResponseDisplayProps extends MarginProps, VerboseProps {
  attachment: HookResponseAttachment;
}

/**
 * Renders a hook response attachment
 */
export const HookResponseDisplay: React.FC<HookResponseDisplayProps> = ({
  attachment,
  verbose = false,
}) => {
  const { response } = attachment;

  return (
    <AttachmentRow dimColor={false}>
      <Text dimColor>Async hook </Text>
      <Text dimColor bold>
        {attachment.hookEvent}
      </Text>
      <Text> </Text>
      <Text dimColor>completed</Text>
      {verbose && response.systemMessage && (
        <>
          <Text dimColor>:{'\n'}</Text>
          <Text dimColor>{response.systemMessage}</Text>
        </>
      )}
      {verbose &&
        response.hookSpecificOutput?.additionalContext && (
          <>
            <Text dimColor>:{'\n'}</Text>
            <Text dimColor>{response.hookSpecificOutput.additionalContext}</Text>
          </>
        )}
    </AttachmentRow>
  );
};

/**
 * Hook error attachment types
 */
interface HookErrorAttachment {
  type:
    | 'hook_blocking_error'
    | 'hook_non_blocking_error'
    | 'hook_error_during_execution';
  hookName: string;
  blockingError?: { blockingError: string };
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
export const HookErrorDisplay: React.FC<HookErrorDisplayProps> = ({
  attachment,
  verbose = false,
}) => {
  switch (attachment.type) {
    case 'hook_blocking_error':
      if (verbose) {
        return (
          <AttachmentRow color="error">
            {attachment.hookName} hook returned blocking error:{' '}
            {attachment.blockingError?.blockingError}
          </AttachmentRow>
        );
      }
      return (
        <AttachmentRow color="error">
          {attachment.hookName} hook returned blocking error
        </AttachmentRow>
      );

    case 'hook_non_blocking_error':
      if (verbose) {
        return (
          <AttachmentRow color="error">
            {attachment.hookName} hook error: {attachment.stderr}
          </AttachmentRow>
        );
      }
      return (
        <AttachmentRow color="error">{attachment.hookName} hook error</AttachmentRow>
      );

    case 'hook_error_during_execution':
      if (verbose) {
        return (
          <AttachmentRow>
            {attachment.hookName} hook warning: {attachment.content}
          </AttachmentRow>
        );
      }
      return <AttachmentRow>{attachment.hookName} hook warning</AttachmentRow>;

    default:
      return null;
  }
};

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
export const HookSuccessDisplay: React.FC<HookSuccessDisplayProps> = ({
  attachment,
  verbose = false,
}) => {
  if (!verbose) return null;

  return (
    <AttachmentRow>
      {attachment.hookName} hook succeeded: {attachment.content}
    </AttachmentRow>
  );
};

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
export const HookStoppedDisplay: React.FC<{ attachment: HookStoppedAttachment }> = ({
  attachment,
}) => {
  return (
    <AttachmentRow color="warning">
      {attachment.hookName} hook stopped continuation: {attachment.message}
    </AttachmentRow>
  );
};

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
export const HookSystemMessageDisplay: React.FC<{
  attachment: HookSystemMessageAttachment;
}> = ({ attachment }) => {
  return (
    <AttachmentRow>
      {attachment.hookName} says: {attachment.content}
    </AttachmentRow>
  );
};

// ============================================================================
// Async Agent Status Component
// ============================================================================

/**
 * Props for async agent status
 */
interface AsyncAgentStatusDisplayProps extends MarginProps, VerboseProps {
  attachment: AsyncAgentStatusAttachment;
}

/**
 * Renders async agent status attachment
 */
export const AsyncAgentStatusDisplay: React.FC<AsyncAgentStatusDisplayProps> = ({
  attachment,
}) => {
  const statusText =
    attachment.status === 'completed' ? 'completed in background' : attachment.status;
  const errorText = attachment.error ? `: ${attachment.error}` : '';

  let color: 'success' | 'error' | undefined;
  if (attachment.status === 'completed') color = 'success';
  if (attachment.status === 'failed') color = 'error';

  return (
    <Box flexDirection="row" width="100%" marginTop={1} paddingLeft={2}>
      <Text color={color === 'success' ? 'green' : color === 'error' ? 'red' : undefined}>
        Agent {statusText}
        {errorText}
      </Text>
    </Box>
  );
};

// ============================================================================
// Compact File Reference Component
// ============================================================================

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
export const CompactFileReferenceDisplay: React.FC<{
  attachment: CompactFileReferenceAttachment;
}> = ({ attachment }) => {
  const relativePath = getRelativePath(attachment.filename);

  return (
    <AttachmentRow>
      <Text>Referenced file </Text>
      <Text bold>{relativePath}</Text>
    </AttachmentRow>
  );
};

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
export const NestedMemoryDisplay: React.FC<{
  attachment: NestedMemoryAttachment;
}> = ({ attachment }) => {
  const relativePath = getRelativePath(attachment.path);

  return (
    <AttachmentRow>
      <Text bold>{relativePath}</Text>
    </AttachmentRow>
  );
};

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
export const QueuedCommandDisplay: React.FC<{
  attachment: QueuedCommandAttachment;
  addMargin?: boolean;
  verbose?: boolean;
}> = ({ attachment, addMargin, verbose }) => {
  const promptText =
    typeof attachment.prompt === 'string'
      ? attachment.prompt
      : JSON.stringify(attachment.prompt);

  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      <Text wrap="wrap">{promptText}</Text>
    </Box>
  );
};

// ============================================================================
// Main Attachment Renderer
// ============================================================================

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
export const Attachment: React.FC<AttachmentRendererProps> = ({
  attachment,
  addMargin = false,
  verbose = false,
}) => {
  // Wrap in margin container if needed
  const Container: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    addMargin ? (
      <Box marginTop={1} flexDirection="column">
        {children}
      </Box>
    ) : (
      <>{children}</>
    );

  switch (attachment.type) {
    case 'file':
    case 'already_read_file':
      return (
        <Container>
          <FileAttachmentDisplay
            attachment={attachment as FileAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'directory':
      return (
        <Container>
          <DirectoryAttachmentDisplay
            attachment={attachment as DirectoryAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'selected_lines_in_ide':
      return (
        <Container>
          <IDESelectionDisplay
            attachment={attachment as IDESelectionAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'diagnostics':
      return (
        <Container>
          <Diagnostics
            attachment={attachment as DiagnosticsAttachment}
            verbose={verbose}
          />
        </Container>
      );

    case 'mcp_resource':
      return (
        <Container>
          <MCPResourceDisplay
            attachment={attachment as MCPResourceAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'todo':
      return (
        <Container>
          <TodoAttachmentDisplay
            attachment={attachment as TodoAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'command_permissions':
      return (
        <Container>
          <CommandPermissionsDisplay
            attachment={attachment as CommandPermissionsAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'async_hook_response':
      return (
        <Container>
          <HookResponseDisplay
            attachment={attachment as HookResponseAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    case 'async_agent_status':
      return (
        <Container>
          <AsyncAgentStatusDisplay
            attachment={attachment as AsyncAgentStatusAttachment}
            addMargin={false}
            verbose={verbose}
          />
        </Container>
      );

    default:
      // Handle other hook-related attachments
      const anyAttachment = attachment as unknown as Record<string, unknown>;

      if (anyAttachment.type === 'hook_blocking_error' ||
          anyAttachment.type === 'hook_non_blocking_error' ||
          anyAttachment.type === 'hook_error_during_execution') {
        return (
          <Container>
            <HookErrorDisplay
              attachment={anyAttachment as unknown as HookErrorAttachment}
              addMargin={false}
              verbose={verbose}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'hook_success') {
        return (
          <Container>
            <HookSuccessDisplay
              attachment={anyAttachment as unknown as HookSuccessAttachment}
              addMargin={false}
              verbose={verbose}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'hook_stopped_continuation') {
        return (
          <Container>
            <HookStoppedDisplay
              attachment={anyAttachment as unknown as HookStoppedAttachment}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'hook_system_message') {
        return (
          <Container>
            <HookSystemMessageDisplay
              attachment={anyAttachment as unknown as HookSystemMessageAttachment}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'compact_file_reference') {
        return (
          <Container>
            <CompactFileReferenceDisplay
              attachment={anyAttachment as unknown as CompactFileReferenceAttachment}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'nested_memory') {
        return (
          <Container>
            <NestedMemoryDisplay
              attachment={anyAttachment as unknown as NestedMemoryAttachment}
            />
          </Container>
        );
      }

      if (anyAttachment.type === 'queued_command') {
        return (
          <Container>
            <QueuedCommandDisplay
              attachment={anyAttachment as unknown as QueuedCommandAttachment}
              addMargin={false}
              verbose={verbose}
            />
          </Container>
        );
      }

      // Unknown attachment type
      return null;
  }
};

// ============================================================================
// Exports
// ============================================================================

export default Attachment;
