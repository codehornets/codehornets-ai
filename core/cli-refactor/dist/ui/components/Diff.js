import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { formatHunkHeader, getLineType, stripDiffPrefix, calculateLineStats, } from '../diff-utils.js';
// ============================================================================
// Constants
// ============================================================================
/**
 * Colors for diff line types
 */
const DIFF_COLORS = {
    added: 'green',
    removed: 'red',
    context: undefined, // Default terminal color
    header: 'cyan',
    stats: 'blue',
};
/**
 * Default maximum width for diff display
 */
const DEFAULT_MAX_WIDTH = 120;
/**
 * Number of characters reserved for line numbers
 */
const LINE_NUMBER_WIDTH = 5;
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Calculates line numbers for display
 *
 * @param hunk - The diff hunk
 * @param lineIndex - Index of the line within the hunk
 * @returns Old and new line numbers
 */
function calculateLineNumbers(hunk, lineIndex) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;
    for (let i = 0; i < lineIndex; i++) {
        const line = hunk.lines[i];
        if (line && line.startsWith('-')) {
            oldLine++;
        }
        else if (line && line.startsWith('+')) {
            newLine++;
        }
        else {
            oldLine++;
            newLine++;
        }
    }
    const currentLine = hunk.lines[lineIndex];
    if (currentLine && currentLine.startsWith('-')) {
        return { oldLineNum: oldLine, newLineNum: null };
    }
    else if (currentLine && currentLine.startsWith('+')) {
        return { oldLineNum: null, newLineNum: newLine };
    }
    return { oldLineNum: oldLine, newLineNum: newLine };
}
/**
 * Formats a line number with padding
 *
 * @param num - Line number or null
 * @param width - Total width for padding
 * @returns Formatted line number string
 */
function formatLineNumber(num, width = LINE_NUMBER_WIDTH) {
    if (num === null)
        return ' '.repeat(width);
    const numStr = num.toString();
    return numStr.padStart(width, ' ');
}
/**
 * Renders a single diff line with appropriate styling
 */
export const DiffLine = ({ line, oldLineNum, newLineNum, showLineNumbers, maxWidth = DEFAULT_MAX_WIDTH, }) => {
    const lineType = getLineType(line);
    const content = stripDiffPrefix(line);
    const color = DIFF_COLORS[lineType];
    // Calculate available width for content
    const lineNumbersWidth = showLineNumbers ? LINE_NUMBER_WIDTH * 2 + 3 : 0;
    const prefixWidth = 1; // +, -, or space
    const availableWidth = maxWidth - lineNumbersWidth - prefixWidth;
    // Truncate content if needed
    const displayContent = content.length > availableWidth
        ? content.slice(0, availableWidth - 3) + '...'
        : content;
    // Get the prefix character
    const prefix = line.charAt(0) || ' ';
    return (_jsxs(Box, { flexDirection: "row", children: [showLineNumbers && (_jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: formatLineNumber(oldLineNum) }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { dimColor: true, children: formatLineNumber(newLineNum) }), _jsx(Text, { dimColor: true, children: " | " })] })), _jsx(Text, { color: color, bold: lineType !== 'context', children: prefix }), _jsx(Text, { color: color, children: displayContent })] }));
};
/**
 * Renders an added line (green with + prefix)
 */
export const AddedLine = ({ content, lineNum, showLineNumbers = false, }) => {
    return (_jsxs(Box, { flexDirection: "row", children: [showLineNumbers && lineNum !== undefined && (_jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: formatLineNumber(null) }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { dimColor: true, children: formatLineNumber(lineNum) }), _jsx(Text, { dimColor: true, children: " | " })] })), _jsx(Text, { color: "green", bold: true, children: "+" }), _jsx(Text, { color: "green", children: content })] }));
};
/**
 * Renders a removed line (red with - prefix)
 */
export const RemovedLine = ({ content, lineNum, showLineNumbers = false, }) => {
    return (_jsxs(Box, { flexDirection: "row", children: [showLineNumbers && lineNum !== undefined && (_jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: formatLineNumber(lineNum) }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { dimColor: true, children: formatLineNumber(null) }), _jsx(Text, { dimColor: true, children: " | " })] })), _jsx(Text, { color: "red", bold: true, children: "-" }), _jsx(Text, { color: "red", children: content })] }));
};
/**
 * Renders a context line (no color, space prefix)
 */
export const ContextLine = ({ content, oldLineNum, newLineNum, showLineNumbers = false, }) => {
    return (_jsxs(Box, { flexDirection: "row", children: [showLineNumbers && (_jsxs(_Fragment, { children: [_jsx(Text, { dimColor: true, children: formatLineNumber(oldLineNum ?? null) }), _jsx(Text, { dimColor: true, children: " " }), _jsx(Text, { dimColor: true, children: formatLineNumber(newLineNum ?? null) }), _jsx(Text, { dimColor: true, children: " | " })] })), _jsx(Text, { children: " " }), _jsx(Text, { dimColor: true, children: content })] }));
};
/**
 * Renders a diff hunk header (@@ ... @@)
 */
export const HunkHeader = ({ hunk }) => {
    const header = formatHunkHeader(hunk);
    return (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: DIFF_COLORS.header, bold: true, children: header }) }));
};
/**
 * Renders a complete diff hunk with header and lines
 */
export const DiffHunkDisplay = ({ hunk, showLineNumbers, maxWidth, }) => {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(HunkHeader, { hunk: hunk }), hunk.lines.map((line, index) => {
                const { oldLineNum, newLineNum } = calculateLineNumbers(hunk, index);
                return (_jsx(DiffLine, { line: line, oldLineNum: oldLineNum, newLineNum: newLineNum, showLineNumbers: showLineNumbers, maxWidth: maxWidth }, index));
            })] }));
};
/**
 * Renders diff statistics (lines added/removed)
 */
export const DiffStats = ({ linesAdded, linesRemoved, }) => {
    return (_jsxs(Box, { flexDirection: "row", gap: 1, marginTop: 1, children: [_jsxs(Text, { color: "green", children: ["+", linesAdded] }), _jsxs(Text, { color: "red", children: ["-", linesRemoved] })] }));
};
/**
 * Renders a visual bar representing the ratio of changes
 */
export const DiffBar = ({ linesAdded, linesRemoved, width = 20, }) => {
    const total = linesAdded + linesRemoved;
    if (total === 0)
        return null;
    const addedWidth = Math.round((linesAdded / total) * width);
    const removedWidth = width - addedWidth;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: "green", children: '+' }), _jsx(Text, { backgroundColor: "green", children: ' '.repeat(Math.max(0, addedWidth)) }), _jsx(Text, { backgroundColor: "red", children: ' '.repeat(Math.max(0, removedWidth)) }), _jsx(Text, { color: "red", children: '-' })] }));
};
/**
 * Renders a diff file header with path and stats
 */
export const DiffFileHeader = ({ filePath, linesAdded, linesRemoved, }) => {
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { bold: true, children: filePath }), _jsxs(Text, { color: "green", children: ["+", linesAdded] }), _jsxs(Text, { color: "red", children: ["-", linesRemoved] })] }), _jsx(Text, { dimColor: true, children: '='.repeat(Math.min(filePath.length + 10, 60)) })] }));
};
// ============================================================================
// Main Diff Component
// ============================================================================
/**
 * Main diff display component.
 * Renders a complete diff with file header, hunks, and statistics.
 *
 * @param props - Diff display props
 * @returns Rendered diff component
 *
 * @example
 * ```tsx
 * <Diff
 *   hunks={diffHunks}
 *   filePath="src/index.ts"
 *   showLineNumbers={true}
 *   width={100}
 * />
 * ```
 */
export const Diff = ({ hunks, filePath, width, showLineNumbers = false, }) => {
    // Don't render if no hunks
    if (hunks.length === 0) {
        return (_jsx(Box, { children: _jsx(Text, { dimColor: true, children: "No changes" }) }));
    }
    // Calculate stats
    const stats = calculateLineStats(hunks);
    return (_jsxs(Box, { flexDirection: "column", width: width, children: [_jsx(DiffFileHeader, { filePath: filePath, linesAdded: stats.linesAdded, linesRemoved: stats.linesRemoved }), hunks.map((hunk, index) => (_jsx(DiffHunkDisplay, { hunk: hunk, showLineNumbers: showLineNumbers, maxWidth: width }, index))), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: [stats.linesAdded, " insertion", stats.linesAdded !== 1 ? 's' : '', "(+),", ' ', stats.linesRemoved, " deletion", stats.linesRemoved !== 1 ? 's' : '', "(-)"] }) })] }));
};
/**
 * Renders a compact diff view showing only changed lines
 * (no context, limited number of lines)
 */
export const CompactDiff = ({ hunks, filePath, maxLines = 10, }) => {
    // Collect all changed lines
    const changedLines = [];
    for (const hunk of hunks) {
        for (const line of hunk.lines) {
            if (line && line.startsWith('+')) {
                changedLines.push({ line: stripDiffPrefix(line), type: 'added' });
            }
            else if (line && line.startsWith('-')) {
                changedLines.push({ line: stripDiffPrefix(line), type: 'removed' });
            }
        }
    }
    const displayLines = changedLines.slice(0, maxLines);
    const remainingCount = changedLines.length - displayLines.length;
    const stats = calculateLineStats(hunks);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Text, { dimColor: true, children: filePath }), _jsxs(Text, { color: "green", children: ["+", stats.linesAdded] }), _jsxs(Text, { color: "red", children: ["-", stats.linesRemoved] })] }), displayLines.map((item, index) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: item.type === 'added' ? 'green' : 'red', children: item.type === 'added' ? '+' : '-' }), _jsxs(Text, { color: item.type === 'added' ? 'green' : 'red', children: [item.line.slice(0, 60), item.line.length > 60 ? '...' : ''] })] }, index))), remainingCount > 0 && (_jsxs(Text, { dimColor: true, children: ["... and ", remainingCount, " more lines"] }))] }));
};
/**
 * Renders an inline diff showing old and new side by side
 */
export const InlineDiff = ({ oldLine, newLine, oldLineNum, newLineNum, }) => {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", children: [oldLineNum !== undefined && (_jsxs(Text, { dimColor: true, children: [formatLineNumber(oldLineNum), " "] })), _jsxs(Text, { color: "red", strikethrough: true, children: ["-", oldLine] })] }), _jsxs(Box, { flexDirection: "row", children: [newLineNum !== undefined && (_jsxs(Text, { dimColor: true, children: [formatLineNumber(newLineNum), " "] })), _jsxs(Text, { color: "green", children: ["+", newLine] })] })] }));
};
// ============================================================================
// Exports
// ============================================================================
export default Diff;
//# sourceMappingURL=Diff.js.map