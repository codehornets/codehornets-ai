import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * Create a test module with the given providers and imports
 */
export async function createTestingModule(options: {
  providers?: any[];
  imports?: any[];
  controllers?: any[];
}): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    providers: options.providers || [],
    imports: options.imports || [],
    controllers: options.controllers || [],
  });

  return moduleBuilder.compile();
}

/**
 * Create a full NestJS test application for E2E testing
 */
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}

/**
 * Wait for a condition to be true
 * Useful for testing async operations
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock repository pattern for TypeORM
 */
export function createMockRepository<T = any>() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((entity: Partial<T>) => entity as T),
    save: jest.fn((entity: T) => Promise.resolve(entity)),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
      execute: jest.fn(),
    })),
  };
}

/**
 * Mock JWT service for testing
 */
export function createMockJwtService() {
  return {
    sign: jest.fn((payload: any) => `mock-token-${payload.sub}`),
    verify: jest.fn((token: string) => ({ sub: 'user-1', email: 'test@example.com', role: 'user' })),
    decode: jest.fn(),
  };
}

/**
 * Mock ConfigService for testing
 */
export function createMockConfigService(config: Record<string, any> = {}) {
  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      const defaultConfig = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRATION: '7d',
        DATABASE_URL: 'sqlite::memory:',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        ...config,
      };
      return defaultConfig[key] ?? defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      const value = config[key];
      if (value === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return value;
    }),
  };
}

/**
 * Mock Logger for testing
 */
export function createMockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
}

/**
 * Generate random test data
 */
export const testHelpers = {
  randomEmail: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  randomInt: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomUuid: () => `${testHelpers.randomString(8)}-${testHelpers.randomString(4)}-${testHelpers.randomString(4)}`,
};

/**
 * Assert that a promise rejects with a specific error
 */
export async function expectToReject(
  promise: Promise<any>,
  errorType?: any,
  errorMessage?: string | RegExp,
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (errorType && !(error instanceof errorType)) {
      throw new Error(`Expected error to be instance of ${errorType.name}, but got ${error.constructor.name}`);
    }
    if (errorMessage) {
      if (typeof errorMessage === 'string') {
        expect(error.message).toBe(errorMessage);
      } else {
        expect(error.message).toMatch(errorMessage);
      }
    }
  }
}
