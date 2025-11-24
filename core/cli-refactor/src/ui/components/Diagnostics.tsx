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
import type {
  DiagnosticsAttachment,
  DiagnosticsProps,
  Diagnostic,
  DiagnosticFile,
  DiagnosticSeverity,
} from '../types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Severity level names
 */
const SEVERITY_NAMES: Record<DiagnosticSeverity, string> = {
  1: 'Error',
  2: 'Warning',
  3: 'Info',
  4: 'Hint',
};

/**
 * Severity level symbols for compact display
 */
const SEVERITY_SYMBOLS: Record<DiagnosticSeverity, string> = {
  1: 'X',  // Error
  2: '!',  // Warning
  3: 'i',  // Info
  4: '?',  // Hint
};

/**
 * Severity level colors
 */
const SEVERITY_COLORS: Record<DiagnosticSeverity, string> = {
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
export function getSeveritySymbol(severity: DiagnosticSeverity): string {
  return SEVERITY_SYMBOLS[severity] || '?';
}

/**
 * Gets the color for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Color name
 */
export function getSeverityColor(severity: DiagnosticSeverity): string {
  return SEVERITY_COLORS[severity] || 'gray';
}

/**
 * Gets the name for a severity level
 *
 * @param severity - Diagnostic severity level
 * @returns Severity name
 */
export function getSeverityName(severity: DiagnosticSeverity): string {
  return SEVERITY_NAMES[severity] || 'Unknown';
}

/**
 * Extracts relative path from a file URI
 *
 * @param uri - File URI (e.g., file:///path/to/file)
 * @param cwd - Current working directory
 * @returns Relative path
 */
function getRelativePathFromUri(uri: string, cwd: string = process.cwd()): string {
  // Handle different URI formats
  let path = uri;

  if (uri.startsWith('file://')) {
    path = uri.replace('file://', '');
  } else if (uri.startsWith('_claude_fs_right:')) {
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
function getUriTypeDescription(uri: string): string {
  if (uri.startsWith('file://')) return '(file://)';
  if (uri.startsWith('_claude_fs_right:')) return '(claude_fs_right)';
  const protocol = uri.split(':')[0];
  return protocol ? `(${protocol})` : '';
}

// ============================================================================
// Individual Diagnostic Components
// ============================================================================

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
export const DiagnosticEntry: React.FC<DiagnosticEntryProps> = ({
  diagnostic,
  showDetails = true,
}) => {
  const symbol = getSeveritySymbol(diagnostic.severity);
  const color = getSeverityColor(diagnostic.severity);
  const line = diagnostic.range.start.line + 1; // Convert to 1-indexed
  const char = diagnostic.range.start.character + 1;

  return (
    <Box flexDirection="row" paddingLeft={2}>
      <Text dimColor wrap="wrap">
        <Text color={color}>{symbol}</Text>
        {' [Line '}
        {line}:{char}
        {'] '}
        {diagnostic.message}
        {showDetails && diagnostic.code && (
          <Text dimColor> [{diagnostic.code}]</Text>
        )}
        {showDetails && diagnostic.source && (
          <Text dimColor> ({diagnostic.source})</Text>
        )}
      </Text>
    </Box>
  );
};

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
export const FileDiagnostics: React.FC<FileDiagnosticsProps> = ({
  file,
  showDetails = true,
  cwd,
}) => {
  const relativePath = getRelativePathFromUri(file.uri, cwd);
  const uriType = getUriTypeDescription(file.uri);

  return (
    <Box flexDirection="column">
      {/* File header */}
      <Box flexDirection="row">
        <Text dimColor wrap="wrap">
          <Text bold>{relativePath}</Text>
          {' '}
          <Text dimColor>{uriType}</Text>
          {':'}
        </Text>
      </Box>

      {/* Diagnostics for this file */}
      {file.diagnostics.map((diagnostic, index) => (
        <DiagnosticEntry
          key={index}
          diagnostic={diagnostic}
          showDetails={showDetails}
        />
      ))}
    </Box>
  );
};

// ============================================================================
// Summary Components
// ============================================================================

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
export const DiagnosticsSummary: React.FC<DiagnosticsSummaryProps> = ({
  totalIssues,
  fileCount,
}) => {
  const issueWord = totalIssues === 1 ? 'issue' : 'issues';
  const fileWord = fileCount === 1 ? 'file' : 'files';

  return (
    <Box flexDirection="row">
      <Text dimColor wrap="wrap">
        Found <Text bold>{totalIssues}</Text> new diagnostic {issueWord} in{' '}
        {fileCount} {fileWord} (ctrl-o to expand)
      </Text>
    </Box>
  );
};

/**
 * Props for detailed diagnostics summary
 */
interface DetailedSummaryProps {
  attachment: DiagnosticsAttachment;
}

/**
 * Calculates breakdown by severity
 */
function calculateSeverityBreakdown(
  attachment: DiagnosticsAttachment
): Record<DiagnosticSeverity, number> {
  const breakdown: Record<DiagnosticSeverity, number> = {
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
export const DetailedSummary: React.FC<DetailedSummaryProps> = ({
  attachment,
}) => {
  const breakdown = calculateSeverityBreakdown(attachment);
  const hasErrors = breakdown[1] > 0;
  const hasWarnings = breakdown[2] > 0;
  const hasInfo = breakdown[3] > 0;
  const hasHints = breakdown[4] > 0;

  const parts: React.ReactNode[] = [];

  if (hasErrors) {
    parts.push(
      <Text key="errors" color="red">
        {breakdown[1]} error{breakdown[1] !== 1 ? 's' : ''}
      </Text>
    );
  }
  if (hasWarnings) {
    parts.push(
      <Text key="warnings" color="yellow">
        {breakdown[2]} warning{breakdown[2] !== 1 ? 's' : ''}
      </Text>
    );
  }
  if (hasInfo) {
    parts.push(
      <Text key="info" color="cyan">
        {breakdown[3]} info
      </Text>
    );
  }
  if (hasHints) {
    parts.push(
      <Text key="hints" color="gray">
        {breakdown[4]} hint{breakdown[4] !== 1 ? 's' : ''}
      </Text>
    );
  }

  if (parts.length === 0) return null;

  return (
    <Box flexDirection="row" gap={1} marginTop={1}>
      <Text dimColor>Summary: </Text>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Text dimColor>, </Text>}
          {part}
        </React.Fragment>
      ))}
    </Box>
  );
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
export const Diagnostics: React.FC<DiagnosticsProps> = ({
  attachment,
  verbose = false,
}) => {
  // Don't render if no files with diagnostics
  if (attachment.files.length === 0) {
    return null;
  }

  // Calculate totals
  const totalIssues = attachment.files.reduce(
    (sum, file) => sum + file.diagnostics.length,
    0
  );
  const fileCount = attachment.files.length;

  // Verbose mode: show all details
  if (verbose) {
    return (
      <Box flexDirection="column">
        {attachment.files.map((file, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Box marginTop={1} />}
            <FileDiagnostics
              file={file}
              showDetails={true}
              cwd={process.cwd()}
            />
          </React.Fragment>
        ))}
        <DetailedSummary attachment={attachment} />
      </Box>
    );
  }

  // Compact mode: just show summary
  return <DiagnosticsSummary totalIssues={totalIssues} fileCount={fileCount} />;
};

// ============================================================================
// Exports
// ============================================================================

export default Diagnostics;

// Export utility functions for use in other components
export {
  getSeveritySymbol as getSeveritySymbolUtil,
  getSeverityColor as getSeverityColorUtil,
  getSeverityName as getSeverityNameUtil,
};
