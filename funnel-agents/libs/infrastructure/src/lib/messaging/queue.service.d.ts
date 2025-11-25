import { Queue, Job, JobsOptions } from 'bullmq';
import { JobData, QueueMetrics } from './queue.types';
export declare class QueueService {
    private queues;
    registerQueue(name: string, queue: Queue): void;
    addJob<T extends JobData>(queueName: string, jobName: string, data: T, options?: JobsOptions): Promise<Job<T>>;
    addBulk<T extends JobData>(queueName: string, jobs: Array<{
        name: string;
        data: T;
        options?: JobsOptions;
    }>): Promise<Job<T>[]>;
    getJob<T extends JobData>(queueName: string, jobId: string): Promise<Job<T> | undefined>;
    getMetrics(queueName: string): Promise<QueueMetrics>;
    pause(queueName: string): Promise<void>;
    resume(queueName: string): Promise<void>;
    drain(queueName: string): Promise<void>;
    clean(queueName: string, grace: number, status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active'): Promise<string[]>;
}
