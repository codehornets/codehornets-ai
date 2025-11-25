# Content Service

The Content Service manages content assets and file uploads for the FunnelAgents platform.

## Features

- Content management with status workflow
- File upload and storage
- Content filtering and pagination
- TypeORM with PostgreSQL integration

## Content Status Workflow

The service enforces the following status transitions:

```
brief → draft → review → approved → published
  ↓       ↓       ↓         ↓          ↓
archived (from any status)
```

## API Endpoints

### Content Endpoints

- `GET /content` - List all content with filtering and pagination
- `GET /content/:id` - Get content by ID
- `POST /content` - Create new content
- `PATCH /content/:id` - Update content
- `PATCH /content/:id/status` - Update content status (enforces workflow)
- `DELETE /content/:id` - Delete content

### File Upload Endpoints

- `POST /files/upload` - Upload a file (multipart/form-data)
- `GET /files/:filename` - Download/view a file

## Content Data Model

```typescript
interface Content {
  id: string;
  title: string;
  description?: string;
  body?: string; // HTML, markdown, etc.
  type: 'blog_post' | 'social_post' | 'email' | 'landing_page' | 'ad_creative' | 'video' | 'other';
  status: 'brief' | 'draft' | 'review' | 'approved' | 'published' | 'archived';
  channel?: 'blog' | 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'email' | 'google_ads' | 'other';
  workspace_id?: string;
  campaign_id?: string;
  author_id?: string;
  file_url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

## Query Parameters

### List Content (`GET /content`)

- `type` - Filter by content type
- `status` - Filter by status
- `channel` - Filter by channel
- `workspace_id` - Filter by workspace
- `campaign_id` - Filter by campaign
- `author_id` - Filter by author
- `sort_by` - Sort by field (created_at, updated_at, published_at)
- `sort_order` - Sort order (ASC, DESC)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Upload File (`POST /files/upload`)

Query parameters:
- `workspace_id` - Associate file with workspace
- `uploaded_by` - User ID who uploaded the file

## Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=funnel_agents_content

# Service Configuration
CONTENT_SERVICE_HOST=0.0.0.0
CONTENT_SERVICE_PORT=3004
CONTENT_SERVICE_BASE_URL=http://localhost:3004

# Environment
NODE_ENV=development
```

## Running the Service

```bash
# Development
npm run serve content-service

# Production build
npm run build content-service

# Start production
node dist/apps/content-service/main.js
```

## File Storage

Files are stored in the `storage/uploads` directory by default. In production, you should:

1. Use a cloud storage service (S3, GCS, Azure Blob)
2. Configure CDN for file delivery
3. Implement file size limits and validation
4. Add virus scanning for uploads

## Database Migrations

The service uses TypeORM with auto-sync enabled in development. For production:

1. Disable `synchronize: true` in app.module.ts
2. Use TypeORM migrations
3. Run migrations before deployment

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run
```

## Microservice Communication

The service can be accessed via:

1. HTTP REST API (when deployed with API Gateway)
2. TCP microservice messages (internal communication)

Supported message patterns:
- `{ cmd: 'create_content' }`
- `{ cmd: 'find_all_content' }`
- `{ cmd: 'find_one_content' }`
- `{ cmd: 'update_content' }`
- `{ cmd: 'update_content_status' }`
- `{ cmd: 'delete_content' }`

## Testing

```bash
# Unit tests
npm run test content-service

# E2E tests
npm run e2e content-service

# Test coverage
npm run test:coverage content-service
```

## Security Considerations

1. Validate file types and sizes on upload
2. Sanitize file names to prevent path traversal
3. Implement rate limiting for uploads
4. Add authentication/authorization middleware
5. Scan uploaded files for malware
6. Use signed URLs for file access in production
