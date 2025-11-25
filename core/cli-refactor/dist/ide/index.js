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
// IDE Detection
export { IDE_CONFIGS, getPlatform, isVsCodeIde, isJetBrainsIde, getIdeDisplayName, getIdeConfig, detectRunningIdes, isProcessRunning, isAncestorProcess, isRunningInIdeTerminal, getIdeTerminalType, } from './detector.js';
// WSL Utilities
export { WslPathConverter, isPathForDistro, getWindowsUserProfile, getWslHostIp, } from './wsl.js';
// Lock File Management
export { setFileSystem, getLockFileDirectories, getIdeLockFiles, parseLockFile, testConnection, getIdeHost, cleanStaleLockFiles, } from './lock-files.js';
// Connection Management
export { getIdeConnections, waitForIdeConnection, cancelConnectionWait, notifyIdeConnected, hasIdeConnection, findIdeConnection, getIdeNameFromConnection, getIdeNameFromConnections, } from './connections.js';
// Extension Installation
export { VSCODE_EXTENSION_ID, getClaudeCodeVersion, findVsCodeCli, getInstalledVsCodeExtensionVersion, isExtensionInstalled, installIdeExtension, isVsCodeCliAvailable, isCursorCliAvailable, isWindsurfCliAvailable, } from './extensions.js';
// Diagnostics Management
export { DiagnosticsError, DiagnosticsManager, diagnosticsManager, } from './diagnostics.js';
//# sourceMappingURL=index.js.map