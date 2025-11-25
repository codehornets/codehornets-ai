/**
 * Filesystem abstraction module
 * Provides a unified interface for file system operations with symlink support
 */
import * as fs from 'fs';
/** File stat result */
export interface FileStat {
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    size: number;
    mtime: Date;
    mode: number;
}
/** Directory entry */
export interface DirectoryEntry {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
}
/** Symlink resolution result */
export interface SymlinkResolution {
    /** The resolved path (after following symlinks) */
    resolvedPath: string;
    /** Whether the path was a symlink */
    isSymlink: boolean;
}
/** File read options */
export interface ReadOptions {
    encoding?: BufferEncoding;
}
/** File write options */
export interface WriteOptions {
    encoding?: BufferEncoding;
    mode?: number;
    flush?: boolean;
}
/** Read result with buffer info */
export interface ReadResult {
    buffer: Buffer;
    bytesRead: number;
}
/**
 * FileSystem interface - provides abstraction over Node.js fs module
 */
export interface FileSystem {
    /** Get current working directory */
    cwd(): string;
    /** Check if file/directory exists synchronously */
    existsSync(filePath: string): boolean;
    /** Get file stats asynchronously */
    stat(filePath: string): Promise<fs.Stats>;
    /** Get file stats synchronously */
    statSync(filePath: string): fs.Stats;
    /** Read file contents as string */
    readFileSync(filePath: string, options: ReadOptions): string;
    /** Read file contents as Buffer */
    readFileBytesSync(filePath: string): Buffer;
    /** Read partial file contents */
    readSync(filePath: string, options: {
        length: number;
    }): ReadResult;
    /** Write file contents */
    writeFileSync(filePath: string, content: string, options: WriteOptions): void;
    /** Append to file */
    appendFileSync(filePath: string, content: string): void;
    /** Copy file */
    copyFileSync(src: string, dest: string): void;
    /** Delete file */
    unlinkSync(filePath: string): void;
    /** Rename/move file */
    renameSync(oldPath: string, newPath: string): void;
    /** Create hard link */
    linkSync(existingPath: string, newPath: string): void;
    /** Create symbolic link */
    symlinkSync(target: string, linkPath: string): void;
    /** Read symbolic link target */
    readlinkSync(linkPath: string): string;
    /** Resolve to real path (following symlinks) */
    realpathSync(filePath: string): string;
    /** Create directory (with recursive option) */
    mkdirSync(dirPath: string): void;
    /** Read directory contents with file types */
    readdirSync(dirPath: string): fs.Dirent[];
    /** Read directory contents as string array */
    readdirStringSync(dirPath: string): string[];
    /** Check if directory is empty */
    isDirEmptySync(dirPath: string): boolean;
    /** Remove directory */
    rmdirSync(dirPath: string): void;
    /** Remove file or directory recursively */
    rmSync(filePath: string, options?: fs.RmOptions): void;
    /** Create write stream */
    createWriteStream(filePath: string): fs.WriteStream;
}
/**
 * Gets the current file system instance
 * @returns The current FileSystem implementation
 */
export declare function getFileSystem(): FileSystem;
/**
 * Sets the file system instance (useful for testing)
 * @param fs - FileSystem implementation to use
 */
export declare function setFileSystem(fileSystem: FileSystem): void;
/**
 * Resets the file system to the default implementation
 */
export declare function resetFileSystem(): void;
/**
 * Resolves a path, following symlinks if present
 * @param filePath - Path to resolve
 * @returns Resolution result with resolved path and symlink flag
 */
export declare function resolveSymlink(filePath: string): SymlinkResolution;
/**
 * Gets all paths associated with a file (original and resolved symlink target)
 * @param filePath - Path to analyze
 * @returns Array of paths (may contain duplicates if not a symlink)
 */
export declare function getAllPaths(filePath: string): string[];
/**
 * Reads a file in reverse line by line (async generator)
 * Useful for reading log files from the end
 * @param filePath - Path to file to read
 * @yields Lines from the file, starting from the end
 */
export declare function readLinesReverse(filePath: string): AsyncGenerator<string, void, unknown>;
/**
 * Checks if a path is a directory
 * @param filePath - Path to check
 * @returns True if path is a directory
 */
export declare function isDirectory(filePath: string): boolean;
/**
 * Checks if a path is a file
 * @param filePath - Path to check
 * @returns True if path is a file
 */
export declare function isFile(filePath: string): boolean;
/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Directory path to ensure exists
 */
export declare function ensureDir(dirPath: string): void;
/**
 * Reads a JSON file and parses its contents
 * @param filePath - Path to JSON file
 * @returns Parsed JSON content
 */
export declare function readJsonSync<T = unknown>(filePath: string): T;
/**
 * Writes an object as JSON to a file
 * @param filePath - Path to write to
 * @param data - Data to write
 * @param options - Additional write options
 */
export declare function writeJsonSync(filePath: string, data: unknown, options?: {
    indent?: number;
    mode?: number;
}): void;
/**
 * Normalizes a path to use consistent separators
 * @param filePath - Path to normalize
 * @returns Normalized path
 */
export declare function normalizePath(filePath: string): string;
/**
 * Joins path segments
 * @param segments - Path segments to join
 * @returns Joined path
 */
export declare function joinPath(...segments: string[]): string;
/**
 * Gets the directory name from a path
 * @param filePath - Path to extract directory from
 * @returns Directory portion of path
 */
export declare function dirname(filePath: string): string;
/**
 * Gets the base name from a path
 * @param filePath - Path to extract base name from
 * @param ext - Optional extension to remove
 * @returns Base name of path
 */
export declare function basename(filePath: string, ext?: string): string;
/**
 * Gets the extension from a path
 * @param filePath - Path to extract extension from
 * @returns Extension including the dot
 */
export declare function extname(filePath: string): string;
//# sourceMappingURL=filesystem.d.ts.map