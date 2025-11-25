/**
 * @fileoverview Main UI renderer using Ink for terminal rendering
 * @module ui/renderer
 *
 * This module provides the main renderer component that orchestrates
 * the entire terminal UI, including message display, tool status,
 * permission dialogs, and input handling.
 */
import React from 'react';
import type { NormalizedMessage, Tool, TodoItem, MainRendererProps, ProgressMessage, ToolUseConfirm, ElicitationRequest, HostPattern } from './types.js';
/**
 * Props for the loading spinner
 */
interface LoadingSpinnerProps {
    tip?: string;
    isLoading: boolean;
    responseLength?: number;
    startTime?: number | null;
    overrideMessage?: string | null;
    overrideColor?: string | null;
    overrideShimmerColor?: string | null;
    todos?: TodoItem[];
    hasActiveTools?: boolean;
}
/**
 * Renders a loading spinner with optional message
 */
export declare const LoadingSpinner: React.FC<LoadingSpinnerProps>;
/**
 * Props for todo list display
 */
interface TodoListDisplayProps {
    todos: TodoItem[];
    isStandalone?: boolean;
}
/**
 * Renders the todo list
 */
export declare const TodoListDisplay: React.FC<TodoListDisplayProps>;
/**
 * Props for transcript toggle indicator
 */
interface TranscriptToggleProps {
    isExpanded: boolean;
}
/**
 * Renders transcript toggle hint
 */
export declare const TranscriptToggle: React.FC<TranscriptToggleProps>;
/**
 * Props for message list
 */
interface MessageListProps {
    messages: NormalizedMessage[];
    tools: Tool[];
    verbose: boolean;
    erroredToolUseIDs: Set<string>;
    inProgressToolUseIDs: Set<string>;
    resolvedToolUseIDs: Set<string>;
    progressMessages: Map<string, ProgressMessage[]>;
    shouldAnimate: boolean;
    shouldShowDot: boolean;
    isTranscriptMode: boolean;
    width: number;
}
/**
 * Renders the list of messages
 */
export declare const MessageList: React.FC<MessageListProps>;
/**
 * Props for input area
 */
interface InputAreaProps {
    value: string;
    mode: 'prompt' | 'bash';
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    onModeChange: (mode: 'prompt' | 'bash') => void;
    isLoading: boolean;
    vimMode: boolean;
}
/**
 * Renders the input area with mode indicator
 */
export declare const InputArea: React.FC<InputAreaProps>;
/**
 * Props for message selector screen
 */
interface MessageSelectorProps {
    messages: NormalizedMessage[];
    onRestoreMessage: (message: NormalizedMessage) => void;
    onClose: () => void;
}
/**
 * Message selector screen for history navigation
 */
export declare const MessageSelector: React.FC<MessageSelectorProps>;
/**
 * Main UI renderer state
 */
interface RendererState {
    isLoading: boolean;
    spinnerTip: string;
    currentResponseLength: number;
    loadingStartTime: number | null;
    overrideMessage: string | null;
    overrideColor: string | null;
    todos: TodoItem[];
    showExpandedTodos: boolean;
}
/**
 * Main renderer component props (extended)
 */
interface MainRendererComponentProps extends MainRendererProps {
    sessionState?: RendererState;
    toolUseConfirmQueue?: ToolUseConfirm[];
    erroredToolUseIDs?: Set<string>;
    inProgressToolUseIDs?: Set<string>;
    resolvedToolUseIDs?: Set<string>;
    streamingToolUses?: Map<string, unknown>;
    sandboxPermissionQueue?: Array<{
        hostPattern: HostPattern;
        shouldAllowHost: (allow: boolean) => void;
        recheckPermission: () => void;
    }>;
    elicitationQueue?: ElicitationRequest[];
    showCostThreshold?: boolean;
    onCostAcknowledged?: () => void;
    isMessageSelectorVisible?: boolean;
    onMessageSelectorClose?: () => void;
    onRestoreMessage?: (message: NormalizedMessage) => void;
    showAllInTranscript?: boolean;
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
export declare const MainRenderer: React.FC<MainRendererComponentProps>;
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
export declare function renderUI(props: MainRendererProps): import("ink").Instance;
export default MainRenderer;
//# sourceMappingURL=renderer.d.ts.map