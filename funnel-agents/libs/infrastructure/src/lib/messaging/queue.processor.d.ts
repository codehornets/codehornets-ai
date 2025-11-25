import { WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData, JobResult } from './queue.types';
export declare abstract class BaseQueueProcessor<T extends JobData> extends WorkerHost {
    protected readonly logger: Logger;
    constructor(processorName: string);
    abstract process(job: Job<T>): Promise<JobResult>;
    onCompleted(job: Job<T>, result: JobResult): void;
    onFailed(job: Job<T>, error: Error): void;
    onActive(job: Job<T>): void;
    onProgress(job: Job<T>, progress: number | object): void;
    onStalled(jobId: string): void;
    protected updateProgress(job: Job<T>, progress: number): Promise<void>;
    protected addLog(job: Job<T>, log: string): Promise<void>;
}
