/**
 * @fileoverview OAuth Authentication Module
 * @module core/auth
 *
 * This module provides OAuth 2.0 authentication with PKCE for
 * authenticating with Anthropic's API using web sessions.
 */

import * as crypto from 'node:crypto';
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================================
// Types
// ============================================================================

/**
 * OAuth configuration for different environments
 */
export interface OAuthConfig {
  SCOPES: string[];
  BASE_API_URL: string;
  CONSOLE_AUTHORIZE_URL: string;
  CLAUDE_AI_AUTHORIZE_URL: string;
  TOKEN_URL: string;
  API_KEY_URL: string;
  ROLES_URL: string;
  CONSOLE_SUCCESS_URL: string;
  CLAUDEAI_SUCCESS_URL: string;
  MANUAL_REDIRECT_URL: string;
  CLIENT_ID: string;
  OAUTH_FILE_SUFFIX: string;
}

/**
 * OAuth tokens returned from token exchange
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  subscriptionType?: string;
}

/**
 * OAuth account information stored in config
 */
export interface OAuthAccount {
  accountUuid?: string;
  emailAddress?: string;
  displayName?: string;
  organizationUuid?: string;
  organizationRole?: string;
  workspaceRole?: string;
  organizationName?: string;
  organizationBillingType?: string;
}

/**
 * Token response from OAuth server
 */
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
  account?: {
    uuid: string;
    email_address: string;
  };
  organization?: {
    uuid: string;
  };
}

/**
 * Stored credentials in config file
 */
export interface StoredCredentials {
  oauthTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scopes: string[];
  };
  oauthAccount?: OAuthAccount;
  primaryApiKey?: string;
}

/**
 * PKCE code verifier and challenge pair
 */
interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * OAuth scopes required for Claude Code
 */
const OAUTH_SCOPES = [
  'org:create_api_key',
  'user:profile',
  'user:inference',
  'user:sessions:claude_code',
];

/**
 * Production OAuth configuration
 */
export const PRODUCTION_CONFIG: OAuthConfig = {
  SCOPES: OAUTH_SCOPES,
  BASE_API_URL: 'https://api.anthropic.com',
  CONSOLE_AUTHORIZE_URL: 'https://console.anthropic.com/oauth/authorize',
  CLAUDE_AI_AUTHORIZE_URL: 'https://claude.ai/oauth/authorize',
  TOKEN_URL: 'https://console.anthropic.com/v1/oauth/token',
  API_KEY_URL: 'https://api.anthropic.com/api/oauth/claude_cli/create_api_key',
  ROLES_URL: 'https://api.anthropic.com/api/oauth/claude_cli/roles',
  CONSOLE_SUCCESS_URL: 'https://console.anthropic.com/buy_credits?returnUrl=/oauth/code/success%3Fapp%3Dclaude-code',
  CLAUDEAI_SUCCESS_URL: 'https://console.anthropic.com/oauth/code/success?app=claude-code',
  MANUAL_REDIRECT_URL: 'https://console.anthropic.com/oauth/code/callback',
  CLIENT_ID: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  OAUTH_FILE_SUFFIX: '',
};

/**
 * Local/development OAuth configuration
 */
export const LOCAL_CONFIG: OAuthConfig = {
  SCOPES: OAUTH_SCOPES,
  BASE_API_URL: 'http://localhost:3000',
  CONSOLE_AUTHORIZE_URL: 'http://localhost:3000/oauth/authorize',
  CLAUDE_AI_AUTHORIZE_URL: 'http://localhost:4000/oauth/authorize',
  TOKEN_URL: 'http://localhost:3000/v1/oauth/token',
  API_KEY_URL: 'http://localhost:3000/api/oauth/claude_cli/create_api_key',
  ROLES_URL: 'http://localhost:3000/api/oauth/claude_cli/roles',
  CONSOLE_SUCCESS_URL: 'http://localhost:3000/buy_credits?returnUrl=/oauth/code/success%3Fapp%3Dclaude-code',
  CLAUDEAI_SUCCESS_URL: 'http://localhost:3000/oauth/code/success?app=claude-code',
  MANUAL_REDIRECT_URL: 'https://console.staging.ant.dev/oauth/code/callback',
  CLIENT_ID: '22422756-60c9-4084-8eb7-27705fd5cf9a',
  OAUTH_FILE_SUFFIX: '-local-oauth',
};

/**
 * Token expiration buffer (5 minutes)
 */
const TOKEN_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

/**
 * Default callback server port
 */
const DEFAULT_CALLBACK_PORT = 51423;

// ============================================================================
// Config Path Utilities
// ============================================================================

/**
 * Gets the Claude config directory path.
 *
 * @returns Path to the Claude config directory
 */
export function getConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude');
}

/**
 * Gets the path to the credentials config file.
 *
 * @param suffix - Optional suffix for different environments
 * @returns Path to the config file
 */
export function getConfigPath(suffix: string = ''): string {
  const configDir = getConfigDir();
  const configFile = `.claude${suffix}.json`;

  // Check for legacy .config.json in config dir
  const legacyPath = path.join(configDir, '.config.json');
  if (fs.existsSync(legacyPath)) {
    return legacyPath;
  }

  return path.join(process.env.CLAUDE_CONFIG_DIR || os.homedir(), configFile);
}

/**
 * Gets the current OAuth configuration based on environment.
 *
 * @returns OAuth configuration
 */
export function getOAuthConfig(): OAuthConfig {
  // Check for local development mode
  if (process.env.CLAUDE_CODE_LOCAL_OAUTH === '1') {
    return LOCAL_CONFIG;
  }
  return PRODUCTION_CONFIG;
}

// ============================================================================
// PKCE Implementation
// ============================================================================

/**
 * Generates a cryptographically random string for use as a code verifier.
 *
 * @param length - Length of the code verifier (43-128 characters)
 * @returns Base64URL-encoded code verifier
 */
function generateCodeVerifier(length: number = 64): string {
  if (length < 43 || length > 128) {
    throw new Error(`Code verifier length must be between 43 and 128. Received: ${length}`);
  }

  const buffer = crypto.randomBytes(length);
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Generates a code challenge from a code verifier using SHA-256.
 *
 * @param codeVerifier - The code verifier to hash
 * @returns Base64URL-encoded code challenge
 */
function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generates a PKCE code verifier and challenge pair.
 *
 * @returns PKCE pair with code verifier and challenge
 */
export function generatePKCE(): PKCEPair {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Generates a random state string for OAuth.
 *
 * @returns Random state string
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// ============================================================================
// Credential Storage
// ============================================================================

/**
 * Reads stored credentials from the config file.
 *
 * @returns Stored credentials or empty object
 */
export function readCredentials(): StoredCredentials {
  const config = getOAuthConfig();
  const configPath = getConfigPath(config.OAUTH_FILE_SUFFIX);

  try {
    if (!fs.existsSync(configPath)) {
      return {};
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as StoredCredentials;
  } catch {
    return {};
  }
}

/**
 * Saves credentials to the config file.
 *
 * @param credentials - Credentials to save
 */
export function saveCredentials(credentials: StoredCredentials): void {
  const config = getOAuthConfig();
  const configPath = getConfigPath(config.OAUTH_FILE_SUFFIX);
  const configDir = path.dirname(configPath);

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Read existing config and merge
  let existing: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {
    // Ignore parse errors, start fresh
  }

  const merged = { ...existing, ...credentials };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2));
}

/**
 * Clears stored OAuth tokens and API key.
 */
export function clearTokens(): void {
  const config = getOAuthConfig();
  const configPath = getConfigPath(config.OAUTH_FILE_SUFFIX);

  // Read existing config
  let existing: Record<string, unknown> = {};
  try {
    if (fs.existsSync(configPath)) {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch {
    // Ignore parse errors
  }

  // Remove auth-related fields
  delete existing.oauthTokens;
  delete existing.primaryApiKey;
  delete existing.oauthAccount;

  // Write back directly (not using saveCredentials to avoid merge)
  fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Checks if a token is expired or about to expire.
 *
 * @param expiresAt - Token expiration timestamp
 * @returns True if token is expired or expiring soon
 */
export function isTokenExpiring(expiresAt: number | null | undefined): boolean {
  if (expiresAt === null || expiresAt === undefined) {
    return true;
  }
  return Date.now() + TOKEN_EXPIRATION_BUFFER_MS >= expiresAt;
}

/**
 * Gets the current access token, refreshing if necessary.
 *
 * @returns Access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  const credentials = readCredentials();

  // Check for API key (takes precedence if set)
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  if (credentials.primaryApiKey) {
    return credentials.primaryApiKey;
  }

  // Check for OAuth tokens
  if (!credentials.oauthTokens) {
    return null;
  }

  const { accessToken, refreshToken, expiresAt } = credentials.oauthTokens;

  // If token is still valid, return it
  if (!isTokenExpiring(expiresAt)) {
    return accessToken;
  }

  // Token is expiring, try to refresh
  if (refreshToken) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      saveCredentials({
        ...credentials,
        oauthTokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
          scopes: newTokens.scopes,
        },
      });
      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return null;
}

/**
 * Checks if user is authenticated.
 *
 * @returns True if user has valid credentials
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

// ============================================================================
// OAuth Flow
// ============================================================================

/**
 * Builds the authorization URL for the OAuth flow.
 *
 * @param params - Authorization parameters
 * @returns Authorization URL
 */
export function buildAuthorizationUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  useClaudeAi?: boolean;
}): string {
  const config = getOAuthConfig();
  const baseUrl = params.useClaudeAi
    ? config.CLAUDE_AI_AUTHORIZE_URL
    : config.CONSOLE_AUTHORIZE_URL;

  const url = new URL(baseUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.CLIENT_ID);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', config.SCOPES.join(' '));
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return url.toString();
}

/**
 * Exchanges an authorization code for tokens.
 *
 * @param code - Authorization code
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - Redirect URI used in authorization
 * @param state - State parameter
 * @returns OAuth tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  state: string
): Promise<OAuthTokens> {
  const config = getOAuthConfig();

  const body = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.CLIENT_ID,
    code_verifier: codeVerifier,
    state,
  };

  const response = await fetch(config.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error('Authentication failed: Invalid authorization code');
    }
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as TokenResponse;

  const tokens: OAuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: data.scope?.split(' ') ?? [],
  };

  return tokens;
}

/**
 * Refreshes an access token using a refresh token.
 *
 * @param refreshToken - Refresh token
 * @returns New OAuth tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const config = getOAuthConfig();

  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.CLIENT_ID,
  };

  const response = await fetch(config.TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = (await response.json()) as TokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: data.scope?.split(' ') ?? [],
  };
}

/**
 * Creates an API key from an OAuth access token.
 *
 * @param accessToken - OAuth access token
 * @returns API key or null if creation failed
 */
export async function createApiKeyFromToken(accessToken: string): Promise<string | null> {
  const config = getOAuthConfig();

  try {
    const response = await fetch(config.API_KEY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { raw_key?: string };
    return data.raw_key ?? null;
  } catch {
    return null;
  }
}

// ============================================================================
// OAuth Callback Server
// ============================================================================

/**
 * Result from the OAuth callback server
 */
interface CallbackResult {
  code: string;
  state: string;
}

/**
 * Starts a local HTTP server to handle the OAuth callback.
 *
 * @param port - Port to listen on
 * @param expectedState - Expected state parameter
 * @returns Promise that resolves with the authorization code
 */
export function startCallbackServer(
  port: number = DEFAULT_CALLBACK_PORT,
  expectedState: string
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '', `http://localhost:${port}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          const errorDescription = url.searchParams.get('error_description') ?? error;
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication Failed</title></head>
              <body>
                <h1>Authentication Failed</h1>
                <p>${errorDescription}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(errorDescription));
          return;
        }

        if (!code || !state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication Failed</title></head>
              <body>
                <h1>Authentication Failed</h1>
                <p>Missing authorization code or state.</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('Missing authorization code or state'));
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Authentication Failed</title></head>
              <body>
                <h1>Authentication Failed</h1>
                <p>State mismatch - possible CSRF attack.</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('State mismatch'));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Authentication Successful</title></head>
            <body>
              <h1>Authentication Successful!</h1>
              <p>You can close this window and return to Claude Code.</p>
              <script>window.close();</script>
            </body>
          </html>
        `);

        server.close();
        resolve({ code, state });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.on('error', (err) => {
      reject(err);
    });

    // Set a timeout for the callback (5 minutes)
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth callback timeout'));
    }, 5 * 60 * 1000);

    server.on('close', () => {
      clearTimeout(timeout);
    });

    server.listen(port, '127.0.0.1', () => {
      // Server is ready
    });
  });
}

// ============================================================================
// Full OAuth Flow
// ============================================================================

/**
 * Opens a URL in the default browser.
 *
 * @param url - URL to open
 */
async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('node:child_process');

  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Performs the full OAuth authentication flow.
 *
 * @param options - Authentication options
 * @returns OAuth tokens
 */
export async function authenticate(options: {
  useClaudeAi?: boolean;
  port?: number;
  openBrowserFn?: (url: string) => Promise<void>;
}): Promise<OAuthTokens> {
  const {
    useClaudeAi = false,
    port = DEFAULT_CALLBACK_PORT,
    openBrowserFn = openBrowser,
  } = options;

  // Generate PKCE and state
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateState();
  const redirectUri = `http://localhost:${port}/callback`;

  // Build authorization URL
  const authUrl = buildAuthorizationUrl({
    codeChallenge,
    state,
    redirectUri,
    useClaudeAi,
  });

  // Start callback server before opening browser
  const callbackPromise = startCallbackServer(port, state);

  // Open browser
  console.log('\nOpening browser for authentication...');
  console.log(`If the browser doesn't open automatically, visit:\n${authUrl}\n`);

  try {
    await openBrowserFn(authUrl);
  } catch {
    console.log('Could not open browser automatically. Please visit the URL above.');
  }

  // Wait for callback
  console.log('Waiting for authentication...');
  const { code } = await callbackPromise;

  // Exchange code for tokens
  console.log('Exchanging code for tokens...');
  const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri, state);

  // Save tokens (uses web session for Claude Pro subscription)
  const credentials = readCredentials();
  saveCredentials({
    ...credentials,
    oauthTokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
    },
  });

  console.log('Authentication successful!');
  return tokens;
}

/**
 * Logs out by clearing stored tokens.
 */
export function logout(): void {
  clearTokens();
  console.log('Logged out successfully.');
}

// ============================================================================
// Exports
// ============================================================================

export {
  DEFAULT_CALLBACK_PORT,
  TOKEN_EXPIRATION_BUFFER_MS,
  OAUTH_SCOPES,
};
