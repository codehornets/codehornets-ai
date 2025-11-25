# API Gateway Quick Start Guide

Get the API Gateway up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- All microservices accessible (running or configured)

## Step 1: Environment Setup

Copy the example environment file:

```bash
cd apps/api-gateway
cp .env.example .env
```

Edit `.env` and configure your service URLs (defaults should work for local development):

```env
API_GATEWAY_PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:4200

# Service URLs (default: localhost with standard ports)
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
# ... etc
```

## Step 2: Install Dependencies

From the project root:

```bash
npm install
```

## Step 3: Start the Gateway

### Option A: Using npm script

```bash
npm run dev:api-gateway
```

### Option B: Using NX

```bash
npx nx serve api-gateway
```

### Option C: Using Make (if available)

```bash
make dev-api-gateway
```

## Step 4: Verify Gateway is Running

Open your browser or use curl:

```bash
# Check gateway health
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-25T...",
  "service": "api-gateway",
  "version": "1.0.0"
}
```

## Step 5: Check Services Health

```bash
curl http://localhost:3000/api/health/services
```

This shows which microservices are reachable.

## Step 6: Test Authentication

Try logging in (assuming auth-service is running):

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

## Step 7: Make Authenticated Request

Use the token from login:

```bash
export TOKEN="<your-jwt-token>"

curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN"
```

## Available Routes

### Public Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/health` - Gateway health
- `GET /api/health/services` - Services health

### Protected Routes (require auth token)
- `/api/workspaces/*` - Workspace management
- `/api/leads/*` - Lead management
- `/api/contacts/*` - Contact management
- `/api/deals/*` - Deal management
- `/api/campaigns/*` - Campaign management
- `/api/content/*` - Content management
- `/api/agents/*` - AI agents
- `/api/tasks/*` - Task management
- `/api/workflows/*` - Workflow automation
- `/api/analytics/*` - Analytics & reports

See [ROUTES.md](./ROUTES.md) for complete route documentation.

## Common Issues

### "Cannot connect to service"

**Problem:** Gateway can't reach a microservice

**Solution:**
1. Verify the service is running: `curl http://localhost:3001/health`
2. Check environment variables match service ports
3. Review logs for connection errors

### CORS Error in Browser

**Problem:** Browser blocks requests due to CORS

**Solution:**
1. Add your frontend URL to CORS_ORIGINS in .env
2. Restart the gateway
3. Make sure the URL includes protocol (http://)

### 401 Unauthorized

**Problem:** Request requires authentication

**Solution:**
1. Login first to get a token
2. Include token in Authorization header: `Bearer <token>`
3. Check token hasn't expired

### 503 Service Unavailable

**Problem:** Target microservice is down or slow

**Solution:**
1. Check service health: `GET /api/health/services`
2. Start the missing service
3. Check service logs for errors

## Development Tips

### Enable Debug Logging

Set environment variable:
```bash
export DEBUG=*
npm run dev:api-gateway
```

### Watch Mode

The gateway automatically reloads on file changes in dev mode.

### Testing with Postman

1. Import the routes from ROUTES.md
2. Set up environment variables for:
   - `baseUrl`: http://localhost:3000/api
   - `token`: Your JWT token
3. Use `{{token}}` in Authorization header

### Testing with VS Code REST Client

Create a `.http` file:

```http
### Health Check
GET http://localhost:3000/api/health

### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

### Get Leads (replace <TOKEN>)
GET http://localhost:3000/api/leads
Authorization: Bearer <TOKEN>
```

## Production Deployment

### Using Docker

```bash
# Build
docker build -t funnel-agents/api-gateway .

# Run
docker run -p 3000:3000 \
  --env-file .env \
  funnel-agents/api-gateway
```

### Using Docker Compose

```bash
docker-compose up api-gateway
```

### Environment Variables for Production

```env
NODE_ENV=production
API_GATEWAY_PORT=3000
CORS_ORIGINS=https://app.example.com,https://www.example.com

# Use service names instead of localhost in containerized environment
AUTH_SERVICE_HOST=auth-service
CRM_SERVICE_HOST=crm-service
# etc.
```

## Monitoring

### View Logs

```bash
# Docker
docker logs -f api-gateway

# PM2
pm2 logs api-gateway

# Local dev
# Logs appear in console
```

### Check Metrics

```bash
# Gateway health
curl http://localhost:3000/api/health

# All services health
curl http://localhost:3000/api/health/services | jq

# Filter for unhealthy services
curl http://localhost:3000/api/health/services | jq '.services[] | select(.status != "healthy")'
```

## Next Steps

1. Read [README.md](./README.md) for detailed documentation
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the design
3. Check [ROUTES.md](./ROUTES.md) for all available routes
4. Set up your microservices
5. Configure authentication
6. Build your frontend integration

## Getting Help

- Check logs for error messages
- Verify all services are running: `GET /api/health/services`
- Review environment variables
- Check firewall/network settings
- Consult the documentation files

## Useful Commands

```bash
# Start gateway
npm run dev:api-gateway

# Build for production
npm run build:api-gateway

# Run tests
npm run test:api-gateway

# Lint code
npm run lint:api-gateway

# Check TypeScript
npx tsc --noEmit -p apps/api-gateway/tsconfig.json
```

---

**You're all set!** The API Gateway is now routing requests to your microservices. 🚀
