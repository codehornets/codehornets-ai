/**
 * @fileoverview Diff visualization components for the CLI UI
 * @module ui/components/Diff
 *
 * This module provides React components for rendering unified diff
 * output in the terminal, with syntax highlighting for added,
 * removed, and context lines.
 */
import React from 'react';
import type { DiffHunk, DiffProps } from '../types.js';
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
export declare const DiffLine: React.FC<DiffLineProps>;
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
export declare const AddedLine: React.FC<AddedLineProps>;
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
export declare const RemovedLine: React.FC<RemovedLineProps>;
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
export declare const ContextLine: React.FC<ContextLineProps>;
/**
 * Props for hunk header
 */
interface HunkHeaderProps {
    hunk: DiffHunk;
}
/**
 * Renders a diff hunk header (@@ ... @@)
 */
export declare const HunkHeader: React.FC<HunkHeaderProps>;
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
export declare const DiffHunkDisplay: React.FC<DiffHunkDisplayProps>;
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
export declare const DiffStats: React.FC<DiffStatsProps>;
/**
 * Renders a visual bar representing the ratio of changes
 */
export declare const DiffBar: React.FC<DiffStatsProps & {
    width?: number;
}>;
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
export declare const DiffFileHeader: React.FC<DiffFileHeaderProps>;
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
export declare const Diff: React.FC<DiffProps>;
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
export declare const CompactDiff: React.FC<CompactDiffProps>;
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
export declare const InlineDiff: React.FC<InlineDiffProps>;
export default Diff;
//# sourceMappingURL=Diff.d.ts.map