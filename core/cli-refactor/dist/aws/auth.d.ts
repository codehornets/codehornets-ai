/**
 * AWS Authentication Module
 *
 * Provides authentication schemes, identity providers, and request signing
 * for AWS SDK operations.
 *
 * @module aws/auth
 */
import type { HttpAuthScheme, HttpRequest, HttpSigner, Identity, IdentityProvider, IdentityProviderConfig, AWSCredentials } from './types.js';
/**
 * HTTP API Key Auth locations
 */
export declare enum HttpApiKeyAuthLocation {
    HEADER = "header",
    QUERY = "query"
}
/**
 * Smithy context key for storing auth state
 */
export declare const SMITHY_CONTEXT_KEY = "__smithy_context";
/**
 * Expiration threshold in milliseconds (5 minutes)
 * Used to determine when credentials need refresh
 */
export declare const EXPIRATION_MS = 300000;
/**
 * Default identity provider configuration
 *
 * Manages identity providers for different authentication schemes.
 */
export declare class DefaultIdentityProviderConfig implements IdentityProviderConfig {
    private authSchemes;
    /**
     * Create a new identity provider configuration
     *
     * @param config - Map of scheme IDs to identity providers
     */
    constructor(config: Record<string, IdentityProvider | undefined>);
    /**
     * Get identity provider for a specific scheme
     *
     * @param schemeId - Authentication scheme identifier
     * @returns Identity provider or undefined
     */
    getIdentityProvider(schemeId: string): IdentityProvider | undefined;
}
/**
 * HTTP API Key Auth Signer
 *
 * Signs requests using API key authentication, placing the key
 * in either a header or query parameter.
 */
export declare class HttpApiKeyAuthSigner implements HttpSigner {
    /**
     * Sign a request with API key authentication
     *
     * @param request - HTTP request to sign
     * @param identity - API key identity
     * @param signingProperties - Signing configuration
     * @returns Signed HTTP request
     */
    sign(request: HttpRequest, identity: Identity, signingProperties?: Record<string, unknown>): Promise<HttpRequest>;
}
/**
 * HTTP Bearer Auth Signer
 *
 * Signs requests using Bearer token authentication.
 */
export declare class HttpBearerAuthSigner implements HttpSigner {
    /**
     * Sign a request with Bearer token authentication
     *
     * @param request - HTTP request to sign
     * @param identity - Token identity
     * @param signingProperties - Signing configuration (unused)
     * @returns Signed HTTP request
     */
    sign(request: HttpRequest, identity: Identity, _signingProperties?: Record<string, unknown>): Promise<HttpRequest>;
}
/**
 * No Auth Signer
 *
 * Pass-through signer for operations that don't require authentication.
 */
export declare class NoAuthSigner implements HttpSigner {
    /**
     * Return request unchanged (no signing required)
     *
     * @param request - HTTP request
     * @returns Unchanged HTTP request
     */
    sign(request: HttpRequest): Promise<HttpRequest>;
}
/**
 * Check if an identity has an expiration time
 *
 * @param identity - Identity to check
 * @returns True if identity has expiration
 */
export declare function doesIdentityRequireRefresh(identity: Identity): boolean;
/**
 * Create a function to check if identity is expired
 *
 * @param thresholdMs - Expiration threshold in milliseconds
 * @returns Function that checks if identity is expired
 */
export declare function createIsIdentityExpiredFunction(thresholdMs: number): (identity: Identity) => boolean;
/**
 * Default identity expiration checker
 *
 * Uses 5-minute threshold (EXPIRATION_MS)
 */
export declare const isIdentityExpired: (identity: Identity) => boolean;
/**
 * Memoize an identity provider
 *
 * Caches the identity and handles automatic refresh when expired.
 *
 * @param identityProvider - Identity provider function to memoize
 * @param isExpired - Function to check if identity is expired
 * @param requiresRefresh - Function to check if identity requires refresh capability
 * @returns Memoized identity provider
 */
export declare function memoizeIdentityProvider<T extends Identity>(identityProvider: IdentityProvider | undefined, isExpired?: (identity: T) => boolean, requiresRefresh?: (identity: T) => boolean): ((options?: {
    forceRefresh?: boolean;
}) => Promise<T>) | undefined;
/**
 * Normalize a provider value to a function
 *
 * @param provider - Static value or provider function
 * @returns Provider function
 */
export declare function normalizeProvider<T>(provider: T | (() => Promise<T>)): () => Promise<T>;
/**
 * Get Smithy context from middleware context
 *
 * @param context - Middleware context object
 * @returns Smithy context object
 */
export declare function getSmithyContext(context: Record<string, unknown>): Record<string, unknown>;
/**
 * Set a feature flag in the context
 *
 * @param context - Context object
 * @param feature - Feature name
 * @param value - Feature value
 */
export declare function setFeature(context: Record<string, unknown>, feature: string, value: string): void;
/**
 * Set credential feature flag on credentials object
 *
 * This is used for telemetry to track which credential provider was used.
 *
 * @param credentials - Credentials object
 * @param feature - Feature name
 * @param code - Feature code
 * @returns Updated credentials
 */
export declare function setCredentialFeature<T extends AWSCredentials>(credentials: T, feature: string, code: string): T;
/**
 * HTTP auth scheme middleware options for endpoint rule set
 */
export declare const httpAuthSchemeEndpointRuleSetMiddlewareOptions: {
    step: "serialize";
    tags: string[];
    name: string;
    override: boolean;
    relation: "before";
    toMiddleware: string;
};
/**
 * HTTP auth scheme middleware options
 */
export declare const httpAuthSchemeMiddlewareOptions: {
    step: "serialize";
    tags: string[];
    name: string;
    override: boolean;
    relation: "before";
    toMiddleware: string;
};
/**
 * HTTP signing middleware options
 */
export declare const httpSigningMiddlewareOptions: {
    step: "finalizeRequest";
    tags: string[];
    name: string;
    aliases: string[];
    override: boolean;
    relation: "after";
    toMiddleware: string;
};
/**
 * Resolve auth options based on preference
 *
 * @param authOptions - Available auth options
 * @param preference - Preferred auth scheme IDs
 * @returns Reordered auth options
 */
export declare function resolveAuthOptions(authOptions: HttpAuthScheme[], preference?: string[]): HttpAuthScheme[];
//# sourceMappingURL=auth.d.ts.map