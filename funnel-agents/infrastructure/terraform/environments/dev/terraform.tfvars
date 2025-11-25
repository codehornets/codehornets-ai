# =============================================================================
# FunnelAgents - Development Environment Configuration
# =============================================================================

# Environment
environment  = "dev"
project_name = "funnelagents"

# AWS Configuration
aws_region  = "us-east-1"
aws_profile = "default"

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
availability_zones   = ["us-east-1a"]  # Single AZ for dev

private_subnet_cidrs = [
  "10.2.1.0/24"    # us-east-1a only
]

public_subnet_cidrs = [
  "10.2.101.0/24"  # us-east-1a only
]

database_subnet_cidrs = [
  "10.2.201.0/24", # us-east-1a
  "10.2.202.0/24"  # us-east-1b (required minimum 2 for RDS)
]

# Single NAT Gateway for cost savings
enable_nat_gateway = true
single_nat_gateway = true

# EKS Cluster Configuration
cluster_name    = "funnelagents-dev"
cluster_version = "1.29"

# EKS Node Groups - Minimal for dev
node_groups = {
  general = {
    desired_size   = 2
    max_size       = 4
    min_size       = 1
    instance_types = ["t3.medium"]
    capacity_type  = "SPOT"  # All SPOT for dev to save costs
    disk_size      = 30
    labels = {
      role        = "general"
      environment = "dev"
    }
  }
}

# RDS PostgreSQL Configuration
db_instance_class                   = "db.t3.micro"
db_allocated_storage                = 20
db_max_allocated_storage            = 100
db_engine_version                   = "16.1"
db_name                             = "funnel_agents_dev"
db_username                         = "funnel_agents_admin"
db_multi_az                         = false
db_backup_retention_period          = 1
db_backup_window                    = "03:00-04:00"
db_maintenance_window               = "mon:04:00-mon:05:00"
db_deletion_protection              = false
db_skip_final_snapshot              = true
db_performance_insights_enabled     = false
db_enabled_cloudwatch_logs_exports  = ["postgresql"]

# ElastiCache Redis Configuration
redis_node_type                  = "cache.t3.micro"
redis_num_cache_nodes            = 1
redis_parameter_group_family     = "redis7"
redis_engine_version             = "7.0"
redis_port                       = 6379
redis_automatic_failover_enabled = false
redis_multi_az_enabled           = false
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_snapshot_retention_limit   = 0
redis_snapshot_window            = "03:00-05:00"

# S3 Bucket Configuration
s3_buckets = {
  uploads = {
    name       = "funnelagents-dev-uploads"
    versioning = false
    lifecycle_rules = [{
      id              = "delete-old-files"
      enabled         = true
      expiration_days = 30
    }]
  }

  backups = {
    name       = "funnelagents-dev-backups"
    versioning = false
    lifecycle_rules = [{
      id              = "delete-old-backups"
      enabled         = true
      expiration_days = 14
    }]
  }

  logs = {
    name       = "funnelagents-dev-logs"
    versioning = false
    lifecycle_rules = [{
      id              = "delete-old-logs"
      enabled         = true
      expiration_days = 7
    }]
  }
}

# Application Load Balancer
alb_name                       = "funnelagents-dev-alb"
alb_internal                   = false
alb_enable_deletion_protection = false
alb_enable_http2               = true
alb_enable_waf                 = false
alb_ssl_policy                 = "ELBSecurityPolicy-TLS13-1-2-2021-06"

# Domain Configuration
domain_name    = ""
enable_route53 = false  # Use IP for dev

# Monitoring & Logging
enable_cloudwatch_logs     = true
enable_container_insights  = false
log_retention_days         = 7

# Backup Configuration
enable_automated_backups = false
backup_schedule          = "cron(0 3 * * ? *)"

# Tags
tags = {
  Environment        = "dev"
  Project            = "FunnelAgents"
  ManagedBy          = "Terraform"
  CostCenter         = "Engineering"
  DataClassification = "Internal"
  AutoShutdown       = "true"
}

# Cost Optimization
enable_spot_instances     = true
enable_auto_scaling       = false
enable_cluster_autoscaler = true

# Security
enable_encryption_at_rest = true
enable_secrets_manager    = true
enable_guardduty          = false
enable_security_hub       = false
