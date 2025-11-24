/**
 * Attachment Module
 *
 * Handles computation of file attachment metadata for various file types
 * and contexts.
 */
import * as fs from 'fs';
import type { AttachmentMetadata } from './types.js';
/**
 * Common MIME types by extension
 */
export declare const MIME_TYPES: Record<string, string>;
/**
 * Gets the MIME type for a file based on its extension
 *
 * @param filePath - Path to the file
 * @returns MIME type string
 */
export declare function getMimeType(filePath: string): string;
/**
 * Computes a checksum for a file
 *
 * @param filePath - Path to the file
 * @param algorithm - Hash algorithm to use
 * @returns Hex string checksum
 */
export declare function computeChecksum(filePath: string, algorithm?: 'md5' | 'sha1' | 'sha256'): string;
/**
 * Gets file stats with proper error handling
 *
 * @param filePath - Path to the file
 * @returns File stats or null if file doesn't exist
 */
export declare function getFileStats(filePath: string): fs.Stats | null;
/**
 * Computes comprehensive metadata for a file attachment
 *
 * @param filePath - Path to the file
 * @param options - Options for metadata computation
 * @returns Attachment metadata
 */
export declare function computeAttachment(filePath: string, options?: {
    computeChecksum?: boolean;
    checksumAlgorithm?: 'md5' | 'sha1' | 'sha256';
}): AttachmentMetadata;
/**
 * Creates an attachment object for an at-mention in a message
 *
 * @param filePath - Path to the mentioned file
 * @param cwd - Current working directory for relative path computation
 * @returns Attachment info for the message
 */
export declare function createAtMentionAttachment(filePath: string, cwd: string): {
    type: 'file' | 'directory' | 'already_read_file' | 'compact_file_reference';
    filename: string;
    relativePath?: string;
} | null;
/**
 * Extracts file paths from @ mentions in text
 *
 * @param text - Text containing @ mentions
 * @returns Array of extracted file paths
 */
export declare function extractAtMentions(text: string): string[];
/**
 * Parses a filename with optional line range specification
 *
 * @param filename - Filename possibly containing #L<start>-<end> suffix
 * @returns Parsed filename and line range
 */
export declare function parseFilenameWithLineRange(filename: string): {
    filename: string;
    lineStart?: number;
    lineEnd?: number;
};
/**
 * Generates a sanitized filename suitable for file system storage
 *
 * @param input - Input string to sanitize
 * @returns Sanitized filename
 */
export declare function sanitizeFilename(input: string): string;
/**
 * Checks if a file should be ignored based on common patterns
 *
 * @param filePath - Path to check
 * @param ignorePatterns - Array of glob patterns to ignore
 * @returns True if file should be ignored
 */
export declare function shouldIgnoreFile(filePath: string, ignorePatterns?: string[]): boolean;
/**
 * Gets the language/file type identifier from a file path
 *
 * @param filePath - Path to the file
 * @returns Language identifier or 'unknown'
 */
export declare function getFileLanguage(filePath: string): string;
//# sourceMappingURL=attachment.d.ts.map