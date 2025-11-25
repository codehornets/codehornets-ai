# Reports Service - Quick Start Guide

## Installation

```bash
# 1. Navigate to project root
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents

# 2. Install dependencies
npm install pdfkit @types/pdfkit exceljs

# 3. Verify cron-parser (should already be installed)
npm list cron-parser

# 4. Run database migrations (create tables)
npm run typeorm:migration:generate -- -n AddReportsServiceTables
npm run typeorm:migration:run

# Or enable auto-sync in development
# Set synchronize: true in app.module.ts TypeORM config
```

## First Run

```bash
# 1. Start the service
npm run serve reports-service

# 2. Seed default templates (optional)
curl -X POST http://localhost:3004/report-templates/seed

# 3. Test basic analytics
curl http://localhost:3004/analytics/tasks
```

## Quick Test

```bash
# Create a scheduled report
curl -X POST http://localhost:3004/scheduled-reports \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Report",
    "reportType": "task_analytics",
    "workspaceId": "test-workspace",
    "schedule": "0 9 * * 1",
    "recipients": ["test@example.com"],
    "format": "pdf"
  }'

# Generate and download PDF
curl "http://localhost:3004/analytics/export/pdf" --output test-report.pdf

# Submit feedback
curl -X POST http://localhost:3004/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent",
    "workspaceId": "test-workspace",
    "rating": 5,
    "comment": "Great job!"
  }'

# Generate custom report
curl -X POST http://localhost:3004/analytics/custom \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "tasks",
    "metrics": ["count", "success_rate"],
    "filters": {"workspace_id": "test-workspace"}
  }'
```

## What's Implemented

1. **PDF Export** - Professional reports with pdfkit
2. **Excel Export** - Multi-sheet workbooks with exceljs
3. **Scheduled Reports** - Cron-based automatic reports
4. **Feedback System** - 5-star agent ratings with trends
5. **Custom Reports** - Dynamic query builder for any entity
6. **Report Templates** - Pre-defined + custom templates
7. **Caching** - In-memory cache with 5-minute TTL

## What Needs Integration

1. **Email Service** - Edit `/src/analytics/services/email.service.ts`
   - Options: SendGrid, AWS SES, Nodemailer
   - Currently a stub implementation

2. **Redis Cache** (Production) - Edit `/src/analytics/services/cache.service.ts`
   - Replace Map with Redis client
   - Currently uses in-memory Map

3. **Authentication** - Add guards to controllers
   - JWT auth not yet implemented
   - All endpoints currently open

## File Structure

```
apps/reports-service/
├── src/
│   ├── analytics/
│   │   ├── controllers/          # 4 controllers
│   │   │   ├── scheduled-reports.controller.ts
│   │   │   ├── report-templates.controller.ts
│   │   │   ├── feedback.controller.ts
│   │   │   └── custom-reports.controller.ts
│   │   ├── entities/             # 8 entities
│   │   │   ├── task.entity.ts
│   │   │   ├── agent.entity.ts
│   │   │   ├── feedback.entity.ts
│   │   │   ├── scheduled-report.entity.ts
│   │   │   ├── report-template.entity.ts
│   │   │   ├── lead.entity.ts
│   │   │   ├── campaign.entity.ts
│   │   │   └── deal.entity.ts
│   │   ├── services/             # 7 services
│   │   │   ├── pdf-export.service.ts
│   │   │   ├── excel-export.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── report-scheduler.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── custom-report.service.ts
│   │   │   └── report-template.service.ts
│   │   ├── dto/                  # 4 DTO files
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   └── analytics.module.ts
│   ├── app.module.ts
│   └── main.ts
├── API_GUIDE.md                  # Complete API documentation
├── DEPENDENCIES.md               # Installation guide
├── IMPLEMENTATION_REPORT.md      # Technical details
└── QUICK_START.md                # This file
```

## Database Tables

6 new tables will be created:
- `agent_feedback` - Feedback ratings
- `scheduled_reports` - Report schedules
- `report_templates` - Template definitions
- `leads` - Lead data
- `campaigns` - Campaign data
- `deals` - Deal data

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/analytics/tasks` | GET | Task analytics |
| `/analytics/export/pdf` | GET | Export PDF |
| `/analytics/export/excel` | GET | Export Excel |
| `/analytics/custom` | POST | Custom report |
| `/scheduled-reports` | POST | Create schedule |
| `/report-templates` | GET | List templates |
| `/feedback` | POST | Submit feedback |
| `/analytics/cache/clear` | GET | Clear cache |

## Environment Variables

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/funnelagents

# Email (optional, for scheduled reports)
SENDGRID_API_KEY=xxx
# or
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@email.com
SMTP_PASS=password

# Redis (optional, for production cache)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Common Issues

**Issue: pdfkit install fails**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev

# macOS
brew install cairo pango
```

**Issue: Scheduled reports not sending**
- Check cron expression is valid
- Verify email service is configured
- Check `scheduled_reports.last_error` column

**Issue: Out of memory on large exports**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Next Steps

1. **Install dependencies** (see above)
2. **Run migrations** to create tables
3. **Seed templates** for quick start
4. **Configure email** service for scheduled reports
5. **Add authentication** guards to protect endpoints
6. **Write tests** for all services
7. **Deploy** to staging environment

## Documentation

- **API_GUIDE.md** - Complete API reference with examples
- **IMPLEMENTATION_REPORT.md** - Technical implementation details
- **DEPENDENCIES.md** - Dependency installation guide

## Support

Questions? Check:
1. API_GUIDE.md for endpoint documentation
2. IMPLEMENTATION_REPORT.md for technical details
3. src/analytics/ for code examples

---

**Status**: READY FOR TESTING
**Last Updated**: 2025-11-25
