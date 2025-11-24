import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Scheduler');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.SCHEDULER_HOST || '0.0.0.0',
        port: parseInt(process.env.SCHEDULER_PORT || '', 10) || 3010,
      },
    },
  );

  await app.listen();
  logger.log(
    `Scheduler Service is listening on port ${process.env.SCHEDULER_PORT || 3010}`,
  );
  logger.log('Cron jobs and scheduled tasks initialized...');
}

bootstrap();
