/**
 * @fileoverview Message rendering components for the CLI UI
 * @module ui/components/Message
 *
 * This module provides React components for rendering different types
 * of messages in the terminal UI, including user messages, assistant
 * messages, and system messages.
 */
import React from 'react';
import type { NormalizedMessage, MessageRendererProps, Tool, ProgressMessage, ContentBlock, TextContentBlock, ToolUseContentBlock, ThinkingContentBlock, ThinkingMetadata, MarginProps, VerboseProps } from '../types.js';
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
export declare const MessageRow: React.FC<MessageRowProps>;
/**
 * Props for compact boundary display
 */
interface CompactBoundaryProps {
    width: number;
}
/**
 * Displays a visual boundary for compacted conversation sections
 */
export declare const CompactBoundary: React.FC<CompactBoundaryProps>;
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
export declare const TextContent: React.FC<TextContentProps>;
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
export declare const AssistantTextContent: React.FC<AssistantTextContentProps>;
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
export declare const ThinkingContent: React.FC<ThinkingContentProps>;
/**
 * Props for redacted thinking indicator
 */
interface RedactedThinkingProps extends MarginProps {
}
/**
 * Renders a placeholder for redacted thinking content
 */
export declare const RedactedThinking: React.FC<RedactedThinkingProps>;
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
 * Renders a tool use invocation
 */
export declare const ToolUseContent: React.FC<ToolUseContentProps>;
/**
 * Props for tool result rendering
 */
interface ToolResultContentProps extends MarginProps, VerboseProps {
    param: ContentBlock & {
        type: 'tool_result';
    };
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
export declare const ToolResultContent: React.FC<ToolResultContentProps>;
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
export declare const UserMessageContent: React.FC<UserMessageContentProps>;
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
export declare const AssistantMessageContent: React.FC<AssistantMessageContentProps>;
/**
 * Props for system message rendering
 */
interface SystemMessageProps extends MarginProps, VerboseProps {
    message: NormalizedMessage;
}
/**
 * Renders system messages
 */
export declare const SystemMessage: React.FC<SystemMessageProps>;
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
export declare const Message: React.FC<MessageRendererProps>;
export default Message;
//# sourceMappingURL=Message.d.ts.map