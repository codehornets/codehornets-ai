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

import {
  fromEnv as sdkFromEnv,
  fromIni as sdkFromIni,
  fromProcess as sdkFromProcess,
  fromTokenFile as sdkFromTokenFile,
  fromContainerMetadata as sdkFromContainerMetadata,
  fromInstanceMetadata as sdkFromInstanceMetadata,
  fromSSO as sdkFromSSO,
} from '@aws-sdk/credential-providers';

import type { AwsCredentialIdentity, Provider } from '@aws-sdk/types';

import type {
  AWSCredentials,
  CredentialProvider,
  DefaultProviderOptions,
  FromEnvOptions,
  FromIniOptions,
  FromProcessOptions,
  FromTokenFileOptions,
  FromContainerMetadataOptions,
  FromInstanceMetadataOptions,
  FromSSOOptions,
  CredentialProviderInit,
} from './types.js';
import { setCredentialFeature } from './auth.js';

/**
 * Custom error class for credential provider failures
 */
export class CredentialsProviderError extends Error {
  readonly tryNextLink: boolean;

  constructor(
    message: string,
    options?: { logger?: { debug?: (msg: string) => void }; tryNextLink?: boolean }
  ) {
    super(message);
    this.name = 'CredentialsProviderError';
    this.tryNextLink = options?.tryNextLink ?? true;
    options?.logger?.debug?.(`CredentialsProviderError: ${message}`);
  }
}

/**
 * Chain multiple credential providers together
 */
function chain(...providers: Array<() => Promise<AWSCredentials>>): () => Promise<AWSCredentials> {
  return async () => {
    const errors: Error[] = [];

    for (const provider of providers) {
      try {
        return await provider();
      } catch (error) {
        errors.push(error as Error);
        if (error instanceof CredentialsProviderError && !error.tryNextLink) {
          throw error;
        }
      }
    }

    throw new CredentialsProviderError(
      `Could not load credentials from any providers. Errors: ${errors.map((e) => e.message).join(', ')}`,
      { tryNextLink: false }
    );
  };
}

/**
 * Memoize a credential provider with expiration checking
 */
function memoize(
  provider: () => Promise<AWSCredentials>,
  isExpired: (creds: AWSCredentials) => boolean,
  requiresRefresh: (creds: AWSCredentials) => boolean
): () => Promise<AWSCredentials> {
  let cachedCredentials: AWSCredentials | undefined;
  let pending: Promise<AWSCredentials> | undefined;

  return async () => {
    if (cachedCredentials && !isExpired(cachedCredentials)) {
      return cachedCredentials;
    }

    if (!pending) {
      pending = provider().then((creds) => {
        cachedCredentials = creds;
        pending = undefined;
        return creds;
      });
    }

    return pending;
  };
}

/**
 * Environment variable names for AWS credentials
 */
export const ENV_KEY = 'AWS_ACCESS_KEY_ID';
export const ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';
export const ENV_SESSION = 'AWS_SESSION_TOKEN';
export const ENV_EXPIRATION = 'AWS_CREDENTIAL_EXPIRATION';
export const ENV_PROFILE = 'AWS_PROFILE';

/**
 * Container metadata environment variables
 */
export const ENV_CMDS_FULL_URI = 'AWS_CONTAINER_CREDENTIALS_FULL_URI';
export const ENV_CMDS_RELATIVE_URI = 'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI';

/**
 * EC2 metadata service control
 */
export const ENV_EC2_METADATA_DISABLED = 'AWS_EC2_METADATA_DISABLED';

/**
 * Web identity environment variables
 */
export const ENV_WEB_IDENTITY_TOKEN_FILE = 'AWS_WEB_IDENTITY_TOKEN_FILE';
export const ENV_ROLE_ARN = 'AWS_ROLE_ARN';
export const ENV_ROLE_SESSION_NAME = 'AWS_ROLE_SESSION_NAME';

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
export function fromEnv(options: FromEnvOptions = {}): CredentialProvider {
  return async (_init?: CredentialProviderInit): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-env - fromEnv');

    const credentials = (await sdkFromEnv()()) as AWSCredentials;
    return setCredentialFeature(credentials, 'CREDENTIALS_ENV_VARS', 'e');
  };
}

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
export function fromIni(options: FromIniOptions = {}): CredentialProvider {
  return async (init?: CredentialProviderInit): Promise<AWSCredentials> => {
    const mergedOptions = {
      ...options,
      parentClientConfig: {
        ...init?.callerClientConfig,
        ...options.parentClientConfig,
      },
    };

    mergedOptions.logger?.debug('@aws-sdk/credential-provider-ini - fromIni');

    const profile = options.profile ?? init?.callerClientConfig?.profile;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const iniOptions: any = {
      profile,
      mfaCodeProvider: options.mfaCodeProvider,
      logger: options.logger,
      clientConfig: options.clientConfig,
    };
    if (options.roleAssumer) {
      iniOptions.roleAssumer = options.roleAssumer;
    }
    if (options.roleAssumerWithWebIdentity) {
      iniOptions.roleAssumerWithWebIdentity = options.roleAssumerWithWebIdentity;
    }
    const credentials = (await sdkFromIni(iniOptions)()) as AWSCredentials;

    return setCredentialFeature(credentials, 'CREDENTIALS_PROFILE', 'n');
  };
}

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
export function fromProcess(options: FromProcessOptions = {}): CredentialProvider {
  return async (init?: CredentialProviderInit): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-process - fromProcess');

    const profile = options.profile ?? init?.callerClientConfig?.profile;

    const credentials = (await sdkFromProcess({
      profile,
      logger: options.logger,
    })()) as AWSCredentials;

    return setCredentialFeature(credentials, 'CREDENTIALS_PROCESS', 'w');
  };
}

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
export function fromTokenFile(options: FromTokenFileOptions = {}): CredentialProvider {
  return async (_init?: CredentialProviderInit): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-web-identity - fromTokenFile');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenOptions: any = {
      webIdentityTokenFile: options.webIdentityTokenFile,
      roleArn: options.roleArn,
      roleSessionName: options.roleSessionName,
      logger: options.logger,
    };
    if (options.roleAssumerWithWebIdentity) {
      tokenOptions.roleAssumerWithWebIdentity = options.roleAssumerWithWebIdentity;
    }
    const credentials = (await sdkFromTokenFile(tokenOptions)()) as AWSCredentials;

    // Check if using environment variable token file
    if (options.webIdentityTokenFile === process.env[ENV_WEB_IDENTITY_TOKEN_FILE]) {
      return setCredentialFeature(credentials, 'CREDENTIALS_ENV_VARS_STS_WEB_ID_TOKEN', 'h');
    }

    return setCredentialFeature(credentials, 'CREDENTIALS_PROFILE_STS_WEB_ID_TOKEN', 'q');
  };
}

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
export function fromContainerMetadata(
  options: FromContainerMetadataOptions = {}
): CredentialProvider {
  return async (): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-imds - fromContainerMetadata');

    const credentials = (await sdkFromContainerMetadata({
      timeout: options.timeout,
      maxRetries: options.maxRetries,
      logger: options.logger,
    })()) as AWSCredentials;

    return credentials;
  };
}

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
export function fromInstanceMetadata(
  options: FromInstanceMetadataOptions = {}
): CredentialProvider {
  return async (): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-imds - fromInstanceMetadata');

    const imdsOptions: Record<string, unknown> = {
      logger: options.logger,
    };
    if (options.timeout !== undefined) {
      imdsOptions.timeout = options.timeout;
    }
    if (options.maxRetries !== undefined) {
      imdsOptions.maxRetries = options.maxRetries;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const credentials = (await sdkFromInstanceMetadata(imdsOptions as any)()) as AWSCredentials;

    return credentials;
  };
}

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
export function fromSSO(options: FromSSOOptions = {}): CredentialProvider {
  return async (_init?: CredentialProviderInit): Promise<AWSCredentials> => {
    options.logger?.debug('@aws-sdk/credential-provider-sso - fromSSO');

    const credentials = (await sdkFromSSO({
      profile: options.profile,
      ssoStartUrl: options.ssoStartUrl,
      ssoAccountId: options.ssoAccountId,
      ssoRegion: options.ssoRegion,
      ssoRoleName: options.ssoRoleName,
      ssoSession: options.ssoSession,
      logger: options.logger,
      clientConfig: options.clientConfig,
    })()) as AWSCredentials;

    // Determine which SSO type was used
    if (options.ssoSession) {
      return setCredentialFeature(credentials, 'CREDENTIALS_PROFILE_SSO', 'r');
    }

    return setCredentialFeature(credentials, 'CREDENTIALS_PROFILE_SSO_LEGACY', 't');
  };
}

/**
 * Create remote credential provider (container or instance metadata)
 *
 * @param options - Provider options
 * @returns Credential provider function
 */
export async function remoteProvider(
  options: DefaultProviderOptions = {}
): Promise<CredentialProvider> {
  // Check for container credentials
  if (process.env[ENV_CMDS_RELATIVE_URI] || process.env[ENV_CMDS_FULL_URI]) {
    options.logger?.debug(
      '@aws-sdk/credential-provider-node - remoteProvider::fromContainerMetadata'
    );
    return chain(fromContainerMetadata(options), fromContainerMetadata(options));
  }

  // Check if EC2 metadata is disabled
  if (
    process.env[ENV_EC2_METADATA_DISABLED] &&
    process.env[ENV_EC2_METADATA_DISABLED] !== 'false'
  ) {
    return async () => {
      throw new CredentialsProviderError('EC2 Instance Metadata Service access disabled', {
        logger: options.logger,
      });
    };
  }

  // Default to instance metadata
  options.logger?.debug(
    '@aws-sdk/credential-provider-node - remoteProvider::fromInstanceMetadata'
  );
  return fromInstanceMetadata(options);
}

/**
 * Warning flag to prevent duplicate warnings
 */
let hasLoggedProfileWarning = false;

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
export function defaultProvider(options: DefaultProviderOptions = {}): CredentialProvider {
  const chainedProvider = chain(
    // 1. Environment variables (skip if profile is set)
    async () => {
      if (options.profile ?? process.env[ENV_PROFILE]) {
        // Warn about conflicting configuration
        if (process.env[ENV_KEY] && process.env[ENV_SECRET]) {
          if (!hasLoggedProfileWarning) {
            const warnFn =
              options.logger?.warn && options.logger?.constructor?.name !== 'NoOpLogger'
                ? options.logger.warn.bind(options.logger)
                : console.warn;

            warnFn(`@aws-sdk/credential-provider-node - defaultProvider::fromEnv WARNING:
    Multiple credential sources detected:
    Both AWS_PROFILE and the pair AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY static credentials are set.
    This SDK will proceed with the AWS_PROFILE value.

    However, a future version may change this behavior to prefer the ENV static credentials.
    Please ensure that your environment only sets either the AWS_PROFILE or the
    AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY pair.
`);
            hasLoggedProfileWarning = true;
          }
        }

        throw new CredentialsProviderError('AWS_PROFILE is set, skipping fromEnv provider.', {
          logger: options.logger,
          tryNextLink: true,
        });
      }

      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::fromEnv');
      return fromEnv(options)();
    },

    // 2. SSO (if configured)
    async () => {
      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::fromSSO');

      const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = options;

      if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
        throw new CredentialsProviderError(
          'Skipping SSO provider in default chain (inputs do not include SSO fields).',
          { logger: options.logger }
        );
      }

      return fromSSO(options)();
    },

    // 3. INI profile files
    async () => {
      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::fromIni');
      return fromIni(options)();
    },

    // 4. Process credentials
    async () => {
      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::fromProcess');
      return fromProcess(options)();
    },

    // 5. Web identity token file
    async () => {
      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::fromTokenFile');
      return fromTokenFile(options)();
    },

    // 6. Remote provider (container/instance metadata)
    async () => {
      options.logger?.debug('@aws-sdk/credential-provider-node - defaultProvider::remoteProvider');
      const provider = await remoteProvider(options);
      return provider();
    },

    // Final fallback - throw error
    async () => {
      throw new CredentialsProviderError('Could not load credentials from any providers', {
        tryNextLink: false,
        logger: options.logger,
      });
    }
  );

  // Memoize with expiration checking
  return memoize(chainedProvider, credentialsTreatedAsExpired, credentialsWillNeedRefresh);
}

/**
 * Check if credentials will need refresh (have expiration)
 *
 * @param credentials - Credentials to check
 * @returns True if credentials have expiration
 */
export function credentialsWillNeedRefresh(credentials: AWSCredentials): boolean {
  return credentials?.expiration !== undefined;
}

/**
 * Check if credentials should be treated as expired
 *
 * Returns true if credentials expire within 5 minutes.
 *
 * @param credentials - Credentials to check
 * @returns True if credentials are expired or expiring soon
 */
export function credentialsTreatedAsExpired(credentials: AWSCredentials): boolean {
  return (
    credentials?.expiration !== undefined &&
    credentials.expiration.getTime() - Date.now() < 300000 // 5 minutes
  );
}

/**
 * Decorate a credential provider with default role assumer
 *
 * @param credentialProvider - Provider to decorate
 * @returns Decorated provider factory
 */
export function decorateDefaultCredentialProvider(
  credentialProvider: (options: DefaultProviderOptions) => CredentialProvider
): (options: DefaultProviderOptions) => CredentialProvider {
  return (options: DefaultProviderOptions) => {
    // Import role assumers dynamically to avoid circular deps
    const { getDefaultRoleAssumer, getDefaultRoleAssumerWithWebIdentity } = require('./sts.js');

    return credentialProvider({
      roleAssumer: getDefaultRoleAssumer(options),
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(options),
      ...options,
    });
  };
}
