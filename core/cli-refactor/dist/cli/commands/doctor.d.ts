/**
 * Doctor Command
 *
 * Performs health checks on the Claude Code installation.
 * Diagnoses common issues and provides remediation guidance.
 *
 * @module cli/commands/doctor
 */
import type { CommandContext, CLIOptions, ExitCode } from '../types.js';
/**
 * Main doctor command handler.
 * Runs health checks and displays results.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export declare function handleDoctorCommand(args: string[], options: CLIOptions, context: CommandContext): Promise<ExitCode>;
//# sourceMappingURL=doctor.d.ts.map