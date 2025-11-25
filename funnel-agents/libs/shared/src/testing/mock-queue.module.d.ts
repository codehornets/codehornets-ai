import { DynamicModule } from '@nestjs/common';
import { Job } from 'bullmq';
/**
 * Mock Queue implementation for testing
 * Simulates BullMQ queue behavior without requiring Redis
 */
export declare class MockQueue {
    name: string;
    private jobs;
    private jobId;
    constructor(name: string);
    add(name: string, data: any, opts?: any): Promise<Job>;
    getJob(jobId: string): Promise<Job | null>;
    getJobs(types?: string[]): Promise<Job[]>;
    removeJobs(pattern: string): Promise<void>;
    obliterate(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    getJobCounts(): Promise<any>;
}
/**
 * Mock Queue Module for testing
 * Provides mock BullMQ queues without Redis dependency
 */
export declare class MockQueueModule {
    /**
     * Register mock queues for testing
     * @param queues - Array of queue names to mock
     */
    static register(queues: string[]): DynamicModule;
}
/**
 * Create a mock queue for testing
 */
export declare function createMockQueue(name: string): MockQueue;
/**
 * Mock queue processor for testing
 */
export declare function createMockQueueProcessor(): {
    process: any;
    completed: any;
    failed: any;
};
