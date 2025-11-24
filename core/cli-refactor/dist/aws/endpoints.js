/**
 * AWS Endpoint Resolution Module
 *
 * Provides endpoint resolution and caching for AWS services.
 *
 * @module aws/endpoints
 */
/**
 * Default STS region fallback
 */
export const DEFAULT_STS_REGION = 'us-east-1';
/**
 * AWS partitions configuration
 */
export const AWS_PARTITIONS = [
    {
        id: 'aws',
        regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3', 'ap-southeast-1', 'ap-southeast-2', 'ap-south-1', 'sa-east-1', 'ca-central-1', 'me-south-1', 'af-south-1'],
        defaultRegion: 'us-east-1',
        hostnamePattern: '{service}.{region}.amazonaws.com',
        dnsSuffix: 'amazonaws.com',
    },
    {
        id: 'aws-cn',
        regions: ['cn-north-1', 'cn-northwest-1'],
        defaultRegion: 'cn-north-1',
        hostnamePattern: '{service}.{region}.amazonaws.com.cn',
        dnsSuffix: 'amazonaws.com.cn',
    },
    {
        id: 'aws-us-gov',
        regions: ['us-gov-west-1', 'us-gov-east-1'],
        defaultRegion: 'us-gov-west-1',
        hostnamePattern: '{service}.{region}.amazonaws.com',
        dnsSuffix: 'amazonaws.com',
    },
];
/**
 * Get partition for a region
 *
 * @param region - AWS region
 * @returns Partition configuration
 */
export function getPartitionForRegion(region) {
    for (const partition of AWS_PARTITIONS) {
        if (partition.regions.includes(region)) {
            return partition;
        }
        // Check for partition prefix
        if (region.startsWith('cn-') && partition.id === 'aws-cn') {
            return partition;
        }
        if (region.startsWith('us-gov-') && partition.id === 'aws-us-gov') {
            return partition;
        }
    }
    // Default to standard AWS partition
    return AWS_PARTITIONS[0];
}
/**
 * Endpoint cache for resolved endpoints
 */
const endpointCache = new Map();
/**
 * Endpoint cache TTL in milliseconds (5 minutes)
 */
const ENDPOINT_CACHE_TTL = 5 * 60 * 1000;
/**
 * Internal cache storage with TTL
 */
const cacheWithTTL = new Map();
/**
 * Get cached endpoint
 *
 * @param key - Cache key
 * @returns Cached endpoint or undefined
 */
export function getCachedEndpoint(key) {
    const entry = cacheWithTTL.get(key);
    if (!entry) {
        return undefined;
    }
    // Check if expired
    if (Date.now() - entry.timestamp > ENDPOINT_CACHE_TTL) {
        cacheWithTTL.delete(key);
        return undefined;
    }
    return entry.endpoint;
}
/**
 * Set cached endpoint
 *
 * @param key - Cache key
 * @param endpoint - Endpoint to cache
 */
export function setCachedEndpoint(key, endpoint) {
    cacheWithTTL.set(key, {
        endpoint,
        timestamp: Date.now(),
    });
}
/**
 * Clear endpoint cache
 */
export function clearEndpointCache() {
    cacheWithTTL.clear();
    endpointCache.clear();
}
/**
 * Resolve STS endpoint for a region
 *
 * @param region - AWS region
 * @param useFipsEndpoint - Whether to use FIPS endpoint
 * @param useDualstackEndpoint - Whether to use dualstack endpoint
 * @returns Resolved endpoint
 */
export function resolveSTSEndpoint(region, useFipsEndpoint = false, useDualstackEndpoint = false) {
    const cacheKey = `sts:${region}:fips=${useFipsEndpoint}:dualstack=${useDualstackEndpoint}`;
    const cached = getCachedEndpoint(cacheKey);
    if (cached) {
        return cached;
    }
    const partition = getPartitionForRegion(region);
    let hostname;
    if (useFipsEndpoint && useDualstackEndpoint) {
        hostname = `sts-fips.${region}.api.aws`;
    }
    else if (useFipsEndpoint) {
        hostname = `sts-fips.${region}.amazonaws.com`;
    }
    else if (useDualstackEndpoint) {
        hostname = `sts.${region}.api.aws`;
    }
    else {
        // Standard endpoint
        hostname = partition.hostnamePattern
            .replace('{service}', 'sts')
            .replace('{region}', region);
    }
    const endpoint = {
        protocol: 'https',
        hostname,
        path: '/',
    };
    setCachedEndpoint(cacheKey, endpoint);
    return endpoint;
}
/**
 * Resolve generic AWS service endpoint
 *
 * @param service - Service name
 * @param region - AWS region
 * @param options - Endpoint resolution options
 * @returns Resolved endpoint
 */
export function resolveServiceEndpoint(service, region, options = {}) {
    const { useFipsEndpoint = false, useDualstackEndpoint = false, customEndpoint } = options;
    // Use custom endpoint if provided
    if (customEndpoint) {
        const url = new URL(customEndpoint);
        return {
            url,
            protocol: url.protocol.replace(':', ''),
            hostname: url.hostname,
            port: url.port ? parseInt(url.port, 10) : undefined,
            path: url.pathname,
        };
    }
    const cacheKey = `${service}:${region}:fips=${useFipsEndpoint}:dualstack=${useDualstackEndpoint}`;
    const cached = getCachedEndpoint(cacheKey);
    if (cached) {
        return cached;
    }
    const partition = getPartitionForRegion(region);
    let hostname;
    if (useFipsEndpoint && useDualstackEndpoint) {
        hostname = `${service}-fips.${region}.api.aws`;
    }
    else if (useFipsEndpoint) {
        hostname = `${service}-fips.${region}.${partition.dnsSuffix}`;
    }
    else if (useDualstackEndpoint) {
        hostname = `${service}.${region}.api.aws`;
    }
    else {
        hostname = partition.hostnamePattern
            .replace('{service}', service)
            .replace('{region}', region);
    }
    const endpoint = {
        protocol: 'https',
        hostname,
        path: '/',
    };
    setCachedEndpoint(cacheKey, endpoint);
    return endpoint;
}
/**
 * Update request with service endpoint
 *
 * @param request - HTTP request to update
 * @param endpoint - Resolved endpoint
 * @returns Updated request
 */
export function updateServiceEndpoint(request, endpoint) {
    const updatedRequest = { ...request };
    if (endpoint.url) {
        const url = endpoint.url;
        updatedRequest.protocol = url.protocol.replace(':', '');
        updatedRequest.hostname = url.hostname;
        updatedRequest.port = url.port ? parseInt(url.port, 10) : undefined;
        updatedRequest.path = url.pathname;
        updatedRequest.fragment = url.hash || undefined;
        updatedRequest.username = url.username || undefined;
        updatedRequest.password = url.password || undefined;
        // Parse query parameters
        if (url.searchParams) {
            updatedRequest.query = updatedRequest.query || {};
            url.searchParams.forEach((value, key) => {
                updatedRequest.query[key] = value;
            });
        }
    }
    else {
        updatedRequest.protocol = endpoint.protocol || 'https';
        updatedRequest.hostname = endpoint.hostname;
        updatedRequest.port = endpoint.port;
        updatedRequest.path = endpoint.path || '/';
        updatedRequest.query = {
            ...updatedRequest.query,
            ...endpoint.query,
        };
    }
    return updatedRequest;
}
/**
 * Resolve region from configuration
 *
 * Accepts multiple region sources and returns the first valid one.
 *
 * @param regionProvider - Region provider function
 * @param parentRegion - Parent client region
 * @param defaultRegion - Default fallback region
 * @param logger - Optional logger for debugging
 * @returns Resolved region
 */
export async function resolveRegion(regionProvider, parentRegion, defaultRegion = DEFAULT_STS_REGION, logger) {
    const providerResult = typeof regionProvider === 'function'
        ? await regionProvider()
        : regionProvider;
    const parentResult = typeof parentRegion === 'function'
        ? await parentRegion()
        : parentRegion;
    logger?.debug?.('@aws-sdk/client-sts::resolveRegion', 'accepting first of:', `${providerResult} (provider)`, `${parentResult} (parent client)`, `${defaultRegion} (STS default)`);
    return providerResult ?? parentResult ?? defaultRegion;
}
/**
 * Set host prefix on request
 *
 * Some operations require a host prefix (e.g., S3 bucket virtual hosting).
 *
 * @param request - HTTP request to update
 * @param prefix - Host prefix to add
 * @returns Updated request
 */
export function setHostPrefix(request, prefix) {
    return {
        ...request,
        hostname: prefix + request.hostname,
    };
}
/**
 * Build resolved path with parameters
 *
 * @param basePath - Base path template with {param} placeholders
 * @param params - Parameters to substitute
 * @returns Resolved path
 */
export function resolvedPath(basePath, params) {
    let resolved = basePath;
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            resolved = resolved.replace(`{${key}}`, encodeURIComponent(value));
            resolved = resolved.replace(`{${key}+}`, value.split('/').map(encodeURIComponent).join('/'));
        }
    }
    return resolved;
}
/**
 * Get account ID from assumed role user ARN
 *
 * @param assumedRoleUser - Assumed role user object with ARN
 * @returns Account ID or undefined
 */
export function getAccountIdFromAssumedRoleUser(assumedRoleUser) {
    if (typeof assumedRoleUser?.Arn === 'string') {
        const parts = assumedRoleUser.Arn.split(':');
        if (parts.length > 4 && parts[4] !== '') {
            return parts[4];
        }
    }
    return undefined;
}
//# sourceMappingURL=endpoints.js.map