import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  verifyAllServicesHealthy,
  generateTestEmail,
  assertSuccessResponse,
  assertNotServiceError,
} from './test-helpers';

/**
 * End-to-end tests for critical user flows
 * These tests verify complete workflows from user registration to execution
 */
describe('Critical Flows (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // CRITICAL: Verify all required services are running
    await verifyAllServicesHealthy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration → Login → Create Agent → Execute Task', () => {
    let authToken: string;
    let userId: string;
    let agentId: string;
    let taskId: string;

    const testUser = {
      email: generateTestEmail('flow-test'),
      password: 'Test123!@#',
      name: 'Flow Test User',
    };

    it('Step 1: Register new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'User registration must succeed');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);

      authToken = res.body.access_token;
      userId = res.body.user.id;

      expect(userId).toBeDefined();
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.length).toBeGreaterThan(0);
    });

    it('Step 2: Login with credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Login must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.email).toBe(testUser.email);

      // Update token from login
      authToken = res.body.access_token;
    });

    it('Step 3: Complete onboarding', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          onboarding_completed: true,
          company_name: 'Test Company',
          industry: 'Technology',
        });

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Onboarding must succeed');

      expect(res.status).toBe(200);
      expect(res.body.onboarding_completed).toBe(true);
      expect(res.body.company_name).toBe('Test Company');
    });

    it('Step 4: Create an agent', async () => {
      const agentData = {
        name: 'Test Lead Qualifier',
        description: 'Agent for qualifying leads',
        type: 'lead_qualifier',
        model: 'gpt-4',
      };

      const res = await request(app.getHttpServer())
        .post('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agentData);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Agent creation must succeed');

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', agentData.name);
      expect(res.body).toHaveProperty('type', agentData.type);

      agentId = res.body.id;
    });

    it('Step 5: Create a task', async () => {
      if (!agentId) {
        throw new Error('Agent ID not available - previous test failed');
      }

      const taskData = {
        title: 'Qualify Lead',
        description: 'Qualify incoming lead',
        type: 'lead_qualification',
        priority: 'high',
        assigned_agent_id: agentId,
        input_data: {
          lead: {
            name: 'John Doe',
            email: 'john@example.com',
            company: 'Acme Inc',
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Task creation must succeed');

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', taskData.title);

      taskId = res.body.id;
    });

    it('Step 6: Verify user can access their resources', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Profile access must succeed');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.onboarding_completed).toBe(true);
    });
  });

  describe('Lead Creation → Qualification → Conversion', () => {
    let authToken: string;
    let leadId: string;

    beforeAll(async () => {
      // Create test user
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('lead-flow'),
          password: 'Test123!@#',
          name: 'Lead Flow User',
        });

      assertNotServiceError(res.status, res.body);
      expect(res.body).toHaveProperty('access_token');

      authToken = res.body.access_token;
    });

    it('Step 1: Create a new lead', async () => {
      const leadData = {
        name: 'Jane Doe',
        email: generateTestEmail('test-lead'),
        phone: '+1-555-0100',
        company: 'Tech Corp',
        source: 'website',
      };

      const res = await request(app.getHttpServer())
        .post('/crm/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leadData);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Lead creation must succeed');

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', leadData.name);
      expect(res.body).toHaveProperty('email', leadData.email);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('new');

      leadId = res.body.id;
    });

    it('Step 2: Qualify the lead', async () => {
      if (!leadId) {
        throw new Error('Lead ID not available - previous test failed');
      }

      const res = await request(app.getHttpServer())
        .post(`/crm/leads/${leadId}/qualify`)
        .set('Authorization', `Bearer ${authToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Lead qualification must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', leadId);
      expect(res.body).toHaveProperty('score');
      expect(res.body).toHaveProperty('score_breakdown');
      expect(['qualified', 'contacted']).toContain(res.body.status);
    });

    it('Step 3: Convert the lead', async () => {
      if (!leadId) {
        throw new Error('Lead ID not available');
      }

      const res = await request(app.getHttpServer())
        .post(`/crm/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Lead conversion must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'won');
    });

    it('Step 4: Verify lead history', async () => {
      if (!leadId) {
        throw new Error('Lead ID not available');
      }

      const res = await request(app.getHttpServer())
        .get(`/crm/leads/${leadId}`)
        .set('Authorization', `Bearer ${authToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Lead retrieval must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', leadId);
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
      expect(res.body).toHaveProperty('status', 'won');
    });
  });

  describe('Workflow Creation → Execution → Results Verification', () => {
    let authToken: string;
    let workflowId: string;
    let runId: string;

    beforeAll(async () => {
      // Create test user
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('workflow-flow'),
          password: 'Test123!@#',
          name: 'Workflow Flow User',
        });

      assertNotServiceError(res.status, res.body);
      expect(res.body).toHaveProperty('access_token');

      authToken = res.body.access_token;
    });

    it('Step 1: Create a workflow', async () => {
      const workflowData = {
        name: 'Lead Nurturing Workflow',
        description: 'Automated lead nurturing sequence',
        trigger_type: 'manual',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            data: { label: 'Manual Trigger' },
          },
          {
            id: 'action-1',
            type: 'action',
            data: { label: 'Send Email' },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'trigger-1',
            target: 'action-1',
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/automations/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Workflow creation must succeed');

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', workflowData.name);
      expect(res.body).toHaveProperty('status', 'draft');

      workflowId = res.body.id;
    });

    it('Step 2: Activate the workflow', async () => {
      if (!workflowId) {
        throw new Error('Workflow ID not available - previous test failed');
      }

      const res = await request(app.getHttpServer())
        .patch(`/automations/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' });

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Workflow activation must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'active');
    });

    it('Step 3: Execute the workflow', async () => {
      if (!workflowId) {
        throw new Error('Workflow ID not available');
      }

      const res = await request(app.getHttpServer())
        .post(`/automations/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          trigger_data: {
            lead_id: 'lead-123',
            source: 'manual',
          },
        });

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Workflow execution must succeed');

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status');

      runId = res.body.id;
    });

    it('Step 4: Verify workflow run status', async () => {
      if (!workflowId || !runId) {
        throw new Error('Workflow or Run ID not available');
      }

      const res = await request(app.getHttpServer())
        .get(`/automations/workflows/${workflowId}/runs/${runId}`)
        .set('Authorization', `Bearer ${authToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Workflow run retrieval must succeed');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', runId);
      expect(res.body).toHaveProperty('status');
      expect(['pending', 'running', 'completed', 'failed']).toContain(res.body.status);
    });
  });
});
