import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Features (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CSRF Protection', () => {
    it('should return CSRF token on GET /api/security/csrf-token', () => {
      return request(app.getHttpServer())
        .get('/api/security/csrf-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('csrfToken');
          expect(res.body).toHaveProperty('message');
          expect(typeof res.body.csrfToken).toBe('string');
          expect(res.body.csrfToken.length).toBeGreaterThan(0);
        });
    });

    it('should set CSRF cookie when requesting token', () => {
      return request(app.getHttpServer())
        .get('/api/security/csrf-token')
        .expect(200)
        .expect((res) => {
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          expect(cookies.some((cookie: string) => cookie.includes('_csrf'))).toBe(true);
        });
    });
  });

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    it('should include X-Frame-Options header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['x-frame-options']).toBeDefined();
        });
    });

    it('should include Content-Security-Policy header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['content-security-policy']).toBeDefined();
        });
    });
  });

  describe('CORS', () => {
    it('should allow requests from localhost origin', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    it('should include credentials in CORS response', () => {
      return request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect((res) => {
          expect(res.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    it('should allow CSRF headers in CORS', () => {
      return request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Headers', 'x-csrf-token')
        .expect((res) => {
          const allowedHeaders = res.headers['access-control-allow-headers'];
          expect(allowedHeaders).toBeDefined();
          expect(allowedHeaders.toLowerCase()).toContain('csrf');
        });
    });
  });
});
