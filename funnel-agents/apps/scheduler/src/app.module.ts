import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule, DistributedLockModule } from '@funnelagents/infrastructure';
import { SchedulerController } from './scheduler.controller';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { CronJobsModule } from './cron-jobs/cron-jobs.module';
import { DispatchersModule } from './dispatchers/dispatchers.module';
import { HealthModule } from './health/health.module';
import { ScheduledTask } from './scheduled-tasks/entities/scheduled-task.entity';
import { TaskExecution } from './scheduled-tasks/entities/task-execution.entity';
import { CustomThrottlerGuard } from '@funnelagents/shared';
import { createThrottlerConfig, getRedisUrl } from '@funnelagents/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Enable NestJS scheduling
    ScheduleModule.forRoot(),
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = getRedisUrl();
        const useRedis = !!redisUrl && configService.get('NODE_ENV') !== 'test';
        return createThrottlerConfig(useRedis, redisUrl);
      },
    }),
    // Database connection
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'funnelagents'),
          synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
          logging: configService.get('DB_LOGGING', 'false') === 'true',
          entities: [ScheduledTask, TaskExecution],
          nodeEnv,
          enableHealthMonitoring: true,
        };
      },
      inject: [ConfigService],
    }),
    // Distributed locking
    DistributedLockModule,
    // Feature modules
    ScheduledTasksModule,
    CronJobsModule,
    DispatchersModule,
    HealthModule,
  ],
  controllers: [SchedulerController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
