# Krayin CRM - AWS Infrastructure
# Multi-tenant scalable deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  # Remote state storage (uncomment and configure)
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "krayin/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Krayin CRM"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "../modules/vpc"

  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = data.aws_availability_zones.available.names
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
}

# EKS Cluster Module
module "eks" {
  source = "../modules/eks"

  environment        = var.environment
  cluster_name       = var.cluster_name
  cluster_version    = var.cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  node_groups = var.node_groups
}

# RDS Central Registry (stores tenant metadata)
module "rds_central" {
  source = "../modules/rds"

  environment         = var.environment
  identifier          = "${var.environment}-krayin-central"
  instance_class      = var.central_db_instance_class
  allocated_storage   = 100
  engine_version      = "8.0.35"
  database_name       = "krayin_central"
  master_username     = var.central_db_username
  master_password     = var.central_db_password
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs

  backup_retention_period = 7
  multi_az                = var.environment == "production" ? true : false
  skip_final_snapshot     = var.environment != "production"
}

# ElastiCache Redis Cluster
module "elasticache" {
  source = "../modules/elasticache"

  environment         = var.environment
  cluster_id          = "${var.environment}-krayin-redis"
  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_nodes
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs
}

# S3 Buckets for tenant storage
module "s3" {
  source = "../modules/s3"

  environment       = var.environment
  bucket_prefix     = "krayin"
  enable_versioning = var.environment == "production"
  lifecycle_rules   = var.s3_lifecycle_rules
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "central_db_endpoint" {
  description = "Central RDS endpoint"
  value       = module.rds_central.db_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.elasticache.redis_endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket for tenant storage"
  value       = module.s3.bucket_name
}
