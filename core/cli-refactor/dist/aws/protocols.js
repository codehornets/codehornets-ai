/**
 * AWS HTTP Protocol Module
 *
 * Provides HTTP binding and RPC protocol implementations
 * for AWS service operations.
 *
 * @module aws/protocols
 */
/**
 * HTTP request builder for constructing AWS requests
 */
export class RequestBuilder {
    method = 'GET';
    protocol = 'https';
    hostname = '';
    port;
    basePath = '/';
    headers = {};
    query = {};
    body;
    /**
     * Set HTTP method
     */
    setMethod(method) {
        this.method = method;
        return this;
    }
    /**
     * Set request protocol
     */
    setProtocol(protocol) {
        this.protocol = protocol;
        return this;
    }
    /**
     * Set request hostname
     */
    setHostname(hostname) {
        this.hostname = hostname;
        return this;
    }
    /**
     * Set request port
     */
    setPort(port) {
        this.port = port;
        return this;
    }
    /**
     * Set base path
     */
    setBasePath(path) {
        this.basePath = path;
        return this;
    }
    /**
     * Set a header
     */
    setHeader(name, value) {
        this.headers[name] = value;
        return this;
    }
    /**
     * Set multiple headers
     */
    setHeaders(headers) {
        Object.assign(this.headers, headers);
        return this;
    }
    /**
     * Set a query parameter
     */
    setQuery(name, value) {
        this.query[name] = value;
        return this;
    }
    /**
     * Set multiple query parameters
     */
    setQueryParams(params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                this.query[key] = value;
            }
        }
        return this;
    }
    /**
     * Set request body
     */
    setBody(body) {
        this.body = body;
        return this;
    }
    /**
     * Build the HTTP request
     */
    build() {
        return {
            method: this.method,
            protocol: this.protocol,
            hostname: this.hostname,
            port: this.port,
            path: this.basePath,
            headers: { ...this.headers },
            query: Object.keys(this.query).length > 0 ? { ...this.query } : undefined,
            body: this.body,
        };
    }
}
/**
 * Create a new request builder
 *
 * @returns New RequestBuilder instance
 */
export function requestBuilder() {
    return new RequestBuilder();
}
/**
 * Standard AWS query protocol headers
 */
export const QUERY_PROTOCOL_HEADERS = {
    'content-type': 'application/x-www-form-urlencoded',
};
/**
 * JSON protocol headers
 */
export const JSON_PROTOCOL_HEADERS = {
    'content-type': 'application/x-amz-json-1.1',
};
/**
 * AWS Query protocol version
 */
export const STS_API_VERSION = '2011-06-15';
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
export async function buildHttpRpcRequest(endpoint, headers, path, hostname, body) {
    const resolvedEndpoint = await endpoint.endpoint();
    const request = {
        method: 'POST',
        protocol: resolvedEndpoint.protocol || 'https',
        hostname: resolvedEndpoint.hostname || '',
        port: resolvedEndpoint.port,
        path: resolvedEndpoint.path?.endsWith('/')
            ? resolvedEndpoint.path.slice(0, -1) + path
            : (resolvedEndpoint.path || '') + path,
        headers,
    };
    if (hostname !== undefined) {
        request.hostname = hostname;
    }
    if (body !== undefined) {
        request.body = body;
    }
    return request;
}
/**
 * Deserialize response metadata
 *
 * @param response - HTTP response
 * @returns Response metadata
 */
export function deserializeMetadata(response) {
    return {
        httpStatusCode: response.statusCode,
        requestId: response.headers['x-amzn-requestid'] ??
            response.headers['x-amzn-request-id'] ??
            response.headers['x-amz-request-id'],
        extendedRequestId: response.headers['x-amz-id-2'],
        cfId: response.headers['x-amz-cf-id'],
    };
}
/**
 * Serialize AssumeRole request parameters
 *
 * @param input - AssumeRole input parameters
 * @returns Serialized form parameters
 */
export function serializeAssumeRoleRequest(input) {
    const params = {
        Action: 'AssumeRole',
        Version: STS_API_VERSION,
    };
    if (input.RoleArn != null) {
        params.RoleArn = input.RoleArn;
    }
    if (input.RoleSessionName != null) {
        params.RoleSessionName = input.RoleSessionName;
    }
    if (input.Policy != null) {
        params.Policy = input.Policy;
    }
    if (input.DurationSeconds != null) {
        params.DurationSeconds = String(input.DurationSeconds);
    }
    if (input.ExternalId != null) {
        params.ExternalId = input.ExternalId;
    }
    if (input.SerialNumber != null) {
        params.SerialNumber = input.SerialNumber;
    }
    if (input.TokenCode != null) {
        params.TokenCode = input.TokenCode;
    }
    if (input.SourceIdentity != null) {
        params.SourceIdentity = input.SourceIdentity;
    }
    // Serialize PolicyArns
    if (input.PolicyArns) {
        input.PolicyArns.forEach((policyArn, index) => {
            if (policyArn.arn != null) {
                params[`PolicyArns.member.${index + 1}.arn`] = policyArn.arn;
            }
        });
    }
    // Serialize Tags
    if (input.Tags) {
        input.Tags.forEach((tag, index) => {
            if (tag.Key != null) {
                params[`Tags.member.${index + 1}.Key`] = tag.Key;
            }
            if (tag.Value != null) {
                params[`Tags.member.${index + 1}.Value`] = tag.Value;
            }
        });
    }
    // Serialize TransitiveTagKeys
    if (input.TransitiveTagKeys) {
        input.TransitiveTagKeys.forEach((key, index) => {
            params[`TransitiveTagKeys.member.${index + 1}`] = key;
        });
    }
    // Serialize ProvidedContexts
    if (input.ProvidedContexts) {
        input.ProvidedContexts.forEach((context, index) => {
            if (context.ProviderArn != null) {
                params[`ProvidedContexts.member.${index + 1}.ProviderArn`] = context.ProviderArn;
            }
            if (context.ContextAssertion != null) {
                params[`ProvidedContexts.member.${index + 1}.ContextAssertion`] = context.ContextAssertion;
            }
        });
    }
    return params;
}
/**
 * Serialize AssumeRoleWithWebIdentity request parameters
 *
 * @param input - AssumeRoleWithWebIdentity input parameters
 * @returns Serialized form parameters
 */
export function serializeAssumeRoleWithWebIdentityRequest(input) {
    const params = {
        Action: 'AssumeRoleWithWebIdentity',
        Version: STS_API_VERSION,
    };
    if (input.RoleArn != null) {
        params.RoleArn = input.RoleArn;
    }
    if (input.RoleSessionName != null) {
        params.RoleSessionName = input.RoleSessionName;
    }
    if (input.WebIdentityToken != null) {
        params.WebIdentityToken = input.WebIdentityToken;
    }
    if (input.ProviderId != null) {
        params.ProviderId = input.ProviderId;
    }
    if (input.Policy != null) {
        params.Policy = input.Policy;
    }
    if (input.DurationSeconds != null) {
        params.DurationSeconds = String(input.DurationSeconds);
    }
    // Serialize PolicyArns
    if (input.PolicyArns) {
        input.PolicyArns.forEach((policyArn, index) => {
            if (policyArn.arn != null) {
                params[`PolicyArns.member.${index + 1}.arn`] = policyArn.arn;
            }
        });
    }
    return params;
}
/**
 * Parse XML error body
 *
 * @param body - Response body
 * @returns Parsed error
 */
export async function parseXmlErrorBody(body) {
    const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
    // Simple XML parsing for error responses
    const codeMatch = text.match(/<Code>([^<]+)<\/Code>/);
    const messageMatch = text.match(/<Message>([^<]+)<\/Message>/);
    return {
        Error: {
            Code: codeMatch?.[1],
            Message: messageMatch?.[1],
        },
    };
}
/**
 * Parse XML response body
 *
 * @param body - Response body
 * @returns Parsed XML as object
 */
export async function parseXmlBody(body) {
    const text = typeof body === 'string' ? body : new TextDecoder().decode(body);
    // Simple XML parsing for STS responses
    const result = {};
    // Parse AssumeRoleResult or AssumeRoleWithWebIdentityResult
    const assumeRoleMatch = text.match(/<AssumeRoleResult>([\s\S]*?)<\/AssumeRoleResult>/);
    const webIdentityMatch = text.match(/<AssumeRoleWithWebIdentityResult>([\s\S]*?)<\/AssumeRoleWithWebIdentityResult>/);
    const resultContent = assumeRoleMatch?.[1] || webIdentityMatch?.[1] || text;
    // Parse Credentials
    const credentialsMatch = resultContent.match(/<Credentials>([\s\S]*?)<\/Credentials>/);
    if (credentialsMatch && credentialsMatch[1]) {
        result.Credentials = parseCredentialsXml(credentialsMatch[1]);
    }
    // Parse AssumedRoleUser
    const assumedRoleUserMatch = resultContent.match(/<AssumedRoleUser>([\s\S]*?)<\/AssumedRoleUser>/);
    if (assumedRoleUserMatch && assumedRoleUserMatch[1]) {
        result.AssumedRoleUser = parseAssumedRoleUserXml(assumedRoleUserMatch[1]);
    }
    // Parse other fields
    const packedPolicySizeMatch = resultContent.match(/<PackedPolicySize>([^<]+)<\/PackedPolicySize>/);
    if (packedPolicySizeMatch && packedPolicySizeMatch[1]) {
        result.PackedPolicySize = parseInt(packedPolicySizeMatch[1], 10);
    }
    const sourceIdentityMatch = resultContent.match(/<SourceIdentity>([^<]+)<\/SourceIdentity>/);
    if (sourceIdentityMatch) {
        result.SourceIdentity = sourceIdentityMatch[1];
    }
    const subjectMatch = resultContent.match(/<SubjectFromWebIdentityToken>([^<]+)<\/SubjectFromWebIdentityToken>/);
    if (subjectMatch) {
        result.SubjectFromWebIdentityToken = subjectMatch[1];
    }
    const audienceMatch = resultContent.match(/<Audience>([^<]+)<\/Audience>/);
    if (audienceMatch) {
        result.Audience = audienceMatch[1];
    }
    const providerMatch = resultContent.match(/<Provider>([^<]+)<\/Provider>/);
    if (providerMatch) {
        result.Provider = providerMatch[1];
    }
    return {
        AssumeRoleResult: result,
        AssumeRoleWithWebIdentityResult: result,
    };
}
/**
 * Parse Credentials XML element
 */
function parseCredentialsXml(xml) {
    const credentials = {};
    const accessKeyMatch = xml.match(/<AccessKeyId>([^<]+)<\/AccessKeyId>/);
    if (accessKeyMatch) {
        credentials.AccessKeyId = accessKeyMatch[1];
    }
    const secretKeyMatch = xml.match(/<SecretAccessKey>([^<]+)<\/SecretAccessKey>/);
    if (secretKeyMatch) {
        credentials.SecretAccessKey = secretKeyMatch[1];
    }
    const sessionTokenMatch = xml.match(/<SessionToken>([^<]+)<\/SessionToken>/);
    if (sessionTokenMatch) {
        credentials.SessionToken = sessionTokenMatch[1];
    }
    const expirationMatch = xml.match(/<Expiration>([^<]+)<\/Expiration>/);
    if (expirationMatch) {
        credentials.Expiration = expirationMatch[1];
    }
    return credentials;
}
/**
 * Parse AssumedRoleUser XML element
 */
function parseAssumedRoleUserXml(xml) {
    const user = {};
    const assumedRoleIdMatch = xml.match(/<AssumedRoleId>([^<]+)<\/AssumedRoleId>/);
    if (assumedRoleIdMatch) {
        user.AssumedRoleId = assumedRoleIdMatch[1];
    }
    const arnMatch = xml.match(/<Arn>([^<]+)<\/Arn>/);
    if (arnMatch) {
        user.Arn = arnMatch[1];
    }
    return user;
}
/**
 * Load query error code from response
 *
 * @param response - HTTP response
 * @param body - Parsed error body
 * @returns Error code
 */
export function loadQueryErrorCode(response, body) {
    if (body.Error?.Code !== undefined) {
        return body.Error.Code;
    }
    if (response.statusCode === 404) {
        return 'NotFound';
    }
    return undefined;
}
/**
 * Determine timestamp format for a schema
 *
 * @param trait - Schema trait
 * @returns Timestamp format string
 */
export function determineTimestampFormat(trait) {
    return trait?.timestampFormat || 'date-time';
}
//# sourceMappingURL=protocols.js.map