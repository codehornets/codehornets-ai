/**
 * Filesystem abstraction module
 * Provides a unified interface for file system operations with symlink support
 */

import * as fs from 'fs';
import { stat, open as fsOpen, FileHandle } from 'fs/promises';
import * as path from 'path';

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
  readSync(filePath: string, options: { length: number }): ReadResult;

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
 * Default file system implementation using Node.js fs module
 */
const defaultFileSystem: FileSystem = {
  cwd(): string {
    return process.cwd();
  },

  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  },

  async stat(filePath: string): Promise<fs.Stats> {
    return stat(filePath);
  },

  statSync(filePath: string): fs.Stats {
    return fs.statSync(filePath);
  },

  readFileSync(filePath: string, options: ReadOptions): string {
    return fs.readFileSync(filePath, { encoding: options.encoding ?? "utf8" }) as string;
  },

  readFileBytesSync(filePath: string): Buffer {
    return fs.readFileSync(filePath);
  },

  readSync(filePath: string, options: { length: number }): ReadResult {
    let fd: number | undefined;
    try {
      fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(options.length);
      const bytesRead = fs.readSync(fd, buffer, 0, options.length, 0);
      return { buffer, bytesRead };
    } finally {
      if (fd !== undefined) {
        fs.closeSync(fd);
      }
    }
  },

  writeFileSync(filePath: string, content: string, options: WriteOptions): void {
    if (!options.flush) {
      const fsOptions: fs.WriteFileOptions = { encoding: options.encoding };
      if (options.mode !== undefined) {
        fsOptions.mode = options.mode;
      }
      fs.writeFileSync(filePath, content, fsOptions);
      return;
    }

    // With flush: open, write, fsync, close
    let fd: number | undefined;
    try {
      const mode = options.mode !== undefined ? options.mode : undefined;
      fd = fs.openSync(filePath, 'w', mode);
      fs.writeFileSync(fd, content, { encoding: options.encoding });
      fs.fsyncSync(fd);
    } finally {
      if (fd !== undefined) {
        fs.closeSync(fd);
      }
    }
  },

  appendFileSync(filePath: string, content: string): void {
    fs.appendFileSync(filePath, content);
  },

  copyFileSync(src: string, dest: string): void {
    fs.copyFileSync(src, dest);
  },

  unlinkSync(filePath: string): void {
    fs.unlinkSync(filePath);
  },

  renameSync(oldPath: string, newPath: string): void {
    fs.renameSync(oldPath, newPath);
  },

  linkSync(existingPath: string, newPath: string): void {
    fs.linkSync(existingPath, newPath);
  },

  symlinkSync(target: string, linkPath: string): void {
    fs.symlinkSync(target, linkPath);
  },

  readlinkSync(linkPath: string): string {
    return fs.readlinkSync(linkPath);
  },

  realpathSync(filePath: string): string {
    return fs.realpathSync(filePath);
  },

  mkdirSync(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
    }
  },

  readdirSync(dirPath: string): fs.Dirent[] {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  },

  readdirStringSync(dirPath: string): string[] {
    return fs.readdirSync(dirPath);
  },

  isDirEmptySync(dirPath: string): boolean {
    return this.readdirSync(dirPath).length === 0;
  },

  rmdirSync(dirPath: string): void {
    fs.rmdirSync(dirPath);
  },

  rmSync(filePath: string, options?: fs.RmOptions): void {
    fs.rmSync(filePath, options);
  },

  createWriteStream(filePath: string): fs.WriteStream {
    return fs.createWriteStream(filePath);
  },
};

// Current file system instance (can be swapped for testing)
let currentFileSystem: FileSystem = defaultFileSystem;

/**
 * Gets the current file system instance
 * @returns The current FileSystem implementation
 */
export function getFileSystem(): FileSystem {
  return currentFileSystem;
}

/**
 * Sets the file system instance (useful for testing)
 * @param fs - FileSystem implementation to use
 */
export function setFileSystem(fileSystem: FileSystem): void {
  currentFileSystem = fileSystem;
}

/**
 * Resets the file system to the default implementation
 */
export function resetFileSystem(): void {
  currentFileSystem = defaultFileSystem;
}

/**
 * Resolves a path, following symlinks if present
 * @param filePath - Path to resolve
 * @returns Resolution result with resolved path and symlink flag
 */
export function resolveSymlink(filePath: string): SymlinkResolution {
  const fsys = getFileSystem();

  if (!fsys.existsSync(filePath)) {
    return { resolvedPath: filePath, isSymlink: false };
  }

  try {
    const resolvedPath = fsys.realpathSync(filePath);
    return {
      resolvedPath,
      isSymlink: resolvedPath !== filePath,
    };
  } catch {
    return { resolvedPath: filePath, isSymlink: false };
  }
}

/**
 * Gets all paths associated with a file (original and resolved symlink target)
 * @param filePath - Path to analyze
 * @returns Array of paths (may contain duplicates if not a symlink)
 */
export function getAllPaths(filePath: string): string[] {
  const paths: string[] = [filePath];
  const fsys = getFileSystem();

  const { resolvedPath, isSymlink } = resolveSymlink(filePath);
  if (isSymlink && resolvedPath !== filePath) {
    paths.push(resolvedPath);
  }

  return paths;
}

/**
 * Reads a file in reverse line by line (async generator)
 * Useful for reading log files from the end
 * @param filePath - Path to file to read
 * @yields Lines from the file, starting from the end
 */
export async function* readLinesReverse(filePath: string): AsyncGenerator<string, void, unknown> {
  const handle: FileHandle = await fsOpen(filePath, 'r');

  try {
    const stats = await handle.stat();
    const fileSize = stats.size;
    let remainder = '';
    const bufferSize = 4096;
    const buffer = Buffer.alloc(bufferSize);
    let position = fileSize;

    while (position > 0) {
      const chunkSize = Math.min(bufferSize, position);
      position -= chunkSize;

      await handle.read(buffer, 0, chunkSize, position);

      const chunk = buffer.toString('utf8', 0, chunkSize) + remainder;
      const lines = chunk.split('\n');
      remainder = lines[0] || '';

      for (let i = lines.length - 1; i >= 1; i--) {
        const line = lines[i];
        if (line) {
          yield line;
        }
      }
    }

    if (remainder) {
      yield remainder;
    }
  } finally {
    await handle.close();
  }
}

/**
 * Checks if a path is a directory
 * @param filePath - Path to check
 * @returns True if path is a directory
 */
export function isDirectory(filePath: string): boolean {
  const fsys = getFileSystem();
  try {
    return fsys.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a path is a file
 * @param filePath - Path to check
 * @returns True if path is a file
 */
export function isFile(filePath: string): boolean {
  const fsys = getFileSystem();
  try {
    return fsys.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Directory path to ensure exists
 */
export function ensureDir(dirPath: string): void {
  const fsys = getFileSystem();
  fsys.mkdirSync(dirPath);
}

/**
 * Reads a JSON file and parses its contents
 * @param filePath - Path to JSON file
 * @returns Parsed JSON content
 */
export function readJsonSync<T = unknown>(filePath: string): T {
  const fsys = getFileSystem();
  const content = fsys.readFileSync(filePath, { encoding: 'utf8' });
  return JSON.parse(content) as T;
}

/**
 * Writes an object as JSON to a file
 * @param filePath - Path to write to
 * @param data - Data to write
 * @param options - Additional write options
 */
export function writeJsonSync(
  filePath: string,
  data: unknown,
  options?: { indent?: number; mode?: number }
): void {
  const fsys = getFileSystem();
  const content = JSON.stringify(data, null, options?.indent ?? 2);
  fsys.writeFileSync(filePath, content, {
    encoding: 'utf8',
    mode: options?.mode,
  });
}

/**
 * Normalizes a path to use consistent separators
 * @param filePath - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * Joins path segments
 * @param segments - Path segments to join
 * @returns Joined path
 */
export function joinPath(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Gets the directory name from a path
 * @param filePath - Path to extract directory from
 * @returns Directory portion of path
 */
export function dirname(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Gets the base name from a path
 * @param filePath - Path to extract base name from
 * @param ext - Optional extension to remove
 * @returns Base name of path
 */
export function basename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

/**
 * Gets the extension from a path
 * @param filePath - Path to extract extension from
 * @returns Extension including the dot
 */
export function extname(filePath: string): string {
  return path.extname(filePath);
}
