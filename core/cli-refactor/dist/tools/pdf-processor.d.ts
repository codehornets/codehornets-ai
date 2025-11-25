/**
 * PDF Processor Module
 *
 * Handles PDF file processing including text extraction and conversion
 * for API consumption.
 */
import type { PDFFileResult } from './types.js';
/**
 * Maximum PDF file size in bytes (default 10MB)
 */
export declare const MAX_PDF_SIZE_BYTES: number;
/**
 * PDF magic bytes for file validation
 */
export declare const PDF_MAGIC_BYTES: Buffer<ArrayBuffer>;
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
/**
 * Validates that a file is a valid PDF
 *
 * @param filePath - Path to the file
 * @returns True if the file appears to be a valid PDF
 */
export declare function isValidPDF(filePath: string): boolean;
/**
 * Checks if a file has a PDF extension
 *
 * @param filePath - Path to the file
 * @returns True if file has .pdf extension
 */
export declare function isPDFFile(filePath: string): boolean;
/**
 * Checks if a PDF file is within size limits
 *
 * @param filePath - Path to the PDF file
 * @param maxSizeBytes - Maximum allowed size
 * @returns True if file is within size limits
 */
export declare function isPDFWithinSizeLimit(filePath: string, maxSizeBytes?: number): boolean;
/**
 * Processes a PDF file and returns it as base64 for API consumption
 *
 * @param filePath - Path to the PDF file
 * @returns PDF file result with base64 data
 */
export declare function processPDF(filePath: string): Promise<PDFFileResult>;
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
export declare function extractPDFText(filePath: string, options?: PDFExtractionOptions): Promise<PDFPage[]>;
/**
 * Gets metadata from a PDF file
 *
 * Note: This is a placeholder implementation. Full implementation would use
 * a library like pdf-parse or pdfjs-dist.
 *
 * @param filePath - Path to the PDF file
 * @returns PDF metadata
 */
export declare function getPDFMetadata(filePath: string): Promise<PDFMetadata>;
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
export declare function extractPDFPageAsImage(filePath: string, pageNumber: number): Promise<Buffer>;
/**
 * Checks if PDF processing is available
 * (Checks if required dependencies are installed)
 *
 * @returns True if PDF processing is available
 */
export declare function isPDFProcessingAvailable(): boolean;
/**
 * Estimates the token count for a PDF file
 * Based on typical PDF text density
 *
 * @param filePath - Path to the PDF file
 * @returns Estimated token count
 */
export declare function estimatePDFTokens(filePath: string): number;
//# sourceMappingURL=pdf-processor.d.ts.map