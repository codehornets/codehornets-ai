import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AuthService');

  // Create HTTP application for REST endpoints
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web-ui
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Connect microservice for inter-service communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.AUTH_SERVICE_TCP_PORT || '', 10) || 3011,
    },
  });

  await app.startAllMicroservices();

  const httpPort = parseInt(process.env.AUTH_SERVICE_PORT || '', 10) || 3001;
  await app.listen(httpPort);

  logger.log(`Auth Service HTTP is listening on port ${httpPort}`);
  logger.log(
    `Auth Service TCP is listening on port ${process.env.AUTH_SERVICE_TCP_PORT || 3011}`,
  );
}

bootstrap();
