import { Queue } from 'bullmq';
interface QueueHealth {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: boolean;
    };
    workers?: {
        active: number;
        idle: number;
    };
}
interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    queues: {
        tasks: QueueHealth;
        agents: QueueHealth;
        automations: QueueHealth;
    };
}
export declare class HealthService {
    private readonly tasksQueue;
    private readonly agentsQueue;
    private readonly automationsQueue;
    private readonly logger;
    private readonly startTime;
    constructor(tasksQueue: Queue, agentsQueue: Queue, automationsQueue: Queue);
    getHealthStatus(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
    getQueueHealth(): Promise<Record<string, QueueHealth>>;
    getDetailedHealthStatus(): Promise<HealthStatus>;
    private getQueueMetrics;
    private determineOverallStatus;
    private checkQueuesHealth;
}
export {};
