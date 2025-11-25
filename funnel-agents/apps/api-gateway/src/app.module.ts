import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { AuthGuard } from './bootstrap/guards/auth.guard';

// Define clients configuration separately so we can reuse it
const clientsConfig = [
  {
    name: 'AUTH_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '', 10) || 3001,
    },
  },
  {
    name: 'CRM_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CRM_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CRM_SERVICE_PORT || '', 10) || 3002,
    },
  },
  {
    name: 'CAMPAIGNS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CAMPAIGNS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CAMPAIGNS_SERVICE_PORT || '', 10) || 3003,
    },
  },
  {
    name: 'CONTENT_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.CONTENT_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.CONTENT_SERVICE_PORT || '', 10) || 3004,
    },
  },
  {
    name: 'AGENTS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AGENTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AGENTS_SERVICE_PORT || '', 10) || 3005,
    },
  },
  {
    name: 'TASKS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.TASKS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TASKS_SERVICE_PORT || '', 10) || 3006,
    },
  },
  {
    name: 'AUTOMATIONS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT || '', 10) || 3007,
    },
  },
  {
    name: 'REPORTS_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.REPORTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.REPORTS_SERVICE_PORT || '', 10) || 3008,
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
    // Microservice clients for inter-service communication
    ClientsModule.register(clientsConfig as any),
    ProxyModule,
    HealthModule,
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, ClientsModule],
})
export class AppModule {}
