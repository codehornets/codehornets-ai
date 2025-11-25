import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { createDatabaseConfig, PoolConfig } from './database-config.helper';
import { DatabaseHealthService } from './database-health.service';

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

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const typeOrmOptions = createDatabaseConfig(
      {
        type: options.type,
        url: options.url,
        host: options.host,
        port: options.port,
        username: options.username,
        password: options.password,
        database: options.database,
        synchronize: options.synchronize,
        logging: options.logging,
        entities: options.entities,
        nodeEnv: options.nodeEnv,
      },
      options.poolConfig
    );

    const providers = options.enableHealthMonitoring !== false
      ? [DatabaseHealthService]
      : [];

    const imports = options.enableHealthMonitoring !== false
      ? [TypeOrmModule.forRoot(typeOrmOptions), ScheduleModule.forRoot()]
      : [TypeOrmModule.forRoot(typeOrmOptions)];

    return {
      module: DatabaseModule,
      imports,
      providers,
      exports: [TypeOrmModule, ...providers],
    };
  }

  static forRootAsync(optionsFactory: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: optionsFactory.imports,
          useFactory: async (...args: any[]): Promise<TypeOrmModuleOptions> => {
            const options = await optionsFactory.useFactory(...args);

            return createDatabaseConfig(
              {
                type: options.type,
                url: options.url,
                host: options.host,
                port: options.port,
                username: options.username,
                password: options.password,
                database: options.database,
                synchronize: options.synchronize,
                logging: options.logging,
                entities: options.entities,
                nodeEnv: options.nodeEnv,
              },
              options.poolConfig
            );
          },
          inject: optionsFactory.inject,
        }),
        ScheduleModule.forRoot(),
      ],
      providers: [DatabaseHealthService],
      exports: [TypeOrmModule, DatabaseHealthService],
    };
  }
}
