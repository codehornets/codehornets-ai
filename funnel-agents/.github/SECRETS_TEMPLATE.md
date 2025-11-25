# GitHub Secrets Configuration

This document lists all required secrets for the CI/CD workflows.

## Required Secrets (Mandatory)

### Container Registry
- `GITHUB_TOKEN` - ✅ **Automatically provided by GitHub**

## Optional Secrets (Recommended)

### Code Coverage
- `CODECOV_TOKEN` - Token from codecov.io for coverage reporting
  - Get from: https://codecov.io/
  - Format: `<uuid>`

### Security Scanning
- `SNYK_TOKEN` - Snyk API token for dependency scanning
  - Get from: https://snyk.io/account/
  - Format: `<uuid>`

- `GITLEAKS_LICENSE` - Gitleaks Pro license (optional)
  - Get from: https://gitleaks.io/
  - Format: License key string

## Deployment Secrets (Required for Production)

### AWS Deployment (for ECS/EKS)

**Staging Environment:**
- `AWS_ACCESS_KEY_ID` - AWS IAM access key for staging
- `AWS_SECRET_ACCESS_KEY` - AWS IAM secret key for staging
- `AWS_REGION` - AWS region (e.g., `us-east-1`, `us-west-2`)

**Production Environment:**
- `AWS_ACCESS_KEY_ID_PROD` - AWS IAM access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS IAM secret key for production

**IAM Policy Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```

### Test Credentials

**Staging:**
- `STAGING_TEST_USER_EMAIL` - Test user email for staging E2E tests
  - Example: `test@staging.funnelagents.com`

- `STAGING_TEST_USER_PASSWORD` - Test user password
  - Should be a strong password
  - Must exist in staging database

## Notification Secrets (Optional)

### Slack Notifications
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
  - Get from: https://api.slack.com/messaging/webhooks
  - Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

### Discord Notifications
- `DISCORD_WEBHOOK_URL` - Discord webhook URL
  - Get from: Server Settings → Integrations → Webhooks
  - Format: `https://discord.com/api/webhooks/123456789/xxxxxxxxxxxx`

### PagerDuty Alerts
- `PAGERDUTY_INTEGRATION_KEY` - PagerDuty integration key
  - Get from: PagerDuty Service → Integrations
  - Format: `<integration-key>`

## Alternative Registry Secrets

### Docker Hub (Alternative to GHCR)
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
  - Get from: https://hub.docker.com/settings/security

### Google Container Registry (GCR)
- `GCP_PROJECT_ID` - Google Cloud project ID
- `GCP_SA_KEY` - Service account key (JSON)
  - Get from: GCP Console → IAM → Service Accounts

### Azure Container Registry (ACR)
- `ACR_USERNAME` - ACR username
- `ACR_PASSWORD` - ACR password
  - Get from: Azure Portal → Container Registry → Access Keys

## Database Secrets (for E2E Tests in CI)

These are typically set in the workflow file, but can be moved to secrets:

- `TEST_DATABASE_URL` - PostgreSQL connection string for tests
  - Default: `postgresql://test:test@localhost:5432/funnelagents_test`

- `TEST_REDIS_URL` - Redis connection string for tests
  - Default: `redis://localhost:6379`

## API Keys (Application Runtime)

Store these as environment-specific secrets:

### Staging Environment
- `JWT_SECRET_STAGING` - JWT signing secret for staging
- `DATABASE_URL_STAGING` - Production database URL
- `REDIS_URL_STAGING` - Redis connection string
- `N8N_ENCRYPTION_KEY_STAGING` - n8n encryption key

### Production Environment
- `JWT_SECRET_PRODUCTION` - JWT signing secret for production
- `DATABASE_URL_PRODUCTION` - Production database URL
- `REDIS_URL_PRODUCTION` - Redis connection string
- `N8N_ENCRYPTION_KEY_PRODUCTION` - n8n encryption key

## Setting Secrets in GitHub

### Via Web Interface

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter secret name and value
5. Click **Add secret**

### Via GitHub CLI

```bash
# Set a secret
gh secret set SECRET_NAME --body "secret-value"

# Set from file
gh secret set SECRET_NAME < secret-file.txt

# Set for specific environment
gh secret set SECRET_NAME --env staging --body "secret-value"
```

### Verify Secrets

```bash
# List all secrets
gh secret list

# List environment secrets
gh secret list --env staging
```

## Environment-Specific Secrets

### Staging Environment Secrets

Set these in: **Settings** → **Environments** → **staging** → **Environment secrets**

```
AWS_ACCESS_KEY_ID=<staging-aws-key>
AWS_SECRET_ACCESS_KEY=<staging-aws-secret>
DATABASE_URL=<staging-db-url>
REDIS_URL=<staging-redis-url>
JWT_SECRET=<staging-jwt-secret>
STAGING_TEST_USER_EMAIL=test@staging.example.com
STAGING_TEST_USER_PASSWORD=<strong-password>
```

### Production Environment Secrets

Set these in: **Settings** → **Environments** → **production** → **Environment secrets**

```
AWS_ACCESS_KEY_ID_PROD=<prod-aws-key>
AWS_SECRET_ACCESS_KEY_PROD=<prod-aws-secret>
DATABASE_URL=<prod-db-url>
REDIS_URL=<prod-redis-url>
JWT_SECRET=<prod-jwt-secret>
```

## Security Best Practices

1. **Rotate secrets regularly** - Every 90 days minimum
2. **Use different secrets per environment** - Never reuse staging secrets in production
3. **Limit secret access** - Use environment protection rules
4. **Audit secret usage** - Review Actions logs regularly
5. **Use secret scanning** - Enable GitHub secret scanning
6. **Never log secrets** - Be careful with debug output
7. **Use least privilege** - IAM roles should have minimal permissions
8. **Encrypt at rest** - Use AWS Secrets Manager or HashiCorp Vault for sensitive data

## Generating Secure Secrets

### Generate Random String (Linux/Mac)
```bash
# 32 character random string
openssl rand -base64 32

# 64 character random string
openssl rand -hex 64

# UUID
uuidgen
```

### Generate JWT Secret
```bash
# Strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Generate n8n Encryption Key
```bash
# n8n encryption key
openssl rand -base64 32
```

## Secrets Checklist

Before deploying to production, ensure:

- [ ] All required secrets are set
- [ ] Secrets are environment-specific
- [ ] Secrets are not committed to repository
- [ ] Secret scanning is enabled
- [ ] Production environment has required reviewers
- [ ] IAM roles follow least privilege principle
- [ ] Secrets are documented (not the values!)
- [ ] Rotation schedule is established
- [ ] Backup access exists (don't lock yourself out)
- [ ] Monitoring is configured for secret access

## Troubleshooting

### Secret Not Found Error

**Error:** "Secret AWS_ACCESS_KEY_ID not found"
**Solution:** Ensure secret is set at repository or environment level

### Secret Value Wrong

**Error:** "Invalid credentials"
**Solution:**
1. Verify secret value is correct (no extra spaces)
2. Check if secret needs to be base64 decoded
3. Verify secret hasn't expired

### Environment Secret Not Available

**Error:** "Environment secret not accessible"
**Solution:**
1. Ensure job specifies correct environment
2. Check environment protection rules
3. Verify secret is set at environment level, not repository level

## Additional Resources

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
