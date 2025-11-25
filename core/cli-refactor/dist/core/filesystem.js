/**
 * Filesystem abstraction module
 * Provides a unified interface for file system operations with symlink support
 */
import * as fs from 'fs';
import { stat, open as fsOpen } from 'fs/promises';
import * as path from 'path';
/**
 * Default file system implementation using Node.js fs module
 */
const defaultFileSystem = {
    cwd() {
        return process.cwd();
    },
    existsSync(filePath) {
        return fs.existsSync(filePath);
    },
    async stat(filePath) {
        return stat(filePath);
    },
    statSync(filePath) {
        return fs.statSync(filePath);
    },
    readFileSync(filePath, options) {
        return fs.readFileSync(filePath, { encoding: options.encoding ?? "utf8" });
    },
    readFileBytesSync(filePath) {
        return fs.readFileSync(filePath);
    },
    readSync(filePath, options) {
        let fd;
        try {
            fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(options.length);
            const bytesRead = fs.readSync(fd, buffer, 0, options.length, 0);
            return { buffer, bytesRead };
        }
        finally {
            if (fd !== undefined) {
                fs.closeSync(fd);
            }
        }
    },
    writeFileSync(filePath, content, options) {
        if (!options.flush) {
            const fsOptions = { encoding: options.encoding };
            if (options.mode !== undefined) {
                fsOptions.mode = options.mode;
            }
            fs.writeFileSync(filePath, content, fsOptions);
            return;
        }
        // With flush: open, write, fsync, close
        let fd;
        try {
            const mode = options.mode !== undefined ? options.mode : undefined;
            fd = fs.openSync(filePath, 'w', mode);
            fs.writeFileSync(fd, content, { encoding: options.encoding });
            fs.fsyncSync(fd);
        }
        finally {
            if (fd !== undefined) {
                fs.closeSync(fd);
            }
        }
    },
    appendFileSync(filePath, content) {
        fs.appendFileSync(filePath, content);
    },
    copyFileSync(src, dest) {
        fs.copyFileSync(src, dest);
    },
    unlinkSync(filePath) {
        fs.unlinkSync(filePath);
    },
    renameSync(oldPath, newPath) {
        fs.renameSync(oldPath, newPath);
    },
    linkSync(existingPath, newPath) {
        fs.linkSync(existingPath, newPath);
    },
    symlinkSync(target, linkPath) {
        fs.symlinkSync(target, linkPath);
    },
    readlinkSync(linkPath) {
        return fs.readlinkSync(linkPath);
    },
    realpathSync(filePath) {
        return fs.realpathSync(filePath);
    },
    mkdirSync(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
        }
    },
    readdirSync(dirPath) {
        return fs.readdirSync(dirPath, { withFileTypes: true });
    },
    readdirStringSync(dirPath) {
        return fs.readdirSync(dirPath);
    },
    isDirEmptySync(dirPath) {
        return this.readdirSync(dirPath).length === 0;
    },
    rmdirSync(dirPath) {
        fs.rmdirSync(dirPath);
    },
    rmSync(filePath, options) {
        fs.rmSync(filePath, options);
    },
    createWriteStream(filePath) {
        return fs.createWriteStream(filePath);
    },
};
// Current file system instance (can be swapped for testing)
let currentFileSystem = defaultFileSystem;
/**
 * Gets the current file system instance
 * @returns The current FileSystem implementation
 */
export function getFileSystem() {
    return currentFileSystem;
}
/**
 * Sets the file system instance (useful for testing)
 * @param fs - FileSystem implementation to use
 */
export function setFileSystem(fileSystem) {
    currentFileSystem = fileSystem;
}
/**
 * Resets the file system to the default implementation
 */
export function resetFileSystem() {
    currentFileSystem = defaultFileSystem;
}
/**
 * Resolves a path, following symlinks if present
 * @param filePath - Path to resolve
 * @returns Resolution result with resolved path and symlink flag
 */
export function resolveSymlink(filePath) {
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
    }
    catch {
        return { resolvedPath: filePath, isSymlink: false };
    }
}
/**
 * Gets all paths associated with a file (original and resolved symlink target)
 * @param filePath - Path to analyze
 * @returns Array of paths (may contain duplicates if not a symlink)
 */
export function getAllPaths(filePath) {
    const paths = [filePath];
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
export async function* readLinesReverse(filePath) {
    const handle = await fsOpen(filePath, 'r');
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
    }
    finally {
        await handle.close();
    }
}
/**
 * Checks if a path is a directory
 * @param filePath - Path to check
 * @returns True if path is a directory
 */
export function isDirectory(filePath) {
    const fsys = getFileSystem();
    try {
        return fsys.statSync(filePath).isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Checks if a path is a file
 * @param filePath - Path to check
 * @returns True if path is a file
 */
export function isFile(filePath) {
    const fsys = getFileSystem();
    try {
        return fsys.statSync(filePath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Directory path to ensure exists
 */
export function ensureDir(dirPath) {
    const fsys = getFileSystem();
    fsys.mkdirSync(dirPath);
}
/**
 * Reads a JSON file and parses its contents
 * @param filePath - Path to JSON file
 * @returns Parsed JSON content
 */
export function readJsonSync(filePath) {
    const fsys = getFileSystem();
    const content = fsys.readFileSync(filePath, { encoding: 'utf8' });
    return JSON.parse(content);
}
/**
 * Writes an object as JSON to a file
 * @param filePath - Path to write to
 * @param data - Data to write
 * @param options - Additional write options
 */
export function writeJsonSync(filePath, data, options) {
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
export function normalizePath(filePath) {
    return path.normalize(filePath);
}
/**
 * Joins path segments
 * @param segments - Path segments to join
 * @returns Joined path
 */
export function joinPath(...segments) {
    return path.join(...segments);
}
/**
 * Gets the directory name from a path
 * @param filePath - Path to extract directory from
 * @returns Directory portion of path
 */
export function dirname(filePath) {
    return path.dirname(filePath);
}
/**
 * Gets the base name from a path
 * @param filePath - Path to extract base name from
 * @param ext - Optional extension to remove
 * @returns Base name of path
 */
export function basename(filePath, ext) {
    return path.basename(filePath, ext);
}
/**
 * Gets the extension from a path
 * @param filePath - Path to extract extension from
 * @returns Extension including the dot
 */
export function extname(filePath) {
    return path.extname(filePath);
}
//# sourceMappingURL=filesystem.js.map