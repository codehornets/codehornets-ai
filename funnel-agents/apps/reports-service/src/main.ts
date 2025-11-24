import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ReportsService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.REPORTS_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.REPORTS_SERVICE_PORT || '', 10) || 3008,
      },
    },
  );

  await app.listen();
  logger.log(
    `Reports Service is listening on port ${process.env.REPORTS_SERVICE_PORT || 3008}`,
  );
}

bootstrap();
