/**
 * BullMQ Queue Integration Tests
 *
 * Tests job enqueue/dequeue, retry logic, failure handling, and concurrent processing
 * with real Redis connection.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue, Worker, Job } from 'bullmq';
import { TEST_CONFIG, getRedisClient, cleanAllQueues, waitFor } from './setup';
import Redis from 'ioredis';

describe('BullMQ Queue Integration Tests', () => {
  let taskQueue: Queue;
  let agentQueue: Queue;
  let workflowQueue: Queue;
  let redisClient: Redis | null;

  beforeAll(async () => {
    redisClient = getRedisClient();

    if (!redisClient) {
      console.warn('Redis not available, skipping queue integration tests');
      return;
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        }),
        BullModule.registerQueue(
          { name: 'tasks' },
          { name: 'agents' },
          { name: 'workflows' },
        ),
      ],
    }).compile();

    taskQueue = module.get<Queue>(getQueueToken('tasks'));
    agentQueue = module.get<Queue>(getQueueToken('agents'));
    workflowQueue = module.get<Queue>(getQueueToken('workflows'));
  });

  afterAll(async () => {
    if (taskQueue) {
      await taskQueue.close();
    }
    if (agentQueue) {
      await agentQueue.close();
    }
    if (workflowQueue) {
      await workflowQueue.close();
    }
  });

  beforeEach(async () => {
    if (redisClient) {
      await cleanAllQueues();
    }
  });

  describe('Job Enqueue/Dequeue with Real Redis', () => {
    it('should enqueue and retrieve a task job', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const jobData = {
        taskId: 'task-123',
        type: 'email',
        payload: {
          to: 'test@example.com',
          subject: 'Test Email',
        },
        userId: 'user-123',
      };

      // Add job to queue
      const job = await taskQueue.add('send-email', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe('send-email');
      expect(job.data).toEqual(jobData);

      // Retrieve job from queue
      const retrievedJob = await taskQueue.getJob(job.id!);
      expect(retrievedJob).toBeDefined();
      expect(retrievedJob?.id).toBe(job.id);
      expect(retrievedJob?.data).toEqual(jobData);
    });

    it('should enqueue agent execution job', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const agentJobData = {
        agentId: 'lead-qualifier',
        executionId: 'exec-456',
        input: {
          leadData: {
            name: 'John Doe',
            email: 'john@example.com',
            score: 75,
          },
        },
        userId: 'user-123',
      };

      const job = await agentQueue.add('execute-agent', agentJobData, {
        priority: 1, // High priority
        attempts: 2,
        timeout: 30000,
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.opts.priority).toBe(1);
      expect(job.opts.attempts).toBe(2);
    });

    it('should enqueue workflow job with delay', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const workflowData = {
        workflowId: 'workflow-789',
        runId: 'run-123',
        currentStep: 'send-notification',
        context: {
          leadId: 'lead-456',
        },
      };

      const delayMs = 5000;
      const job = await workflowQueue.add('execute-workflow-step', workflowData, {
        delay: delayMs,
      });

      expect(job).toBeDefined();
      expect(job.opts.delay).toBe(delayMs);

      // Job should be in delayed state
      const state = await job.getState();
      expect(state).toBe('delayed');
    });

    it('should handle multiple jobs in queue', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const jobs = await Promise.all([
        taskQueue.add('task-1', { id: 1 }),
        taskQueue.add('task-2', { id: 2 }),
        taskQueue.add('task-3', { id: 3 }),
      ]);

      expect(jobs).toHaveLength(3);

      const counts = await taskQueue.getJobCounts('waiting');
      expect(counts.waiting).toBe(3);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed jobs with exponential backoff', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const jobData = { test: 'retry-test' };
      let attemptCount = 0;

      // Create worker that fails first 2 attempts
      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Simulated failure');
          }
          return { success: true, attempts: attemptCount };
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      const job = await taskQueue.add('retry-test', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 100,
        },
      });

      // Wait for job to complete with retries
      await waitFor(
        async () => {
          const state = await job.getState();
          return state === 'completed';
        },
        { timeout: 10000, message: 'Job did not complete after retries' },
      );

      const completedJob = await taskQueue.getJob(job.id!);
      expect(completedJob?.attemptsMade).toBe(3);
      expect(completedJob?.finishedOn).toBeDefined();

      await worker.close();
    }, 15000);

    it('should fail job after max retry attempts', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const jobData = { test: 'max-retry-test' };

      // Create worker that always fails
      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          throw new Error('Always fails');
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      const job = await taskQueue.add('always-fail', jobData, {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 100,
        },
      });

      // Wait for job to fail permanently
      await waitFor(
        async () => {
          const state = await job.getState();
          return state === 'failed';
        },
        { timeout: 10000, message: 'Job did not fail after max retries' },
      );

      const failedJob = await taskQueue.getJob(job.id!);
      expect(failedJob?.attemptsMade).toBe(3);
      expect(failedJob?.failedReason).toContain('Always fails');

      await worker.close();
    }, 15000);

    it('should use custom retry strategy', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const job = await taskQueue.add('custom-retry', { test: 'data' }, {
        attempts: 5,
        backoff: {
          type: 'custom',
          delay: 500,
        },
      });

      expect(job.opts.attempts).toBe(5);
      expect(job.opts.backoff).toBeDefined();
    });
  });

  describe('Job Failure Handling', () => {
    it('should move failed jobs to failed queue', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          throw new Error('Job processing error');
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      const job = await taskQueue.add('fail-test', { test: 'failure' }, {
        attempts: 1,
      });

      await waitFor(
        async () => {
          const state = await job.getState();
          return state === 'failed';
        },
        { timeout: 5000 },
      );

      const failedJobs = await taskQueue.getFailed();
      expect(failedJobs.length).toBeGreaterThan(0);

      const failedJob = failedJobs.find((j) => j.id === job.id);
      expect(failedJob).toBeDefined();
      expect(failedJob?.failedReason).toContain('Job processing error');

      await worker.close();
    }, 10000);

    it('should capture stack trace on failure', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          const error = new Error('Detailed failure');
          error.stack = 'Custom stack trace';
          throw error;
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      const job = await taskQueue.add('stack-test', {}, { attempts: 1 });

      await waitFor(
        async () => {
          const state = await job.getState();
          return state === 'failed';
        },
        { timeout: 5000 },
      );

      const failedJob = await taskQueue.getJob(job.id!);
      expect(failedJob?.stacktrace).toBeDefined();
      expect(failedJob?.stacktrace?.length).toBeGreaterThan(0);

      await worker.close();
    }, 10000);

    it('should handle worker crashes gracefully', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          // Simulate crash
          process.nextTick(() => {
            throw new Error('Worker crash');
          });
          return { status: 'processed' };
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      const job = await taskQueue.add('crash-test', {});

      // Job should eventually timeout or fail
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await worker.close();
    });
  });

  describe('Concurrent Job Processing', () => {
    it('should process multiple jobs concurrently', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const processedJobs: string[] = [];
      const concurrency = 3;

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 100));
          processedJobs.push(job.id!);
          return { processed: true };
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
          concurrency,
        },
      );

      // Add 10 jobs
      const jobs = await Promise.all(
        Array.from({ length: 10 }, (_, i) => taskQueue.add(`job-${i}`, { index: i })),
      );

      // Wait for all jobs to complete
      await waitFor(
        async () => {
          const counts = await taskQueue.getJobCounts('completed');
          return counts.completed >= 10;
        },
        { timeout: 15000 },
      );

      expect(processedJobs.length).toBe(10);

      await worker.close();
    }, 20000);

    it('should respect job priority in processing order', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const processOrder: number[] = [];

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          processOrder.push(job.data.priority);
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { processed: true };
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      // Add jobs with different priorities (lower number = higher priority)
      await taskQueue.add('low', { priority: 3 }, { priority: 3 });
      await taskQueue.add('high', { priority: 1 }, { priority: 1 });
      await taskQueue.add('medium', { priority: 2 }, { priority: 2 });

      // Wait for processing
      await waitFor(
        async () => processOrder.length >= 3,
        { timeout: 5000 },
      );

      // High priority should be processed first
      expect(processOrder[0]).toBe(1);

      await worker.close();
    }, 10000);

    it('should handle rate limiting', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      const worker = new Worker(
        'tasks',
        async (job: Job) => {
          return { processed: true };
        },
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
          limiter: {
            max: 2, // Process max 2 jobs
            duration: 1000, // per 1 second
          },
        },
      );

      // Add 5 jobs quickly
      const startTime = Date.now();
      await Promise.all(Array.from({ length: 5 }, (_, i) => taskQueue.add('rate-test', { i })));

      // Wait for all to complete
      await waitFor(
        async () => {
          const counts = await taskQueue.getJobCounts('completed');
          return counts.completed >= 5;
        },
        { timeout: 10000 },
      );

      const duration = Date.now() - startTime;

      // Should take at least 2 seconds due to rate limiting (5 jobs at 2 per second)
      expect(duration).toBeGreaterThanOrEqual(2000);

      await worker.close();
    }, 15000);
  });

  describe('Queue Management', () => {
    it('should pause and resume queue', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      // Add a job
      await taskQueue.add('pause-test', { test: 'data' });

      // Pause queue
      await taskQueue.pause();
      const isPaused = await taskQueue.isPaused();
      expect(isPaused).toBe(true);

      // Resume queue
      await taskQueue.resume();
      const isResumed = !(await taskQueue.isPaused());
      expect(isResumed).toBe(true);
    });

    it('should get job counts by state', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      await taskQueue.add('count-test-1', {});
      await taskQueue.add('count-test-2', {});
      await taskQueue.add('count-test-3', {});

      const counts = await taskQueue.getJobCounts('waiting', 'active', 'completed', 'failed');

      expect(counts).toHaveProperty('waiting');
      expect(counts).toHaveProperty('active');
      expect(counts).toHaveProperty('completed');
      expect(counts).toHaveProperty('failed');
      expect(counts.waiting).toBeGreaterThanOrEqual(3);
    });

    it('should clean old jobs', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      // Add and immediately complete some jobs
      const worker = new Worker(
        'tasks',
        async (job: Job) => ({ processed: true }),
        {
          connection: {
            host: TEST_CONFIG.redis.host,
            port: TEST_CONFIG.redis.port,
          },
        },
      );

      await Promise.all([
        taskQueue.add('clean-1', {}),
        taskQueue.add('clean-2', {}),
        taskQueue.add('clean-3', {}),
      ]);

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clean completed jobs older than 0ms (all)
      await taskQueue.clean(0, 10, 'completed');

      const completed = await taskQueue.getCompleted();
      expect(completed.length).toBe(0);

      await worker.close();
    }, 10000);

    it('should obliterate queue (remove all jobs and data)', async () => {
      if (!redisClient) {
        console.warn('Skipping test - Redis not available');
        return;
      }

      await taskQueue.add('obliterate-1', {});
      await taskQueue.add('obliterate-2', {});

      await taskQueue.obliterate();

      const counts = await taskQueue.getJobCounts();
      expect(counts.waiting).toBe(0);
      expect(counts.active).toBe(0);
    });
  });
});
