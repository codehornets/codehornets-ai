/**
 * Notebook Processor Module
 *
 * Handles Jupyter notebook (.ipynb) file processing, parsing cell structure
 * and extracting content for API consumption.
 */

import * as fs from 'fs';
import type { NotebookFileResult, NotebookCell, NotebookOutput } from './types.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum notebook content size in bytes
 */
export const MAX_NOTEBOOK_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Supported notebook formats
 */
export const SUPPORTED_NOTEBOOK_VERSIONS = [4, 4.5] as const;

// =============================================================================
// Notebook Types
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalizes cell source to a single string
 *
 * @param source - Cell source (string or array)
 * @returns Normalized string
 */
function normalizeSource(source: string | string[]): string {
  if (Array.isArray(source)) {
    return source.join('');
  }
  return source;
}

/**
 * Converts a raw cell to the processed format
 *
 * @param rawCell - Raw cell from notebook JSON
 * @returns Processed notebook cell
 */
function processCell(rawCell: RawCell): NotebookCell {
  const cell: NotebookCell = {
    cellType: rawCell.cell_type,
    source: normalizeSource(rawCell.source),
    metadata: rawCell.metadata,
  };

  if (rawCell.execution_count !== undefined) {
    cell.executionCount = rawCell.execution_count;
  }

  if (rawCell.outputs && rawCell.outputs.length > 0) {
    cell.outputs = rawCell.outputs.map(processOutput);
  }

  return cell;
}

/**
 * Converts a raw output to the processed format
 *
 * @param rawOutput - Raw output from cell
 * @returns Processed notebook output
 */
function processOutput(rawOutput: RawOutput): NotebookOutput {
  const output: NotebookOutput = {
    outputType: rawOutput.output_type,
  };

  if (rawOutput.text !== undefined) {
    output.text = Array.isArray(rawOutput.text)
      ? rawOutput.text.join('')
      : rawOutput.text;
  }

  if (rawOutput.data !== undefined) {
    output.data = rawOutput.data;
  }

  if (rawOutput.name !== undefined) {
    output.name = rawOutput.name;
  }

  if (rawOutput.ename !== undefined) {
    output.ename = rawOutput.ename;
    output.evalue = rawOutput.evalue;
    output.traceback = rawOutput.traceback;
  }

  return output;
}

// =============================================================================
// Main Processing Functions
// =============================================================================

/**
 * Parses a Jupyter notebook file and extracts its cells
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of parsed notebook cells
 */
export function parseNotebook(filePath: string): NotebookCell[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const notebook: RawNotebook = JSON.parse(content);

  // Validate notebook format
  if (!notebook.nbformat || notebook.nbformat < 4) {
    throw new Error(
      `Unsupported notebook format version: ${notebook.nbformat}. ` +
      `Supported versions: ${SUPPORTED_NOTEBOOK_VERSIONS.join(', ')}`
    );
  }

  if (!Array.isArray(notebook.cells)) {
    throw new Error('Invalid notebook: missing cells array');
  }

  return notebook.cells.map(processCell);
}

/**
 * Processes a Jupyter notebook file and returns a structured result
 *
 * @param filePath - Path to the .ipynb file
 * @returns Notebook file result
 */
export function processNotebook(filePath: string): NotebookFileResult {
  const cells = parseNotebook(filePath);

  return {
    type: 'notebook',
    filePath,
    file: {
      filePath,
      cells,
    },
  };
}

/**
 * Extracts just the code cells from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of code cell contents
 */
export function extractCodeCells(filePath: string): string[] {
  const cells = parseNotebook(filePath);

  return cells
    .filter((cell) => cell.cellType === 'code')
    .map((cell) =>
      typeof cell.source === 'string' ? cell.source : cell.source.join('')
    );
}

/**
 * Extracts just the markdown cells from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Array of markdown cell contents
 */
export function extractMarkdownCells(filePath: string): string[] {
  const cells = parseNotebook(filePath);

  return cells
    .filter((cell) => cell.cellType === 'markdown')
    .map((cell) =>
      typeof cell.source === 'string' ? cell.source : cell.source.join('')
    );
}

/**
 * Gets metadata from a notebook file
 *
 * @param filePath - Path to the .ipynb file
 * @returns Notebook metadata
 */
export function getNotebookMetadata(filePath: string): NotebookMetadata {
  const content = fs.readFileSync(filePath, 'utf8');
  const notebook: RawNotebook = JSON.parse(content);

  return notebook.metadata || {};
}

/**
 * Gets the kernel/language info from a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Language name or 'unknown'
 */
export function getNotebookLanguage(filePath: string): string {
  const metadata = getNotebookMetadata(filePath);

  return (
    metadata.language_info?.name ||
    metadata.kernelspec?.language ||
    'unknown'
  );
}

/**
 * Counts the number of cells by type in a notebook
 *
 * @param filePath - Path to the .ipynb file
 * @returns Object with cell counts by type
 */
export function countCells(filePath: string): {
  code: number;
  markdown: number;
  raw: number;
  total: number;
} {
  const cells = parseNotebook(filePath);

  const counts = {
    code: 0,
    markdown: 0,
    raw: 0,
    total: cells.length,
  };

  for (const cell of cells) {
    counts[cell.cellType]++;
  }

  return counts;
}

/**
 * Validates that a file is a Jupyter notebook
 *
 * @param filePath - Path to the file
 * @returns True if file is a valid notebook
 */
export function isValidNotebook(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const notebook: RawNotebook = JSON.parse(content);

    return (
      typeof notebook.nbformat === 'number' &&
      notebook.nbformat >= 4 &&
      Array.isArray(notebook.cells)
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a file has a notebook extension
 *
 * @param filePath - Path to the file
 * @returns True if file has .ipynb extension
 */
export function isNotebookFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.ipynb');
}

/**
 * Converts notebook cells to a tool result format
 *
 * @param cells - Array of notebook cells
 * @param toolUseId - Tool use ID for the result
 * @returns Tool result block
 */
export function cellsToToolResult(
  cells: NotebookCell[],
  toolUseId: string
): {
  tool_use_id: string;
  type: 'tool_result';
  content: Array<{ type: string; text?: string }>;
} {
  const content = cells.reduce(
    (acc: Array<{ type: string; text?: string }>, cell, index) => {
      const prefix = `[Cell ${index}] `;
      const source =
        typeof cell.source === 'string' ? cell.source : cell.source.join('');

      const textContent = { type: 'text', text: `${prefix}${source}` };

      if (acc.length === 0) {
        return [textContent];
      }

      const lastItem = acc[acc.length - 1];
      if (lastItem && lastItem.type === 'text' && lastItem.text) {
        lastItem.text += '\n' + textContent.text;
        return acc;
      }

      return [...acc, textContent];
    },
    []
  );

  return {
    tool_use_id: toolUseId,
    type: 'tool_result',
    content,
  };
}
