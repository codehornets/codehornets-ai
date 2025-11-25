import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { AuthGuard } from './bootstrap/guards/auth.guard';

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
    // Microservice clients for inter-service communication
    ClientsModule.register(clientsConfig as any),
    ProxyModule,
    HealthModule,
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, ClientsModule],
})
export class AppModule {}
