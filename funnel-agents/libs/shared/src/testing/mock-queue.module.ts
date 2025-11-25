import { DynamicModule, Module } from '@nestjs/common';
import { Queue, Job } from 'bullmq';

/**
 * Mock Queue implementation for testing
 * Simulates BullMQ queue behavior without requiring Redis
 */
export class MockQueue {
  private jobs: Map<string, any> = new Map();
  private jobId = 0;

  constructor(public name: string) {}

  async add(name: string, data: any, opts?: any): Promise<Job> {
    const jobId = String(++this.jobId);
    const job = {
      id: jobId,
      name,
      data,
      opts,
      progress: 0,
      returnvalue: null,
      finishedOn: null,
      processedOn: null,
      failedReason: null,
      updateProgress: jest.fn(),
    } as any;

    this.jobs.set(jobId, job);
    return job;
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobs(types?: string[]): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async removeJobs(pattern: string): Promise<void> {
    this.jobs.clear();
  }

  async obliterate(): Promise<void> {
    this.jobs.clear();
  }

  async pause(): Promise<void> {
    // Mock implementation
  }

  async resume(): Promise<void> {
    // Mock implementation
  }

  async getJobCounts(): Promise<any> {
    return {
      waiting: 0,
      active: 0,
      completed: this.jobs.size,
      failed: 0,
      delayed: 0,
    };
  }
}

/**
 * Mock Queue Module for testing
 * Provides mock BullMQ queues without Redis dependency
 */
@Module({})
export class MockQueueModule {
  /**
   * Register mock queues for testing
   * @param queues - Array of queue names to mock
   */
  static register(queues: string[]): DynamicModule {
    const providers = queues.map((queueName) => ({
      provide: `BullQueue_${queueName}`,
      useFactory: () => new MockQueue(queueName),
    }));

    return {
      module: MockQueueModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Create a mock queue for testing
 */
export function createMockQueue(name: string): MockQueue {
  return new MockQueue(name);
}

/**
 * Mock queue processor for testing
 */
export function createMockQueueProcessor() {
  return {
    process: jest.fn(),
    completed: jest.fn(),
    failed: jest.fn(),
  };
}
