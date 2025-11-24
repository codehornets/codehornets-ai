import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ContentService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.CONTENT_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.CONTENT_SERVICE_PORT || '', 10) || 3004,
      },
    },
  );

  await app.listen();
  logger.log(
    `Content Service is listening on port ${process.env.CONTENT_SERVICE_PORT || 3004}`,
  );
}

bootstrap();
