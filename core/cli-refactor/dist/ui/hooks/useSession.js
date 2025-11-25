/**
 * @fileoverview Session state management hooks for the CLI UI
 * @module ui/hooks/useSession
 *
 * This module provides React hooks for managing session state,
 * including messages, tools, permissions, and UI state.
 */
import { useState, useEffect, useCallback, useRef, } from 'react';
/**
 * Default initial session state
 */
const DEFAULT_SESSION_STATE = {
    messages: [],
    isLoading: false,
    spinnerTip: '',
    currentResponseLength: 0,
    overrideMessage: null,
    overrideColor: null,
    overrideShimmerColor: null,
    loadingStartTime: null,
    todos: [],
    showExpandedTodos: false,
    elicitation: { queue: [] },
    hasActiveTools: false,
};
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
export function useSessionState(initialState) {
    const [state, setState] = useState({
        ...DEFAULT_SESSION_STATE,
        ...initialState,
    });
    /**
     * Update messages in the session
     */
    const setMessages = useCallback((messages) => {
        setState((prev) => ({
            ...prev,
            messages: typeof messages === 'function' ? messages(prev.messages) : messages,
        }));
    }, []);
    /**
     * Set loading state with optional spinner tip
     */
    const setLoading = useCallback((isLoading, spinnerTip) => {
        setState((prev) => ({
            ...prev,
            isLoading,
            spinnerTip: spinnerTip ?? prev.spinnerTip,
            loadingStartTime: isLoading ? Date.now() : null,
        }));
    }, []);
    /**
     * Update response length during streaming
     */
    const setResponseLength = useCallback((length) => {
        setState((prev) => ({
            ...prev,
            currentResponseLength: length,
        }));
    }, []);
    /**
     * Set override message for special displays
     */
    const setOverrideMessage = useCallback((message, color, shimmerColor) => {
        setState((prev) => ({
            ...prev,
            overrideMessage: message,
            overrideColor: color ?? null,
            overrideShimmerColor: shimmerColor ?? null,
        }));
    }, []);
    /**
     * Update todo items
     */
    const setTodos = useCallback((todos) => {
        setState((prev) => ({
            ...prev,
            todos: typeof todos === 'function' ? todos(prev.todos) : todos,
        }));
    }, []);
    /**
     * Toggle expanded todos display
     */
    const toggleExpandedTodos = useCallback(() => {
        setState((prev) => ({
            ...prev,
            showExpandedTodos: !prev.showExpandedTodos,
        }));
    }, []);
    /**
     * Add elicitation request to queue
     */
    const addElicitation = useCallback((request) => {
        setState((prev) => ({
            ...prev,
            elicitation: {
                queue: [...prev.elicitation.queue, request],
            },
        }));
    }, []);
    /**
     * Remove processed elicitation from queue
     */
    const removeElicitation = useCallback(() => {
        setState((prev) => ({
            ...prev,
            elicitation: {
                queue: prev.elicitation.queue.slice(1),
            },
        }));
    }, []);
    /**
     * Set active tools flag
     */
    const setHasActiveTools = useCallback((hasActive) => {
        setState((prev) => ({
            ...prev,
            hasActiveTools: hasActive,
        }));
    }, []);
    /**
     * Reset session state to defaults
     */
    const resetSession = useCallback(() => {
        setState(DEFAULT_SESSION_STATE);
    }, []);
    return {
        state,
        setState,
        setMessages,
        setLoading,
        setResponseLength,
        setOverrideMessage,
        setTodos,
        toggleExpandedTodos,
        addElicitation,
        removeElicitation,
        setHasActiveTools,
        resetSession,
    };
}
/**
 * Hook for managing tool-related state.
 *
 * @param initialTools - Initial list of available tools
 * @returns Tool state and update functions
 */
export function useToolState(initialTools = []) {
    const [tools, setTools] = useState(initialTools);
    const [erroredToolUseIDs, setErroredToolUseIDs] = useState(new Set());
    const [inProgressToolUseIDs, setInProgressToolUseIDs] = useState(new Set());
    const [resolvedToolUseIDs, setResolvedToolUseIDs] = useState(new Set());
    const [toolUseConfirmQueue, setToolUseConfirmQueue] = useState([]);
    const [streamingToolUses, setStreamingToolUses] = useState(new Map());
    /**
     * Mark a tool use as started
     */
    const startToolUse = useCallback((toolUseId) => {
        setInProgressToolUseIDs((prev) => new Set([...prev, toolUseId]));
    }, []);
    /**
     * Mark a tool use as completed successfully
     */
    const completeToolUse = useCallback((toolUseId) => {
        setInProgressToolUseIDs((prev) => {
            const next = new Set(prev);
            next.delete(toolUseId);
            return next;
        });
        setResolvedToolUseIDs((prev) => new Set([...prev, toolUseId]));
    }, []);
    /**
     * Mark a tool use as errored
     */
    const errorToolUse = useCallback((toolUseId) => {
        setInProgressToolUseIDs((prev) => {
            const next = new Set(prev);
            next.delete(toolUseId);
            return next;
        });
        setErroredToolUseIDs((prev) => new Set([...prev, toolUseId]));
    }, []);
    /**
     * Add a tool use confirmation to the queue
     */
    const queueToolConfirm = useCallback((confirm) => {
        setToolUseConfirmQueue((prev) => [...prev, confirm]);
    }, []);
    /**
     * Remove the first item from the confirmation queue
     */
    const dequeueToolConfirm = useCallback(() => {
        setToolUseConfirmQueue((prev) => prev.slice(1));
    }, []);
    /**
     * Clear all tool use tracking
     */
    const clearToolState = useCallback(() => {
        setErroredToolUseIDs(new Set());
        setInProgressToolUseIDs(new Set());
        setResolvedToolUseIDs(new Set());
        setToolUseConfirmQueue([]);
        setStreamingToolUses(new Map());
    }, []);
    return {
        tools,
        setTools,
        erroredToolUseIDs,
        inProgressToolUseIDs,
        resolvedToolUseIDs,
        toolUseConfirmQueue,
        streamingToolUses,
        startToolUse,
        completeToolUse,
        errorToolUse,
        queueToolConfirm,
        dequeueToolConfirm,
        setInProgressToolUseIDs,
        setStreamingToolUses,
        clearToolState,
    };
}
/**
 * Default permission context
 */
const DEFAULT_PERMISSION_CONTEXT = {
    additionalWorkingDirectories: new Map(),
    allowedTools: new Set(),
    deniedTools: new Set(),
};
/**
 * Hook for managing permission-related state.
 *
 * @returns Permission state and update functions
 */
export function usePermissionState() {
    const [context, setContext] = useState(DEFAULT_PERMISSION_CONTEXT);
    const [sandboxPermissionQueue, setSandboxPermissionQueue] = useState([]);
    /**
     * Add a tool to the allowed list
     */
    const allowTool = useCallback((toolName) => {
        setContext((prev) => {
            const next = { ...prev };
            next.allowedTools = new Set([...prev.allowedTools, toolName]);
            next.deniedTools = new Set([...prev.deniedTools].filter((t) => t !== toolName));
            return next;
        });
    }, []);
    /**
     * Add a tool to the denied list
     */
    const denyTool = useCallback((toolName) => {
        setContext((prev) => {
            const next = { ...prev };
            next.deniedTools = new Set([...prev.deniedTools, toolName]);
            next.allowedTools = new Set([...prev.allowedTools].filter((t) => t !== toolName));
            return next;
        });
    }, []);
    /**
     * Add a working directory
     */
    const addWorkingDirectory = useCallback((path, data = true) => {
        setContext((prev) => {
            const next = { ...prev };
            next.additionalWorkingDirectories = new Map(prev.additionalWorkingDirectories);
            next.additionalWorkingDirectories.set(path, data);
            return next;
        });
    }, []);
    /**
     * Queue a sandbox permission request
     */
    const queueSandboxPermission = useCallback((request) => {
        setSandboxPermissionQueue((prev) => [...prev, request]);
    }, []);
    /**
     * Process the next sandbox permission in the queue
     */
    const dequeueSandboxPermission = useCallback(() => {
        setSandboxPermissionQueue((prev) => prev.slice(1));
    }, []);
    /**
     * Recheck all pending sandbox permissions
     */
    const recheckAllSandboxPermissions = useCallback(() => {
        sandboxPermissionQueue.forEach((request) => {
            request.recheckPermission();
        });
    }, [sandboxPermissionQueue]);
    return {
        context,
        setContext,
        sandboxPermissionQueue,
        allowTool,
        denyTool,
        addWorkingDirectory,
        queueSandboxPermission,
        dequeueSandboxPermission,
        recheckAllSandboxPermissions,
    };
}
/**
 * Hook for managing screen/view state.
 *
 * @returns Screen state and update functions
 */
export function useScreenState() {
    const [screen, setScreen] = useState('main');
    const [screenToggleId, setScreenToggleId] = useState(null);
    const [isMessageSelectorVisible, setIsMessageSelectorVisible] = useState(false);
    const [showAllInTranscript, setShowAllInTranscript] = useState(false);
    /**
     * Navigate to a specific screen
     */
    const navigateTo = useCallback((newScreen, toggleId) => {
        setScreen(newScreen);
        if (toggleId !== undefined) {
            setScreenToggleId(toggleId);
        }
    }, []);
    /**
     * Go back to main screen
     */
    const goToMain = useCallback(() => {
        setScreen('main');
        setScreenToggleId(null);
    }, []);
    /**
     * Toggle message selector visibility
     */
    const toggleMessageSelector = useCallback(() => {
        setIsMessageSelectorVisible((prev) => !prev);
    }, []);
    /**
     * Toggle transcript expansion
     */
    const toggleTranscript = useCallback(() => {
        setShowAllInTranscript((prev) => !prev);
    }, []);
    return {
        screen,
        screenToggleId,
        isMessageSelectorVisible,
        showAllInTranscript,
        setScreen,
        setScreenToggleId,
        setIsMessageSelectorVisible,
        setShowAllInTranscript,
        navigateTo,
        goToMain,
        toggleMessageSelector,
        toggleTranscript,
    };
}
/**
 * Hook for managing prompt input state.
 *
 * @returns Input state and update functions
 */
export function useInputState() {
    const [value, setValue] = useState('');
    const [mode, setMode] = useState('prompt');
    const [pastedContents, setPastedContents] = useState({});
    const [vimMode, setVimMode] = useState(false);
    const [isSearchingHistory, setIsSearchingHistory] = useState(false);
    /**
     * Clear the input
     */
    const clearInput = useCallback(() => {
        setValue('');
        setPastedContents({});
    }, []);
    /**
     * Toggle between prompt and bash modes
     */
    const toggleMode = useCallback(() => {
        setMode((prev) => (prev === 'prompt' ? 'bash' : 'prompt'));
    }, []);
    /**
     * Set input from restored message
     */
    const restoreInput = useCallback((text, inputMode = 'prompt') => {
        setValue(text);
        setMode(inputMode);
    }, []);
    return {
        value,
        mode,
        pastedContents,
        vimMode,
        isSearchingHistory,
        setValue,
        setMode,
        setPastedContents,
        setVimMode,
        setIsSearchingHistory,
        clearInput,
        toggleMode,
        restoreInput,
    };
}
// ============================================================================
// Progress Messages Hook
// ============================================================================
/**
 * Hook for managing progress messages during tool execution.
 *
 * @returns Progress message management functions
 */
export function useProgressMessages() {
    const [progressMessages, setProgressMessages] = useState(new Map());
    /**
     * Add a progress message for a specific message
     */
    const addProgressMessage = useCallback((messageId, progress) => {
        setProgressMessages((prev) => {
            const next = new Map(prev);
            const existing = next.get(messageId) || [];
            next.set(messageId, [...existing, progress]);
            return next;
        });
    }, []);
    /**
     * Get progress messages for a specific message
     */
    const getProgressMessages = useCallback((messageId) => {
        return progressMessages.get(messageId) || [];
    }, [progressMessages]);
    /**
     * Clear progress messages for a message
     */
    const clearProgressMessages = useCallback((messageId) => {
        setProgressMessages((prev) => {
            const next = new Map(prev);
            next.delete(messageId);
            return next;
        });
    }, []);
    /**
     * Clear all progress messages
     */
    const clearAllProgress = useCallback(() => {
        setProgressMessages(new Map());
    }, []);
    return {
        progressMessages,
        addProgressMessage,
        getProgressMessages,
        clearProgressMessages,
        clearAllProgress,
    };
}
// ============================================================================
// Terminal Dimensions Hook
// ============================================================================
/**
 * Hook for tracking terminal dimensions.
 * Provides reactive width/height values that update on resize.
 *
 * @returns Current terminal dimensions
 */
export function useTerminalDimensions() {
    const [dimensions, setDimensions] = useState({
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
    });
    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                columns: process.stdout.columns || 80,
                rows: process.stdout.rows || 24,
            });
        };
        process.stdout.on('resize', handleResize);
        return () => {
            process.stdout.off('resize', handleResize);
        };
    }, []);
    return dimensions;
}
// ============================================================================
// Animation Hook
// ============================================================================
/**
 * Hook for controlling animation states.
 *
 * @returns Animation state and controls
 */
export function useAnimation() {
    const [shouldAnimate, setShouldAnimate] = useState(true);
    const [shouldShowDot, setShouldShowDot] = useState(false);
    const animationFrameRef = useRef(null);
    /**
     * Start dot animation
     */
    const startDotAnimation = useCallback(() => {
        setShouldShowDot(true);
    }, []);
    /**
     * Stop dot animation
     */
    const stopDotAnimation = useCallback(() => {
        setShouldShowDot(false);
    }, []);
    /**
     * Disable all animations
     */
    const disableAnimations = useCallback(() => {
        setShouldAnimate(false);
        setShouldShowDot(false);
    }, []);
    /**
     * Enable animations
     */
    const enableAnimations = useCallback(() => {
        setShouldAnimate(true);
    }, []);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                void 0; // cancelAnimationFrame not available in Node.js;
            }
        };
    }, []);
    return {
        shouldAnimate,
        shouldShowDot,
        startDotAnimation,
        stopDotAnimation,
        disableAnimations,
        enableAnimations,
    };
}
// ============================================================================
// Combined Session Hook
// ============================================================================
/**
 * Combined hook that provides all session-related state management.
 * Use this for simpler integration when all features are needed.
 *
 * @param options - Initial configuration options
 * @returns All session state and controls
 */
export function useSession(options = {}) {
    const session = useSessionState();
    const toolState = useToolState(options.tools);
    const permissionState = usePermissionState();
    const screenState = useScreenState();
    const inputState = useInputState();
    const progressState = useProgressMessages();
    const dimensions = useTerminalDimensions();
    const animation = useAnimation();
    return {
        // Session state
        ...session,
        // Tool state
        ...toolState,
        // Permission state
        permissions: permissionState,
        // Screen state
        screen: screenState,
        // Input state
        input: inputState,
        // Progress state
        progress: progressState,
        // Terminal dimensions
        dimensions,
        // Animation
        animation,
    };
}
//# sourceMappingURL=useSession.js.map