# HandyMate EKS Deployment

This directory contains Terraform configuration for deploying HandyMate using AWS EKS (Kubernetes).

## Quick Start

```bash
# Initialize
terraform init

# Plan
terraform plan -var-file="terraform.tfvars"

# Apply
terraform apply -var-file="terraform.tfvars"
```

## Architecture

- EKS cluster for Kubernetes orchestration
- EC2 node groups for compute
- RDS MySQL for central registry
- ElastiCache Redis for caching
- S3 for tenant storage

## Files

- `main.tf` - Main EKS infrastructure
- `variables.tf` - Variable definitions
- `terraform.tfvars.example` - Example variables
