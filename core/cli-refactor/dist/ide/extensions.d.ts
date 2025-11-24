/**
 * IDE Extension Installation
 *
 * Handles automatic installation and management of Claude Code extensions
 * for VS Code variants (VS Code, Cursor, Windsurf) and JetBrains IDEs.
 */
import type { ExtensionInstallResult, IdeType } from './types.js';
/**
 * The extension identifier for the Claude Code VS Code extension
 */
export declare const VSCODE_EXTENSION_ID = "anthropic.claude-code";
/**
 * Gets the current Claude Code version.
 *
 * @returns The version string
 */
export declare function getClaudeCodeVersion(): string;
/**
 * Finds the VS Code CLI executable path for the given IDE type.
 *
 * On macOS, attempts to detect the path from the parent process chain.
 *
 * @param ideType - The VS Code variant type
 * @returns The CLI executable path or null
 */
export declare function findVsCodeCli(ideType: IdeType): string | null;
/**
 * Gets the currently installed version of the Claude Code VS Code extension.
 *
 * @param cliPath - Path to the VS Code CLI
 * @returns Promise resolving to the version string or null
 */
export declare function getInstalledVsCodeExtensionVersion(cliPath: string): Promise<string | null>;
/**
 * Checks if the Claude Code extension is installed for the given IDE.
 *
 * @param ideType - The IDE type to check
 * @returns Promise resolving to true if installed
 *
 * @example
 * ```typescript
 * const isInstalled = await isExtensionInstalled('vscode');
 * // Returns: true if extension is installed
 * ```
 */
export declare function isExtensionInstalled(ideType: IdeType): Promise<boolean>;
/**
 * Installs the Claude Code extension for the given IDE.
 *
 * For VS Code variants, uses the CLI to install the extension.
 * For JetBrains IDEs, copies the plugin to the plugins directory.
 *
 * @param ideType - The IDE type to install for
 * @returns Promise resolving to installation result
 *
 * @example
 * ```typescript
 * const result = await installIdeExtension('vscode');
 * if (result.installed) {
 *   console.log('Installed version:', result.installedVersion);
 * }
 * ```
 */
export declare function installIdeExtension(ideType: IdeType): Promise<ExtensionInstallResult>;
/**
 * Checks if the VS Code CLI is available.
 *
 * @returns True if VS Code CLI is available
 */
export declare function isVsCodeCliAvailable(): boolean;
/**
 * Checks if the Cursor CLI is available.
 *
 * @returns True if Cursor CLI is available
 */
export declare function isCursorCliAvailable(): boolean;
/**
 * Checks if the Windsurf CLI is available.
 *
 * @returns True if Windsurf CLI is available
 */
export declare function isWindsurfCliAvailable(): boolean;
//# sourceMappingURL=extensions.d.ts.map