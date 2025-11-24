/**
 * Attributes Module
 *
 * Provides attribute sanitization and semantic attribute constants for telemetry.
 * Based on OpenTelemetry semantic conventions for consistent, interoperable telemetry.
 */
import type { Attributes, AttributeValue } from '@opentelemetry/api';
import type { AttributeValidationResult, AttributeValueType } from './types.js';
/**
 * Checks if a value is a valid attribute key.
 *
 * @param key - The key to validate
 * @returns True if the key is valid
 */
export declare function isAttributeKey(key: unknown): key is string;
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
export declare function isAttributeValue(value: unknown): value is AttributeValue;
/**
 * Validates a single attribute key-value pair.
 *
 * @param key - The attribute key
 * @param value - The attribute value
 * @returns Validation result with sanitized value if valid
 */
export declare function validateAttribute(key: string, value: AttributeValueType): AttributeValidationResult;
/**
 * Sanitizes an attributes object, filtering invalid entries and logging warnings.
 *
 * @param attributes - The attributes to sanitize
 * @param logger - Optional logger for warnings (defaults to console.warn)
 * @returns Sanitized attributes object
 */
export declare function sanitizeAttributes(attributes: unknown, logger?: (message: string) => void): Attributes;
/**
 * HTTP semantic attributes.
 */
export declare const HttpAttributes: {
    /** HTTP request method (GET, POST, etc.) */
    readonly METHOD: "http.method";
    /** Full HTTP request URL */
    readonly URL: "http.url";
    /** Target of the request (path and query) */
    readonly TARGET: "http.target";
    /** Host header value */
    readonly HOST: "http.host";
    /** URL scheme (http, https) */
    readonly SCHEME: "http.scheme";
    /** HTTP response status code */
    readonly STATUS_CODE: "http.status_code";
    /** HTTP protocol version (1.0, 1.1, 2.0) */
    readonly FLAVOR: "http.flavor";
    /** User-Agent header value */
    readonly USER_AGENT: "http.user_agent";
    /** Request content length in bytes */
    readonly REQUEST_CONTENT_LENGTH: "http.request_content_length";
    /** Response content length in bytes */
    readonly RESPONSE_CONTENT_LENGTH: "http.response_content_length";
    /** HTTP route pattern */
    readonly ROUTE: "http.route";
    /** Server name */
    readonly SERVER_NAME: "http.server_name";
    /** Client IP address */
    readonly CLIENT_IP: "http.client_ip";
};
/**
 * Database semantic attributes.
 */
export declare const DbAttributes: {
    /** Database system (mysql, postgresql, mongodb, etc.) */
    readonly SYSTEM: "db.system";
    /** Connection string (sanitized) */
    readonly CONNECTION_STRING: "db.connection_string";
    /** Database user */
    readonly USER: "db.user";
    /** Database name */
    readonly NAME: "db.name";
    /** Database statement (query) */
    readonly STATEMENT: "db.statement";
    /** Database operation (SELECT, INSERT, etc.) */
    readonly OPERATION: "db.operation";
    /** SQL table name */
    readonly SQL_TABLE: "db.sql.table";
    /** MongoDB collection name */
    readonly MONGODB_COLLECTION: "db.mongodb.collection";
    /** Redis database index */
    readonly REDIS_DATABASE_INDEX: "db.redis.database_index";
};
/**
 * RPC semantic attributes.
 */
export declare const RpcAttributes: {
    /** RPC system (grpc, jsonrpc, etc.) */
    readonly SYSTEM: "rpc.system";
    /** RPC service name */
    readonly SERVICE: "rpc.service";
    /** RPC method name */
    readonly METHOD: "rpc.method";
    /** gRPC status code */
    readonly GRPC_STATUS_CODE: "rpc.grpc.status_code";
    /** JSON-RPC version */
    readonly JSONRPC_VERSION: "rpc.jsonrpc.version";
    /** JSON-RPC request ID */
    readonly JSONRPC_REQUEST_ID: "rpc.jsonrpc.request_id";
    /** JSON-RPC error code */
    readonly JSONRPC_ERROR_CODE: "rpc.jsonrpc.error_code";
    /** JSON-RPC error message */
    readonly JSONRPC_ERROR_MESSAGE: "rpc.jsonrpc.error_message";
};
/**
 * Network semantic attributes.
 */
export declare const NetAttributes: {
    /** Transport protocol (tcp, udp) */
    readonly TRANSPORT: "net.transport";
    /** Peer IP address */
    readonly PEER_IP: "net.peer.ip";
    /** Peer port */
    readonly PEER_PORT: "net.peer.port";
    /** Peer hostname */
    readonly PEER_NAME: "net.peer.name";
    /** Host IP address */
    readonly HOST_IP: "net.host.ip";
    /** Host port */
    readonly HOST_PORT: "net.host.port";
    /** Host name */
    readonly HOST_NAME: "net.host.name";
};
/**
 * Exception semantic attributes.
 */
export declare const ExceptionAttributes: {
    /** Exception type (class name) */
    readonly TYPE: "exception.type";
    /** Exception message */
    readonly MESSAGE: "exception.message";
    /** Exception stack trace */
    readonly STACKTRACE: "exception.stacktrace";
    /** Whether exception was escaped (unhandled) */
    readonly ESCAPED: "exception.escaped";
};
/**
 * Code semantic attributes.
 */
export declare const CodeAttributes: {
    /** Function name */
    readonly FUNCTION: "code.function";
    /** Namespace (module/class) */
    readonly NAMESPACE: "code.namespace";
    /** File path */
    readonly FILEPATH: "code.filepath";
    /** Line number */
    readonly LINENO: "code.lineno";
};
/**
 * Thread semantic attributes.
 */
export declare const ThreadAttributes: {
    /** Thread ID */
    readonly ID: "thread.id";
    /** Thread name */
    readonly NAME: "thread.name";
};
/**
 * Messaging semantic attributes.
 */
export declare const MessagingAttributes: {
    /** Messaging system (kafka, rabbitmq, etc.) */
    readonly SYSTEM: "messaging.system";
    /** Destination name (queue/topic) */
    readonly DESTINATION: "messaging.destination";
    /** Destination kind (queue, topic) */
    readonly DESTINATION_KIND: "messaging.destination_kind";
    /** Message ID */
    readonly MESSAGE_ID: "messaging.message_id";
    /** Conversation ID */
    readonly CONVERSATION_ID: "messaging.conversation_id";
    /** Message payload size in bytes */
    readonly MESSAGE_PAYLOAD_SIZE: "messaging.message_payload_size_bytes";
    /** Operation type (send, receive, process) */
    readonly OPERATION: "messaging.operation";
};
/**
 * FaaS (Function as a Service) semantic attributes.
 */
export declare const FaasAttributes: {
    /** Function trigger type */
    readonly TRIGGER: "faas.trigger";
    /** Function execution ID */
    readonly EXECUTION: "faas.execution";
    /** Whether this is a cold start */
    readonly COLDSTART: "faas.coldstart";
    /** Invoked function name */
    readonly INVOKED_NAME: "faas.invoked_name";
    /** Invoked function provider */
    readonly INVOKED_PROVIDER: "faas.invoked_provider";
    /** Invoked function region */
    readonly INVOKED_REGION: "faas.invoked_region";
};
/**
 * AWS-specific semantic attributes.
 */
export declare const AwsAttributes: {
    /** Lambda invoked ARN */
    readonly LAMBDA_INVOKED_ARN: "aws.lambda.invoked_arn";
    /** DynamoDB table names */
    readonly DYNAMODB_TABLE_NAMES: "aws.dynamodb.table_names";
    /** DynamoDB consumed capacity */
    readonly DYNAMODB_CONSUMED_CAPACITY: "aws.dynamodb.consumed_capacity";
};
/**
 * Peer service semantic attribute.
 */
export declare const PeerAttributes: {
    /** Name of the remote service */
    readonly SERVICE: "peer.service";
};
/**
 * End user semantic attributes.
 */
export declare const EnduserAttributes: {
    /** End user ID */
    readonly ID: "enduser.id";
    /** End user role */
    readonly ROLE: "enduser.role";
    /** End user scope */
    readonly SCOPE: "enduser.scope";
};
/**
 * Aggregated semantic attributes for convenience.
 */
export declare const SemanticAttributes: {
    /** End user ID */
    readonly ID: "enduser.id";
    /** End user role */
    readonly ROLE: "enduser.role";
    /** End user scope */
    readonly SCOPE: "enduser.scope";
    /** Name of the remote service */
    readonly SERVICE: "peer.service";
    /** Lambda invoked ARN */
    readonly LAMBDA_INVOKED_ARN: "aws.lambda.invoked_arn";
    /** DynamoDB table names */
    readonly DYNAMODB_TABLE_NAMES: "aws.dynamodb.table_names";
    /** DynamoDB consumed capacity */
    readonly DYNAMODB_CONSUMED_CAPACITY: "aws.dynamodb.consumed_capacity";
    /** Function trigger type */
    readonly TRIGGER: "faas.trigger";
    /** Function execution ID */
    readonly EXECUTION: "faas.execution";
    /** Whether this is a cold start */
    readonly COLDSTART: "faas.coldstart";
    /** Invoked function name */
    readonly INVOKED_NAME: "faas.invoked_name";
    /** Invoked function provider */
    readonly INVOKED_PROVIDER: "faas.invoked_provider";
    /** Invoked function region */
    readonly INVOKED_REGION: "faas.invoked_region";
    /** Messaging system (kafka, rabbitmq, etc.) */
    readonly SYSTEM: "messaging.system";
    /** Destination name (queue/topic) */
    readonly DESTINATION: "messaging.destination";
    /** Destination kind (queue, topic) */
    readonly DESTINATION_KIND: "messaging.destination_kind";
    /** Message ID */
    readonly MESSAGE_ID: "messaging.message_id";
    /** Conversation ID */
    readonly CONVERSATION_ID: "messaging.conversation_id";
    /** Message payload size in bytes */
    readonly MESSAGE_PAYLOAD_SIZE: "messaging.message_payload_size_bytes";
    /** Operation type (send, receive, process) */
    readonly OPERATION: "messaging.operation";
    /** Thread name */
    readonly NAME: "thread.name";
    /** Function name */
    readonly FUNCTION: "code.function";
    /** Namespace (module/class) */
    readonly NAMESPACE: "code.namespace";
    /** File path */
    readonly FILEPATH: "code.filepath";
    /** Line number */
    readonly LINENO: "code.lineno";
    /** Exception type (class name) */
    readonly TYPE: "exception.type";
    /** Exception message */
    readonly MESSAGE: "exception.message";
    /** Exception stack trace */
    readonly STACKTRACE: "exception.stacktrace";
    /** Whether exception was escaped (unhandled) */
    readonly ESCAPED: "exception.escaped";
    /** Transport protocol (tcp, udp) */
    readonly TRANSPORT: "net.transport";
    /** Peer IP address */
    readonly PEER_IP: "net.peer.ip";
    /** Peer port */
    readonly PEER_PORT: "net.peer.port";
    /** Peer hostname */
    readonly PEER_NAME: "net.peer.name";
    /** Host IP address */
    readonly HOST_IP: "net.host.ip";
    /** Host port */
    readonly HOST_PORT: "net.host.port";
    /** Host name */
    readonly HOST_NAME: "net.host.name";
    /** RPC method name */
    readonly METHOD: "rpc.method";
    /** gRPC status code */
    readonly GRPC_STATUS_CODE: "rpc.grpc.status_code";
    /** JSON-RPC version */
    readonly JSONRPC_VERSION: "rpc.jsonrpc.version";
    /** JSON-RPC request ID */
    readonly JSONRPC_REQUEST_ID: "rpc.jsonrpc.request_id";
    /** JSON-RPC error code */
    readonly JSONRPC_ERROR_CODE: "rpc.jsonrpc.error_code";
    /** JSON-RPC error message */
    readonly JSONRPC_ERROR_MESSAGE: "rpc.jsonrpc.error_message";
    /** Connection string (sanitized) */
    readonly CONNECTION_STRING: "db.connection_string";
    /** Database user */
    readonly USER: "db.user";
    /** Database statement (query) */
    readonly STATEMENT: "db.statement";
    /** SQL table name */
    readonly SQL_TABLE: "db.sql.table";
    /** MongoDB collection name */
    readonly MONGODB_COLLECTION: "db.mongodb.collection";
    /** Redis database index */
    readonly REDIS_DATABASE_INDEX: "db.redis.database_index";
    /** Full HTTP request URL */
    readonly URL: "http.url";
    /** Target of the request (path and query) */
    readonly TARGET: "http.target";
    /** Host header value */
    readonly HOST: "http.host";
    /** URL scheme (http, https) */
    readonly SCHEME: "http.scheme";
    /** HTTP response status code */
    readonly STATUS_CODE: "http.status_code";
    /** HTTP protocol version (1.0, 1.1, 2.0) */
    readonly FLAVOR: "http.flavor";
    /** User-Agent header value */
    readonly USER_AGENT: "http.user_agent";
    /** Request content length in bytes */
    readonly REQUEST_CONTENT_LENGTH: "http.request_content_length";
    /** Response content length in bytes */
    readonly RESPONSE_CONTENT_LENGTH: "http.response_content_length";
    /** HTTP route pattern */
    readonly ROUTE: "http.route";
    /** Server name */
    readonly SERVER_NAME: "http.server_name";
    /** Client IP address */
    readonly CLIENT_IP: "http.client_ip";
};
/**
 * Database system type values for DbAttributes.SYSTEM.
 */
export declare const DbSystemValues: {
    readonly OTHER_SQL: "other_sql";
    readonly MSSQL: "mssql";
    readonly MYSQL: "mysql";
    readonly ORACLE: "oracle";
    readonly DB2: "db2";
    readonly POSTGRESQL: "postgresql";
    readonly REDSHIFT: "redshift";
    readonly HIVE: "hive";
    readonly CLOUDSCAPE: "cloudscape";
    readonly HSQLDB: "hsqldb";
    readonly PROGRESS: "progress";
    readonly MAXDB: "maxdb";
    readonly HANADB: "hanadb";
    readonly INGRES: "ingres";
    readonly FIRSTSQL: "firstsql";
    readonly EDB: "edb";
    readonly CACHE: "cache";
    readonly ADABAS: "adabas";
    readonly FIREBIRD: "firebird";
    readonly DERBY: "derby";
    readonly FILEMAKER: "filemaker";
    readonly INFORMIX: "informix";
    readonly INSTANTDB: "instantdb";
    readonly INTERBASE: "interbase";
    readonly MARIADB: "mariadb";
    readonly NETEZZA: "netezza";
    readonly PERVASIVE: "pervasive";
    readonly POINTBASE: "pointbase";
    readonly SQLITE: "sqlite";
    readonly SYBASE: "sybase";
    readonly TERADATA: "teradata";
    readonly VERTICA: "vertica";
    readonly H2: "h2";
    readonly COLDFUSION: "coldfusion";
    readonly CASSANDRA: "cassandra";
    readonly HBASE: "hbase";
    readonly MONGODB: "mongodb";
    readonly REDIS: "redis";
    readonly COUCHBASE: "couchbase";
    readonly COUCHDB: "couchdb";
    readonly COSMOSDB: "cosmosdb";
    readonly DYNAMODB: "dynamodb";
    readonly NEO4J: "neo4j";
    readonly GEODE: "geode";
    readonly ELASTICSEARCH: "elasticsearch";
    readonly MEMCACHED: "memcached";
    readonly COCKROACHDB: "cockroachdb";
};
/**
 * Network transport values for NetAttributes.TRANSPORT.
 */
export declare const NetTransportValues: {
    readonly IP_TCP: "ip_tcp";
    readonly IP_UDP: "ip_udp";
    readonly IP: "ip";
    readonly UNIX: "unix";
    readonly PIPE: "pipe";
    readonly INPROC: "inproc";
    readonly OTHER: "other";
};
/**
 * HTTP protocol version values for HttpAttributes.FLAVOR.
 */
export declare const HttpFlavorValues: {
    readonly HTTP_1_0: "1.0";
    readonly HTTP_1_1: "1.1";
    readonly HTTP_2_0: "2.0";
    readonly SPDY: "SPDY";
    readonly QUIC: "QUIC";
};
/**
 * gRPC status code values for RpcAttributes.GRPC_STATUS_CODE.
 */
export declare const RpcGrpcStatusCodeValues: {
    readonly OK: 0;
    readonly CANCELLED: 1;
    readonly UNKNOWN: 2;
    readonly INVALID_ARGUMENT: 3;
    readonly DEADLINE_EXCEEDED: 4;
    readonly NOT_FOUND: 5;
    readonly ALREADY_EXISTS: 6;
    readonly PERMISSION_DENIED: 7;
    readonly RESOURCE_EXHAUSTED: 8;
    readonly FAILED_PRECONDITION: 9;
    readonly ABORTED: 10;
    readonly OUT_OF_RANGE: 11;
    readonly UNIMPLEMENTED: 12;
    readonly INTERNAL: 13;
    readonly UNAVAILABLE: 14;
    readonly DATA_LOSS: 15;
    readonly UNAUTHENTICATED: 16;
};
//# sourceMappingURL=attributes.d.ts.map