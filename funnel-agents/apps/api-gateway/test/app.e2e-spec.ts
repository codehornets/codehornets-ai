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

describe('API Gateway (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // CRITICAL: Verify all required services are running
    // This will throw a detailed error if any service is unavailable
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

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(typeof res.body.timestamp).toBe('string');
        });
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: generateTestEmail('auth-flow'),
      password: 'Test123!@#',
      name: 'Test User',
    };

    describe('POST /auth/register', () => {
      it('should register a new user successfully', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        // Assert no service errors
        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Registration should succeed');

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', testUser.email);
        expect(res.body.user).toHaveProperty('name', testUser.name);
        expect(res.body.user).not.toHaveProperty('password');
        expect(typeof res.body.access_token).toBe('string');
        expect(res.body.access_token.length).toBeGreaterThan(0);

        // Store for later tests
        authToken = res.body.access_token;
        userId = res.body.user.id;

        expect(userId).toBeDefined();
        expect(typeof userId).toBe('string');
      });

      it('should fail with duplicate email', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        // Should be business logic error (4xx), not service error (5xx)
        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('message');
      });

      it('should validate required fields', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'invalid-email',
            // Missing password and name
          });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
      });

      it('should validate email format', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'not-an-email',
            password: 'Test123!@#',
            name: 'Test',
          });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(400);
      });

      it('should validate password strength', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: generateTestEmail('weak-pass'),
            password: '123',
            name: 'Test',
          });

        assertNotServiceError(res.status, res.body);
        expect([400, 422]).toContain(res.status);
      });
    });

    describe('POST /auth/login', () => {
      it('should login successfully with correct credentials', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          });

        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Login should succeed');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', testUser.email);
        expect(typeof res.body.access_token).toBe('string');
        expect(res.body.access_token.length).toBeGreaterThan(0);
      });

      it('should fail with invalid credentials', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message');
      });

      it('should fail with non-existent email', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Test123!@#',
          });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });

      it('should fail with missing credentials', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({});

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(400);
      });
    });

    describe('GET /auth/profile', () => {
      it('should return user profile with valid token', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`);

        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Should get profile');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email', testUser.email);
        expect(res.body).toHaveProperty('name', testUser.name);
        expect(res.body).toHaveProperty('id', userId);
        expect(res.body).not.toHaveProperty('password');
      });

      it('should fail without token', async () => {
        const res = await request(app.getHttpServer()).get('/auth/profile');

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });

      it('should fail with invalid token', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token');

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });

      it('should fail with malformed authorization header', async () => {
        const res = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'invalid-format');

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });
    });

    describe('PATCH /auth/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          company_name: 'Test Corp',
        };

        const res = await request(app.getHttpServer())
          .patch('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Profile update should succeed');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', updateData.name);
        expect(res.body).toHaveProperty('company_name', updateData.company_name);
      });

      it('should fail without authentication', async () => {
        const res = await request(app.getHttpServer())
          .patch('/auth/profile')
          .send({ name: 'Hacker' });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('CRM Service Integration', () => {
    let testAuthToken: string;
    let leadId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('crm'),
          password: 'Test123!@#',
          name: 'CRM Test User',
        });

      testAuthToken = res.body.access_token;
    });

    describe('GET /crm/leads', () => {
      it('should require authentication', async () => {
        const res = await request(app.getHttpServer()).get('/crm/leads');

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });

      it('should return leads list with valid token', async () => {
        const res = await request(app.getHttpServer())
          .get('/crm/leads')
          .set('Authorization', `Bearer ${testAuthToken}`);

        // Must not accept service errors as valid responses
        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'CRM service must be available');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });

    describe('POST /crm/leads', () => {
      it('should create a new lead', async () => {
        const leadData = {
          name: 'Test Lead',
          email: generateTestEmail('lead'),
          phone: '+1-555-0100',
          company: 'Test Company',
          source: 'website',
        };

        const res = await request(app.getHttpServer())
          .post('/crm/leads')
          .set('Authorization', `Bearer ${testAuthToken}`)
          .send(leadData);

        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Lead creation should succeed');

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name', leadData.name);
        expect(res.body).toHaveProperty('email', leadData.email);
        expect(res.body).toHaveProperty('status');

        leadId = res.body.id;
      });

      it('should require authentication', async () => {
        const res = await request(app.getHttpServer())
          .post('/crm/leads')
          .send({ name: 'Test' });

        assertNotServiceError(res.status, res.body);
        expect(res.status).toBe(401);
      });
    });

    describe('GET /crm/leads/:id', () => {
      it('should get lead by id', async () => {
        if (!leadId) {
          throw new Error('Lead ID not available from previous test');
        }

        const res = await request(app.getHttpServer())
          .get(`/crm/leads/${leadId}`)
          .set('Authorization', `Bearer ${testAuthToken}`);

        assertNotServiceError(res.status, res.body);
        assertSuccessResponse(res.status, 'Should retrieve lead');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', leadId);
      });
    });
  });

  describe('Campaigns Service Integration', () => {
    let testAuthToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('campaigns'),
          password: 'Test123!@#',
          name: 'Campaigns Test User',
        });

      testAuthToken = res.body.access_token;
    });

    it('should require authentication', async () => {
      const res = await request(app.getHttpServer()).get('/campaigns');

      assertNotServiceError(res.status, res.body);
      expect(res.status).toBe(401);
    });

    it('should access campaigns with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/campaigns')
        .set('Authorization', `Bearer ${testAuthToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Campaigns service must be available');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Agents Service Integration', () => {
    let testAuthToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('agents'),
          password: 'Test123!@#',
          name: 'Agents Test User',
        });

      testAuthToken = res.body.access_token;
    });

    it('should require authentication', async () => {
      const res = await request(app.getHttpServer()).get('/agents');

      assertNotServiceError(res.status, res.body);
      expect(res.status).toBe(401);
    });

    it('should access agents with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${testAuthToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Agents service must be available');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Workflows Service Integration', () => {
    let testAuthToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: generateTestEmail('workflows'),
          password: 'Test123!@#',
          name: 'Workflows Test User',
        });

      testAuthToken = res.body.access_token;
    });

    it('should require authentication', async () => {
      const res = await request(app.getHttpServer()).get('/automations/workflows');

      assertNotServiceError(res.status, res.body);
      expect(res.status).toBe(401);
    });

    it('should access workflows with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/automations/workflows')
        .set('Authorization', `Bearer ${testAuthToken}`);

      assertNotServiceError(res.status, res.body);
      assertSuccessResponse(res.status, 'Automations service must be available');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app.getHttpServer()).get('/non-existent-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('should validate request body on registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
        });

      assertNotServiceError(res.status, res.body);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle malformed JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(res.status);
    });
  });
});
