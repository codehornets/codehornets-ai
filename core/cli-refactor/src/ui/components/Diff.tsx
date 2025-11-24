/**
 * @fileoverview Diff visualization components for the CLI UI
 * @module ui/components/Diff
 *
 * This module provides React components for rendering unified diff
 * output in the terminal, with syntax highlighting for added,
 * removed, and context lines.
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { DiffHunk, DiffProps } from '../types.js';
import {
  formatHunkHeader,
  getLineType,
  stripDiffPrefix,
  calculateLineStats,
} from '../diff-utils.js';

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
} as const;

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
function calculateLineNumbers(
  hunk: DiffHunk,
  lineIndex: number
): { oldLineNum: number | null; newLineNum: number | null } {
  let oldLine = hunk.oldStart;
  let newLine = hunk.newStart;

  for (let i = 0; i < lineIndex; i++) {
    const line = hunk.lines[i];
    if (line && line.startsWith('-')) {
      oldLine++;
    } else if (line && line.startsWith('+')) {
      newLine++;
    } else {
      oldLine++;
      newLine++;
    }
  }

  const currentLine = hunk.lines[lineIndex];
  if (currentLine && currentLine.startsWith('-')) {
    return { oldLineNum: oldLine, newLineNum: null };
  } else if (currentLine && currentLine.startsWith('+')) {
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
function formatLineNumber(num: number | null, width: number = LINE_NUMBER_WIDTH): string {
  if (num === null) return ' '.repeat(width);
  const numStr = num.toString();
  return numStr.padStart(width, ' ');
}

// ============================================================================
// Line Components
// ============================================================================

/**
 * Props for a single diff line
 */
interface DiffLineProps {
  line: string;
  oldLineNum: number | null;
  newLineNum: number | null;
  showLineNumbers: boolean;
  maxWidth?: number;
}

/**
 * Renders a single diff line with appropriate styling
 */
export const DiffLine: React.FC<DiffLineProps> = ({
  line,
  oldLineNum,
  newLineNum,
  showLineNumbers,
  maxWidth = DEFAULT_MAX_WIDTH,
}) => {
  const lineType = getLineType(line);
  const content = stripDiffPrefix(line);
  const color = DIFF_COLORS[lineType];

  // Calculate available width for content
  const lineNumbersWidth = showLineNumbers ? LINE_NUMBER_WIDTH * 2 + 3 : 0;
  const prefixWidth = 1; // +, -, or space
  const availableWidth = maxWidth - lineNumbersWidth - prefixWidth;

  // Truncate content if needed
  const displayContent =
    content.length > availableWidth
      ? content.slice(0, availableWidth - 3) + '...'
      : content;

  // Get the prefix character
  const prefix = line.charAt(0) || ' ';

  return (
    <Box flexDirection="row">
      {showLineNumbers && (
        <>
          <Text dimColor>
            {formatLineNumber(oldLineNum)}
          </Text>
          <Text dimColor> </Text>
          <Text dimColor>
            {formatLineNumber(newLineNum)}
          </Text>
          <Text dimColor> | </Text>
        </>
      )}
      <Text color={color} bold={lineType !== 'context'}>
        {prefix}
      </Text>
      <Text color={color}>{displayContent}</Text>
    </Box>
  );
};

/**
 * Props for added line display
 */
interface AddedLineProps {
  content: string;
  lineNum?: number;
  showLineNumbers?: boolean;
}

/**
 * Renders an added line (green with + prefix)
 */
export const AddedLine: React.FC<AddedLineProps> = ({
  content,
  lineNum,
  showLineNumbers = false,
}) => {
  return (
    <Box flexDirection="row">
      {showLineNumbers && lineNum !== undefined && (
        <>
          <Text dimColor>{formatLineNumber(null)}</Text>
          <Text dimColor> </Text>
          <Text dimColor>{formatLineNumber(lineNum)}</Text>
          <Text dimColor> | </Text>
        </>
      )}
      <Text color="green" bold>
        +
      </Text>
      <Text color="green">{content}</Text>
    </Box>
  );
};

/**
 * Props for removed line display
 */
interface RemovedLineProps {
  content: string;
  lineNum?: number;
  showLineNumbers?: boolean;
}

/**
 * Renders a removed line (red with - prefix)
 */
export const RemovedLine: React.FC<RemovedLineProps> = ({
  content,
  lineNum,
  showLineNumbers = false,
}) => {
  return (
    <Box flexDirection="row">
      {showLineNumbers && lineNum !== undefined && (
        <>
          <Text dimColor>{formatLineNumber(lineNum)}</Text>
          <Text dimColor> </Text>
          <Text dimColor>{formatLineNumber(null)}</Text>
          <Text dimColor> | </Text>
        </>
      )}
      <Text color="red" bold>
        -
      </Text>
      <Text color="red">{content}</Text>
    </Box>
  );
};

/**
 * Props for context line display
 */
interface ContextLineProps {
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
  showLineNumbers?: boolean;
}

/**
 * Renders a context line (no color, space prefix)
 */
export const ContextLine: React.FC<ContextLineProps> = ({
  content,
  oldLineNum,
  newLineNum,
  showLineNumbers = false,
}) => {
  return (
    <Box flexDirection="row">
      {showLineNumbers && (
        <>
          <Text dimColor>{formatLineNumber(oldLineNum ?? null)}</Text>
          <Text dimColor> </Text>
          <Text dimColor>{formatLineNumber(newLineNum ?? null)}</Text>
          <Text dimColor> | </Text>
        </>
      )}
      <Text> </Text>
      <Text dimColor>{content}</Text>
    </Box>
  );
};

// ============================================================================
// Hunk Components
// ============================================================================

/**
 * Props for hunk header
 */
interface HunkHeaderProps {
  hunk: DiffHunk;
}

/**
 * Renders a diff hunk header (@@ ... @@)
 */
export const HunkHeader: React.FC<HunkHeaderProps> = ({ hunk }) => {
  const header = formatHunkHeader(hunk);

  return (
    <Box marginTop={1}>
      <Text color={DIFF_COLORS.header} bold>
        {header}
      </Text>
    </Box>
  );
};

/**
 * Props for a complete hunk display
 */
interface DiffHunkDisplayProps {
  hunk: DiffHunk;
  showLineNumbers: boolean;
  maxWidth?: number;
}

/**
 * Renders a complete diff hunk with header and lines
 */
export const DiffHunkDisplay: React.FC<DiffHunkDisplayProps> = ({
  hunk,
  showLineNumbers,
  maxWidth,
}) => {
  return (
    <Box flexDirection="column">
      <HunkHeader hunk={hunk} />
      {hunk.lines.map((line, index) => {
        const { oldLineNum, newLineNum } = calculateLineNumbers(hunk, index);
        return (
          <DiffLine
            key={index}
            line={line}
            oldLineNum={oldLineNum}
            newLineNum={newLineNum}
            showLineNumbers={showLineNumbers}
            maxWidth={maxWidth}
          />
        );
      })}
    </Box>
  );
};

// ============================================================================
// Stats Components
// ============================================================================

/**
 * Props for diff stats display
 */
interface DiffStatsProps {
  linesAdded: number;
  linesRemoved: number;
}

/**
 * Renders diff statistics (lines added/removed)
 */
export const DiffStats: React.FC<DiffStatsProps> = ({
  linesAdded,
  linesRemoved,
}) => {
  return (
    <Box flexDirection="row" gap={1} marginTop={1}>
      <Text color="green">+{linesAdded}</Text>
      <Text color="red">-{linesRemoved}</Text>
    </Box>
  );
};

/**
 * Renders a visual bar representing the ratio of changes
 */
export const DiffBar: React.FC<DiffStatsProps & { width?: number }> = ({
  linesAdded,
  linesRemoved,
  width = 20,
}) => {
  const total = linesAdded + linesRemoved;
  if (total === 0) return null;

  const addedWidth = Math.round((linesAdded / total) * width);
  const removedWidth = width - addedWidth;

  return (
    <Box flexDirection="row">
      <Text color="green">{'+'}</Text>
      <Text backgroundColor="green">{' '.repeat(Math.max(0, addedWidth))}</Text>
      <Text backgroundColor="red">{' '.repeat(Math.max(0, removedWidth))}</Text>
      <Text color="red">{'-'}</Text>
    </Box>
  );
};

// ============================================================================
// File Header Component
// ============================================================================

/**
 * Props for diff file header
 */
interface DiffFileHeaderProps {
  filePath: string;
  linesAdded: number;
  linesRemoved: number;
}

/**
 * Renders a diff file header with path and stats
 */
export const DiffFileHeader: React.FC<DiffFileHeaderProps> = ({
  filePath,
  linesAdded,
  linesRemoved,
}) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row" gap={2}>
        <Text bold>{filePath}</Text>
        <Text color="green">+{linesAdded}</Text>
        <Text color="red">-{linesRemoved}</Text>
      </Box>
      <Text dimColor>{'='.repeat(Math.min(filePath.length + 10, 60))}</Text>
    </Box>
  );
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
export const Diff: React.FC<DiffProps> = ({
  hunks,
  filePath,
  width,
  showLineNumbers = false,
}) => {
  // Don't render if no hunks
  if (hunks.length === 0) {
    return (
      <Box>
        <Text dimColor>No changes</Text>
      </Box>
    );
  }

  // Calculate stats
  const stats = calculateLineStats(hunks);

  return (
    <Box flexDirection="column" width={width}>
      {/* File header */}
      <DiffFileHeader
        filePath={filePath}
        linesAdded={stats.linesAdded}
        linesRemoved={stats.linesRemoved}
      />

      {/* Hunks */}
      {hunks.map((hunk, index) => (
        <DiffHunkDisplay
          key={index}
          hunk={hunk}
          showLineNumbers={showLineNumbers}
          maxWidth={width}
        />
      ))}

      {/* Summary stats */}
      <Box marginTop={1}>
        <Text dimColor>
          {stats.linesAdded} insertion{stats.linesAdded !== 1 ? 's' : ''}(+),{' '}
          {stats.linesRemoved} deletion{stats.linesRemoved !== 1 ? 's' : ''}(-)
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Compact Diff Component
// ============================================================================

/**
 * Props for compact diff display
 */
interface CompactDiffProps {
  hunks: DiffHunk[];
  filePath: string;
  maxLines?: number;
}

/**
 * Renders a compact diff view showing only changed lines
 * (no context, limited number of lines)
 */
export const CompactDiff: React.FC<CompactDiffProps> = ({
  hunks,
  filePath,
  maxLines = 10,
}) => {
  // Collect all changed lines
  const changedLines: Array<{ line: string; type: 'added' | 'removed' }> = [];

  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line && line.startsWith('+')) {
        changedLines.push({ line: stripDiffPrefix(line), type: 'added' });
      } else if (line && line.startsWith('-')) {
        changedLines.push({ line: stripDiffPrefix(line), type: 'removed' });
      }
    }
  }

  const displayLines = changedLines.slice(0, maxLines);
  const remainingCount = changedLines.length - displayLines.length;

  const stats = calculateLineStats(hunks);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box flexDirection="row" gap={2}>
        <Text dimColor>{filePath}</Text>
        <Text color="green">+{stats.linesAdded}</Text>
        <Text color="red">-{stats.linesRemoved}</Text>
      </Box>

      {/* Changed lines */}
      {displayLines.map((item, index) => (
        <Box key={index} flexDirection="row">
          <Text color={item.type === 'added' ? 'green' : 'red'}>
            {item.type === 'added' ? '+' : '-'}
          </Text>
          <Text color={item.type === 'added' ? 'green' : 'red'}>
            {item.line.slice(0, 60)}
            {item.line.length > 60 ? '...' : ''}
          </Text>
        </Box>
      ))}

      {/* Remaining count */}
      {remainingCount > 0 && (
        <Text dimColor>... and {remainingCount} more lines</Text>
      )}
    </Box>
  );
};

// ============================================================================
// Inline Diff Component
// ============================================================================

/**
 * Props for inline diff (side-by-side style in terminal)
 */
interface InlineDiffProps {
  oldLine: string;
  newLine: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/**
 * Renders an inline diff showing old and new side by side
 */
export const InlineDiff: React.FC<InlineDiffProps> = ({
  oldLine,
  newLine,
  oldLineNum,
  newLineNum,
}) => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        {oldLineNum !== undefined && (
          <Text dimColor>{formatLineNumber(oldLineNum)} </Text>
        )}
        <Text color="red" strikethrough>
          -{oldLine}
        </Text>
      </Box>
      <Box flexDirection="row">
        {newLineNum !== undefined && (
          <Text dimColor>{formatLineNumber(newLineNum)} </Text>
        )}
        <Text color="green">+{newLine}</Text>
      </Box>
    </Box>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default Diff;
