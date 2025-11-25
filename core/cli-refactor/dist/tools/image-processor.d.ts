/**
 * Image Processor Module
 *
 * Handles image file processing including resizing, compression, and
 * format conversion for API consumption.
 */
import type { ImageFileResult } from './types.js';
/**
 * Default maximum tokens for image content
 */
export declare const DEFAULT_MAX_IMAGE_TOKENS = 25000;
/**
 * Supported image formats
 */
export declare const SUPPORTED_IMAGE_FORMATS: readonly ["png", "jpg", "jpeg", "gif", "webp"];
/**
 * Image resize quality levels
 */
export declare const QUALITY_LEVELS: {
    readonly high: {
        readonly scale: 1;
        readonly quality: 80;
    };
    readonly medium: {
        readonly scale: 0.75;
        readonly quality: 70;
    };
    readonly low: {
        readonly scale: 0.5;
        readonly quality: 60;
    };
    readonly minimal: {
        readonly scale: 0.25;
        readonly quality: 50;
    };
};
export interface ImageProcessingOptions {
    maxTokens?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}
export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
    channels: number;
    hasAlpha: boolean;
}
/**
 * Gets the file extension as a normalized image format
 *
 * @param filePath - Path to the file
 * @returns Normalized format string
 */
export declare function getImageFormat(filePath: string): string;
/**
 * Calculates the estimated token count for an image
 * Based on base64 encoding overhead: 1 byte = ~1.33 base64 chars
 * Rough estimate: 1 token per 8 characters
 *
 * @param sizeBytes - Size in bytes
 * @returns Estimated token count
 */
export declare function estimateImageTokens(sizeBytes: number): number;
/**
 * Processes an image file, resizing and compressing as needed to fit within
 * token limits.
 *
 * Note: This is a simplified implementation. The full version would use
 * a library like Sharp for actual image processing.
 *
 * @param filePath - Path to the image file
 * @param maxTokens - Maximum tokens for the image
 * @param format - Optional target format
 * @returns Image file result
 */
export declare function processImage(filePath: string, maxTokens?: number, format?: string): Promise<ImageFileResult>;
/**
 * Processes an image with aggressive compression for very large files
 *
 * @param filePath - Path to the image file
 * @param maxTokens - Maximum tokens for the image
 * @returns Image file result
 */
export declare function processLargeImage(filePath: string, maxTokens?: number): Promise<ImageFileResult>;
/**
 * Validates that a file is a supported image format
 *
 * @param filePath - Path to the file
 * @returns True if the file is a supported image
 */
export declare function isSupportedImageFormat(filePath: string): boolean;
/**
 * Gets image metadata without loading the full image
 *
 * Note: This is a simplified implementation. Full version would use Sharp.
 *
 * @param filePath - Path to the image file
 * @returns Image metadata
 */
export declare function getImageMetadata(filePath: string): Promise<ImageMetadata>;
/**
 * Converts an image to base64 data URL format
 *
 * @param filePath - Path to the image file
 * @returns Data URL string
 */
export declare function imageToDataUrl(filePath: string): string;
//# sourceMappingURL=image-processor.d.ts.map