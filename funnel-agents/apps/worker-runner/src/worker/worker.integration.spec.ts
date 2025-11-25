import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkerModule } from './worker.module';
import { HealthModule } from '../health';
import * as request from 'supertest';

describe('WorkerModule Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        WorkerModule,
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });

    it('/health/queues (GET) should return queue health metrics', () => {
      return request(app.getHttpServer())
        .get('/health/queues')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('agents');
          expect(res.body).toHaveProperty('automations');
        });
    });

    it('/health/detailed (GET) should return detailed health status', () => {
      return request(app.getHttpServer())
        .get('/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('queues');
        });
    });
  });

  describe('Queue Configuration', () => {
    it('should have registered all required queues', async () => {
      // This would require accessing the queue registry
      // For now, we verify through health endpoints
      const response = await request(app.getHttpServer())
        .get('/health/queues')
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks.name).toBe('tasks');
      expect(response.body.agents).toBeDefined();
      expect(response.body.agents.name).toBe('agents');
      expect(response.body.automations).toBeDefined();
      expect(response.body.automations.name).toBe('automations');
    });
  });
});
