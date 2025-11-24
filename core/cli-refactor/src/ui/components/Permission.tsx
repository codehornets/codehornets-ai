/**
 * @fileoverview Permission dialog components for the CLI UI
 * @module ui/components/Permission
 *
 * This module provides React components for rendering permission
 * dialogs and confirmations in the terminal, including tool use
 * permissions and sandbox permissions.
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  PermissionDialogProps,
  SandboxPermissionProps,
  ToolUseConfirm,
  ToolUseContext,
  HostPattern,
} from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Risk level colors
 */
const RISK_COLORS = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
} as const;

/**
 * Risk level descriptions
 */
const RISK_DESCRIPTIONS = {
  low: 'Low risk - Safe operation',
  medium: 'Medium risk - May modify files',
  high: 'High risk - Potentially dangerous operation',
} as const;

// ============================================================================
// Utility Components
// ============================================================================

/**
 * Props for keyboard hint display
 */
interface KeyHintProps {
  keyName: string;
  action: string;
  separator?: string;
}

/**
 * Renders a keyboard shortcut hint
 */
export const KeyHint: React.FC<KeyHintProps> = ({
  keyName,
  action,
  separator = ' ',
}) => {
  return (
    <Text dimColor>
      <Text bold color="cyan">
        [{keyName}]
      </Text>
      {separator}
      {action}
    </Text>
  );
};

/**
 * Props for key hints row
 */
interface KeyHintsRowProps {
  hints: Array<{ key: string; action: string }>;
}

/**
 * Renders a row of keyboard hints
 */
export const KeyHintsRow: React.FC<KeyHintsRowProps> = ({ hints }) => {
  return (
    <Box flexDirection="row" gap={2}>
      {hints.map((hint, index) => (
        <KeyHint key={index} keyName={hint.key} action={hint.action} />
      ))}
    </Box>
  );
};

/**
 * Renders a divider line
 */
export const Divider: React.FC<{ width?: number; char?: string }> = ({
  width = 40,
  char = '-',
}) => {
  return <Text dimColor>{char.repeat(width)}</Text>;
};

// ============================================================================
// Risk Badge Component
// ============================================================================

/**
 * Props for risk badge
 */
interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
}

/**
 * Renders a colored risk level badge
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const color = RISK_COLORS[level];
  const description = RISK_DESCRIPTIONS[level];

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={color} bold>
        [{level.toUpperCase()}]
      </Text>
      <Text dimColor>{description}</Text>
    </Box>
  );
};

// ============================================================================
// Tool Info Display Component
// ============================================================================

/**
 * Props for tool info display
 */
interface ToolInfoDisplayProps {
  toolName: string;
  input: Record<string, unknown>;
  verbose?: boolean;
}

/**
 * Renders tool information with input parameters
 */
export const ToolInfoDisplay: React.FC<ToolInfoDisplayProps> = ({
  toolName,
  input,
  verbose = false,
}) => {
  // Format input for display
  const formatInput = (obj: Record<string, unknown>, indent = 0): string[] => {
    const lines: string[] = [];
    const padding = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`${padding}${key}:`);
        lines.push(...formatInput(value as Record<string, unknown>, indent + 1));
      } else if (typeof value === 'string') {
        // Truncate long strings
        const displayValue =
          value.length > 100 ? value.slice(0, 100) + '...' : value;
        lines.push(`${padding}${key}: "${displayValue}"`);
      } else {
        lines.push(`${padding}${key}: ${JSON.stringify(value)}`);
      }
    }

    return lines;
  };

  const inputLines = formatInput(input);
  const displayLines = verbose ? inputLines : inputLines.slice(0, 5);
  const hasMore = inputLines.length > displayLines.length;

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text bold>{toolName}</Text>
      {displayLines.map((line, index) => (
        <Text key={index} dimColor>
          {line}
        </Text>
      ))}
      {hasMore && (
        <Text dimColor italic>
          ... and {inputLines.length - displayLines.length} more parameters
        </Text>
      )}
    </Box>
  );
};

// ============================================================================
// Tool Permission Dialog Component
// ============================================================================

/**
 * State for permission dialog
 */
interface PermissionDialogState {
  selectedOption: 'allow' | 'deny' | 'always' | 'never';
}

/**
 * Tool permission dialog component.
 * Shows a dialog for approving or denying tool use requests.
 *
 * @param props - Permission dialog props
 * @returns Rendered permission dialog
 *
 * @example
 * ```tsx
 * <ToolPermissionDialog
 *   toolUseConfirm={confirmRequest}
 *   toolUseContext={context}
 *   onDone={() => handleDone()}
 *   onReject={(reason) => handleReject(reason)}
 *   verbose={false}
 * />
 * ```
 */
export const ToolPermissionDialog: React.FC<PermissionDialogProps> = ({
  toolUseConfirm,
  toolUseContext,
  onDone,
  onReject,
  verbose = false,
}) => {
  const [state, setState] = useState<PermissionDialogState>({
    selectedOption: 'allow',
  });

  // Handle keyboard input
  useInput((input, key) => {
    // Allow once
    if (input === 'y' || input === 'Y') {
      onDone();
      return;
    }

    // Deny once
    if (input === 'n' || input === 'N') {
      onReject('User denied permission');
      return;
    }

    // Always allow
    if (input === 'a' || input === 'A') {
      // Would need to persist permission
      onDone();
      return;
    }

    // Never allow (abort)
    if (key.escape || input === 'q' || input === 'Q') {
      onReject('User aborted');
      return;
    }

    // Navigation
    if (key.upArrow) {
      setState((prev) => ({
        ...prev,
        selectedOption:
          prev.selectedOption === 'allow'
            ? 'never'
            : prev.selectedOption === 'deny'
            ? 'allow'
            : prev.selectedOption === 'always'
            ? 'deny'
            : 'always',
      }));
    }

    if (key.downArrow) {
      setState((prev) => ({
        ...prev,
        selectedOption:
          prev.selectedOption === 'allow'
            ? 'deny'
            : prev.selectedOption === 'deny'
            ? 'always'
            : prev.selectedOption === 'always'
            ? 'never'
            : 'allow',
      }));
    }

    if (key.return) {
      switch (state.selectedOption) {
        case 'allow':
          onDone();
          break;
        case 'deny':
          onReject('User denied permission');
          break;
        case 'always':
          onDone();
          break;
        case 'never':
          onReject('User permanently denied');
          break;
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      {/* Header */}
      <Box flexDirection="row" gap={1}>
        <Text color="yellow" bold>
          Permission Request
        </Text>
      </Box>

      <Divider width={50} />

      {/* Risk level */}
      <Box marginTop={1}>
        <RiskBadge level={toolUseConfirm.riskLevel} />
      </Box>

      {/* Tool info */}
      <Box marginTop={1}>
        <Text>The assistant wants to use:</Text>
      </Box>
      <ToolInfoDisplay
        toolName={toolUseConfirm.toolName}
        input={toolUseConfirm.input}
        verbose={verbose}
      />

      {/* Explanation if provided */}
      {toolUseConfirm.explanation && (
        <Box marginTop={1} paddingLeft={2}>
          <Text dimColor italic>
            {toolUseConfirm.explanation}
          </Text>
        </Box>
      )}

      <Divider width={50} />

      {/* Options */}
      <Box marginTop={1} flexDirection="column">
        <Text>Choose an action:</Text>
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          <Text
            color={state.selectedOption === 'allow' ? 'cyan' : undefined}
            bold={state.selectedOption === 'allow'}
          >
            {state.selectedOption === 'allow' ? '> ' : '  '}
            [Y] Allow once
          </Text>
          <Text
            color={state.selectedOption === 'deny' ? 'cyan' : undefined}
            bold={state.selectedOption === 'deny'}
          >
            {state.selectedOption === 'deny' ? '> ' : '  '}
            [N] Deny once
          </Text>
          <Text
            color={state.selectedOption === 'always' ? 'cyan' : undefined}
            bold={state.selectedOption === 'always'}
          >
            {state.selectedOption === 'always' ? '> ' : '  '}
            [A] Always allow this tool
          </Text>
          <Text
            color={state.selectedOption === 'never' ? 'cyan' : undefined}
            bold={state.selectedOption === 'never'}
          >
            {state.selectedOption === 'never' ? '> ' : '  '}
            [Esc] Abort request
          </Text>
        </Box>
      </Box>

      {/* Keyboard hints */}
      <Box marginTop={1}>
        <KeyHintsRow
          hints={[
            { key: 'Arrow keys', action: 'navigate' },
            { key: 'Enter', action: 'select' },
          ]}
        />
      </Box>
    </Box>
  );
};

// ============================================================================
// Sandbox Permission Dialog Component
// ============================================================================

/**
 * Sandbox permission dialog component.
 * Shows a dialog for approving network/sandbox access.
 *
 * @param props - Sandbox permission props
 * @returns Rendered sandbox permission dialog
 *
 * @example
 * ```tsx
 * <SandboxPermissionDialog
 *   hostPattern={{ host: 'api.example.com', port: 443 }}
 *   onUserResponse={(response) => handleResponse(response)}
 * />
 * ```
 */
export const SandboxPermissionDialog: React.FC<SandboxPermissionProps> = ({
  hostPattern,
  onUserResponse,
}) => {
  const [persistToSettings, setPersistToSettings] = useState(false);

  // Handle keyboard input
  useInput((input, key) => {
    // Allow
    if (input === 'y' || input === 'Y') {
      onUserResponse({ allow: true, persistToSettings });
      return;
    }

    // Deny
    if (input === 'n' || input === 'N') {
      onUserResponse({ allow: false, persistToSettings });
      return;
    }

    // Toggle persist
    if (input === 'p' || input === 'P') {
      setPersistToSettings((prev) => !prev);
      return;
    }

    // Allow with persist
    if (input === 'a' || input === 'A') {
      onUserResponse({ allow: true, persistToSettings: true });
      return;
    }
  });

  // Format host display
  const hostDisplay = hostPattern.port
    ? `${hostPattern.host}:${hostPattern.port}`
    : hostPattern.host;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      {/* Header */}
      <Box flexDirection="row" gap={1}>
        <Text color="cyan" bold>
          Network Access Request
        </Text>
      </Box>

      <Divider width={50} />

      {/* Host info */}
      <Box marginTop={1} flexDirection="column">
        <Text>A tool wants to access:</Text>
        <Box paddingLeft={2} marginTop={1}>
          <Text bold color="yellow">
            {hostPattern.protocol || 'https'}://
            {hostDisplay}
          </Text>
        </Box>
      </Box>

      <Divider width={50} />

      {/* Persist option */}
      <Box marginTop={1} flexDirection="row" gap={1}>
        <Text dimColor>[P] Remember this choice:</Text>
        <Text color={persistToSettings ? 'green' : 'gray'}>
          {persistToSettings ? 'Yes' : 'No'}
        </Text>
      </Box>

      {/* Options */}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Options:</Text>
        <Box flexDirection="column" paddingLeft={2}>
          <Text>
            <Text color="green">[Y]</Text> Allow{' '}
            {persistToSettings ? '(and remember)' : '(once)'}
          </Text>
          <Text>
            <Text color="red">[N]</Text> Deny{' '}
            {persistToSettings ? '(and remember)' : '(once)'}
          </Text>
          <Text>
            <Text color="cyan">[A]</Text> Always allow this host
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// Elicitation Dialog Component
// ============================================================================

/**
 * Props for elicitation dialog
 */
interface ElicitationDialogProps {
  serverName: string;
  request: unknown;
  onResponse: (action: string, content?: unknown) => void;
  signal: AbortSignal;
}

/**
 * Elicitation dialog component.
 * Shows a dialog for MCP server information requests.
 */
export const ElicitationDialog: React.FC<ElicitationDialogProps> = ({
  serverName,
  request,
  onResponse,
  signal,
}) => {
  const [input, setInput] = useState('');

  // Handle abort
  React.useEffect(() => {
    const handleAbort = () => {
      onResponse('abort');
    };

    signal.addEventListener('abort', handleAbort);
    return () => {
      signal.removeEventListener('abort', handleAbort);
    };
  }, [signal, onResponse]);

  // Handle keyboard input
  useInput((inputChar, key) => {
    if (key.return) {
      onResponse('submit', input);
      return;
    }

    if (key.escape) {
      onResponse('cancel');
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    // Regular character input
    if (inputChar && !key.ctrl && !key.meta) {
      setInput((prev) => prev + inputChar);
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={2}
      paddingY={1}
    >
      {/* Header */}
      <Box flexDirection="row" gap={1}>
        <Text color="magenta" bold>
          MCP Server Request
        </Text>
        <Text dimColor>from {serverName}</Text>
      </Box>

      <Divider width={50} />

      {/* Request info */}
      <Box marginTop={1}>
        <Text>Server is requesting information:</Text>
      </Box>
      <Box paddingLeft={2} marginTop={1}>
        <Text dimColor>
          {typeof request === 'string'
            ? request
            : JSON.stringify(request, null, 2)}
        </Text>
      </Box>

      <Divider width={50} />

      {/* Input field */}
      <Box marginTop={1} flexDirection="row" gap={1}>
        <Text>Response: </Text>
        <Text color="cyan">{input}</Text>
        <Text color="gray">|</Text>
      </Box>

      {/* Keyboard hints */}
      <Box marginTop={1}>
        <KeyHintsRow
          hints={[
            { key: 'Enter', action: 'submit' },
            { key: 'Esc', action: 'cancel' },
          ]}
        />
      </Box>
    </Box>
  );
};

// ============================================================================
// Cost Threshold Dialog Component
// ============================================================================

/**
 * Props for cost threshold dialog
 */
interface CostThresholdDialogProps {
  onDone: () => void;
}

/**
 * Cost threshold acknowledgment dialog.
 * Shown when API costs exceed a threshold.
 */
export const CostThresholdDialog: React.FC<CostThresholdDialogProps> = ({
  onDone,
}) => {
  useInput((input, key) => {
    if (key.return || input === 'y' || input === 'Y') {
      onDone();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
    >
      <Box flexDirection="row" gap={1}>
        <Text color="yellow" bold>
          Cost Threshold Reached
        </Text>
      </Box>

      <Divider width={50} />

      <Box marginTop={1}>
        <Text>
          You have reached your configured cost threshold for this session.
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          You can continue working, but please be mindful of API usage.
        </Text>
      </Box>

      <Divider width={50} />

      <Box marginTop={1}>
        <Text>
          Press <Text color="cyan" bold>[Enter]</Text> or{' '}
          <Text color="cyan" bold>[Y]</Text> to acknowledge and continue
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default ToolPermissionDialog;

// Also export with alias for convenience
export { ToolPermissionDialog as PermissionDialog };
