import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

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
export function createDatabaseConfig(
  options: DatabaseConnectionOptions,
  customPoolConfig?: PoolConfig
): TypeOrmModuleOptions {
  const logger = new Logger('DatabaseConfig');

  // Default pool configuration
  const defaultPoolConfig: PoolConfig = {
    max: 20,              // Maximum pool size
    min: 5,               // Minimum pool size
    idleTimeoutMillis: 30000,     // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
  };

  const poolConfig = { ...defaultPoolConfig, ...customPoolConfig };

  const isProduction = options.nodeEnv === 'production';
  const isDevelopment = options.nodeEnv === 'development';

  // Base configuration
  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: options.entities ?? [],
    autoLoadEntities: true,
    synchronize: options.synchronize ?? false,
    logging: options.logging ?? isDevelopment,

    // Query timeout - log slow queries over 10 seconds
    maxQueryExecutionTime: 10000,

    // Connection pooling configuration
    extra: {
      max: poolConfig.max,
      min: poolConfig.min,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,

      // Enable keep-alive to detect broken connections
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,

      // Application name for connection tracking
      application_name: process.env.SERVICE_NAME || 'funnelagents',
    },

    // SSL configuration for production
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };

  // Configure connection details
  if (options.url) {
    logger.log(`Connecting to database via URL (pool: ${poolConfig.min}-${poolConfig.max})`);
    return {
      ...baseConfig,
      url: options.url,
    };
  }

  logger.log(
    `Connecting to database at ${options.host}:${options.port}/${options.database} ` +
    `(pool: ${poolConfig.min}-${poolConfig.max})`
  );

  return {
    ...baseConfig,
    host: options.host,
    port: options.port,
    username: options.username,
    password: options.password,
    database: options.database,
  };
}

/**
 * Parses DATABASE_URL into connection components
 */
export function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 5432,
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1),
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
  }
}
