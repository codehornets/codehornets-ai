/**
 * IDE Diagnostics Manager
 *
 * Singleton class for tracking and managing IDE diagnostics.
 * Maintains baseline diagnostics for files to detect new issues
 * introduced by code changes.
 */
import type { ConnectedMcpClient, Diagnostic, DiagnosticSeverity, FileDiagnostics, ConnectionState } from './types.js';
/**
 * Error class for diagnostics-related errors.
 */
export declare class DiagnosticsError extends Error {
    constructor(message: string);
}
/**
 * Interface for MCP request function.
 */
type McpRequestFn = (method: string, params: Record<string, unknown>, client: ConnectedMcpClient) => Promise<unknown>;
/**
 * Diagnostics Manager - Singleton for tracking IDE diagnostics.
 *
 * This class maintains a baseline of diagnostics for each file,
 * allowing detection of new issues introduced by code changes.
 *
 * @example
 * ```typescript
 * const manager = DiagnosticsManager.getInstance();
 * manager.initialize(mcpClient);
 *
 * // Before editing a file
 * await manager.beforeFileEdited('/path/to/file.ts');
 *
 * // After editing, get new diagnostics
 * const newDiagnostics = await manager.getNewDiagnostics();
 * ```
 */
export declare class DiagnosticsManager {
    private static instance;
    /** Baseline diagnostics for each file */
    private baseline;
    /** Whether the manager has been initialized */
    private initialized;
    /** The connected MCP client */
    private mcpClient?;
    /** Timestamps of last processed diagnostics per file */
    private lastProcessedTimestamps;
    /** State of right-side diff view diagnostics */
    private rightFileDiagnosticsState;
    /** Function to make MCP requests (injectable for testing) */
    private mcpRequest?;
    /**
     * Private constructor for singleton pattern.
     */
    private constructor();
    /**
     * Gets the singleton instance of DiagnosticsManager.
     *
     * @returns The DiagnosticsManager instance
     */
    static getInstance(): DiagnosticsManager;
    /**
     * Initializes the diagnostics manager with an MCP client.
     *
     * @param client - The connected MCP client
     * @param mcpRequestFn - Optional function for making MCP requests
     */
    initialize(client: ConnectedMcpClient, mcpRequestFn?: McpRequestFn): void;
    /**
     * Shuts down the diagnostics manager and clears all state.
     */
    shutdown(): Promise<void>;
    /**
     * Resets the diagnostics baseline without shutting down.
     */
    reset(): void;
    /**
     * Checks if the manager is initialized.
     *
     * @returns True if initialized and connected
     */
    isInitialized(): boolean;
    /**
     * Normalizes a file URI by removing common prefixes.
     *
     * @param uri - The URI to normalize
     * @returns The normalized file path
     */
    normalizeFileUri(uri: string): string;
    /**
     * Ensures a file is opened in the IDE.
     *
     * @param filePath - The file path to open
     */
    ensureFileOpened(filePath: string): Promise<void>;
    /**
     * Records the baseline diagnostics for a file before editing.
     *
     * Should be called before making changes to a file to establish
     * the baseline for detecting new diagnostics.
     *
     * @param filePath - The file path to record baseline for
     */
    beforeFileEdited(filePath: string): Promise<void>;
    /**
     * Gets new diagnostics that weren't in the baseline.
     *
     * Compares current diagnostics against the baseline and returns
     * only the new ones.
     *
     * @returns Promise resolving to array of files with new diagnostics
     */
    getNewDiagnostics(): Promise<FileDiagnostics[]>;
    /**
     * Parses the result from a getDiagnostics MCP call.
     *
     * @param result - The raw result from the MCP call
     * @returns Array of file diagnostics
     */
    private parseDiagnosticResult;
    /**
     * Compares two diagnostics for equality.
     *
     * @param a - First diagnostic
     * @param b - Second diagnostic
     * @returns True if diagnostics are equal
     */
    private areDiagnosticsEqual;
    /**
     * Compares two arrays of diagnostics for equality.
     *
     * @param a - First array
     * @param b - Second array
     * @returns True if arrays contain the same diagnostics
     */
    private areDiagnosticArraysEqual;
    /**
     * Checks if a diagnostic is from a linter.
     *
     * @param diagnostic - The diagnostic to check
     * @returns True if the diagnostic is from a known linter
     */
    isLinterDiagnostic(diagnostic: Diagnostic): boolean;
    /**
     * Handles the start of a new query/conversation.
     *
     * Initializes or resets the manager based on connection state.
     *
     * @param connectionStates - Current connection states
     */
    handleQueryStart(connectionStates: ConnectionState[]): Promise<void>;
    /**
     * Formats diagnostics as a human-readable summary.
     *
     * @param diagnostics - Array of file diagnostics to format
     * @returns Formatted string summary
     *
     * @example
     * ```typescript
     * const summary = DiagnosticsManager.formatDiagnosticsSummary(diagnostics);
     * // Returns:
     * // file.ts:
     * //   x [Line 10:5] Missing semicolon [typescript]
     * ```
     */
    static formatDiagnosticsSummary(diagnostics: FileDiagnostics[]): string;
    /**
     * Gets the symbol for a diagnostic severity level.
     *
     * @param severity - The severity level
     * @returns The corresponding symbol
     */
    static getSeveritySymbol(severity: DiagnosticSeverity): string;
}
/**
 * Global instance of the diagnostics manager.
 */
export declare const diagnosticsManager: DiagnosticsManager;
export {};
//# sourceMappingURL=diagnostics.d.ts.map