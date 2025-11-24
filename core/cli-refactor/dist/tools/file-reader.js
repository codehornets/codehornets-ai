/**
 * File Reader Module
 *
 * Provides file reading functionality with encoding detection and support
 * for various file types including text, images, notebooks, and PDFs.
 */
import * as fs from 'fs';
import * as path from 'path';
// =============================================================================
// Constants
// =============================================================================
/**
 * Maximum file size in bytes (default 5MB)
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/**
 * Maximum tokens for file content
 */
export const MAX_FILE_TOKENS = 25000;
/**
 * Binary file extensions that cannot be read as text
 */
export const BINARY_EXTENSIONS = new Set([
    'mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma', 'aiff', 'opus',
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg',
    'zip', 'rar', 'tar', 'gz', 'bz2', '7z', 'xz', 'z', 'tgz', 'iso',
    'exe', 'dll', 'so', 'dylib', 'app', 'msi', 'deb', 'rpm',
    'bin', 'dat', 'db', 'sqlite', 'sqlite3', 'mdb', 'idx',
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    'psd', 'ai', 'eps', 'sketch', 'fig', 'xd',
    'blend', 'obj', '3ds', 'max',
    'class', 'jar', 'war', 'pyc', 'pyo', 'rlib',
    'swf', 'fla',
]);
/**
 * Image file extensions
 */
export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
// =============================================================================
// Encoding Detection
// =============================================================================
/**
 * Detects the file encoding by examining byte order marks and content
 *
 * @param filePath - Path to the file
 * @returns Detected encoding
 */
export function detectEncoding(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4096);
        const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
        fs.closeSync(fd);
        // Check for UTF-16 LE BOM (FF FE)
        if (bytesRead >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
            return 'utf16le';
        }
        // Check for UTF-8 BOM (EF BB BF)
        if (bytesRead >= 3 &&
            buffer[0] === 0xef &&
            buffer[1] === 0xbb &&
            buffer[2] === 0xbf) {
            return 'utf8';
        }
        // Try to detect UTF-8 by attempting to decode
        const content = buffer.slice(0, bytesRead).toString('utf8');
        if (content.length > 0) {
            return 'utf8';
        }
        return 'ascii';
    }
    catch (error) {
        // Default to UTF-8 on error
        return 'utf8';
    }
}
/**
 * Detects the line ending style of a file
 *
 * @param filePath - Path to the file
 * @param encoding - File encoding to use
 * @returns Detected line ending type
 */
export function detectLineEnding(filePath, encoding = 'utf8') {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4096);
        const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
        fs.closeSync(fd);
        const content = buffer.toString(encoding, 0, bytesRead);
        let crlfCount = 0;
        let lfCount = 0;
        for (let i = 0; i < content.length; i++) {
            if (content[i] === '\n') {
                if (i > 0 && content[i - 1] === '\r') {
                    crlfCount++;
                }
                else {
                    lfCount++;
                }
            }
        }
        return crlfCount > lfCount ? 'CRLF' : 'LF';
    }
    catch (error) {
        return 'LF';
    }
}
// =============================================================================
// File Reading
// =============================================================================
/**
 * Reads a file with proper encoding detection
 *
 * @param filePath - Path to the file
 * @returns Object containing content and encoding
 */
export function readFileWithEncoding(filePath) {
    const encoding = detectEncoding(filePath);
    const content = fs
        .readFileSync(filePath, { encoding })
        .replace(/\r\n/g, '\n');
    return { content, encoding };
}
/**
 * Reads a portion of a text file with line-based pagination
 *
 * @param filePath - Path to the file
 * @param startLine - Line number to start from (0-indexed)
 * @param limit - Maximum number of lines to read
 * @returns Object containing content, line count, and total lines
 */
export function readFileLines(filePath, startLine = 0, limit) {
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    const lines = fileContent.split(/\r?\n/);
    const totalLines = lines.length;
    let selectedLines;
    if (limit !== undefined && lines.length - startLine > limit) {
        selectedLines = lines.slice(startLine, startLine + limit);
    }
    else {
        selectedLines = lines.slice(startLine);
    }
    return {
        content: selectedLines.join('\n'),
        lineCount: selectedLines.length,
        totalLines,
    };
}
/**
 * Formats file content with line numbers for display
 *
 * @param content - File content
 * @param startLine - Starting line number
 * @returns Content with line numbers
 */
export function formatWithLineNumbers(content, startLine = 1) {
    if (!content) {
        return '';
    }
    return content
        .split(/\r?\n/)
        .map((line, index) => {
        const lineNum = index + startLine;
        const lineNumStr = String(lineNum);
        const padded = lineNumStr.length >= 6 ? lineNumStr : lineNumStr.padStart(6, ' ');
        return `${padded}\u2192${line}`;
    })
        .join('\n');
}
/**
 * Reads a text file and returns a structured result
 *
 * @param options - File read options
 * @returns Text file result
 */
export function readTextFile(options) {
    const { filePath, offset = 1, limit } = options;
    const startOffset = offset === 0 ? 0 : offset - 1;
    const { content, lineCount, totalLines } = readFileLines(filePath, startOffset, limit);
    return {
        type: 'text',
        filePath,
        file: {
            filePath,
            content,
            numLines: lineCount,
            startLine: offset,
            totalLines,
        },
    };
}
// =============================================================================
// File Validation
// =============================================================================
/**
 * Checks if a file path is safe to read (within allowed size)
 *
 * @param filePath - Path to the file
 * @param maxSizeBytes - Maximum allowed file size
 * @returns True if file is safe to read
 */
export function isFileSafeToRead(filePath, maxSizeBytes = MAX_FILE_SIZE_BYTES) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size <= maxSizeBytes;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a file extension indicates a binary file
 *
 * @param filePath - Path to the file
 * @returns True if file is likely binary
 */
export function isBinaryFile(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return BINARY_EXTENSIONS.has(ext);
}
/**
 * Checks if a file is an image
 *
 * @param filePath - Path to the file
 * @returns True if file is an image
 */
export function isImageFile(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return IMAGE_EXTENSIONS.has(ext);
}
/**
 * Resolves symlinks and returns the actual file path
 *
 * @param filePath - Path to the file
 * @returns Object containing resolved path and symlink status
 */
export function resolveFilePath(filePath) {
    try {
        const stats = fs.lstatSync(filePath);
        if (stats.isSymbolicLink()) {
            const target = fs.readlinkSync(filePath);
            const resolved = path.isAbsolute(target)
                ? target
                : path.resolve(path.dirname(filePath), target);
            return { resolvedPath: resolved, isSymlink: true };
        }
    }
    catch {
        // Not a symlink or error reading
    }
    return { resolvedPath: filePath, isSymlink: false };
}
/**
 * Gets the modification timestamp of a file
 *
 * @param filePath - Path to the file
 * @returns Modification time in milliseconds
 */
export function getFileModTime(filePath) {
    const stats = fs.statSync(filePath);
    return Math.ceil(stats.mtimeMs);
}
/**
 * Formats a byte size into human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Human-readable size string
 */
export function formatFileSize(bytes) {
    const kb = bytes / 1024;
    if (kb < 1) {
        return `${bytes} bytes`;
    }
    if (kb < 1024) {
        return `${kb.toFixed(1).replace(/\.0$/, '')}KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
        return `${mb.toFixed(1).replace(/\.0$/, '')}MB`;
    }
    return `${(mb / 1024).toFixed(1).replace(/\.0$/, '')}GB`;
}
/**
 * Converts tabs to spaces in content
 *
 * @param content - Content to convert
 * @param spacesPerTab - Number of spaces per tab
 * @returns Content with tabs converted to spaces
 */
export function tabsToSpaces(content, spacesPerTab = 2) {
    return content.replace(/^\t+/gm, (match) => '  '.repeat(match.length));
}
//# sourceMappingURL=file-reader.js.map