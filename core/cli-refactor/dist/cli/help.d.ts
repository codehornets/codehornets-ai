/**
 * CLI Help Text Generation
 *
 * Generates formatted help text for commands and subcommands.
 *
 * @module cli/help
 */
import type { CommandDefinition } from './types.js';
/**
 * Version information for the CLI.
 */
export declare const VERSION = "2.0.37";
/**
 * Package information constants.
 */
export declare const PACKAGE_INFO: {
    name: string;
    description: string;
    homepage: string;
    issues: string;
    docs: string;
};
/**
 * Generates the main CLI help text.
 *
 * @returns Formatted help string
 */
export declare function generateMainHelp(): string;
/**
 * Generates help text for the MCP command.
 *
 * @returns Formatted help string
 */
export declare function generateMCPHelp(): string;
/**
 * Generates help text for the plugin command.
 *
 * @returns Formatted help string
 */
export declare function generatePluginHelp(): string;
/**
 * Generates help text for the doctor command.
 *
 * @returns Formatted help string
 */
export declare function generateDoctorHelp(): string;
/**
 * Generates help text for the update command.
 *
 * @returns Formatted help string
 */
export declare function generateUpdateHelp(): string;
/**
 * Generates help text for a specific command definition.
 *
 * @param command - Command definition to generate help for
 * @returns Formatted help string
 */
export declare function generateCommandHelp(command: CommandDefinition): string;
/**
 * Generates version text.
 *
 * @returns Formatted version string
 */
export declare function generateVersionText(): string;
//# sourceMappingURL=help.d.ts.map