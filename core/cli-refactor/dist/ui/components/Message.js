import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
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
/**
 * Container for a single message row with consistent styling
 */
export const MessageRow = ({ children, dimColor = false }) => {
    return (_jsx(Box, { flexDirection: "row", width: "100%", children: _jsx(Text, { dimColor: dimColor, children: children }) }));
};
/**
 * Displays a visual boundary for compacted conversation sections
 */
export const CompactBoundary = ({ width }) => {
    const dividerChar = '=';
    const title = 'Conversation compacted - ctrl+o for history';
    const padding = Math.max(0, Math.floor((width - title.length - 4) / 2));
    const dividerLine = dividerChar.repeat(padding);
    return (_jsx(Box, { flexDirection: "column", width: "100%", children: _jsxs(Text, { dimColor: true, children: [dividerLine, " ", title, " ", dividerLine] }) }));
};
/**
 * Renders text content from a message
 */
export const TextContent = ({ param, addMargin = false, thinkingMetadata, }) => {
    const hasThinking = thinkingMetadata?.hasThinking;
    return (_jsxs(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, children: [hasThinking && (_jsx(Text, { dimColor: true, italic: true, children: "[Thinking...]" })), _jsx(Text, { wrap: "wrap", children: param.text })] }));
};
/**
 * Renders assistant text content with optional streaming indicator
 */
export const AssistantTextContent = ({ param, addMargin = false, shouldShowDot = false, width, }) => {
    return (_jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, width: width, children: _jsxs(Text, { wrap: "wrap", children: [param.text, shouldShowDot && _jsx(Text, { color: "cyan", children: "|" })] }) }));
};
/**
 * Renders extended thinking content
 */
export const ThinkingContent = ({ param, addMargin = false, verbose = false, isTranscriptMode = false, }) => {
    // Only show in transcript mode or verbose mode
    if (!isTranscriptMode && !verbose) {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, paddingLeft: 2, borderStyle: "single", borderColor: "gray", children: [_jsx(Text, { dimColor: true, bold: true, children: "[Thinking]" }), _jsx(Text, { dimColor: true, wrap: "wrap", children: param.thinking })] }));
};
/**
 * Renders a placeholder for redacted thinking content
 */
export const RedactedThinking = ({ addMargin = false }) => {
    return (_jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, children: _jsx(Text, { dimColor: true, italic: true, children: "[Thinking content redacted]" }) }));
};
/**
 * Gets the status color for a tool use
 */
function getToolStatusColor(toolUseId, errored, inProgress, resolved) {
    if (errored.has(toolUseId))
        return 'red';
    if (inProgress.has(toolUseId))
        return 'yellow';
    if (resolved.has(toolUseId))
        return 'green';
    return 'gray';
}
/**
 * Gets the status indicator text for a tool use
 */
function getToolStatusIndicator(toolUseId, errored, inProgress, resolved) {
    if (errored.has(toolUseId))
        return '[X]';
    if (inProgress.has(toolUseId))
        return '[...]';
    if (resolved.has(toolUseId))
        return '[OK]';
    return '[ ]';
}
/**
 * Renders a tool use invocation
 */
export const ToolUseContent = ({ param, addMargin = false, tools, verbose = false, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs, progressMessagesForMessage, shouldAnimate, shouldShowDot, inProgressToolCallCount, }) => {
    const statusColor = getToolStatusColor(param.id, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs);
    const statusIndicator = getToolStatusIndicator(param.id, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs);
    const isInProgress = inProgressToolUseIDs.has(param.id);
    const tool = tools.find((t) => t.name === param.name);
    // Get relevant progress messages
    const toolProgress = progressMessagesForMessage.filter((p) => p.toolUseId === param.id);
    return (_jsxs(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, children: [_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: statusColor, children: statusIndicator }), _jsx(Text, { bold: true, children: param.name }), isInProgress && shouldAnimate && _jsx(Text, { color: "cyan", children: "..." })] }), verbose && (_jsx(Box, { paddingLeft: 4, flexDirection: "column", children: _jsxs(Text, { dimColor: true, children: ["Input: ", JSON.stringify(param.input, null, 2).slice(0, 200), JSON.stringify(param.input).length > 200 ? '...' : ''] }) })), toolProgress.length > 0 && (_jsx(Box, { paddingLeft: 4, flexDirection: "column", children: toolProgress.map((progress, index) => (_jsx(Text, { dimColor: true, children: progress.content }, index))) }))] }));
};
/**
 * Renders the result of a tool execution
 */
export const ToolResultContent = ({ param, addMargin = false, verbose = false, width, }) => {
    if (!('tool_use_id' in param))
        return null;
    const content = typeof param.content === 'string'
        ? param.content
        : Array.isArray(param.content)
            ? param.content
                .filter((c) => c.type === 'text')
                .map((c) => c.text)
                .join('\n')
            : '';
    const isError = 'is_error' in param && param.is_error;
    // Truncate long results unless in verbose mode
    const maxLength = verbose ? 10000 : 500;
    const displayContent = content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
    return (_jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, paddingLeft: 2, width: width, children: isError ? (_jsx(Text, { color: "red", wrap: "wrap", children: displayContent })) : (_jsx(Text, { dimColor: true, wrap: "wrap", children: displayContent })) }));
};
/**
 * Renders user message content
 */
export const UserMessageContent = ({ message, param, addMargin = false, verbose = false, }) => {
    if (param.type === 'text') {
        return (_jsx(TextContent, { param: param, addMargin: addMargin, verbose: verbose, thinkingMetadata: message.thinkingMetadata }));
    }
    if (param.type === 'tool_result') {
        return (_jsx(ToolResultContent, { param: param, message: message, messages: [], progressMessagesForMessage: [], tools: [], addMargin: addMargin, verbose: verbose }));
    }
    return null;
};
/**
 * Renders assistant message content based on block type
 */
export const AssistantMessageContent = ({ param, addMargin = false, tools, verbose = false, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs, progressMessagesForMessage, shouldAnimate, shouldShowDot, width, inProgressToolCallCount, isTranscriptMode = false, messages, }) => {
    switch (param.type) {
        case 'tool_use':
            return (_jsx(ToolUseContent, { param: param, addMargin: addMargin, tools: tools, verbose: verbose, erroredToolUseIDs: erroredToolUseIDs, inProgressToolUseIDs: inProgressToolUseIDs, resolvedToolUseIDs: resolvedToolUseIDs, progressMessagesForMessage: progressMessagesForMessage, shouldAnimate: shouldAnimate, shouldShowDot: shouldShowDot, inProgressToolCallCount: inProgressToolCallCount, messages: messages }));
        case 'text':
            return (_jsx(AssistantTextContent, { param: param, addMargin: addMargin, shouldShowDot: shouldShowDot, width: width }));
        case 'redacted_thinking':
            if (!isTranscriptMode && !verbose)
                return null;
            return _jsx(RedactedThinking, { addMargin: addMargin });
        case 'thinking':
            if (!isTranscriptMode && !verbose)
                return null;
            return (_jsx(ThinkingContent, { param: param, addMargin: addMargin, isTranscriptMode: isTranscriptMode, verbose: verbose }));
        default:
            return null;
    }
};
/**
 * Renders system messages
 */
export const SystemMessage = ({ message, addMargin = false, verbose = false, }) => {
    const content = message.content || '';
    // Determine styling based on subtype
    let color;
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
    return (_jsx(Box, { flexDirection: "column", marginTop: addMargin ? 1 : 0, children: _jsxs(Text, { color: color, dimColor: !color, children: [SYSTEM_SYMBOL, " ", content] }) }));
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
export const Message = ({ message, messages, addMargin = false, tools, verbose = false, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs, progressMessagesForMessage, shouldAnimate, shouldShowDot, style, width, isTranscriptMode = false, }) => {
    switch (message.type) {
        case 'attachment':
            if (!message.attachment)
                return null;
            return (_jsx(Attachment, { attachment: message.attachment, addMargin: addMargin, verbose: verbose }));
        case 'assistant': {
            const assistantMessage = message.message;
            if (!assistantMessage || !Array.isArray(assistantMessage.content)) {
                return null;
            }
            return (_jsx(Box, { flexDirection: "column", width: "100%", children: assistantMessage.content.map((block, index) => (_jsx(AssistantMessageContent, { param: block, addMargin: addMargin, tools: tools, verbose: verbose, erroredToolUseIDs: erroredToolUseIDs, inProgressToolUseIDs: inProgressToolUseIDs, resolvedToolUseIDs: resolvedToolUseIDs, progressMessagesForMessage: progressMessagesForMessage, shouldAnimate: shouldAnimate, shouldShowDot: shouldShowDot, width: width, inProgressToolCallCount: inProgressToolUseIDs.size, isTranscriptMode: isTranscriptMode, messages: messages }, index))) }));
        }
        case 'user': {
            const userMessage = message.message;
            if (!userMessage)
                return null;
            const content = userMessage.content;
            // Handle string content
            if (typeof content === 'string') {
                // Check for command message markers
                if (content.includes('<command-message>')) {
                    return (_jsx(TextContent, { param: { type: 'text', text: content }, addMargin: addMargin, verbose: verbose }));
                }
                return (_jsx(TextContent, { param: { type: 'text', text: content }, addMargin: addMargin, verbose: verbose }));
            }
            // Handle array content
            if (Array.isArray(content)) {
                return (_jsx(Box, { flexDirection: "column", width: "100%", children: content.map((block, index) => (_jsx(UserMessageContent, { message: message, messages: messages, addMargin: addMargin, tools: tools, progressMessagesForMessage: progressMessagesForMessage, param: block, style: style, verbose: verbose }, index))) }));
            }
            return null;
        }
        case 'system': {
            // Handle compact boundary
            if (message.subtype === 'compact_boundary') {
                return _jsx(CompactBoundary, { width: width || 80 });
            }
            // Handle local command display
            if (message.subtype === 'local_command') {
                return (_jsx(TextContent, { param: { type: 'text', text: message.content || '' }, addMargin: addMargin, verbose: verbose }));
            }
            return _jsx(SystemMessage, { message: message, addMargin: addMargin, verbose: verbose });
        }
        default:
            return null;
    }
};
// ============================================================================
// Exports
// ============================================================================
export default Message;
//# sourceMappingURL=Message.js.map