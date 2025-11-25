/**
 * AWS Integration Type Definitions
 *
 * This module defines TypeScript types for AWS credential handling,
 * authentication, and STS operations used throughout the CLI.
 *
 * @module aws/types
 */
/**
 * Credential feature code mapping
 */
export const CREDENTIAL_FEATURE_CODES = {
    CREDENTIALS_ENV_VARS: 'e',
    CREDENTIALS_ENV_VARS_STS_WEB_ID_TOKEN: 'h',
    CREDENTIALS_PROFILE: 'n',
    CREDENTIALS_PROFILE_NAMED_PROVIDER: 'p',
    CREDENTIALS_PROFILE_SOURCE_PROFILE: 'o',
    CREDENTIALS_PROFILE_SSO: 'r',
    CREDENTIALS_PROFILE_SSO_LEGACY: 't',
    CREDENTIALS_PROFILE_STS_WEB_ID_TOKEN: 'q',
    CREDENTIALS_PROFILE_PROCESS: 'v',
    CREDENTIALS_PROCESS: 'w',
    CREDENTIALS_STS_ASSUME_ROLE: 'i',
    CREDENTIALS_STS_ASSUME_ROLE_WEB_ID: 'k',
    RESOLVED_ACCOUNT_ID: 'T',
};
//# sourceMappingURL=types.js.map