import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Enable NestJS scheduling
    ScheduleModule.forRoot(),
    // Connect to tasks-service for scheduling tasks
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TASKS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.TASKS_SERVICE_PORT, 10) || 3006,
        },
      },
      {
        name: 'AUTOMATIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT, 10) || 3007,
        },
      },
    ]),
    // Add feature modules here:
    // CronJobsModule,
    // ScheduledTasksModule,
    // RecurringJobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
