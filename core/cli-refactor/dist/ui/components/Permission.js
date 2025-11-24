import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Permission dialog components for the CLI UI
 * @module ui/components/Permission
 *
 * This module provides React components for rendering permission
 * dialogs and confirmations in the terminal, including tool use
 * permissions and sandbox permissions.
 */
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
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
};
/**
 * Risk level descriptions
 */
const RISK_DESCRIPTIONS = {
    low: 'Low risk - Safe operation',
    medium: 'Medium risk - May modify files',
    high: 'High risk - Potentially dangerous operation',
};
/**
 * Renders a keyboard shortcut hint
 */
export const KeyHint = ({ keyName, action, separator = ' ', }) => {
    return (_jsxs(Text, { dimColor: true, children: [_jsxs(Text, { bold: true, color: "cyan", children: ["[", keyName, "]"] }), separator, action] }));
};
/**
 * Renders a row of keyboard hints
 */
export const KeyHintsRow = ({ hints }) => {
    return (_jsx(Box, { flexDirection: "row", gap: 2, children: hints.map((hint, index) => (_jsx(KeyHint, { keyName: hint.key, action: hint.action }, index))) }));
};
/**
 * Renders a divider line
 */
export const Divider = ({ width = 40, char = '-', }) => {
    return _jsx(Text, { dimColor: true, children: char.repeat(width) });
};
/**
 * Renders a colored risk level badge
 */
export const RiskBadge = ({ level }) => {
    const color = RISK_COLORS[level];
    const description = RISK_DESCRIPTIONS[level];
    return (_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsxs(Text, { color: color, bold: true, children: ["[", level.toUpperCase(), "]"] }), _jsx(Text, { dimColor: true, children: description })] }));
};
/**
 * Renders tool information with input parameters
 */
export const ToolInfoDisplay = ({ toolName, input, verbose = false, }) => {
    // Format input for display
    const formatInput = (obj, indent = 0) => {
        const lines = [];
        const padding = '  '.repeat(indent);
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                lines.push(`${padding}${key}:`);
                lines.push(...formatInput(value, indent + 1));
            }
            else if (typeof value === 'string') {
                // Truncate long strings
                const displayValue = value.length > 100 ? value.slice(0, 100) + '...' : value;
                lines.push(`${padding}${key}: "${displayValue}"`);
            }
            else {
                lines.push(`${padding}${key}: ${JSON.stringify(value)}`);
            }
        }
        return lines;
    };
    const inputLines = formatInput(input);
    const displayLines = verbose ? inputLines : inputLines.slice(0, 5);
    const hasMore = inputLines.length > displayLines.length;
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: 2, children: [_jsx(Text, { bold: true, children: toolName }), displayLines.map((line, index) => (_jsx(Text, { dimColor: true, children: line }, index))), hasMore && (_jsxs(Text, { dimColor: true, italic: true, children: ["... and ", inputLines.length - displayLines.length, " more parameters"] }))] }));
};
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
export const ToolPermissionDialog = ({ toolUseConfirm, toolUseContext, onDone, onReject, verbose = false, }) => {
    const [state, setState] = useState({
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
                selectedOption: prev.selectedOption === 'allow'
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
                selectedOption: prev.selectedOption === 'allow'
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
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 2, paddingY: 1, children: [_jsx(Box, { flexDirection: "row", gap: 1, children: _jsx(Text, { color: "yellow", bold: true, children: "Permission Request" }) }), _jsx(Divider, { width: 50 }), _jsx(Box, { marginTop: 1, children: _jsx(RiskBadge, { level: toolUseConfirm.riskLevel }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "The assistant wants to use:" }) }), _jsx(ToolInfoDisplay, { toolName: toolUseConfirm.toolName, input: toolUseConfirm.input, verbose: verbose }), toolUseConfirm.explanation && (_jsx(Box, { marginTop: 1, paddingLeft: 2, children: _jsx(Text, { dimColor: true, italic: true, children: toolUseConfirm.explanation }) })), _jsx(Divider, { width: 50 }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: "Choose an action:" }), _jsxs(Box, { flexDirection: "column", paddingLeft: 2, marginTop: 1, children: [_jsxs(Text, { color: state.selectedOption === 'allow' ? 'cyan' : undefined, bold: state.selectedOption === 'allow', children: [state.selectedOption === 'allow' ? '> ' : '  ', "[Y] Allow once"] }), _jsxs(Text, { color: state.selectedOption === 'deny' ? 'cyan' : undefined, bold: state.selectedOption === 'deny', children: [state.selectedOption === 'deny' ? '> ' : '  ', "[N] Deny once"] }), _jsxs(Text, { color: state.selectedOption === 'always' ? 'cyan' : undefined, bold: state.selectedOption === 'always', children: [state.selectedOption === 'always' ? '> ' : '  ', "[A] Always allow this tool"] }), _jsxs(Text, { color: state.selectedOption === 'never' ? 'cyan' : undefined, bold: state.selectedOption === 'never', children: [state.selectedOption === 'never' ? '> ' : '  ', "[Esc] Abort request"] })] })] }), _jsx(Box, { marginTop: 1, children: _jsx(KeyHintsRow, { hints: [
                        { key: 'Arrow keys', action: 'navigate' },
                        { key: 'Enter', action: 'select' },
                    ] }) })] }));
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
export const SandboxPermissionDialog = ({ hostPattern, onUserResponse, }) => {
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
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Box, { flexDirection: "row", gap: 1, children: _jsx(Text, { color: "cyan", bold: true, children: "Network Access Request" }) }), _jsx(Divider, { width: 50 }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: "A tool wants to access:" }), _jsx(Box, { paddingLeft: 2, marginTop: 1, children: _jsxs(Text, { bold: true, color: "yellow", children: [hostPattern.protocol || 'https', "://", hostDisplay] }) })] }), _jsx(Divider, { width: 50 }), _jsxs(Box, { marginTop: 1, flexDirection: "row", gap: 1, children: [_jsx(Text, { dimColor: true, children: "[P] Remember this choice:" }), _jsx(Text, { color: persistToSettings ? 'green' : 'gray', children: persistToSettings ? 'Yes' : 'No' })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Options:" }), _jsxs(Box, { flexDirection: "column", paddingLeft: 2, children: [_jsxs(Text, { children: [_jsx(Text, { color: "green", children: "[Y]" }), " Allow", ' ', persistToSettings ? '(and remember)' : '(once)'] }), _jsxs(Text, { children: [_jsx(Text, { color: "red", children: "[N]" }), " Deny", ' ', persistToSettings ? '(and remember)' : '(once)'] }), _jsxs(Text, { children: [_jsx(Text, { color: "cyan", children: "[A]" }), " Always allow this host"] })] })] })] }));
};
/**
 * Elicitation dialog component.
 * Shows a dialog for MCP server information requests.
 */
export const ElicitationDialog = ({ serverName, request, onResponse, signal, }) => {
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
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 2, paddingY: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: "magenta", bold: true, children: "MCP Server Request" }), _jsxs(Text, { dimColor: true, children: ["from ", serverName] })] }), _jsx(Divider, { width: 50 }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Server is requesting information:" }) }), _jsx(Box, { paddingLeft: 2, marginTop: 1, children: _jsx(Text, { dimColor: true, children: typeof request === 'string'
                        ? request
                        : JSON.stringify(request, null, 2) }) }), _jsx(Divider, { width: 50 }), _jsxs(Box, { marginTop: 1, flexDirection: "row", gap: 1, children: [_jsx(Text, { children: "Response: " }), _jsx(Text, { color: "cyan", children: input }), _jsx(Text, { color: "gray", children: "|" })] }), _jsx(Box, { marginTop: 1, children: _jsx(KeyHintsRow, { hints: [
                        { key: 'Enter', action: 'submit' },
                        { key: 'Esc', action: 'cancel' },
                    ] }) })] }));
};
/**
 * Cost threshold acknowledgment dialog.
 * Shown when API costs exceed a threshold.
 */
export const CostThresholdDialog = ({ onDone, }) => {
    useInput((input, key) => {
        if (key.return || input === 'y' || input === 'Y') {
            onDone();
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 2, paddingY: 1, children: [_jsx(Box, { flexDirection: "row", gap: 1, children: _jsx(Text, { color: "yellow", bold: true, children: "Cost Threshold Reached" }) }), _jsx(Divider, { width: 50 }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "You have reached your configured cost threshold for this session." }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "You can continue working, but please be mindful of API usage." }) }), _jsx(Divider, { width: 50 }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { children: ["Press ", _jsx(Text, { color: "cyan", bold: true, children: "[Enter]" }), " or", ' ', _jsx(Text, { color: "cyan", bold: true, children: "[Y]" }), " to acknowledge and continue"] }) })] }));
};
// ============================================================================
// Exports
// ============================================================================
export default ToolPermissionDialog;
// Also export with alias for convenience
export { ToolPermissionDialog as PermissionDialog };
//# sourceMappingURL=Permission.js.map