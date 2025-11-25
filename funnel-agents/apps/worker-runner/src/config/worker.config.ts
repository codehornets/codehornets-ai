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

export const getWorkerConfig = (): WorkerConfig => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  services: {
    tasks: {
      host: process.env.TASKS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TASKS_SERVICE_PORT || '3006', 10),
    },
    agents: {
      host: process.env.AGENTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AGENTS_SERVICE_PORT || '3002', 10),
    },
    automations: {
      host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT || '3008', 10),
    },
  },
  agentApi: {
    url: process.env.AGENT_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.AGENT_API_TIMEOUT || '300000', 10),
  },
  worker: {
    host: process.env.WORKER_RUNNER_HOST || '0.0.0.0',
    port: parseInt(process.env.WORKER_RUNNER_PORT || '3009', 10),
    httpPort: parseInt(process.env.WORKER_RUNNER_HTTP_PORT || '3109', 10),
  },
  queue: {
    defaultAttempts: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),
    defaultBackoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '2000', 10),
    removeOnComplete: parseInt(process.env.QUEUE_REMOVE_COMPLETED || '100', 10),
    removeOnFail: parseInt(process.env.QUEUE_REMOVE_FAILED || '50', 10),
  },
});
