# ElastiCache Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_id" {
  description = "The cluster identifier"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ElastiCache cluster will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the cache subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the cache"
  type        = list(string)
  default     = []
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to access the cache"
  type        = list(string)
  default     = []
}

# Engine Configuration
variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "parameter_family" {
  description = "Redis parameter group family"
  type        = string
  default     = "redis7"
}

# Node Configuration
variable "node_type" {
  description = "The instance type of the cache nodes"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (for non-cluster mode)"
  type        = number
  default     = 1
}

# Cluster Mode Configuration
variable "cluster_mode_enabled" {
  description = "Enable Redis Cluster Mode"
  type        = bool
  default     = false
}

variable "num_node_groups" {
  description = "Number of node groups (shards) for Redis Cluster Mode"
  type        = number
  default     = 1
}

variable "replicas_per_node_group" {
  description = "Number of replica nodes per shard"
  type        = number
  default     = 1
}

# High Availability
variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

# Backup Configuration
variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 5
}

variable "snapshot_window" {
  description = "Daily time window for snapshots"
  type        = string
  default     = "03:00-05:00"
}

variable "final_snapshot_identifier" {
  description = "Name of the final snapshot on deletion"
  type        = string
  default     = null
}

# Maintenance
variable "maintenance_window" {
  description = "Weekly time window for maintenance"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

# Security
variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = false
}

variable "auth_token" {
  description = "Auth token for transit encryption"
  type        = string
  sensitive   = true
  default     = null
}

variable "auth_token_update_strategy" {
  description = "Strategy for updating auth token"
  type        = string
  default     = "ROTATE"
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (if not provided, a new one will be created)"
  type        = string
  default     = null
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_engine_log" {
  description = "Enable engine log delivery to CloudWatch"
  type        = bool
  default     = false
}

# Performance
variable "data_tiering_enabled" {
  description = "Enable data tiering to SSD (for r6gd nodes)"
  type        = bool
  default     = false
}

# Parameter Settings
variable "maxmemory_policy" {
  description = "How Redis will select what to remove when maxmemory is reached"
  type        = string
  default     = "volatile-lru"
}

variable "timeout" {
  description = "Close the connection after a client is idle for N seconds"
  type        = string
  default     = "0"
}

variable "databases" {
  description = "Number of databases"
  type        = string
  default     = "16"
}

variable "notify_keyspace_events" {
  description = "Keyspace events notifications"
  type        = string
  default     = ""
}

variable "additional_parameters" {
  description = "Additional Redis parameters"
  type        = map(string)
  default     = {}
}

# CloudWatch Alarms
variable "create_cloudwatch_alarms" {
  description = "Create CloudWatch alarms"
  type        = bool
  default     = true
}

variable "alarm_cpu_threshold" {
  description = "CPU utilization threshold for alarm (%)"
  type        = number
  default     = 75
}

variable "alarm_memory_threshold" {
  description = "Memory usage threshold for alarm (%)"
  type        = number
  default     = 90
}

variable "alarm_evictions_threshold" {
  description = "Evictions threshold for alarm"
  type        = number
  default     = 100
}

variable "alarm_connections_threshold" {
  description = "Connections threshold for alarm"
  type        = number
  default     = 500
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

# Other Settings
variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = false
}

variable "store_auth_token_in_secrets_manager" {
  description = "Store auth token in AWS Secrets Manager"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}