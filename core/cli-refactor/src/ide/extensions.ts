/**
 * IDE Extension Installation
 *
 * Handles automatic installation and management of Claude Code extensions
 * for VS Code variants (VS Code, Cursor, Windsurf) and JetBrains IDEs.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExtensionInstallResult, IdeType } from './types.js';
import { isVsCodeIde, isJetBrainsIde, getPlatform } from './detector.js';

/**
 * The extension identifier for the Claude Code VS Code extension
 */
export const VSCODE_EXTENSION_ID = 'anthropic.claude-code';

/**
 * Gets the current Claude Code version.
 *
 * @returns The version string
 */
export function getClaudeCodeVersion(): string {
  // This would normally come from package.json
  // For now, return a placeholder that can be updated
  return process.env.CLAUDE_CODE_VERSION || '2.0.0';
}

/**
 * Executes a command and returns the result.
 *
 * @param command - The command to execute
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Promise with command result
 */
async function executeCommand(
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string; code: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      const { spawnSync } = require('node:child_process');
      const result = spawnSync(command, args, {
        encoding: 'utf8',
        shell: true,
        env: options?.env ?? process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      resolve({
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        code: result.status ?? (result.error ? 1 : 0),
        error: result.error?.message,
      });
    } catch (error) {
      resolve({
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        code: 1,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Gets the environment variables for VS Code CLI commands.
 *
 * On Linux, clears the DISPLAY variable to prevent GUI issues.
 *
 * @returns Environment variables object or undefined
 */
function getVsCodeEnv(): NodeJS.ProcessEnv | undefined {
  const platform = getPlatform();
  if (platform === 'linux') {
    return {
      ...process.env,
      DISPLAY: '',
    };
  }
  return undefined;
}

/**
 * Finds the VS Code CLI executable path for the given IDE type.
 *
 * On macOS, attempts to detect the path from the parent process chain.
 *
 * @param ideType - The VS Code variant type
 * @returns The CLI executable path or null
 */
export function findVsCodeCli(ideType: IdeType): string | null {
  // Try to find CLI from parent process on macOS
  const macOsCliPath = findMacOsVsCodeCli();
  if (macOsCliPath && existsSync(macOsCliPath)) {
    return macOsCliPath;
  }

  // Fall back to default CLI commands
  switch (ideType) {
    case 'vscode':
      return 'code';
    case 'cursor':
      return 'cursor';
    case 'windsurf':
      return 'windsurf';
    default:
      return null;
  }
}

/**
 * Attempts to find the VS Code CLI path by walking up the macOS process tree.
 *
 * @returns The CLI path or null if not found
 */
function findMacOsVsCodeCli(): string | null {
  const platform = getPlatform();
  if (platform !== 'macos') {
    return null;
  }

  try {
    const appMappings: Record<string, string> = {
      'Visual Studio Code.app': 'code',
      'Cursor.app': 'cursor',
      'Windsurf.app': 'windsurf',
      'Visual Studio Code - Insiders.app': 'code',
      'VSCodium.app': 'codium',
    };

    let ppid = process.ppid;

    // Walk up process tree (max 10 levels)
    for (let i = 0; i < 10; i++) {
      if (!ppid || ppid === 0 || ppid === 1) {
        break;
      }

      // Get the command for this process
      const cmdOutput = execSync(`ps -o command= -p ${ppid}`, {
        encoding: 'utf8',
      })?.trim();

      if (cmdOutput) {
        // Look for known app bundles
        for (const [appName, cliName] of Object.entries(appMappings)) {
          const marker = `${appName}/Contents/MacOS/Electron`;
          const index = cmdOutput.indexOf(marker);
          if (index !== -1) {
            const bundleEnd = index + appName.length;
            return (
              cmdOutput.substring(0, bundleEnd) +
              `/Contents/Resources/app/bin/${cliName}`
            );
          }
        }
      }

      // Get parent PID
      const ppidOutput = execSync(`ps -o ppid= -p ${ppid}`, {
        encoding: 'utf8',
      })?.trim();

      if (!ppidOutput) {
        break;
      }
      ppid = parseInt(ppidOutput, 10);
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Gets the currently installed version of the Claude Code VS Code extension.
 *
 * @param cliPath - Path to the VS Code CLI
 * @returns Promise resolving to the version string or null
 */
export async function getInstalledVsCodeExtensionVersion(
  cliPath: string
): Promise<string | null> {
  const result = await executeCommand(
    cliPath,
    ['--list-extensions', '--show-versions'],
    { env: getVsCodeEnv() }
  );

  const lines = result.stdout?.split('\n') ?? [];
  for (const line of lines) {
    const [extensionId, version] = line.split('@');
    if (extensionId === VSCODE_EXTENSION_ID && version) {
      return version;
    }
  }

  return null;
}

/**
 * Checks if the Claude Code extension is installed for the given IDE.
 *
 * @param ideType - The IDE type to check
 * @returns Promise resolving to true if installed
 *
 * @example
 * ```typescript
 * const isInstalled = await isExtensionInstalled('vscode');
 * // Returns: true if extension is installed
 * ```
 */
export async function isExtensionInstalled(ideType: IdeType): Promise<boolean> {
  if (isVsCodeIde(ideType)) {
    const cliPath = findVsCodeCli(ideType);
    if (cliPath) {
      try {
        const result = await executeCommand(
          cliPath,
          ['--list-extensions'],
          { env: getVsCodeEnv() }
        );
        return result.stdout?.includes(VSCODE_EXTENSION_ID) ?? false;
      } catch {
        return false;
      }
    }
  } else if (isJetBrainsIde(ideType)) {
    return isJetBrainsPluginInstalled(ideType);
  }

  return false;
}

/**
 * Checks if the JetBrains plugin is installed.
 *
 * @param ideType - The JetBrains IDE type
 * @returns True if the plugin is installed
 */
function isJetBrainsPluginInstalled(_ideType: IdeType): boolean {
  // JetBrains plugin installation check would require
  // scanning plugin directories - implementation depends on
  // the specific plugin distribution mechanism
  return false;
}

/**
 * Installs the Claude Code VS Code extension.
 *
 * @param cliPath - Path to the VS Code CLI
 * @returns Promise resolving to the installed version
 */
async function installVsCodeExtension(cliPath: string): Promise<string> {
  // Wait a bit before installing (allows VS Code to settle)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const result = await executeCommand(
    cliPath,
    ['--force', '--install-extension', VSCODE_EXTENSION_ID],
    { env: getVsCodeEnv() }
  );

  if (result.code !== 0) {
    throw new Error(`${result.code}: ${result.error} ${result.stderr}`);
  }

  return getClaudeCodeVersion();
}

/**
 * Installs the Claude Code JetBrains plugin.
 *
 * @param ideType - The JetBrains IDE type
 * @param pluginPath - Path to the plugin directory
 * @returns Promise resolving to the installed version or null
 */
async function installJetBrainsPlugin(
  _ideType: IdeType,
  _pluginPath: string
): Promise<string | null> {
  // JetBrains plugin installation would be handled here
  // Implementation depends on the plugin distribution mechanism
  return null;
}

/**
 * Installs the Claude Code extension for the given IDE.
 *
 * For VS Code variants, uses the CLI to install the extension.
 * For JetBrains IDEs, copies the plugin to the plugins directory.
 *
 * @param ideType - The IDE type to install for
 * @returns Promise resolving to installation result
 *
 * @example
 * ```typescript
 * const result = await installIdeExtension('vscode');
 * if (result.installed) {
 *   console.log('Installed version:', result.installedVersion);
 * }
 * ```
 */
export async function installIdeExtension(
  ideType: IdeType
): Promise<ExtensionInstallResult> {
  try {
    let installedVersion: string | null = null;

    if (isVsCodeIde(ideType)) {
      const cliPath = findVsCodeCli(ideType);
      if (cliPath) {
        const currentVersion = await getInstalledVsCodeExtensionVersion(cliPath);
        const targetVersion = getClaudeCodeVersion();

        // Only install if not already at target version
        if (!currentVersion || compareVersions(currentVersion, targetVersion) < 0) {
          installedVersion = await installVsCodeExtension(cliPath);
        } else {
          installedVersion = currentVersion;
        }
      }
    } else if (isJetBrainsIde(ideType)) {
      // Get plugin path relative to this module
      const platform = getPlatform();
      if (platform !== 'wsl') {
        const moduleDir = resolve(fileURLToPath(import.meta.url), '../');
        const pluginPath = resolve(
          moduleDir,
          'vendor',
          'claude-code-jetbrains-plugin'
        );
        installedVersion = await installJetBrainsPlugin(ideType, pluginPath);
      }
    }

    return {
      installed: true,
      error: null,
      installedVersion,
      ideType,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      installed: false,
      error: errorMessage,
      installedVersion: null,
      ideType,
    };
  }
}

/**
 * Compares two semantic version strings.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) {
      return numA - numB;
    }
  }

  return 0;
}

/**
 * Checks if the VS Code CLI is available.
 *
 * @returns True if VS Code CLI is available
 */
export function isVsCodeCliAvailable(): boolean {
  try {
    const result = execSync('code --help', { encoding: 'utf8' });
    return Boolean(result && result.includes('Visual Studio Code'));
  } catch {
    return false;
  }
}

/**
 * Checks if the Cursor CLI is available.
 *
 * @returns True if Cursor CLI is available
 */
export function isCursorCliAvailable(): boolean {
  try {
    execSync('cursor --version', { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the Windsurf CLI is available.
 *
 * @returns True if Windsurf CLI is available
 */
export function isWindsurfCliAvailable(): boolean {
  try {
    execSync('windsurf --version', { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}
