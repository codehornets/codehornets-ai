import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AgentsModule } from './modules/agents.module';
import { HealthModule } from './health/health.module';
import {
  AgentDbEntity,
  AgentFeedbackDbEntity,
  AgentTuningDbEntity,
  AgentTemplateDbEntity,
} from '@funnelagents/infrastructure';
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

        // Base configuration with pooling
        let config: any = {
          type: 'postgres',
          synchronize: false,
          migrationsRun: true,
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          logging: nodeEnv === 'development',
          entities: [AgentDbEntity, AgentFeedbackDbEntity, AgentTuningDbEntity, AgentTemplateDbEntity],
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
            application_name: 'agents-service',
          },

          // SSL configuration for production
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          const url = new URL(databaseUrl);
          config = {
            ...config,
            host: url.hostname,
            port: parseInt(url.port, 10) || 5432,
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1),
          };
        } else {
          config = {
            ...config,
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'funnel_agents'),
            password: configService.get<string>('DB_PASSWORD', 'secret'),
            database: configService.get<string>('DB_DATABASE', 'funnel_agents'),
          };
        }

        return config;
      },
    }),
    AgentsModule,
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
