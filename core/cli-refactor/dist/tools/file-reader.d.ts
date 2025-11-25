/**
 * File Reader Module
 *
 * Provides file reading functionality with encoding detection and support
 * for various file types including text, images, notebooks, and PDFs.
 */
import type { FileEncoding, LineEnding, TextFileResult, FileReadOptions } from './types.js';
/**
 * Maximum file size in bytes (default 5MB)
 */
export declare const MAX_FILE_SIZE_BYTES: number;
/**
 * Maximum tokens for file content
 */
export declare const MAX_FILE_TOKENS = 25000;
/**
 * Binary file extensions that cannot be read as text
 */
export declare const BINARY_EXTENSIONS: Set<string>;
/**
 * Image file extensions
 */
export declare const IMAGE_EXTENSIONS: Set<string>;
/**
 * Detects the file encoding by examining byte order marks and content
 *
 * @param filePath - Path to the file
 * @returns Detected encoding
 */
export declare function detectEncoding(filePath: string): FileEncoding;
/**
 * Detects the line ending style of a file
 *
 * @param filePath - Path to the file
 * @param encoding - File encoding to use
 * @returns Detected line ending type
 */
export declare function detectLineEnding(filePath: string, encoding?: FileEncoding): LineEnding;
/**
 * Reads a file with proper encoding detection
 *
 * @param filePath - Path to the file
 * @returns Object containing content and encoding
 */
export declare function readFileWithEncoding(filePath: string): {
    content: string;
    encoding: FileEncoding;
};
/**
 * Reads a portion of a text file with line-based pagination
 *
 * @param filePath - Path to the file
 * @param startLine - Line number to start from (0-indexed)
 * @param limit - Maximum number of lines to read
 * @returns Object containing content, line count, and total lines
 */
export declare function readFileLines(filePath: string, startLine?: number, limit?: number): {
    content: string;
    lineCount: number;
    totalLines: number;
};
/**
 * Formats file content with line numbers for display
 *
 * @param content - File content
 * @param startLine - Starting line number
 * @returns Content with line numbers
 */
export declare function formatWithLineNumbers(content: string, startLine?: number): string;
/**
 * Reads a text file and returns a structured result
 *
 * @param options - File read options
 * @returns Text file result
 */
export declare function readTextFile(options: FileReadOptions): TextFileResult;
/**
 * Checks if a file path is safe to read (within allowed size)
 *
 * @param filePath - Path to the file
 * @param maxSizeBytes - Maximum allowed file size
 * @returns True if file is safe to read
 */
export declare function isFileSafeToRead(filePath: string, maxSizeBytes?: number): boolean;
/**
 * Checks if a file extension indicates a binary file
 *
 * @param filePath - Path to the file
 * @returns True if file is likely binary
 */
export declare function isBinaryFile(filePath: string): boolean;
/**
 * Checks if a file is an image
 *
 * @param filePath - Path to the file
 * @returns True if file is an image
 */
export declare function isImageFile(filePath: string): boolean;
/**
 * Resolves symlinks and returns the actual file path
 *
 * @param filePath - Path to the file
 * @returns Object containing resolved path and symlink status
 */
export declare function resolveFilePath(filePath: string): {
    resolvedPath: string;
    isSymlink: boolean;
};
/**
 * Gets the modification timestamp of a file
 *
 * @param filePath - Path to the file
 * @returns Modification time in milliseconds
 */
export declare function getFileModTime(filePath: string): number;
/**
 * Formats a byte size into human-readable string
 *
 * @param bytes - Size in bytes
 * @returns Human-readable size string
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Converts tabs to spaces in content
 *
 * @param content - Content to convert
 * @param spacesPerTab - Number of spaces per tab
 * @returns Content with tabs converted to spaces
 */
export declare function tabsToSpaces(content: string, spacesPerTab?: number): string;
//# sourceMappingURL=file-reader.d.ts.map