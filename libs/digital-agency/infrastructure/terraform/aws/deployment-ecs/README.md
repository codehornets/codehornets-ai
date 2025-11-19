# HandyMate ECS Deployment

This directory contains Terraform configuration for deploying HandyMate using AWS ECS Fargate.

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

- ECS Fargate for container orchestration
- Application Load Balancer for routing
- RDS MySQL for database
- ElastiCache Redis for caching/queues
- ECR for container images

## Files

- `main.tf` - Main ECS infrastructure
- `ecs-services.tf` - ECS service definitions
- `variables.tf` - Variable definitions
- `terraform.tfvars.example` - Example variables
