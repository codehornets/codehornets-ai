import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export interface DatabaseConnectionOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    url?: string;
    entities?: any[];
    synchronize?: boolean;
    logging?: boolean;
    nodeEnv?: string;
}
export interface PoolConfig {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
/**
 * Creates TypeORM configuration with proper connection pooling and query timeouts
 */
export declare function createDatabaseConfig(options: DatabaseConnectionOptions, customPoolConfig?: PoolConfig): TypeOrmModuleOptions;
/**
 * Parses DATABASE_URL into connection components
 */
export declare function parseDatabaseUrl(url: string): {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
};
