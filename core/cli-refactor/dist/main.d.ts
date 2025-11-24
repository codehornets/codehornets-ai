#!/usr/bin/env node
/**
 * Claude Code CLI - Main Entry Point
 *
 * This is the main entry point for the Claude Code CLI application.
 * It bootstraps the CLI, handles special modes (MCP CLI, ripgrep),
 * and launches the appropriate command handler.
 *
 * @module main
 */
/**
 * Checks if running in MCP CLI mode.
 * MCP CLI mode is triggered by the --mcp-cli flag and provides
 * CLI access to MCP tools within a Claude Code session.
 *
 * @returns True if running in MCP CLI mode
 */
declare function isMCPCLIMode(): boolean;
/**
 * Checks if running in ripgrep passthrough mode.
 * This mode passes arguments directly to the bundled ripgrep binary.
 *
 * @returns True if running in ripgrep mode
 */
declare function isRipgrepMode(): boolean;
/**
 * Handles MCP CLI mode execution.
 * Strips the --mcp-cli flag and runs with remaining arguments.
 *
 * @returns Exit code
 */
declare function handleMCPCLIMode(): Promise<number>;
/**
 * Handles ripgrep passthrough mode.
 * This would invoke the bundled ripgrep binary with the provided arguments.
 *
 * @returns Exit code
 */
declare function handleRipgrepMode(): Promise<number>;
/**
 * Performs startup validation checks.
 *
 * @returns True if startup validation passes
 */
declare function validateStartup(): boolean;
/**
 * Main bootstrap function.
 * This is the primary entry point that routes to appropriate handlers
 * based on command-line arguments and environment.
 */
declare function main(): Promise<void>;
export { main, isMCPCLIMode, isRipgrepMode, handleMCPCLIMode, handleRipgrepMode, validateStartup, };
export default main;
//# sourceMappingURL=main.d.ts.map