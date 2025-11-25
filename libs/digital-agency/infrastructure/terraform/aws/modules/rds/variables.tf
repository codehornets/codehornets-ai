# RDS Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "identifier" {
  description = "The name of the RDS instance"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the RDS instance will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the database"
  type        = list(string)
  default     = []
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to access the database"
  type        = list(string)
  default     = []
}

# Engine Configuration
variable "engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.35"
}

variable "parameter_family" {
  description = "DB parameter group family"
  type        = string
  default     = "mysql8.0"
}

variable "major_engine_version" {
  description = "Major engine version for option group"
  type        = string
  default     = "8.0"
}

# Instance Configuration
variable "instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "The allocated storage in gigabytes"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling"
  type        = number
  default     = 1000
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1)"
  type        = string
  default     = "gp3"
}

variable "iops" {
  description = "The amount of provisioned IOPS (for io1/gp3 storage type)"
  type        = number
  default     = 3000
}

variable "storage_throughput" {
  description = "Storage throughput in MiBps (for gp3 storage type)"
  type        = number
  default     = 125
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (if not provided, a new one will be created)"
  type        = string
  default     = null
}

# Database Configuration
variable "database_name" {
  description = "The name of the database to create"
  type        = string
  default     = "painterflow"
}

variable "master_username" {
  description = "The master username for the database"
  type        = string
  default     = "admin"
}

variable "master_password" {
  description = "The master password for the database (if not provided, will be generated)"
  type        = string
  sensitive   = true
  default     = null
}

# High Availability
variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "availability_zone" {
  description = "The availability zone for single-AZ deployments"
  type        = string
  default     = null
}

# Backup Configuration
variable "backup_retention_period" {
  description = "The days to retain backups for (0-35)"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "The daily time range during which automated backups are created"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "The weekly time range during which system maintenance can occur"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "skip_final_snapshot" {
  description = "Skip the final DB snapshot when the instance is deleted"
  type        = bool
  default     = false
}

variable "delete_automated_backups" {
  description = "Delete automated backups when the DB instance is deleted"
  type        = bool
  default     = true
}

# Monitoring
variable "enabled_cloudwatch_logs_exports" {
  description = "List of log types to export to CloudWatch"
  type        = list(string)
  default     = ["error", "general", "slowquery"]
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights data retention period in days"
  type        = number
  default     = 7
}

variable "performance_insights_kms_key_id" {
  description = "KMS key ID for Performance Insights"
  type        = string
  default     = null
}

variable "monitoring_interval" {
  description = "The interval for collecting enhanced monitoring metrics (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60
}

# Read Replicas
variable "create_read_replicas" {
  description = "Create read replicas"
  type        = bool
  default     = false
}

variable "read_replica_count" {
  description = "Number of read replicas to create"
  type        = number
  default     = 0
}

variable "read_replica_instance_class" {
  description = "Instance class for read replicas (if different from primary)"
  type        = string
  default     = null
}

# CloudWatch Alarms
variable "create_cloudwatch_alarms" {
  description = "Create CloudWatch alarms for the database"
  type        = bool
  default     = true
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "alarm_connections_threshold" {
  description = "Database connections threshold for alarm"
  type        = number
  default     = 80
}

variable "alarm_free_storage_threshold" {
  description = "Free storage space threshold for alarm (in bytes)"
  type        = number
  default     = 10737418240 # 10GB
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

# Parameter Group Settings
variable "max_connections" {
  description = "Maximum number of database connections"
  type        = string
  default     = "500"
}

variable "innodb_buffer_pool_size" {
  description = "InnoDB buffer pool size"
  type        = string
  default     = "{DBInstanceClassMemory*3/4}"
}

variable "log_queries_not_using_indexes" {
  description = "Log queries not using indexes"
  type        = string
  default     = "1"
}

# Other Settings
variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "ca_cert_identifier" {
  description = "CA certificate identifier"
  type        = string
  default     = "rds-ca-2019"
}

variable "store_password_in_secrets_manager" {
  description = "Store the database password in AWS Secrets Manager"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for the RDS instance"
  type        = map(string)
  default     = {}
}