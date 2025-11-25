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
import { runAndExit, run, ExitCodes } from './cli/index.js';
/**
 * Checks if running in MCP CLI mode.
 * MCP CLI mode is triggered by the --mcp-cli flag and provides
 * CLI access to MCP tools within a Claude Code session.
 *
 * @returns True if running in MCP CLI mode
 */
function isMCPCLIMode() {
    return (!!process.env.CLAUDE_CODE_SESSION_ID &&
        process.argv[2] === '--mcp-cli');
}
/**
 * Checks if running in ripgrep passthrough mode.
 * This mode passes arguments directly to the bundled ripgrep binary.
 *
 * @returns True if running in ripgrep mode
 */
function isRipgrepMode() {
    return process.argv[2] === '--ripgrep';
}
/**
 * Handles MCP CLI mode execution.
 * Strips the --mcp-cli flag and runs with remaining arguments.
 *
 * @returns Exit code
 */
async function handleMCPCLIMode() {
    // Remove --mcp-cli from arguments
    const args = process.argv.slice(3);
    // Prepend 'mcp' to route through MCP command handler
    // This handles subcommands like 'servers', 'tools', 'call', etc.
    return run(['mcp', ...args]);
}
/**
 * Handles ripgrep passthrough mode.
 * This would invoke the bundled ripgrep binary with the provided arguments.
 *
 * @returns Exit code
 */
async function handleRipgrepMode() {
    const args = process.argv.slice(3);
    // In a real implementation, this would:
    // 1. Locate the bundled ripgrep binary
    // 2. Spawn it with the provided arguments
    // 3. Stream stdout/stderr
    // 4. Return the exit code
    console.error('Error: Ripgrep passthrough not yet implemented in refactored CLI');
    console.error('Arguments would be:', args.join(' '));
    return ExitCodes.ERROR;
}
/**
 * Performs startup validation checks.
 *
 * @returns True if startup validation passes
 */
function validateStartup() {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
    if (majorVersion < 18) {
        console.error(`Error: Node.js 18 or higher is required. Current version: ${nodeVersion}`);
        return false;
    }
    return true;
}
/**
 * Sets up global error handlers.
 */
function setupGlobalHandlers() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Promise Rejection:');
        console.error(reason);
        if (process.env.DEBUG) {
            console.error('Promise:', promise);
        }
        process.exit(ExitCodes.ERROR);
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:');
        console.error(error.message);
        if (process.env.DEBUG && error.stack) {
            console.error(error.stack);
        }
        process.exit(ExitCodes.ERROR);
    });
}
/**
 * Disables corepack auto-pinning.
 * This prevents issues with package manager version conflicts.
 */
function configureCorepack() {
    process.env.COREPACK_ENABLE_AUTO_PIN = '0';
}
/**
 * Main bootstrap function.
 * This is the primary entry point that routes to appropriate handlers
 * based on command-line arguments and environment.
 */
async function main() {
    // Configure environment
    configureCorepack();
    // Set up global error handlers
    setupGlobalHandlers();
    // Validate startup requirements
    if (!validateStartup()) {
        process.exit(ExitCodes.ERROR);
    }
    // Handle special modes
    if (isMCPCLIMode()) {
        const exitCode = await handleMCPCLIMode();
        process.exit(exitCode);
    }
    if (isRipgrepMode()) {
        const exitCode = await handleRipgrepMode();
        process.exit(exitCode);
    }
    // Normal CLI execution
    await runAndExit();
}
// Export for testing and programmatic usage
export { main, isMCPCLIMode, isRipgrepMode, handleMCPCLIMode, handleRipgrepMode, validateStartup, };
// Default export
export default main;
// Run main if this is the entry point
// Note: In ESM, we detect if this module is the main module
const isMainModule = process.argv[1]?.endsWith('main.ts') ||
    process.argv[1]?.endsWith('main.js') ||
    process.argv[1]?.endsWith('cli.js');
if (isMainModule) {
    main().catch((error) => {
        console.error('Fatal error during startup:');
        console.error(error);
        process.exit(ExitCodes.ERROR);
    });
}
//# sourceMappingURL=main.js.map