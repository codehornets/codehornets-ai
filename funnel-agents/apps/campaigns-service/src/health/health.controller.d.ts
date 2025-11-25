import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        uptime: number;
        version: string;
    }>;
    getReadiness(): Promise<{
        status: string;
        timestamp: string;
        checks: {
            database: {
                status: "up" | "down";
                responseTime?: number;
                error?: string;
            };
        };
    }>;
}
