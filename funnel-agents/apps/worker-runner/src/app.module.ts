import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Connect to tasks-service for queue operations
    ClientsModule.register([
      {
        name: 'TASKS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.TASKS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.TASKS_SERVICE_PORT || '', 10) || 3006,
        },
      },
    ]),
    // Add feature modules here:
    // TaskProcessorModule,
    // WorkerHealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
