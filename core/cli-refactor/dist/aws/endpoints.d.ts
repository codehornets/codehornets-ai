/**
 * AWS Endpoint Resolution Module
 *
 * Provides endpoint resolution and caching for AWS services.
 *
 * @module aws/endpoints
 */
import type { Endpoint, HttpRequest } from './types.js';
/**
 * Default STS region fallback
 */
export declare const DEFAULT_STS_REGION = "us-east-1";
/**
 * AWS partition configuration
 */
export interface PartitionConfig {
    /** Partition ID (e.g., 'aws', 'aws-cn', 'aws-gov') */
    id: string;
    /** Regions in this partition */
    regions: string[];
    /** Default region for partition */
    defaultRegion: string;
    /** Hostname pattern */
    hostnamePattern: string;
    /** DNS suffix */
    dnsSuffix: string;
}
/**
 * AWS partitions configuration
 */
export declare const AWS_PARTITIONS: PartitionConfig[];
/**
 * Get partition for a region
 *
 * @param region - AWS region
 * @returns Partition configuration
 */
export declare function getPartitionForRegion(region: string): PartitionConfig;
/**
 * Get cached endpoint
 *
 * @param key - Cache key
 * @returns Cached endpoint or undefined
 */
export declare function getCachedEndpoint(key: string): Endpoint | undefined;
/**
 * Set cached endpoint
 *
 * @param key - Cache key
 * @param endpoint - Endpoint to cache
 */
export declare function setCachedEndpoint(key: string, endpoint: Endpoint): void;
/**
 * Clear endpoint cache
 */
export declare function clearEndpointCache(): void;
/**
 * Resolve STS endpoint for a region
 *
 * @param region - AWS region
 * @param useFipsEndpoint - Whether to use FIPS endpoint
 * @param useDualstackEndpoint - Whether to use dualstack endpoint
 * @returns Resolved endpoint
 */
export declare function resolveSTSEndpoint(region: string, useFipsEndpoint?: boolean, useDualstackEndpoint?: boolean): Endpoint;
/**
 * Resolve generic AWS service endpoint
 *
 * @param service - Service name
 * @param region - AWS region
 * @param options - Endpoint resolution options
 * @returns Resolved endpoint
 */
export declare function resolveServiceEndpoint(service: string, region: string, options?: {
    useFipsEndpoint?: boolean;
    useDualstackEndpoint?: boolean;
    customEndpoint?: string;
}): Endpoint;
/**
 * Update request with service endpoint
 *
 * @param request - HTTP request to update
 * @param endpoint - Resolved endpoint
 * @returns Updated request
 */
export declare function updateServiceEndpoint(request: HttpRequest, endpoint: Endpoint): HttpRequest;
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
export declare function resolveRegion(regionProvider: string | (() => Promise<string>) | undefined, parentRegion: string | (() => Promise<string>) | undefined, defaultRegion?: string, logger?: {
    debug?: (message: string, ...args: unknown[]) => void;
}): Promise<string>;
/**
 * Set host prefix on request
 *
 * Some operations require a host prefix (e.g., S3 bucket virtual hosting).
 *
 * @param request - HTTP request to update
 * @param prefix - Host prefix to add
 * @returns Updated request
 */
export declare function setHostPrefix(request: HttpRequest, prefix: string): HttpRequest;
/**
 * Build resolved path with parameters
 *
 * @param basePath - Base path template with {param} placeholders
 * @param params - Parameters to substitute
 * @returns Resolved path
 */
export declare function resolvedPath(basePath: string, params: Record<string, string | undefined>): string;
/**
 * Get account ID from assumed role user ARN
 *
 * @param assumedRoleUser - Assumed role user object with ARN
 * @returns Account ID or undefined
 */
export declare function getAccountIdFromAssumedRoleUser(assumedRoleUser?: {
    Arn?: string;
}): string | undefined;
//# sourceMappingURL=endpoints.d.ts.map