import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Diagnostics display components for the CLI UI
 * @module ui/components/Diagnostics
 *
 * This module provides React components for rendering diagnostic
 * information from IDEs and language servers, including errors,
 * warnings, and hints.
 */
import React from 'react';
import { Box, Text } from 'ink';
// ============================================================================
// Constants
// ============================================================================
/**
 * Severity level names
 */
const SEVERITY_NAMES = {
    1: 'Error',
    2: 'Warning',
    3: 'Info',
    4: 'Hint',
};
/**
 * Severity level symbols for compact display
 */
const SEVERITY_SYMBOLS = {
    1: 'X', // Error
    2: '!', // Warning
    3: 'i', // Info
    4: '?', // Hint
};
/**
 * Severity level colors
 */
const SEVERITY_COLORS = {
    1: 'red',
    2: 'yellow',
    3: 'cyan',
    4: 'gray',
};
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Gets the display symbol for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Symbol character
 */
export function getSeveritySymbol(severity) {
    return SEVERITY_SYMBOLS[severity] || '?';
}
/**
 * Gets the color for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Color name
 */
export function getSeverityColor(severity) {
    return SEVERITY_COLORS[severity] || 'gray';
}
/**
 * Gets the name for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Severity name
 */
export function getSeverityName(severity) {
    return SEVERITY_NAMES[severity] || 'Unknown';
}
/**
 * Extracts relative path from a file URI
 *
 * @param uri - File URI (e.g., file:///path/to/file)
 * @param cwd - Current working directory
 * @returns Relative path
 */
function getRelativePathFromUri(uri, cwd = process.cwd()) {
    // Handle different URI formats
    let path = uri;
    if (uri.startsWith('file://')) {
        path = uri.replace('file://', '');
    }
    else if (uri.startsWith('_claude_fs_right:')) {
        path = uri.replace('_claude_fs_right:', '');
    }
    // Handle Windows paths
    if (path.startsWith('/') && process.platform === 'win32') {
        path = path.slice(1);
    }
    // Make relative to cwd
    if (path.startsWith(cwd)) {
        const relative = path.slice(cwd.length);
        return relative.startsWith('/') || relative.startsWith('\\')
            ? relative.slice(1)
            : relative;
    }
    return path;
}
/**
 * Gets the URI type description
 *
 * @param uri - File URI
 * @returns Description of the URI type
 */
function getUriTypeDescription(uri) {
    if (uri.startsWith('file://'))
        return '(file://)';
    if (uri.startsWith('_claude_fs_right:'))
        return '(claude_fs_right)';
    const protocol = uri.split(':')[0];
    return protocol ? `(${protocol})` : '';
}
/**
 * Renders a single diagnostic entry
 */
export const DiagnosticEntry = ({ diagnostic, showDetails = true, }) => {
    const symbol = getSeveritySymbol(diagnostic.severity);
    const color = getSeverityColor(diagnostic.severity);
    const line = diagnostic.range.start.line + 1; // Convert to 1-indexed
    const char = diagnostic.range.start.character + 1;
    return (_jsx(Box, { flexDirection: "row", paddingLeft: 2, children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: [_jsx(Text, { color: color, children: symbol }), ' [Line ', line, ":", char, '] ', diagnostic.message, showDetails && diagnostic.code && (_jsxs(Text, { dimColor: true, children: [" [", diagnostic.code, "]"] })), showDetails && diagnostic.source && (_jsxs(Text, { dimColor: true, children: [" (", diagnostic.source, ")"] }))] }) }));
};
/**
 * Renders diagnostics for a single file
 */
export const FileDiagnostics = ({ file, showDetails = true, cwd, }) => {
    const relativePath = getRelativePathFromUri(file.uri, cwd);
    const uriType = getUriTypeDescription(file.uri);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { flexDirection: "row", children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: [_jsx(Text, { bold: true, children: relativePath }), ' ', _jsx(Text, { dimColor: true, children: uriType }), ':'] }) }), file.diagnostics.map((diagnostic, index) => (_jsx(DiagnosticEntry, { diagnostic: diagnostic, showDetails: showDetails }, index)))] }));
};
/**
 * Renders a compact summary of diagnostics
 */
export const DiagnosticsSummary = ({ totalIssues, fileCount, }) => {
    const issueWord = totalIssues === 1 ? 'issue' : 'issues';
    const fileWord = fileCount === 1 ? 'file' : 'files';
    return (_jsx(Box, { flexDirection: "row", children: _jsxs(Text, { dimColor: true, wrap: "wrap", children: ["Found ", _jsx(Text, { bold: true, children: totalIssues }), " new diagnostic ", issueWord, " in", ' ', fileCount, " ", fileWord, " (ctrl-o to expand)"] }) }));
};
/**
 * Calculates breakdown by severity
 */
function calculateSeverityBreakdown(attachment) {
    const breakdown = {
        1: 0, // Errors
        2: 0, // Warnings
        3: 0, // Info
        4: 0, // Hints
    };
    attachment.files.forEach((file) => {
        file.diagnostics.forEach((diagnostic) => {
            breakdown[diagnostic.severity] = (breakdown[diagnostic.severity] || 0) + 1;
        });
    });
    return breakdown;
}
/**
 * Renders detailed breakdown by severity
 */
export const DetailedSummary = ({ attachment, }) => {
    const breakdown = calculateSeverityBreakdown(attachment);
    const hasErrors = breakdown[1] > 0;
    const hasWarnings = breakdown[2] > 0;
    const hasInfo = breakdown[3] > 0;
    const hasHints = breakdown[4] > 0;
    const parts = [];
    if (hasErrors) {
        parts.push(_jsxs(Text, { color: "red", children: [breakdown[1], " error", breakdown[1] !== 1 ? 's' : ''] }, "errors"));
    }
    if (hasWarnings) {
        parts.push(_jsxs(Text, { color: "yellow", children: [breakdown[2], " warning", breakdown[2] !== 1 ? 's' : ''] }, "warnings"));
    }
    if (hasInfo) {
        parts.push(_jsxs(Text, { color: "cyan", children: [breakdown[3], " info"] }, "info"));
    }
    if (hasHints) {
        parts.push(_jsxs(Text, { color: "gray", children: [breakdown[4], " hint", breakdown[4] !== 1 ? 's' : ''] }, "hints"));
    }
    if (parts.length === 0)
        return null;
    return (_jsxs(Box, { flexDirection: "row", gap: 1, marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Summary: " }), parts.map((part, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx(Text, { dimColor: true, children: ", " }), part] }, index)))] }));
};
// ============================================================================
// Main Diagnostics Component
// ============================================================================
/**
 * Main diagnostics display component.
 * Shows either a compact summary or detailed view based on verbose mode.
 *
 * @param props - Diagnostics props
 * @returns Rendered diagnostics component
 *
 * @example
 * ```tsx
 * // Compact view
 * <Diagnostics attachment={diagnosticsAttachment} verbose={false} />
 *
 * // Detailed view
 * <Diagnostics attachment={diagnosticsAttachment} verbose={true} />
 * ```
 */
export const Diagnostics = ({ attachment, verbose = false, }) => {
    // Don't render if no files with diagnostics
    if (attachment.files.length === 0) {
        return null;
    }
    // Calculate totals
    const totalIssues = attachment.files.reduce((sum, file) => sum + file.diagnostics.length, 0);
    const fileCount = attachment.files.length;
    // Verbose mode: show all details
    if (verbose) {
        return (_jsxs(Box, { flexDirection: "column", children: [attachment.files.map((file, index) => (_jsxs(React.Fragment, { children: [index > 0 && _jsx(Box, { marginTop: 1 }), _jsx(FileDiagnostics, { file: file, showDetails: true, cwd: process.cwd() })] }, index))), _jsx(DetailedSummary, { attachment: attachment })] }));
    }
    // Compact mode: just show summary
    return _jsx(DiagnosticsSummary, { totalIssues: totalIssues, fileCount: fileCount });
};
// ============================================================================
// Exports
// ============================================================================
export default Diagnostics;
// Export utility functions for use in other components
export { getSeveritySymbol as getSeveritySymbolUtil, getSeverityColor as getSeverityColorUtil, getSeverityName as getSeverityNameUtil, };
//# sourceMappingURL=Diagnostics.js.map