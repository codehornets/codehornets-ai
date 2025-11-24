/**
 * IDE Diagnostics Manager
 *
 * Singleton class for tracking and managing IDE diagnostics.
 * Maintains baseline diagnostics for files to detect new issues
 * introduced by code changes.
 */

import type {
  ConnectedMcpClient,
  Diagnostic,
  DiagnosticSeverity,
  FileDiagnostics,
  ConnectionState,
} from './types.js';

/**
 * Error class for diagnostics-related errors.
 */
export class DiagnosticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiagnosticsError';
  }
}

/**
 * Common linter source identifiers for filtering diagnostics.
 */
const LINTER_SOURCES = [
  'eslint',
  'eslint-plugin',
  'tslint',
  'prettier',
  'stylelint',
  'jshint',
  'standardjs',
  'xo',
  'rome',
  'biome',
  'deno-lint',
  'rubocop',
  'pylint',
  'flake8',
  'black',
  'ruff',
  'clippy',
  'rustfmt',
  'golangci-lint',
  'gofmt',
  'swiftlint',
  'detekt',
  'ktlint',
  'checkstyle',
  'pmd',
  'sonarqube',
  'sonarjs',
];

/**
 * Severity symbols for formatting diagnostics.
 */
const SEVERITY_SYMBOLS: Record<DiagnosticSeverity, string> = {
  Error: 'x',
  Warning: '!',
  Info: 'i',
  Hint: '*',
};

/**
 * Interface for MCP request function.
 */
type McpRequestFn = (
  method: string,
  params: Record<string, unknown>,
  client: ConnectedMcpClient
) => Promise<unknown>;

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
export class DiagnosticsManager {
  private static instance: DiagnosticsManager;

  /** Baseline diagnostics for each file */
  private baseline: Map<string, Diagnostic[]> = new Map();

  /** Whether the manager has been initialized */
  private initialized = false;

  /** The connected MCP client */
  private mcpClient?: ConnectedMcpClient;

  /** Timestamps of last processed diagnostics per file */
  private lastProcessedTimestamps: Map<string, number> = new Map();

  /** State of right-side diff view diagnostics */
  private rightFileDiagnosticsState: Map<string, Diagnostic[]> = new Map();

  /** Function to make MCP requests (injectable for testing) */
  private mcpRequest?: McpRequestFn;

  /**
   * Private constructor for singleton pattern.
   */
  private constructor() {}

  /**
   * Gets the singleton instance of DiagnosticsManager.
   *
   * @returns The DiagnosticsManager instance
   */
  public static getInstance(): DiagnosticsManager {
    if (!DiagnosticsManager.instance) {
      DiagnosticsManager.instance = new DiagnosticsManager();
    }
    return DiagnosticsManager.instance;
  }

  /**
   * Initializes the diagnostics manager with an MCP client.
   *
   * @param client - The connected MCP client
   * @param mcpRequestFn - Optional function for making MCP requests
   */
  public initialize(
    client: ConnectedMcpClient,
    mcpRequestFn?: McpRequestFn
  ): void {
    if (this.initialized) {
      return;
    }
    this.mcpClient = client;
    this.mcpRequest = mcpRequestFn;
    this.initialized = true;
  }

  /**
   * Shuts down the diagnostics manager and clears all state.
   */
  public async shutdown(): Promise<void> {
    this.initialized = false;
    this.baseline.clear();
    this.lastProcessedTimestamps.clear();
    this.rightFileDiagnosticsState.clear();
    this.mcpClient = undefined;
  }

  /**
   * Resets the diagnostics baseline without shutting down.
   */
  public reset(): void {
    this.baseline.clear();
    this.rightFileDiagnosticsState.clear();
  }

  /**
   * Checks if the manager is initialized.
   *
   * @returns True if initialized and connected
   */
  public isInitialized(): boolean {
    return (
      this.initialized &&
      this.mcpClient !== undefined &&
      this.mcpClient.type === 'connected'
    );
  }

  /**
   * Normalizes a file URI by removing common prefixes.
   *
   * @param uri - The URI to normalize
   * @returns The normalized file path
   */
  public normalizeFileUri(uri: string): string {
    const prefixes = ['file://', '_claude_fs_right:', '_claude_fs_left:'];
    for (const prefix of prefixes) {
      if (uri.startsWith(prefix)) {
        return uri.slice(prefix.length);
      }
    }
    return uri;
  }

  /**
   * Ensures a file is opened in the IDE.
   *
   * @param filePath - The file path to open
   */
  public async ensureFileOpened(filePath: string): Promise<void> {
    if (!this.isInitialized() || !this.mcpRequest) {
      return;
    }

    try {
      await this.mcpRequest(
        'openFile',
        {
          filePath,
          preview: false,
          startText: '',
          endText: '',
          selectToEndOfLine: false,
          makeFrontmost: false,
        },
        this.mcpClient!
      );
    } catch {
      // Ignore errors opening file
    }
  }

  /**
   * Records the baseline diagnostics for a file before editing.
   *
   * Should be called before making changes to a file to establish
   * the baseline for detecting new diagnostics.
   *
   * @param filePath - The file path to record baseline for
   */
  public async beforeFileEdited(filePath: string): Promise<void> {
    if (!this.isInitialized() || !this.mcpRequest) {
      return;
    }

    const timestamp = Date.now();

    try {
      const result = await this.mcpRequest(
        'getDiagnostics',
        { uri: `file://${filePath}` },
        this.mcpClient!
      );

      const diagnostics = this.parseDiagnosticResult(result)[0];

      if (diagnostics) {
        if (filePath !== this.normalizeFileUri(diagnostics.uri)) {
          throw new DiagnosticsError(
            `Diagnostics file path mismatch: expected ${filePath}, got ${diagnostics.uri}`
          );
        }
        this.baseline.set(filePath, diagnostics.diagnostics);
        this.lastProcessedTimestamps.set(filePath, timestamp);
      } else {
        this.baseline.set(filePath, []);
        this.lastProcessedTimestamps.set(filePath, timestamp);
      }
    } catch {
      // Silently ignore errors getting diagnostics
    }
  }

  /**
   * Gets new diagnostics that weren't in the baseline.
   *
   * Compares current diagnostics against the baseline and returns
   * only the new ones.
   *
   * @returns Promise resolving to array of files with new diagnostics
   */
  public async getNewDiagnostics(): Promise<FileDiagnostics[]> {
    if (!this.isInitialized() || !this.mcpRequest) {
      return [];
    }

    let allDiagnostics: FileDiagnostics[] = [];

    try {
      const result = await this.mcpRequest(
        'getDiagnostics',
        {},
        this.mcpClient!
      );
      allDiagnostics = this.parseDiagnosticResult(result);
    } catch {
      return [];
    }

    // Filter to files we have baselines for, using file:// URIs
    const fileDiagnostics = allDiagnostics
      .filter((d) => this.baseline.has(this.normalizeFileUri(d.uri)))
      .filter((d) => d.uri.startsWith('file://'));

    // Build map of right-side diff view diagnostics
    const rightFileMap = new Map<string, FileDiagnostics>();
    allDiagnostics
      .filter((d) => this.baseline.has(this.normalizeFileUri(d.uri)))
      .filter((d) => d.uri.startsWith('_claude_fs_right:'))
      .forEach((d) => {
        rightFileMap.set(this.normalizeFileUri(d.uri), d);
      });

    const newDiagnostics: FileDiagnostics[] = [];

    for (const fileDiag of fileDiagnostics) {
      const normalizedUri = this.normalizeFileUri(fileDiag.uri);
      const baseline = this.baseline.get(normalizedUri) ?? [];

      // Check for right-side diff view diagnostics
      const rightFileDiag = rightFileMap.get(normalizedUri);
      let currentDiag = fileDiag;

      if (rightFileDiag) {
        // Use right-side diagnostics if they've changed
        const previousRight = this.rightFileDiagnosticsState.get(normalizedUri);
        if (
          !previousRight ||
          !this.areDiagnosticArraysEqual(previousRight, rightFileDiag.diagnostics)
        ) {
          currentDiag = rightFileDiag;
        }
        this.rightFileDiagnosticsState.set(
          normalizedUri,
          rightFileDiag.diagnostics
        );
      }

      // Find diagnostics not in the baseline
      const newItems = currentDiag.diagnostics.filter(
        (d) => !baseline.some((b) => this.areDiagnosticsEqual(d, b))
      );

      if (newItems.length > 0) {
        newDiagnostics.push({
          uri: fileDiag.uri,
          diagnostics: newItems,
        });
      }

      // Update baseline with current diagnostics
      this.baseline.set(normalizedUri, currentDiag.diagnostics);
    }

    return newDiagnostics;
  }

  /**
   * Parses the result from a getDiagnostics MCP call.
   *
   * @param result - The raw result from the MCP call
   * @returns Array of file diagnostics
   */
  private parseDiagnosticResult(result: unknown): FileDiagnostics[] {
    if (Array.isArray(result)) {
      const textContent = result.find(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          'type' in item &&
          (item as { type: string }).type === 'text'
      ) as { text: string } | undefined;

      if (textContent && 'text' in textContent) {
        return JSON.parse(textContent.text);
      }
    }
    return [];
  }

  /**
   * Compares two diagnostics for equality.
   *
   * @param a - First diagnostic
   * @param b - Second diagnostic
   * @returns True if diagnostics are equal
   */
  private areDiagnosticsEqual(a: Diagnostic, b: Diagnostic): boolean {
    return (
      a.message === b.message &&
      a.severity === b.severity &&
      a.source === b.source &&
      a.code === b.code &&
      a.range.start.line === b.range.start.line &&
      a.range.start.character === b.range.start.character &&
      a.range.end.line === b.range.end.line &&
      a.range.end.character === b.range.end.character
    );
  }

  /**
   * Compares two arrays of diagnostics for equality.
   *
   * @param a - First array
   * @param b - Second array
   * @returns True if arrays contain the same diagnostics
   */
  private areDiagnosticArraysEqual(a: Diagnostic[], b: Diagnostic[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return (
      a.every((diagA) => b.some((diagB) => this.areDiagnosticsEqual(diagA, diagB))) &&
      b.every((diagB) => a.some((diagA) => this.areDiagnosticsEqual(diagA, diagB)))
    );
  }

  /**
   * Checks if a diagnostic is from a linter.
   *
   * @param diagnostic - The diagnostic to check
   * @returns True if the diagnostic is from a known linter
   */
  public isLinterDiagnostic(diagnostic: Diagnostic): boolean {
    if (!diagnostic.source) {
      return false;
    }
    const source = diagnostic.source.toLowerCase();
    return LINTER_SOURCES.some((linter) => source.includes(linter));
  }

  /**
   * Handles the start of a new query/conversation.
   *
   * Initializes or resets the manager based on connection state.
   *
   * @param connectionStates - Current connection states
   */
  public async handleQueryStart(
    connectionStates: ConnectionState[]
  ): Promise<void> {
    if (!this.initialized) {
      const ideConnection = connectionStates.find(
        (state) => state.type === 'connected' && state.name === 'ide'
      );
      if (ideConnection) {
        // Type assertion needed since we're finding from ConnectionState[]
        // In real usage, the client would be passed properly
        // This is a simplified version for the refactor
      }
    } else {
      this.reset();
    }
  }

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
  public static formatDiagnosticsSummary(
    diagnostics: FileDiagnostics[]
  ): string {
    return diagnostics
      .map((file) => {
        const filename = file.uri.split('/').pop() ?? file.uri;
        const items = file.diagnostics
          .map((d) => {
            const symbol = DiagnosticsManager.getSeveritySymbol(d.severity);
            const location = `[Line ${d.range.start.line + 1}:${d.range.start.character + 1}]`;
            const code = d.code ? ` [${d.code}]` : '';
            const source = d.source ? ` (${d.source})` : '';
            return `  ${symbol} ${location} ${d.message}${code}${source}`;
          })
          .join('\n');
        return `${filename}:\n${items}`;
      })
      .join('\n\n');
  }

  /**
   * Gets the symbol for a diagnostic severity level.
   *
   * @param severity - The severity level
   * @returns The corresponding symbol
   */
  public static getSeveritySymbol(severity: DiagnosticSeverity): string {
    return SEVERITY_SYMBOLS[severity] ?? '-';
  }
}

/**
 * Global instance of the diagnostics manager.
 */
export const diagnosticsManager = DiagnosticsManager.getInstance();
