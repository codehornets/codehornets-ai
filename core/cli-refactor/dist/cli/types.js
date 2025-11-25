/**
 * CLI Types and Interfaces
 *
 * TypeScript interfaces for CLI argument parsing, command options,
 * and execution context.
 *
 * @module cli/types
 */
/**
 * Exit codes for CLI operations.
 */
export const ExitCodes = {
    /** Successful execution */
    SUCCESS: 0,
    /** General error */
    ERROR: 1,
    /** Invalid arguments */
    INVALID_ARGS: 2,
    /** Command not found */
    NOT_FOUND: 127,
    /** Interrupted (SIGINT) */
    INTERRUPTED: 130,
};
//# sourceMappingURL=types.js.map