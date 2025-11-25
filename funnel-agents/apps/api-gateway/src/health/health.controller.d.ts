import { ClientProxy } from '@nestjs/microservices';
interface ServiceHealth {
    name: string;
    status: 'healthy' | 'unhealthy' | 'timeout';
    responseTime?: number;
    error?: string;
}
export declare class HealthController {
    private readonly authClient;
    private readonly crmClient;
    private readonly campaignsClient;
    private readonly contentClient;
    private readonly agentsClient;
    private readonly tasksClient;
    private readonly automationsClient;
    private readonly reportsClient;
    constructor(authClient: ClientProxy, crmClient: ClientProxy, campaignsClient: ClientProxy, contentClient: ClientProxy, agentsClient: ClientProxy, tasksClient: ClientProxy, automationsClient: ClientProxy, reportsClient: ClientProxy);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
    }>;
    getServicesHealth(): Promise<{
        status: string;
        timestamp: string;
        services: ServiceHealth[];
    }>;
    private checkServiceHealth;
}
export {};
