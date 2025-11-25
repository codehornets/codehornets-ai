import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, catchError, firstValueFrom } from 'rxjs';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'timeout';
  responseTime?: number;
  error?: string;
}

@Controller('health')
export class HealthController {

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('CRM_SERVICE') private readonly crmClient: ClientProxy,
    @Inject('CAMPAIGNS_SERVICE')
    private readonly campaignsClient: ClientProxy,
    @Inject('CONTENT_SERVICE') private readonly contentClient: ClientProxy,
    @Inject('AGENTS_SERVICE') private readonly agentsClient: ClientProxy,
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientProxy,
    @Inject('AUTOMATIONS_SERVICE')
    private readonly automationsClient: ClientProxy,
    @Inject('REPORTS_SERVICE') private readonly reportsClient: ClientProxy,
  ) {}

  @Get()
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('services')
  async getServicesHealth() {
    const services = [
      { name: 'auth-service', client: this.authClient },
      { name: 'crm-service', client: this.crmClient },
      { name: 'campaigns-service', client: this.campaignsClient },
      { name: 'content-service', client: this.contentClient },
      { name: 'agents-service', client: this.agentsClient },
      { name: 'tasks-service', client: this.tasksClient },
      { name: 'automations-service', client: this.automationsClient },
      { name: 'reports-service', client: this.reportsClient },
    ];

    const healthChecks = await Promise.all(
      services.map((service) => this.checkServiceHealth(service)),
    );

    const allHealthy = healthChecks.every((h) => h.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: healthChecks,
    };
  }

  private async checkServiceHealth(service: {
    name: string;
    client: ClientProxy;
  }): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await firstValueFrom(
        service.client.send('health.check', {}).pipe(
          timeout(3000),
          catchError((error) => {
            throw error;
          }),
        ),
      );

      return {
        name: service.name,
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as Error;
      const isTimeout = Date.now() - startTime >= 3000;
      return {
        name: service.name,
        status: isTimeout ? 'timeout' : 'unhealthy',
        responseTime: Date.now() - startTime,
        error: err.message || 'Unknown error',
      };
    }
  }
}
