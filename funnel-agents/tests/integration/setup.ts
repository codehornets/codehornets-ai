/**
 * Integration Test Setup
 *
 * Configures test containers and shared test infrastructure for integration tests.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import Redis from 'ioredis';

const execAsync = promisify(exec);

// Test environment configuration
export const TEST_CONFIG = {
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6380', 10),
  },
  postgres: {
    host: process.env.TEST_POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.TEST_POSTGRES_PORT || '5433', 10),
    database: process.env.TEST_POSTGRES_DB || 'funnel_agents_test',
    username: process.env.TEST_POSTGRES_USER || 'funnel_agents',
    password: process.env.TEST_POSTGRES_PASSWORD || 'secret',
  },
  services: {
    authService: {
      host: process.env.TEST_AUTH_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TEST_AUTH_SERVICE_TCP_PORT || '3011', 10),
    },
    crmService: {
      host: process.env.TEST_CRM_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TEST_CRM_SERVICE_TCP_PORT || '3012', 10),
    },
    agentsService: {
      host: process.env.TEST_AGENTS_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.TEST_AGENTS_SERVICE_TCP_PORT || '3015', 10),
    },
    pythonAgentApi: {
      url: process.env.TEST_PYTHON_AGENT_API_URL || 'http://localhost:8000',
    },
  },
};

// Global Redis client for test cleanup
let redisClient: Redis | null = null;

/**
 * Setup global test environment
 */
beforeAll(async () => {
  console.log('Setting up integration test environment...');

  // Connect to Redis for cleanup
  try {
    redisClient = new Redis({
      host: TEST_CONFIG.redis.host,
      port: TEST_CONFIG.redis.port,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      },
    });

    await redisClient.ping();
    console.log('✓ Connected to Redis');
  } catch (error) {
    console.warn('⚠ Redis not available, some tests may be skipped:', error.message);
  }
}, 30000);

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  console.log('Cleaning up integration test environment...');

  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
  }

  // Give some time for async cleanup
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

/**
 * Clean Redis before each test
 */
beforeEach(async () => {
  if (redisClient) {
    try {
      // Flush test queues only
      const keys = await redisClient.keys('bull:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.warn('Could not clean Redis:', error.message);
    }
  }
});

/**
 * Helper: Wait for service to be ready
 */
export async function waitForService(
  host: string,
  port: number,
  timeout = 10000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await execAsync(`nc -z ${host} ${port}`);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return false;
}

/**
 * Helper: Get Redis client for tests
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Helper: Clean all queues
 */
export async function cleanAllQueues(): Promise<void> {
  if (!redisClient) return;

  const queues = ['tasks', 'agents', 'workflows', 'automations', 'emails'];
  for (const queueName of queues) {
    const keys = await redisClient.keys(`bull:${queueName}:*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
}

/**
 * Helper: Wait for condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  options: { timeout?: number; interval?: number; message?: string } = {},
): Promise<void> {
  const { timeout = 5000, interval = 100, message = 'Condition not met' } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`${message} (timeout after ${timeout}ms)`);
}

// Set longer timeout for integration tests
jest.setTimeout(60000);
