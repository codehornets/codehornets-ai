# CI/CD Quick Reference Guide

Quick commands and workflows for the FunnelAgents CI/CD pipeline.

## Daily Developer Workflow

### 1. Create Feature Branch
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes and Test Locally
```bash
# Run tests
npm run test:unit
npm run test:integration
npm run lint

# Build services
npm run build

# Test with Docker
cd infrastructure/docker
docker-compose up -d
```

### 3. Commit and Push
```bash
git add .
git commit -m "feat: add new feature"
git push origin feat/your-feature-name
```

### 4. Create Pull Request
- Go to GitHub and create PR
- Wait for CI checks to pass:
  - ✅ Unit tests (Node 18.x, 20.x)
  - ✅ Integration tests
  - ✅ E2E tests
  - ✅ Lint checks
  - ✅ Security scans

### 5. Merge to Main
- Get approval from reviewers
- Merge PR
- **Automatic staging deployment begins!**

## CI/CD Pipeline Stages

```
┌─────────────┐
│  Push Code  │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│  Automated CI Pipeline              │
│  - Unit Tests (18.x, 20.x)         │
│  - Integration Tests                │
│  - E2E Tests (Docker Compose)       │
│  - Lint & Format Checks             │
│  - Security Scanning                │
│  - Docker Image Builds              │
│  - Vulnerability Scanning (Trivy)   │
└──────┬──────────────────────────────┘
       │ All checks passed
       v
┌─────────────────────────────────────┐
│  Staging Deployment (Automatic)     │
│  - Deploy all services              │
│  - Run smoke tests                  │
│  - Integration tests in staging     │
└──────┬──────────────────────────────┘
       │ Tests passed
       v
┌─────────────────────────────────────┐
│  Production Deployment (Manual)     │
│  - Require approval                 │
│  - Deploy all services              │
│  - Run smoke tests                  │
│  - Create deployment tag            │
│  - Send notifications               │
└─────────────────────────────────────┘
```

## GitHub Actions Workflows

### Tests Workflow
**Trigger:** Push, PR
**Purpose:** Run all tests and checks

```bash
# Automatically runs on:
- Push to main, develop, feat-*, fix-*
- Pull requests to main, develop

# Jobs:
✓ Unit tests (parallel on Node 18.x & 20.x)
✓ Integration tests (with PostgreSQL & Redis)
✓ E2E tests (full Docker Compose stack)
✓ Lint and format checks
✓ Coverage reports
```

### Docker Build Workflow
**Trigger:** Push, PR, Tags
**Purpose:** Build and scan images

```bash
# Automatically runs on:
- Push to main, develop
- Pull requests
- Version tags (v1.0.0)

# Jobs:
✓ Build 11 microservice images
✓ Build web-ui image
✓ Security scan with Trivy
✓ Container startup tests
✓ Push to GHCR
✓ Generate SBOM
```

### Security Scan Workflow
**Trigger:** Daily, Push, PR, Manual
**Purpose:** Security scanning

```bash
# Automatically runs:
- Daily at 2 AM UTC
- On push to main/develop
- On pull requests
- Manual dispatch

# Scans:
✓ Dependency vulnerabilities (npm audit, Snyk)
✓ SAST (CodeQL, Semgrep)
✓ Secret detection (Gitleaks, TruffleHog)
✓ Container security (Trivy, Grype)
✓ License compliance
✓ Infrastructure security (Checkov, Hadolint)
```

### Deploy Workflow
**Trigger:** Push to main, Manual
**Purpose:** Deploy to environments

```bash
# Staging (Automatic):
- Triggered by push to main
- Deploys all services
- Runs smoke tests
- No approval required

# Production (Manual):
- Triggered by workflow dispatch
- Requires approval
- Deploys all services
- Creates deployment tag
- Sends notifications
```

## Manual Deployment Commands

### Deploy to Staging via GitHub UI
1. Go to **Actions** tab
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Select environment: `staging`
6. Click **Run workflow**

### Deploy to Production via GitHub UI
1. Go to **Actions** tab
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Select branch: `main`
5. Select environment: `production`
6. Click **Run workflow**
7. **Wait for approval from team**
8. Approve deployment in Environments tab

### Deploy via GitHub CLI
```bash
# Trigger staging deployment
gh workflow run deploy.yml --ref main

# Trigger production deployment
gh workflow run deploy.yml --ref main -f environment=production
```

## Docker Image Tags

Images are pushed to: `ghcr.io/<org>/funnel-agents-<service>:<tag>`

### Available Tags
```bash
# Latest from main
:latest

# Git SHA
:a1b2c3d

# Branch name
:main
:develop
:feat-new-feature

# Semantic version
:v1.0.0
:v1.0
:v1
```

### Pull Images
```bash
# Pull specific service
docker pull ghcr.io/<org>/funnel-agents-api-gateway:latest

# Pull all services (example)
for service in api-gateway auth-service crm-service; do
  docker pull ghcr.io/<org>/funnel-agents-${service}:latest
done
```

## Secrets Management

### Set Secrets via GitHub CLI
```bash
# Set a secret
gh secret set SECRET_NAME --body "secret-value"

# Set from file
gh secret set SECRET_NAME < secret-file.txt

# Set for environment
gh secret set SECRET_NAME --env production --body "secret-value"

# List secrets
gh secret list

# List environment secrets
gh secret list --env production
```

### Required Secrets Checklist
- [ ] `GITHUB_TOKEN` (automatic)
- [ ] `AWS_ACCESS_KEY_ID` (if using AWS)
- [ ] `AWS_SECRET_ACCESS_KEY` (if using AWS)
- [ ] `AWS_REGION` (if using AWS)
- [ ] `STAGING_TEST_USER_EMAIL`
- [ ] `STAGING_TEST_USER_PASSWORD`
- [ ] `SLACK_WEBHOOK_URL` (optional)
- [ ] `CODECOV_TOKEN` (optional)
- [ ] `SNYK_TOKEN` (optional)

## Monitoring Deployments

### Check Workflow Status
```bash
# List recent workflow runs
gh run list

# Watch a workflow run
gh run watch <run-id>

# View run logs
gh run view <run-id> --log
```

### Check Deployment Status
```bash
# View deployment status
gh api repos/:owner/:repo/deployments

# View environment deployments
gh api repos/:owner/:repo/environments/production/deployments
```

### View Logs
```bash
# Kubernetes
kubectl logs deployment/<service> -n production --tail=100

# Docker Compose (local)
docker-compose logs -f <service>

# AWS ECS
aws ecs logs get-log-events --log-group-name /ecs/<cluster> --log-stream-name <stream>
```

## Troubleshooting

### Build Failed

**Check:**
```bash
# View failed run
gh run view <run-id> --log-failed

# Re-run failed jobs
gh run rerun <run-id> --failed
```

**Common Fixes:**
- Clear cache and rebuild
- Update dependencies
- Fix linting errors
- Resolve test failures

### Tests Failed

**Check:**
```bash
# View test results
gh run view <run-id> --log | grep "FAIL"

# Download test artifacts
gh run download <run-id>
```

**Common Fixes:**
- Update test snapshots
- Fix race conditions
- Check environment variables
- Verify database migrations

### Deployment Failed

**Check:**
```bash
# View deployment logs
gh run view <run-id> --log

# Check service health
curl https://staging.example.com/health
```

**Common Fixes:**
- Verify secrets are set
- Check resource limits
- Verify database connectivity
- Check image tags

### Security Scan Failed

**Check:**
```bash
# View security tab
gh api repos/:owner/:repo/code-scanning/alerts

# View Trivy results
gh run view <run-id> --log | grep "CRITICAL\|HIGH"
```

**Common Fixes:**
- Update dependencies: `npm update`
- Run audit fix: `npm audit fix`
- Review Security tab for details
- Update base Docker image

## Rollback Procedures

### Automatic Rollback
- Happens automatically on deployment failure
- Reverts to previous working version
- Team is notified

### Manual Rollback

**Via GitHub:**
1. Go to Actions → Deploy
2. Find successful previous deployment
3. Click "Re-run all jobs"

**Via Kubernetes:**
```bash
# View rollout history
kubectl rollout history deployment/<service> -n production

# Rollback to previous version
kubectl rollout undo deployment/<service> -n production

# Rollback to specific revision
kubectl rollout undo deployment/<service> -n production --to-revision=5
```

**Via AWS ECS:**
```bash
# List task definitions
aws ecs list-task-definitions --family-prefix <service>

# Update to previous version
aws ecs update-service \
  --cluster production \
  --service <service> \
  --task-definition <service>:<previous-revision>
```

## Performance Tips

### Speed Up CI
```bash
# Use cache
- Cache npm dependencies
- Cache Docker layers
- Use Nx affected commands

# Parallelize jobs
- Run tests in parallel
- Build images concurrently
- Use matrix strategy

# Optimize Docker
- Multi-stage builds
- Layer caching
- Minimize image size
```

### Speed Up Deployments
```bash
# Pre-warm images
docker pull ghcr.io/<org>/funnel-agents-api-gateway:latest

# Use rolling updates
kubectl set image deployment/<service> --record

# Increase readiness probe frequency
# Reduce terminationGracePeriodSeconds
```

## Useful Commands

### GitHub CLI
```bash
# List workflows
gh workflow list

# Run workflow
gh workflow run <workflow-name>

# List runs
gh run list --workflow=<workflow-name>

# Watch run
gh run watch

# View run
gh run view <run-id>

# Cancel run
gh run cancel <run-id>

# Download artifacts
gh run download <run-id>
```

### Docker Commands
```bash
# Build image
docker build -t funnel-agents-api-gateway:test .

# Tag image
docker tag funnel-agents-api-gateway:test ghcr.io/<org>/funnel-agents-api-gateway:latest

# Push image
docker push ghcr.io/<org>/funnel-agents-api-gateway:latest

# Pull image
docker pull ghcr.io/<org>/funnel-agents-api-gateway:latest

# Run container
docker run -d --name api-gateway ghcr.io/<org>/funnel-agents-api-gateway:latest
```

### Kubernetes Commands
```bash
# Apply deployment
kubectl apply -f k8s/

# Get pods
kubectl get pods -n production

# Describe pod
kubectl describe pod <pod-name> -n production

# View logs
kubectl logs <pod-name> -n production

# Get deployments
kubectl get deployments -n production

# Scale deployment
kubectl scale deployment/<service> --replicas=3 -n production

# Rollout status
kubectl rollout status deployment/<service> -n production
```

## Emergency Procedures

### System Down
1. Check monitoring dashboards
2. Review logs: `kubectl logs deployment/<service>`
3. Check recent deployments
4. Rollback if needed
5. Notify team
6. Post-mortem after recovery

### Security Breach
1. Rotate all secrets immediately
2. Review security scan results
3. Check for unauthorized access
4. Review audit logs
5. Update security policies
6. Notify security team

### Data Loss
1. Stop all writes immediately
2. Identify backup restore point
3. Restore from backup
4. Verify data integrity
5. Resume operations
6. Conduct investigation

## Support

**Documentation:**
- `.github/workflows/README.md` - Complete guide
- `.github/SECRETS_TEMPLATE.md` - Secrets setup
- `CICD_IMPLEMENTATION_REPORT.md` - Implementation details

**Resources:**
- GitHub Actions logs
- Security tab
- Environments tab
- Deployment history

**Contacts:**
- DevOps Team: devops@example.com
- Security Team: security@example.com
- On-call: Check PagerDuty
