/**
 * Image Processor Module
 *
 * Handles image file processing including resizing, compression, and
 * format conversion for API consumption.
 */
import * as fs from 'fs';
import * as path from 'path';
// =============================================================================
// Constants
// =============================================================================
/**
 * Default maximum tokens for image content
 */
export const DEFAULT_MAX_IMAGE_TOKENS = 25000;
/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
/**
 * Image resize quality levels
 */
export const QUALITY_LEVELS = {
    high: { scale: 1, quality: 80 },
    medium: { scale: 0.75, quality: 70 },
    low: { scale: 0.5, quality: 60 },
    minimal: { scale: 0.25, quality: 50 },
};
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Creates an image result object
 *
 * @param buffer - Image buffer (base64 encoded)
 * @param format - Image format
 * @param originalSize - Original file size in bytes
 * @returns Image file result
 */
function createImageResult(buffer, format, originalSize) {
    const mediaType = `image/${format === 'jpg' ? 'jpeg' : format}`;
    return {
        type: 'image',
        filePath: '',
        file: {
            base64: buffer.toString('base64'),
            type: mediaType,
            originalSize,
        },
    };
}
/**
 * Gets the file extension as a normalized image format
 *
 * @param filePath - Path to the file
 * @returns Normalized format string
 */
export function getImageFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return ext === 'jpg' ? 'jpeg' : ext;
}
/**
 * Calculates the estimated token count for an image
 * Based on base64 encoding overhead: 1 byte = ~1.33 base64 chars
 * Rough estimate: 1 token per 8 characters
 *
 * @param sizeBytes - Size in bytes
 * @returns Estimated token count
 */
export function estimateImageTokens(sizeBytes) {
    const base64Length = Math.ceil(sizeBytes * 1.33);
    return Math.ceil(base64Length / 8);
}
// =============================================================================
// Main Processing Functions
// =============================================================================
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
export async function processImage(filePath, maxTokens = DEFAULT_MAX_IMAGE_TOKENS, format) {
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    if (originalSize === 0) {
        throw new Error(`Image file is empty: ${filePath}`);
    }
    // Read the raw image data
    const imageBuffer = fs.readFileSync(filePath);
    const imageFormat = format || getImageFormat(filePath);
    // Calculate max bytes based on token limit
    // base64 encoding: 3 bytes -> 4 chars, roughly 1 token per 8 chars
    // So max bytes = maxTokens * 8 * 3/4 * 0.75 (buffer)
    const maxBytes = Math.floor(maxTokens * 8 * 0.75 * 0.75);
    // If image is already small enough, return as-is
    if (imageBuffer.length <= maxBytes) {
        return createImageResult(imageBuffer, imageFormat, originalSize);
    }
    // For now, return the image as-is with a warning
    // In a full implementation, we would use Sharp to resize
    console.warn(`Image at ${filePath} exceeds token limit. ` +
        `Consider using Sharp for image processing.`);
    return createImageResult(imageBuffer, imageFormat, originalSize);
}
/**
 * Processes an image with aggressive compression for very large files
 *
 * @param filePath - Path to the image file
 * @param maxTokens - Maximum tokens for the image
 * @returns Image file result
 */
export async function processLargeImage(filePath, maxTokens = DEFAULT_MAX_IMAGE_TOKENS) {
    // Try standard processing first
    const result = await processImage(filePath, maxTokens);
    // If still too large, fall back to even more aggressive settings
    const estimatedTokens = estimateImageTokens(Buffer.from(result.file.base64, 'base64').length);
    if (estimatedTokens > maxTokens) {
        // In a full implementation, apply more aggressive compression
        console.warn(`Large image at ${filePath} may exceed token limits. ` +
            `Estimated tokens: ${estimatedTokens}, max: ${maxTokens}`);
    }
    return result;
}
/**
 * Validates that a file is a supported image format
 *
 * @param filePath - Path to the file
 * @returns True if the file is a supported image
 */
export function isSupportedImageFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return SUPPORTED_IMAGE_FORMATS.includes(ext);
}
/**
 * Gets image metadata without loading the full image
 *
 * Note: This is a simplified implementation. Full version would use Sharp.
 *
 * @param filePath - Path to the image file
 * @returns Image metadata
 */
export async function getImageMetadata(filePath) {
    // Simplified implementation - returns basic info
    const stats = fs.statSync(filePath);
    const format = getImageFormat(filePath);
    return {
        width: 0, // Would need Sharp to get actual dimensions
        height: 0,
        format,
        channels: format === 'png' || format === 'gif' ? 4 : 3,
        hasAlpha: format === 'png' || format === 'gif' || format === 'webp',
    };
}
/**
 * Converts an image to base64 data URL format
 *
 * @param filePath - Path to the image file
 * @returns Data URL string
 */
export function imageToDataUrl(filePath) {
    const buffer = fs.readFileSync(filePath);
    const format = getImageFormat(filePath);
    const mediaType = format === 'jpg' ? 'jpeg' : format;
    return `data:image/${mediaType};base64,${buffer.toString('base64')}`;
}
//# sourceMappingURL=image-processor.js.map