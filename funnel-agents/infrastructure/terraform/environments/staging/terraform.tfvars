# PainterFlow CRM - Staging Environment Configuration
# Region: ca-central-1 (Canada Central)

# Environment
environment = "staging"
project_name = "codehornets-painterflow-crm"

# AWS Configuration
aws_region = "ca-central-1"
aws_profile = "codehornets"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
availability_zones = ["ca-central-1a", "ca-central-1b"]  # 2 AZs for cost savings

private_subnet_cidrs = [
  "10.1.1.0/24",   # ca-central-1a
  "10.1.2.0/24"    # ca-central-1b
]

public_subnet_cidrs = [
  "10.1.101.0/24", # ca-central-1a
  "10.1.102.0/24"  # ca-central-1b
]

database_subnet_cidrs = [
  "10.1.201.0/24", # ca-central-1a
  "10.1.202.0/24"  # ca-central-1b
]

# Single NAT Gateway for cost savings
enable_nat_gateway = true
single_nat_gateway = true  # Single NAT for staging

# EKS Cluster Configuration
cluster_name = "codehornets-painterflow-crm-staging"
cluster_version = "1.28"

# EKS Node Groups - Smaller for staging
node_groups = {
  general = {
    desired_size   = 2
    max_size       = 5
    min_size       = 1
    instance_types = ["t3.medium"]
    capacity_type  = "ON_DEMAND"
    disk_size      = 30
    labels = {
      role = "general"
      environment = "staging"
    }
  }

  spot = {
    desired_size   = 1
    max_size       = 10
    min_size       = 0
    instance_types = ["t3.medium", "t3a.medium"]
    capacity_type  = "SPOT"
    disk_size      = 30
    labels = {
      role = "spot-workers"
      environment = "staging"
    }
    taints = [{
      key    = "spot"
      value  = "true"
      effect = "NoSchedule"
    }]
  }
}

# RDS MySQL Configuration - Smaller instance
db_instance_class = "db.t3.medium"
db_allocated_storage = 50
db_max_allocated_storage = 200
db_engine_version = "8.0.35"
db_name = "painterflow_crm_staging"
db_username = "painterflow_admin"
db_multi_az = false  # Single AZ for staging
db_backup_retention_period = 7
db_backup_window = "03:00-04:00"
db_maintenance_window = "mon:04:00-mon:05:00"
db_deletion_protection = false
db_skip_final_snapshot = true
db_performance_insights_enabled = false
db_enabled_cloudwatch_logs_exports = ["error", "slowquery"]

# ElastiCache Redis Configuration - Smaller
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 2
redis_parameter_group_family = "redis7"
redis_engine_version = "7.0"
redis_port = 6379
redis_automatic_failover_enabled = true
redis_multi_az_enabled = false
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_snapshot_retention_limit = 3
redis_snapshot_window = "03:00-05:00"

# S3 Bucket Configuration
s3_buckets = {
  uploads = {
    name = "codehornets-painterflow-crm-staging-uploads"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-files"
      enabled = true
      expiration_days = 30
    }]
  }

  backups = {
    name = "codehornets-painterflow-crm-staging-backups"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-backups"
      enabled = true
      expiration_days = 30
    }]
  }

  logs = {
    name = "codehornets-painterflow-crm-staging-logs"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-logs"
      enabled = true
      expiration_days = 30
    }]
  }
}

# Application Load Balancer
alb_name = "codehornets-painterflow-crm-staging-alb"
alb_internal = false
alb_enable_deletion_protection = false
alb_enable_http2 = true
alb_enable_waf = false  # Disabled for cost savings
alb_ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"

# Domain Configuration
domain_name = "staging.crm.painterflow.com"
enable_route53 = true

# Monitoring & Logging
enable_cloudwatch_logs = true
enable_container_insights = false  # Disabled for cost savings
log_retention_days = 30

# Backup Configuration
enable_automated_backups = true
backup_schedule = "cron(0 3 * * ? *)"  # 3 AM UTC daily

# Tags
tags = {
  Environment     = "staging"
  Project         = "PainterFlow CRM"
  BusinessUnit    = "Codehornets"
  ManagedBy       = "Terraform"
  CostCenter      = "Engineering"
  DataClassification = "Internal"
}

# Cost Optimization
enable_spot_instances = true
enable_auto_scaling = true
enable_cluster_autoscaler = false  # Manual scaling for staging

# Security
enable_encryption_at_rest = true
enable_secrets_manager = true
enable_guardduty = false
enable_security_hub = false
