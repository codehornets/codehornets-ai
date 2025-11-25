import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { HealthModule } from './health/health.module';
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { StrictThrottlerGuard } from '@funnelagents/shared';
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

        const entities = [
          User,
          PasswordResetToken,
          TokenBlacklist,
          AuditLog,
          LoginAttempt,
        ];

        const baseConfig = {
          type: 'postgres' as const,
          entities,
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
            application_name: 'auth-service',
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
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'funnel_agents'),
          password: configService.get<string>('DB_PASSWORD', 'secret'),
          database: configService.get<string>('DB_DATABASE', 'funnel_agents'),
        };
      },
    }),
    AuthModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: StrictThrottlerGuard,
    },
  ],
})
export class AppModule {}
