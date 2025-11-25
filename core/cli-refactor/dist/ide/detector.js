/**
 * IDE Detection Module
 *
 * Detects running IDEs by scanning system processes.
 * Supports VS Code variants (VS Code, Cursor, Windsurf) and JetBrains IDEs.
 */
import { execSync } from 'node:child_process';
/**
 * Configuration map for all supported IDEs.
 *
 * Contains process keywords used to detect each IDE on different platforms.
 */
export const IDE_CONFIGS = {
    cursor: {
        ideKind: 'vscode',
        displayName: 'Cursor',
        processKeywordsMac: ['Cursor Helper', 'Cursor.app'],
        processKeywordsWindows: ['cursor.exe'],
        processKeywordsLinux: ['cursor'],
    },
    windsurf: {
        ideKind: 'vscode',
        displayName: 'Windsurf',
        processKeywordsMac: ['Windsurf Helper', 'Windsurf.app'],
        processKeywordsWindows: ['windsurf.exe'],
        processKeywordsLinux: ['windsurf'],
    },
    vscode: {
        ideKind: 'vscode',
        displayName: 'VS Code',
        processKeywordsMac: ['Visual Studio Code', 'Code Helper'],
        processKeywordsWindows: ['code.exe'],
        processKeywordsLinux: ['code'],
    },
    intellij: {
        ideKind: 'jetbrains',
        displayName: 'IntelliJ IDEA',
        processKeywordsMac: ['IntelliJ IDEA'],
        processKeywordsWindows: ['idea64.exe'],
        processKeywordsLinux: ['idea', 'intellij'],
    },
    pycharm: {
        ideKind: 'jetbrains',
        displayName: 'PyCharm',
        processKeywordsMac: ['PyCharm'],
        processKeywordsWindows: ['pycharm64.exe'],
        processKeywordsLinux: ['pycharm'],
    },
    webstorm: {
        ideKind: 'jetbrains',
        displayName: 'WebStorm',
        processKeywordsMac: ['WebStorm'],
        processKeywordsWindows: ['webstorm64.exe'],
        processKeywordsLinux: ['webstorm'],
    },
    phpstorm: {
        ideKind: 'jetbrains',
        displayName: 'PhpStorm',
        processKeywordsMac: ['PhpStorm'],
        processKeywordsWindows: ['phpstorm64.exe'],
        processKeywordsLinux: ['phpstorm'],
    },
    rubymine: {
        ideKind: 'jetbrains',
        displayName: 'RubyMine',
        processKeywordsMac: ['RubyMine'],
        processKeywordsWindows: ['rubymine64.exe'],
        processKeywordsLinux: ['rubymine'],
    },
    clion: {
        ideKind: 'jetbrains',
        displayName: 'CLion',
        processKeywordsMac: ['CLion'],
        processKeywordsWindows: ['clion64.exe'],
        processKeywordsLinux: ['clion'],
    },
    goland: {
        ideKind: 'jetbrains',
        displayName: 'GoLand',
        processKeywordsMac: ['GoLand'],
        processKeywordsWindows: ['goland64.exe'],
        processKeywordsLinux: ['goland'],
    },
    rider: {
        ideKind: 'jetbrains',
        displayName: 'Rider',
        processKeywordsMac: ['Rider'],
        processKeywordsWindows: ['rider64.exe'],
        processKeywordsLinux: ['rider'],
    },
    datagrip: {
        ideKind: 'jetbrains',
        displayName: 'DataGrip',
        processKeywordsMac: ['DataGrip'],
        processKeywordsWindows: ['datagrip64.exe'],
        processKeywordsLinux: ['datagrip'],
    },
    appcode: {
        ideKind: 'jetbrains',
        displayName: 'AppCode',
        processKeywordsMac: ['AppCode'],
        processKeywordsWindows: ['appcode.exe'],
        processKeywordsLinux: ['appcode'],
    },
    dataspell: {
        ideKind: 'jetbrains',
        displayName: 'DataSpell',
        processKeywordsMac: ['DataSpell'],
        processKeywordsWindows: ['dataspell64.exe'],
        processKeywordsLinux: ['dataspell'],
    },
    aqua: {
        ideKind: 'jetbrains',
        displayName: 'Aqua',
        processKeywordsMac: [],
        processKeywordsWindows: ['aqua64.exe'],
        processKeywordsLinux: [],
    },
    gateway: {
        ideKind: 'jetbrains',
        displayName: 'Gateway',
        processKeywordsMac: [],
        processKeywordsWindows: ['gateway64.exe'],
        processKeywordsLinux: [],
    },
    fleet: {
        ideKind: 'jetbrains',
        displayName: 'Fleet',
        processKeywordsMac: [],
        processKeywordsWindows: ['fleet.exe'],
        processKeywordsLinux: [],
    },
    androidstudio: {
        ideKind: 'jetbrains',
        displayName: 'Android Studio',
        processKeywordsMac: ['Android Studio'],
        processKeywordsWindows: ['studio64.exe'],
        processKeywordsLinux: ['android-studio'],
    },
};
/**
 * Executes a shell command and returns the output.
 *
 * @param command - The command to execute
 * @returns The command output or null if execution fails
 */
function executeCommand(command) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
        });
    }
    catch {
        return null;
    }
}
/**
 * Gets the current platform.
 *
 * @returns The current platform identifier
 */
export function getPlatform() {
    if (process.env.WSL_DISTRO_NAME) {
        return 'wsl';
    }
    switch (process.platform) {
        case 'darwin':
            return 'macos';
        case 'win32':
            return 'windows';
        default:
            return 'linux';
    }
}
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
export function isVsCodeIde(ideType) {
    if (!ideType) {
        return false;
    }
    const config = IDE_CONFIGS[ideType];
    return config?.ideKind === 'vscode';
}
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
export function isJetBrainsIde(ideType) {
    if (!ideType) {
        return false;
    }
    const config = IDE_CONFIGS[ideType];
    return config?.ideKind === 'jetbrains';
}
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
export function getIdeDisplayName(ideType) {
    if (!ideType) {
        return 'IDE';
    }
    const config = IDE_CONFIGS[ideType];
    if (config) {
        return config.displayName;
    }
    // Capitalize first letter of unknown IDE types
    return ideType.charAt(0).toUpperCase() + ideType.slice(1);
}
/**
 * Gets the IDE configuration for a given type.
 *
 * @param ideType - The IDE type identifier
 * @returns The IDE configuration or undefined if not found
 */
export function getIdeConfig(ideType) {
    return IDE_CONFIGS[ideType];
}
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
export function detectRunningIdes() {
    const detectedIdes = [];
    try {
        const platform = getPlatform();
        if (platform === 'macos') {
            // Use ps to list processes on macOS
            const processOutput = executeCommand('ps aux | grep -E "Visual Studio Code|Code Helper|Cursor Helper|Windsurf Helper|IntelliJ IDEA|PyCharm|WebStorm|PhpStorm|RubyMine|CLion|GoLand|Rider|DataGrip|AppCode|DataSpell|Aqua|Gateway|Fleet|Android Studio" | grep -v grep') ?? '';
            for (const [ideType, config] of Object.entries(IDE_CONFIGS)) {
                for (const keyword of config.processKeywordsMac) {
                    if (processOutput.includes(keyword)) {
                        detectedIdes.push(ideType);
                        break;
                    }
                }
            }
        }
        else if (platform === 'windows') {
            // Use tasklist on Windows
            const processOutput = (executeCommand('tasklist | findstr /I "Code.exe Cursor.exe Windsurf.exe idea64.exe pycharm64.exe webstorm64.exe phpstorm64.exe rubymine64.exe clion64.exe goland64.exe rider64.exe datagrip64.exe appcode.exe dataspell64.exe aqua64.exe gateway64.exe fleet.exe studio64.exe"') ?? '').toLowerCase();
            for (const [ideType, config] of Object.entries(IDE_CONFIGS)) {
                for (const keyword of config.processKeywordsWindows) {
                    if (processOutput.includes(keyword.toLowerCase())) {
                        detectedIdes.push(ideType);
                        break;
                    }
                }
            }
        }
        else if (platform === 'linux' || platform === 'wsl') {
            // Use ps on Linux/WSL
            const processOutput = (executeCommand('ps aux | grep -E "code|cursor|windsurf|idea|pycharm|webstorm|phpstorm|rubymine|clion|goland|rider|datagrip|dataspell|aqua|gateway|fleet|android-studio" | grep -v grep') ?? '').toLowerCase();
            for (const [ideType, config] of Object.entries(IDE_CONFIGS)) {
                for (const keyword of config.processKeywordsLinux) {
                    if (processOutput.includes(keyword)) {
                        // Special handling for VS Code on Linux to avoid false positives
                        if (ideType === 'vscode') {
                            // Make sure we're not detecting cursor or appcode as vscode
                            if (!processOutput.includes('cursor') &&
                                !processOutput.includes('appcode')) {
                                detectedIdes.push(ideType);
                            }
                        }
                        else {
                            detectedIdes.push(ideType);
                        }
                        break;
                    }
                }
            }
        }
    }
    catch {
        // Return empty array on error
    }
    return detectedIdes;
}
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
export function isProcessRunning(pid) {
    try {
        // Sending signal 0 checks if process exists without affecting it
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a process is an ancestor of the current process.
 *
 * Walks up the process tree to determine if the given PID is
 * in the parent chain of the current process.
 *
 * @param pid - The process ID to check
 * @returns True if the PID is an ancestor process
 */
export function isAncestorProcess(pid) {
    if (!isProcessRunning(pid)) {
        return false;
    }
    const platform = getPlatform();
    if (platform === 'windows') {
        return true; // Can't easily check on Windows
    }
    try {
        let currentPpid = process.ppid;
        // Walk up the process tree (max 10 levels to prevent infinite loops)
        for (let i = 0; i < 10; i++) {
            if (currentPpid === pid) {
                return true;
            }
            if (currentPpid === 0 || currentPpid === 1) {
                break;
            }
            // Get parent of current process
            const ppidOutput = executeCommand(`ps -o ppid= -p ${currentPpid}`);
            if (!ppidOutput) {
                break;
            }
            const nextPpid = parseInt(ppidOutput.trim(), 10);
            if (isNaN(nextPpid) || nextPpid === currentPpid) {
                break;
            }
            currentPpid = nextPpid;
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Checks if the CLI is running from within an IDE terminal.
 *
 * Examines the terminal type and environment variables to determine
 * if the process was launched from an IDE's integrated terminal.
 *
 * @param terminalType - The terminal type identifier
 * @returns True if running in an IDE terminal
 */
export function isRunningInIdeTerminal(terminalType) {
    const isVsCode = terminalType ? isVsCodeIde(terminalType) : false;
    const isJetBrains = terminalType ? isJetBrainsIde(terminalType) : false;
    const forceCodeTerminal = Boolean(process.env.FORCE_CODE_TERMINAL);
    return isVsCode || isJetBrains || forceCodeTerminal;
}
/**
 * Gets the terminal type from environment if running in an IDE.
 *
 * @returns The IDE type identifier or null if not in an IDE terminal
 */
export function getIdeTerminalType() {
    const platform = getPlatform();
    if (platform !== 'windows') {
        return null;
    }
    // Check TERM_PROGRAM environment variable
    const termProgram = process.env.TERM_PROGRAM;
    if (termProgram && termProgram in IDE_CONFIGS) {
        return termProgram;
    }
    return null;
}
//# sourceMappingURL=detector.js.map