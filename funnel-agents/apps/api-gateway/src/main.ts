import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './bootstrap/filters/http-exception.filter';
import { LoggingInterceptor } from './bootstrap/interceptors/logging.interceptor';
import { TransformInterceptor } from './bootstrap/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:4200',
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  const port = process.env.API_GATEWAY_PORT || 3000;
  await app.listen(port);
  logger.log('API Gateway is running on port ' + port);
  logger.log('CORS enabled for configured origins');
}

bootstrap();
