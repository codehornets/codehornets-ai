/**
 * AWS Integration Type Definitions
 *
 * This module defines TypeScript types for AWS credential handling,
 * authentication, and STS operations used throughout the CLI.
 *
 * @module aws/types
 */

import type { Logger } from '@smithy/types';
import type { AwsCredentialIdentity, Provider } from '@aws-sdk/types';

/**
 * AWS credentials with optional metadata
 */
export interface AWSCredentials extends AwsCredentialIdentity {
  /** AWS access key ID */
  accessKeyId: string;
  /** AWS secret access key */
  secretAccessKey: string;
  /** Optional session token for temporary credentials */
  sessionToken?: string;
  /** Optional expiration time for temporary credentials */
  expiration?: Date;
  /** Optional credential scope for scoped credentials */
  credentialScope?: string;
  /** Optional AWS account ID */
  accountId?: string;
}

/**
 * Options for credential providers
 */
export interface CredentialProviderOptions {
  /** Optional logger for debugging */
  logger?: Logger;
  /** AWS profile name to use */
  profile?: string;
  /** Parent client configuration */
  parentClientConfig?: ParentClientConfig;
  /** Custom client configuration */
  clientConfig?: ClientConfig;
  /** Custom client plugins */
  clientPlugins?: MiddlewarePlugin[];
}

/**
 * Parent client configuration passed to credential providers
 */
export interface ParentClientConfig {
  /** AWS region */
  region?: string | Provider<string>;
  /** AWS profile name */
  profile?: string;
  /** Logger instance */
  logger?: Logger;
  /** Request handler */
  requestHandler?: RequestHandler;
}

/**
 * Custom client configuration for STS operations
 */
export interface ClientConfig {
  /** AWS region */
  region?: string | Provider<string>;
  /** Custom endpoint */
  endpoint?: string;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Middleware plugin interface
 */
export interface MiddlewarePlugin {
  applyToStack: (stack: MiddlewareStack) => void;
}

/**
 * Middleware stack interface
 */
export interface MiddlewareStack {
  use: (plugin: MiddlewarePlugin) => void;
}

/**
 * Request handler interface
 */
export interface RequestHandler {
  metadata?: {
    handlerProtocol?: string;
  };
}

/**
 * Options for fromProcess credential provider
 */
export interface FromProcessOptions extends CredentialProviderOptions {
  /** Profile name to read from */
  profile?: string;
}

/**
 * Options for fromIni credential provider
 */
export interface FromIniOptions extends CredentialProviderOptions {
  /** Profile name to read from */
  profile?: string;
  /** MFA code provider function */
  mfaCodeProvider?: (serialNumber: string) => Promise<string>;
  /** Role assumer function for assume role */
  roleAssumer?: RoleAssumer;
  /** Role assumer for web identity */
  roleAssumerWithWebIdentity?: RoleAssumerWithWebIdentity;
}

/**
 * Options for fromEnv credential provider
 */
export interface FromEnvOptions extends CredentialProviderOptions {}

/**
 * Options for fromTokenFile (web identity) credential provider
 */
export interface FromTokenFileOptions extends CredentialProviderOptions {
  /** Path to the web identity token file */
  webIdentityTokenFile?: string;
  /** Role ARN to assume */
  roleArn?: string;
  /** Role session name */
  roleSessionName?: string;
  /** Role assumer for web identity */
  roleAssumerWithWebIdentity?: RoleAssumerWithWebIdentity;
}

/**
 * Options for fromContainerMetadata credential provider
 */
export interface FromContainerMetadataOptions extends CredentialProviderOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
}

/**
 * Options for fromInstanceMetadata (IMDS) credential provider
 */
export interface FromInstanceMetadataOptions extends CredentialProviderOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Maximum retries */
  maxRetries?: number;
}

/**
 * Options for SSO credential provider
 */
export interface FromSSOOptions extends CredentialProviderOptions {
  /** SSO start URL */
  ssoStartUrl?: string;
  /** SSO account ID */
  ssoAccountId?: string;
  /** SSO region */
  ssoRegion?: string;
  /** SSO role name */
  ssoRoleName?: string;
  /** SSO session name */
  ssoSession?: string;
}

/**
 * Options for the default credential provider chain
 */
export interface DefaultProviderOptions extends CredentialProviderOptions {
  /** SSO start URL */
  ssoStartUrl?: string;
  /** SSO account ID */
  ssoAccountId?: string;
  /** SSO region */
  ssoRegion?: string;
  /** SSO role name */
  ssoRoleName?: string;
  /** SSO session name */
  ssoSession?: string;
  /** MFA code provider function */
  mfaCodeProvider?: (serialNumber: string) => Promise<string>;
  /** Role assumer function */
  roleAssumer?: RoleAssumer;
  /** Role assumer for web identity */
  roleAssumerWithWebIdentity?: RoleAssumerWithWebIdentity;
}

/**
 * AssumeRole request parameters
 */
export interface AssumeRoleParams {
  /** ARN of the role to assume */
  RoleArn: string;
  /** Name for the assumed role session */
  RoleSessionName: string;
  /** External ID for cross-account access */
  ExternalId?: string;
  /** Duration in seconds */
  DurationSeconds?: number;
  /** Policy ARNs to attach */
  PolicyArns?: PolicyDescriptor[];
  /** Inline policy */
  Policy?: string;
  /** Tags for the session */
  Tags?: Tag[];
  /** Transitive tag keys */
  TransitiveTagKeys?: string[];
  /** MFA serial number */
  SerialNumber?: string;
  /** MFA token code */
  TokenCode?: string;
  /** Source identity */
  SourceIdentity?: string;
  /** Provided contexts */
  ProvidedContexts?: ProvidedContext[];
}

/**
 * AssumeRoleWithWebIdentity request parameters
 */
export interface AssumeRoleWithWebIdentityParams {
  /** ARN of the role to assume */
  RoleArn: string;
  /** Name for the assumed role session */
  RoleSessionName: string;
  /** Web identity token */
  WebIdentityToken: string;
  /** Identity provider ID */
  ProviderId?: string;
  /** Policy ARNs to attach */
  PolicyArns?: PolicyDescriptor[];
  /** Inline policy */
  Policy?: string;
  /** Duration in seconds */
  DurationSeconds?: number;
}

/**
 * Policy descriptor for assume role
 */
export interface PolicyDescriptor {
  /** ARN of the policy */
  arn?: string;
}

/**
 * Tag for session tagging
 */
export interface Tag {
  /** Tag key */
  Key: string;
  /** Tag value */
  Value: string;
}

/**
 * Provided context for assume role
 */
export interface ProvidedContext {
  /** Provider ARN */
  ProviderArn?: string;
  /** Context assertion */
  ContextAssertion?: string;
}

/**
 * Role assumer function type
 */
export type RoleAssumer = (
  credentials: AWSCredentials,
  params: AssumeRoleParams
) => Promise<AWSCredentials>;

/**
 * Role assumer with web identity function type
 */
export type RoleAssumerWithWebIdentity = (
  params: AssumeRoleWithWebIdentityParams
) => Promise<AWSCredentials>;

/**
 * Credential provider function type
 */
export type CredentialProvider = Provider<AWSCredentials>;

/**
 * Caller client config passed to credential providers
 */
export interface CallerClientConfig {
  /** AWS profile name */
  profile?: string;
  /** AWS region */
  region?: string;
}

/**
 * Credential provider init context
 */
export interface CredentialProviderInit {
  /** Caller client configuration */
  callerClientConfig?: CallerClientConfig;
}

/**
 * HTTP authentication scheme types
 */
export type AuthSchemeId =
  | 'aws.auth#sigv4'
  | 'aws.auth#sigv4a'
  | 'smithy.api#httpApiKeyAuth'
  | 'smithy.api#httpBearerAuth'
  | 'smithy.api#noAuth';

/**
 * Identity for authentication
 */
export interface Identity {
  /** Optional expiration time */
  expiration?: Date;
}

/**
 * API Key identity
 */
export interface ApiKeyIdentity extends Identity {
  /** API key value */
  apiKey: string;
}

/**
 * Bearer token identity
 */
export interface TokenIdentity extends Identity {
  /** Bearer token value */
  token: string;
}

/**
 * HTTP auth scheme configuration
 */
export interface HttpAuthScheme {
  /** Scheme identifier */
  schemeId: AuthSchemeId;
  /** Identity provider function */
  identityProvider: (config: IdentityProviderConfig) => IdentityProvider | undefined;
  /** Request signer */
  signer: HttpSigner;
}

/**
 * Identity provider configuration
 */
export interface IdentityProviderConfig {
  /** Get identity provider for a scheme */
  getIdentityProvider: (schemeId: string) => IdentityProvider | undefined;
}

/**
 * Identity provider function type
 */
export type IdentityProvider = (identityProperties?: Record<string, unknown>) => Promise<Identity>;

/**
 * HTTP request signer interface
 */
export interface HttpSigner {
  /** Sign an HTTP request */
  sign: (
    request: HttpRequest,
    identity: Identity,
    signingProperties?: Record<string, unknown>
  ) => Promise<HttpRequest>;
  /** Optional error handler */
  errorHandler?: (signingProperties: Record<string, unknown>) => (error: Error) => never;
  /** Optional success handler */
  successHandler?: (response: HttpResponse, signingProperties: Record<string, unknown>) => void;
}

/**
 * HTTP request interface
 */
export interface HttpRequest {
  /** Request method */
  method: string;
  /** Request protocol */
  protocol: string;
  /** Request hostname */
  hostname: string;
  /** Request port */
  port?: number;
  /** Request path */
  path: string;
  /** Request query parameters */
  query?: Record<string, string | string[]>;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Request fragment */
  fragment?: string;
  /** Request username */
  username?: string;
  /** Request password */
  password?: string;
}

/**
 * HTTP response interface
 */
export interface HttpResponse {
  /** Response status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body?: unknown;
}

/**
 * Endpoint interface
 */
export interface Endpoint {
  /** Endpoint URL */
  url?: URL;
  /** Endpoint protocol */
  protocol?: string;
  /** Endpoint hostname */
  hostname?: string;
  /** Endpoint port */
  port?: number;
  /** Endpoint path */
  path?: string;
  /** Endpoint query parameters */
  query?: Record<string, string | string[]>;
}

/**
 * Credential feature flags for telemetry
 */
export type CredentialFeature =
  | 'CREDENTIALS_ENV_VARS'
  | 'CREDENTIALS_ENV_VARS_STS_WEB_ID_TOKEN'
  | 'CREDENTIALS_PROFILE'
  | 'CREDENTIALS_PROFILE_NAMED_PROVIDER'
  | 'CREDENTIALS_PROFILE_SOURCE_PROFILE'
  | 'CREDENTIALS_PROFILE_SSO'
  | 'CREDENTIALS_PROFILE_SSO_LEGACY'
  | 'CREDENTIALS_PROFILE_STS_WEB_ID_TOKEN'
  | 'CREDENTIALS_PROFILE_PROCESS'
  | 'CREDENTIALS_PROCESS'
  | 'CREDENTIALS_STS_ASSUME_ROLE'
  | 'CREDENTIALS_STS_ASSUME_ROLE_WEB_ID'
  | 'RESOLVED_ACCOUNT_ID';

/**
 * Credential feature code mapping
 */
export const CREDENTIAL_FEATURE_CODES: Record<CredentialFeature, string> = {
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

/**
 * STS error types
 */
export type STSErrorName =
  | 'ExpiredTokenException'
  | 'MalformedPolicyDocumentException'
  | 'PackedPolicyTooLargeException'
  | 'RegionDisabledException'
  | 'IDPRejectedClaimException'
  | 'InvalidIdentityTokenException'
  | 'IDPCommunicationErrorException';

/**
 * STS error with metadata
 */
export interface STSError extends Error {
  /** Error name */
  name: STSErrorName;
  /** Error fault type */
  $fault: 'client' | 'server';
  /** HTTP metadata */
  $metadata?: ResponseMetadata;
}

/**
 * Response metadata from AWS
 */
export interface ResponseMetadata {
  /** HTTP status code */
  httpStatusCode?: number;
  /** Request ID */
  requestId?: string;
  /** Extended request ID */
  extendedRequestId?: string;
  /** CloudFront ID */
  cfId?: string;
}
