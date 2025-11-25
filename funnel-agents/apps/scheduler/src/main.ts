import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Scheduler');

  // Create hybrid app (HTTP + Microservice)
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Connect microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.SCHEDULER_HOST || '0.0.0.0',
      port: parseInt(process.env.SCHEDULER_PORT || '', 10) || 3010,
    },
  });

  // Start all microservices
  await app.startAllMicroservices();

  // Start HTTP server
  const httpPort = parseInt(process.env.SCHEDULER_HTTP_PORT || '', 10) || 3110;
  await app.listen(httpPort);

  logger.log(
    `Scheduler Service (Microservice) is listening on port ${process.env.SCHEDULER_PORT || 3010}`,
  );
  logger.log(`Scheduler Service (HTTP) is listening on port ${httpPort}`);
  logger.log('Cron jobs and scheduled tasks initialized...');
}

bootstrap();
