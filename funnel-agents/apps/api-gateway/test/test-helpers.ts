import * as http from 'http';

export interface ServiceConfig {
  name: string;
  host: string;
  port: number;
  healthPath?: string;
}

export const REQUIRED_SERVICES: ServiceConfig[] = [
  {
    name: 'Auth Service',
    host: process.env.AUTH_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
    healthPath: '/health',
  },
  {
    name: 'CRM Service',
    host: process.env.CRM_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.CRM_SERVICE_PORT || '3002', 10),
    healthPath: '/health',
  },
  {
    name: 'Campaigns Service',
    host: process.env.CAMPAIGNS_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.CAMPAIGNS_SERVICE_PORT || '3003', 10),
    healthPath: '/health',
  },
  {
    name: 'Agents Service',
    host: process.env.AGENTS_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.AGENTS_SERVICE_PORT || '3005', 10),
    healthPath: '/health',
  },
  {
    name: 'Tasks Service',
    host: process.env.TASKS_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.TASKS_SERVICE_PORT || '3006', 10),
    healthPath: '/health',
  },
  {
    name: 'Automations Service',
    host: process.env.AUTOMATIONS_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.AUTOMATIONS_SERVICE_PORT || '3007', 10),
    healthPath: '/health',
  },
];

/**
 * Check if a service is healthy and available
 */
export async function checkServiceHealth(
  service: ServiceConfig,
  timeout = 5000,
): Promise<{ healthy: boolean; error?: string }> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      req.destroy();
      resolve({
        healthy: false,
        error: `Timeout after ${timeout}ms`,
      });
    }, timeout);

    const req = http.get(
      {
        hostname: service.host,
        port: service.port,
        path: service.healthPath || '/health',
        timeout,
      },
      (res) => {
        clearTimeout(timeoutId);

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ healthy: true });
          } else {
            resolve({
              healthy: false,
              error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}`,
            });
          }
        });
      },
    );

    req.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        healthy: false,
        error: err.message,
      });
    });
  });
}

/**
 * Verify all required services are running
 * Throws an error with detailed information if any service is unavailable
 */
export async function verifyAllServicesHealthy(
  services: ServiceConfig[] = REQUIRED_SERVICES,
  timeout = 10000,
): Promise<void> {
  const results = await Promise.all(
    services.map(async (service) => {
      const result = await checkServiceHealth(service, timeout);
      return { service, ...result };
    }),
  );

  const unhealthyServices = results.filter((r) => !r.healthy);

  if (unhealthyServices.length > 0) {
    const errorMessage = [
      '\n',
      '='.repeat(80),
      'E2E TEST ENVIRONMENT ERROR: Required services are not available',
      '='.repeat(80),
      '',
      'The following services are required for E2E tests but are not responding:',
      '',
      ...unhealthyServices.map(
        (s) =>
          `  - ${s.service.name} (${s.service.host}:${s.service.port})` +
          `\n    Error: ${s.error}`,
      ),
      '',
      'To run E2E tests, you must start the test environment first:',
      '',
      '  cd infrastructure/docker',
      '  docker-compose -f docker-compose.test.yml up -d',
      '',
      'Or run services locally with the correct ports configured.',
      '',
      'To skip E2E tests, run:',
      '  npm test -- --testPathIgnorePatterns=e2e',
      '',
      '='.repeat(80),
      '\n',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log successful verification
  console.log('\nAll required services are healthy:');
  results.forEach((r) => {
    console.log(`  ✓ ${r.service.name} (${r.service.host}:${r.service.port})`);
  });
  console.log('');
}

/**
 * Wait for a service to become healthy with retries
 */
export async function waitForService(
  service: ServiceConfig,
  maxRetries = 30,
  retryDelay = 1000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await checkServiceHealth(service, 5000);

    if (result.healthy) {
      return;
    }

    if (attempt === maxRetries) {
      throw new Error(
        `Service ${service.name} failed to become healthy after ${maxRetries} attempts. ` +
        `Last error: ${result.error}`,
      );
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }
}

/**
 * Wait for all services to become healthy
 */
export async function waitForAllServices(
  services: ServiceConfig[] = REQUIRED_SERVICES,
  maxRetries = 30,
  retryDelay = 1000,
): Promise<void> {
  await Promise.all(
    services.map((service) => waitForService(service, maxRetries, retryDelay)),
  );
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Clean test data from database (to be implemented per service)
 */
export async function cleanupTestData(userId?: string): Promise<void> {
  // This would ideally call cleanup endpoints on services
  // or directly clean the database
  // For now, we rely on unique emails to avoid conflicts
}

/**
 * Assert that response is successful (2xx status code)
 */
export function assertSuccessResponse(statusCode: number, message?: string): void {
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(
      message ||
      `Expected success status (2xx) but got ${statusCode}. ` +
      'Service may be unavailable or misconfigured.',
    );
  }
}

/**
 * Assert that response is not a service error (5xx or 502/503)
 */
export function assertNotServiceError(statusCode: number, body?: any): void {
  const serviceErrors = [500, 502, 503, 504];

  if (serviceErrors.includes(statusCode)) {
    const bodyStr = body ? JSON.stringify(body, null, 2) : 'No response body';
    throw new Error(
      `Service error detected: HTTP ${statusCode}\n` +
      'This indicates the downstream service is unavailable or failing.\n' +
      `Response: ${bodyStr.substring(0, 500)}`,
    );
  }
}
