import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
/**
 * Create a test module with the given providers and imports
 */
export declare function createTestingModule(options: {
    providers?: any[];
    imports?: any[];
    controllers?: any[];
}): Promise<TestingModule>;
/**
 * Create a full NestJS test application for E2E testing
 */
export declare function createTestApp(module: any): Promise<INestApplication>;
/**
 * Wait for a condition to be true
 * Useful for testing async operations
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Mock repository pattern for TypeORM
 */
export declare function createMockRepository<T = any>(): {
    find: any;
    findOne: any;
    findOneBy: any;
    findAndCount: any;
    create: any;
    save: any;
    update: any;
    delete: any;
    remove: any;
    count: any;
    createQueryBuilder: any;
};
/**
 * Mock JWT service for testing
 */
export declare function createMockJwtService(): {
    sign: any;
    verify: any;
    decode: any;
};
/**
 * Mock ConfigService for testing
 */
export declare function createMockConfigService(config?: Record<string, any>): {
    get: any;
    getOrThrow: any;
};
/**
 * Mock Logger for testing
 */
export declare function createMockLogger(): {
    log: any;
    error: any;
    warn: any;
    debug: any;
    verbose: any;
};
/**
 * Generate random test data
 */
export declare const testHelpers: {
    randomEmail: () => string;
    randomString: (length?: number) => string;
    randomInt: (min?: number, max?: number) => number;
    randomUuid: () => string;
};
/**
 * Assert that a promise rejects with a specific error
 */
export declare function expectToReject(promise: Promise<any>, errorType?: any, errorMessage?: string | RegExp): Promise<void>;
