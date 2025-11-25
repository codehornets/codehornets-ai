import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ContentStatus, ContentType } from '../src/content/entities/content.entity';

describe('Content Service (e2e)', () => {
  let app: INestApplication;
  let contentId: string;
  let versionId: string;
  let templateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/content (POST)', () => {
    it('should create new content', () => {
      return request(app.getHttpServer())
        .post('/content')
        .send({
          title: 'Test Blog Post',
          description: 'A test blog post',
          body: 'This is the body of the test blog post',
          type: ContentType.BLOG_POST,
          status: ContentStatus.DRAFT,
          workspace_id: 'workspace-1',
          author_id: 'user-1',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe('Test Blog Post');
          contentId = response.body.id;
        });
    });
  });

  describe('/content (GET)', () => {
    it('should return list of content', () => {
      return request(app.getHttpServer())
        .get('/content')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('should filter content by type', () => {
      return request(app.getHttpServer())
        .get('/content')
        .query({ type: ContentType.BLOG_POST })
        .expect(200)
        .then((response) => {
          expect(response.body.data).toBeDefined();
        });
    });
  });

  describe('/content/:id (GET)', () => {
    it('should return content by id', () => {
      return request(app.getHttpServer())
        .get(`/content/${contentId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(contentId);
          expect(response.body.title).toBe('Test Blog Post');
        });
    });

    it('should return 404 for non-existent content', () => {
      return request(app.getHttpServer())
        .get('/content/non-existent-id')
        .expect(404);
    });
  });

  describe('/content/:id (PATCH)', () => {
    it('should update content', () => {
      return request(app.getHttpServer())
        .patch(`/content/${contentId}`)
        .send({
          title: 'Updated Blog Post',
          body: 'This is the updated body',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe('Updated Blog Post');
        });
    });
  });

  describe('Content Versioning', () => {
    it('should create version history', () => {
      return request(app.getHttpServer())
        .get(`/content/${contentId}/versions`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          versionId = response.body[0].id;
        });
    });

    it('should rollback to previous version', () => {
      return request(app.getHttpServer())
        .post(`/content/${contentId}/versions/rollback`)
        .send({
          version_id: versionId,
          rollback_reason: 'Test rollback',
        })
        .expect(201);
    });
  });

  describe('Content Approvals', () => {
    it('should assign reviewers to content', () => {
      return request(app.getHttpServer())
        .post(`/content/${contentId}/assign-reviewers`)
        .send({
          reviewer_ids: ['user-2', 'user-3'],
          approval_step: 1,
        })
        .expect(201)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBe(2);
        });
    });

    it('should get content approvals', () => {
      return request(app.getHttpServer())
        .get(`/content/${contentId}/approvals`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('should check approval status', () => {
      return request(app.getHttpServer())
        .get(`/content/${contentId}/approval-status`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('all_approved');
          expect(response.body).toHaveProperty('pending_count');
        });
    });
  });

  describe('Templates', () => {
    it('should create a template', () => {
      return request(app.getHttpServer())
        .post('/templates')
        .send({
          name: 'Newsletter Template',
          content_type: ContentType.EMAIL,
          template_body: 'Hello {{name}}, here is your {{content_type}}!',
          variables: {
            name: { type: 'string', required: true },
            content_type: { type: 'string', required: true },
          },
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          templateId = response.body.id;
        });
    });

    it('should render template', () => {
      return request(app.getHttpServer())
        .post('/templates/render')
        .send({
          template_id: templateId,
          variable_values: {
            name: 'John',
            content_type: 'newsletter',
          },
        })
        .expect(201)
        .then((response) => {
          expect(response.body.rendered_content).toBe(
            'Hello John, here is your newsletter!',
          );
        });
    });

    it('should list templates', () => {
      return request(app.getHttpServer())
        .get('/templates')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('Analytics', () => {
    it('should track analytics event', () => {
      return request(app.getHttpServer())
        .post('/analytics/track')
        .send({
          content_id: contentId,
          event_type: 'view',
          count: 1,
        })
        .expect(201);
    });

    it('should get content metrics', () => {
      return request(app.getHttpServer())
        .get(`/analytics/content/${contentId}/metrics`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('views');
          expect(response.body).toHaveProperty('clicks');
          expect(response.body).toHaveProperty('engagement_rate');
        });
    });
  });

  describe('Publishing', () => {
    it('should schedule content publish', () => {
      return request(app.getHttpServer())
        .post('/content/publishes')
        .send({
          content_id: contentId,
          channel: 'blog',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.status).toBe('scheduled');
        });
    });

    it('should get content publishes', () => {
      return request(app.getHttpServer())
        .get(`/content/${contentId}/publishes`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('Content Status Workflow', () => {
    it('should update status through workflow', () => {
      return request(app.getHttpServer())
        .patch(`/content/${contentId}/status`)
        .send({
          status: ContentStatus.REVIEW,
        })
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBe(ContentStatus.REVIEW);
        });
    });

    it('should reject invalid status transition', () => {
      return request(app.getHttpServer())
        .patch(`/content/${contentId}/status`)
        .send({
          status: ContentStatus.PUBLISHED,
        })
        .expect(400);
    });
  });

  describe('/content/:id (DELETE)', () => {
    it('should delete content', () => {
      return request(app.getHttpServer())
        .delete(`/content/${contentId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });
  });
});
