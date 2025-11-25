import { Injectable, Inject } from '@nestjs/common';
import {
  InjectMetric,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
  makeSummaryProvider,
} from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge, Summary } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @Inject('METRICS_SERVICE_NAME') private readonly serviceName: string,

    // HTTP Request Metrics
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,

    @InjectMetric('http_response_size_bytes')
    private readonly httpResponseSize: Histogram<string>,

    @InjectMetric('http_request_size_bytes')
    private readonly httpRequestSize: Histogram<string>,

    // Database Metrics
    @InjectMetric('db_query_duration_seconds')
    private readonly dbQueryDuration: Histogram<string>,

    @InjectMetric('db_connections_active')
    private readonly dbConnectionsActive: Gauge<string>,

    @InjectMetric('db_queries_total')
    private readonly dbQueriesTotal: Counter<string>,

    @InjectMetric('db_errors_total')
    private readonly dbErrorsTotal: Counter<string>,

    // Queue Metrics
    @InjectMetric('queue_jobs_total')
    private readonly queueJobsTotal: Counter<string>,

    @InjectMetric('queue_job_duration_seconds')
    private readonly queueJobDuration: Histogram<string>,

    @InjectMetric('queue_jobs_active')
    private readonly queueJobsActive: Gauge<string>,

    @InjectMetric('queue_jobs_waiting')
    private readonly queueJobsWaiting: Gauge<string>,

    @InjectMetric('queue_jobs_failed_total')
    private readonly queueJobsFailedTotal: Counter<string>,

    // Business Metrics - Agents
    @InjectMetric('agents_active_count')
    private readonly agentsActiveCount: Gauge<string>,

    @InjectMetric('agents_executions_total')
    private readonly agentsExecutionsTotal: Counter<string>,

    @InjectMetric('agents_execution_duration_seconds')
    private readonly agentsExecutionDuration: Histogram<string>,

    @InjectMetric('agents_errors_total')
    private readonly agentsErrorsTotal: Counter<string>,

    // Business Metrics - Tasks
    @InjectMetric('tasks_created_total')
    private readonly tasksCreatedTotal: Counter<string>,

    @InjectMetric('tasks_completed_total')
    private readonly tasksCompletedTotal: Counter<string>,

    @InjectMetric('tasks_failed_total')
    private readonly tasksFailedTotal: Counter<string>,

    @InjectMetric('tasks_pending_count')
    private readonly tasksPendingCount: Gauge<string>,

    // Business Metrics - Workflows
    @InjectMetric('workflow_executions_total')
    private readonly workflowExecutionsTotal: Counter<string>,

    @InjectMetric('workflow_execution_duration_seconds')
    private readonly workflowExecutionDuration: Histogram<string>,

    @InjectMetric('workflow_errors_total')
    private readonly workflowErrorsTotal: Counter<string>,

    // Business Metrics - API Rate Limiting
    @InjectMetric('api_rate_limit_exceeded_total')
    private readonly apiRateLimitExceededTotal: Counter<string>,

    // Memory & CPU
    @InjectMetric('memory_heap_used_bytes')
    private readonly memoryHeapUsedBytes: Gauge<string>,

    @InjectMetric('cpu_usage_percentage')
    private readonly cpuUsagePercentage: Gauge<string>,

    // Cache Metrics
    @InjectMetric('cache_hits_total')
    private readonly cacheHitsTotal: Counter<string>,

    @InjectMetric('cache_misses_total')
    private readonly cacheMissesTotal: Counter<string>,
  ) {
    // Start collecting process metrics
    this.startProcessMetricsCollection();
  }

  // ==================== HTTP METRICS ====================

  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestSize?: number,
    responseSize?: number,
  ): void {
    const labels = {
      method,
      path: this.normalizeHttpPath(path),
      status_code: statusCode.toString(),
      service: this.serviceName,
    };

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDuration.observe(labels, duration / 1000); // Convert to seconds

    if (requestSize) {
      this.httpRequestSize.observe(labels, requestSize);
    }

    if (responseSize) {
      this.httpResponseSize.observe(labels, responseSize);
    }
  }

  // ==================== DATABASE METRICS ====================

  recordDbQuery(operation: string, table: string, duration: number): void {
    const labels = {
      operation,
      table,
      service: this.serviceName,
    };

    this.dbQueriesTotal.inc(labels);
    this.dbQueryDuration.observe(labels, duration / 1000);
  }

  recordDbError(operation: string, table: string, errorType: string): void {
    this.dbErrorsTotal.inc({
      operation,
      table,
      error_type: errorType,
      service: this.serviceName,
    });
  }

  setDbConnections(activeConnections: number): void {
    this.dbConnectionsActive.set({ service: this.serviceName }, activeConnections);
  }

  // ==================== QUEUE METRICS ====================

  recordQueueJob(
    queueName: string,
    jobType: string,
    status: 'completed' | 'failed',
    duration?: number,
  ): void {
    const labels = {
      queue: queueName,
      job_type: jobType,
      status,
      service: this.serviceName,
    };

    this.queueJobsTotal.inc(labels);

    if (status === 'failed') {
      this.queueJobsFailedTotal.inc(labels);
    }

    if (duration) {
      this.queueJobDuration.observe(labels, duration / 1000);
    }
  }

  setQueueJobsActive(queueName: string, count: number): void {
    this.queueJobsActive.set(
      {
        queue: queueName,
        service: this.serviceName,
      },
      count,
    );
  }

  setQueueJobsWaiting(queueName: string, count: number): void {
    this.queueJobsWaiting.set(
      {
        queue: queueName,
        service: this.serviceName,
      },
      count,
    );
  }

  // ==================== AGENT METRICS ====================

  setActiveAgents(count: number): void {
    this.agentsActiveCount.set({ service: this.serviceName }, count);
  }

  recordAgentExecution(agentType: string, status: 'success' | 'error', duration: number): void {
    const labels = {
      agent_type: agentType,
      status,
      service: this.serviceName,
    };

    this.agentsExecutionsTotal.inc(labels);
    this.agentsExecutionDuration.observe(labels, duration / 1000);

    if (status === 'error') {
      this.agentsErrorsTotal.inc(labels);
    }
  }

  // ==================== TASK METRICS ====================

  recordTaskCreated(taskType: string): void {
    this.tasksCreatedTotal.inc({
      task_type: taskType,
      service: this.serviceName,
    });
  }

  recordTaskCompleted(taskType: string): void {
    this.tasksCompletedTotal.inc({
      task_type: taskType,
      service: this.serviceName,
    });
  }

  recordTaskFailed(taskType: string, errorType: string): void {
    this.tasksFailedTotal.inc({
      task_type: taskType,
      error_type: errorType,
      service: this.serviceName,
    });
  }

  setTasksPending(count: number): void {
    this.tasksPendingCount.set({ service: this.serviceName }, count);
  }

  // ==================== WORKFLOW METRICS ====================

  recordWorkflowExecution(
    workflowType: string,
    status: 'success' | 'error',
    duration: number,
  ): void {
    const labels = {
      workflow_type: workflowType,
      status,
      service: this.serviceName,
    };

    this.workflowExecutionsTotal.inc(labels);
    this.workflowExecutionDuration.observe(labels, duration / 1000);

    if (status === 'error') {
      this.workflowErrorsTotal.inc(labels);
    }
  }

  // ==================== API RATE LIMIT METRICS ====================

  recordRateLimitExceeded(endpoint: string, userId?: string): void {
    this.apiRateLimitExceededTotal.inc({
      endpoint: this.normalizeHttpPath(endpoint),
      user_id: userId || 'anonymous',
      service: this.serviceName,
    });
  }

  // ==================== CACHE METRICS ====================

  recordCacheHit(cacheKey: string): void {
    this.cacheHitsTotal.inc({
      cache_key: this.normalizeCacheKey(cacheKey),
      service: this.serviceName,
    });
  }

  recordCacheMiss(cacheKey: string): void {
    this.cacheMissesTotal.inc({
      cache_key: this.normalizeCacheKey(cacheKey),
      service: this.serviceName,
    });
  }

  // ==================== HELPER METHODS ====================

  private normalizeHttpPath(path: string): string {
    // Replace dynamic path parameters with placeholder
    return path.replace(/\/[0-9a-f-]{36}/gi, '/:id').replace(/\/\d+/g, '/:id');
  }

  private normalizeCacheKey(key: string): string {
    // Remove specific IDs from cache keys for better aggregation
    return key.replace(/[0-9a-f-]{36}/gi, ':id').replace(/\d+/g, ':id');
  }

  private startProcessMetricsCollection(): void {
    // Collect memory and CPU metrics every 5 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryHeapUsedBytes.set({ service: this.serviceName }, memUsage.heapUsed);

      // CPU usage calculation (simple approach)
      const cpuUsage = process.cpuUsage();
      const totalCpu = cpuUsage.user + cpuUsage.system;
      const cpuPercentage = (totalCpu / 1000000) * 100; // Convert to percentage

      this.cpuUsagePercentage.set({ service: this.serviceName }, cpuPercentage);
    }, 5000);
  }
}

// Metric providers for dependency injection
export const metricsProviders = [
  // HTTP Metrics
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code', 'service'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status_code', 'service'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  }),
  makeHistogramProvider({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'path', 'status_code', 'service'],
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  }),
  makeHistogramProvider({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'path', 'status_code', 'service'],
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  }),

  // Database Metrics
  makeHistogramProvider({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'table', 'service'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  }),
  makeGaugeProvider({
    name: 'db_connections_active',
    help: 'Number of active database connections',
    labelNames: ['service'],
  }),
  makeCounterProvider({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table', 'service'],
  }),
  makeCounterProvider({
    name: 'db_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'table', 'error_type', 'service'],
  }),

  // Queue Metrics
  makeCounterProvider({
    name: 'queue_jobs_total',
    help: 'Total number of queue jobs processed',
    labelNames: ['queue', 'job_type', 'status', 'service'],
  }),
  makeHistogramProvider({
    name: 'queue_job_duration_seconds',
    help: 'Queue job processing duration in seconds',
    labelNames: ['queue', 'job_type', 'status', 'service'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  }),
  makeGaugeProvider({
    name: 'queue_jobs_active',
    help: 'Number of jobs currently being processed',
    labelNames: ['queue', 'service'],
  }),
  makeGaugeProvider({
    name: 'queue_jobs_waiting',
    help: 'Number of jobs waiting in queue',
    labelNames: ['queue', 'service'],
  }),
  makeCounterProvider({
    name: 'queue_jobs_failed_total',
    help: 'Total number of failed queue jobs',
    labelNames: ['queue', 'job_type', 'status', 'service'],
  }),

  // Agent Metrics
  makeGaugeProvider({
    name: 'agents_active_count',
    help: 'Number of currently active agents',
    labelNames: ['service'],
  }),
  makeCounterProvider({
    name: 'agents_executions_total',
    help: 'Total number of agent executions',
    labelNames: ['agent_type', 'status', 'service'],
  }),
  makeHistogramProvider({
    name: 'agents_execution_duration_seconds',
    help: 'Agent execution duration in seconds',
    labelNames: ['agent_type', 'status', 'service'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600],
  }),
  makeCounterProvider({
    name: 'agents_errors_total',
    help: 'Total number of agent execution errors',
    labelNames: ['agent_type', 'status', 'service'],
  }),

  // Task Metrics
  makeCounterProvider({
    name: 'tasks_created_total',
    help: 'Total number of tasks created',
    labelNames: ['task_type', 'service'],
  }),
  makeCounterProvider({
    name: 'tasks_completed_total',
    help: 'Total number of tasks completed',
    labelNames: ['task_type', 'service'],
  }),
  makeCounterProvider({
    name: 'tasks_failed_total',
    help: 'Total number of tasks failed',
    labelNames: ['task_type', 'error_type', 'service'],
  }),
  makeGaugeProvider({
    name: 'tasks_pending_count',
    help: 'Number of pending tasks',
    labelNames: ['service'],
  }),

  // Workflow Metrics
  makeCounterProvider({
    name: 'workflow_executions_total',
    help: 'Total number of workflow executions',
    labelNames: ['workflow_type', 'status', 'service'],
  }),
  makeHistogramProvider({
    name: 'workflow_execution_duration_seconds',
    help: 'Workflow execution duration in seconds',
    labelNames: ['workflow_type', 'status', 'service'],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600],
  }),
  makeCounterProvider({
    name: 'workflow_errors_total',
    help: 'Total number of workflow execution errors',
    labelNames: ['workflow_type', 'status', 'service'],
  }),

  // API Rate Limit Metrics
  makeCounterProvider({
    name: 'api_rate_limit_exceeded_total',
    help: 'Total number of rate limit violations',
    labelNames: ['endpoint', 'user_id', 'service'],
  }),

  // Process Metrics
  makeGaugeProvider({
    name: 'memory_heap_used_bytes',
    help: 'Memory heap used in bytes',
    labelNames: ['service'],
  }),
  makeGaugeProvider({
    name: 'cpu_usage_percentage',
    help: 'CPU usage percentage',
    labelNames: ['service'],
  }),

  // Cache Metrics
  makeCounterProvider({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_key', 'service'],
  }),
  makeCounterProvider({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_key', 'service'],
  }),
];
