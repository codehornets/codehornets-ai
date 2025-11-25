import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import { HealthModule } from './health/health.module';
import { CustomThrottlerGuard } from '@funnelagents/shared';
import { createThrottlerConfig, getRedisUrl } from '@funnelagents/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = getRedisUrl();
        const useRedis = !!redisUrl && configService.get('NODE_ENV') !== 'test';
        return createThrottlerConfig(useRedis, redisUrl);
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined in environment variables');
        }

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction, // Auto-create tables in development
          migrationsRun: isProduction, // Only run migrations in production
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          logging: nodeEnv === 'development',
          autoLoadEntities: true,

          // Query timeout - log slow queries over 10 seconds
          maxQueryExecutionTime: 10000,

          // Connection pooling configuration
          extra: {
            max: configService.get<number>('DB_POOL_MAX', 20),
            min: configService.get<number>('DB_POOL_MIN', 5),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            application_name: 'tasks-service',
          },

          // SSL configuration for production
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    TasksModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
