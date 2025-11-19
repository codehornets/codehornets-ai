# PainterFlow CRM - Development Environment Configuration
# Region: ca-central-1 (Canada Central)

# Environment
environment = "dev"
project_name = "codehornets-painterflow-crm"

# AWS Configuration
aws_region = "ca-central-1"
aws_profile = "codehornets"

# VPC Configuration
vpc_cidr = "10.2.0.0/16"
availability_zones = ["ca-central-1a"]  # Single AZ for dev

private_subnet_cidrs = [
  "10.2.1.0/24"    # ca-central-1a only
]

public_subnet_cidrs = [
  "10.2.101.0/24"  # ca-central-1a only
]

database_subnet_cidrs = [
  "10.2.201.0/24", # ca-central-1a
  "10.2.202.0/24"  # ca-central-1b (required minimum 2 for RDS)
]

# Single NAT Gateway for cost savings
enable_nat_gateway = true
single_nat_gateway = true

# EKS Cluster Configuration
cluster_name = "codehornets-painterflow-crm-dev"
cluster_version = "1.28"

# EKS Node Groups - Minimal for dev
node_groups = {
  general = {
    desired_size   = 1
    max_size       = 3
    min_size       = 1
    instance_types = ["t3.small"]
    capacity_type  = "SPOT"  # All SPOT for dev to save costs
    disk_size      = 20
    labels = {
      role = "general"
      environment = "dev"
    }
  }
}

# RDS MySQL Configuration - Smallest instance
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 100
db_engine_version = "8.0.35"
db_name = "painterflow_crm_dev"
db_username = "painterflow_admin"
db_multi_az = false
db_backup_retention_period = 1
db_backup_window = "03:00-04:00"
db_maintenance_window = "mon:04:00-mon:05:00"
db_deletion_protection = false
db_skip_final_snapshot = true
db_performance_insights_enabled = false
db_enabled_cloudwatch_logs_exports = ["error"]

# ElastiCache Redis Configuration - Smallest
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1
redis_parameter_group_family = "redis7"
redis_engine_version = "7.0"
redis_port = 6379
redis_automatic_failover_enabled = false
redis_multi_az_enabled = false
redis_at_rest_encryption_enabled = false  # Disabled for dev
redis_transit_encryption_enabled = false   # Disabled for dev
redis_snapshot_retention_limit = 0
redis_snapshot_window = "03:00-05:00"

# S3 Bucket Configuration
s3_buckets = {
  uploads = {
    name = "codehornets-painterflow-crm-dev-uploads"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-files"
      enabled = true
      expiration_days = 7
    }]
  }

  backups = {
    name = "codehornets-painterflow-crm-dev-backups"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-backups"
      enabled = true
      expiration_days = 7
    }]
  }

  logs = {
    name = "codehornets-painterflow-crm-dev-logs"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-logs"
      enabled = true
      expiration_days = 7
    }]
  }
}

# Application Load Balancer
alb_name = "codehornets-painterflow-crm-dev-alb"
alb_internal = false
alb_enable_deletion_protection = false
alb_enable_http2 = true
alb_enable_waf = false
alb_ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"

# Domain Configuration
domain_name = "dev.crm.painterflow.com"
enable_route53 = false  # Use IP for dev

# Monitoring & Logging
enable_cloudwatch_logs = false  # Disabled for dev
enable_container_insights = false
log_retention_days = 7

# Backup Configuration
enable_automated_backups = false  # Manual backups for dev
backup_schedule = "cron(0 3 * * ? *)"

# Tags
tags = {
  Environment     = "dev"
  Project         = "PainterFlow CRM"
  BusinessUnit    = "Codehornets"
  ManagedBy       = "Terraform"
  CostCenter      = "Engineering"
  DataClassification = "Public"
  AutoShutdown    = "true"  # Can be shut down after hours
}

# Cost Optimization
enable_spot_instances = true
enable_auto_scaling = false
enable_cluster_autoscaler = false

# Security
enable_encryption_at_rest = false
enable_secrets_manager = false  # Use environment variables for dev
enable_guardduty = false
enable_security_hub = false
