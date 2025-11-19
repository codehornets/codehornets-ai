# PainterFlow CRM - Production Environment Configuration
# Region: ca-central-1 (Canada Central - following company pattern)

# Environment
environment = "production"
project_name = "codehornets-painterflow-crm"

# AWS Configuration
aws_region = "ca-central-1"
aws_profile = "codehornets"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["ca-central-1a", "ca-central-1b", "ca-central-1d"]

private_subnet_cidrs = [
  "10.0.1.0/24",   # ca-central-1a
  "10.0.2.0/24",   # ca-central-1b
  "10.0.3.0/24"    # ca-central-1d
]

public_subnet_cidrs = [
  "10.0.101.0/24", # ca-central-1a
  "10.0.102.0/24", # ca-central-1b
  "10.0.103.0/24"  # ca-central-1d
]

database_subnet_cidrs = [
  "10.0.201.0/24", # ca-central-1a
  "10.0.202.0/24", # ca-central-1b
  "10.0.203.0/24"  # ca-central-1d
]

# Enable NAT Gateway per AZ for high availability
enable_nat_gateway = true
single_nat_gateway = false  # Multi-AZ NAT for production

# EKS Cluster Configuration
cluster_name = "codehornets-painterflow-crm-production"
cluster_version = "1.28"

# EKS Node Groups
node_groups = {
  general = {
    desired_size   = 3
    max_size       = 10
    min_size       = 2
    instance_types = ["t3.large"]
    capacity_type  = "ON_DEMAND"
    disk_size      = 50
    labels = {
      role = "general"
      environment = "production"
    }
  }

  spot = {
    desired_size   = 2
    max_size       = 20
    min_size       = 0
    instance_types = ["t3.large", "t3a.large", "t3.xlarge"]
    capacity_type  = "SPOT"
    disk_size      = 50
    labels = {
      role = "spot-workers"
      environment = "production"
    }
    taints = [{
      key    = "spot"
      value  = "true"
      effect = "NoSchedule"
    }]
  }
}

# RDS MySQL Configuration
db_instance_class = "db.t3.large"
db_allocated_storage = 100
db_max_allocated_storage = 500
db_engine_version = "8.0.35"
db_name = "painterflow_crm"
db_username = "painterflow_admin"
# db_password should be set via environment variable or secrets manager
db_multi_az = true
db_backup_retention_period = 30
db_backup_window = "03:00-04:00"
db_maintenance_window = "mon:04:00-mon:05:00"
db_deletion_protection = true
db_skip_final_snapshot = false
db_performance_insights_enabled = true
db_enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

# ElastiCache Redis Configuration
redis_node_type = "cache.t3.medium"
redis_num_cache_nodes = 3
redis_parameter_group_family = "redis7"
redis_engine_version = "7.0"
redis_port = 6379
redis_automatic_failover_enabled = true
redis_multi_az_enabled = true
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_snapshot_retention_limit = 7
redis_snapshot_window = "03:00-05:00"

# S3 Bucket Configuration
s3_buckets = {
  uploads = {
    name = "codehornets-painterflow-crm-production-uploads"
    versioning = true
    lifecycle_rules = [{
      id = "transition-to-ia"
      enabled = true
      transition_days = 90
      transition_storage_class = "INTELLIGENT_TIERING"
    }]
  }

  backups = {
    name = "codehornets-painterflow-crm-production-backups"
    versioning = true
    lifecycle_rules = [{
      id = "archive-old-backups"
      enabled = true
      transition_days = 30
      transition_storage_class = "GLACIER"
      expiration_days = 365
    }]
  }

  logs = {
    name = "codehornets-painterflow-crm-production-logs"
    versioning = false
    lifecycle_rules = [{
      id = "delete-old-logs"
      enabled = true
      expiration_days = 90
    }]
  }
}

# Application Load Balancer
alb_name = "codehornets-painterflow-crm-production-alb"
alb_internal = false
alb_enable_deletion_protection = true
alb_enable_http2 = true
alb_enable_waf = true
alb_ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"

# Domain Configuration
domain_name = "crm.painterflow.com"
enable_route53 = true

# Monitoring & Logging
enable_cloudwatch_logs = true
enable_container_insights = true
log_retention_days = 90

# Backup Configuration
enable_automated_backups = true
backup_schedule = "cron(0 3 * * ? *)"  # 3 AM UTC daily

# Tags
tags = {
  Environment     = "production"
  Project         = "PainterFlow CRM"
  BusinessUnit    = "Codehornets"
  ManagedBy       = "Terraform"
  CostCenter      = "Engineering"
  DataClassification = "Confidential"
  Compliance      = "SOC2"
}

# Cost Optimization
enable_spot_instances = true
enable_auto_scaling = true
enable_cluster_autoscaler = true

# Security
enable_encryption_at_rest = true
enable_secrets_manager = true
enable_guardduty = true
enable_security_hub = false  # Enable after initial setup
