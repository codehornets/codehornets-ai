# PainterFlow CRM - Terraform Environments

Environment-specific Terraform configurations for deploying PainterFlow CRM infrastructure to AWS.

## Directory Structure

```
environments/
├── dev/                    # Development environment
│   ├── terraform.tfvars    # Dev-specific variables
│   ├── backend.tf          # Dev backend config
│   ├── main.tf             # Dev infrastructure
│   ├── variables.tf        # Variable definitions
│   └── outputs.tf          # Output values
├── staging/                # Staging environment
│   ├── terraform.tfvars    # Staging-specific variables
│   ├── backend.tf          # Staging backend config
│   ├── main.tf             # Staging infrastructure
│   ├── variables.tf        # Variable definitions
│   └── outputs.tf          # Output values
└── production/             # Production environment
    ├── terraform.tfvars    # Production-specific variables
    ├── backend.tf          # Production backend config
    ├── main.tf             # Production infrastructure
    ├── variables.tf        # Variable definitions
    └── outputs.tf          # Output values
```

## Prerequisites

### 1. AWS CLI Configuration

Configure AWS CLI with the `codehornets` profile:

```bash
aws configure --profile codehornets
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ca-central-1`
- Default output format: `json`

Verify configuration:

```bash
aws sts get-caller-identity --profile codehornets
```

### 2. Terraform Installation

Install Terraform >= 1.5.0:

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Windows
choco install terraform
```

Verify installation:

```bash
terraform version
```

### 3. Create S3 Backend Resources

Before running Terraform, create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket painterflow-crm-terraform-state \
  --region ca-central-1 \
  --create-bucket-configuration LocationConstraint=ca-central-1 \
  --profile codehornets

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket painterflow-crm-terraform-state \
  --versioning-configuration Status=Enabled \
  --profile codehornets

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket painterflow-crm-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --profile codehornets

# Block public access
aws s3api put-public-access-block \
  --bucket painterflow-crm-terraform-state \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile codehornets

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name painterflow-crm-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ca-central-1 \
  --profile codehornets
```

## Deployment Guide

### Development Environment

Development environment uses:
- Single AZ (ca-central-1a)
- t3.small spot instances
- db.t3.micro database
- No encryption (for cost savings)
- 7-day retention

```bash
cd infrastructure/terraform/environments/dev

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply changes
terraform apply

# Get outputs
terraform output
```

### Staging Environment

Staging environment uses:
- 2 AZs (ca-central-1a, ca-central-1b)
- Mix of on-demand and spot instances
- db.t3.medium database
- Encryption enabled
- 30-day retention

```bash
cd infrastructure/terraform/environments/staging

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply changes
terraform apply

# Get outputs
terraform output
```

### Production Environment

Production environment uses:
- 3 AZs (ca-central-1a, ca-central-1b, ca-central-1d)
- Redundant NAT Gateways
- Multi-AZ RDS and Redis
- db.t3.large database
- Full encryption
- 90-day retention
- WAF enabled

```bash
cd infrastructure/terraform/environments/production

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply changes
terraform apply

# Get outputs
terraform output
```

## Important Configuration Notes

### Database Password

The database password is NOT stored in terraform.tfvars for security. Set it via environment variable:

```bash
export TF_VAR_db_password="your-secure-password"
```

Or store in AWS Secrets Manager and reference it in the Terraform configuration.

### Domain Configuration

Each environment has a domain name configured:
- **Dev:** `dev.crm.painterflow.com` (Route53 disabled, use IP)
- **Staging:** `staging.crm.painterflow.com` (Route53 enabled)
- **Production:** `crm.painterflow.com` (Route53 enabled)

You'll need to:
1. Own the domain `painterflow.com`
2. Create a hosted zone in Route53
3. Update nameservers at your domain registrar

### Configure kubectl

After EKS deployment, configure kubectl:

```bash
# Get the command from Terraform outputs
terraform output configure_kubectl

# Or run directly
aws eks update-kubeconfig \
  --region ca-central-1 \
  --name painterflow-crm-{environment} \
  --profile codehornets

# Verify connection
kubectl get nodes
```

## Cost Estimates

### Development (Monthly)
- **EKS Cluster:** ~$73 (cluster) + ~$15 (1x t3.small spot)
- **RDS:** ~$15 (db.t3.micro, 20GB)
- **ElastiCache:** ~$12 (cache.t3.micro)
- **NAT Gateway:** ~$32
- **Total:** ~$147/month

### Staging (Monthly)
- **EKS Cluster:** ~$73 + ~$60 (2x t3.medium + spot)
- **RDS:** ~$60 (db.t3.medium, 50GB, Multi-AZ: false)
- **ElastiCache:** ~$25 (2x cache.t3.micro)
- **NAT Gateway:** ~$32
- **Total:** ~$250/month

### Production (Monthly)
- **EKS Cluster:** ~$73 + ~$180 (3x t3.large + spot)
- **RDS:** ~$240 (db.t3.large, 100GB, Multi-AZ)
- **ElastiCache:** ~$110 (3x cache.t3.medium, Multi-AZ)
- **NAT Gateway:** ~$96 (3 AZs)
- **Total:** ~$700/month

*Add data transfer, S3 storage, and CloudWatch costs based on usage.*

## Terraform Commands Reference

```bash
# Initialize and download providers
terraform init

# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate

# Create execution plan
terraform plan

# Create execution plan and save to file
terraform plan -out=tfplan

# Apply saved plan
terraform apply tfplan

# Apply without confirmation (CI/CD)
terraform apply -auto-approve

# Show current state
terraform show

# List all resources
terraform state list

# Show specific resource
terraform state show module.eks.aws_eks_cluster.main

# Refresh state
terraform refresh

# Get outputs
terraform output

# Get specific output
terraform output eks_cluster_endpoint

# Destroy everything (WARNING: Destructive!)
terraform destroy

# Destroy specific resource
terraform destroy -target=module.s3["logs"]

# Import existing resource
terraform import module.eks.aws_eks_cluster.main my-cluster-name

# Graph dependencies
terraform graph | dot -Tpng > graph.png
```

## Troubleshooting

### Backend Initialization Fails

If `terraform init` fails with backend errors:

1. Verify S3 bucket exists:
   ```bash
   aws s3 ls s3://painterflow-crm-terraform-state --profile codehornets
   ```

2. Verify DynamoDB table exists:
   ```bash
   aws dynamodb describe-table \
     --table-name painterflow-crm-terraform-locks \
     --region ca-central-1 \
     --profile codehornets
   ```

3. Check AWS credentials:
   ```bash
   aws sts get-caller-identity --profile codehornets
   ```

### State Lock Issues

If you encounter state lock errors:

```bash
# Force unlock (use the Lock ID from the error message)
terraform force-unlock <LOCK_ID>
```

### Module Not Found

If modules are not found:

1. Verify module path is correct
2. Run `terraform init` to download modules
3. Check that referenced modules exist in `../../aws/modules/`

### Permission Errors

Ensure your AWS user/role has permissions for:
- EC2 (VPC, subnets, security groups)
- EKS (cluster, node groups)
- RDS (database instances)
- ElastiCache (Redis clusters)
- S3 (buckets)
- ECR (repositories)
- ELB (load balancers)
- CloudWatch (logs, alarms)
- IAM (roles, policies)

## Security Best Practices

1. **Never commit secrets** - Use environment variables or Secrets Manager
2. **Enable state encryption** - S3 bucket encryption is enabled
3. **Use state locking** - DynamoDB table prevents concurrent modifications
4. **Enable MFA for production** - Require MFA for production deployments
5. **Review plans carefully** - Always review `terraform plan` before applying
6. **Use workspace isolation** - Each environment has separate state
7. **Backup state files** - S3 versioning is enabled for state recovery

## Makefile Integration

Use the Makefile in the project root for common operations:

```bash
# Initialize Terraform for all environments
make terraform-init ENV=dev
make terraform-init ENV=staging
make terraform-init ENV=production

# Plan changes
make terraform-plan ENV=production

# Apply changes
make terraform-apply ENV=production

# Show outputs
make terraform-output ENV=production

# Destroy infrastructure (WARNING!)
make terraform-destroy ENV=dev
```

## Next Steps

After deploying infrastructure:

1. **Configure DNS** - Point domain to ALB
2. **Deploy Application** - Use Kubernetes manifests in `infrastructure/kubernetes/`
3. **Configure Monitoring** - Set up CloudWatch dashboards
4. **Enable Backups** - Verify automated backups are working
5. **Security Hardening** - Enable GuardDuty, Security Hub
6. **Cost Optimization** - Review and adjust instance sizes

## Related Documentation

- [Infrastructure README](../../README.md) - Main infrastructure documentation
- [Kubernetes Manifests](../../kubernetes/README.md) - K8s deployment
- [AWS Modules](../../aws/README.md) - AWS module documentation
- [Examples](../../examples/README.md) - Reference examples

---

**Last Updated:** 2025-10-30
**Terraform Version:** >= 1.5.0
**AWS Provider Version:** ~> 5.0
**Region:** ca-central-1 (Canada Central)
**AWS Profile:** codehornets
