export interface WorkerConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    services: {
        tasks: {
            host: string;
            port: number;
        };
        agents: {
            host: string;
            port: number;
        };
        automations: {
            host: string;
            port: number;
        };
    };
    agentApi: {
        url: string;
        timeout: number;
    };
    worker: {
        host: string;
        port: number;
        httpPort: number;
    };
    queue: {
        defaultAttempts: number;
        defaultBackoffDelay: number;
        removeOnComplete: number;
        removeOnFail: number;
    };
}
export declare const getWorkerConfig: () => WorkerConfig;
