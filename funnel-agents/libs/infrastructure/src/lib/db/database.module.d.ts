import { DynamicModule } from '@nestjs/common';
import { PoolConfig } from './database-config.helper';
export interface DatabaseModuleOptions {
    type: 'postgres' | 'mysql' | 'sqlite';
    url?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    synchronize?: boolean;
    logging?: boolean;
    entities?: any[];
    nodeEnv?: string;
    poolConfig?: PoolConfig;
    enableHealthMonitoring?: boolean;
}
export declare class DatabaseModule {
    static forRoot(options: DatabaseModuleOptions): DynamicModule;
    static forRootAsync(optionsFactory: {
        imports?: any[];
        useFactory: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
        inject?: any[];
    }): DynamicModule;
}
