/**
 * @fileoverview Main UI renderer using Ink for terminal rendering
 * @module ui/renderer
 *
 * This module provides the main renderer component that orchestrates
 * the entire terminal UI, including message display, tool status,
 * permission dialogs, and input handling.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, render, useApp, useInput, useStdout } from 'ink';
import type {
  NormalizedMessage,
  Tool,
  ScreenType,
  TodoItem,
  MainRendererProps,
  ProgressMessage,
  ToolUseConfirm,
  ElicitationRequest,
  HostPattern,
} from './types.js';
import { Message } from './components/Message.js';
import {
  ToolPermissionDialog,
  SandboxPermissionDialog,
  ElicitationDialog,
  CostThresholdDialog,
} from './components/Permission.js';
import {
  useSessionState,
  useToolState,
  usePermissionState,
  useScreenState,
  useInputState,
  useProgressMessages,
  useTerminalDimensions,
  useAnimation,
} from './hooks/index.js';

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

// ============================================================================
// Utility Components
// ============================================================================

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
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  tip,
  isLoading,
  responseLength = 0,
  startTime,
  overrideMessage,
  overrideColor,
  todos = [],
  hasActiveTools = false,
}) => {
  const [frame, setFrame] = useState(0);
  const spinnerFrames = ['|', '/', '-', '\\'];

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % spinnerFrames.length);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, spinnerFrames.length]);

  if (!isLoading) return null;

  // Calculate elapsed time
  const elapsedMs = startTime ? Date.now() - startTime : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  // Get active todo
  const activeTodo = todos.find((t) => t.status === 'in_progress');

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row" gap={1}>
        <Text color={overrideColor || 'cyan'}>
          {spinnerFrames[frame]}
        </Text>
        <Text color={overrideColor || 'cyan'}>
          {overrideMessage || tip || 'Thinking...'}
        </Text>
        {elapsedSec > 0 && (
          <Text dimColor>({elapsedSec}s)</Text>
        )}
      </Box>

      {/* Show active todo if present */}
      {activeTodo && (
        <Box paddingLeft={2}>
          <Text dimColor>{activeTodo.activeForm || activeTodo.content}</Text>
        </Box>
      )}

      {/* Show response length if streaming */}
      {responseLength > 0 && (
        <Box paddingLeft={2}>
          <Text dimColor>
            Response: {responseLength.toLocaleString()} characters
          </Text>
        </Box>
      )}

      {/* Show tool count */}
      {hasActiveTools && (
        <Box paddingLeft={2}>
          <Text dimColor>Tools running...</Text>
        </Box>
      )}
    </Box>
  );
};

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
export const TodoListDisplay: React.FC<TodoListDisplayProps> = ({
  todos,
  isStandalone = false,
}) => {
  if (todos.length === 0) return null;

  const getStatusIcon = (status: TodoItem['status']): string => {
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

  const getStatusColor = (status: TodoItem['status']): string | undefined => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'yellow';
      default:
        return undefined;
    }
  };

  return (
    <Box flexDirection="column" marginTop={isStandalone ? 0 : 1}>
      {isStandalone && (
        <Text bold dimColor>
          Tasks:
        </Text>
      )}
      {todos.map((todo, index) => (
        <Box key={todo.id || index} flexDirection="row" paddingLeft={isStandalone ? 0 : 2}>
          <Text color={getStatusColor(todo.status)}>
            {getStatusIcon(todo.status)}
          </Text>
          <Text dimColor={todo.status === 'completed'}> {todo.content}</Text>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Props for transcript toggle indicator
 */
interface TranscriptToggleProps {
  isExpanded: boolean;
}

/**
 * Renders transcript toggle hint
 */
export const TranscriptToggle: React.FC<TranscriptToggleProps> = ({
  isExpanded,
}) => {
  return (
    <Box
      alignItems="center"
      alignSelf="center"
      borderStyle="single"
      borderColor="gray"
      marginTop={1}
      paddingLeft={2}
      width="100%"
    >
      <Text dimColor>
        {isExpanded
          ? 'Showing detailed transcript - Ctrl+O to toggle'
          : 'Press Ctrl+O to expand transcript'}
      </Text>
    </Box>
  );
};

// ============================================================================
// Message List Component
// ============================================================================

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
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  tools,
  verbose,
  erroredToolUseIDs,
  inProgressToolUseIDs,
  resolvedToolUseIDs,
  progressMessages,
  shouldAnimate,
  shouldShowDot,
  isTranscriptMode,
  width,
}) => {
  return (
    <Box flexDirection="column" width="100%">
      {messages.map((message, index) => {
        const messageId = message.uuid || `msg-${index}`;
        const messageProgress = progressMessages.get(messageId) || [];
        const isLastMessage = index === messages.length - 1;

        return (
          <Message
            key={messageId}
            message={message}
            messages={messages}
            addMargin={index > 0}
            tools={tools}
            verbose={verbose}
            erroredToolUseIDs={erroredToolUseIDs}
            inProgressToolUseIDs={inProgressToolUseIDs}
            resolvedToolUseIDs={resolvedToolUseIDs}
            progressMessagesForMessage={messageProgress}
            shouldAnimate={shouldAnimate && isLastMessage}
            shouldShowDot={shouldShowDot && isLastMessage}
            width={width - CONTENT_PADDING * 2}
            isTranscriptMode={isTranscriptMode}
          />
        );
      })}
    </Box>
  );
};

// ============================================================================
// Input Area Component
// ============================================================================

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
export const InputArea: React.FC<InputAreaProps> = ({
  value,
  mode,
  onChange,
  onSubmit,
  onModeChange,
  isLoading,
  vimMode,
}) => {
  useInput((input, key) => {
    if (isLoading) return;

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

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row">
        <Text color={modeColor} bold>
          {modeIndicator}
        </Text>
        <Text>{value}</Text>
        <Text color="gray">|</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {vimMode ? '[vim] ' : ''}
          [Ctrl+B] Toggle mode | [Enter] Submit | [Ctrl+C] Cancel
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Screen Components
// ============================================================================

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
export const MessageSelector: React.FC<MessageSelectorProps> = ({
  messages,
  onRestoreMessage,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(messages.length - 1);

  // Filter to user messages only
  const userMessages = useMemo(
    () => messages.filter((m) => m.type === 'user'),
    [messages]
  );

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

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Message History</Text>
      <Text dimColor>Select a message to restore</Text>
      <Box marginTop={1} flexDirection="column">
        {userMessages.map((message, index) => {
          const isSelected = index === selectedIndex;
          const content =
            typeof message.message?.content === 'string'
              ? message.message.content.slice(0, 50)
              : '[Complex message]';

          return (
            <Box key={message.uuid || index} flexDirection="row">
              <Text color={isSelected ? 'cyan' : undefined}>
                {isSelected ? '> ' : '  '}
              </Text>
              <Text bold={isSelected}>{content}</Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          [Arrow keys] Navigate | [Enter] Select | [Esc] Close
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Main Renderer Component
// ============================================================================

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
  // Session state
  sessionState?: RendererState;

  // Tool state
  toolUseConfirmQueue?: ToolUseConfirm[];
  erroredToolUseIDs?: Set<string>;
  inProgressToolUseIDs?: Set<string>;
  resolvedToolUseIDs?: Set<string>;
  streamingToolUses?: Map<string, unknown>;

  // Permission state
  sandboxPermissionQueue?: Array<{
    hostPattern: HostPattern;
    shouldAllowHost: (allow: boolean) => void;
    recheckPermission: () => void;
  }>;

  // Elicitation state
  elicitationQueue?: ElicitationRequest[];

  // Cost threshold
  showCostThreshold?: boolean;
  onCostAcknowledged?: () => void;

  // Message selector
  isMessageSelectorVisible?: boolean;
  onMessageSelectorClose?: () => void;
  onRestoreMessage?: (message: NormalizedMessage) => void;

  // Transcript mode
  showAllInTranscript?: boolean;
}

/**
 * Determines the current screen based on state
 */
function determineScreen(props: MainRendererComponentProps): ScreenType {
  const {
    sandboxPermissionQueue = [],
    toolUseConfirmQueue = [],
    elicitationQueue = [],
    showCostThreshold = false,
    isMessageSelectorVisible = false,
  } = props;

  if (isMessageSelectorVisible) return 'message-selector';
  if (sandboxPermissionQueue.length > 0) return 'sandbox-permission';
  if (toolUseConfirmQueue.length > 0) return 'tool-permission';
  if (elicitationQueue.length > 0) return 'elicitation';
  if (showCostThreshold) return 'cost';

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
export const MainRenderer: React.FC<MainRendererComponentProps> = (props) => {
  const {
    messages,
    tools,
    verbose,
    isLoading,
    onSubmit,
    onExit,
    sessionState,
    toolUseConfirmQueue = [],
    erroredToolUseIDs = new Set(),
    inProgressToolUseIDs = new Set(),
    resolvedToolUseIDs = new Set(),
    sandboxPermissionQueue = [],
    elicitationQueue = [],
    showCostThreshold = false,
    onCostAcknowledged,
    isMessageSelectorVisible = false,
    onMessageSelectorClose,
    onRestoreMessage,
    showAllInTranscript = false,
  } = props;

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
        return (
          <MessageSelector
            messages={messages}
            onRestoreMessage={onRestoreMessage || (() => {})}
            onClose={onMessageSelectorClose || (() => {})}
          />
        );

      case 'sandbox-permission': {
        const request = sandboxPermissionQueue[0];
        if (sandboxPermissionQueue.length > 0 && request) {
          return (
            <SandboxPermissionDialog
              hostPattern={request.hostPattern}
              onUserResponse={(response) => {
                request.shouldAllowHost(response.allow);
              }}
            />
          );
        }
        return null;
      }

      case 'tool-permission': {
        const confirm = toolUseConfirmQueue[0];
        if (toolUseConfirmQueue.length > 0 && confirm) {
          return (
            <ToolPermissionDialog
              toolUseConfirm={confirm}
              toolUseContext={{} as any} // Would need actual context
              onDone={() => {
                // Handle approval
              }}
              onReject={() => {
                // Handle rejection
              }}
              verbose={verbose}
            />
          );
        }
        return null;
      }

      case 'elicitation': {
        const elicitRequest = elicitationQueue[0];
        if (elicitationQueue.length > 0 && elicitRequest) {
          return (
            <ElicitationDialog
              serverName={elicitRequest.serverName}
              request={elicitRequest.request}
              onResponse={(action, content) => {
                elicitRequest.respond({ action, content });
              }}
              signal={elicitRequest.signal}
            />
          );
        }
        return null;
      }

      case 'cost':
        return (
          <CostThresholdDialog onDone={onCostAcknowledged || (() => {})} />
        );

      default:
        // Main screen
        return null;
    }
  };

  // Get session state values
  const {
    spinnerTip = '',
    currentResponseLength = 0,
    loadingStartTime = null,
    overrideMessage = null,
    overrideColor = null,
    todos = [],
    showExpandedTodos = false,
  } = sessionState || {};

  return (
    <Box flexDirection="column" width={width} padding={1}>
      {/* Message list */}
      <MessageList
        messages={messages}
        tools={tools}
        verbose={verbose}
        erroredToolUseIDs={erroredToolUseIDs}
        inProgressToolUseIDs={inProgressToolUseIDs}
        resolvedToolUseIDs={resolvedToolUseIDs}
        progressMessages={progressState.progressMessages}
        shouldAnimate={animation.shouldAnimate}
        shouldShowDot={animation.shouldShowDot}
        isTranscriptMode={showAllInTranscript}
        width={width}
      />

      {/* Transcript toggle */}
      {showAllInTranscript && <TranscriptToggle isExpanded={showAllInTranscript} />}

      {/* Loading spinner */}
      {isLoading && (
        <LoadingSpinner
          tip={spinnerTip}
          isLoading={isLoading}
          responseLength={currentResponseLength}
          startTime={loadingStartTime}
          overrideMessage={overrideMessage}
          overrideColor={overrideColor}
          todos={todos}
          hasActiveTools={inProgressToolUseIDs.size > 0}
        />
      )}

      {/* Expanded todos when not loading */}
      {!isLoading && showExpandedTodos && (
        <TodoListDisplay todos={todos} isStandalone={true} />
      )}

      {/* Dialog screens */}
      {currentScreen !== 'main' && renderScreen()}

      {/* Input area (only on main screen when not loading) */}
      {currentScreen === 'main' && !isLoading && (
        <InputArea
          value={inputState.value}
          mode={inputState.mode}
          onChange={inputState.setValue}
          onSubmit={onSubmit}
          onModeChange={inputState.setMode}
          isLoading={isLoading}
          vimMode={inputState.vimMode}
        />
      )}
    </Box>
  );
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
export function renderUI(props: MainRendererProps) {
  return render(<MainRenderer {...props} />);
}

// ============================================================================
// Exports
// ============================================================================

export default MainRenderer;
