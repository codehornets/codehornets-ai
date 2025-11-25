import { OnModuleInit } from '@nestjs/common';
import { Connection } from 'typeorm';
export interface PoolStatistics {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    timestamp: Date;
}
export declare class DatabaseHealthService implements OnModuleInit {
    private readonly connection;
    private readonly logger;
    constructor(connection: Connection);
    onModuleInit(): Promise<void>;
    /**
     * Get current database connection pool statistics
     */
    getPoolStatistics(): Promise<PoolStatistics>;
    /**
     * Check if database connection is healthy
     */
    checkHealth(): Promise<boolean>;
    /**
     * Log pool statistics
     * Call this manually or use @Cron decorator in your service module
     */
    logPoolStatistics(): Promise<void>;
    /**
     * Start automated monitoring (call every 5 minutes)
     * Use this in combination with @nestjs/schedule in your service
     */
    startAutomatedMonitoring(): void;
    /**
     * Get detailed connection information
     */
    getConnectionInfo(): Promise<{
        database: string;
        isConnected: boolean;
        driver: string;
        options: any;
    }>;
}
