/**
 * @fileoverview Diagnostics display components for the CLI UI
 * @module ui/components/Diagnostics
 *
 * This module provides React components for rendering diagnostic
 * information from IDEs and language servers, including errors,
 * warnings, and hints.
 */
import React from 'react';
import type { DiagnosticsAttachment, DiagnosticsProps, Diagnostic, DiagnosticFile, DiagnosticSeverity } from '../types.js';
/**
 * Gets the display symbol for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Symbol character
 */
export declare function getSeveritySymbol(severity: DiagnosticSeverity): string;
/**
 * Gets the color for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Color name
 */
export declare function getSeverityColor(severity: DiagnosticSeverity): string;
/**
 * Gets the name for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Severity name
 */
export declare function getSeverityName(severity: DiagnosticSeverity): string;
/**
 * Props for a single diagnostic entry
 */
interface DiagnosticEntryProps {
    diagnostic: Diagnostic;
    showDetails?: boolean;
}
/**
 * Renders a single diagnostic entry
 */
export declare const DiagnosticEntry: React.FC<DiagnosticEntryProps>;
/**
 * Props for file diagnostics display
 */
interface FileDiagnosticsProps {
    file: DiagnosticFile;
    showDetails?: boolean;
    cwd?: string;
}
/**
 * Renders diagnostics for a single file
 */
export declare const FileDiagnostics: React.FC<FileDiagnosticsProps>;
/**
 * Props for diagnostics summary
 */
interface DiagnosticsSummaryProps {
    totalIssues: number;
    fileCount: number;
}
/**
 * Renders a compact summary of diagnostics
 */
export declare const DiagnosticsSummary: React.FC<DiagnosticsSummaryProps>;
/**
 * Props for detailed diagnostics summary
 */
interface DetailedSummaryProps {
    attachment: DiagnosticsAttachment;
}
/**
 * Renders detailed breakdown by severity
 */
export declare const DetailedSummary: React.FC<DetailedSummaryProps>;
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
export declare const Diagnostics: React.FC<DiagnosticsProps>;
export default Diagnostics;
export { getSeveritySymbol as getSeveritySymbolUtil, getSeverityColor as getSeverityColorUtil, getSeverityName as getSeverityNameUtil, };
//# sourceMappingURL=Diagnostics.d.ts.map