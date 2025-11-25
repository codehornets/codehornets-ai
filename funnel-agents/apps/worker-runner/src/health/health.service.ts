import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
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

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectQueue('tasks') private readonly tasksQueue: Queue,
    @InjectQueue('agents') private readonly agentsQueue: Queue,
    @InjectQueue('automations') private readonly automationsQueue: Queue,
  ) {}

  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
    const queueHealth = await this.checkQueuesHealth();
    const overallStatus = this.determineOverallStatus(queueHealth);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  async getQueueHealth(): Promise<Record<string, QueueHealth>> {
    const [tasksHealth, agentsHealth, automationsHealth] = await Promise.all([
      this.getQueueMetrics('tasks', this.tasksQueue),
      this.getQueueMetrics('agents', this.agentsQueue),
      this.getQueueMetrics('automations', this.automationsQueue),
    ]);

    return {
      tasks: tasksHealth,
      agents: agentsHealth,
      automations: automationsHealth,
    };
  }

  async getDetailedHealthStatus(): Promise<HealthStatus> {
    const queueHealth = await this.getQueueHealth();
    const overallStatus = this.determineOverallStatus(queueHealth);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      queues: {
        tasks: queueHealth.tasks,
        agents: queueHealth.agents,
        automations: queueHealth.automations,
      },
    };
  }

  private async getQueueMetrics(
    name: string,
    queue: Queue,
  ): Promise<QueueHealth> {
    try {
      const [waiting, active, completed, failed, delayed, isPaused, workers] =
        await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
          queue.getWorkers(),
        ]);

      // Determine health status based on metrics
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      // Queue is unhealthy if paused
      if (isPaused) {
        status = 'unhealthy';
      }
      // Queue is degraded if too many failed jobs relative to completed
      else if (failed > 0 && completed > 0 && failed / completed > 0.1) {
        status = 'degraded';
      }
      // Queue is degraded if too many jobs are waiting
      else if (waiting > 100) {
        status = 'degraded';
      }

      return {
        name,
        status,
        metrics: {
          waiting,
          active,
          completed,
          failed,
          delayed,
          paused: isPaused,
        },
        workers: {
          active: workers.length,
          idle: 0, // BullMQ doesn't expose idle worker count directly
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get metrics for queue ${name}:`, error);
      return {
        name,
        status: 'unhealthy',
        metrics: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false,
        },
      };
    }
  }

  private determineOverallStatus(
    queues: Record<string, QueueHealth>,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(queues).map((q) => q.status);

    if (statuses.some((s) => s === 'unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private async checkQueuesHealth(): Promise<Record<string, QueueHealth>> {
    return this.getQueueHealth();
  }
}
