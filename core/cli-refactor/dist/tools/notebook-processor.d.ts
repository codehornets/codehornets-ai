/**
 * Notebook Processor Module
 *
 * Handles Jupyter notebook (.ipynb) file processing, parsing cell structure
 * and extracting content for API consumption.
 */
import type { NotebookFileResult, NotebookCell } from './types.js';
/**
 * Maximum notebook content size in bytes
 */
export declare const MAX_NOTEBOOK_SIZE_BYTES: number;
/**
 * Supported notebook formats
 */
export declare const SUPPORTED_NOTEBOOK_VERSIONS: readonly [4, 4.5];
export interface NotebookMetadata {
    kernelspec?: {
        name: string;
        display_name: string;
        language?: string;
    };
    language_info?: {
        name: string;
        version?: string;
        file_extension?: string;
    };
    [key: string]: unknown;
}
export interface RawNotebook {
    nbformat: number;
    nbformat_minor: number;
    metadata: NotebookMetadata;
    cells: RawCell[];
}
export interface RawCell {
    cell_type: 'code' | 'markdown' | 'raw';
    source: string | string[];
    metadata?: Record<string, unknown>;
    execution_count?: number | null;
    outputs?: RawOutput[];
}
export interface RawOutput {
    output_type: string;
    text?: string | string[];
    data?: Record<string, unknown>;
    name?: string;
    ename?: string;
    evalue?: string;
    traceback?: string[];
}
/**
 * Parses a Jupyter notebook file and extracts its cells
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of parsed notebook cells
 */
export declare function parseNotebook(filePath: string): NotebookCell[];
/**
 * Processes a Jupyter notebook file and returns a structured result
 *
 * @param filePath - Path to the .ipynb file
 * @returns Notebook file result
 */
export declare function processNotebook(filePath: string): NotebookFileResult;
/**
 * Extracts just the code cells from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of code cell contents
 */
export declare function extractCodeCells(filePath: string): string[];
/**
 * Extracts just the markdown cells from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of markdown cell contents
 */
export declare function extractMarkdownCells(filePath: string): string[];
/**
 * Gets metadata from a notebook file
 *
 * @param filePath - Path to the .ipynb file
 * @returns Notebook metadata
 */
export declare function getNotebookMetadata(filePath: string): NotebookMetadata;
/**
 * Gets the kernel/language info from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Language name or 'unknown'
 */
export declare function getNotebookLanguage(filePath: string): string;
/**
 * Counts the number of cells by type in a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Object with cell counts by type
 */
export declare function countCells(filePath: string): {
    code: number;
    markdown: number;
    raw: number;
    total: number;
};
/**
 * Validates that a file is a Jupyter notebook
 *
 * @param filePath - Path to the file
 * @returns True if file is a valid notebook
 */
export declare function isValidNotebook(filePath: string): boolean;
/**
 * Checks if a file has a notebook extension
 *
 * @param filePath - Path to the file
 * @returns True if file has .ipynb extension
 */
export declare function isNotebookFile(filePath: string): boolean;
/**
 * Converts notebook cells to a tool result format
 *
 * @param cells - Array of notebook cells
 * @param toolUseId - Tool use ID for the result
 * @returns Tool result block
 */
export declare function cellsToToolResult(cells: NotebookCell[], toolUseId: string): {
    tool_use_id: string;
    type: 'tool_result';
    content: Array<{
        type: string;
        text?: string;
    }>;
};
//# sourceMappingURL=notebook-processor.d.ts.map