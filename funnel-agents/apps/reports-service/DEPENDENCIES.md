# Reports Service Dependencies

## Required NPM Packages

Add these dependencies to the root `package.json`:

```json
{
  "dependencies": {
    "pdfkit": "^0.15.0",
    "@types/pdfkit": "^0.13.4",
    "exceljs": "^4.4.0",
    "cron-parser": "^4.9.0"
  }
}
```

## Installation

```bash
# From the funnel-agents root directory
npm install pdfkit @types/pdfkit exceljs cron-parser

# Or if using pnpm
pnpm add pdfkit @types/pdfkit exceljs cron-parser
```

## Dependency Details

### pdfkit (^0.15.0)
- **Purpose**: PDF document generation
- **Usage**: Generate formatted analytics reports as PDF files
- **Features Used**:
  - Document creation with custom page layouts
  - Text styling and formatting
  - Tables and charts
  - Headers and footers
  - Multi-page support

### exceljs (^4.4.0)
- **Purpose**: Excel spreadsheet generation
- **Usage**: Generate multi-sheet analytics reports with formatting
- **Features Used**:
  - Multiple worksheets
  - Cell styling and formatting
  - Conditional formatting
  - Auto-filtering
  - Data validation
  - Charts (future enhancement)

### cron-parser (^4.9.0)
- **Purpose**: Cron expression parsing for scheduled reports
- **Usage**: Calculate next execution times for scheduled reports
- **Features Used**:
  - Parse cron expressions
  - Calculate next execution time
  - Timezone support

## Optional Dependencies (Future Enhancements)

### Email Services
Choose one based on your email provider:

```bash
# SendGrid
npm install @sendgrid/mail

# AWS SES
npm install @aws-sdk/client-ses

# Nodemailer (generic SMTP)
npm install nodemailer
npm install @types/nodemailer --save-dev

# Postmark
npm install postmark
```

### Redis Cache (Production Replacement for In-Memory Cache)

```bash
npm install ioredis
npm install @types/ioredis --save-dev
```

Then update `CacheService` to use Redis instead of in-memory Map.

### Chart Generation (Server-Side)

```bash
# Chart.js with node-canvas
npm install chart.js canvas
npm install @types/chart.js --save-dev
```

## Development Dependencies

These are likely already in the root package.json:

```json
{
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3"
  }
}
```

## Database Migrations

The new entities require database tables. Run migrations or let TypeORM sync:

### New Tables Created:
1. `agent_feedback` - Agent feedback ratings
2. `scheduled_reports` - Scheduled report configurations
3. `report_templates` - Report template definitions
4. `leads` - Lead data for custom reports
5. `campaigns` - Campaign data for custom reports
6. `deals` - Deal data for custom reports

### Migration (if using migrations):

```bash
npm run typeorm:migration:generate -- -n AddReportsServiceTables
npm run typeorm:migration:run
```

### Auto-sync (development only):

Set in `app.module.ts`:
```typescript
synchronize: process.env.NODE_ENV !== 'production'
```

## Environment Variables

Add to `.env`:

```bash
# Email Service (choose one)
SENDGRID_API_KEY=your_sendgrid_key
# or
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key
# or
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Redis (optional, for production cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Verification

After installation, verify dependencies:

```bash
npm list pdfkit exceljs cron-parser
```

## Troubleshooting

### pdfkit Issues

If you encounter canvas/font issues:
```bash
# On Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# On macOS
brew install cairo pango libpng jpeg giflib librsvg
```

### exceljs Performance

For large datasets (>10,000 rows), consider streaming:
```typescript
const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
```

### Memory Issues

If generating large reports causes memory issues, adjust Node.js heap size:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```
