import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData, JobResult } from './queue.types';

export abstract class BaseQueueProcessor<T extends JobData> extends WorkerHost {
  protected readonly logger: Logger;

  constructor(processorName: string) {
    super();
    this.logger = new Logger(processorName);
  }

  abstract process(job: Job<T>): Promise<JobResult>;

  @OnWorkerEvent('completed')
  onCompleted(job: Job<T>, result: JobResult): void {
    this.logger.log(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<T>, error: Error): void {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`, error.stack);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<T>): void {
    this.logger.debug(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<T>, progress: number | object): void {
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} has stalled`);
  }

  protected async updateProgress(job: Job<T>, progress: number): Promise<void> {
    await job.updateProgress(progress);
  }

  protected async addLog(job: Job<T>, log: string): Promise<void> {
    await job.log(log);
  }
}
