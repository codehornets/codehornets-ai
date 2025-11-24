/**
 * Attributes Module
 *
 * Provides attribute sanitization and semantic attribute constants for telemetry.
 * Based on OpenTelemetry semantic conventions for consistent, interoperable telemetry.
 */
// =============================================================================
// Attribute Validation and Sanitization
// =============================================================================
/**
 * Maximum attribute key length.
 */
const MAX_ATTRIBUTE_KEY_LENGTH = 256;
/**
 * Maximum attribute value length for strings.
 */
const MAX_ATTRIBUTE_VALUE_LENGTH = 4096;
/**
 * Maximum number of attributes per span/metric.
 */
const MAX_ATTRIBUTES = 128;
/**
 * Checks if a value is a valid attribute key.
 *
 * @param key - The key to validate
 * @returns True if the key is valid
 */
export function isAttributeKey(key) {
    return typeof key === 'string' && key.length > 0 && key.length <= MAX_ATTRIBUTE_KEY_LENGTH;
}
/**
 * Checks if a value is a valid primitive attribute value.
 *
 * @param value - The value to check
 * @returns True if the value is a valid primitive
 */
function isPrimitiveValue(value) {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean';
}
/**
 * Checks if an array contains only valid homogeneous primitive values.
 *
 * @param array - The array to validate
 * @returns True if the array is valid
 */
function isValidArray(array) {
    if (array.length === 0)
        return true;
    let expectedType;
    for (const item of array) {
        if (item == null)
            continue; // null/undefined allowed in arrays
        if (!isPrimitiveValue(item))
            return false;
        if (!expectedType) {
            expectedType = typeof item;
        }
        else if (typeof item !== expectedType) {
            return false; // heterogeneous array
        }
    }
    return true;
}
/**
 * Checks if a value is a valid attribute value.
 *
 * Valid values are:
 * - string, number, boolean (primitives)
 * - Array of homogeneous primitives (string[], number[], boolean[])
 * - null/undefined (will be filtered out)
 *
 * @param value - The value to validate
 * @returns True if the value is valid
 */
export function isAttributeValue(value) {
    if (value == null)
        return true;
    if (Array.isArray(value)) {
        return isValidArray(value);
    }
    return isPrimitiveValue(value);
}
/**
 * Validates a single attribute key-value pair.
 *
 * @param key - The attribute key
 * @param value - The attribute value
 * @returns Validation result with sanitized value if valid
 */
export function validateAttribute(key, value) {
    // Validate key
    if (!isAttributeKey(key)) {
        return {
            valid: false,
            error: `Invalid attribute key: "${key}" (must be non-empty string <= ${MAX_ATTRIBUTE_KEY_LENGTH} chars)`,
        };
    }
    // null/undefined values are valid but filtered
    if (value == null) {
        return { valid: true, value: undefined };
    }
    // Validate and sanitize value
    if (typeof value === 'string') {
        // Truncate long strings
        const sanitized = value.length > MAX_ATTRIBUTE_VALUE_LENGTH
            ? value.slice(0, MAX_ATTRIBUTE_VALUE_LENGTH)
            : value;
        return { valid: true, value: sanitized };
    }
    if (typeof value === 'number') {
        // Check for valid number (not NaN or Infinity)
        if (!Number.isFinite(value)) {
            return {
                valid: false,
                error: `Invalid number value for key "${key}": ${value}`,
            };
        }
        return { valid: true, value };
    }
    if (typeof value === 'boolean') {
        return { valid: true, value };
    }
    if (Array.isArray(value)) {
        if (!isValidArray(value)) {
            return {
                valid: false,
                error: `Invalid array value for key "${key}": must be homogeneous primitives`,
            };
        }
        // Sanitize string arrays
        const sanitized = value.map((item) => {
            if (typeof item === 'string' && item.length > MAX_ATTRIBUTE_VALUE_LENGTH) {
                return item.slice(0, MAX_ATTRIBUTE_VALUE_LENGTH);
            }
            return item;
        });
        return { valid: true, value: sanitized };
    }
    return {
        valid: false,
        error: `Invalid attribute value type for key "${key}": ${typeof value}`,
    };
}
/**
 * Sanitizes an attributes object, filtering invalid entries and logging warnings.
 *
 * @param attributes - The attributes to sanitize
 * @param logger - Optional logger for warnings (defaults to console.warn)
 * @returns Sanitized attributes object
 */
export function sanitizeAttributes(attributes, logger) {
    const result = {};
    const warn = logger ?? console.warn.bind(console);
    if (typeof attributes !== 'object' || attributes == null) {
        return result;
    }
    const entries = Object.entries(attributes);
    let count = 0;
    for (const [key, value] of entries) {
        if (count >= MAX_ATTRIBUTES) {
            warn(`Attribute limit (${MAX_ATTRIBUTES}) reached, dropping remaining attributes`);
            break;
        }
        const validation = validateAttribute(key, value);
        if (!validation.valid) {
            warn(validation.error);
            continue;
        }
        // Skip null/undefined values
        if (validation.value === undefined) {
            continue;
        }
        // Clone arrays to prevent mutation
        if (Array.isArray(validation.value)) {
            result[key] = [...validation.value];
        }
        else {
            result[key] = validation.value;
        }
        count++;
    }
    return result;
}
// =============================================================================
// Semantic Attribute Constants
// =============================================================================
/**
 * HTTP semantic attributes.
 */
export const HttpAttributes = {
    /** HTTP request method (GET, POST, etc.) */
    METHOD: 'http.method',
    /** Full HTTP request URL */
    URL: 'http.url',
    /** Target of the request (path and query) */
    TARGET: 'http.target',
    /** Host header value */
    HOST: 'http.host',
    /** URL scheme (http, https) */
    SCHEME: 'http.scheme',
    /** HTTP response status code */
    STATUS_CODE: 'http.status_code',
    /** HTTP protocol version (1.0, 1.1, 2.0) */
    FLAVOR: 'http.flavor',
    /** User-Agent header value */
    USER_AGENT: 'http.user_agent',
    /** Request content length in bytes */
    REQUEST_CONTENT_LENGTH: 'http.request_content_length',
    /** Response content length in bytes */
    RESPONSE_CONTENT_LENGTH: 'http.response_content_length',
    /** HTTP route pattern */
    ROUTE: 'http.route',
    /** Server name */
    SERVER_NAME: 'http.server_name',
    /** Client IP address */
    CLIENT_IP: 'http.client_ip',
};
/**
 * Database semantic attributes.
 */
export const DbAttributes = {
    /** Database system (mysql, postgresql, mongodb, etc.) */
    SYSTEM: 'db.system',
    /** Connection string (sanitized) */
    CONNECTION_STRING: 'db.connection_string',
    /** Database user */
    USER: 'db.user',
    /** Database name */
    NAME: 'db.name',
    /** Database statement (query) */
    STATEMENT: 'db.statement',
    /** Database operation (SELECT, INSERT, etc.) */
    OPERATION: 'db.operation',
    /** SQL table name */
    SQL_TABLE: 'db.sql.table',
    /** MongoDB collection name */
    MONGODB_COLLECTION: 'db.mongodb.collection',
    /** Redis database index */
    REDIS_DATABASE_INDEX: 'db.redis.database_index',
};
/**
 * RPC semantic attributes.
 */
export const RpcAttributes = {
    /** RPC system (grpc, jsonrpc, etc.) */
    SYSTEM: 'rpc.system',
    /** RPC service name */
    SERVICE: 'rpc.service',
    /** RPC method name */
    METHOD: 'rpc.method',
    /** gRPC status code */
    GRPC_STATUS_CODE: 'rpc.grpc.status_code',
    /** JSON-RPC version */
    JSONRPC_VERSION: 'rpc.jsonrpc.version',
    /** JSON-RPC request ID */
    JSONRPC_REQUEST_ID: 'rpc.jsonrpc.request_id',
    /** JSON-RPC error code */
    JSONRPC_ERROR_CODE: 'rpc.jsonrpc.error_code',
    /** JSON-RPC error message */
    JSONRPC_ERROR_MESSAGE: 'rpc.jsonrpc.error_message',
};
/**
 * Network semantic attributes.
 */
export const NetAttributes = {
    /** Transport protocol (tcp, udp) */
    TRANSPORT: 'net.transport',
    /** Peer IP address */
    PEER_IP: 'net.peer.ip',
    /** Peer port */
    PEER_PORT: 'net.peer.port',
    /** Peer hostname */
    PEER_NAME: 'net.peer.name',
    /** Host IP address */
    HOST_IP: 'net.host.ip',
    /** Host port */
    HOST_PORT: 'net.host.port',
    /** Host name */
    HOST_NAME: 'net.host.name',
};
/**
 * Exception semantic attributes.
 */
export const ExceptionAttributes = {
    /** Exception type (class name) */
    TYPE: 'exception.type',
    /** Exception message */
    MESSAGE: 'exception.message',
    /** Exception stack trace */
    STACKTRACE: 'exception.stacktrace',
    /** Whether exception was escaped (unhandled) */
    ESCAPED: 'exception.escaped',
};
/**
 * Code semantic attributes.
 */
export const CodeAttributes = {
    /** Function name */
    FUNCTION: 'code.function',
    /** Namespace (module/class) */
    NAMESPACE: 'code.namespace',
    /** File path */
    FILEPATH: 'code.filepath',
    /** Line number */
    LINENO: 'code.lineno',
};
/**
 * Thread semantic attributes.
 */
export const ThreadAttributes = {
    /** Thread ID */
    ID: 'thread.id',
    /** Thread name */
    NAME: 'thread.name',
};
/**
 * Messaging semantic attributes.
 */
export const MessagingAttributes = {
    /** Messaging system (kafka, rabbitmq, etc.) */
    SYSTEM: 'messaging.system',
    /** Destination name (queue/topic) */
    DESTINATION: 'messaging.destination',
    /** Destination kind (queue, topic) */
    DESTINATION_KIND: 'messaging.destination_kind',
    /** Message ID */
    MESSAGE_ID: 'messaging.message_id',
    /** Conversation ID */
    CONVERSATION_ID: 'messaging.conversation_id',
    /** Message payload size in bytes */
    MESSAGE_PAYLOAD_SIZE: 'messaging.message_payload_size_bytes',
    /** Operation type (send, receive, process) */
    OPERATION: 'messaging.operation',
};
/**
 * FaaS (Function as a Service) semantic attributes.
 */
export const FaasAttributes = {
    /** Function trigger type */
    TRIGGER: 'faas.trigger',
    /** Function execution ID */
    EXECUTION: 'faas.execution',
    /** Whether this is a cold start */
    COLDSTART: 'faas.coldstart',
    /** Invoked function name */
    INVOKED_NAME: 'faas.invoked_name',
    /** Invoked function provider */
    INVOKED_PROVIDER: 'faas.invoked_provider',
    /** Invoked function region */
    INVOKED_REGION: 'faas.invoked_region',
};
/**
 * AWS-specific semantic attributes.
 */
export const AwsAttributes = {
    /** Lambda invoked ARN */
    LAMBDA_INVOKED_ARN: 'aws.lambda.invoked_arn',
    /** DynamoDB table names */
    DYNAMODB_TABLE_NAMES: 'aws.dynamodb.table_names',
    /** DynamoDB consumed capacity */
    DYNAMODB_CONSUMED_CAPACITY: 'aws.dynamodb.consumed_capacity',
};
/**
 * Peer service semantic attribute.
 */
export const PeerAttributes = {
    /** Name of the remote service */
    SERVICE: 'peer.service',
};
/**
 * End user semantic attributes.
 */
export const EnduserAttributes = {
    /** End user ID */
    ID: 'enduser.id',
    /** End user role */
    ROLE: 'enduser.role',
    /** End user scope */
    SCOPE: 'enduser.scope',
};
/**
 * Aggregated semantic attributes for convenience.
 */
export const SemanticAttributes = {
    ...HttpAttributes,
    ...DbAttributes,
    ...RpcAttributes,
    ...NetAttributes,
    ...ExceptionAttributes,
    ...CodeAttributes,
    ...ThreadAttributes,
    ...MessagingAttributes,
    ...FaasAttributes,
    ...AwsAttributes,
    ...PeerAttributes,
    ...EnduserAttributes,
};
// =============================================================================
// Database System Values
// =============================================================================
/**
 * Database system type values for DbAttributes.SYSTEM.
 */
export const DbSystemValues = {
    OTHER_SQL: 'other_sql',
    MSSQL: 'mssql',
    MYSQL: 'mysql',
    ORACLE: 'oracle',
    DB2: 'db2',
    POSTGRESQL: 'postgresql',
    REDSHIFT: 'redshift',
    HIVE: 'hive',
    CLOUDSCAPE: 'cloudscape',
    HSQLDB: 'hsqldb',
    PROGRESS: 'progress',
    MAXDB: 'maxdb',
    HANADB: 'hanadb',
    INGRES: 'ingres',
    FIRSTSQL: 'firstsql',
    EDB: 'edb',
    CACHE: 'cache',
    ADABAS: 'adabas',
    FIREBIRD: 'firebird',
    DERBY: 'derby',
    FILEMAKER: 'filemaker',
    INFORMIX: 'informix',
    INSTANTDB: 'instantdb',
    INTERBASE: 'interbase',
    MARIADB: 'mariadb',
    NETEZZA: 'netezza',
    PERVASIVE: 'pervasive',
    POINTBASE: 'pointbase',
    SQLITE: 'sqlite',
    SYBASE: 'sybase',
    TERADATA: 'teradata',
    VERTICA: 'vertica',
    H2: 'h2',
    COLDFUSION: 'coldfusion',
    CASSANDRA: 'cassandra',
    HBASE: 'hbase',
    MONGODB: 'mongodb',
    REDIS: 'redis',
    COUCHBASE: 'couchbase',
    COUCHDB: 'couchdb',
    COSMOSDB: 'cosmosdb',
    DYNAMODB: 'dynamodb',
    NEO4J: 'neo4j',
    GEODE: 'geode',
    ELASTICSEARCH: 'elasticsearch',
    MEMCACHED: 'memcached',
    COCKROACHDB: 'cockroachdb',
};
// =============================================================================
// Network Transport Values
// =============================================================================
/**
 * Network transport values for NetAttributes.TRANSPORT.
 */
export const NetTransportValues = {
    IP_TCP: 'ip_tcp',
    IP_UDP: 'ip_udp',
    IP: 'ip',
    UNIX: 'unix',
    PIPE: 'pipe',
    INPROC: 'inproc',
    OTHER: 'other',
};
// =============================================================================
// HTTP Flavor Values
// =============================================================================
/**
 * HTTP protocol version values for HttpAttributes.FLAVOR.
 */
export const HttpFlavorValues = {
    HTTP_1_0: '1.0',
    HTTP_1_1: '1.1',
    HTTP_2_0: '2.0',
    SPDY: 'SPDY',
    QUIC: 'QUIC',
};
// =============================================================================
// gRPC Status Code Values
// =============================================================================
/**
 * gRPC status code values for RpcAttributes.GRPC_STATUS_CODE.
 */
export const RpcGrpcStatusCodeValues = {
    OK: 0,
    CANCELLED: 1,
    UNKNOWN: 2,
    INVALID_ARGUMENT: 3,
    DEADLINE_EXCEEDED: 4,
    NOT_FOUND: 5,
    ALREADY_EXISTS: 6,
    PERMISSION_DENIED: 7,
    RESOURCE_EXHAUSTED: 8,
    FAILED_PRECONDITION: 9,
    ABORTED: 10,
    OUT_OF_RANGE: 11,
    UNIMPLEMENTED: 12,
    INTERNAL: 13,
    UNAVAILABLE: 14,
    DATA_LOSS: 15,
    UNAUTHENTICATED: 16,
};
//# sourceMappingURL=attributes.js.map