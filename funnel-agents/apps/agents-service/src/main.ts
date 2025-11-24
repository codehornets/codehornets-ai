import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AgentsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AGENTS_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.AGENTS_SERVICE_PORT, 10) || 3005,
      },
    },
  );

  await app.listen();
  logger.log(
    `Agents Service is listening on port ${process.env.AGENTS_SERVICE_PORT || 3005}`,
  );
}

bootstrap();
