export interface QueueOptions {
    name: string;
    connection: {
        host: string;
        port: number;
        password?: string;
    };
    defaultJobOptions?: {
        removeOnComplete?: boolean | number;
        removeOnFail?: boolean | number;
        attempts?: number;
        backoff?: {
            type: 'fixed' | 'exponential';
            delay: number;
        };
    };
}
export interface JobData {
    type: string;
    payload: Record<string, unknown>;
    metadata?: {
        correlationId?: string;
        timestamp?: Date;
        source?: string;
    };
}
export interface JobResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}
export declare enum QueueNames {
    TASKS = "tasks",
    AGENTS = "agents",
    AUTOMATIONS = "automations",
    REPORTS = "reports",
    NOTIFICATIONS = "notifications",
    EMAILS = "emails"
}
export interface QueueMetrics {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}
