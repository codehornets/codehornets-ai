/**
 * AWS STS Client Module
 *
 * Provides STS (Security Token Service) client wrapper for role assumption
 * and temporary credential operations.
 *
 * @module aws/sts
 */

import {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleWithWebIdentityCommand,
  type AssumeRoleCommandInput,
  type AssumeRoleCommandOutput,
  type AssumeRoleWithWebIdentityCommandInput,
  type AssumeRoleWithWebIdentityCommandOutput,
} from '@aws-sdk/client-sts';

import type {
  AWSCredentials,
  AssumeRoleParams,
  AssumeRoleWithWebIdentityParams,
  RoleAssumer,
  RoleAssumerWithWebIdentity,
  CredentialProviderOptions,
  MiddlewarePlugin,
  RequestHandler,
} from './types.js';
import { setCredentialFeature } from './auth.js';
import { resolveRegion, getAccountIdFromAssumedRoleUser, DEFAULT_STS_REGION } from './endpoints.js';

/**
 * STS client options
 */
export interface STSClientOptions extends CredentialProviderOptions {
  /** AWS region for STS calls */
  region?: string | (() => Promise<string>);
  /** Credential default provider (for pre-signed requests) */
  credentialDefaultProvider?: () => Promise<AWSCredentials>;
}

/**
 * Role assumer factory options
 */
export interface RoleAssumerFactoryOptions {
  /** Logger for debugging */
  logger?: CredentialProviderOptions['logger'];
  /** AWS region */
  region?: string | (() => Promise<string>);
  /** Parent client configuration */
  parentClientConfig?: {
    profile?: string;
    region?: string | (() => Promise<string>);
    logger?: CredentialProviderOptions['logger'];
    requestHandler?: RequestHandler;
  };
  /** Custom client configuration */
  clientConfig?: {
    region?: string;
    endpoint?: string;
  };
  /** Credential provider logger */
  credentialProviderLogger?: CredentialProviderOptions['logger'];
}

/**
 * Check if request handler uses HTTP/2
 *
 * @param requestHandler - Request handler to check
 * @returns True if using HTTP/2
 */
function isH2(requestHandler?: RequestHandler): boolean {
  return requestHandler?.metadata?.handlerProtocol === 'h2';
}

/**
 * Create a customizable STS client class with middleware plugins
 *
 * @param plugins - Middleware plugins to apply
 * @returns Customized STS client class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCustomizableStsClientCtor(plugins?: MiddlewarePlugin[]): any {
  if (!plugins || plugins.length === 0) {
    return STSClient;
  }

  return class CustomizableSTSClient extends STSClient {
    constructor(config: ConstructorParameters<typeof STSClient>[0]) {
      super(config!);
      for (const plugin of plugins!) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.middlewareStack.use(plugin as any);
      }
    }
  };
}

/**
 * Create a default role assumer function
 *
 * This function creates a new STS client (if needed) and uses it to
 * assume a role with the provided credentials and parameters.
 *
 * @param options - Factory options
 * @param plugins - Optional middleware plugins
 * @returns Role assumer function
 *
 * @example
 * ```typescript
 * const roleAssumer = getDefaultRoleAssumer({ region: 'us-east-1' });
 *
 * const tempCredentials = await roleAssumer(sourceCredentials, {
 *   RoleArn: 'arn:aws:iam::123456789012:role/MyRole',
 *   RoleSessionName: 'my-session',
 * });
 * ```
 */
export function getDefaultRoleAssumer(
  options: RoleAssumerFactoryOptions = {},
  plugins?: MiddlewarePlugin[]
): RoleAssumer {
  const ClientClass = getCustomizableStsClientCtor(plugins);
  let stsClient: STSClient | undefined;
  let sourceCredentials: AWSCredentials | undefined;

  return async (
    credentials: AWSCredentials,
    params: AssumeRoleParams
  ): Promise<AWSCredentials> => {
    // Update source credentials
    sourceCredentials = credentials;

    // Create STS client lazily
    if (!stsClient) {
      const logger = options.logger ?? options.parentClientConfig?.logger;
      const requestHandler = options.parentClientConfig?.requestHandler;
      const credentialProviderLogger = options.credentialProviderLogger;

      const resolvedRegion = await resolveRegion(
        options.region,
        options.parentClientConfig?.region,
        DEFAULT_STS_REGION,
        credentialProviderLogger as { debug?: (message: string, ...args: unknown[]) => void } | undefined
      );

      // Only use custom request handler if not HTTP/2
      const useRequestHandler = !isH2(requestHandler);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientConfig: any = {
        profile: options.parentClientConfig?.profile,
        credentials: async () => sourceCredentials!,
        region: resolvedRegion,
        logger,
      };
      if (useRequestHandler && requestHandler) {
        clientConfig.requestHandler = requestHandler;
      }
      stsClient = new ClientClass(clientConfig);
    }

    // Build AssumeRole command input
    const input: AssumeRoleCommandInput = {
      RoleArn: params.RoleArn,
      RoleSessionName: params.RoleSessionName,
      ExternalId: params.ExternalId,
      DurationSeconds: params.DurationSeconds,
      Policy: params.Policy,
      PolicyArns: params.PolicyArns?.map((p) => ({ arn: p.arn })),
      Tags: params.Tags?.map((t) => ({ Key: t.Key, Value: t.Value })),
      TransitiveTagKeys: params.TransitiveTagKeys,
      SerialNumber: params.SerialNumber,
      TokenCode: params.TokenCode,
      SourceIdentity: params.SourceIdentity,
      ProvidedContexts: params.ProvidedContexts?.map((c) => ({
        ProviderArn: c.ProviderArn,
        ContextAssertion: c.ContextAssertion,
      })),
    };

    // Execute AssumeRole
    const response = await stsClient!.send(new AssumeRoleCommand(input));

    // Validate response
    if (
      !response.Credentials ||
      !response.Credentials.AccessKeyId ||
      !response.Credentials.SecretAccessKey
    ) {
      throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
    }

    // Extract account ID from assumed role user
    const accountId = getAccountIdFromAssumedRoleUser(response.AssumedRoleUser);

    // Build credentials object - cast to extended type for CredentialScope
    const creds = response.Credentials as { CredentialScope?: string } & typeof response.Credentials;
    const assumedCredentials: AWSCredentials = {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
      ...(creds.CredentialScope && {
        credentialScope: creds.CredentialScope,
      }),
      ...(accountId && { accountId }),
    };

    return setCredentialFeature(assumedCredentials, 'CREDENTIALS_STS_ASSUME_ROLE', 'i');
  };
}

/**
 * Create a default role assumer with web identity function
 *
 * This function creates a new STS client (if needed) and uses it to
 * assume a role with a web identity token.
 *
 * @param options - Factory options
 * @param plugins - Optional middleware plugins
 * @returns Role assumer with web identity function
 *
 * @example
 * ```typescript
 * const roleAssumer = getDefaultRoleAssumerWithWebIdentity({ region: 'us-east-1' });
 *
 * const credentials = await roleAssumer({
 *   RoleArn: 'arn:aws:iam::123456789012:role/MyRole',
 *   RoleSessionName: 'my-session',
 *   WebIdentityToken: 'eyJ...',
 * });
 * ```
 */
export function getDefaultRoleAssumerWithWebIdentity(
  options: RoleAssumerFactoryOptions = {},
  plugins?: MiddlewarePlugin[]
): RoleAssumerWithWebIdentity {
  const ClientClass = getCustomizableStsClientCtor(plugins);
  let stsClient: STSClient | undefined;

  return async (params: AssumeRoleWithWebIdentityParams): Promise<AWSCredentials> => {
    // Create STS client lazily
    if (!stsClient) {
      const logger = options.logger ?? options.parentClientConfig?.logger;
      const requestHandler = options.parentClientConfig?.requestHandler;
      const credentialProviderLogger = options.credentialProviderLogger;

      const resolvedRegion = await resolveRegion(
        options.region,
        options.parentClientConfig?.region,
        DEFAULT_STS_REGION,
        credentialProviderLogger as { debug?: (message: string, ...args: unknown[]) => void } | undefined
      );

      // Only use custom request handler if not HTTP/2
      const useRequestHandler = !isH2(requestHandler);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientConfig: any = {
        profile: options.parentClientConfig?.profile,
        region: resolvedRegion,
        logger,
      };
      if (useRequestHandler && requestHandler) {
        clientConfig.requestHandler = requestHandler;
      }
      stsClient = new ClientClass(clientConfig);
    }

    // Build AssumeRoleWithWebIdentity command input
    const input: AssumeRoleWithWebIdentityCommandInput = {
      RoleArn: params.RoleArn,
      RoleSessionName: params.RoleSessionName,
      WebIdentityToken: params.WebIdentityToken,
      ProviderId: params.ProviderId,
      PolicyArns: params.PolicyArns?.map((p) => ({ arn: p.arn })),
      Policy: params.Policy,
      DurationSeconds: params.DurationSeconds,
    };

    // Execute AssumeRoleWithWebIdentity
    const response = await stsClient!.send(new AssumeRoleWithWebIdentityCommand(input));

    // Validate response
    if (
      !response.Credentials ||
      !response.Credentials.AccessKeyId ||
      !response.Credentials.SecretAccessKey
    ) {
      throw new Error(
        `Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`
      );
    }

    // Extract account ID from assumed role user
    const accountId = getAccountIdFromAssumedRoleUser(response.AssumedRoleUser);

    // Build credentials object - cast to extended type for CredentialScope
    const webCreds = response.Credentials as { CredentialScope?: string } & typeof response.Credentials;
    const assumedCredentials: AWSCredentials = {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
      ...(webCreds.CredentialScope && {
        credentialScope: webCreds.CredentialScope,
      }),
      ...(accountId && { accountId }),
    };

    // Set telemetry features
    if (accountId) {
      setCredentialFeature(assumedCredentials, 'RESOLVED_ACCOUNT_ID', 'T');
    }

    return setCredentialFeature(assumedCredentials, 'CREDENTIALS_STS_ASSUME_ROLE_WEB_ID', 'k');
  };
}

/**
 * STS service error types
 */
export class STSServiceException extends Error {
  readonly $fault: 'client' | 'server' = 'client';
  readonly $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    extendedRequestId?: string;
    cfId?: string;
  };

  constructor(options: {
    name: string;
    message?: string;
    $fault?: 'client' | 'server';
    $metadata?: {
      httpStatusCode?: number;
      requestId?: string;
    };
  }) {
    super(options.message || options.name);
    this.name = options.name;
    if (options.$fault) {
      (this as { $fault: 'client' | 'server' }).$fault = options.$fault;
    }
    this.$metadata = options.$metadata;
    Object.setPrototypeOf(this, STSServiceException.prototype);
  }
}

/**
 * Expired token exception
 */
export class ExpiredTokenException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'ExpiredTokenException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, ExpiredTokenException.prototype);
  }
}

/**
 * Malformed policy document exception
 */
export class MalformedPolicyDocumentException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'MalformedPolicyDocumentException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, MalformedPolicyDocumentException.prototype);
  }
}

/**
 * Packed policy too large exception
 */
export class PackedPolicyTooLargeException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'PackedPolicyTooLargeException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, PackedPolicyTooLargeException.prototype);
  }
}

/**
 * Region disabled exception
 */
export class RegionDisabledException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'RegionDisabledException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, RegionDisabledException.prototype);
  }
}

/**
 * IDP rejected claim exception
 */
export class IDPRejectedClaimException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'IDPRejectedClaimException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, IDPRejectedClaimException.prototype);
  }
}

/**
 * Invalid identity token exception
 */
export class InvalidIdentityTokenException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'InvalidIdentityTokenException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, InvalidIdentityTokenException.prototype);
  }
}

/**
 * IDP communication error exception
 */
export class IDPCommunicationErrorException extends STSServiceException {
  constructor(message?: string) {
    super({
      name: 'IDPCommunicationErrorException',
      message,
      $fault: 'client',
    });
    Object.setPrototypeOf(this, IDPCommunicationErrorException.prototype);
  }
}

// Re-export STS client and commands for direct usage
export {
  STSClient,
  AssumeRoleCommand,
  AssumeRoleWithWebIdentityCommand,
  type AssumeRoleCommandInput,
  type AssumeRoleCommandOutput,
  type AssumeRoleWithWebIdentityCommandInput,
  type AssumeRoleWithWebIdentityCommandOutput,
};
