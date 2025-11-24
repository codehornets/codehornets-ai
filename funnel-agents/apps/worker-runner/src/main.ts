import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerRunner');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.WORKER_RUNNER_HOST || '0.0.0.0',
        port: parseInt(process.env.WORKER_RUNNER_PORT, 10) || 3009,
      },
    },
  );

  await app.listen();
  logger.log(
    `Worker Runner is listening on port ${process.env.WORKER_RUNNER_PORT || 3009}`,
  );
  logger.log('Background task processing started...');
}

bootstrap();
