/**
 * IDE Lock File Management
 *
 * Handles reading, parsing, and cleaning of IDE lock files.
 * Lock files are used to track IDE instances and their connection information.
 */
import { createConnection } from 'node:net';
import { join, resolve, sep } from 'node:path';
import { WslPathConverter, getWindowsUserProfile } from './wsl.js';
import { isProcessRunning } from './detector.js';
// Default filesystem implementation using Node.js fs
let fs = null;
/**
 * Gets the filesystem instance.
 * This function should be called lazily to allow for proper initialization.
 */
function getFs() {
    if (!fs) {
        // Dynamic import to avoid initialization issues
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeFs = require('node:fs');
        fs = nodeFs;
    }
    return fs;
}
/**
 * Sets a custom filesystem implementation (for testing).
 *
 * @param filesystem - The filesystem implementation to use
 */
export function setFileSystem(filesystem) {
    fs = filesystem;
}
/**
 * Gets the directory path where Claude stores data.
 *
 * @returns The Claude data directory path
 */
function getClaudeDataDir() {
    const homeDir = process.env.HOME ||
        process.env.USERPROFILE ||
        (process.platform === 'win32' ? 'C:\\Users\\Default' : '/home');
    return join(homeDir, '.claude');
}
/**
 * Gets the current platform.
 *
 * @returns The current platform identifier
 */
function getPlatform() {
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
 * Gets all directories where lock files may be stored.
 *
 * On WSL, this includes both the Linux home directory and
 * the Windows user profile directory.
 *
 * @returns Array of directory paths to search for lock files
 */
export function getLockFileDirectories() {
    const directories = [];
    const filesystem = getFs();
    const platform = getPlatform();
    // Primary location: ~/.claude/ide
    const primaryDir = join(getClaudeDataDir(), 'ide');
    if (filesystem.existsSync(primaryDir)) {
        directories.push(primaryDir);
    }
    // WSL: Also check Windows user profile directory
    if (platform === 'wsl') {
        const windowsProfile = getWindowsUserProfile();
        if (windowsProfile) {
            const converter = new WslPathConverter(process.env.WSL_DISTRO_NAME);
            const linuxPath = converter.toLocalPath(windowsProfile);
            if (linuxPath) {
                const windowsClaudeDir = resolve(linuxPath, '.claude', 'ide');
                if (filesystem.existsSync(windowsClaudeDir)) {
                    directories.push(windowsClaudeDir);
                }
            }
        }
        // Also check common Windows user directories
        try {
            if (filesystem.existsSync('/mnt/c/Users')) {
                const users = filesystem.readdirSync('/mnt/c/Users', {
                    withFileTypes: true,
                });
                for (const user of users) {
                    // Skip system directories
                    if (user.name === 'Public' ||
                        user.name === 'Default' ||
                        user.name === 'Default User' ||
                        user.name === 'All Users') {
                        continue;
                    }
                    const userClaudeDir = join('/mnt/c/Users', user.name, '.claude', 'ide');
                    if (filesystem.existsSync(userClaudeDir)) {
                        directories.push(userClaudeDir);
                    }
                }
            }
        }
        catch {
            // Ignore errors reading Windows directories
        }
    }
    return directories;
}
/**
 * Gets all IDE lock files, sorted by modification time (newest first).
 *
 * @returns Array of lock file info objects
 *
 * @example
 * ```typescript
 * const lockFiles = getIdeLockFiles();
 * // Returns: [{ path: '/home/user/.claude/ide/3000.lock', mtime: Date }]
 * ```
 */
export function getIdeLockFiles() {
    const filesystem = getFs();
    try {
        const lockFiles = [];
        const directories = getLockFileDirectories();
        for (const dir of directories) {
            try {
                const entries = filesystem.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.endsWith('.lock')) {
                        const filePath = join(dir, entry.name);
                        try {
                            const stats = filesystem.statSync(filePath);
                            lockFiles.push({
                                path: filePath,
                                mtime: stats.mtime,
                            });
                        }
                        catch {
                            // Skip files we can't stat
                        }
                    }
                }
            }
            catch {
                // Skip directories we can't read
            }
        }
        // Sort by modification time, newest first
        lockFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        return lockFiles.map((info) => info);
    }
    catch {
        return [];
    }
}
/**
 * Parses an IDE lock file and extracts connection information.
 *
 * Lock files can be in two formats:
 * 1. JSON format with full connection details
 * 2. Simple text format with workspace folders (one per line)
 *
 * @param lockFilePath - Path to the lock file
 * @returns Parsed lock file data or null if parsing fails
 *
 * @example
 * ```typescript
 * const info = parseLockFile('/home/user/.claude/ide/3000.lock');
 * // Returns: { port: 3000, workspaceFolders: [...], ... }
 * ```
 */
export function parseLockFile(lockFilePath) {
    const filesystem = getFs();
    try {
        const content = filesystem.readFileSync(lockFilePath, { encoding: 'utf-8' });
        let workspaceFolders = [];
        let pid;
        let ideName;
        let useWebSocket = false;
        let runningInWindows = false;
        let authToken;
        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(content);
            if (parsed.workspaceFolders) {
                workspaceFolders = parsed.workspaceFolders;
            }
            pid = parsed.pid;
            ideName = parsed.ideName;
            useWebSocket = parsed.transport === 'ws';
            runningInWindows = parsed.runningInWindows === true;
            authToken = parsed.authToken;
        }
        catch {
            // Fall back to line-by-line parsing
            workspaceFolders = content
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
        }
        // Extract port from filename (e.g., "3000.lock" -> 3000)
        const filename = lockFilePath.split(sep).pop();
        if (!filename) {
            return null;
        }
        const portStr = filename.replace('.lock', '');
        const port = parseInt(portStr, 10);
        if (isNaN(port)) {
            return null;
        }
        return {
            workspaceFolders,
            port,
            pid,
            ideName,
            useWebSocket,
            runningInWindows,
            authToken,
        };
    }
    catch {
        return null;
    }
}
/**
 * Tests if a TCP connection can be established to a given host and port.
 *
 * @param host - The host address
 * @param port - The port number
 * @param timeoutMs - Connection timeout in milliseconds (default: 500ms)
 * @returns Promise resolving to true if connection succeeds
 *
 * @example
 * ```typescript
 * const isAlive = await testConnection('127.0.0.1', 3000);
 * // Returns: true if connection succeeds
 * ```
 */
export async function testConnection(host, port, timeoutMs = 500) {
    return new Promise((resolve) => {
        try {
            const socket = createConnection({
                host,
                port,
                timeout: timeoutMs,
            });
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            socket.on('error', () => {
                resolve(false);
            });
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
        }
        catch {
            resolve(false);
        }
    });
}
/**
 * Gets the host address for connecting to an IDE.
 *
 * In WSL environments connecting to Windows IDEs, this returns
 * the WSL host IP address. Otherwise returns localhost.
 *
 * @param runningInWindows - Whether the IDE is running in Windows
 * @param port - The port to connect to (for testing connectivity)
 * @returns Promise resolving to the host address
 */
export async function getIdeHost(runningInWindows, port) {
    // Allow override via environment variable
    const hostOverride = process.env.CLAUDE_CODE_IDE_HOST_OVERRIDE;
    if (hostOverride) {
        return hostOverride;
    }
    const platform = getPlatform();
    // Only need special handling for WSL connecting to Windows
    if (platform !== 'wsl' || !runningInWindows) {
        return '127.0.0.1';
    }
    // In WSL2, try to get the Windows host IP from the default route
    try {
        const { execSync } = require('node:child_process');
        const routeOutput = execSync('ip route show | grep -i default', {
            encoding: 'utf8',
        });
        const match = routeOutput.match(/default via (\d+\.\d+\.\d+\.\d+)/);
        if (match) {
            const hostIp = match[1];
            // Test if we can connect to this IP
            if (await testConnection(hostIp, port)) {
                return hostIp;
            }
        }
    }
    catch {
        // Fall through to default
    }
    return '127.0.0.1';
}
/**
 * Cleans up stale lock files for IDEs that are no longer running.
 *
 * A lock file is considered stale if:
 * - It cannot be parsed
 * - The IDE process is no longer running
 * - The connection cannot be established
 *
 * @returns Promise that resolves when cleanup is complete
 *
 * @example
 * ```typescript
 * await cleanStaleLockFiles();
 * // Removes lock files for dead IDE instances
 * ```
 */
export async function cleanStaleLockFiles() {
    const filesystem = getFs();
    const platform = getPlatform();
    try {
        const lockFiles = getIdeLockFiles();
        for (const lockFileInfo of lockFiles) {
            const parsed = parseLockFile(lockFileInfo.path);
            // Remove unparseable lock files
            if (!parsed) {
                try {
                    filesystem.unlinkSync(lockFileInfo.path);
                }
                catch {
                    // Ignore deletion errors
                }
                continue;
            }
            const host = await getIdeHost(parsed.runningInWindows, parsed.port);
            let isStale = false;
            if (parsed.pid) {
                // Check if process is running
                if (!isProcessRunning(parsed.pid)) {
                    // On non-WSL platforms, process not running means stale
                    if (platform !== 'wsl') {
                        isStale = true;
                    }
                    else {
                        // On WSL, also check connection (process might be in Windows)
                        if (!(await testConnection(host, parsed.port))) {
                            isStale = true;
                        }
                    }
                }
            }
            else {
                // No PID, check connection directly
                if (!(await testConnection(host, parsed.port))) {
                    isStale = true;
                }
            }
            // Remove stale lock files
            if (isStale) {
                try {
                    filesystem.unlinkSync(lockFileInfo.path);
                }
                catch {
                    // Ignore deletion errors
                }
            }
        }
    }
    catch {
        // Ignore errors during cleanup
    }
}
//# sourceMappingURL=lock-files.js.map