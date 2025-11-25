import { DataSource } from 'typeorm';
export declare class HealthService {
    private dataSource;
    private readonly logger;
    private readonly startTime;
    constructor(dataSource: DataSource);
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        uptime: number;
        version: string;
    }>;
    checkReadiness(): Promise<{
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
    private checkDatabase;
}
