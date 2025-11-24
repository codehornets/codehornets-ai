/**
 * @fileoverview Message rendering components for the CLI UI
 * @module ui/components/Message
 *
 * This module provides React components for rendering different types
 * of messages in the terminal UI, including user messages, assistant
 * messages, and system messages.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type {
  NormalizedMessage,
  MessageRendererProps,
  Tool,
  ProgressMessage,
  ContentBlock,
  TextContentBlock,
  ToolUseContentBlock,
  ThinkingContentBlock,
  ThinkingMetadata,
  MarginProps,
  VerboseProps,
} from '../types.js';
import { Attachment } from './Attachment.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Symbol used to indicate the assistant is speaking
 */
const ASSISTANT_SYMBOL = '';

/**
 * Symbol used for user messages
 */
const USER_SYMBOL = '>';

/**
 * Symbol used for system messages
 */
const SYSTEM_SYMBOL = '';

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Props for the message row container
 */
interface MessageRowProps {
  children: React.ReactNode;
  dimColor?: boolean;
}

/**
 * Container for a single message row with consistent styling
 */
export const MessageRow: React.FC<MessageRowProps> = ({ children, dimColor = false }) => {
  return (
    <Box flexDirection="row" width="100%">
      <Text dimColor={dimColor}>{children}</Text>
    </Box>
  );
};

/**
 * Props for compact boundary display
 */
interface CompactBoundaryProps {
  width: number;
}

/**
 * Displays a visual boundary for compacted conversation sections
 */
export const CompactBoundary: React.FC<CompactBoundaryProps> = ({ width }) => {
  const dividerChar = '=';
  const title = 'Conversation compacted - ctrl+o for history';
  const padding = Math.max(0, Math.floor((width - title.length - 4) / 2));
  const dividerLine = dividerChar.repeat(padding);

  return (
    <Box flexDirection="column" width="100%">
      <Text dimColor>
        {dividerLine} {title} {dividerLine}
      </Text>
    </Box>
  );
};

// ============================================================================
// Text Content Components
// ============================================================================

/**
 * Props for text content rendering
 */
interface TextContentProps extends MarginProps, VerboseProps {
  param: TextContentBlock;
  thinkingMetadata?: ThinkingMetadata;
}

/**
 * Renders text content from a message
 */
export const TextContent: React.FC<TextContentProps> = ({
  param,
  addMargin = false,
  thinkingMetadata,
}) => {
  const hasThinking = thinkingMetadata?.hasThinking;

  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      {hasThinking && (
        <Text dimColor italic>
          [Thinking...]
        </Text>
      )}
      <Text wrap="wrap">{param.text}</Text>
    </Box>
  );
};

/**
 * Props for assistant text content
 */
interface AssistantTextContentProps extends MarginProps {
  param: TextContentBlock;
  shouldShowDot: boolean;
  width?: number;
}

/**
 * Renders assistant text content with optional streaming indicator
 */
export const AssistantTextContent: React.FC<AssistantTextContentProps> = ({
  param,
  addMargin = false,
  shouldShowDot = false,
  width,
}) => {
  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0} width={width}>
      <Text wrap="wrap">
        {param.text}
        {shouldShowDot && <Text color="cyan">|</Text>}
      </Text>
    </Box>
  );
};

// ============================================================================
// Thinking Content Components
// ============================================================================

/**
 * Props for thinking content display
 */
interface ThinkingContentProps extends MarginProps, VerboseProps {
  param: ThinkingContentBlock;
  isTranscriptMode?: boolean;
}

/**
 * Renders extended thinking content
 */
export const ThinkingContent: React.FC<ThinkingContentProps> = ({
  param,
  addMargin = false,
  verbose = false,
  isTranscriptMode = false,
}) => {
  // Only show in transcript mode or verbose mode
  if (!isTranscriptMode && !verbose) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      marginTop={addMargin ? 1 : 0}
      paddingLeft={2}
      borderStyle="single"
      borderColor="gray"
    >
      <Text dimColor bold>
        [Thinking]
      </Text>
      <Text dimColor wrap="wrap">
        {param.thinking}
      </Text>
    </Box>
  );
};

/**
 * Props for redacted thinking indicator
 */
interface RedactedThinkingProps extends MarginProps {}

/**
 * Renders a placeholder for redacted thinking content
 */
export const RedactedThinking: React.FC<RedactedThinkingProps> = ({ addMargin = false }) => {
  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      <Text dimColor italic>
        [Thinking content redacted]
      </Text>
    </Box>
  );
};

// ============================================================================
// Tool Use Components
// ============================================================================

/**
 * Props for tool use content rendering
 */
interface ToolUseContentProps extends MarginProps, VerboseProps {
  param: ToolUseContentBlock;
  tools: Tool[];
  erroredToolUseIDs: Set<string>;
  inProgressToolUseIDs: Set<string>;
  resolvedToolUseIDs: Set<string>;
  progressMessagesForMessage: ProgressMessage[];
  shouldAnimate: boolean;
  shouldShowDot: boolean;
  inProgressToolCallCount: number;
  messages: NormalizedMessage[];
}

/**
 * Gets the status color for a tool use
 */
function getToolStatusColor(
  toolUseId: string,
  errored: Set<string>,
  inProgress: Set<string>,
  resolved: Set<string>
): string {
  if (errored.has(toolUseId)) return 'red';
  if (inProgress.has(toolUseId)) return 'yellow';
  if (resolved.has(toolUseId)) return 'green';
  return 'gray';
}

/**
 * Gets the status indicator text for a tool use
 */
function getToolStatusIndicator(
  toolUseId: string,
  errored: Set<string>,
  inProgress: Set<string>,
  resolved: Set<string>
): string {
  if (errored.has(toolUseId)) return '[X]';
  if (inProgress.has(toolUseId)) return '[...]';
  if (resolved.has(toolUseId)) return '[OK]';
  return '[ ]';
}

/**
 * Renders a tool use invocation
 */
export const ToolUseContent: React.FC<ToolUseContentProps> = ({
  param,
  addMargin = false,
  tools,
  verbose = false,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  resolvedToolUseIDs,
  progressMessagesForMessage,
  shouldAnimate,
  shouldShowDot,
  inProgressToolCallCount,
}) => {
  const statusColor = getToolStatusColor(
    param.id,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    resolvedToolUseIDs
  );

  const statusIndicator = getToolStatusIndicator(
    param.id,
    erroredToolUseIDs,
    inProgressToolUseIDs,
    resolvedToolUseIDs
  );

  const isInProgress = inProgressToolUseIDs.has(param.id);
  const tool = tools.find((t) => t.name === param.name);

  // Get relevant progress messages
  const toolProgress = progressMessagesForMessage.filter(
    (p) => p.toolUseId === param.id
  );

  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      <Box flexDirection="row" gap={1}>
        <Text color={statusColor}>{statusIndicator}</Text>
        <Text bold>{param.name}</Text>
        {isInProgress && shouldAnimate && <Text color="cyan">...</Text>}
      </Box>

      {/* Show input parameters in verbose mode */}
      {verbose && (
        <Box paddingLeft={4} flexDirection="column">
          <Text dimColor>
            Input: {JSON.stringify(param.input, null, 2).slice(0, 200)}
            {JSON.stringify(param.input).length > 200 ? '...' : ''}
          </Text>
        </Box>
      )}

      {/* Show progress messages */}
      {toolProgress.length > 0 && (
        <Box paddingLeft={4} flexDirection="column">
          {toolProgress.map((progress, index) => (
            <Text key={index} dimColor>
              {progress.content}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// Tool Result Components
// ============================================================================

/**
 * Props for tool result rendering
 */
interface ToolResultContentProps extends MarginProps, VerboseProps {
  param: ContentBlock & { type: 'tool_result' };
  message: NormalizedMessage;
  messages: NormalizedMessage[];
  progressMessagesForMessage: ProgressMessage[];
  style?: Record<string, unknown>;
  tools: Tool[];
  width?: number;
}

/**
 * Renders the result of a tool execution
 */
export const ToolResultContent: React.FC<ToolResultContentProps> = ({
  param,
  addMargin = false,
  verbose = false,
  width,
}) => {
  if (!('tool_use_id' in param)) return null;

  const content =
    typeof param.content === 'string'
      ? param.content
      : Array.isArray(param.content)
      ? param.content
          .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
          .map((c) => c.text)
          .join('\n')
      : '';

  const isError = 'is_error' in param && param.is_error;

  // Truncate long results unless in verbose mode
  const maxLength = verbose ? 10000 : 500;
  const displayContent =
    content.length > maxLength ? content.slice(0, maxLength) + '...' : content;

  return (
    <Box
      flexDirection="column"
      marginTop={addMargin ? 1 : 0}
      paddingLeft={2}
      width={width}
    >
      {isError ? (
        <Text color="red" wrap="wrap">
          {displayContent}
        </Text>
      ) : (
        <Text dimColor wrap="wrap">
          {displayContent}
        </Text>
      )}
    </Box>
  );
};

// ============================================================================
// User Message Component
// ============================================================================

/**
 * Props for user message content
 */
interface UserMessageContentProps extends MarginProps, VerboseProps {
  message: NormalizedMessage;
  messages: NormalizedMessage[];
  tools: Tool[];
  progressMessagesForMessage: ProgressMessage[];
  param: ContentBlock;
  style?: Record<string, unknown>;
}

/**
 * Renders user message content
 */
export const UserMessageContent: React.FC<UserMessageContentProps> = ({
  message,
  param,
  addMargin = false,
  verbose = false,
}) => {
  if (param.type === 'text') {
    return (
      <TextContent
        param={param}
        addMargin={addMargin}
        verbose={verbose}
        thinkingMetadata={message.thinkingMetadata}
      />
    );
  }

  if (param.type === 'tool_result') {
    return (
      <ToolResultContent
        param={param as ContentBlock & { type: 'tool_result' }}
        message={message}
        messages={[]}
        progressMessagesForMessage={[]}
        tools={[]}
        addMargin={addMargin}
        verbose={verbose}
      />
    );
  }

  return null;
};

// ============================================================================
// Assistant Message Component
// ============================================================================

/**
 * Props for assistant message content
 */
interface AssistantMessageContentProps extends MarginProps, VerboseProps {
  param: ContentBlock;
  tools: Tool[];
  erroredToolUseIDs: Set<string>;
  inProgressToolUseIDs: Set<string>;
  resolvedToolUseIDs: Set<string>;
  progressMessagesForMessage: ProgressMessage[];
  shouldAnimate: boolean;
  shouldShowDot: boolean;
  width?: number;
  inProgressToolCallCount: number;
  isTranscriptMode?: boolean;
  messages: NormalizedMessage[];
}

/**
 * Renders assistant message content based on block type
 */
export const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({
  param,
  addMargin = false,
  tools,
  verbose = false,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  resolvedToolUseIDs,
  progressMessagesForMessage,
  shouldAnimate,
  shouldShowDot,
  width,
  inProgressToolCallCount,
  isTranscriptMode = false,
  messages,
}) => {
  switch (param.type) {
    case 'tool_use':
      return (
        <ToolUseContent
          param={param}
          addMargin={addMargin}
          tools={tools}
          verbose={verbose}
          erroredToolUseIDs={erroredToolUseIDs}
          inProgressToolUseIDs={inProgressToolUseIDs}
          resolvedToolUseIDs={resolvedToolUseIDs}
          progressMessagesForMessage={progressMessagesForMessage}
          shouldAnimate={shouldAnimate}
          shouldShowDot={shouldShowDot}
          inProgressToolCallCount={inProgressToolCallCount}
          messages={messages}
        />
      );

    case 'text':
      return (
        <AssistantTextContent
          param={param}
          addMargin={addMargin}
          shouldShowDot={shouldShowDot}
          width={width}
        />
      );

    case 'redacted_thinking':
      if (!isTranscriptMode && !verbose) return null;
      return <RedactedThinking addMargin={addMargin} />;

    case 'thinking':
      if (!isTranscriptMode && !verbose) return null;
      return (
        <ThinkingContent
          param={param}
          addMargin={addMargin}
          isTranscriptMode={isTranscriptMode}
          verbose={verbose}
        />
      );

    default:
      return null;
  }
};

// ============================================================================
// System Message Component
// ============================================================================

/**
 * Props for system message rendering
 */
interface SystemMessageProps extends MarginProps, VerboseProps {
  message: NormalizedMessage;
}

/**
 * Renders system messages
 */
export const SystemMessage: React.FC<SystemMessageProps> = ({
  message,
  addMargin = false,
  verbose = false,
}) => {
  const content = message.content || '';

  // Determine styling based on subtype
  let color: string | undefined;
  switch (message.subtype) {
    case 'error':
      color = 'red';
      break;
    case 'warning':
      color = 'yellow';
      break;
    case 'info':
      color = 'cyan';
      break;
    default:
      color = undefined;
  }

  return (
    <Box flexDirection="column" marginTop={addMargin ? 1 : 0}>
      <Text color={color} dimColor={!color}>
        {SYSTEM_SYMBOL} {content}
      </Text>
    </Box>
  );
};

// ============================================================================
// Main Message Renderer
// ============================================================================

/**
 * Main message renderer component that dispatches to specific renderers
 * based on message type.
 *
 * @param props - Message renderer props
 * @returns Rendered message component
 *
 * @example
 * ```tsx
 * <Message
 *   message={normalizedMessage}
 *   messages={allMessages}
 *   tools={availableTools}
 *   verbose={isVerboseMode}
 *   // ... other props
 * />
 * ```
 */
export const Message: React.FC<MessageRendererProps> = ({
  message,
  messages,
  addMargin = false,
  tools,
  verbose = false,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  resolvedToolUseIDs,
  progressMessagesForMessage,
  shouldAnimate,
  shouldShowDot,
  style,
  width,
  isTranscriptMode = false,
}) => {
  switch (message.type) {
    case 'attachment':
      if (!message.attachment) return null;
      return (
        <Attachment
          attachment={message.attachment}
          addMargin={addMargin}
          verbose={verbose}
        />
      );

    case 'assistant': {
      const assistantMessage = message.message;
      if (!assistantMessage || !Array.isArray(assistantMessage.content)) {
        return null;
      }

      return (
        <Box flexDirection="column" width="100%">
          {assistantMessage.content.map((block, index) => (
            <AssistantMessageContent
              key={index}
              param={block}
              addMargin={addMargin}
              tools={tools}
              verbose={verbose}
              erroredToolUseIDs={erroredToolUseIDs}
              inProgressToolUseIDs={inProgressToolUseIDs}
              resolvedToolUseIDs={resolvedToolUseIDs}
              progressMessagesForMessage={progressMessagesForMessage}
              shouldAnimate={shouldAnimate}
              shouldShowDot={shouldShowDot}
              width={width}
              inProgressToolCallCount={inProgressToolUseIDs.size}
              isTranscriptMode={isTranscriptMode}
              messages={messages}
            />
          ))}
        </Box>
      );
    }

    case 'user': {
      const userMessage = message.message;
      if (!userMessage) return null;

      const content = userMessage.content;

      // Handle string content
      if (typeof content === 'string') {
        // Check for command message markers
        if (content.includes('<command-message>')) {
          return (
            <TextContent
              param={{ type: 'text', text: content }}
              addMargin={addMargin}
              verbose={verbose}
            />
          );
        }

        return (
          <TextContent
            param={{ type: 'text', text: content }}
            addMargin={addMargin}
            verbose={verbose}
          />
        );
      }

      // Handle array content
      if (Array.isArray(content)) {
        return (
          <Box flexDirection="column" width="100%">
            {content.map((block, index) => (
              <UserMessageContent
                key={index}
                message={message}
                messages={messages}
                addMargin={addMargin}
                tools={tools}
                progressMessagesForMessage={progressMessagesForMessage}
                param={block}
                style={style}
                verbose={verbose}
              />
            ))}
          </Box>
        );
      }

      return null;
    }

    case 'system': {
      // Handle compact boundary
      if (message.subtype === 'compact_boundary') {
        return <CompactBoundary width={width || 80} />;
      }

      // Handle local command display
      if (message.subtype === 'local_command') {
        return (
          <TextContent
            param={{ type: 'text', text: message.content || '' }}
            addMargin={addMargin}
            verbose={verbose}
          />
        );
      }

      return <SystemMessage message={message} addMargin={addMargin} verbose={verbose} />;
    }

    default:
      return null;
  }
};

// ============================================================================
// Exports
// ============================================================================

export default Message;
