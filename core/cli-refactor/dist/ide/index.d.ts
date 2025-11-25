/**
 * IDE Integration Module
 *
 * Provides comprehensive IDE integration for Claude Code, including:
 * - Detection of running IDEs (VS Code, Cursor, Windsurf, JetBrains)
 * - Connection management via lock files
 * - Extension auto-installation
 * - WSL path conversion utilities
 * - Diagnostics tracking and management
 *
 * @module ide
 */
export type { IdeKind, IdeType, IdeConfig, IdeConfigMap, Platform, LockFileInfo, ParsedLockFile, IdeConnection, ExtensionInstallResult, DiagnosticSeverity, Position, DiagnosticRange, Diagnostic, FileDiagnostics, McpClientState, ConnectedMcpClient, ConnectionState, } from './types.js';
export { IDE_CONFIGS, getPlatform, isVsCodeIde, isJetBrainsIde, getIdeDisplayName, getIdeConfig, detectRunningIdes, isProcessRunning, isAncestorProcess, isRunningInIdeTerminal, getIdeTerminalType, } from './detector.js';
export { WslPathConverter, isPathForDistro, getWindowsUserProfile, getWslHostIp, } from './wsl.js';
export { type FileSystem, setFileSystem, getLockFileDirectories, getIdeLockFiles, parseLockFile, testConnection, getIdeHost, cleanStaleLockFiles, } from './lock-files.js';
export { getIdeConnections, waitForIdeConnection, cancelConnectionWait, notifyIdeConnected, hasIdeConnection, findIdeConnection, getIdeNameFromConnection, getIdeNameFromConnections, } from './connections.js';
export { VSCODE_EXTENSION_ID, getClaudeCodeVersion, findVsCodeCli, getInstalledVsCodeExtensionVersion, isExtensionInstalled, installIdeExtension, isVsCodeCliAvailable, isCursorCliAvailable, isWindsurfCliAvailable, } from './extensions.js';
export { DiagnosticsError, DiagnosticsManager, diagnosticsManager, } from './diagnostics.js';
//# sourceMappingURL=index.d.ts.map