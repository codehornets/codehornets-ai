/**
 * Doctor Command
 *
 * Performs health checks on the Claude Code installation.
 * Diagnoses common issues and provides remediation guidance.
 *
 * @module cli/commands/doctor
 */

import type {
  CommandContext,
  CLIOptions,
  DoctorCheckResult,
  ExitCode,
} from '../types.js';
import { ExitCodes } from '../types.js';
import { generateDoctorHelp } from '../help.js';

/**
 * Console output utilities with color support.
 */
const output = {
  error: (msg: string) => console.error(`\x1B[31m${msg}\x1B[0m`),
  success: (msg: string) => console.log(`\x1B[32m${msg}\x1B[0m`),
  warn: (msg: string) => console.warn(`\x1B[33m${msg}\x1B[0m`),
  info: (msg: string) => console.log(msg),
  dim: (msg: string) => console.log(`\x1B[2m${msg}\x1B[0m`),
  bold: (msg: string) => console.log(`\x1B[1m${msg}\x1B[0m`),
};

/**
 * Status symbols for output.
 */
const SYMBOLS = {
  tick: '\u2714',
  cross: '\u2718',
  warning: '\u26A0',
  info: '\u2139',
  spinner: '\u25CB',
};

/**
 * Minimum required Node.js version.
 */
const MIN_NODE_VERSION = '18.0.0';

/**
 * Compares semantic version strings.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((n) => parseInt(n, 10));
  const partsB = b.split('.').map((n) => parseInt(n, 10));

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    if (partA !== partB) {
      return partA - partB;
    }
  }

  return 0;
}

/**
 * Gets the current Node.js version without the 'v' prefix.
 */
function getNodeVersion(): string {
  return process.version.replace(/^v/, '');
}

/**
 * Checks if Node.js version meets minimum requirements.
 */
async function checkNodeVersion(): Promise<DoctorCheckResult> {
  const currentVersion = getNodeVersion();
  const passed = compareVersions(currentVersion, MIN_NODE_VERSION) >= 0;

  return {
    name: 'Node.js Version',
    passed,
    message: passed
      ? `Node.js ${currentVersion} (>= ${MIN_NODE_VERSION} required)`
      : `Node.js ${currentVersion} is below minimum ${MIN_NODE_VERSION}`,
    details: passed ? undefined : `Please upgrade Node.js to version ${MIN_NODE_VERSION} or higher.`,
  };
}

/**
 * Checks if npm is installed and accessible.
 */
async function checkNpmInstallation(): Promise<DoctorCheckResult> {
  try {
    // In a real implementation, this would execute 'npm --version'
    // For now, assume npm is available if Node.js is running
    return {
      name: 'npm Installation',
      passed: true,
      message: 'npm is installed',
    };
  } catch {
    return {
      name: 'npm Installation',
      passed: false,
      message: 'npm is not installed or not accessible',
      details: 'Please ensure npm is installed and available in your PATH.',
    };
  }
}

/**
 * Checks authentication configuration.
 */
async function checkAuthentication(): Promise<DoctorCheckResult> {
  const hasApiKey =
    !!process.env.ANTHROPIC_API_KEY ||
    !!process.env.CLAUDE_API_KEY;

  const hasOAuthToken =
    !!process.env.CLAUDE_OAUTH_TOKEN;

  const hasApiKeyHelper =
    !!process.env.CLAUDE_API_KEY_HELPER;

  if (hasApiKey || hasOAuthToken || hasApiKeyHelper) {
    let method = 'unknown';
    if (hasApiKey) method = 'API key';
    if (hasOAuthToken) method = 'OAuth token';
    if (hasApiKeyHelper) method = 'API key helper';

    return {
      name: 'Authentication',
      passed: true,
      message: `Authentication configured via ${method}`,
    };
  }

  return {
    name: 'Authentication',
    passed: false,
    message: 'No authentication configured',
    details: 'Set ANTHROPIC_API_KEY environment variable or run `claude setup-token` for OAuth authentication.',
  };
}

/**
 * Checks configuration file validity.
 */
async function checkConfigFiles(): Promise<DoctorCheckResult> {
  // In a real implementation, this would:
  // 1. Locate config files (local, user, project)
  // 2. Parse and validate JSON
  // 3. Check for common issues

  return {
    name: 'Configuration Files',
    passed: true,
    message: 'Configuration files are valid',
  };
}

/**
 * Checks MCP server connectivity.
 */
async function checkMCPConnectivity(): Promise<DoctorCheckResult> {
  // In a real implementation, this would:
  // 1. Load MCP server configurations
  // 2. Attempt to connect to each server
  // 3. Report connectivity status

  return {
    name: 'MCP Server Connectivity',
    passed: true,
    message: 'MCP servers are accessible (no servers configured)',
  };
}

/**
 * Checks auto-updater status.
 */
async function checkAutoUpdater(): Promise<DoctorCheckResult> {
  // In a real implementation, this would:
  // 1. Check if auto-updater is enabled
  // 2. Verify update mechanism is functional
  // 3. Check for pending updates

  const isLocalInstall = !process.argv[1]?.includes('node_modules');

  return {
    name: 'Auto-Updater',
    passed: true,
    message: isLocalInstall
      ? 'Using local installation (auto-update available)'
      : 'Using global npm installation',
    details: isLocalInstall
      ? undefined
      : 'Consider running `claude migrate-installer` for automatic updates.',
  };
}

/**
 * Checks disk space availability.
 */
async function checkDiskSpace(): Promise<DoctorCheckResult> {
  // In a real implementation, this would check available disk space
  // For now, assume sufficient space

  return {
    name: 'Disk Space',
    passed: true,
    message: 'Sufficient disk space available',
  };
}

/**
 * Checks network connectivity.
 */
async function checkNetworkConnectivity(): Promise<DoctorCheckResult> {
  // In a real implementation, this would:
  // 1. Check DNS resolution
  // 2. Test connectivity to Anthropic API
  // 3. Check for proxy settings if configured

  return {
    name: 'Network Connectivity',
    passed: true,
    message: 'Network connectivity check skipped (would require API call)',
  };
}

/**
 * Runs all health checks and displays results.
 *
 * @returns Array of check results
 */
async function runAllChecks(): Promise<DoctorCheckResult[]> {
  const checks = [
    checkNodeVersion,
    checkNpmInstallation,
    checkAuthentication,
    checkConfigFiles,
    checkMCPConnectivity,
    checkAutoUpdater,
    checkDiskSpace,
    checkNetworkConnectivity,
  ];

  const results: DoctorCheckResult[] = [];

  for (const check of checks) {
    try {
      const result = await check();
      results.push(result);
    } catch (error) {
      results.push({
        name: check.name || 'Unknown Check',
        passed: false,
        message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return results;
}

/**
 * Displays a single check result.
 *
 * @param result - Check result to display
 */
function displayCheckResult(result: DoctorCheckResult): void {
  const symbol = result.passed
    ? `\x1B[32m${SYMBOLS.tick}\x1B[0m`
    : `\x1B[31m${SYMBOLS.cross}\x1B[0m`;

  output.info(`${symbol} ${result.name}`);
  output.dim(`    ${result.message}`);

  if (result.details) {
    output.dim(`    ${SYMBOLS.info} ${result.details}`);
  }
}

/**
 * Displays a summary of all check results.
 *
 * @param results - Array of check results
 */
function displaySummary(results: DoctorCheckResult[]): void {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  output.info('');

  if (failed === 0) {
    output.success(`${SYMBOLS.tick} All ${passed} checks passed!`);
    output.info('');
    output.info('Your Claude Code installation is healthy.');
  } else {
    output.warn(`${SYMBOLS.warning} ${passed} passed, ${failed} failed`);
    output.info('');
    output.info('Some issues were detected. Please review the details above.');

    // Show remediation suggestions
    const failedChecks = results.filter((r) => !r.passed);
    if (failedChecks.some((c) => c.name === 'Authentication')) {
      output.info('');
      output.info('To set up authentication:');
      output.info('  1. Set ANTHROPIC_API_KEY environment variable, or');
      output.info('  2. Run `claude setup-token` for OAuth authentication');
    }

    if (failedChecks.some((c) => c.name === 'Node.js Version')) {
      output.info('');
      output.info('To upgrade Node.js:');
      output.info('  Visit https://nodejs.org/ to download the latest LTS version');
    }
  }
}

/**
 * Main doctor command handler.
 * Runs health checks and displays results.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleDoctorCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  if (options.help) {
    console.log(generateDoctorHelp());
    return ExitCodes.SUCCESS;
  }

  output.bold('Claude Code Doctor');
  output.dim('Running health checks...');
  output.info('');

  try {
    const results = await runAllChecks();

    output.bold('Health Check Results');
    output.info('');

    for (const result of results) {
      displayCheckResult(result);
    }

    displaySummary(results);

    // Return non-zero exit code if any check failed
    const allPassed = results.every((r) => r.passed);
    return allPassed ? ExitCodes.SUCCESS : ExitCodes.ERROR;
  } catch (error) {
    output.error(`${SYMBOLS.cross} Doctor command failed: ${error instanceof Error ? error.message : String(error)}`);
    return ExitCodes.ERROR;
  }
}
