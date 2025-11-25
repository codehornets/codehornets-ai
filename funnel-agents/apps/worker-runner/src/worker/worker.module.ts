import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { TaskProcessor, AgentProcessor, WorkflowProcessor } from '../processors';

@Module({
  imports: [
    // BullMQ configuration with Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            return Math.min(times * 50, 2000);
          },
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),

    // Register queues that processors will consume from
    BullModule.registerQueue(
      {
        name: 'tasks',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'agents',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'automations',
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
    ),

    // TCP clients for microservices communication
    ClientsModule.registerAsync([
      {
        name: 'TASKS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('TASKS_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('TASKS_SERVICE_PORT', 3006),
          },
        }),
      },
      {
        name: 'AGENTS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AGENTS_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('AGENTS_SERVICE_PORT', 3002),
          },
        }),
      },
      {
        name: 'AUTOMATIONS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTOMATIONS_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('AUTOMATIONS_SERVICE_PORT', 3008),
          },
        }),
      },
    ]),

    // HTTP client for calling Python FastAPI agent
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 30000),
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [
    TaskProcessor,
    AgentProcessor,
    WorkflowProcessor,
  ],
  exports: [BullModule, ClientsModule],
})
export class WorkerModule {}
