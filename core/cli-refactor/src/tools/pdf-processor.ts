/**
 * PDF Processor Module
 *
 * Handles PDF file processing including text extraction and conversion
 * for API consumption.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PDFFileResult } from './types.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum PDF file size in bytes (default 10MB)
 */
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * PDF magic bytes for file validation
 */
export const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF

// =============================================================================
// PDF Processing Types
// =============================================================================

export interface PDFExtractionOptions {
  extractImages?: boolean;
  extractText?: boolean;
  pageRange?: {
    start: number;
    end: number;
  };
}

export interface PDFMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  images?: PDFImage[];
}

export interface PDFImage {
  data: Buffer;
  width: number;
  height: number;
  format: string;
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates that a file is a valid PDF
 *
 * @param filePath - Path to the file
 * @returns True if the file appears to be a valid PDF
 */
export function isValidPDF(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    return buffer.equals(PDF_MAGIC_BYTES);
  } catch {
    return false;
  }
}

/**
 * Checks if a file has a PDF extension
 *
 * @param filePath - Path to the file
 * @returns True if file has .pdf extension
 */
export function isPDFFile(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.pdf';
}

/**
 * Checks if a PDF file is within size limits
 *
 * @param filePath - Path to the PDF file
 * @param maxSizeBytes - Maximum allowed size
 * @returns True if file is within size limits
 */
export function isPDFWithinSizeLimit(
  filePath: string,
  maxSizeBytes: number = MAX_PDF_SIZE_BYTES
): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.size <= maxSizeBytes;
  } catch {
    return false;
  }
}

// =============================================================================
// Main Processing Functions
// =============================================================================

/**
 * Processes a PDF file and returns it as base64 for API consumption
 *
 * @param filePath - Path to the PDF file
 * @returns PDF file result with base64 data
 */
export async function processPDF(filePath: string): Promise<PDFFileResult> {
  // Validate the file exists and is a PDF
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  if (!isValidPDF(filePath)) {
    throw new Error(`File is not a valid PDF: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const originalSize = stats.size;

  if (originalSize === 0) {
    throw new Error(`PDF file is empty: ${filePath}`);
  }

  // Read the PDF file as binary
  const pdfBuffer = fs.readFileSync(filePath);

  return {
    type: 'pdf',
    filePath,
    file: {
      filePath,
      base64: pdfBuffer.toString('base64'),
      originalSize,
    },
  };
}

/**
 * Extracts text content from a PDF file
 *
 * Note: This is a placeholder implementation. Full implementation would use
 * a library like pdf-parse or pdfjs-dist.
 *
 * @param filePath - Path to the PDF file
 * @param options - Extraction options
 * @returns Array of PDF pages with extracted content
 */
export async function extractPDFText(
  filePath: string,
  options: PDFExtractionOptions = {}
): Promise<PDFPage[]> {
  // Validate the file
  if (!isValidPDF(filePath)) {
    throw new Error(`File is not a valid PDF: ${filePath}`);
  }

  // Placeholder: In a real implementation, use pdf-parse or similar
  console.warn(
    `PDF text extraction requires pdf-parse library. ` +
    `Returning empty content for: ${filePath}`
  );

  return [{
    pageNumber: 1,
    text: '[PDF text extraction not implemented]',
  }];
}

/**
 * Gets metadata from a PDF file
 *
 * Note: This is a placeholder implementation. Full implementation would use
 * a library like pdf-parse or pdfjs-dist.
 *
 * @param filePath - Path to the PDF file
 * @returns PDF metadata
 */
export async function getPDFMetadata(filePath: string): Promise<PDFMetadata> {
  // Validate the file
  if (!isValidPDF(filePath)) {
    throw new Error(`File is not a valid PDF: ${filePath}`);
  }

  // Placeholder: Return basic metadata
  return {
    pageCount: 0, // Would need pdf-parse to get actual count
    title: path.basename(filePath, '.pdf'),
  };
}

/**
 * Extracts a specific page from a PDF as an image
 *
 * Note: This is a placeholder implementation. Full implementation would use
 * pdfjs-dist or similar.
 *
 * @param filePath - Path to the PDF file
 * @param pageNumber - Page number to extract (1-indexed)
 * @returns Buffer containing the page image
 */
export async function extractPDFPageAsImage(
  filePath: string,
  pageNumber: number
): Promise<Buffer> {
  // Validate the file
  if (!isValidPDF(filePath)) {
    throw new Error(`File is not a valid PDF: ${filePath}`);
  }

  if (pageNumber < 1) {
    throw new Error(`Invalid page number: ${pageNumber}`);
  }

  // Placeholder: In a real implementation, use pdfjs-dist
  throw new Error(
    `PDF page extraction not implemented. ` +
    `Requires pdfjs-dist or similar library.`
  );
}

/**
 * Checks if PDF processing is available
 * (Checks if required dependencies are installed)
 *
 * @returns True if PDF processing is available
 */
export function isPDFProcessingAvailable(): boolean {
  // In a full implementation, check for pdf-parse or pdfjs-dist
  return true; // Basic base64 encoding is always available
}

/**
 * Estimates the token count for a PDF file
 * Based on typical PDF text density
 *
 * @param filePath - Path to the PDF file
 * @returns Estimated token count
 */
export function estimatePDFTokens(filePath: string): number {
  const stats = fs.statSync(filePath);
  // Rough estimate: PDF files typically have 50-100 bytes per token of text
  // For base64: 3 bytes -> 4 chars, 1 token per ~4 chars
  return Math.ceil(stats.size * 1.33 / 4);
}
