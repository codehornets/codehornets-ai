export interface ServiceConfig {
    name: string;
    host: string;
    port: number;
    healthPath?: string;
}
export declare const REQUIRED_SERVICES: ServiceConfig[];
/**
 * Check if a service is healthy and available
 */
export declare function checkServiceHealth(service: ServiceConfig, timeout?: number): Promise<{
    healthy: boolean;
    error?: string;
}>;
/**
 * Verify all required services are running
 * Throws an error with detailed information if any service is unavailable
 */
export declare function verifyAllServicesHealthy(services?: ServiceConfig[], timeout?: number): Promise<void>;
/**
 * Wait for a service to become healthy with retries
 */
export declare function waitForService(service: ServiceConfig, maxRetries?: number, retryDelay?: number): Promise<void>;
/**
 * Wait for all services to become healthy
 */
export declare function waitForAllServices(services?: ServiceConfig[], maxRetries?: number, retryDelay?: number): Promise<void>;
/**
 * Generate a unique test email
 */
export declare function generateTestEmail(prefix?: string): string;
/**
 * Clean test data from database (to be implemented per service)
 */
export declare function cleanupTestData(userId?: string): Promise<void>;
/**
 * Assert that response is successful (2xx status code)
 */
export declare function assertSuccessResponse(statusCode: number, message?: string): void;
/**
 * Assert that response is not a service error (5xx or 502/503)
 */
export declare function assertNotServiceError(statusCode: number, body?: any): void;
