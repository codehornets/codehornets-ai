import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Main UI renderer using Ink for terminal rendering
 * @module ui/renderer
 *
 * This module provides the main renderer component that orchestrates
 * the entire terminal UI, including message display, tool status,
 * permission dialogs, and input handling.
 */
import { useState, useEffect, useMemo } from 'react';
import { Box, Text, render, useApp, useInput, useStdout } from 'ink';
import { Message } from './components/Message.js';
import { ToolPermissionDialog, SandboxPermissionDialog, ElicitationDialog, CostThresholdDialog, } from './components/Permission.js';
import { useInputState, useProgressMessages, useTerminalDimensions, useAnimation, } from './hooks/index.js';
// ============================================================================
// Constants
// ============================================================================
/**
 * Default minimum width for the terminal
 */
const MIN_TERMINAL_WIDTH = 40;
/**
 * Padding for content area
 */
const CONTENT_PADDING = 2;
/**
 * Renders a loading spinner with optional message
 */
export const LoadingSpinner = ({ tip, isLoading, responseLength = 0, startTime, overrideMessage, overrideColor, todos = [], hasActiveTools = false, }) => {
    const [frame, setFrame] = useState(0);
    const spinnerFrames = ['|', '/', '-', '\\'];
    useEffect(() => {
        if (!isLoading)
            return;
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % spinnerFrames.length);
        }, 100);
        return () => clearInterval(interval);
    }, [isLoading, spinnerFrames.length]);
    if (!isLoading)
        return null;
    // Calculate elapsed time
    const elapsedMs = startTime ? Date.now() - startTime : 0;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    // Get active todo
    const activeTodo = todos.find((t) => t.status === 'in_progress');
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: overrideColor || 'cyan', children: spinnerFrames[frame] }), _jsx(Text, { color: overrideColor || 'cyan', children: overrideMessage || tip || 'Thinking...' }), elapsedSec > 0 && (_jsxs(Text, { dimColor: true, children: ["(", elapsedSec, "s)"] }))] }), activeTodo && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { dimColor: true, children: activeTodo.activeForm || activeTodo.content }) })), responseLength > 0 && (_jsx(Box, { paddingLeft: 2, children: _jsxs(Text, { dimColor: true, children: ["Response: ", responseLength.toLocaleString(), " characters"] }) })), hasActiveTools && (_jsx(Box, { paddingLeft: 2, children: _jsx(Text, { dimColor: true, children: "Tools running..." }) }))] }));
};
/**
 * Renders the todo list
 */
export const TodoListDisplay = ({ todos, isStandalone = false, }) => {
    if (todos.length === 0)
        return null;
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return '[x]';
            case 'in_progress':
                return '[~]';
            case 'pending':
                return '[ ]';
            default:
                return '[ ]';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'green';
            case 'in_progress':
                return 'yellow';
            default:
                return undefined;
        }
    };
    return (_jsxs(Box, { flexDirection: "column", marginTop: isStandalone ? 0 : 1, children: [isStandalone && (_jsx(Text, { bold: true, dimColor: true, children: "Tasks:" })), todos.map((todo, index) => (_jsxs(Box, { flexDirection: "row", paddingLeft: isStandalone ? 0 : 2, children: [_jsx(Text, { color: getStatusColor(todo.status), children: getStatusIcon(todo.status) }), _jsxs(Text, { dimColor: todo.status === 'completed', children: [" ", todo.content] })] }, todo.id || index)))] }));
};
/**
 * Renders transcript toggle hint
 */
export const TranscriptToggle = ({ isExpanded, }) => {
    return (_jsx(Box, { alignItems: "center", alignSelf: "center", borderStyle: "single", borderColor: "gray", marginTop: 1, paddingLeft: 2, width: "100%", children: _jsx(Text, { dimColor: true, children: isExpanded
                ? 'Showing detailed transcript - Ctrl+O to toggle'
                : 'Press Ctrl+O to expand transcript' }) }));
};
/**
 * Renders the list of messages
 */
export const MessageList = ({ messages, tools, verbose, erroredToolUseIDs, inProgressToolUseIDs, resolvedToolUseIDs, progressMessages, shouldAnimate, shouldShowDot, isTranscriptMode, width, }) => {
    return (_jsx(Box, { flexDirection: "column", width: "100%", children: messages.map((message, index) => {
            const messageId = message.uuid || `msg-${index}`;
            const messageProgress = progressMessages.get(messageId) || [];
            const isLastMessage = index === messages.length - 1;
            return (_jsx(Message, { message: message, messages: messages, addMargin: index > 0, tools: tools, verbose: verbose, erroredToolUseIDs: erroredToolUseIDs, inProgressToolUseIDs: inProgressToolUseIDs, resolvedToolUseIDs: resolvedToolUseIDs, progressMessagesForMessage: messageProgress, shouldAnimate: shouldAnimate && isLastMessage, shouldShowDot: shouldShowDot && isLastMessage, width: width - CONTENT_PADDING * 2, isTranscriptMode: isTranscriptMode }, messageId));
        }) }));
};
/**
 * Renders the input area with mode indicator
 */
export const InputArea = ({ value, mode, onChange, onSubmit, onModeChange, isLoading, vimMode, }) => {
    useInput((input, key) => {
        if (isLoading)
            return;
        // Submit on enter
        if (key.return) {
            onSubmit(value);
            return;
        }
        // Toggle mode with Ctrl+B
        if (key.ctrl && input === 'b') {
            onModeChange(mode === 'prompt' ? 'bash' : 'prompt');
            return;
        }
        // Handle backspace
        if (key.backspace || key.delete) {
            onChange(value.slice(0, -1));
            return;
        }
        // Regular character input
        if (input && !key.ctrl && !key.meta) {
            onChange(value + input);
        }
    });
    const modeIndicator = mode === 'bash' ? '$ ' : '> ';
    const modeColor = mode === 'bash' ? 'yellow' : 'cyan';
    return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: modeColor, bold: true, children: modeIndicator }), _jsx(Text, { children: value }), _jsx(Text, { color: "gray", children: "|" })] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: [vimMode ? '[vim] ' : '', "[Ctrl+B] Toggle mode | [Enter] Submit | [Ctrl+C] Cancel"] }) })] }));
};
/**
 * Message selector screen for history navigation
 */
export const MessageSelector = ({ messages, onRestoreMessage, onClose, }) => {
    const [selectedIndex, setSelectedIndex] = useState(messages.length - 1);
    // Filter to user messages only
    const userMessages = useMemo(() => messages.filter((m) => m.type === 'user'), [messages]);
    useInput((input, key) => {
        if (key.escape || input === 'q') {
            onClose();
            return;
        }
        if (key.upArrow) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
            return;
        }
        if (key.downArrow) {
            setSelectedIndex((prev) => Math.min(userMessages.length - 1, prev + 1));
            return;
        }
        if (key.return) {
            const selected = userMessages[selectedIndex];
            if (selected) {
                onRestoreMessage(selected);
                onClose();
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "Message History" }), _jsx(Text, { dimColor: true, children: "Select a message to restore" }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: userMessages.map((message, index) => {
                    const isSelected = index === selectedIndex;
                    const content = typeof message.message?.content === 'string'
                        ? message.message.content.slice(0, 50)
                        : '[Complex message]';
                    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: isSelected ? 'cyan' : undefined, children: isSelected ? '> ' : '  ' }), _jsx(Text, { bold: isSelected, children: content })] }, message.uuid || index));
                }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "[Arrow keys] Navigate | [Enter] Select | [Esc] Close" }) })] }));
};
/**
 * Determines the current screen based on state
 */
function determineScreen(props) {
    const { sandboxPermissionQueue = [], toolUseConfirmQueue = [], elicitationQueue = [], showCostThreshold = false, isMessageSelectorVisible = false, } = props;
    if (isMessageSelectorVisible)
        return 'message-selector';
    if (sandboxPermissionQueue.length > 0)
        return 'sandbox-permission';
    if (toolUseConfirmQueue.length > 0)
        return 'tool-permission';
    if (elicitationQueue.length > 0)
        return 'elicitation';
    if (showCostThreshold)
        return 'cost';
    return 'main';
}
/**
 * Main renderer component that orchestrates the entire terminal UI.
 *
 * @param props - Main renderer props
 * @returns Rendered main UI
 *
 * @example
 * ```tsx
 * <MainRenderer
 *   messages={messages}
 *   tools={tools}
 *   verbose={false}
 *   isLoading={isLoading}
 *   screen="main"
 *   onSubmit={(input) => handleSubmit(input)}
 *   onExit={() => handleExit()}
 * />
 * ```
 */
export const MainRenderer = (props) => {
    const { messages, tools, verbose, isLoading, onSubmit, onExit, sessionState, toolUseConfirmQueue = [], erroredToolUseIDs = new Set(), inProgressToolUseIDs = new Set(), resolvedToolUseIDs = new Set(), sandboxPermissionQueue = [], elicitationQueue = [], showCostThreshold = false, onCostAcknowledged, isMessageSelectorVisible = false, onMessageSelectorClose, onRestoreMessage, showAllInTranscript = false, } = props;
    const { exit } = useApp();
    const { stdout } = useStdout();
    const dimensions = useTerminalDimensions();
    const animation = useAnimation();
    const progressState = useProgressMessages();
    const inputState = useInputState();
    // Determine current screen
    const currentScreen = determineScreen(props);
    // Calculate width
    const width = Math.max(dimensions.columns || 80, MIN_TERMINAL_WIDTH);
    // Handle global keyboard shortcuts
    useInput((input, key) => {
        // Exit on Ctrl+C
        if (key.ctrl && input === 'c') {
            onExit();
            exit();
            return;
        }
        // Toggle transcript on Ctrl+O
        if (key.ctrl && input === 'o') {
            // Would dispatch to toggle transcript
            return;
        }
    });
    // Render based on current screen
    const renderScreen = () => {
        switch (currentScreen) {
            case 'message-selector':
                return (_jsx(MessageSelector, { messages: messages, onRestoreMessage: onRestoreMessage || (() => { }), onClose: onMessageSelectorClose || (() => { }) }));
            case 'sandbox-permission': {
                const request = sandboxPermissionQueue[0];
                if (sandboxPermissionQueue.length > 0 && request) {
                    return (_jsx(SandboxPermissionDialog, { hostPattern: request.hostPattern, onUserResponse: (response) => {
                            request.shouldAllowHost(response.allow);
                        } }));
                }
                return null;
            }
            case 'tool-permission': {
                const confirm = toolUseConfirmQueue[0];
                if (toolUseConfirmQueue.length > 0 && confirm) {
                    return (_jsx(ToolPermissionDialog, { toolUseConfirm: confirm, toolUseContext: {}, onDone: () => {
                            // Handle approval
                        }, onReject: () => {
                            // Handle rejection
                        }, verbose: verbose }));
                }
                return null;
            }
            case 'elicitation': {
                const elicitRequest = elicitationQueue[0];
                if (elicitationQueue.length > 0 && elicitRequest) {
                    return (_jsx(ElicitationDialog, { serverName: elicitRequest.serverName, request: elicitRequest.request, onResponse: (action, content) => {
                            elicitRequest.respond({ action, content });
                        }, signal: elicitRequest.signal }));
                }
                return null;
            }
            case 'cost':
                return (_jsx(CostThresholdDialog, { onDone: onCostAcknowledged || (() => { }) }));
            default:
                // Main screen
                return null;
        }
    };
    // Get session state values
    const { spinnerTip = '', currentResponseLength = 0, loadingStartTime = null, overrideMessage = null, overrideColor = null, todos = [], showExpandedTodos = false, } = sessionState || {};
    return (_jsxs(Box, { flexDirection: "column", width: width, padding: 1, children: [_jsx(MessageList, { messages: messages, tools: tools, verbose: verbose, erroredToolUseIDs: erroredToolUseIDs, inProgressToolUseIDs: inProgressToolUseIDs, resolvedToolUseIDs: resolvedToolUseIDs, progressMessages: progressState.progressMessages, shouldAnimate: animation.shouldAnimate, shouldShowDot: animation.shouldShowDot, isTranscriptMode: showAllInTranscript, width: width }), showAllInTranscript && _jsx(TranscriptToggle, { isExpanded: showAllInTranscript }), isLoading && (_jsx(LoadingSpinner, { tip: spinnerTip, isLoading: isLoading, responseLength: currentResponseLength, startTime: loadingStartTime, overrideMessage: overrideMessage, overrideColor: overrideColor, todos: todos, hasActiveTools: inProgressToolUseIDs.size > 0 })), !isLoading && showExpandedTodos && (_jsx(TodoListDisplay, { todos: todos, isStandalone: true })), currentScreen !== 'main' && renderScreen(), currentScreen === 'main' && !isLoading && (_jsx(InputArea, { value: inputState.value, mode: inputState.mode, onChange: inputState.setValue, onSubmit: onSubmit, onModeChange: inputState.setMode, isLoading: isLoading, vimMode: inputState.vimMode }))] }));
};
// ============================================================================
// Render Function
// ============================================================================
/**
 * Renders the main UI to the terminal.
 *
 * @param props - Props for the main renderer
 * @returns Ink render instance
 *
 * @example
 * ```typescript
 * const { unmount, waitUntilExit } = renderUI({
 *   messages: [],
 *   tools: [],
 *   verbose: false,
 *   isLoading: false,
 *   screen: 'main',
 *   onSubmit: (input) => console.log(input),
 *   onExit: () => process.exit(0),
 * });
 *
 * await waitUntilExit();
 * ```
 */
export function renderUI(props) {
    return render(_jsx(MainRenderer, { ...props }));
}
// ============================================================================
// Exports
// ============================================================================
export default MainRenderer;
//# sourceMappingURL=renderer.js.map