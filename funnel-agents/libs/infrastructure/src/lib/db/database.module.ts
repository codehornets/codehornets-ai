import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseModuleOptions {
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: any[];
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const typeOrmOptions: TypeOrmModuleOptions = {
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.database,
      synchronize: options.synchronize ?? false,
      logging: options.logging ?? false,
      entities: options.entities ?? [],
      autoLoadEntities: true,
    };

    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forRoot(typeOrmOptions)],
      exports: [TypeOrmModule],
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
          useFactory: async (...args: any[]) => {
            const options = await optionsFactory.useFactory(...args);
            return {
              type: options.type,
              host: options.host,
              port: options.port,
              username: options.username,
              password: options.password,
              database: options.database,
              synchronize: options.synchronize ?? false,
              logging: options.logging ?? false,
              entities: options.entities ?? [],
              autoLoadEntities: true,
            };
          },
          inject: optionsFactory.inject,
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
