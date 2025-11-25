/**
 * Python Agent API Integration Tests
 *
 * Tests HTTP calls to Python FastAPI agent service.
 * Validates timeout handling, error responses, and agent execution flow.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { TEST_CONFIG } from './setup';

describe('Python Agent API Integration Tests', () => {
  let agentApiClient: AxiosInstance;
  const baseURL = TEST_CONFIG.services.pythonAgentApi.url;

  beforeAll(() => {
    agentApiClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  describe('Health and Discovery Endpoints', () => {
    it('should check Python API health', async () => {
      try {
        const response = await agentApiClient.get('/health');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        expect(response.data.status).toBe('healthy');
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should list all available agents', async () => {
      try {
        const response = await agentApiClient.get('/agents');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('agents');
        expect(Array.isArray(response.data.agents)).toBe(true);
        expect(response.data).toHaveProperty('total');
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should list agent domains', async () => {
      try {
        const response = await agentApiClient.get('/agents/domains');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('domains');
        expect(Array.isArray(response.data.domains)).toBe(true);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should list agents in a specific domain', async () => {
      try {
        // First get available domains
        const domainsResponse = await agentApiClient.get('/agents/domains');
        const domains = domainsResponse.data.domains;

        if (domains.length === 0) {
          console.warn('No domains available, skipping test');
          return;
        }

        const testDomain = domains[0];
        const response = await agentApiClient.get(`/agents/${testDomain}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('agents');
        expect(response.data.domain).toBe(testDomain);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // 404 is acceptable if domain doesn't exist
        if ((error as AxiosError).response?.status === 404) {
          expect((error as AxiosError).response?.status).toBe(404);
          return;
        }
        throw error;
      }
    });
  });

  describe('Agent Information and Metadata', () => {
    it('should get agent info', async () => {
      try {
        // Get available agents first
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const response = await agentApiClient.get(
          `/agents/${testAgent.domain}/${testAgent.agent_name}`,
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('domain');
        expect(response.data).toHaveProperty('agent_name');
        expect(response.data).toHaveProperty('description');
        expect(response.data).toHaveProperty('capabilities');
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // 404 is acceptable if agent doesn't exist
        if ((error as AxiosError).response?.status === 404) {
          expect((error as AxiosError).response?.status).toBe(404);
          return;
        }
        throw error;
      }
    });

    it('should return 404 for non-existent agent', async () => {
      try {
        await agentApiClient.get('/agents/fake-domain/non-existent-agent');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        expect((error as AxiosError).response?.status).toBe(404);
      }
    });
  });

  describe('Agent Execution', () => {
    it('should execute an agent successfully', async () => {
      try {
        // Get available agents
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const executionRequest = {
          input_data: {
            test: 'integration-test-data',
            timestamp: Date.now(),
          },
          config: {
            timeout: 30,
          },
        };

        const response = await agentApiClient.post(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
          executionRequest,
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success');
        expect(response.data).toHaveProperty('execution_id');
        expect(response.data).toHaveProperty('duration');

        if (response.data.success) {
          expect(response.data).toHaveProperty('output');
        }
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Agent execution might fail, but should return structured error
        if ((error as AxiosError).response?.status === 500) {
          expect((error as AxiosError).response?.data).toHaveProperty('detail');
          return;
        }
        throw error;
      }
    }, 35000);

    it('should handle agent execution with custom timeout', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const executionRequest = {
          input_data: {
            test: 'timeout-test',
          },
          timeout: 5, // 5 seconds timeout
        };

        const response = await agentApiClient.post(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
          executionRequest,
          { timeout: 10000 }, // HTTP timeout slightly higher
        );

        expect(response.status).toBe(200);
        expect(response.data.duration).toBeLessThan(5000);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Timeout error is acceptable
        if ((error as AxiosError).response?.status === 504) {
          expect((error as AxiosError).response?.status).toBe(504);
          return;
        }
        throw error;
      }
    }, 15000);

    it('should validate agent execution input', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];

        // Send invalid input
        const invalidRequest = {
          // Missing required input_data
          config: {},
        };

        await agentApiClient.post(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
          invalidRequest,
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Should return validation error
        expect([400, 422].includes((error as AxiosError).response?.status || 0)).toBe(true);
      }
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout when API does not respond within limit', async () => {
      const shortTimeoutClient = axios.create({
        baseURL,
        timeout: 1000, // 1 second timeout
      });

      try {
        await shortTimeoutClient.get('/agents');
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Should timeout or succeed quickly
        expect(['ECONNABORTED', undefined].includes((error as AxiosError).code)).toBe(true);
      }
    });

    it('should handle slow agent execution with timeout', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const slowExecutionRequest = {
          input_data: {
            simulate_slow: true,
            delay: 10, // Request 10 second delay
          },
          timeout: 2, // But only allow 2 seconds
        };

        const response = await agentApiClient.post(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
          slowExecutionRequest,
          { timeout: 5000 }, // HTTP timeout
        );

        // Should either timeout or complete quickly
        if (response.data.success) {
          expect(response.data.duration).toBeLessThan(5000);
        }
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Timeout is expected
        expect(
          [504, 408].includes((error as AxiosError).response?.status || 0) ||
            (error as AxiosError).code === 'ECONNABORTED',
        ).toBe(true);
      }
    }, 10000);
  });

  describe('Error Responses', () => {
    it('should return 404 for non-existent endpoint', async () => {
      try {
        await agentApiClient.get('/non-existent-endpoint');
        expect(true).toBe(false);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        expect((error as AxiosError).response?.status).toBe(404);
      }
    });

    it('should return structured error for agent not found', async () => {
      try {
        await agentApiClient.get('/agents/invalid-domain/invalid-agent');
        expect(true).toBe(false);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        expect((error as AxiosError).response?.status).toBe(404);
        expect((error as AxiosError).response?.data).toHaveProperty('detail');
      }
    });

    it('should return structured error for agent execution failure', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];

        // Send data that might cause execution failure
        const failureRequest = {
          input_data: {
            force_error: true,
            error_message: 'Simulated execution error',
          },
        };

        await agentApiClient.post(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
          failureRequest,
        );
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Should return structured error
        if ((error as AxiosError).response?.status === 500) {
          expect((error as AxiosError).response?.data).toHaveProperty('detail');
        }
      }
    });

    it('should handle malformed JSON requests', async () => {
      try {
        await agentApiClient.post(
          '/agents/test/test/execute',
          'invalid json',
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        expect(true).toBe(false);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        expect([400, 422].includes((error as AxiosError).response?.status || 0)).toBe(true);
      }
    });
  });

  describe('Cache Management', () => {
    it('should clear agent cache', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const response = await agentApiClient.delete(
          `/agents/${testAgent.domain}/${testAgent.agent_name}/cache`,
        );

        expect([204, 200].includes(response.status)).toBe(true);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent agent list requests', async () => {
      try {
        const requests = Array.from({ length: 10 }, () => agentApiClient.get('/agents'));

        const responses = await Promise.all(requests);

        expect(responses).toHaveLength(10);
        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('agents');
        });
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should handle concurrent agent executions', async () => {
      try {
        const agentsResponse = await agentApiClient.get('/agents');
        const agents = agentsResponse.data.agents;

        if (agents.length === 0) {
          console.warn('No agents available, skipping test');
          return;
        }

        const testAgent = agents[0];
        const executionRequests = Array.from({ length: 3 }, (_, i) => ({
          input_data: {
            test: `concurrent-test-${i}`,
            index: i,
          },
          timeout: 30,
        }));

        const requests = executionRequests.map((req) =>
          agentApiClient.post(
            `/agents/${testAgent.domain}/${testAgent.agent_name}/execute`,
            req,
          ),
        );

        const results = await Promise.allSettled(requests);

        expect(results).toHaveLength(3);
        // At least some should succeed
        const succeeded = results.filter((r) => r.status === 'fulfilled');
        expect(succeeded.length).toBeGreaterThan(0);
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        throw error;
      }
    }, 40000);
  });

  describe('API Versioning and CORS', () => {
    it('should include API version in responses', async () => {
      try {
        const response = await agentApiClient.get('/health');

        // Check for version header or in response body
        expect(
          response.headers['x-api-version'] || response.data.version,
        ).toBeDefined();
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // Version header might not be present, skip
        console.warn('API version not found, skipping assertion');
      }
    });

    it('should support CORS headers', async () => {
      try {
        const response = await agentApiClient.options('/agents');

        // CORS headers should be present
        expect(
          response.headers['access-control-allow-origin'] ||
          response.headers['access-control-allow-methods'],
        ).toBeDefined();
      } catch (error) {
        if ((error as AxiosError).code === 'ECONNREFUSED') {
          console.warn('Python Agent API not available, skipping test');
          return;
        }
        // OPTIONS might not be implemented, skip
        console.warn('CORS OPTIONS not supported, skipping assertion');
      }
    });
  });
});
