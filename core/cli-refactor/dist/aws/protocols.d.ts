/**
 * AWS HTTP Protocol Module
 *
 * Provides HTTP binding and RPC protocol implementations
 * for AWS service operations.
 *
 * @module aws/protocols
 */
import type { HttpRequest, HttpResponse, Endpoint, ResponseMetadata } from './types.js';
/**
 * HTTP request builder for constructing AWS requests
 */
export declare class RequestBuilder {
    private method;
    private protocol;
    private hostname;
    private port?;
    private basePath;
    private headers;
    private query;
    private body?;
    /**
     * Set HTTP method
     */
    setMethod(method: string): this;
    /**
     * Set request protocol
     */
    setProtocol(protocol: string): this;
    /**
     * Set request hostname
     */
    setHostname(hostname: string): this;
    /**
     * Set request port
     */
    setPort(port: number): this;
    /**
     * Set base path
     */
    setBasePath(path: string): this;
    /**
     * Set a header
     */
    setHeader(name: string, value: string): this;
    /**
     * Set multiple headers
     */
    setHeaders(headers: Record<string, string>): this;
    /**
     * Set a query parameter
     */
    setQuery(name: string, value: string | string[]): this;
    /**
     * Set multiple query parameters
     */
    setQueryParams(params: Record<string, string | string[] | undefined>): this;
    /**
     * Set request body
     */
    setBody(body: unknown): this;
    /**
     * Build the HTTP request
     */
    build(): HttpRequest;
}
/**
 * Create a new request builder
 *
 * @returns New RequestBuilder instance
 */
export declare function requestBuilder(): RequestBuilder;
/**
 * Standard AWS query protocol headers
 */
export declare const QUERY_PROTOCOL_HEADERS: {
    'content-type': string;
};
/**
 * JSON protocol headers
 */
export declare const JSON_PROTOCOL_HEADERS: {
    'content-type': string;
};
/**
 * AWS Query protocol version
 */
export declare const STS_API_VERSION = "2011-06-15";
/**
 * Build HTTP RPC request
 *
 * @param endpoint - Service endpoint
 * @param headers - Request headers
 * @param path - Request path
 * @param hostname - Optional hostname override
 * @param body - Request body
 * @returns HTTP request
 */
export declare function buildHttpRpcRequest(endpoint: {
    endpoint: () => Promise<Endpoint>;
}, headers: Record<string, string>, path: string, hostname: string | undefined, body: string | undefined): Promise<HttpRequest>;
/**
 * Deserialize response metadata
 *
 * @param response - HTTP response
 * @returns Response metadata
 */
export declare function deserializeMetadata(response: HttpResponse): ResponseMetadata;
/**
 * Serialize AssumeRole request parameters
 *
 * @param input - AssumeRole input parameters
 * @returns Serialized form parameters
 */
export declare function serializeAssumeRoleRequest(input: {
    RoleArn?: string;
    RoleSessionName?: string;
    PolicyArns?: Array<{
        arn?: string;
    }>;
    Policy?: string;
    DurationSeconds?: number;
    Tags?: Array<{
        Key?: string;
        Value?: string;
    }>;
    TransitiveTagKeys?: string[];
    ExternalId?: string;
    SerialNumber?: string;
    TokenCode?: string;
    SourceIdentity?: string;
    ProvidedContexts?: Array<{
        ProviderArn?: string;
        ContextAssertion?: string;
    }>;
}): Record<string, string>;
/**
 * Serialize AssumeRoleWithWebIdentity request parameters
 *
 * @param input - AssumeRoleWithWebIdentity input parameters
 * @returns Serialized form parameters
 */
export declare function serializeAssumeRoleWithWebIdentityRequest(input: {
    RoleArn?: string;
    RoleSessionName?: string;
    WebIdentityToken?: string;
    ProviderId?: string;
    PolicyArns?: Array<{
        arn?: string;
    }>;
    Policy?: string;
    DurationSeconds?: number;
}): Record<string, string>;
/**
 * Parse XML error body
 *
 * @param body - Response body
 * @returns Parsed error
 */
export declare function parseXmlErrorBody(body: Uint8Array | string): Promise<{
    Error?: {
        Code?: string;
        Message?: string;
    };
}>;
/**
 * Parse XML response body
 *
 * @param body - Response body
 * @returns Parsed XML as object
 */
export declare function parseXmlBody(body: Uint8Array | string): Promise<Record<string, unknown>>;
/**
 * Load query error code from response
 *
 * @param response - HTTP response
 * @param body - Parsed error body
 * @returns Error code
 */
export declare function loadQueryErrorCode(response: HttpResponse, body: {
    Error?: {
        Code?: string;
    };
}): string | undefined;
/**
 * Determine timestamp format for a schema
 *
 * @param trait - Schema trait
 * @returns Timestamp format string
 */
export declare function determineTimestampFormat(trait?: {
    timestampFormat?: string;
}): string;
//# sourceMappingURL=protocols.d.ts.map