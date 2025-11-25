# GitHub Actions CI/CD Workflows

This directory contains the CI/CD workflows for the FunnelAgents platform.

## Workflows Overview

### 1. Tests Workflow (`tests.yml`)

**Trigger:** Push to main/develop, Pull Requests
**Purpose:** Run all test suites

**Jobs:**
- **Unit Tests** - Run unit tests on Node 18.x and 20.x
- **Integration Tests** - Test service integrations with PostgreSQL and Redis
- **E2E Tests** - Full stack testing with Docker Compose
- **Lint** - Code quality and formatting checks
- **Coverage** - Generate and report test coverage

**Required Secrets:**
- `CODECOV_TOKEN` - For coverage reporting (optional)

### 2. Docker Build Workflow (`docker-build.yml`)

**Trigger:** Push to main/develop, Tags, Pull Requests
**Purpose:** Build and scan Docker images for all microservices

**Jobs:**
- **Build Matrix** - Build all 11 microservice images
- **Build Web UI** - Build frontend image
- **Security Scanning** - Trivy vulnerability scanning
- **Container Testing** - Verify containers start correctly
- **SBOM Generation** - Generate Software Bill of Materials

**Services Built:**
- api-gateway
- auth-service
- crm-service
- campaigns-service
- content-service
- agents-service
- tasks-service
- automations-service
- reports-service
- worker-runner
- scheduler
- web-ui

**Required Secrets:**
- `GITHUB_TOKEN` - Automatically provided (for GHCR push)

### 3. Deploy Workflow (`deploy.yml`)

**Trigger:** Push to main, Manual workflow dispatch
**Purpose:** Deploy to staging and production environments

**Jobs:**
1. **Build and Test** - Verify code quality
2. **Build Images** - Create Docker images with Git SHA tags
3. **Security Scan** - Scan images with Trivy
4. **Deploy Staging** - Deploy to staging environment
5. **Integration Tests** - Test staging deployment
6. **Deploy Production** - Deploy to production (manual approval required)
7. **Rollback** - Automatic rollback on failure

**Environments:**
- **Staging:** https://staging.funnel-agents.example.com
- **Production:** https://funnel-agents.example.com

**Required Secrets:**

**AWS (for ECS/EKS deployment):**
- `AWS_ACCESS_KEY_ID` - AWS access key for staging
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for staging
- `AWS_ACCESS_KEY_ID_PROD` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS secret key for production
- `AWS_REGION` - AWS region (e.g., us-east-1)

**Test Credentials:**
- `STAGING_TEST_USER_EMAIL` - Test user for staging
- `STAGING_TEST_USER_PASSWORD` - Test password for staging

**Notifications:**
- `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications

### 4. Security Scan Workflow (`security-scan.yml`)

**Trigger:** Daily at 2 AM UTC, Push, Pull Requests, Manual
**Purpose:** Comprehensive security scanning

**Jobs:**
- **Dependency Scan** - npm audit, Snyk
- **SAST** - CodeQL, Semgrep, ESLint security
- **Secret Detection** - Gitleaks, TruffleHog
- **Container Scan** - Trivy, Grype on all images
- **License Scan** - Check for license compliance
- **Infrastructure Scan** - Checkov, Hadolint

**Required Secrets:**
- `SNYK_TOKEN` - Snyk API token (optional)
- `GITLEAKS_LICENSE` - Gitleaks license (optional)

## Setting Up GitHub Environments

### Create Staging Environment

1. Go to repository Settings → Environments
2. Click "New environment"
3. Name: `staging`
4. Add environment secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `STAGING_TEST_USER_EMAIL`
   - `STAGING_TEST_USER_PASSWORD`

### Create Production Environment

1. Go to repository Settings → Environments
2. Click "New environment"
3. Name: `production`
4. Enable "Required reviewers" (add team members)
5. Enable "Wait timer" if needed (e.g., 5 minutes)
6. Add environment secrets:
   - `AWS_ACCESS_KEY_ID_PROD`
   - `AWS_SECRET_ACCESS_KEY_PROD`

## Container Registry Setup

### GitHub Container Registry (GHCR)

Images are pushed to: `ghcr.io/<your-org>/funnel-agents-<service>:<tag>`

**Tags:**
- `latest` - Latest build from main branch
- `<branch>` - Branch name (e.g., develop)
- `<sha>` - Git commit SHA
- `v<version>` - Semantic version tags

**Setup:**
1. Ensure GHCR is enabled for your organization
2. `GITHUB_TOKEN` is automatically provided
3. Images are automatically pushed on successful builds

### Alternative Registries

To use ECR, DockerHub, or GCR, modify the workflows:

```yaml
# For AWS ECR
env:
  REGISTRY: <account-id>.dkr.ecr.<region>.amazonaws.com

steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ${{ secrets.AWS_REGION }}

  - name: Login to ECR
    uses: aws-actions/amazon-ecr-login@v2

# For DockerHub
env:
  REGISTRY: docker.io

steps:
  - name: Login to DockerHub
    uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
```

## Deployment Targets

### AWS ECS Deployment

Update `deploy.yml` deployment steps:

```bash
# Update ECS service
aws ecs update-service \
  --cluster funnel-agents-staging \
  --service api-gateway \
  --force-new-deployment \
  --task-definition funnel-agents-api-gateway:latest

# Wait for deployment
aws ecs wait services-stable \
  --cluster funnel-agents-staging \
  --services api-gateway
```

### Kubernetes (EKS/GKE) Deployment

Update `deploy.yml` deployment steps:

```bash
# Set image
kubectl set image deployment/api-gateway \
  api-gateway=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api-gateway:${{ github.sha }} \
  -n staging

# Wait for rollout
kubectl rollout status deployment/api-gateway -n staging
```

### Docker Swarm Deployment

```bash
docker stack deploy -c docker-compose.yml funnel-agents
```

## Smoke Tests

Customize smoke tests in `deploy.yml`:

```bash
# Health check
curl -f https://staging.example.com/health || exit 1

# API health
curl -f https://staging.example.com/api/health || exit 1

# Auth service
curl -f https://staging.example.com/api/auth/health || exit 1

# Test login endpoint
curl -X POST https://staging.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  | grep -q "token"
```

## Notifications

### Slack Integration

1. Create a Slack webhook: https://api.slack.com/messaging/webhooks
2. Add `SLACK_WEBHOOK_URL` to GitHub secrets
3. Notifications are sent on:
   - Production deployment success
   - Production deployment failure
   - Security scan failures

### Discord Integration

Replace Slack webhook with Discord:

```yaml
- name: Notify deployment
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{
        "content": "Deployment to production successful!",
        "embeds": [{
          "title": "FunnelAgents Deployment",
          "description": "Commit: ${{ github.sha }}",
          "color": 3066993
        }]
      }'
```

## Troubleshooting

### Build Failures

**Problem:** Docker build fails with "out of memory"
**Solution:** Reduce build parallelism:
```yaml
build-args: |
  NODE_OPTIONS=--max-old-space-size=4096
```

**Problem:** Tests timeout
**Solution:** Increase timeout in workflow:
```yaml
timeout-minutes: 30
```

### Deployment Failures

**Problem:** Service doesn't start after deployment
**Solution:** Check logs and rollback:
```bash
# View logs
kubectl logs deployment/api-gateway -n production --tail=100

# Rollback
kubectl rollout undo deployment/api-gateway -n production
```

**Problem:** Database migrations fail
**Solution:** Run migrations manually:
```bash
kubectl exec -it deployment/api-gateway -n production -- npm run migration:run
```

### Security Scan Failures

**Problem:** Trivy finds HIGH/CRITICAL vulnerabilities
**Solution:** Update dependencies:
```bash
npm update
npm audit fix
```

**Problem:** Secret detected in code
**Solution:** Remove secret and rotate:
1. Remove secret from code
2. Rotate the compromised credential
3. Add to `.gitignore` or use environment variables

## Best Practices

1. **Always use feature branches** - Never commit directly to main
2. **Run tests locally first** - Use `npm run test` before pushing
3. **Review security reports** - Check the Security tab regularly
4. **Use semantic versioning** - Tag releases with `v1.0.0` format
5. **Keep secrets in GitHub Secrets** - Never commit credentials
6. **Monitor deployments** - Watch logs during deployment
7. **Test in staging first** - Always deploy to staging before production
8. **Use environment protection rules** - Require approvals for production
9. **Keep workflows updated** - Update actions versions regularly
10. **Document changes** - Update this README when modifying workflows

## Monitoring and Observability

After deployment, monitor:

- Application logs (CloudWatch, Stackdriver, etc.)
- Container metrics (CPU, Memory, Network)
- Database performance
- Redis queue depth
- API response times
- Error rates

Set up alerts for:
- Service down
- High error rate (>5%)
- High response time (>2s)
- Memory usage (>80%)
- Disk usage (>80%)

## Rollback Procedures

### Automatic Rollback

The workflow automatically rolls back production deployments on failure.

### Manual Rollback

**For Kubernetes:**
```bash
kubectl rollout undo deployment/<service> -n production
```

**For ECS:**
```bash
aws ecs update-service \
  --cluster production \
  --service <service> \
  --task-definition <service>:<previous-version>
```

**For Docker Swarm:**
```bash
docker service rollback funnel-agents_<service>
```

## Support

For issues with CI/CD workflows:
1. Check workflow run logs in GitHub Actions
2. Review this documentation
3. Check the Security tab for scan results
4. Contact the DevOps team

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Trivy Scanner](https://github.com/aquasecurity/trivy)
- [CodeQL](https://codeql.github.com/)
