/**
 * @fileoverview Session state management hooks for the CLI UI
 * @module ui/hooks/useSession
 *
 * This module provides React hooks for managing session state,
 * including messages, tools, permissions, and UI state.
 */
import type { NormalizedMessage, Tool, ToolUseConfirm, ToolPermissionContext, TodoItem, ScreenType, InputMode, ProgressMessage, ElicitationRequest, HostPattern } from '../types.js';
/**
 * Session state structure
 */
export interface SessionState {
    /** All messages in the conversation */
    messages: NormalizedMessage[];
    /** Whether the assistant is currently generating a response */
    isLoading: boolean;
    /** Current spinner tip message */
    spinnerTip: string;
    /** Length of current response being streamed */
    currentResponseLength: number;
    /** Override message to display instead of normal content */
    overrideMessage: string | null;
    /** Override color for spinner */
    overrideColor: string | null;
    /** Override shimmer color */
    overrideShimmerColor: string | null;
    /** When loading started */
    loadingStartTime: number | null;
    /** Current todo items */
    todos: TodoItem[];
    /** Whether to show expanded todos */
    showExpandedTodos: boolean;
    /** Elicitation request queue */
    elicitation: {
        queue: ElicitationRequest[];
    };
    /** Whether there are active tools running */
    hasActiveTools: boolean;
}
/**
 * Hook for managing the main session state.
 *
 * @param initialState - Optional initial state values
 * @returns Session state and update functions
 *
 * @example
 * ```tsx
 * const { state, setMessages, setLoading } = useSessionState();
 *
 * // Add a new message
 * setMessages([...state.messages, newMessage]);
 *
 * // Show loading indicator
 * setLoading(true, 'Processing...');
 * ```
 */
export declare function useSessionState(initialState?: Partial<SessionState>): {
    state: SessionState;
    setState: import("react").Dispatch<import("react").SetStateAction<SessionState>>;
    setMessages: (messages: NormalizedMessage[] | ((prev: NormalizedMessage[]) => NormalizedMessage[])) => void;
    setLoading: (isLoading: boolean, spinnerTip?: string) => void;
    setResponseLength: (length: number) => void;
    setOverrideMessage: (message: string | null, color?: string | null, shimmerColor?: string | null) => void;
    setTodos: (todos: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => void;
    toggleExpandedTodos: () => void;
    addElicitation: (request: ElicitationRequest) => void;
    removeElicitation: () => void;
    setHasActiveTools: (hasActive: boolean) => void;
    resetSession: () => void;
};
/**
 * Tool state structure
 */
export interface ToolState {
    /** Available tools */
    tools: Tool[];
    /** Tool use IDs that encountered errors */
    erroredToolUseIDs: Set<string>;
    /** Tool use IDs currently in progress */
    inProgressToolUseIDs: Set<string>;
    /** Tool use IDs that have completed */
    resolvedToolUseIDs: Set<string>;
    /** Tool use confirmation queue */
    toolUseConfirmQueue: ToolUseConfirm[];
    /** Streaming tool uses being rendered */
    streamingToolUses: Map<string, unknown>;
}
/**
 * Hook for managing tool-related state.
 *
 * @param initialTools - Initial list of available tools
 * @returns Tool state and update functions
 */
export declare function useToolState(initialTools?: Tool[]): {
    tools: Tool[];
    setTools: import("react").Dispatch<import("react").SetStateAction<Tool[]>>;
    erroredToolUseIDs: Set<string>;
    inProgressToolUseIDs: Set<string>;
    resolvedToolUseIDs: Set<string>;
    toolUseConfirmQueue: ToolUseConfirm[];
    streamingToolUses: Map<string, unknown>;
    startToolUse: (toolUseId: string) => void;
    completeToolUse: (toolUseId: string) => void;
    errorToolUse: (toolUseId: string) => void;
    queueToolConfirm: (confirm: ToolUseConfirm) => void;
    dequeueToolConfirm: () => void;
    setInProgressToolUseIDs: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    setStreamingToolUses: import("react").Dispatch<import("react").SetStateAction<Map<string, unknown>>>;
    clearToolState: () => void;
};
/**
 * Permission state structure
 */
export interface PermissionState {
    /** Current tool permission context */
    context: ToolPermissionContext;
    /** Sandbox permission queue */
    sandboxPermissionQueue: Array<{
        hostPattern: HostPattern;
        shouldAllowHost: (allow: boolean) => void;
        recheckPermission: () => void;
    }>;
}
/**
 * Hook for managing permission-related state.
 *
 * @returns Permission state and update functions
 */
export declare function usePermissionState(): {
    context: ToolPermissionContext;
    setContext: import("react").Dispatch<import("react").SetStateAction<ToolPermissionContext>>;
    sandboxPermissionQueue: {
        hostPattern: HostPattern;
        shouldAllowHost: (allow: boolean) => void;
        recheckPermission: () => void;
    }[];
    allowTool: (toolName: string) => void;
    denyTool: (toolName: string) => void;
    addWorkingDirectory: (path: string, data?: unknown) => void;
    queueSandboxPermission: (request: PermissionState["sandboxPermissionQueue"][0]) => void;
    dequeueSandboxPermission: () => void;
    recheckAllSandboxPermissions: () => void;
};
/**
 * Screen state for managing UI views
 */
export interface ScreenState {
    /** Current active screen */
    screen: ScreenType;
    /** ID for toggling between screens */
    screenToggleId: string | null;
    /** Whether message selector is visible */
    isMessageSelectorVisible: boolean;
    /** Whether transcript view is expanded */
    showAllInTranscript: boolean;
}
/**
 * Hook for managing screen/view state.
 *
 * @returns Screen state and update functions
 */
export declare function useScreenState(): {
    screen: ScreenType;
    screenToggleId: string | null;
    isMessageSelectorVisible: boolean;
    showAllInTranscript: boolean;
    setScreen: import("react").Dispatch<import("react").SetStateAction<ScreenType>>;
    setScreenToggleId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    setIsMessageSelectorVisible: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setShowAllInTranscript: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    navigateTo: (newScreen: ScreenType, toggleId?: string) => void;
    goToMain: () => void;
    toggleMessageSelector: () => void;
    toggleTranscript: () => void;
};
/**
 * Input state structure
 */
export interface InputState {
    /** Current input value */
    value: string;
    /** Current input mode */
    mode: InputMode;
    /** Pasted contents (e.g., images) */
    pastedContents: Record<number, unknown>;
    /** Whether vim mode is enabled */
    vimMode: boolean;
    /** Whether searching history */
    isSearchingHistory: boolean;
}
/**
 * Hook for managing prompt input state.
 *
 * @returns Input state and update functions
 */
export declare function useInputState(): {
    value: string;
    mode: InputMode;
    pastedContents: Record<number, unknown>;
    vimMode: boolean;
    isSearchingHistory: boolean;
    setValue: import("react").Dispatch<import("react").SetStateAction<string>>;
    setMode: import("react").Dispatch<import("react").SetStateAction<InputMode>>;
    setPastedContents: import("react").Dispatch<import("react").SetStateAction<Record<number, unknown>>>;
    setVimMode: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    setIsSearchingHistory: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    clearInput: () => void;
    toggleMode: () => void;
    restoreInput: (text: string, inputMode?: InputMode) => void;
};
/**
 * Hook for managing progress messages during tool execution.
 *
 * @returns Progress message management functions
 */
export declare function useProgressMessages(): {
    progressMessages: Map<string, ProgressMessage[]>;
    addProgressMessage: (messageId: string, progress: ProgressMessage) => void;
    getProgressMessages: (messageId: string) => ProgressMessage[];
    clearProgressMessages: (messageId: string) => void;
    clearAllProgress: () => void;
};
/**
 * Hook for tracking terminal dimensions.
 * Provides reactive width/height values that update on resize.
 *
 * @returns Current terminal dimensions
 */
export declare function useTerminalDimensions(): {
    columns: number;
    rows: number;
};
/**
 * Hook for controlling animation states.
 *
 * @returns Animation state and controls
 */
export declare function useAnimation(): {
    shouldAnimate: boolean;
    shouldShowDot: boolean;
    startDotAnimation: () => void;
    stopDotAnimation: () => void;
    disableAnimations: () => void;
    enableAnimations: () => void;
};
/**
 * Combined hook that provides all session-related state management.
 * Use this for simpler integration when all features are needed.
 *
 * @param options - Initial configuration options
 * @returns All session state and controls
 */
export declare function useSession(options?: {
    tools?: Tool[];
}): {
    permissions: {
        context: ToolPermissionContext;
        setContext: import("react").Dispatch<import("react").SetStateAction<ToolPermissionContext>>;
        sandboxPermissionQueue: {
            hostPattern: HostPattern;
            shouldAllowHost: (allow: boolean) => void;
            recheckPermission: () => void;
        }[];
        allowTool: (toolName: string) => void;
        denyTool: (toolName: string) => void;
        addWorkingDirectory: (path: string, data?: unknown) => void;
        queueSandboxPermission: (request: PermissionState["sandboxPermissionQueue"][0]) => void;
        dequeueSandboxPermission: () => void;
        recheckAllSandboxPermissions: () => void;
    };
    screen: {
        screen: ScreenType;
        screenToggleId: string | null;
        isMessageSelectorVisible: boolean;
        showAllInTranscript: boolean;
        setScreen: import("react").Dispatch<import("react").SetStateAction<ScreenType>>;
        setScreenToggleId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
        setIsMessageSelectorVisible: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        setShowAllInTranscript: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        navigateTo: (newScreen: ScreenType, toggleId?: string) => void;
        goToMain: () => void;
        toggleMessageSelector: () => void;
        toggleTranscript: () => void;
    };
    input: {
        value: string;
        mode: InputMode;
        pastedContents: Record<number, unknown>;
        vimMode: boolean;
        isSearchingHistory: boolean;
        setValue: import("react").Dispatch<import("react").SetStateAction<string>>;
        setMode: import("react").Dispatch<import("react").SetStateAction<InputMode>>;
        setPastedContents: import("react").Dispatch<import("react").SetStateAction<Record<number, unknown>>>;
        setVimMode: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        setIsSearchingHistory: import("react").Dispatch<import("react").SetStateAction<boolean>>;
        clearInput: () => void;
        toggleMode: () => void;
        restoreInput: (text: string, inputMode?: InputMode) => void;
    };
    progress: {
        progressMessages: Map<string, ProgressMessage[]>;
        addProgressMessage: (messageId: string, progress: ProgressMessage) => void;
        getProgressMessages: (messageId: string) => ProgressMessage[];
        clearProgressMessages: (messageId: string) => void;
        clearAllProgress: () => void;
    };
    dimensions: {
        columns: number;
        rows: number;
    };
    animation: {
        shouldAnimate: boolean;
        shouldShowDot: boolean;
        startDotAnimation: () => void;
        stopDotAnimation: () => void;
        disableAnimations: () => void;
        enableAnimations: () => void;
    };
    tools: Tool[];
    setTools: import("react").Dispatch<import("react").SetStateAction<Tool[]>>;
    erroredToolUseIDs: Set<string>;
    inProgressToolUseIDs: Set<string>;
    resolvedToolUseIDs: Set<string>;
    toolUseConfirmQueue: ToolUseConfirm[];
    streamingToolUses: Map<string, unknown>;
    startToolUse: (toolUseId: string) => void;
    completeToolUse: (toolUseId: string) => void;
    errorToolUse: (toolUseId: string) => void;
    queueToolConfirm: (confirm: ToolUseConfirm) => void;
    dequeueToolConfirm: () => void;
    setInProgressToolUseIDs: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    setStreamingToolUses: import("react").Dispatch<import("react").SetStateAction<Map<string, unknown>>>;
    clearToolState: () => void;
    state: SessionState;
    setState: import("react").Dispatch<import("react").SetStateAction<SessionState>>;
    setMessages: (messages: NormalizedMessage[] | ((prev: NormalizedMessage[]) => NormalizedMessage[])) => void;
    setLoading: (isLoading: boolean, spinnerTip?: string) => void;
    setResponseLength: (length: number) => void;
    setOverrideMessage: (message: string | null, color?: string | null, shimmerColor?: string | null) => void;
    setTodos: (todos: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => void;
    toggleExpandedTodos: () => void;
    addElicitation: (request: ElicitationRequest) => void;
    removeElicitation: () => void;
    setHasActiveTools: (hasActive: boolean) => void;
    resetSession: () => void;
};
//# sourceMappingURL=useSession.d.ts.map