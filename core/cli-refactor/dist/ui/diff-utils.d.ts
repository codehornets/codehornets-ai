/**
 * @fileoverview Diff generation utilities for file comparisons
 * @module ui/diff-utils
 *
 * This module provides utilities for generating unified diff output
 * from file content comparisons and edit operations.
 */
import type { DiffHunk, DiffOptions, DiffFromEditsOptions, LineChangeStats } from './types.js';
/**
 * Default number of context lines around changes
 */
declare const DEFAULT_CONTEXT_LINES = 3;
/**
 * Token used to escape ampersand characters during diff
 */
declare const AMPERSAND_TOKEN = "<<:AMPERSAND_TOKEN:>>";
/**
 * Token used to escape dollar sign characters during diff
 */
declare const DOLLAR_TOKEN = "<<:DOLLAR_TOKEN:>>";
/**
 * Escapes special characters in content before diff generation.
 * This prevents issues with diff algorithms that may interpret
 * ampersands and dollar signs specially.
 *
 * @param content - The content to escape
 * @returns Content with special characters replaced by tokens
 */
export declare function escapeSpecialChars(content: string): string;
/**
 * Unescapes tokens back to original special characters.
 *
 * @param content - The content with tokens
 * @returns Content with tokens replaced by original characters
 */
export declare function unescapeSpecialChars(content: string): string;
/**
 * Normalizes line endings in content to Unix-style (LF).
 *
 * @param content - Content with potentially mixed line endings
 * @returns Content with normalized line endings
 */
export declare function normalizeLineEndings(content: string): string;
/**
 * Splits content into lines, preserving empty lines.
 *
 * @param content - Content to split
 * @returns Array of lines
 */
export declare function splitLines(content: string): string[];
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
export declare function createDiffHunks(options: DiffOptions): DiffHunk[];
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
export declare function createDiffFromEdits(options: DiffFromEditsOptions): DiffHunk[];
/**
 * Calculates line change statistics from diff hunks.
 *
 * @param hunks - Array of diff hunks
 * @param newContent - New content (for empty old content case)
 * @returns Statistics about lines added and removed
 */
export declare function calculateLineStats(hunks: DiffHunk[], newContent?: string): LineChangeStats;
/**
 * Formats a diff hunk header in unified diff format.
 *
 * @param hunk - The diff hunk
 * @returns Formatted header string
 */
export declare function formatHunkHeader(hunk: DiffHunk): string;
/**
 * Gets the line type indicator for styling.
 *
 * @param line - A diff line
 * @returns 'added', 'removed', or 'context'
 */
export declare function getLineType(line: string): 'added' | 'removed' | 'context';
/**
 * Strips the diff prefix from a line for display.
 *
 * @param line - A diff line with prefix
 * @returns Line content without the prefix
 */
export declare function stripDiffPrefix(line: string): string;
export { DEFAULT_CONTEXT_LINES, AMPERSAND_TOKEN, DOLLAR_TOKEN, };
//# sourceMappingURL=diff-utils.d.ts.map