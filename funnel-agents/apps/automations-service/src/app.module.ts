import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WorkflowsModule } from './workflows/workflows.module';
import { WorkflowRunsModule } from './workflow-runs/workflow-runs.module';
import { HealthModule } from './health/health.module';
import { Workflow } from './workflows/entities/workflow.entity';
import { WorkflowRun } from './workflow-runs/entities/workflow-run.entity';
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
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';

        const baseConfig = {
          type: 'postgres' as const,
          entities: [Workflow, WorkflowRun],
          synchronize: false,
          migrationsRun: true,
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
            application_name: 'automations-service',
          },

          // SSL configuration for production
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return {
            ...baseConfig,
            url: databaseUrl,
          };
        }

        return {
          ...baseConfig,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'funnel_agents'),
          password: configService.get('DB_PASSWORD', 'secret'),
          database: configService.get('DB_DATABASE', 'funnel_agents'),
        };
      },
      inject: [ConfigService],
    }),
    WorkflowsModule,
    WorkflowRunsModule,
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
