# RDS Module Outputs

output "db_instance_id" {
  description = "The RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "db_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "The database port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "The master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_password" {
  description = "The master password"
  value       = var.master_password != null ? var.master_password : random_password.master[0].result
  sensitive   = true
}

output "db_security_group_id" {
  description = "The security group ID of the RDS instance"
  value       = aws_security_group.rds.id
}

output "db_subnet_group_name" {
  description = "The DB subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "db_parameter_group_name" {
  description = "The DB parameter group name"
  value       = aws_db_parameter_group.main.name
}

output "db_option_group_name" {
  description = "The DB option group name"
  value       = aws_db_option_group.main.name
}

output "db_instance_class" {
  description = "The RDS instance class"
  value       = aws_db_instance.main.instance_class
}

output "db_engine_version" {
  description = "The engine version"
  value       = aws_db_instance.main.engine_version_actual
}

output "db_allocated_storage" {
  description = "The allocated storage size"
  value       = aws_db_instance.main.allocated_storage
}

output "db_availability_zone" {
  description = "The availability zone of the RDS instance"
  value       = aws_db_instance.main.availability_zone
}

output "db_multi_az" {
  description = "Whether the RDS instance is multi-AZ"
  value       = aws_db_instance.main.multi_az
}

output "db_backup_retention_period" {
  description = "The backup retention period"
  value       = aws_db_instance.main.backup_retention_period
}

output "db_backup_window" {
  description = "The backup window"
  value       = aws_db_instance.main.backup_window
}

output "db_maintenance_window" {
  description = "The maintenance window"
  value       = aws_db_instance.main.maintenance_window
}

output "db_kms_key_id" {
  description = "The KMS key ID used for encryption"
  value       = var.storage_encrypted ? (var.kms_key_id != null ? var.kms_key_id : try(aws_kms_key.rds[0].arn, null)) : null
}

output "db_monitoring_role_arn" {
  description = "The monitoring role ARN"
  value       = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
}

output "read_replica_ids" {
  description = "List of read replica instance IDs"
  value       = aws_db_instance.read_replica[*].id
}

output "read_replica_endpoints" {
  description = "List of read replica endpoints"
  value       = aws_db_instance.read_replica[*].endpoint
  sensitive   = true
}

output "read_replica_addresses" {
  description = "List of read replica addresses"
  value       = aws_db_instance.read_replica[*].address
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the database password"
  value       = var.store_password_in_secrets_manager ? aws_secretsmanager_secret.rds_password[0].arn : null
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret containing the database password"
  value       = var.store_password_in_secrets_manager ? aws_secretsmanager_secret.rds_password[0].name : null
}

output "cloudwatch_log_group_names" {
  description = "List of CloudWatch log group names for RDS logs"
  value       = [for log_type in var.enabled_cloudwatch_logs_exports : "/aws/rds/instance/${aws_db_instance.main.id}/${log_type}"]
}

output "performance_insights_enabled" {
  description = "Whether Performance Insights is enabled"
  value       = aws_db_instance.main.performance_insights_enabled
}

output "enhanced_monitoring_enabled" {
  description = "Whether enhanced monitoring is enabled"
  value       = var.monitoring_interval > 0
}