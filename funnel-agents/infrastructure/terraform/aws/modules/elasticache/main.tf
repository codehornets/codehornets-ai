# ElastiCache Redis Module - Production-Ready Configuration

locals {
  is_production   = var.environment == "production"
  is_cluster_mode = var.cluster_mode_enabled

  common_tags = {
    Module      = "elasticache"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Engine      = "Redis"
  }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-subnet-group"
    }
  )
}

# Security Group
resource "aws_security_group" "redis" {
  name_prefix = "${var.cluster_id}-"
  vpc_id      = var.vpc_id
  description = "Security group for ElastiCache Redis ${var.cluster_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group Rules
resource "aws_security_group_rule" "redis_ingress" {
  for_each = { for idx, cidr in var.allowed_cidr_blocks : idx => cidr }

  type              = "ingress"
  from_port         = 6379
  to_port           = 6379
  protocol          = "tcp"
  cidr_blocks       = [each.value]
  security_group_id = aws_security_group.redis.id
  description       = "Redis access from ${each.value}"
}

resource "aws_security_group_rule" "redis_ingress_security_groups" {
  for_each = { for idx, sg_id in var.allowed_security_group_ids : idx => sg_id }

  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.redis.id
  description              = "Redis access from security group"
}

resource "aws_security_group_rule" "redis_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.redis.id
  description       = "Allow all outbound traffic"
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.cluster_id}-params"
  family = var.parameter_family

  # Laravel optimized parameters
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  parameter {
    name  = "timeout"
    value = var.timeout
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "tcp-backlog"
    value = "511"
  }

  dynamic "parameter" {
    for_each = var.cluster_mode_enabled ? [1] : []
    content {
      name  = "cluster-enabled"
      value = "yes"
    }
  }

  parameter {
    name  = "notify-keyspace-events"
    value = var.notify_keyspace_events
  }

  # Performance tuning
  parameter {
    name  = "slowlog-log-slower-than"
    value = "10000" # 10ms
  }

  parameter {
    name  = "slowlog-max-len"
    value = "512"
  }

  parameter {
    name  = "databases"
    value = var.databases
  }

  dynamic "parameter" {
    for_each = var.additional_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-params"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# KMS Key for encryption
resource "aws_kms_key" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_id == null ? 1 : 0

  description             = "KMS key for ElastiCache encryption ${var.cluster_id}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-kms"
    }
  )
}

resource "aws_kms_alias" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.cluster_id}-redis"
  target_key_id = aws_kms_key.redis[0].key_id
}

# Replication Group (for both cluster and non-cluster mode)
resource "aws_elasticache_replication_group" "main" {
  count = !local.is_cluster_mode || var.automatic_failover_enabled ? 1 : 0

  replication_group_id = var.cluster_id
  description          = "Redis replication group for ${var.cluster_id}"

  engine         = "redis"
  engine_version = var.engine_version
  node_type      = var.node_type
  port           = 6379

  # Cluster configuration
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  # Number of nodes
  num_cache_clusters = var.cluster_mode_enabled ? null : var.num_cache_nodes

  # Cluster mode specific

  # High Availability
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  # Backup
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  snapshot_name            = var.final_snapshot_identifier

  # Maintenance
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  notification_topic_arn     = var.notification_topic_arn

  # Security
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  kms_key_id                 = var.at_rest_encryption_enabled ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.redis[0].arn) : null
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.transit_encryption_enabled && var.auth_token != null ? var.auth_token : null
  auth_token_update_strategy = var.transit_encryption_enabled ? var.auth_token_update_strategy : null

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  dynamic "log_delivery_configuration" {
    for_each = var.enable_engine_log ? [1] : []
    content {
      destination      = aws_cloudwatch_log_group.redis_engine[0].name
      destination_type = "cloudwatch-logs"
      log_format       = "json"
      log_type         = "engine-log"
    }
  }

  # Data tiering (for r6gd nodes)
  data_tiering_enabled = var.data_tiering_enabled

  # Other settings
  apply_immediately = var.apply_immediately

  tags = merge(
    local.common_tags,
    var.tags,
    {
      Name = var.cluster_id
    }
  )

  lifecycle {
    ignore_changes = [auth_token]
  }

  depends_on = [
    aws_elasticache_parameter_group.main,
    aws_cloudwatch_log_group.redis_slow
  ]
}

# Standard Cache Cluster (for simple non-replicated setup)
resource "aws_elasticache_cluster" "main" {
  count = !var.cluster_mode_enabled && !var.automatic_failover_enabled && var.num_cache_nodes == 1 ? 1 : 0

  cluster_id      = var.cluster_id
  engine          = "redis"
  engine_version  = var.engine_version
  node_type       = var.node_type
  num_cache_nodes = 1
  port            = 6379

  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  maintenance_window       = var.maintenance_window

  notification_topic_arn = var.notification_topic_arn

  apply_immediately = var.apply_immediately

  tags = merge(
    local.common_tags,
    {
      Name = var.cluster_id
    }
  )

  depends_on = [
    aws_elasticache_parameter_group.main
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "redis_slow" {
  name              = "/aws/elasticache/${var.cluster_id}/slow-log"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-slow-log"
    }
  )
}

resource "aws_cloudwatch_log_group" "redis_engine" {
  count = var.enable_engine_log ? 1 : 0

  name              = "/aws/elasticache/${var.cluster_id}/engine-log"
  retention_in_days = var.log_retention_days

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-engine-log"
    }
  )
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "This metric monitors ElastiCache CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].id : aws_elasticache_cluster.main[0].id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_memory_threshold
  alarm_description   = "This metric monitors ElastiCache memory usage"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].id : aws_elasticache_cluster.main[0].id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "evictions_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-evictions-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.alarm_evictions_threshold
  alarm_description   = "This metric monitors ElastiCache evictions"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].id : aws_elasticache_cluster.main[0].id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.cluster_id}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_connections_threshold
  alarm_description   = "This metric monitors ElastiCache connections"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].id : aws_elasticache_cluster.main[0].id
  }

  tags = local.common_tags
}

# Store auth token in Secrets Manager (if using transit encryption)
resource "aws_secretsmanager_secret" "redis_auth" {
  count = var.transit_encryption_enabled && var.store_auth_token_in_secrets_manager ? 1 : 0

  name_prefix             = "${var.cluster_id}-auth-"
  description             = "Redis auth token for ${var.cluster_id}"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${var.cluster_id}-auth"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  count = var.transit_encryption_enabled && var.store_auth_token_in_secrets_manager ? 1 : 0

  secret_id = aws_secretsmanager_secret.redis_auth[0].id
  secret_string = jsonencode({
    auth_token = var.auth_token
    endpoint   = var.cluster_mode_enabled || var.automatic_failover_enabled ? aws_elasticache_replication_group.main[0].configuration_endpoint_address : aws_elasticache_cluster.main[0].cache_nodes[0].address
    port       = 6379
  })
}