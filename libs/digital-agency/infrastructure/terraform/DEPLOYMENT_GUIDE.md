# PainterFlow CRM - AWS Deployment Guide

Complete guide for deploying PainterFlow CRM infrastructure to AWS using Terraform.

## Naming Convention

Following Codehornets organizational hierarchy:

```
Company:    Codehornets
  └─ Product:    PainterFlow
       └─ Application:  CRM
```

### Resource Naming Pattern

**Format:** `codehornets-painterflow-crm-{environment}-{resource}`

**Examples:**
- S3 Backend: `codehornets-terraform-state`
- State Key: `painterflow/crm/{env}/terraform.tfstate`
- EKS Cluster: `codehornets-painterflow-crm-production`
- S3 Bucket: `codehornets-painterflow-crm-production-uploads`
- ALB: `codehornets-painterflow-crm-production-alb`

This allows Codehornets to:
- Use the same S3 bucket for all products (different keys)
- Use the same DynamoDB table for state locking
- Clearly identify resources by company/product/app in AWS Console

## Prerequisites

### 1. AWS Account Setup

**IMPORTANT:** After getting your AWS credentials, rotate them immediately if you've shared them anywhere (chat, email, etc.).

Configure AWS CLI with the `codehornets` profile:

```bash
aws configure --profile codehornets
```

Enter:
- **AWS Access Key ID:** Your access key
- **AWS Secret Access Key:** Your secret key
- **Default region:** `ca-central-1`
- **Default output format:** `json`

Verify configuration:

```bash
aws sts get-caller-identity --profile codehornets
```

You should see your AWS account ID and user ARN.

### 2. Install Terraform

Ensure Terraform >= 1.5.0 is installed:

```bash
# Verify version
terraform version

# If not installed:
# macOS: brew install terraform
# Windows: choco install terraform
# Linux: wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
```

## Step 1: Create Backend Resources

Create S3 bucket and DynamoDB table for Terraform state management:

```bash
# Create S3 bucket (company-level for all Codehornets projects)
aws s3api create-bucket \
  --bucket codehornets-terraform-state \
  --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1 \
  --profile codehornets

# Enable versioning (required for state recovery)
aws s3api put-bucket-versioning \
  --bucket codehornets-terraform-state \
  --versioning-configuration Status=Enabled \
  --profile codehornets

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket codehornets-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --profile codehornets

# Block public access (critical security setting)
aws s3api put-public-access-block \
  --bucket codehornets-terraform-state \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile codehornets

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name codehornets-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ca-central-1 \
  --profile codehornets
```

### Verify Backend Resources

```bash
# Verify S3 bucket
aws s3 ls s3://codehornets-terraform-state --profile codehornets

# Verify DynamoDB table
aws dynamodb describe-table \
  --table-name codehornets-terraform-locks \
  --region ca-central-1 \
  --profile codehornets
```

## Step 2: Deploy Development Environment

Start with dev environment (~$147/month):

### Set Database Password

```bash
# Set database password via environment variable (NEVER commit passwords!)
export TF_VAR_db_password="YourSecureDevPassword123!"
```

### Initialize and Deploy

```bash
cd infrastructure/terraform/environments/dev

# Initialize Terraform (downloads providers and modules)
terraform init

# Review the execution plan
terraform plan

# Apply the changes
terraform apply
```

Type `yes` when prompted.

### Deployment Time

Development environment takes approximately **15-20 minutes**:
- ⏱️ VPC & Networking: ~2 minutes
- ⏱️ EKS Cluster: ~10-12 minutes (longest)
- ⏱️ RDS MySQL: ~5-7 minutes
- ⏱️ ElastiCache Redis: ~3-5 minutes
- ⏱️ S3, ECR, ALB: ~2 minutes

### Configure kubectl

```bash
# Configure kubectl to access your EKS cluster
aws eks update-kubeconfig \
  --region ca-central-1 \
  --name codehornets-painterflow-crm-dev \
  --profile codehornets

# Verify connection
kubectl get nodes
```

### View Outputs

```bash
# See all infrastructure details
terraform output

# Get specific values
terraform output eks_cluster_endpoint
terraform output rds_endpoint
terraform output redis_endpoint
terraform output ecr_repository_url
```

## Step 3: Deploy Staging Environment (Optional)

Once dev is stable, deploy staging (~$250/month):

```bash
# Set database password
export TF_VAR_db_password="YourSecureStagingPassword123!"

cd infrastructure/terraform/environments/staging

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

Configure kubectl:

```bash
aws eks update-kubeconfig \
  --region ca-central-1 \
  --name codehornets-painterflow-crm-staging \
  --profile codehornets
```

## Step 4: Deploy Production Environment

When staging is validated, deploy production (~$700/month):

```bash
# Set database password
export TF_VAR_db_password="YourSecureProductionPassword123!"

cd infrastructure/terraform/environments/production

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

Configure kubectl:

```bash
aws eks update-kubeconfig \
  --region ca-central-1 \
  --name codehornets-painterflow-crm-production \
  --profile codehornets
```

## Infrastructure Summary

### Development
- **Cluster:** `codehornets-painterflow-crm-dev`
- **State:** `s3://codehornets-terraform-state/painterflow/crm/dev/terraform.tfstate`
- **Cost:** ~$147/month
- **AZs:** 1 (ca-central-1a)
- **Instances:** 1x t3.small spot

### Staging
- **Cluster:** `codehornets-painterflow-crm-staging`
- **State:** `s3://codehornets-terraform-state/painterflow/crm/staging/terraform.tfstate`
- **Cost:** ~$250/month
- **AZs:** 2 (ca-central-1a, ca-central-1b)
- **Instances:** 2x t3.medium + spot

### Production
- **Cluster:** `codehornets-painterflow-crm-production`
- **State:** `s3://codehornets-terraform-state/painterflow/crm/production/terraform.tfstate`
- **Cost:** ~$700/month
- **AZs:** 3 (ca-central-1a, ca-central-1b, ca-central-1d)
- **Instances:** 3x t3.large + spot
- **Multi-AZ:** RDS and Redis

## Makefile Commands

```bash
# Initialize environment
make terraform-init ENV=dev

# Plan changes
make terraform-plan ENV=dev

# Apply changes
make terraform-apply ENV=dev

# View outputs
make terraform-output ENV=dev

# Destroy (CAREFUL!)
make terraform-destroy ENV=dev
```

## Adding More Products

When Codehornets adds more products, use the same backend:

```hcl
# Example: New product "ShipYard"
terraform {
  backend "s3" {
    bucket = "codehornets-terraform-state"
    key    = "shipyard/api/production/terraform.tfstate"
    # ... same DynamoDB table
  }
}
```

State files are organized:
```
codehornets-terraform-state/
├── painterflow/
│   ├── crm/
│   │   ├── dev/terraform.tfstate
│   │   ├── staging/terraform.tfstate
│   │   └── production/terraform.tfstate
│   └── mobile/
│       └── ...
└── shipyard/
    └── api/
        └── ...
```

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Use environment variables
export TF_VAR_db_password="SecurePassword"

# Or use AWS Secrets Manager
aws secretsmanager create-secret \
  --name codehornets-painterflow-crm-db-password \
  --secret-string "SecurePassword" \
  --profile codehornets
```

### 2. Enable MFA

Add MFA to your AWS root account and IAM users:
- AWS Console → IAM → Users → Security Credentials → Assign MFA

### 3. Use IAM Roles (When Possible)

For CI/CD pipelines, use IAM roles instead of access keys.

### 4. Enable CloudTrail

Monitor all AWS API calls:

```bash
aws cloudtrail create-trail \
  --name codehornets-audit-trail \
  --s3-bucket-name codehornets-cloudtrail-logs \
  --profile codehornets
```

### 5. Set Up Billing Alerts

Create budget alerts to catch unexpected charges:
- AWS Console → Billing → Budgets → Create budget

## Troubleshooting

### Backend Initialization Fails

```bash
# Verify S3 bucket exists
aws s3 ls s3://codehornets-terraform-state --profile codehornets

# Verify DynamoDB table exists
aws dynamodb describe-table \
  --table-name codehornets-terraform-locks \
  --region ca-central-1 \
  --profile codehornets

# Check AWS credentials
aws sts get-caller-identity --profile codehornets
```

### State Lock Errors

```bash
# If you see "Error locking state", force unlock
terraform force-unlock <LOCK_ID>
```

### Permission Errors

Ensure your IAM user/role has these permissions:
- EC2 (VPC, subnets, security groups)
- EKS (cluster, node groups)
- RDS, ElastiCache
- S3, ECR
- ELB (load balancers)
- CloudWatch
- IAM (roles, policies)

### EKS Cluster Creation Timeout

EKS cluster creation can take 10-15 minutes. If it times out:

```bash
# Check cluster status
aws eks describe-cluster \
  --name codehornets-painterflow-crm-dev \
  --region ca-central-1 \
  --profile codehornets
```

## Next Steps

After infrastructure is deployed:

1. **Deploy Application** - Use Kubernetes manifests in `infrastructure/kubernetes/`
2. **Configure Domain** - Point DNS to ALB
3. **Set Up Monitoring** - CloudWatch dashboards and alarms
4. **Configure CI/CD** - GitHub Actions or GitLab CI
5. **Enable Backups** - Verify automated backups are working

## Cost Monitoring

Monitor costs regularly:

```bash
# Get current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile codehornets
```

## Related Documentation

- [Environment README](environments/README.md) - Detailed environment guide
- [Infrastructure README](../README.md) - Main infrastructure docs
- [Kubernetes Deployment](../kubernetes/README.md) - K8s deployment guide

---

**Last Updated:** 2025-10-30
**Company:** Codehornets
**Product:** PainterFlow
**Application:** CRM
**Infrastructure:** AWS EKS + RDS + Redis
**Region:** ca-central-1 (Canada Central)
