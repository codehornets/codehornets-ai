import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerRunner');

  // Create hybrid application (HTTP + Microservice)
  const app = await NestFactory.create(AppModule);

  // Enable CORS for health check endpoints
  app.enableCors();

  // Connect microservice for TCP communication
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.TCP,
    options: {
      host: process.env.WORKER_RUNNER_HOST || '0.0.0.0',
      port: parseInt(process.env.WORKER_RUNNER_PORT || '', 10) || 3009,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  };

  app.connectMicroservice<MicroserviceOptions>(microserviceOptions);

  // Start all microservices
  await app.startAllMicroservices();

  // Start HTTP server for health checks
  const httpPort = parseInt(process.env.WORKER_RUNNER_HTTP_PORT || '', 10) || 3109;
  await app.listen(httpPort);

  logger.log(`Worker Runner TCP service is listening on port ${process.env.WORKER_RUNNER_PORT || 3009}`);
  logger.log(`Worker Runner HTTP service (health checks) is listening on port ${httpPort}`);
  logger.log('Background task processing started...');
  logger.log('Queue processors active: tasks, agents, automations');

  // Log configuration
  logger.log('Configuration:');
  logger.log(`  - Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  logger.log(`  - Tasks Service: ${process.env.TASKS_SERVICE_HOST || 'localhost'}:${process.env.TASKS_SERVICE_PORT || 3006}`);
  logger.log(`  - Agents Service: ${process.env.AGENTS_SERVICE_HOST || 'localhost'}:${process.env.AGENTS_SERVICE_PORT || 3002}`);
  logger.log(`  - Automations Service: ${process.env.AUTOMATIONS_SERVICE_HOST || 'localhost'}:${process.env.AUTOMATIONS_SERVICE_PORT || 3008}`);
  logger.log(`  - Agent API: ${process.env.AGENT_API_URL || 'http://localhost:8000'}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('WorkerRunner');
  logger.error('Failed to start Worker Runner:', error);
  process.exit(1);
});
