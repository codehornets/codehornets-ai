/**
 * AWS Credential Providers Module
 *
 * Provides credential provider implementations for various AWS authentication
 * methods including environment variables, profile files, web identity tokens,
 * and container/instance metadata.
 *
 * This module wraps the official AWS SDK v3 credential providers with
 * additional error handling and logging.
 *
 * @module aws/credentials
 */
import type { AWSCredentials, CredentialProvider, DefaultProviderOptions, FromEnvOptions, FromIniOptions, FromProcessOptions, FromTokenFileOptions, FromContainerMetadataOptions, FromInstanceMetadataOptions, FromSSOOptions } from './types.js';
/**
 * Custom error class for credential provider failures
 */
export declare class CredentialsProviderError extends Error {
    readonly tryNextLink: boolean;
    constructor(message: string, options?: {
        logger?: {
            debug?: (msg: string) => void;
        };
        tryNextLink?: boolean;
    });
}
/**
 * Environment variable names for AWS credentials
 */
export declare const ENV_KEY = "AWS_ACCESS_KEY_ID";
export declare const ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
export declare const ENV_SESSION = "AWS_SESSION_TOKEN";
export declare const ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
export declare const ENV_PROFILE = "AWS_PROFILE";
/**
 * Container metadata environment variables
 */
export declare const ENV_CMDS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
export declare const ENV_CMDS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
/**
 * EC2 metadata service control
 */
export declare const ENV_EC2_METADATA_DISABLED = "AWS_EC2_METADATA_DISABLED";
/**
 * Web identity environment variables
 */
export declare const ENV_WEB_IDENTITY_TOKEN_FILE = "AWS_WEB_IDENTITY_TOKEN_FILE";
export declare const ENV_ROLE_ARN = "AWS_ROLE_ARN";
export declare const ENV_ROLE_SESSION_NAME = "AWS_ROLE_SESSION_NAME";
/**
 * Create credential provider from environment variables
 *
 * Reads credentials from:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_SESSION_TOKEN (optional)
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * const provider = fromEnv();
 * const credentials = await provider();
 * ```
 */
export declare function fromEnv(options?: FromEnvOptions): CredentialProvider;
/**
 * Create credential provider from INI profile files
 *
 * Reads credentials from ~/.aws/credentials and ~/.aws/config files.
 * Supports:
 * - Static credentials
 * - Assume role with source profile
 * - Web identity tokens
 * - Process credentials
 * - SSO credentials
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * const provider = fromIni({ profile: 'my-profile' });
 * const credentials = await provider();
 * ```
 */
export declare function fromIni(options?: FromIniOptions): CredentialProvider;
/**
 * Create credential provider from process credentials
 *
 * Executes the command specified in credential_process in the profile
 * and parses the JSON output for credentials.
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * // ~/.aws/credentials
 * // [my-profile]
 * // credential_process = /usr/bin/my-credential-script
 *
 * const provider = fromProcess({ profile: 'my-profile' });
 * const credentials = await provider();
 * ```
 */
export declare function fromProcess(options?: FromProcessOptions): CredentialProvider;
/**
 * Create credential provider from web identity token file
 *
 * Reads token from file and uses STS AssumeRoleWithWebIdentity.
 * Commonly used with Kubernetes IRSA or EKS Pod Identity.
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * const provider = fromTokenFile({
 *   webIdentityTokenFile: '/var/run/secrets/token',
 *   roleArn: 'arn:aws:iam::123456789012:role/MyRole',
 * });
 * const credentials = await provider();
 * ```
 */
export declare function fromTokenFile(options?: FromTokenFileOptions): CredentialProvider;
/**
 * Create credential provider from container metadata
 *
 * Fetches credentials from the ECS task metadata endpoint
 * or any HTTP endpoint specified by AWS_CONTAINER_CREDENTIALS_FULL_URI.
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * // In an ECS task
 * const provider = fromContainerMetadata();
 * const credentials = await provider();
 * ```
 */
export declare function fromContainerMetadata(options?: FromContainerMetadataOptions): CredentialProvider;
/**
 * Create credential provider from EC2 instance metadata (IMDS)
 *
 * Fetches credentials from the EC2 instance metadata service.
 * Supports both IMDSv1 and IMDSv2.
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * // On an EC2 instance
 * const provider = fromInstanceMetadata();
 * const credentials = await provider();
 * ```
 */
export declare function fromInstanceMetadata(options?: FromInstanceMetadataOptions): CredentialProvider;
/**
 * Create credential provider from AWS SSO
 *
 * Uses AWS SSO (IAM Identity Center) credentials from the
 * SSO cache or initiates a new SSO login flow.
 *
 * @param options - Provider options
 * @returns Credential provider function
 *
 * @example
 * ```typescript
 * const provider = fromSSO({
 *   ssoStartUrl: 'https://my-sso-portal.awsapps.com/start',
 *   ssoAccountId: '123456789012',
 *   ssoRegion: 'us-east-1',
 *   ssoRoleName: 'MyRole',
 * });
 * const credentials = await provider();
 * ```
 */
export declare function fromSSO(options?: FromSSOOptions): CredentialProvider;
/**
 * Create remote credential provider (container or instance metadata)
 *
 * @param options - Provider options
 * @returns Credential provider function
 */
export declare function remoteProvider(options?: DefaultProviderOptions): Promise<CredentialProvider>;
/**
 * Default credential provider chain
 *
 * Tries credential sources in the following order:
 * 1. Environment variables
 * 2. SSO (if configured)
 * 3. INI profile files
 * 4. Process credentials
 * 5. Web identity token file
 * 6. Container metadata / Instance metadata
 *
 * @param options - Provider options
 * @returns Memoized credential provider function
 *
 * @example
 * ```typescript
 * const provider = defaultProvider();
 * const credentials = await provider();
 * ```
 */
export declare function defaultProvider(options?: DefaultProviderOptions): CredentialProvider;
/**
 * Check if credentials will need refresh (have expiration)
 *
 * @param credentials - Credentials to check
 * @returns True if credentials have expiration
 */
export declare function credentialsWillNeedRefresh(credentials: AWSCredentials): boolean;
/**
 * Check if credentials should be treated as expired
 *
 * Returns true if credentials expire within 5 minutes.
 *
 * @param credentials - Credentials to check
 * @returns True if credentials are expired or expiring soon
 */
export declare function credentialsTreatedAsExpired(credentials: AWSCredentials): boolean;
/**
 * Decorate a credential provider with default role assumer
 *
 * @param credentialProvider - Provider to decorate
 * @returns Decorated provider factory
 */
export declare function decorateDefaultCredentialProvider(credentialProvider: (options: DefaultProviderOptions) => CredentialProvider): (options: DefaultProviderOptions) => CredentialProvider;
//# sourceMappingURL=credentials.d.ts.map