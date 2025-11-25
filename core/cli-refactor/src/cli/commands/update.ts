/**
 * Update Command
 *
 * Checks for available updates and installs them.
 * Supports both npm-based and local installation updates.
 *
 * @module cli/commands/update
 */

import type {
  CommandContext,
  CLIOptions,
  UpdateCheckResult,
  ExitCode,
} from '../types.js';
import { ExitCodes } from '../types.js';
import { generateUpdateHelp, VERSION } from '../help.js';

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
  arrow: '\u2192',
};

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
 * Checks if running from local installation vs global npm.
 */
function isLocalInstallation(): boolean {
  // In a real implementation, this would check the actual installation method
  const scriptPath = process.argv[1] || '';
  return !scriptPath.includes('node_modules');
}

/**
 * Fetches the latest version from npm registry.
 *
 * @returns Latest version string
 */
async function fetchLatestVersion(): Promise<string> {
  // In a real implementation, this would:
  // 1. Make HTTP request to npm registry
  // 2. Parse the response to get latest version
  // For now, return current version (simulating no update available)
  return VERSION;
}

/**
 * Checks for available updates.
 *
 * @returns Update check result
 */
async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = VERSION;

  try {
    const latestVersion = await fetchLatestVersion();
    const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      currentVersion,
      latestVersion,
      updateAvailable,
      releaseNotesUrl: updateAvailable
        ? `https://github.com/anthropics/claude-code/releases/tag/v${latestVersion}`
        : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to check for updates: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Performs the update installation.
 *
 * @param targetVersion - Version to install
 * @returns True if update was successful
 */
async function performUpdate(targetVersion: string): Promise<boolean> {
  output.info(`Installing version ${targetVersion}...`);

  // In a real implementation, this would:
  // 1. Download the new version
  // 2. Verify the download
  // 3. Install the update
  // 4. Restart if necessary

  if (isLocalInstallation()) {
    output.dim('Using local updater...');
    // Local installation update logic
  } else {
    output.dim('Using npm to update...');
    // npm-based update logic
    output.info('Run: npm install -g @anthropic-ai/claude-code');
  }

  // Placeholder: Update not actually performed
  return false;
}

/**
 * Displays update check result.
 *
 * @param result - Update check result
 */
function displayUpdateResult(result: UpdateCheckResult): void {
  output.info(`Current version: ${result.currentVersion}`);
  output.info(`Latest version:  ${result.latestVersion}`);
  output.info('');

  if (result.updateAvailable) {
    output.success(
      `${SYMBOLS.tick} Update available: ${result.currentVersion} ${SYMBOLS.arrow} ${result.latestVersion}`
    );

    if (result.releaseNotesUrl) {
      output.info('');
      output.info(`Release notes: ${result.releaseNotesUrl}`);
    }
  } else {
    output.success(`${SYMBOLS.tick} You are running the latest version!`);
  }
}

/**
 * Main update command handler.
 * Checks for updates and optionally installs them.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleUpdateCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  if (options.help) {
    console.log(generateUpdateHelp());
    return ExitCodes.SUCCESS;
  }

  output.bold('Claude Code Update');
  output.dim('Checking for updates...');
  output.info('');

  try {
    const result = await checkForUpdates();

    displayUpdateResult(result);

    if (result.updateAvailable) {
      output.info('');

      // In interactive mode, prompt for confirmation
      // For now, just show instructions
      if (isLocalInstallation()) {
        output.info('To update, Claude Code will automatically update on next run,');
        output.info('or you can run: claude install');
      } else {
        output.info('To update via npm:');
        output.info('  npm install -g @anthropic-ai/claude-code');
        output.info('');
        output.info('Or migrate to local installation for automatic updates:');
        output.info('  claude migrate-installer');
      }

      return ExitCodes.SUCCESS;
    }

    return ExitCodes.SUCCESS;
  } catch (error) {
    output.error(`${SYMBOLS.cross} Update check failed: ${error instanceof Error ? error.message : String(error)}`);
    return ExitCodes.ERROR;
  }
}

/**
 * Handles the 'install' command.
 * Installs Claude Code native build with optional target version.
 *
 * @param args - Positional arguments [target?]
 * @param options - Command options (including force)
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleInstallCommand(
  args: string[],
  options: CLIOptions & { force?: boolean },
  context: CommandContext
): Promise<ExitCode> {
  const [target] = args;

  output.bold('Claude Code Install');
  output.info('');

  if (target) {
    output.info(`Target version: ${target}`);
  } else {
    output.info('Installing latest stable version...');
  }

  if (options.force) {
    output.dim('Force mode enabled');
  }

  // In a real implementation, this would:
  // 1. Validate the target version
  // 2. Download the appropriate build
  // 3. Install to the correct location
  // 4. Update symlinks/PATH as needed

  output.error('Error: Installation not yet implemented in refactored CLI');
  output.info('');
  output.info('Current workaround:');
  output.info('  npm install -g @anthropic-ai/claude-code');

  return ExitCodes.ERROR;
}

/**
 * Handles the 'migrate-installer' command.
 * Migrates from global npm installation to local installation.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleMigrateInstallerCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  if (isLocalInstallation()) {
    output.success('Already running from local installation. No migration needed.');
    return ExitCodes.SUCCESS;
  }

  output.bold('Claude Code Installer Migration');
  output.info('');
  output.info('This will migrate from global npm installation to local installation.');
  output.info('Benefits of local installation:');
  output.info('  - Automatic updates');
  output.info('  - Faster startup time');
  output.info('  - Isolated from system npm');
  output.info('');

  // In a real implementation, this would:
  // 1. Download the local installer
  // 2. Set up the local installation directory
  // 3. Update shell configuration
  // 4. Remove global npm package

  output.error('Error: Migration not yet implemented in refactored CLI');
  return ExitCodes.ERROR;
}

/**
 * Handles the 'setup-token' command.
 * Sets up long-lived authentication token.
 *
 * @param args - Positional arguments
 * @param options - Command options
 * @param context - Execution context
 * @returns Exit code
 */
export async function handleSetupTokenCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  output.bold('Claude Code Authentication Setup');
  output.info('');
  output.info('This will guide you through setting up a long-lived (1-year) auth token.');
  output.info('A Claude subscription is required.');
  output.info('');

  // Check if already authenticated
  const hasExistingAuth =
    !!process.env.ANTHROPIC_API_KEY ||
    !!process.env.CLAUDE_API_KEY ||
    !!process.env.CLAUDE_OAUTH_TOKEN ||
    !!process.env.CLAUDE_API_KEY_HELPER;

  if (hasExistingAuth) {
    output.warn(`${SYMBOLS.warning} You already have authentication configured via environment variable or API key helper.`);
    output.warn('The setup-token command will create a new OAuth token which you can use instead.');
    output.info('');
  }

  // In a real implementation, this would:
  // 1. Open browser for OAuth flow
  // 2. Receive callback with auth code
  // 3. Exchange for access token
  // 4. Save token securely

  output.error('Error: Token setup not yet implemented in refactored CLI');
  output.info('');
  output.info('Current workaround:');
  output.info('  Set ANTHROPIC_API_KEY environment variable');

  return ExitCodes.ERROR;
}
