# Deployment Readiness Assessment
**Date**: 2025-11-25
**Project**: FunnelAgents - AI-powered Multi-Agent Orchestration Platform
**Stack**: NestJS (Node 20) + TypeScript + PostgreSQL + Redis + n8n + React (Vite)

---

## Executive Summary

**Overall Readiness**: 60% - MODERATE GAPS IDENTIFIED
**Production Deployment**: NOT RECOMMENDED without addressing critical issues
**Development Environment**: FUNCTIONAL with configuration issues

### Critical Blockers (Must Fix)
1. Production build fails due to TypeScript configuration errors
2. Missing health check endpoints in most services
3. Weak secrets management (default values in .env.example)
4. Missing production-specific docker-compose configuration
5. No deployment automation workflow

### Major Gaps (Should Fix)
6. Missing centralized logging infrastructure
7. No monitoring/observability setup (APM, metrics)
8. Incomplete service health checks
9. Missing backup/restore procedures
10. No load balancer configuration

---

## 1. Docker Configuration Analysis

### Status: GOOD with gaps

#### docker-compose.yml (/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker/docker-compose.yml)
**Strengths:**
- Comprehensive service definitions (11 NestJS services + infrastructure)
- All services containerized: api-gateway, auth-service, crm-service, campaigns-service, content-service, agents-service, tasks-service, automations-service, reports-service, worker-runner, scheduler
- Infrastructure services: PostgreSQL 16, Redis 7, n8n 1.68.0, Mailhog
- Health checks defined for PostgreSQL and Redis
- Service dependencies properly configured with `depends_on` conditions
- Network isolation with `funnel-agents-network` bridge network
- Volume persistence for data (postgres-data, redis-data, n8n-data)
- n8n worker architecture (5 specialized workers for different agents)
- Resource limits defined for n8n services (CPU: 0.5-2 cores, Memory: 512MB-2GB)
- Development tools available via profiles (pgAdmin, Redis Commander)

**Critical Gaps:**
- **No health checks for NestJS services** (only postgres/redis have health checks)
- Missing production-specific configuration file (no docker-compose.prod.yml)
- No health checks in Dockerfile (generic check exists but not service-specific)
- Services expose all ports to host (security concern for production)
- No reverse proxy/load balancer (nginx/traefik) configured
- Missing rate limiting configuration
- No container security scanning in pipeline

**Port Mapping:**
```
3000  - API Gateway (main entry)
3001  - Auth Service
3002  - CRM Service
3003  - Campaigns Service
3004  - Content Service
3005  - Agents Service
3006  - Tasks Service
3007  - Automations Service
3008  - Reports Service
3009  - Worker Runner
3010  - Scheduler
4200  - Web UI
5432  - PostgreSQL
5678  - n8n
6379  - Redis (mapped to 6380 on host)
8025  - Mailhog UI
```

#### Dockerfile (/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker/Dockerfile)
**Strengths:**
- Multi-stage build (deps -> builder -> runner) for optimized images
- Production-ready base (Node 20 Alpine)
- Non-root user (nestjs:nodejs 1001:1001)
- Security best practices: minimal base image, non-root execution
- Build dependencies only in build stage
- npm cache cleaned after install
- Generic health check defined (HTTP GET /health)

**Gaps:**
- Health check uses generic PORT variable, may not work for all services
- No EXPOSE directive (missing port documentation)
- Missing web-ui Dockerfile (Dockerfile.web not found)
- No multi-architecture builds (amd64/arm64)
- Build args not fully utilized (NODE_VERSION hardcoded)

---

## 2. Environment Configuration

### Status: POOR - Major security concerns

#### Root .env.example (/home/anga/workspace/beta/codehornets-ai/funnel-agents/.env.example)
**Variables Defined:**
- Database: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, DATABASE_URL
- Redis: REDIS_HOST, REDIS_PORT
- JWT: JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION
- Services: All 11 services have HOST/PORT configs
- n8n: N8N_DB_DATABASE, N8N_ENCRYPTION_KEY, N8N_BASIC_AUTH_*
- Email: MAIL_MAILER, MAIL_HOST, MAIL_PORT, etc.

**Critical Security Issues:**
1. **Weak default secrets:**
   - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   - POSTGRES_PASSWORD=secret
   - N8N_ENCRYPTION_KEY=change-this-to-a-secure-random-key
   - N8N_BASIC_AUTH_PASSWORD=changeme

2. **No secrets management:**
   - No integration with HashiCorp Vault, AWS Secrets Manager, or similar
   - No .env.production.example template
   - Secrets stored in plain text in repository (.env.example)
   - No secret rotation mechanism

3. **Missing production variables:**
   - No SENTRY_DSN or error tracking
   - No LOG_LEVEL configuration
   - No NODE_OPTIONS for heap size limits
   - No production database connection pooling config

4. **Inconsistent configuration:**
   - Root .env.example differs from infrastructure/docker/.env.example
   - Auth service has separate .env.example with overlapping configs
   - No validation that required env vars are set

**Recommendation:**
- Create .env.production.template with strong defaults
- Implement dotenv-vault or similar for secret management
- Add env validation on app startup (using Joi or class-validator)
- Document secret rotation procedures

---

## 3. CI/CD Pipeline Analysis

### Status: PARTIAL - Tests configured, deployment missing

#### GitHub Actions (/home/anga/workspace/beta/codehornets-ai/funnel-agents/.github/workflows/tests.yml)
**What Exists:**
- Test pipeline configured
  - Unit tests (Node 18.x, 20.x matrix)
  - Integration tests (PostgreSQL + Redis services)
  - E2E tests
  - Linting and formatting checks
  - Coverage reporting (Codecov integration)
- Runs on push to main/develop and PRs
- Proper service setup (postgres:15, redis:7-alpine)
- Environment variables configured for tests

**Critical Gaps - Deployment Automation:**
1. **No Docker build/push workflow**
   - Missing docker-build.yml workflow
   - No GitHub Container Registry (ghcr.io) push
   - No image tagging strategy (latest, semver, SHA)

2. **No deployment workflow**
   - Missing deploy.yml workflow for staging/production
   - No integration with cloud providers (AWS ECS, GCP Cloud Run, Azure Container Apps)
   - No Kubernetes deployment automation
   - No rollback mechanism

3. **No environment-specific pipelines**
   - Missing staging deployment
   - No production deployment approval gates
   - No smoke tests after deployment

4. **Security gaps:**
   - No container vulnerability scanning (Trivy, Snyk)
   - No SAST/DAST security scans
   - No dependency audit in pipeline

**Quick Wins:**
```yaml
# Needed workflows:
.github/workflows/docker-build.yml  # Build and push images
.github/workflows/deploy-staging.yml # Deploy to staging
.github/workflows/deploy-prod.yml   # Deploy to production with approval
.github/workflows/security-scan.yml # Security scanning
```

---

## 4. Production Build Status

### Status: FAILING - TypeScript configuration errors

#### Build Test Results:
```bash
npm run build:prod
# ERROR: Failed to process project graph
# Multiple TypeScript errors in libs/infrastructure
```

**Root Cause:**
- TypeScript compiler error: Files not under 'rootDir'
- Affected: libs/infrastructure/src/lib/messaging/* files
- Issue: messaging module files imported by apps/scheduler but outside rootDir

**Failed Services (7 of 12):**
1. auth-service:build - FAILED
2. web-ui:build - FAILED
3. reports-service:build - FAILED
4. campaigns-service:build - FAILED
5. agents-service:build - FAILED
6. worker-runner:build - FAILED
7. scheduler:build - FAILED

**Impact:**
- Cannot create production Docker images
- Cannot deploy to any environment
- Development mode works, but not production-optimized builds

**Fix Required:**
1. Update tsconfig.json for affected services
2. Restructure libs/infrastructure/messaging module
3. Consider moving shared code to proper Nx library structure
4. Run `npx nx reset && npm run build` to verify

---

## 5. Service Discovery & Communication

### Status: GOOD - Environment-based configuration

**Inter-Service Communication:**
- **Transport**: NestJS TCP microservices (not HTTP)
- **Ports**: HTTP port + 10 = TCP port (e.g., 3001 HTTP -> 3011 TCP)
- **Discovery**: Environment variables (AUTH_SERVICE_HOST, CRM_SERVICE_HOST)
- **Pattern**: ClientProxy with Transport.TCP

**Configuration Example** (from api-gateway/src/app.module.ts):
```typescript
{
  name: 'AUTH_SERVICE',
  transport: Transport.TCP,
  options: {
    host: process.env.AUTH_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.AUTH_SERVICE_TCP_PORT || '', 10) || 3011,
  }
}
```

**Strengths:**
- Services can communicate internally via Docker network
- Hostnames resolve via Docker DNS (e.g., 'auth-service')
- Fallback to localhost for development
- Configuration externalized

**Gaps:**
- No service mesh (Istio, Linkerd) for advanced routing
- No circuit breakers or retry logic visible
- No distributed tracing configured (Jaeger, Zipkin)
- Missing service registry (Consul, etcd) for dynamic discovery
- No API Gateway for external traffic routing (using basic API Gateway service)

**Recommendation:**
- For production: Add nginx/traefik as reverse proxy
- Implement circuit breakers using @nestjs/resilience or opossum
- Add distributed tracing with OpenTelemetry

---

## 6. Monitoring & Logging

### Status: MINIMAL - Basic logging only

#### Logging Implementation:
**What Exists:**
- NestJS built-in Logger used throughout (495 occurrences across 83 files)
- LoggingInterceptor in API Gateway (logs requests/responses)
- Service-specific loggers initialized in main.ts files
- Example: `const logger = new Logger('AuthService');`

**Critical Gaps:**
1. **No centralized logging:**
   - No ELK stack (Elasticsearch, Logstash, Kibana)
   - No Loki + Grafana
   - No CloudWatch Logs integration
   - Logs stay in containers (lost on restart)

2. **No structured logging:**
   - Using console.log in many places (should use Logger)
   - No JSON-formatted logs for parsing
   - Missing correlation IDs for request tracing
   - No log levels enforcement (DEBUG, INFO, WARN, ERROR)

3. **No monitoring/observability:**
   - No Prometheus metrics endpoints
   - No Grafana dashboards
   - No APM (Application Performance Monitoring) like New Relic, Datadog
   - Missing Kubernetes annotations for Prometheus scraping (exists but no Prometheus deployed)

4. **No alerting:**
   - No PagerDuty, Opsgenie integration
   - No error rate alerts
   - No performance degradation alerts

#### Health Endpoints:
**Implemented:**
- API Gateway: GET /health, GET /health/services
- Worker Runner: Health module exists

**Missing:**
- Health endpoints for 9 other services (auth, crm, campaigns, content, agents, tasks, automations, reports, scheduler)
- Database connection health checks
- Redis connection health checks
- Disk space, memory, CPU metrics

**Kubernetes Health Checks:**
Defined in deployment.yaml but services don't implement them:
```yaml
livenessProbe:
  httpGet:
    path: /health  # MOST SERVICES DON'T HAVE THIS ENDPOINT
    port: http
readinessProbe:
  httpGet:
    path: /health  # WILL FAIL FOR MOST SERVICES
```

**Immediate Action Required:**
1. Add /health endpoint to all 11 services
2. Implement health checks for DB/Redis connections
3. Set up centralized logging (recommend: Loki + Promtail + Grafana)
4. Add Prometheus metrics exporter to each service
5. Create Grafana dashboards for key metrics

---

## 7. Security Assessment

### Status: MODERATE RISK

#### Strengths:
1. **Auth Service Security:**
   - Helmet middleware configured (CSP headers)
   - CORS properly configured
   - JWT-based authentication
   - Global validation pipes (whitelist: true, forbidNonWhitelisted: true)
   - Non-root container user (nestjs:nodejs)

2. **Network Isolation:**
   - Services in isolated Docker network
   - Not all ports need external exposure

#### Critical Vulnerabilities:

**1. Exposed Secrets:**
- Default JWT secret in .env.example committed to repo
- Database passwords visible in plain text
- n8n encryption key example is weak
- No secret scanning in CI/CD

**2. Exposed Ports:**
All service ports exposed to host in docker-compose.yml:
```yaml
ports:
  - "3001:3001"  # Should only be internal
  - "3002:3002"  # Only API Gateway needs external access
  ...
```
**Impact:** Direct service access bypasses API Gateway security

**3. Missing Security Features:**
- No rate limiting on API endpoints
- No IP whitelisting/blacklisting
- No DDoS protection (Cloudflare, AWS Shield)
- No WAF (Web Application Firewall)
- No API key rotation mechanism
- Missing HTTPS/TLS termination

**4. Container Security:**
- No vulnerability scanning in pipeline (Trivy, Snyk)
- No image signing/verification
- No runtime security monitoring (Falco)
- Base images not pinned to specific digests

**5. Database Security:**
- PostgreSQL exposed on host port 5432
- No SSL/TLS for database connections visible
- No connection pooling limits defined
- Missing database backup encryption

**Recommended Fixes:**
1. **Immediate:**
   - Remove all service ports from docker-compose except API Gateway (3000), Web UI (4200), and n8n (5678)
   - Add Trivy scan to CI/CD pipeline
   - Rotate all default secrets before deployment

2. **Short-term:**
   - Implement rate limiting (express-rate-limit or @nestjs/throttler)
   - Add nginx reverse proxy with SSL termination
   - Enable PostgreSQL SSL connections
   - Add secret management (AWS Secrets Manager, Vault)

3. **Long-term:**
   - Implement zero-trust network architecture
   - Add runtime security monitoring
   - Set up SOC 2 compliance monitoring

---

## 8. Kubernetes Deployment

### Status: CONFIGURED but untested

**Files Found:**
- /home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/kubernetes/base/deployment.yaml (1049 lines)
- service.yaml, ingress.yaml, hpa.yaml, configmap.yaml, storage.yaml

**Deployment Configuration:**
**Services Defined:**
- All 11 microservices + web-ui + n8n + n8n-workers
- Replica counts:
  - Most services: 2 replicas
  - Scheduler: 1 replica (avoid duplicate jobs)
  - n8n: 1 replica (stateful)
  - n8n-workers: 3 replicas

**Resource Limits:**
```yaml
# Standard services:
requests: cpu: 250m, memory: 256Mi
limits: cpu: 1000m, memory: 512Mi

# High-performance (content, agents, worker-runner):
requests: cpu: 500m, memory: 512Mi
limits: cpu: 2000m, memory: 1024Mi
```

**Health Checks:**
- livenessProbe: /health every 10s (30s initial delay)
- readinessProbe: /health every 5s (10s initial delay)

**Gaps:**
1. **ConfigMaps/Secrets not created:**
   - References: funnelagents-config, funnelagents-secrets
   - No example manifests provided

2. **Ingress not configured:**
   - ingress.yaml exists but content not checked
   - Missing SSL/TLS certificate setup
   - No ingress controller specified (nginx, traefik?)

3. **Storage:**
   - PersistentVolumeClaim for n8n-data referenced
   - No storage class specified
   - No backup strategy

4. **Missing:**
   - No NetworkPolicy for pod-to-pod communication
   - No PodDisruptionBudget for high availability
   - No Horizontal Pod Autoscaler configuration verified
   - No namespace isolation strategy

**Deployment Process:**
```bash
# Not documented:
1. Create namespace: kubectl create namespace funnelagents
2. Create secrets: kubectl create secret generic funnelagents-secrets
3. Create configmaps: kubectl apply -f configmap.yaml
4. Apply manifests: kubectl apply -f deployment.yaml
5. Verify: kubectl get pods -n funnelagents
```

---

## 9. Database & Data Persistence

### Status: BASIC - No production hardening

**Current Setup:**
- PostgreSQL 16 Alpine in Docker
- Volume: postgres-data (local driver)
- Redis 7 Alpine with redis-data volume
- n8n uses PostgreSQL for workflow storage

**Critical Gaps:**

**1. No Backup Strategy:**
- No automated database backups configured
- No point-in-time recovery setup
- No backup verification process
- Missing backup retention policy

**2. No Migration Management:**
- No TypeORM migrations visible in repository
- No migration rollback strategy
- Synchronize mode likely enabled (dangerous in production)
- No database versioning

**3. Performance:**
- No connection pooling configuration
- No PostgreSQL tuning for production workloads
- Default shared_buffers, work_mem, etc.
- Missing query performance monitoring

**4. High Availability:**
- Single PostgreSQL instance (SPOF - Single Point of Failure)
- No read replicas
- No failover mechanism
- No database clustering

**5. Security:**
- Database port exposed to host (5432)
- No SSL/TLS connections configured
- No row-level security policies
- Missing audit logging

**Recommendations:**
1. **Immediate:**
   - Set up pg_dump cron job for nightly backups
   - Store backups in S3/GCS with encryption
   - Document restore procedure
   - Enable PostgreSQL statement logging

2. **Production:**
   - Use managed database service (AWS RDS, GCP Cloud SQL)
   - Enable automated backups with 30-day retention
   - Set up read replicas for read-heavy workloads
   - Configure SSL/TLS for all connections
   - Implement connection pooling (PgBouncer)

---

## 10. Development Workflow

### Status: EXCELLENT

**Makefile Commands** (/home/anga/workspace/beta/codehornets-ai/funnel-agents/Makefile):
Very comprehensive with 80+ commands organized into categories:
- Setup: `make install`, `make install-web`
- Up Commands: `make up`, `make up-infra`, `make up-services`, `make up-web`
- Development: `make dev-*` for individual services
- Build: `make build`, `make build-prod`
- Testing: `make test`, `make test-unit`, `make test-e2e`, `make test-cov`
- Docker: `make docker-*` for container management
- Database: `make db-*` for migrations and seeding
- Cleanup: `make clean`, `make clean-all`
- CI/CD: `make ci-*` commands

**Strengths:**
- Well-documented with help command
- Color-coded output for better UX
- Parallel service startup support
- Nx integration for affected builds
- Easy service isolation for debugging

**Development Experience:**
- `make up` starts everything (infra + backend + frontend)
- `make dev-gateway` starts single service
- Hot reload with `make watch`
- Individual service testing with `make test-auth`

---

## Deployment Readiness Scorecard

| Category | Score | Status | Priority |
|----------|-------|--------|----------|
| **Docker Configuration** | 75% | Good | Medium |
| **Environment Config** | 35% | Poor | HIGH |
| **CI/CD Pipeline** | 50% | Partial | HIGH |
| **Production Build** | 0% | FAILING | CRITICAL |
| **Service Discovery** | 70% | Good | Low |
| **Monitoring/Logging** | 20% | Minimal | HIGH |
| **Security** | 50% | Moderate | HIGH |
| **Kubernetes Setup** | 60% | Configured | Medium |
| **Database/Persistence** | 40% | Basic | HIGH |
| **Documentation** | 85% | Excellent | Low |
| **Health Checks** | 15% | Minimal | CRITICAL |
| **Secrets Management** | 10% | Poor | CRITICAL |

**Overall Score: 42.5% - NOT PRODUCTION READY**

---

## Critical Path to Production Deployment

### Phase 1: FIX BLOCKERS (Week 1)
**Priority: CRITICAL**

1. **Fix Production Build** (Day 1-2)
   - Fix TypeScript configuration errors in libs/infrastructure
   - Resolve rootDir issues with messaging module
   - Verify all 12 services build successfully
   - Test Docker image builds
   - **Command:** `npx nx reset && npm run build:prod`

2. **Implement Health Checks** (Day 2-3)
   - Add GET /health endpoint to all 9 missing services
   - Include database/redis connection checks
   - Test Kubernetes liveness/readiness probes
   - **Files to update:** */src/health/health.controller.ts (create for 9 services)

3. **Secrets Management** (Day 3-4)
   - Remove default secrets from all .env.example files
   - Create .env.production.template with placeholders
   - Document secret generation procedures
   - Add secret validation on startup
   - Consider integrating HashiCorp Vault or AWS Secrets Manager

4. **Secure Port Exposure** (Day 4)
   - Remove port mappings for internal services in docker-compose.yml
   - Only expose: API Gateway (3000), Web UI (4200), n8n (5678)
   - Update documentation

5. **Add Deployment Workflow** (Day 5)
   - Create .github/workflows/docker-build.yml
   - Create .github/workflows/deploy-staging.yml
   - Configure GitHub Container Registry secrets
   - Test image push

### Phase 2: MAJOR IMPROVEMENTS (Week 2-3)

6. **Centralized Logging** (Week 2)
   - Deploy Loki + Promtail + Grafana stack
   - Configure JSON-formatted logs in all services
   - Add correlation IDs for request tracing
   - Create log retention policies

7. **Monitoring & Alerting** (Week 2)
   - Add Prometheus metrics endpoints to all services
   - Deploy Prometheus + Grafana
   - Create dashboards for: CPU, Memory, Request Rate, Error Rate, Response Time
   - Set up alerts for critical metrics

8. **Database Hardening** (Week 3)
   - Implement TypeORM migrations
   - Set up automated backups (pg_dump to S3)
   - Test restore procedures
   - Enable SSL/TLS connections
   - Configure connection pooling

9. **Security Enhancements** (Week 3)
   - Add Trivy vulnerability scanning to CI/CD
   - Implement rate limiting on API Gateway
   - Add nginx reverse proxy with SSL termination
   - Rotate all secrets
   - Enable HTTPS for all services

10. **Production docker-compose** (Week 3)
    - Create docker-compose.prod.yml
    - Configure production-specific settings
    - Add nginx service
    - Document production startup procedure

### Phase 3: PRODUCTION READY (Week 4)

11. **Load Testing**
    - Use k6 or Apache JMeter
    - Test: 100 concurrent users, 1000 requests/sec
    - Identify bottlenecks
    - Optimize resource limits

12. **Disaster Recovery**
    - Document backup/restore procedures
    - Test failover scenarios
    - Create runbooks for common issues
    - Set up on-call rotation

13. **Documentation**
    - Deployment guide
    - Troubleshooting guide
    - Architecture diagrams
    - API documentation (Swagger/OpenAPI)

---

## Recommended Architecture Changes

### Current Architecture:
```
Internet -> API Gateway (3000) -> NestJS Services -> PostgreSQL
                                                  -> Redis
         -> Web UI (4200) -----> API Gateway
         -> n8n (5678) --------> PostgreSQL/Redis
```

### Recommended Production Architecture:
```
Internet -> Cloudflare (DDoS) -> Load Balancer (nginx) -> API Gateway -> Services
                                      |                      |
                                      v                      v
                                  Web UI                  Redis Cluster
                                      |                      |
                                      v                      v
                                  n8n (internal)         PostgreSQL (RDS/managed)
                                                             |
                                                             v
                                                         Read Replicas
```

**Additional Components Needed:**
- nginx for SSL termination and reverse proxy
- Redis Sentinel or Cluster for HA
- Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- S3/GCS for file storage and backups
- Cloudflare or AWS CloudFront for CDN

---

## Quick Start Commands

### Current State (Development):
```bash
# Start everything
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents
make up

# Access:
API Gateway: http://localhost:3000
Web UI: http://localhost:5173 (dev server)
n8n: http://localhost:5678 (admin/changeme)
```

### What Doesn't Work (Production):
```bash
# This FAILS:
npm run build:prod
# ERROR: TypeScript configuration errors

# This is INCOMPLETE:
cd infrastructure/docker
docker compose up -d
# Services start but health checks will fail
# No monitoring, no backups, no security hardening
```

---

## Conclusion

**Can this be deployed to production today?** NO

**Estimated time to production-ready:** 3-4 weeks with dedicated team

**Biggest Risks:**
1. Production build completely broken (TypeScript errors)
2. Missing health checks will cause Kubernetes to kill pods
3. Weak secrets will be exploited if exposed
4. No monitoring means blind deployment
5. No backups means data loss risk

**Strengths to Build On:**
1. Excellent Docker containerization
2. Comprehensive Makefile for development
3. Good CI/CD test pipeline foundation
4. Kubernetes manifests already created
5. Strong development workflow

**Next Steps:**
1. Fix critical blockers in Phase 1 (Week 1)
2. Assign team members to Phase 2 tasks (Week 2-3)
3. Load test and finalize in Phase 4 (Week 4)
4. Schedule production deployment for Week 5

**Final Recommendation:**
Focus on fixing the production build first (Day 1-2), then health checks (Day 2-3), then secrets management (Day 3-4). Everything else can be done in parallel by a team. Do NOT attempt production deployment until these three blockers are resolved.

---

## Appendix: File Locations

### Configuration Files:
- Docker Compose: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker/docker-compose.yml`
- Dockerfile: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker/Dockerfile`
- Env Example: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/docker/.env.example`
- Makefile: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/Makefile`
- GitHub Actions: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/.github/workflows/tests.yml`
- Kubernetes: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/infrastructure/kubernetes/base/`

### Service Locations:
- Services: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/apps/*/src/main.ts`
- Health Checks: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/apps/api-gateway/src/health/health.controller.ts` (only one implemented)

### Build Logs:
- Last build attempt: Failed with TypeScript errors in `libs/infrastructure/src/lib/messaging/*`
- Affected services: auth-service, web-ui, reports-service, campaigns-service, agents-service, worker-runner, scheduler (7 of 12)
