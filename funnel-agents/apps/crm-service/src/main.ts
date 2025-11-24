import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CrmService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.CRM_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.CRM_SERVICE_PORT, 10) || 3002,
      },
    },
  );

  await app.listen();
  logger.log(
    `CRM Service is listening on port ${process.env.CRM_SERVICE_PORT || 3002}`,
  );
}

bootstrap();
