import { Injectable } from '@nestjs/common';
import { Queue, Job, JobsOptions } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { JobData, JobResult, QueueMetrics, QueueNames } from './queue.types';

@Injectable()
export class QueueService {
  private queues: Map<string, Queue> = new Map();

  registerQueue(name: string, queue: Queue): void {
    this.queues.set(name, queue);
  }

  async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(jobName, data, {
      ...options,
      removeOnComplete: options?.removeOnComplete ?? 100,
      removeOnFail: options?.removeOnFail ?? 50,
    }) as Promise<Job<T>>;
  }

  async addBulk<T extends JobData>(
    queueName: string,
    jobs: Array<{ name: string; data: T; options?: JobsOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.addBulk(jobs) as Promise<Job<T>[]>;
  }

  async getJob<T extends JobData>(queueName: string, jobId: string): Promise<Job<T> | undefined> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId) as Promise<Job<T> | undefined>;
  }

  async getMetrics(queueName: string): Promise<QueueMetrics> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async pause(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
  }

  async resume(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
  }

  async drain(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.drain();
  }

  async clean(
    queueName: string,
    grace: number,
    status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active'
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.clean(grace, 100, status);
  }
}
