import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('AuthService');

  // CRITICAL SECURITY CHECK: Validate required secrets on startup
  const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

  if (missingSecrets.length > 0) {
    logger.error('═'.repeat(80));
    logger.error('FATAL SECURITY ERROR: Required environment variables are not set');
    logger.error('═'.repeat(80));
    logger.error(`Missing secrets: ${missingSecrets.join(', ')}`);
    logger.error('');
    logger.error('The auth-service REQUIRES the following environment variables:');
    logger.error('  - JWT_SECRET: Secret key for access token signing');
    logger.error('  - JWT_REFRESH_SECRET: Secret key for refresh token signing');
    logger.error('');
    logger.error('Generate secure secrets using:');
    logger.error('  node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    logger.error('');
    logger.error('Set them in your .env file or environment before starting the service.');
    logger.error('═'.repeat(80));
    process.exit(1);
  }

  logger.log('Security validation passed: All required secrets are configured');

  // Create HTTP application for REST endpoints
  const app = await NestFactory.create(AppModule);

  // Security: Apply Helmet middleware for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Enable CORS for web-ui
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  logger.log('Security features enabled: Helmet, CORS, Rate Limiting, RBAC');
}

bootstrap();
