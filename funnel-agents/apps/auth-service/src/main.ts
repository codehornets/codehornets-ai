import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AuthService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.AUTH_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3001,
      },
    },
  );

  await app.listen();
  logger.log(
    `Auth Service is listening on port ${process.env.AUTH_SERVICE_PORT || 3001}`,
  );
}

bootstrap();
