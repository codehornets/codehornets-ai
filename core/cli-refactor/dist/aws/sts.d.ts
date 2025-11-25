/**
 * AWS STS Client Module
 *
 * Provides STS (Security Token Service) client wrapper for role assumption
 * and temporary credential operations.
 *
 * @module aws/sts
 */
import { STSClient, AssumeRoleCommand, AssumeRoleWithWebIdentityCommand, type AssumeRoleCommandInput, type AssumeRoleCommandOutput, type AssumeRoleWithWebIdentityCommandInput, type AssumeRoleWithWebIdentityCommandOutput } from '@aws-sdk/client-sts';
import type { AWSCredentials, RoleAssumer, RoleAssumerWithWebIdentity, CredentialProviderOptions, MiddlewarePlugin, RequestHandler } from './types.js';
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
export declare function getDefaultRoleAssumer(options?: RoleAssumerFactoryOptions, plugins?: MiddlewarePlugin[]): RoleAssumer;
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
export declare function getDefaultRoleAssumerWithWebIdentity(options?: RoleAssumerFactoryOptions, plugins?: MiddlewarePlugin[]): RoleAssumerWithWebIdentity;
/**
 * STS service error types
 */
export declare class STSServiceException extends Error {
    readonly $fault: 'client' | 'server';
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
    });
}
/**
 * Expired token exception
 */
export declare class ExpiredTokenException extends STSServiceException {
    constructor(message?: string);
}
/**
 * Malformed policy document exception
 */
export declare class MalformedPolicyDocumentException extends STSServiceException {
    constructor(message?: string);
}
/**
 * Packed policy too large exception
 */
export declare class PackedPolicyTooLargeException extends STSServiceException {
    constructor(message?: string);
}
/**
 * Region disabled exception
 */
export declare class RegionDisabledException extends STSServiceException {
    constructor(message?: string);
}
/**
 * IDP rejected claim exception
 */
export declare class IDPRejectedClaimException extends STSServiceException {
    constructor(message?: string);
}
/**
 * Invalid identity token exception
 */
export declare class InvalidIdentityTokenException extends STSServiceException {
    constructor(message?: string);
}
/**
 * IDP communication error exception
 */
export declare class IDPCommunicationErrorException extends STSServiceException {
    constructor(message?: string);
}
export { STSClient, AssumeRoleCommand, AssumeRoleWithWebIdentityCommand, type AssumeRoleCommandInput, type AssumeRoleCommandOutput, type AssumeRoleWithWebIdentityCommandInput, type AssumeRoleWithWebIdentityCommandOutput, };
//# sourceMappingURL=sts.d.ts.map