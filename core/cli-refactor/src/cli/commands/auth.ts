/**
 * Authentication Commands
 *
 * Handles login, logout, and auth status commands.
 *
 * @module cli/commands/auth
 */

import type { CLIOptions, ExitCode, CommandContext } from '../types.js';
import { ExitCodes } from '../types.js';
import {
  authenticate,
  logout as authLogout,
  readCredentials,
  isAuthenticated,
  getOAuthConfig,
} from '../../core/auth.js';
import { cyan, green, red, yellow, dim, bold } from '../../core/terminal.js';

/**
 * Handles the login command.
 * Opens browser for OAuth authentication.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export async function handleLoginCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  // Check for help flag
  if (options.help) {
    console.log(generateLoginHelp());
    return ExitCodes.SUCCESS;
  }

  // Check if already authenticated
  if (await isAuthenticated()) {
    const credentials = readCredentials();
    const email = credentials.oauthAccount?.emailAddress;

    console.log(yellow('You are already authenticated.'));
    if (email) {
      console.log(dim(`  Account: ${email}`));
    }
    console.log(dim('\nUse "claude logout" to sign out first.'));
    return ExitCodes.SUCCESS;
  }

  // Determine authentication method
  const useClaudeAi = args.includes('--claude-ai');

  console.log(bold('Authenticating with Anthropic...\n'));

  try {
    const tokens = await authenticate({ useClaudeAi });

    console.log(green('\nAuthentication successful!'));
    console.log(dim(`  Token expires: ${new Date(tokens.expiresAt).toLocaleString()}`));

    return ExitCodes.SUCCESS;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(red(`\nAuthentication failed: ${message}`));

    if (process.env.DEBUG || process.env.CLAUDE_DEBUG) {
      if (error instanceof Error && error.stack) {
        console.error(dim(error.stack));
      }
    }

    return ExitCodes.ERROR;
  }
}

/**
 * Handles the logout command.
 * Clears stored OAuth tokens.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export async function handleLogoutCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  // Check for help flag
  if (options.help) {
    console.log(generateLogoutHelp());
    return ExitCodes.SUCCESS;
  }

  // Check if authenticated
  if (!(await isAuthenticated())) {
    console.log(yellow('You are not currently authenticated.'));
    return ExitCodes.SUCCESS;
  }

  // Perform logout
  authLogout();
  console.log(green('Successfully logged out.'));

  return ExitCodes.SUCCESS;
}

/**
 * Handles the auth status command.
 * Shows current authentication status.
 *
 * @param args - Command arguments
 * @param options - CLI options
 * @param context - Command context
 * @returns Exit code
 */
export async function handleAuthStatusCommand(
  args: string[],
  options: CLIOptions,
  context: CommandContext
): Promise<ExitCode> {
  // Check for help flag
  if (options.help) {
    console.log(generateAuthStatusHelp());
    return ExitCodes.SUCCESS;
  }

  const credentials = readCredentials();
  const hasEnvKey = !!process.env.ANTHROPIC_API_KEY;
  const config = getOAuthConfig();

  console.log(bold('Authentication Status\n'));

  // API Key status
  if (hasEnvKey) {
    console.log(green('API Key:'));
    console.log(dim('  Set via ANTHROPIC_API_KEY environment variable'));
    console.log();
  }

  // OAuth status
  if (credentials.oauthTokens) {
    const expiresAt = new Date(credentials.oauthTokens.expiresAt);
    const isExpired = Date.now() >= credentials.oauthTokens.expiresAt;

    console.log(green('OAuth:'));
    console.log(`  Status: ${isExpired ? yellow('Expired') : green('Authenticated')}`);
    console.log(dim(`  Expires: ${expiresAt.toLocaleString()}`));

    if (credentials.oauthAccount) {
      if (credentials.oauthAccount.emailAddress) {
        console.log(dim(`  Account: ${credentials.oauthAccount.emailAddress}`));
      }
      if (credentials.oauthAccount.displayName) {
        console.log(dim(`  Name: ${credentials.oauthAccount.displayName}`));
      }
      if (credentials.oauthAccount.organizationName) {
        console.log(dim(`  Organization: ${credentials.oauthAccount.organizationName}`));
      }
    }

    console.log();
  }

  // No authentication
  if (!hasEnvKey && !credentials.oauthTokens) {
    console.log(yellow('Not authenticated'));
    console.log(dim('\nRun "claude login" to authenticate.'));
  }

  // Show environment info
  if (process.env.CLAUDE_CODE_LOCAL_OAUTH === '1') {
    console.log(dim('\nUsing local development OAuth endpoints'));
  }

  return ExitCodes.SUCCESS;
}

/**
 * Generates help text for the login command.
 *
 * @returns Help text
 */
function generateLoginHelp(): string {
  return `
${bold('claude login')} - Authenticate with Anthropic

${bold('USAGE')}
  claude login [options]

${bold('DESCRIPTION')}
  Opens a browser window to authenticate with your Anthropic account.
  After successful authentication, your credentials are stored locally
  and used for API requests.

${bold('OPTIONS')}
  --claude-ai    Use claude.ai for authentication instead of console.anthropic.com
  --help         Show this help message

${bold('EXAMPLES')}
  claude login
  claude login --claude-ai
`;
}

/**
 * Generates help text for the logout command.
 *
 * @returns Help text
 */
function generateLogoutHelp(): string {
  return `
${bold('claude logout')} - Sign out from Anthropic

${bold('USAGE')}
  claude logout

${bold('DESCRIPTION')}
  Clears stored authentication credentials. You will need to
  authenticate again to use Claude Code.

${bold('OPTIONS')}
  --help    Show this help message
`;
}

/**
 * Generates help text for the auth status command.
 *
 * @returns Help text
 */
function generateAuthStatusHelp(): string {
  return `
${bold('claude auth')} - Show authentication status

${bold('USAGE')}
  claude auth

${bold('DESCRIPTION')}
  Shows the current authentication status, including:
  - Whether you're authenticated via OAuth or API key
  - Account information
  - Token expiration time

${bold('OPTIONS')}
  --help    Show this help message
`;
}
