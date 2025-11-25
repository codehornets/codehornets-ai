/**
 * AWS Integration Module
 *
 * This module provides a comprehensive AWS integration layer for the CLI,
 * including credential management, STS operations, authentication,
 * endpoint resolution, and protocol utilities.
 *
 * @module aws
 *
 * @example
 * ```typescript
 * import {
 *   defaultProvider,
 *   getDefaultRoleAssumer,
 *   STSClient,
 *   fromBase64,
 *   toBase64,
 * } from './aws.js';
 *
 * // Use default credential provider chain
 * const credentials = await defaultProvider()();
 *
 * // Assume a role
 * const roleAssumer = getDefaultRoleAssumer({ region: 'us-east-1' });
 * const tempCredentials = await roleAssumer(credentials, {
 *   RoleArn: 'arn:aws:iam::123456789012:role/MyRole',
 *   RoleSessionName: 'my-session',
 * });
 * ```
 */
export type { AWSCredentials, CredentialProvider, CredentialProviderOptions, DefaultProviderOptions, FromEnvOptions, FromIniOptions, FromProcessOptions, FromTokenFileOptions, FromContainerMetadataOptions, FromInstanceMetadataOptions, FromSSOOptions, AssumeRoleParams, AssumeRoleWithWebIdentityParams, RoleAssumer, RoleAssumerWithWebIdentity, ParentClientConfig, ClientConfig, CallerClientConfig, CredentialProviderInit, AuthSchemeId, HttpAuthScheme, HttpSigner, HttpRequest, HttpResponse, Identity, IdentityProvider, IdentityProviderConfig, ApiKeyIdentity, TokenIdentity, Endpoint, ResponseMetadata, MiddlewarePlugin, MiddlewareStack, RequestHandler, PolicyDescriptor, Tag, ProvidedContext, CredentialFeature, STSErrorName, STSError, } from './types.js';
export { CREDENTIAL_FEATURE_CODES } from './types.js';
export { fromBase64, toBase64, fromUtf8, toUtf8, extendedEncodeURIComponent, parseDate, parseRfc3339DateTimeWithOffset, formatRfc3339DateTime, expectString, strictParseInt32, buildFormUrlencodedString, collectBody, toHex, fromHex, } from './encoding.js';
export { DefaultIdentityProviderConfig, HttpApiKeyAuthSigner, HttpBearerAuthSigner, NoAuthSigner, HttpApiKeyAuthLocation, SMITHY_CONTEXT_KEY, EXPIRATION_MS, doesIdentityRequireRefresh, createIsIdentityExpiredFunction, isIdentityExpired, memoizeIdentityProvider, normalizeProvider, getSmithyContext, setFeature, setCredentialFeature, httpAuthSchemeEndpointRuleSetMiddlewareOptions, httpAuthSchemeMiddlewareOptions, httpSigningMiddlewareOptions, resolveAuthOptions, } from './auth.js';
export { DEFAULT_STS_REGION, AWS_PARTITIONS, getPartitionForRegion, getCachedEndpoint, setCachedEndpoint, clearEndpointCache, resolveSTSEndpoint, resolveServiceEndpoint, updateServiceEndpoint, resolveRegion, setHostPrefix, resolvedPath, getAccountIdFromAssumedRoleUser, } from './endpoints.js';
export type { PartitionConfig } from './endpoints.js';
export { RequestBuilder, requestBuilder, QUERY_PROTOCOL_HEADERS, JSON_PROTOCOL_HEADERS, STS_API_VERSION, buildHttpRpcRequest, deserializeMetadata, serializeAssumeRoleRequest, serializeAssumeRoleWithWebIdentityRequest, parseXmlErrorBody, parseXmlBody, loadQueryErrorCode, determineTimestampFormat, } from './protocols.js';
export { ENV_KEY, ENV_SECRET, ENV_SESSION, ENV_EXPIRATION, ENV_PROFILE, ENV_CMDS_FULL_URI, ENV_CMDS_RELATIVE_URI, ENV_EC2_METADATA_DISABLED, ENV_WEB_IDENTITY_TOKEN_FILE, ENV_ROLE_ARN, ENV_ROLE_SESSION_NAME, fromEnv, fromIni, fromProcess, fromTokenFile, fromContainerMetadata, fromInstanceMetadata, fromSSO, remoteProvider, defaultProvider, credentialsWillNeedRefresh, credentialsTreatedAsExpired, decorateDefaultCredentialProvider, CredentialsProviderError, } from './credentials.js';
export { STSClient, AssumeRoleCommand, AssumeRoleWithWebIdentityCommand, getDefaultRoleAssumer, getDefaultRoleAssumerWithWebIdentity, STSServiceException, ExpiredTokenException, MalformedPolicyDocumentException, PackedPolicyTooLargeException, RegionDisabledException, IDPRejectedClaimException, InvalidIdentityTokenException, IDPCommunicationErrorException, } from './sts.js';
export type { STSClientOptions, RoleAssumerFactoryOptions, AssumeRoleCommandInput, AssumeRoleCommandOutput, AssumeRoleWithWebIdentityCommandInput, AssumeRoleWithWebIdentityCommandOutput, } from './sts.js';
//# sourceMappingURL=index.d.ts.map