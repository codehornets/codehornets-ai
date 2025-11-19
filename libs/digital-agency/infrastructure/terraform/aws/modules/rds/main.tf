# RDS MySQL Module - Production-Ready Configuration

locals {
  is_production = var.environment == "production"

  common_tags = {
    Module      = "rds"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Engine      = "MySQL"
  }
}

# Generate random password if not provided
resource "random_password" "master" {
  count = var.master_password == null ? 1 : 0

  length  = 32
  special = true
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-subnet-group"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.identifier}-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS instance ${var.identifier}"

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-sg"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group Rules
resource "aws_security_group_rule" "rds_ingress" {
  for_each = { for idx, cidr in var.allowed_cidr_blocks : idx => cidr }

  type              = "ingress"
  from_port         = 3306
  to_port           = 3306
  protocol          = "tcp"
  cidr_blocks       = [each.value]
  security_group_id = aws_security_group.rds.id
  description       = "MySQL access from ${each.value}"
}

resource "aws_security_group_rule" "rds_ingress_security_groups" {
  for_each = { for idx, sg_id in var.allowed_security_group_ids : idx => sg_id }

  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.rds.id
  description              = "MySQL access from security group"
}

resource "aws_security_group_rule" "rds_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
  description       = "Allow all outbound traffic"
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.identifier}-params"
  family = var.parameter_family

  # Laravel optimized parameters
  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  parameter {
    name  = "innodb_buffer_pool_size"
    value = var.innodb_buffer_pool_size
  }

  parameter {
    name  = "innodb_log_file_size"
    value = "268435456" # 256MB
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  parameter {
    name  = "log_queries_not_using_indexes"
    value = var.log_queries_not_using_indexes
  }

  parameter {
    name  = "performance_schema"
    value = var.enable_performance_insights ? "1" : "0"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-params"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Option Group
resource "aws_db_option_group" "main" {
  name                     = "${var.identifier}-options"
  option_group_description = "Option group for ${var.identifier}"
  engine_name              = "mysql"
  major_engine_version     = var.major_engine_version

  # Enable audit logging for production
  dynamic "option" {
    for_each = local.is_production ? [1] : []
    content {
      option_name = "MARIADB_AUDIT_PLUGIN"

      option_settings {
        name  = "SERVER_AUDIT_LOGGING"
        value = "ON"
      }

      option_settings {
        name  = "SERVER_AUDIT_EVENTS"
        value = "CONNECT,QUERY,TABLE"
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-options"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# KMS Key for encryption
resource "aws_kms_key" "rds" {
  count = var.storage_encrypted && var.kms_key_id == null ? 1 : 0

  description             = "KMS key for RDS encryption ${var.identifier}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-kms"
    }
  )
}

resource "aws_kms_alias" "rds" {
  count = var.storage_encrypted && var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.identifier}-rds"
  target_key_id = aws_kms_key.rds[0].key_id
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = var.identifier
  engine         = "mysql"
  engine_version = var.engine_version
  instance_class = var.instance_class

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id            = var.storage_encrypted ? (var.kms_key_id != null ? var.kms_key_id : aws_kms_key.rds[0].arn) : null
  iops                  = var.iops
  storage_throughput    = var.storage_throughput

  # Database
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password != null ? var.master_password : random_password.master[0].result
  port     = 3306

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # High Availability
  multi_az          = var.multi_az
  availability_zone = var.multi_az ? null : var.availability_zone

  # Backup
  backup_retention_period   = var.backup_retention_period
  backup_window             = var.backup_window
  maintenance_window        = var.maintenance_window
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  copy_tags_to_snapshot     = true

  # Monitoring
  enabled_cloudwatch_logs_exports       = var.enabled_cloudwatch_logs_exports
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.enable_performance_insights && var.performance_insights_kms_key_id != null ? var.performance_insights_kms_key_id : null
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  # Other settings
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately          = var.apply_immediately
  deletion_protection        = var.deletion_protection
  delete_automated_backups   = var.delete_automated_backups
  ca_cert_identifier         = var.ca_cert_identifier

  tags = merge(
    local.common_tags,
    var.tags,
    {
      Name = var.identifier
    }
  )

  lifecycle {
    ignore_changes = [password]
  }

  depends_on = [
    aws_db_parameter_group.main,
    aws_db_option_group.main
  ]
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${var.identifier}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Read Replicas
resource "aws_db_instance" "read_replica" {
  count = var.create_read_replicas ? var.read_replica_count : 0

  identifier          = "${var.identifier}-read-${count.index + 1}"
  replicate_source_db = aws_db_instance.main.identifier

  # Instance specifications
  instance_class = var.read_replica_instance_class != null ? var.read_replica_instance_class : var.instance_class

  # Storage (inherited from primary, but can be modified)
  storage_encrypted = var.storage_encrypted

  # Network
  publicly_accessible = false

  # Monitoring
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? var.performance_insights_retention_period : null
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  # Other settings
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  skip_final_snapshot        = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-read-${count.index + 1}"
      Type = "read-replica"
    }
  )

  lifecycle {
    ignore_changes = [password]
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_cpu_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_connections_threshold
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space_low" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.identifier}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alarm_free_storage_threshold
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

# Store password in Secrets Manager (optional)
resource "aws_secretsmanager_secret" "rds_password" {
  count = var.store_password_in_secrets_manager ? 1 : 0

  name_prefix             = "${var.identifier}-password-"
  description             = "RDS master password for ${var.identifier}"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${var.identifier}-password"
    }
  )
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  count = var.store_password_in_secrets_manager ? 1 : 0

  secret_id = aws_secretsmanager_secret.rds_password[0].id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = var.master_password != null ? var.master_password : random_password.master[0].result
    engine   = "mysql"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}