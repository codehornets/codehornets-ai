import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AutomationsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTOMATIONS_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT || '', 10) || 3007,
      },
    },
  );

  await app.listen();
  logger.log(
    `Automations Service is listening on port ${process.env.AUTOMATIONS_SERVICE_PORT || 3007}`,
  );
}

bootstrap();
