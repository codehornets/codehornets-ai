import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { SecurityModule } from './security/security.module';
import { AuthGuard } from './bootstrap/guards/auth.guard';
import { CustomThrottlerGuard } from '@funnelagents/shared';
import { createThrottlerConfig, getRedisUrl } from '@funnelagents/shared';

// Define clients configuration separately so we can reuse it
// TCP ports are HTTP port + 10 (e.g., 3001 HTTP -> 3011 TCP)
const clientsConfig = [
  {
    name: 'AUTH_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_TCP_PORT || '', 10) || 3011,
    },
  },
  {
    name: 'CRM_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CRM_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CRM_SERVICE_TCP_PORT || '', 10) || 3012,
    },
  },
  {
    name: 'CAMPAIGNS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CAMPAIGNS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CAMPAIGNS_SERVICE_TCP_PORT || '', 10) || 3013,
    },
  },
  {
    name: 'CONTENT_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CONTENT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CONTENT_SERVICE_TCP_PORT || '', 10) || 3014,
    },
  },
  {
    name: 'AGENTS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AGENTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AGENTS_SERVICE_TCP_PORT || '', 10) || 3015,
    },
  },
  {
    name: 'TASKS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.TASKS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TASKS_SERVICE_TCP_PORT || '', 10) || 3016,
    },
  },
  {
    name: 'AUTOMATIONS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTOMATIONS_SERVICE_TCP_PORT || '', 10) || 3017,
    },
  },
  {
    name: 'REPORTS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.REPORTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.REPORTS_SERVICE_TCP_PORT || '', 10) || 3018,
    },
  },
];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Rate limiting with Redis support
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = getRedisUrl();
        const useRedis = !!redisUrl && configService.get('NODE_ENV') !== 'test';
        return createThrottlerConfig(useRedis, redisUrl);
      },
    }),
    // Microservice clients for inter-service communication
    ClientsModule.register(clientsConfig as any),
    ProxyModule,
    HealthModule,
    SecurityModule,
  ],
  providers: [
    AuthGuard,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [AuthGuard, ClientsModule],
})
export class AppModule {}
