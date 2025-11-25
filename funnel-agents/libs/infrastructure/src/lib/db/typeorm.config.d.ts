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
export declare function createTypeOrmConfig(options: TypeOrmConfigOptions): DataSourceOptions;
export declare function createTypeOrmConfigFromEnv(): DataSourceOptions;
