/**
 * @fileoverview OAuth Authentication Module
 * @module core/auth
 *
 * This module provides OAuth 2.0 authentication with PKCE for
 * authenticating with Anthropic's API using web sessions.
 */
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
/**
 * OAuth scopes required for Claude Code
 */
declare const OAUTH_SCOPES: string[];
/**
 * Production OAuth configuration
 */
export declare const PRODUCTION_CONFIG: OAuthConfig;
/**
 * Local/development OAuth configuration
 */
export declare const LOCAL_CONFIG: OAuthConfig;
/**
 * Token expiration buffer (5 minutes)
 */
declare const TOKEN_EXPIRATION_BUFFER_MS: number;
/**
 * Default callback server port
 */
declare const DEFAULT_CALLBACK_PORT = 51423;
/**
 * Gets the Claude config directory path.
 *
 * @returns Path to the Claude config directory
 */
export declare function getConfigDir(): string;
/**
 * Gets the path to the credentials config file.
 *
 * @param suffix - Optional suffix for different environments
 * @returns Path to the config file
 */
export declare function getConfigPath(suffix?: string): string;
/**
 * Gets the current OAuth configuration based on environment.
 *
 * @returns OAuth configuration
 */
export declare function getOAuthConfig(): OAuthConfig;
/**
 * Generates a PKCE code verifier and challenge pair.
 *
 * @returns PKCE pair with code verifier and challenge
 */
export declare function generatePKCE(): PKCEPair;
/**
 * Generates a random state string for OAuth.
 *
 * @returns Random state string
 */
export declare function generateState(): string;
/**
 * Reads stored credentials from the config file.
 *
 * @returns Stored credentials or empty object
 */
export declare function readCredentials(): StoredCredentials;
/**
 * Saves credentials to the config file.
 *
 * @param credentials - Credentials to save
 */
export declare function saveCredentials(credentials: StoredCredentials): void;
/**
 * Clears stored OAuth tokens and API key.
 */
export declare function clearTokens(): void;
/**
 * Checks if a token is expired or about to expire.
 *
 * @param expiresAt - Token expiration timestamp
 * @returns True if token is expired or expiring soon
 */
export declare function isTokenExpiring(expiresAt: number | null | undefined): boolean;
/**
 * Gets the current access token, refreshing if necessary.
 *
 * @returns Access token or null if not authenticated
 */
export declare function getAccessToken(): Promise<string | null>;
/**
 * Checks if user is authenticated.
 *
 * @returns True if user has valid credentials
 */
export declare function isAuthenticated(): Promise<boolean>;
/**
 * Builds the authorization URL for the OAuth flow.
 *
 * @param params - Authorization parameters
 * @returns Authorization URL
 */
export declare function buildAuthorizationUrl(params: {
    codeChallenge: string;
    state: string;
    redirectUri: string;
    useClaudeAi?: boolean;
}): string;
/**
 * Exchanges an authorization code for tokens.
 *
 * @param code - Authorization code
 * @param codeVerifier - PKCE code verifier
 * @param redirectUri - Redirect URI used in authorization
 * @param state - State parameter
 * @returns OAuth tokens
 */
export declare function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string, state: string): Promise<OAuthTokens>;
/**
 * Refreshes an access token using a refresh token.
 *
 * @param refreshToken - Refresh token
 * @returns New OAuth tokens
 */
export declare function refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
/**
 * Creates an API key from an OAuth access token.
 *
 * @param accessToken - OAuth access token
 * @returns API key or null if creation failed
 */
export declare function createApiKeyFromToken(accessToken: string): Promise<string | null>;
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
export declare function startCallbackServer(port: number | undefined, expectedState: string): Promise<CallbackResult>;
/**
 * Performs the full OAuth authentication flow.
 *
 * @param options - Authentication options
 * @returns OAuth tokens
 */
export declare function authenticate(options: {
    useClaudeAi?: boolean;
    port?: number;
    openBrowserFn?: (url: string) => Promise<void>;
}): Promise<OAuthTokens>;
/**
 * Logs out by clearing stored tokens.
 */
export declare function logout(): void;
export { DEFAULT_CALLBACK_PORT, TOKEN_EXPIRATION_BUFFER_MS, OAUTH_SCOPES, };
//# sourceMappingURL=auth.d.ts.map