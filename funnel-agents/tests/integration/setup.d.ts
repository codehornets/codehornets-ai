/**
 * Integration Test Setup
 *
 * Configures test containers and shared test infrastructure for integration tests.
 */
import Redis from 'ioredis';
export declare const TEST_CONFIG: {
    redis: {
        host: string;
        port: number;
    };
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };
    services: {
        authService: {
            host: string;
            port: number;
        };
        crmService: {
            host: string;
            port: number;
        };
        agentsService: {
            host: string;
            port: number;
        };
        pythonAgentApi: {
            url: string;
        };
    };
};
/**
 * Helper: Wait for service to be ready
 */
export declare function waitForService(host: string, port: number, timeout?: number): Promise<boolean>;
/**
 * Helper: Get Redis client for tests
 */
export declare function getRedisClient(): Redis | null;
/**
 * Helper: Clean all queues
 */
export declare function cleanAllQueues(): Promise<void>;
/**
 * Helper: Wait for condition with timeout
 */
export declare function waitFor(condition: () => Promise<boolean> | boolean, options?: {
    timeout?: number;
    interval?: number;
    message?: string;
}): Promise<void>;
