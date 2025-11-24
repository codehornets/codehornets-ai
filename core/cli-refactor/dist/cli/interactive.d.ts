/**
 * Interactive Mode Module
 *
 * Provides interactive Claude Code session functionality.
 * Supports both single-prompt (-p) mode and full interactive REPL mode.
 * Uses OAuth web session authentication via /v1/sessions API.
 *
 * @module cli/interactive
 */
import Anthropic from '@anthropic-ai/sdk';
import type { CLIOptions, ExitCode } from './types.js';
/**
 * Interactive session options.
 */
export interface InteractiveOptions extends CLIOptions {
    /** Model to use for API calls */
    model?: string;
    /** System prompt override */
    systemPrompt?: string;
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Skip authentication check (for testing) */
    skipAuth?: boolean;
}
/**
 * Checks if any authentication is available (OAuth tokens or API key).
 *
 * @returns True if credentials are available
 */
export declare function hasCredentials(): Promise<boolean>;
/**
 * Legacy function - checks for API key only.
 * @deprecated Use hasCredentials() instead
 *
 * @returns True if API key is available
 */
export declare function hasApiKey(): boolean;
/**
 * Runs a single prompt and exits.
 * Used when the -p flag is provided.
 *
 * @param prompt - The prompt to send to Claude
 * @param options - Session options
 * @returns Exit code
 */
export declare function runSinglePrompt(prompt: string, options?: InteractiveOptions): Promise<ExitCode>;
/**
 * Runs the interactive REPL session.
 *
 * @param options - Session options
 * @returns Exit code
 */
export declare function runInteractiveSession(options?: InteractiveOptions): Promise<ExitCode>;
/**
 * Main entry point for interactive mode.
 * Determines whether to run single prompt or interactive session.
 *
 * @param prompt - Optional initial prompt (for -p mode)
 * @param options - Session options
 * @returns Exit code
 */
export declare function runInteractiveMode(prompt?: string, options?: InteractiveOptions): Promise<ExitCode>;
export declare function createClient(): Promise<Anthropic>;
export default runInteractiveMode;
//# sourceMappingURL=interactive.d.ts.map