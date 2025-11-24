import { DataSourceOptions } from 'typeorm';

export interface TypeOrmConfigOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  synchronize?: boolean;
  logging?: boolean;
}

export function createTypeOrmConfig(options: TypeOrmConfigOptions): DataSourceOptions {
  return {
    type: 'postgres',
    host: options.host,
    port: options.port,
    username: options.username,
    password: options.password,
    database: options.database,
    ssl: options.ssl ? { rejectUnauthorized: false } : false,
    synchronize: options.synchronize ?? false,
    logging: options.logging ?? false,
    entities: [],
    migrations: [],
    subscribers: [],
  };
}

export function createTypeOrmConfigFromEnv(): DataSourceOptions {
  return createTypeOrmConfig({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    username: process.env['DB_USERNAME'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? 'postgres',
    database: process.env['DB_DATABASE'] ?? 'funnelagents',
    ssl: process.env['DB_SSL'] === 'true',
    synchronize: process.env['DB_SYNCHRONIZE'] === 'true',
    logging: process.env['DB_LOGGING'] === 'true',
  });
}
