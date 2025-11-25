/**
 * AWS Authentication Module
 *
 * Provides authentication schemes, identity providers, and request signing
 * for AWS SDK operations.
 *
 * @module aws/auth
 */
/**
 * HTTP API Key Auth locations
 */
export var HttpApiKeyAuthLocation;
(function (HttpApiKeyAuthLocation) {
    HttpApiKeyAuthLocation["HEADER"] = "header";
    HttpApiKeyAuthLocation["QUERY"] = "query";
})(HttpApiKeyAuthLocation || (HttpApiKeyAuthLocation = {}));
/**
 * Smithy context key for storing auth state
 */
export const SMITHY_CONTEXT_KEY = '__smithy_context';
/**
 * Expiration threshold in milliseconds (5 minutes)
 * Used to determine when credentials need refresh
 */
export const EXPIRATION_MS = 300000;
/**
 * Default identity provider configuration
 *
 * Manages identity providers for different authentication schemes.
 */
export class DefaultIdentityProviderConfig {
    authSchemes;
    /**
     * Create a new identity provider configuration
     *
     * @param config - Map of scheme IDs to identity providers
     */
    constructor(config) {
        this.authSchemes = new Map();
        for (const [schemeId, provider] of Object.entries(config)) {
            if (provider !== undefined) {
                this.authSchemes.set(schemeId, provider);
            }
        }
    }
    /**
     * Get identity provider for a specific scheme
     *
     * @param schemeId - Authentication scheme identifier
     * @returns Identity provider or undefined
     */
    getIdentityProvider(schemeId) {
        return this.authSchemes.get(schemeId);
    }
}
/**
 * HTTP API Key Auth Signer
 *
 * Signs requests using API key authentication, placing the key
 * in either a header or query parameter.
 */
export class HttpApiKeyAuthSigner {
    /**
     * Sign a request with API key authentication
     *
     * @param request - HTTP request to sign
     * @param identity - API key identity
     * @param signingProperties - Signing configuration
     * @returns Signed HTTP request
     */
    async sign(request, identity, signingProperties) {
        if (!signingProperties) {
            throw new Error('request could not be signed with `apiKey` since the `name` and `in` signer properties are missing');
        }
        const { name, in: location, scheme } = signingProperties;
        if (!name) {
            throw new Error('request could not be signed with `apiKey` since the `name` signer property is missing');
        }
        if (!location) {
            throw new Error('request could not be signed with `apiKey` since the `in` signer property is missing');
        }
        const apiKeyIdentity = identity;
        if (!apiKeyIdentity.apiKey) {
            throw new Error('request could not be signed with `apiKey` since the `apiKey` is not defined');
        }
        // Clone the request
        const signedRequest = {
            ...request,
            headers: { ...request.headers },
            query: request.query ? { ...request.query } : undefined,
        };
        if (location === HttpApiKeyAuthLocation.QUERY) {
            signedRequest.query = signedRequest.query || {};
            signedRequest.query[name] = apiKeyIdentity.apiKey;
        }
        else if (location === HttpApiKeyAuthLocation.HEADER) {
            signedRequest.headers[name] = scheme
                ? `${scheme} ${apiKeyIdentity.apiKey}`
                : apiKeyIdentity.apiKey;
        }
        else {
            throw new Error(`request can only be signed with \`apiKey\` locations \`query\` or \`header\`, but found: \`${location}\``);
        }
        return signedRequest;
    }
}
/**
 * HTTP Bearer Auth Signer
 *
 * Signs requests using Bearer token authentication.
 */
export class HttpBearerAuthSigner {
    /**
     * Sign a request with Bearer token authentication
     *
     * @param request - HTTP request to sign
     * @param identity - Token identity
     * @param signingProperties - Signing configuration (unused)
     * @returns Signed HTTP request
     */
    async sign(request, identity, _signingProperties) {
        const tokenIdentity = identity;
        if (!tokenIdentity.token) {
            throw new Error('request could not be signed with `token` since the `token` is not defined');
        }
        // Clone the request and add Authorization header
        return {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Bearer ${tokenIdentity.token}`,
            },
        };
    }
}
/**
 * No Auth Signer
 *
 * Pass-through signer for operations that don't require authentication.
 */
export class NoAuthSigner {
    /**
     * Return request unchanged (no signing required)
     *
     * @param request - HTTP request
     * @returns Unchanged HTTP request
     */
    async sign(request) {
        return request;
    }
}
/**
 * Check if an identity has an expiration time
 *
 * @param identity - Identity to check
 * @returns True if identity has expiration
 */
export function doesIdentityRequireRefresh(identity) {
    return identity.expiration !== undefined;
}
/**
 * Create a function to check if identity is expired
 *
 * @param thresholdMs - Expiration threshold in milliseconds
 * @returns Function that checks if identity is expired
 */
export function createIsIdentityExpiredFunction(thresholdMs) {
    return (identity) => {
        return (doesIdentityRequireRefresh(identity) &&
            identity.expiration.getTime() - Date.now() < thresholdMs);
    };
}
/**
 * Default identity expiration checker
 *
 * Uses 5-minute threshold (EXPIRATION_MS)
 */
export const isIdentityExpired = createIsIdentityExpiredFunction(EXPIRATION_MS);
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
export function memoizeIdentityProvider(identityProvider, isExpired, requiresRefresh) {
    if (identityProvider === undefined) {
        return undefined;
    }
    const provider = typeof identityProvider !== 'function'
        ? async () => Promise.resolve(identityProvider)
        : identityProvider;
    let memoizedIdentity;
    let pending;
    let hasResolved = false;
    let isConstant = false;
    const coalesceProvider = async (options) => {
        if (!pending) {
            pending = provider(options);
        }
        try {
            memoizedIdentity = await pending;
            hasResolved = true;
            isConstant = false;
        }
        finally {
            pending = undefined;
        }
        return memoizedIdentity;
    };
    // No expiration checking - always return cached value after first resolution
    if (isExpired === undefined) {
        return async (options) => {
            if (!hasResolved || options?.forceRefresh) {
                memoizedIdentity = await coalesceProvider(options);
            }
            return memoizedIdentity;
        };
    }
    // With expiration checking
    return async (options) => {
        if (!hasResolved || options?.forceRefresh) {
            memoizedIdentity = await coalesceProvider(options);
        }
        if (isConstant) {
            return memoizedIdentity;
        }
        if (!requiresRefresh?.(memoizedIdentity)) {
            isConstant = true;
            return memoizedIdentity;
        }
        if (isExpired(memoizedIdentity)) {
            await coalesceProvider(options);
            return memoizedIdentity;
        }
        return memoizedIdentity;
    };
}
/**
 * Normalize a provider value to a function
 *
 * @param provider - Static value or provider function
 * @returns Provider function
 */
export function normalizeProvider(provider) {
    if (typeof provider === 'function') {
        return provider;
    }
    const resolved = Promise.resolve(provider);
    return () => resolved;
}
/**
 * Get Smithy context from middleware context
 *
 * @param context - Middleware context object
 * @returns Smithy context object
 */
export function getSmithyContext(context) {
    return context[SMITHY_CONTEXT_KEY] || (context[SMITHY_CONTEXT_KEY] = {});
}
/**
 * Set a feature flag in the context
 *
 * @param context - Context object
 * @param feature - Feature name
 * @param value - Feature value
 */
export function setFeature(context, feature, value) {
    const smithyContext = context;
    if (!smithyContext.__smithy_context) {
        smithyContext.__smithy_context = { features: {} };
    }
    else if (!smithyContext.__smithy_context.features) {
        smithyContext.__smithy_context.features = {};
    }
    smithyContext.__smithy_context.features[feature] = value;
}
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
export function setCredentialFeature(credentials, feature, code) {
    const enhanced = credentials;
    if (!enhanced.$source) {
        enhanced.$source = {};
    }
    enhanced.$source[feature] = code;
    return enhanced;
}
/**
 * HTTP auth scheme middleware options for endpoint rule set
 */
export const httpAuthSchemeEndpointRuleSetMiddlewareOptions = {
    step: 'serialize',
    tags: ['HTTP_AUTH_SCHEME'],
    name: 'httpAuthSchemeMiddleware',
    override: true,
    relation: 'before',
    toMiddleware: 'endpointV2Middleware',
};
/**
 * HTTP auth scheme middleware options
 */
export const httpAuthSchemeMiddlewareOptions = {
    step: 'serialize',
    tags: ['HTTP_AUTH_SCHEME'],
    name: 'httpAuthSchemeMiddleware',
    override: true,
    relation: 'before',
    toMiddleware: 'serializerMiddleware',
};
/**
 * HTTP signing middleware options
 */
export const httpSigningMiddlewareOptions = {
    step: 'finalizeRequest',
    tags: ['HTTP_SIGNING'],
    name: 'httpSigningMiddleware',
    aliases: ['apiKeyMiddleware', 'tokenMiddleware', 'awsAuthMiddleware'],
    override: true,
    relation: 'after',
    toMiddleware: 'retryMiddleware',
};
/**
 * Resolve auth options based on preference
 *
 * @param authOptions - Available auth options
 * @param preference - Preferred auth scheme IDs
 * @returns Reordered auth options
 */
export function resolveAuthOptions(authOptions, preference) {
    if (!preference || preference.length === 0) {
        return authOptions;
    }
    const preferred = [];
    // Add preferred schemes first
    for (const schemeId of preference) {
        for (const option of authOptions) {
            if (option.schemeId.split('#')[1] === schemeId) {
                preferred.push(option);
            }
        }
    }
    // Add remaining schemes
    for (const option of authOptions) {
        if (!preferred.find(({ schemeId }) => schemeId === option.schemeId)) {
            preferred.push(option);
        }
    }
    return preferred;
}
//# sourceMappingURL=auth.js.map