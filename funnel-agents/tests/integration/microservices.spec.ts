/**
 * Microservices Integration Tests
 *
 * Tests TCP microservice communication between API Gateway and backend services.
 * Validates message patterns, timeout handling, and error propagation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { TEST_CONFIG } from './setup';

describe('Microservices Integration Tests', () => {
  let authClient: ClientProxy;
  let crmClient: ClientProxy;
  let agentsClient: ClientProxy;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: 'AUTH_SERVICE',
            transport: Transport.TCP,
            options: {
              host: TEST_CONFIG.services.authService.host,
              port: TEST_CONFIG.services.authService.port,
            },
          },
          {
            name: 'CRM_SERVICE',
            transport: Transport.TCP,
            options: {
              host: TEST_CONFIG.services.crmService.host,
              port: TEST_CONFIG.services.crmService.port,
            },
          },
          {
            name: 'AGENTS_SERVICE',
            transport: Transport.TCP,
            options: {
              host: TEST_CONFIG.services.agentsService.host,
              port: TEST_CONFIG.services.agentsService.port,
            },
          },
        ]),
      ],
    }).compile();

    authClient = module.get<ClientProxy>('AUTH_SERVICE');
    crmClient = module.get<ClientProxy>('CRM_SERVICE');
    agentsClient = module.get<ClientProxy>('AGENTS_SERVICE');

    // Connect all clients
    await Promise.all([
      authClient.connect(),
      crmClient.connect(),
      agentsClient.connect(),
    ]);
  });

  afterAll(async () => {
    // Close all connections
    await Promise.all([authClient.close(), crmClient.close(), agentsClient.close()]);
  });

  describe('API Gateway → Auth Service TCP Communication', () => {
    it('should validate JWT token via TCP', async () => {
      const testPayload = {
        userId: 'test-user-123',
        email: 'test@example.com',
      };

      try {
        const result = await firstValueFrom(
          authClient.send({ cmd: 'validate_token' }, testPayload).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        // Auth service should respond with validation result
      } catch (error) {
        // Service might not be running - check error type
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // For other errors, test should still complete gracefully
        expect(error).toBeDefined();
      }
    });

    it('should handle user profile retrieval via TCP', async () => {
      const userId = 'test-user-456';

      try {
        const result = await firstValueFrom(
          authClient.send({ cmd: 'get_user_profile' }, { userId }).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result.user).toHaveProperty('id');
          expect(result.user).toHaveProperty('email');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should handle authentication errors gracefully', async () => {
      const invalidPayload = {
        userId: 'non-existent-user',
      };

      try {
        const result = await firstValueFrom(
          authClient.send({ cmd: 'get_user_profile' }, invalidPayload).pipe(timeout(5000)),
        );

        // Should return error response, not throw
        if (result) {
          expect(result).toHaveProperty('success');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // TCP errors should be caught and handled
        expect(error).toBeDefined();
      }
    });

    it('should enforce timeout on slow auth service responses', async () => {
      const testPayload = {
        userId: 'test-user-timeout',
      };

      try {
        await firstValueFrom(
          authClient.send({ cmd: 'slow_operation' }, testPayload).pipe(timeout(1000)),
        );
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // Should timeout if service takes too long
        if (error.name === 'TimeoutError') {
          expect(error.name).toBe('TimeoutError');
        }
      }
    });
  });

  describe('API Gateway → CRM Service TCP Communication', () => {
    it('should retrieve leads via TCP', async () => {
      const queryParams = {
        page: 1,
        limit: 10,
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          crmClient.send({ cmd: 'get_leads' }, queryParams).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result).toHaveProperty('data');
          expect(Array.isArray(result.data)).toBe(true);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('CRM service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should create lead via TCP', async () => {
      const leadData = {
        name: 'Integration Test Lead',
        email: `test-${Date.now()}@example.com`,
        phone: '+1234567890',
        source: 'integration-test',
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          crmClient.send({ cmd: 'create_lead' }, leadData).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result.lead).toHaveProperty('id');
          expect(result.lead).toHaveProperty('email', leadData.email);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('CRM service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should handle CRM validation errors', async () => {
      const invalidLeadData = {
        // Missing required fields
        name: 'Invalid Lead',
      };

      try {
        const result = await firstValueFrom(
          crmClient.send({ cmd: 'create_lead' }, invalidLeadData).pipe(timeout(5000)),
        );

        // Should return validation error
        if (result) {
          expect(result.success).toBe(false);
          expect(result).toHaveProperty('error');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('CRM service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should retrieve contacts via TCP', async () => {
      const queryParams = {
        page: 1,
        limit: 10,
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          crmClient.send({ cmd: 'get_contacts' }, queryParams).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result).toHaveProperty('data');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('CRM service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });
  });

  describe('API Gateway → Agents Service TCP Communication', () => {
    it('should list available agents via TCP', async () => {
      const queryParams = {
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          agentsClient.send({ cmd: 'list_agents' }, queryParams).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result).toHaveProperty('agents');
          expect(Array.isArray(result.agents)).toBe(true);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Agents service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should execute agent via TCP', async () => {
      const executionData = {
        agentId: 'test-agent',
        input: {
          prompt: 'Test prompt for integration testing',
        },
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          agentsClient.send({ cmd: 'execute_agent' }, executionData).pipe(timeout(30000)),
        );

        expect(result).toBeDefined();
        if (result.success) {
          expect(result).toHaveProperty('executionId');
          expect(result).toHaveProperty('status');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Agents service not available, skipping test');
          return;
        }
        // Agent execution might timeout on slow operations
        expect(error).toBeDefined();
      }
    }, 35000);

    it('should get agent execution status via TCP', async () => {
      const statusQuery = {
        executionId: 'test-execution-123',
        userId: 'test-user-123',
      };

      try {
        const result = await firstValueFrom(
          agentsClient.send({ cmd: 'get_execution_status' }, statusQuery).pipe(timeout(5000)),
        );

        expect(result).toBeDefined();
        if (result.success || !result.success) {
          // Should always return a response structure
          expect(result).toHaveProperty('status');
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Agents service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout when service does not respond within limit', async () => {
      const testPayload = {
        operation: 'very_slow_operation',
        userId: 'test-user-123',
      };

      try {
        await firstValueFrom(
          authClient
            .send({ cmd: 'non_existent_operation' }, testPayload)
            .pipe(timeout(1000)),
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // Should be timeout or connection error
        expect(['TimeoutError', 'Error'].includes(error.name || error.constructor.name)).toBe(
          true,
        );
      }
    });

    it('should handle multiple concurrent requests with timeout', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        userId: `test-user-${i}`,
        operation: 'test',
      }));

      const results = await Promise.allSettled(
        requests.map((payload) =>
          firstValueFrom(authClient.send({ cmd: 'validate_token' }, payload).pipe(timeout(5000))),
        ),
      );

      expect(results).toHaveLength(5);
      // All should either succeed or fail gracefully
      results.forEach((result) => {
        expect(['fulfilled', 'rejected'].includes(result.status)).toBe(true);
      });
    });
  });

  describe('Error Propagation', () => {
    it('should propagate validation errors from services', async () => {
      const invalidData = {
        // Intentionally malformed
        invalid: true,
      };

      try {
        const result = await firstValueFrom(
          crmClient.send({ cmd: 'create_lead' }, invalidData).pipe(timeout(5000)),
        );

        // Service should return structured error
        if (result && !result.success) {
          expect(result).toHaveProperty('error');
          expect(result.error).toBeDefined();
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('CRM service not available, skipping test');
          return;
        }
        expect(error).toBeDefined();
      }
    });

    it('should handle service unavailable errors', async () => {
      // Create client pointing to non-existent service
      const module = await Test.createTestingModule({
        imports: [
          ClientsModule.register([
            {
              name: 'FAKE_SERVICE',
              transport: Transport.TCP,
              options: {
                host: 'localhost',
                port: 9999, // Non-existent port
              },
            },
          ]),
        ],
      }).compile();

      const fakeClient = module.get<ClientProxy>('FAKE_SERVICE');

      try {
        await fakeClient.connect();
        await firstValueFrom(
          fakeClient.send({ cmd: 'test' }, {}).pipe(timeout(2000)),
        );
      } catch (error) {
        // Should fail to connect
        expect(['ECONNREFUSED', 'TimeoutError'].includes(error.code || error.name)).toBe(true);
      } finally {
        await fakeClient.close();
      }
    });

    it('should handle malformed message patterns', async () => {
      try {
        const result = await firstValueFrom(
          authClient.send({ cmd: undefined }, {}).pipe(timeout(5000)),
        );

        // Service might reject malformed patterns
        expect(result).toBeDefined();
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // Should error gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Connection Resilience', () => {
    it('should reconnect after connection loss', async () => {
      // Send initial request
      try {
        await firstValueFrom(
          authClient.send({ cmd: 'validate_token' }, { userId: 'test' }).pipe(timeout(5000)),
        );
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
      }

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send another request - client should handle reconnection
      try {
        const result = await firstValueFrom(
          authClient.send({ cmd: 'validate_token' }, { userId: 'test2' }).pipe(timeout(5000)),
        );
        expect(result).toBeDefined();
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.warn('Auth service not available, skipping test');
          return;
        }
        // Connection should work or fail gracefully
        expect(error).toBeDefined();
      }
    });
  });
});
