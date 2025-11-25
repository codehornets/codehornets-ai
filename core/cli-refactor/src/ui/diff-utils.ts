/**
 * @fileoverview Diff generation utilities for file comparisons
 * @module ui/diff-utils
 *
 * This module provides utilities for generating unified diff output
 * from file content comparisons and edit operations.
 */

import type {
  DiffHunk,
  DiffOptions,
  DiffFromEditsOptions,
  EditOperation,
  LineChangeStats,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default number of context lines around changes
 */
const DEFAULT_CONTEXT_LINES = 3;

/**
 * Large context value for single hunk mode
 */
const SINGLE_HUNK_CONTEXT = 100000;

/**
 * Token used to escape ampersand characters during diff
 */
const AMPERSAND_TOKEN = '<<:AMPERSAND_TOKEN:>>';

/**
 * Token used to escape dollar sign characters during diff
 */
const DOLLAR_TOKEN = '<<:DOLLAR_TOKEN:>>';

// ============================================================================
// Token Escaping/Unescaping
// ============================================================================

/**
 * Escapes special characters in content before diff generation.
 * This prevents issues with diff algorithms that may interpret
 * ampersands and dollar signs specially.
 *
 * @param content - The content to escape
 * @returns Content with special characters replaced by tokens
 */
export function escapeSpecialChars(content: string): string {
  return content
    .replaceAll('&', AMPERSAND_TOKEN)
    .replaceAll('$', DOLLAR_TOKEN);
}

/**
 * Unescapes tokens back to original special characters.
 *
 * @param content - The content with tokens
 * @returns Content with tokens replaced by original characters
 */
export function unescapeSpecialChars(content: string): string {
  return content
    .replaceAll(AMPERSAND_TOKEN, '&')
    .replaceAll(DOLLAR_TOKEN, '$');
}

// ============================================================================
// Line Normalization
// ============================================================================

/**
 * Normalizes line endings in content to Unix-style (LF).
 *
 * @param content - Content with potentially mixed line endings
 * @returns Content with normalized line endings
 */
export function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Splits content into lines, preserving empty lines.
 *
 * @param content - Content to split
 * @returns Array of lines
 */
export function splitLines(content: string): string[] {
  return content.split(/\r?\n/);
}

// ============================================================================
// Diff Generation
// ============================================================================

/**
 * Creates diff hunks comparing old and new content.
 * Uses unified diff format with configurable context lines.
 *
 * @param options - Diff generation options
 * @returns Array of diff hunks
 *
 * @example
 * ```typescript
 * const hunks = createDiffHunks({
 *   filePath: 'src/index.ts',
 *   oldContent: 'const x = 1;',
 *   newContent: 'const x = 2;',
 * });
 * ```
 */
export function createDiffHunks(options: DiffOptions): DiffHunk[] {
  const {
    filePath,
    oldContent,
    newContent,
    ignoreWhitespace = false,
    singleHunk = false,
  } = options;

  const contextLines = singleHunk ? SINGLE_HUNK_CONTEXT : DEFAULT_CONTEXT_LINES;

  // Escape special characters before comparison
  const escapedOld = escapeSpecialChars(normalizeLineEndings(oldContent));
  const escapedNew = escapeSpecialChars(normalizeLineEndings(newContent));

  // Generate raw hunks using Myers diff algorithm
  const rawHunks = generateUnifiedDiff(
    escapedOld,
    escapedNew,
    contextLines,
    ignoreWhitespace
  );

  // Unescape tokens in the result
  return rawHunks.map((hunk) => ({
    ...hunk,
    lines: hunk.lines.map(unescapeSpecialChars),
  }));
}

/**
 * Creates diff hunks from a series of edit operations.
 * Useful for showing what edits will be applied to a file.
 *
 * @param options - Diff from edits options
 * @returns Array of diff hunks
 *
 * @example
 * ```typescript
 * const hunks = createDiffFromEdits({
 *   filePath: 'src/index.ts',
 *   fileContents: 'const x = 1;\nconst y = 2;',
 *   edits: [{ old_string: 'x = 1', new_string: 'x = 42' }],
 * });
 * ```
 */
export function createDiffFromEdits(options: DiffFromEditsOptions): DiffHunk[] {
  const { filePath, fileContents, edits, ignoreWhitespace = false } = options;

  const normalizedContent = normalizeLineEndings(fileContents);
  const escapedOriginal = escapeSpecialChars(normalizedContent);

  // Apply edits sequentially to get the new content
  const escapedNew = edits.reduce((current, edit) => {
    const { old_string, new_string, replace_all = false } = edit;
    const escapedOld = escapeSpecialChars(normalizeLineEndings(old_string));
    const escapedReplacement = escapeSpecialChars(normalizeLineEndings(new_string));

    if (replace_all) {
      return current.replaceAll(escapedOld, () => escapedReplacement);
    }
    return current.replace(escapedOld, () => escapedReplacement);
  }, escapedOriginal);

  // Generate hunks from the diff
  const rawHunks = generateUnifiedDiff(
    escapedOriginal,
    escapedNew,
    DEFAULT_CONTEXT_LINES,
    ignoreWhitespace
  );

  // Unescape tokens in the result
  return rawHunks.map((hunk) => ({
    ...hunk,
    lines: hunk.lines.map(unescapeSpecialChars),
  }));
}

// ============================================================================
// Unified Diff Algorithm
// ============================================================================

/**
 * Generates unified diff hunks between two strings.
 * Implements a simplified version of the unified diff format.
 *
 * @param oldContent - Original content
 * @param newContent - New content
 * @param contextLines - Number of context lines around changes
 * @param ignoreWhitespace - Whether to ignore whitespace differences
 * @returns Array of diff hunks
 */
function generateUnifiedDiff(
  oldContent: string,
  newContent: string,
  contextLines: number,
  ignoreWhitespace: boolean
): DiffHunk[] {
  const oldLines = splitLines(oldContent);
  const newLines = splitLines(newContent);

  // Use longest common subsequence to find differences
  const lcs = computeLCS(oldLines, newLines, ignoreWhitespace);
  const operations = generateDiffOperations(oldLines, newLines, lcs);

  // Group operations into hunks
  return groupIntoHunks(oldLines, newLines, operations, contextLines);
}

/**
 * Computes the Longest Common Subsequence table for diff generation.
 *
 * @param oldLines - Lines from original content
 * @param newLines - Lines from new content
 * @param ignoreWhitespace - Whether to ignore whitespace in comparisons
 * @returns LCS table
 */
function computeLCS(
  oldLines: string[],
  newLines: string[],
  ignoreWhitespace: boolean
): number[][] {
  const m = oldLines.length;
  const n = newLines.length;

  // Initialize LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  // Fill the LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const oldLine = ignoreWhitespace
        ? oldLines[i - 1]!.trim()
        : oldLines[i - 1]!;
      const newLine = ignoreWhitespace
        ? newLines[j - 1]!.trim()
        : newLines[j - 1]!;

      if (oldLine === newLine) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  return dp;
}

/**
 * Diff operation types
 */
type DiffOperation =
  | { type: 'keep'; oldIndex: number; newIndex: number }
  | { type: 'delete'; oldIndex: number }
  | { type: 'insert'; newIndex: number };

/**
 * Generates diff operations from the LCS table.
 *
 * @param oldLines - Original lines
 * @param newLines - New lines
 * @param lcs - LCS table
 * @returns Array of diff operations
 */
function generateDiffOperations(
  oldLines: string[],
  newLines: string[],
  lcs: number[][]
): DiffOperation[] {
  const operations: DiffOperation[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1]! === newLines[j - 1]!) {
      operations.unshift({ type: 'keep', oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i]![j - 1]! >= lcs[i - 1]![j]!)) {
      operations.unshift({ type: 'insert', newIndex: j - 1 });
      j--;
    } else if (i > 0) {
      operations.unshift({ type: 'delete', oldIndex: i - 1 });
      i--;
    }
  }

  return operations;
}

/**
 * Groups diff operations into hunks with context.
 *
 * @param oldLines - Original lines
 * @param newLines - New lines
 * @param operations - Diff operations
 * @param contextLines - Number of context lines
 * @returns Array of diff hunks
 */
function groupIntoHunks(
  oldLines: string[],
  newLines: string[],
  operations: DiffOperation[],
  contextLines: number
): DiffHunk[] {
  if (operations.length === 0) {
    return [];
  }

  // Find change positions
  const changePositions: number[] = [];
  operations.forEach((op, index) => {
    if (op!.type !== 'keep') {
      changePositions.push(index);
    }
  });

  if (changePositions.length === 0) {
    return [];
  }

  // Group changes that are close together
  const hunks: DiffHunk[] = [];
  let hunkStart = 0;
  let hunkEnd = 0;

  for (let i = 0; i < changePositions.length; i++) {
    const changePos = changePositions[i];

    if (i === 0) {
      hunkStart = Math.max(0, changePos! - contextLines);
      hunkEnd = Math.min(operations.length - 1, changePos! + contextLines);
    } else if (changePos! - hunkEnd <= contextLines * 2) {
      // Merge with previous hunk
      hunkEnd = Math.min(operations.length - 1, changePos! + contextLines);
    } else {
      // Create hunk from previous range
      hunks.push(createHunk(oldLines, newLines, operations, hunkStart, hunkEnd));
      hunkStart = Math.max(0, changePos! - contextLines);
      hunkEnd = Math.min(operations.length - 1, changePos! + contextLines);
    }
  }

  // Create final hunk
  hunks.push(createHunk(oldLines, newLines, operations, hunkStart, hunkEnd));

  return hunks;
}

/**
 * Creates a single diff hunk from a range of operations.
 *
 * @param oldLines - Original lines
 * @param newLines - New lines
 * @param operations - All diff operations
 * @param start - Start index in operations
 * @param end - End index in operations
 * @returns A single diff hunk
 */
function createHunk(
  oldLines: string[],
  newLines: string[],
  operations: DiffOperation[],
  start: number,
  end: number
): DiffHunk {
  const lines: string[] = [];
  let oldStart = -1;
  let newStart = -1;
  let oldCount = 0;
  let newCount = 0;

  for (let i = start; i <= end; i++) {
    const op = operations[i];

    switch (op!.type) {
      case 'keep':
        if (oldStart === -1) {
          oldStart = (op as { oldIndex: number }).oldIndex;
          newStart = (op as { newIndex: number }).newIndex;
        }
        lines.push(` ${oldLines[(op as { oldIndex: number }).oldIndex]!}`);
        oldCount++;
        newCount++;
        break;
      case 'delete':
        if (oldStart === -1) {
          oldStart = (op as { oldIndex: number }).oldIndex;
          // Find corresponding new start
          for (let j = i + 1; j < operations.length; j++) {
            if (operations[j]!.type === 'keep' || operations[j]!.type === 'insert') {
              newStart = operations[j]!.type === 'keep'
                ? (operations[j] as { newIndex: number }).newIndex
                : (operations[j] as { newIndex: number }).newIndex;
              break;
            }
          }
          if (newStart === -1) newStart = newLines.length;
        }
        lines.push(`-${oldLines[(op as { oldIndex: number }).oldIndex]!}`);
        oldCount++;
        break;
      case 'insert':
        if (oldStart === -1) {
          oldStart = oldLines.length;
          newStart = (op as { newIndex: number }).newIndex;
        }
        if (newStart === -1) {
          newStart = (op as { newIndex: number }).newIndex;
        }
        lines.push(`+${newLines[(op as { newIndex: number }).newIndex]!}`);
        newCount++;
        break;
    }
  }

  return {
    oldStart: oldStart + 1, // 1-indexed for display
    oldLines: oldCount,
    newStart: newStart + 1, // 1-indexed for display
    newLines: newCount,
    lines,
  };
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculates line change statistics from diff hunks.
 *
 * @param hunks - Array of diff hunks
 * @param newContent - New content (for empty old content case)
 * @returns Statistics about lines added and removed
 */
export function calculateLineStats(
  hunks: DiffHunk[],
  newContent?: string
): LineChangeStats {
  if (hunks.length === 0 && newContent) {
    // If no hunks but new content exists, count all lines as added
    return {
      linesAdded: splitLines(newContent).length,
      linesRemoved: 0,
    };
  }

  const linesAdded = hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((line) => line.startsWith('+')).length,
    0
  );

  const linesRemoved = hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((line) => line.startsWith('-')).length,
    0
  );

  return { linesAdded, linesRemoved };
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Formats a diff hunk header in unified diff format.
 *
 * @param hunk - The diff hunk
 * @returns Formatted header string
 */
export function formatHunkHeader(hunk: DiffHunk): string {
  return `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
}

/**
 * Gets the line type indicator for styling.
 *
 * @param line - A diff line
 * @returns 'added', 'removed', or 'context'
 */
export function getLineType(line: string): 'added' | 'removed' | 'context' {
  if (line.startsWith('+')) return 'added';
  if (line.startsWith('-')) return 'removed';
  return 'context';
}

/**
 * Strips the diff prefix from a line for display.
 *
 * @param line - A diff line with prefix
 * @returns Line content without the prefix
 */
export function stripDiffPrefix(line: string): string {
  if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
    return line.slice(1);
  }
  return line;
}

// ============================================================================
// Exports
// ============================================================================

export {
  DEFAULT_CONTEXT_LINES,
  AMPERSAND_TOKEN,
  DOLLAR_TOKEN,
};
