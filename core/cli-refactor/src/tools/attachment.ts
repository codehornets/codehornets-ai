/**
 * Attachment Module
 *
 * Handles computation of file attachment metadata for various file types
 * and contexts.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { AttachmentMetadata, FileEncoding } from './types.js';
import { detectEncoding } from './file-reader.js';
import { isImageFile, isBinaryFile, IMAGE_EXTENSIONS } from './file-reader.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Common MIME types by extension
 */
export const MIME_TYPES: Record<string, string> = {
  // Text
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
  xml: 'application/xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  csv: 'text/csv',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  ts: 'text/typescript',
  jsx: 'text/javascript',
  tsx: 'text/typescript',
  py: 'text/x-python',
  rb: 'text/x-ruby',
  java: 'text/x-java',
  c: 'text/x-c',
  cpp: 'text/x-c++',
  h: 'text/x-c',
  hpp: 'text/x-c++',
  cs: 'text/x-csharp',
  go: 'text/x-go',
  rs: 'text/x-rust',
  swift: 'text/x-swift',
  kt: 'text/x-kotlin',
  scala: 'text/x-scala',
  php: 'text/x-php',
  sh: 'text/x-shellscript',
  bash: 'text/x-shellscript',
  zsh: 'text/x-shellscript',
  sql: 'text/x-sql',
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Archives
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  // Notebooks
  ipynb: 'application/x-ipynb+json',
  // Binary
  exe: 'application/x-executable',
  dll: 'application/x-msdownload',
  bin: 'application/octet-stream',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets the MIME type for a file based on its extension
 *
 * @param filePath - Path to the file
 * @returns MIME type string
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Computes a checksum for a file
 *
 * @param filePath - Path to the file
 * @param algorithm - Hash algorithm to use
 * @returns Hex string checksum
 */
export function computeChecksum(
  filePath: string,
  algorithm: 'md5' | 'sha1' | 'sha256' = 'sha256'
): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash(algorithm).update(content).digest('hex');
}

/**
 * Gets file stats with proper error handling
 *
 * @param filePath - Path to the file
 * @returns File stats or null if file doesn't exist
 */
export function getFileStats(filePath: string): fs.Stats | null {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Computes comprehensive metadata for a file attachment
 *
 * @param filePath - Path to the file
 * @param options - Options for metadata computation
 * @returns Attachment metadata
 */
export function computeAttachment(
  filePath: string,
  options: {
    computeChecksum?: boolean;
    checksumAlgorithm?: 'md5' | 'sha1' | 'sha256';
  } = {}
): AttachmentMetadata {
  const stats = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const mimeType = getMimeType(filePath);

  const metadata: AttachmentMetadata = {
    filename,
    mimeType,
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };

  // Add encoding for text files
  if (!isBinaryFile(filePath) && !isImageFile(filePath)) {
    metadata.encoding = detectEncoding(filePath);
  }

  // Optionally compute checksum
  if (options.computeChecksum) {
    metadata.checksum = computeChecksum(
      filePath,
      options.checksumAlgorithm || 'sha256'
    );
  }

  return metadata;
}

/**
 * Creates an attachment object for an at-mention in a message
 *
 * @param filePath - Path to the mentioned file
 * @param cwd - Current working directory for relative path computation
 * @returns Attachment info for the message
 */
export function createAtMentionAttachment(
  filePath: string,
  cwd: string
): {
  type: 'file' | 'directory' | 'already_read_file' | 'compact_file_reference';
  filename: string;
  relativePath?: string;
} | null {
  const stats = getFileStats(filePath);
  if (!stats) {
    return null;
  }

  const relativePath = path.relative(cwd, filePath);

  if (stats.isDirectory()) {
    return {
      type: 'directory',
      filename: filePath,
      relativePath: relativePath.startsWith('..') ? undefined : relativePath,
    };
  }

  return {
    type: 'file',
    filename: filePath,
    relativePath: relativePath.startsWith('..') ? undefined : relativePath,
  };
}

/**
 * Extracts file paths from @ mentions in text
 *
 * @param text - Text containing @ mentions
 * @returns Array of extracted file paths
 */
export function extractAtMentions(text: string): string[] {
  // Match @"quoted path" and @unquoted-path
  const quotedPattern = /(^|\s)@"([^"]+)"/g;
  const unquotedPattern = /(^|\s)@([^\s]+)\b/g;

  const quoted: string[] = [];
  const unquoted: string[] = [];

  let match;
  while ((match = quotedPattern.exec(text)) !== null) {
    if (match[2]) {
      quoted.push(match[2]);
    }
  }

  const unquotedMatches = text.match(unquotedPattern) || [];
  for (const m of unquotedMatches) {
    const path = m.slice(m.indexOf('@') + 1);
    if (!path.startsWith('"')) {
      unquoted.push(path);
    }
  }

  return [...new Set([...quoted, ...unquoted])];
}

/**
 * Parses a filename with optional line range specification
 *
 * @param filename - Filename possibly containing #L<start>-<end> suffix
 * @returns Parsed filename and line range
 */
export function parseFilenameWithLineRange(filename: string): {
  filename: string;
  lineStart?: number;
  lineEnd?: number;
} {
  const match = filename.match(/^([^#]+)(?:#L(\d+)(?:-(\d+))?)?$/);

  if (!match) {
    return { filename };
  }

  const [, basePath, startStr, endStr] = match;

  const result: { filename: string; lineStart?: number; lineEnd?: number } = {
    filename: basePath ?? filename,
  };

  if (startStr) {
    result.lineStart = parseInt(startStr, 10);
    result.lineEnd = endStr ? parseInt(endStr, 10) : result.lineStart;
  }

  return result;
}

/**
 * Generates a sanitized filename suitable for file system storage
 *
 * @param input - Input string to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '-');
}

/**
 * Checks if a file should be ignored based on common patterns
 *
 * @param filePath - Path to check
 * @param ignorePatterns - Array of glob patterns to ignore
 * @returns True if file should be ignored
 */
export function shouldIgnoreFile(
  filePath: string,
  ignorePatterns: string[] = []
): boolean {
  const filename = path.basename(filePath);

  // Common ignore patterns
  const defaultIgnores = [
    '.git',
    'node_modules',
    '.env',
    '.env.local',
    '.DS_Store',
    'Thumbs.db',
  ];

  const allIgnores = [...defaultIgnores, ...ignorePatterns];

  for (const pattern of allIgnores) {
    if (filename === pattern || filePath.includes(`/${pattern}/`)) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the language/file type identifier from a file path
 *
 * @param filePath - Path to the file
 * @returns Language identifier or 'unknown'
 */
export function getFileLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  if (!ext) {
    return 'unknown';
  }

  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rb': 'ruby',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.php': 'php',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.sql': 'sql',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.ipynb': 'jupyter',
    '.pdf': 'pdf',
  };

  return languageMap[ext] || ext.slice(1);
}
