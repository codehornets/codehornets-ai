# ElastiCache Module Outputs

# Primary Endpoint
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value = var.cluster_mode_enabled || var.automatic_failover_enabled ? (
    var.cluster_mode_enabled ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : aws_elasticache_replication_group.main[0].primary_endpoint_address
    ) : (
    length(aws_elasticache_cluster.main) > 0 ? aws_elasticache_cluster.main[0].cache_nodes[0].address : null
  )
}

# Configuration Endpoint (for cluster mode)
output "configuration_endpoint" {
  description = "Configuration endpoint for Redis Cluster Mode"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : null
}

# Primary Endpoint Address
output "primary_endpoint_address" {
  description = "Primary endpoint address for replication group"
  value       = var.automatic_failover_enabled && !var.cluster_mode_enabled ? aws_elasticache_replication_group.main[0].primary_endpoint_address : null
}

# Reader Endpoint Address
output "reader_endpoint_address" {
  description = "Reader endpoint address for replication group"
  value       = var.automatic_failover_enabled && !var.cluster_mode_enabled ? aws_elasticache_replication_group.main[0].reader_endpoint_address : null
}

# Member Clusters
output "member_clusters" {
  description = "List of member cluster IDs"
  value       = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].member_clusters : []
}

# Port
output "port" {
  description = "Redis port"
  value       = 6379
}

# Security Group
output "security_group_id" {
  description = "Security group ID for the Redis cluster"
  value       = aws_security_group.redis.id
}

# Subnet Group
output "subnet_group_name" {
  description = "Name of the cache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

# Parameter Group
output "parameter_group_name" {
  description = "Name of the parameter group"
  value       = aws_elasticache_parameter_group.main.name
}

# Cluster/Replication Group ID
output "cluster_id" {
  description = "The cluster/replication group identifier"
  value       = var.cluster_id
}

# ARN
output "arn" {
  description = "ARN of the ElastiCache cluster/replication group"
  value = var.cluster_mode_enabled || var.automatic_failover_enabled ? (
    aws_elasticache_replication_group.main[0].arn
    ) : (
    length(aws_elasticache_cluster.main) > 0 ? aws_elasticache_cluster.main[0].arn : null
  )
}

# Engine Version
output "engine_version" {
  description = "Redis engine version"
  value       = var.engine_version
}

# Node Type
output "node_type" {
  description = "Cache node type"
  value       = var.node_type
}

# Number of Cache Nodes
output "num_cache_nodes" {
  description = "Number of cache nodes"
  value       = var.cluster_mode_enabled ? (var.num_node_groups * (var.replicas_per_node_group + 1)) : var.num_cache_nodes
}

# Cluster Mode Details
output "cluster_enabled" {
  description = "Whether cluster mode is enabled"
  value       = var.cluster_mode_enabled
}

output "num_node_groups" {
  description = "Number of node groups (shards)"
  value       = var.cluster_mode_enabled ? var.num_node_groups : null
}

output "replicas_per_node_group" {
  description = "Number of replicas per node group"
  value       = var.cluster_mode_enabled ? var.replicas_per_node_group : null
}

# High Availability
output "automatic_failover_enabled" {
  description = "Whether automatic failover is enabled"
  value       = var.automatic_failover_enabled
}

output "multi_az_enabled" {
  description = "Whether Multi-AZ is enabled"
  value       = var.multi_az_enabled
}

# Encryption
output "at_rest_encryption_enabled" {
  description = "Whether encryption at rest is enabled"
  value       = var.at_rest_encryption_enabled
}

output "transit_encryption_enabled" {
  description = "Whether encryption in transit is enabled"
  value       = var.transit_encryption_enabled
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.at_rest_encryption_enabled ? (var.kms_key_id != null ? var.kms_key_id : try(aws_kms_key.redis[0].arn, null)) : null
}

# Backup
output "snapshot_retention_limit" {
  description = "Number of days snapshots are retained"
  value       = var.snapshot_retention_limit
}

output "snapshot_window" {
  description = "Daily snapshot window"
  value       = var.snapshot_window
}

# Logging
output "log_delivery_configuration" {
  description = "Log delivery configuration"
  value = var.cluster_mode_enabled || var.automatic_failover_enabled ? (
    aws_elasticache_replication_group.main[0].log_delivery_configuration
  ) : []
}

output "slow_log_group_name" {
  description = "CloudWatch log group name for slow logs"
  value       = aws_cloudwatch_log_group.redis_slow.name
}

output "engine_log_group_name" {
  description = "CloudWatch log group name for engine logs"
  value       = var.enable_engine_log ? aws_cloudwatch_log_group.redis_engine[0].name : null
}

# Secrets Manager
output "auth_token_secret_arn" {
  description = "ARN of Secrets Manager secret containing auth token"
  value       = var.transit_encryption_enabled && var.store_auth_token_in_secrets_manager ? aws_secretsmanager_secret.redis_auth[0].arn : null
}

output "auth_token_secret_name" {
  description = "Name of Secrets Manager secret containing auth token"
  value       = var.transit_encryption_enabled && var.store_auth_token_in_secrets_manager ? aws_secretsmanager_secret.redis_auth[0].name : null
}

# CloudWatch Alarms
output "alarm_cpu_high_name" {
  description = "Name of CPU high alarm"
  value       = var.create_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_high[0].alarm_name : null
}

output "alarm_memory_high_name" {
  description = "Name of memory high alarm"
  value       = var.create_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.memory_high[0].alarm_name : null
}

output "alarm_evictions_high_name" {
  description = "Name of evictions high alarm"
  value       = var.create_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.evictions_high[0].alarm_name : null
}

output "alarm_connections_high_name" {
  description = "Name of connections high alarm"
  value       = var.create_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.connections_high[0].alarm_name : null
}