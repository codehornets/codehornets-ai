/**
 * IDE Lock File Management
 *
 * Handles reading, parsing, and cleaning of IDE lock files.
 * Lock files are used to track IDE instances and their connection information.
 */
import type { LockFileInfo, ParsedLockFile } from './types.js';
/**
 * Interface for filesystem operations (for dependency injection and testing)
 */
export interface FileSystem {
    existsSync(path: string): boolean;
    readdirSync(path: string, options?: {
        withFileTypes: true;
    }): Array<{
        name: string;
        isFile(): boolean;
    }>;
    readFileSync(path: string, options: {
        encoding: string;
    }): string;
    statSync(path: string): {
        mtime: Date;
    };
    unlinkSync(path: string): void;
}
/**
 * Sets a custom filesystem implementation (for testing).
 *
 * @param filesystem - The filesystem implementation to use
 */
export declare function setFileSystem(filesystem: FileSystem): void;
/**
 * Gets all directories where lock files may be stored.
 *
 * On WSL, this includes both the Linux home directory and
 * the Windows user profile directory.
 *
 * @returns Array of directory paths to search for lock files
 */
export declare function getLockFileDirectories(): string[];
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
export declare function getIdeLockFiles(): LockFileInfo[];
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
export declare function parseLockFile(lockFilePath: string): ParsedLockFile | null;
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
export declare function testConnection(host: string, port: number, timeoutMs?: number): Promise<boolean>;
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
export declare function getIdeHost(runningInWindows: boolean, port: number): Promise<string>;
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
export declare function cleanStaleLockFiles(): Promise<void>;
//# sourceMappingURL=lock-files.d.ts.map