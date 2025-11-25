/**
 * IDE Detection Module
 *
 * Detects running IDEs by scanning system processes.
 * Supports VS Code variants (VS Code, Cursor, Windsurf) and JetBrains IDEs.
 */
import type { IdeConfig, IdeConfigMap, IdeType, Platform } from './types.js';
/**
 * Configuration map for all supported IDEs.
 *
 * Contains process keywords used to detect each IDE on different platforms.
 */
export declare const IDE_CONFIGS: IdeConfigMap;
/**
 * Gets the current platform.
 *
 * @returns The current platform identifier
 */
export declare function getPlatform(): Platform;
/**
 * Checks if the given IDE type is a VS Code variant.
 *
 * @param ideType - The IDE type to check
 * @returns True if the IDE is VS Code, Cursor, or Windsurf
 *
 * @example
 * ```typescript
 * isVsCodeIde('vscode'); // true
 * isVsCodeIde('cursor'); // true
 * isVsCodeIde('intellij'); // false
 * ```
 */
export declare function isVsCodeIde(ideType: IdeType | string | null): boolean;
/**
 * Checks if the given IDE type is a JetBrains IDE.
 *
 * @param ideType - The IDE type to check
 * @returns True if the IDE is a JetBrains product
 *
 * @example
 * ```typescript
 * isJetBrainsIde('intellij'); // true
 * isJetBrainsIde('pycharm'); // true
 * isJetBrainsIde('vscode'); // false
 * ```
 */
export declare function isJetBrainsIde(ideType: IdeType | string | null): boolean;
/**
 * Gets the display name for an IDE type.
 *
 * @param ideType - The IDE type identifier
 * @returns Human-readable display name
 *
 * @example
 * ```typescript
 * getIdeDisplayName('vscode'); // 'VS Code'
 * getIdeDisplayName('intellij'); // 'IntelliJ IDEA'
 * getIdeDisplayName('unknown'); // 'Unknown'
 * ```
 */
export declare function getIdeDisplayName(ideType: IdeType | string | null): string;
/**
 * Gets the IDE configuration for a given type.
 *
 * @param ideType - The IDE type identifier
 * @returns The IDE configuration or undefined if not found
 */
export declare function getIdeConfig(ideType: IdeType | string): IdeConfig | undefined;
/**
 * Detects running IDEs by scanning system processes.
 *
 * Scans process lists using platform-specific commands and matches
 * against known IDE process keywords.
 *
 * @returns Array of detected IDE types currently running
 *
 * @example
 * ```typescript
 * const runningIdes = detectRunningIdes();
 * // Returns: ['vscode', 'cursor'] if both are running
 * ```
 */
export declare function detectRunningIdes(): IdeType[];
/**
 * Checks if a process with the given PID is running.
 *
 * @param pid - The process ID to check
 * @returns True if the process is running
 *
 * @example
 * ```typescript
 * isProcessRunning(1234); // true or false
 * ```
 */
export declare function isProcessRunning(pid: number): boolean;
/**
 * Checks if a process is an ancestor of the current process.
 *
 * Walks up the process tree to determine if the given PID is
 * in the parent chain of the current process.
 *
 * @param pid - The process ID to check
 * @returns True if the PID is an ancestor process
 */
export declare function isAncestorProcess(pid: number): boolean;
/**
 * Checks if the CLI is running from within an IDE terminal.
 *
 * Examines the terminal type and environment variables to determine
 * if the process was launched from an IDE's integrated terminal.
 *
 * @param terminalType - The terminal type identifier
 * @returns True if running in an IDE terminal
 */
export declare function isRunningInIdeTerminal(terminalType?: string | null): boolean;
/**
 * Gets the terminal type from environment if running in an IDE.
 *
 * @returns The IDE type identifier or null if not in an IDE terminal
 */
export declare function getIdeTerminalType(): IdeType | null;
//# sourceMappingURL=detector.d.ts.map