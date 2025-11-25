import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CampaignsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.CAMPAIGNS_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.CAMPAIGNS_SERVICE_PORT || '', 10) || 3003,
      },
    },
  );

  await app.listen();
  logger.log(
    `Campaigns Service is listening on port ${process.env.CAMPAIGNS_SERVICE_PORT || 3003}`,
  );
}

bootstrap();
