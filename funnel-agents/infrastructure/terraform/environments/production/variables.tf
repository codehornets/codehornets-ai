# PainterFlow CRM - Production Variables
# Variable definitions for production environment

# Environment
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

# AWS Configuration
variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_profile" {
  description = "AWS CLI profile"
  type        = string
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway"
  type        = bool
}

# EKS Configuration
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "EKS cluster version"
  type        = string
}

variable "node_groups" {
  description = "EKS node groups configuration"
  type        = any
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
}

variable "db_max_allocated_storage" {
  description = "RDS max allocated storage in GB"
  type        = number
}

variable "db_engine_version" {
  description = "MySQL engine version"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
}

variable "db_backup_window" {
  description = "Preferred backup window"
  type        = string
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
}

variable "db_performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
}

variable "db_enabled_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
}

# ElastiCache Redis Configuration
variable "redis_node_type" {
  description = "Redis node type"
  type        = string
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
}

variable "redis_parameter_group_family" {
  description = "Redis parameter group family"
  type        = string
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
}

variable "redis_automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
}

variable "redis_multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
}

variable "redis_at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
}

variable "redis_transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
}

variable "redis_snapshot_retention_limit" {
  description = "Snapshot retention limit in days"
  type        = number
}

variable "redis_snapshot_window" {
  description = "Snapshot window"
  type        = string
}

# S3 Configuration
variable "s3_buckets" {
  description = "S3 buckets configuration"
  type        = any
}

# ALB Configuration
variable "alb_name" {
  description = "ALB name"
  type        = string
}

variable "alb_internal" {
  description = "Is ALB internal"
  type        = bool
}

variable "alb_enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
}

variable "alb_enable_http2" {
  description = "Enable HTTP/2"
  type        = bool
}

variable "alb_enable_waf" {
  description = "Enable WAF"
  type        = bool
}

variable "alb_ssl_policy" {
  description = "SSL policy"
  type        = string
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "enable_route53" {
  description = "Enable Route53"
  type        = bool
}

# Monitoring & Logging
variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logs"
  type        = bool
}

variable "enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
}

# Backup Configuration
variable "enable_automated_backups" {
  description = "Enable automated backups"
  type        = bool
}

variable "backup_schedule" {
  description = "Backup schedule (cron expression)"
  type        = string
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances"
  type        = bool
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling"
  type        = bool
}

variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler"
  type        = bool
}

# Security
variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest"
  type        = bool
}

variable "enable_secrets_manager" {
  description = "Enable Secrets Manager"
  type        = bool
}

variable "enable_guardduty" {
  description = "Enable GuardDuty"
  type        = bool
}

variable "enable_security_hub" {
  description = "Enable Security Hub"
  type        = bool
}

# Tags
variable "tags" {
  description = "Common tags"
  type        = map(string)
}

# Optional: Alarm email
variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
  default     = ""
}
