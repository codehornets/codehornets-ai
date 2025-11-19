# S3 Module Outputs

# Bucket Names
output "bucket_names" {
  description = "Map of bucket purposes to bucket names"
  value       = { for k, v in local.buckets : k => aws_s3_bucket.main[k].id }
}

output "uploads_bucket_name" {
  description = "Name of the uploads bucket"
  value       = aws_s3_bucket.main["uploads"].id
}

output "backups_bucket_name" {
  description = "Name of the backups bucket"
  value       = aws_s3_bucket.main["backups"].id
}

output "logs_bucket_name" {
  description = "Name of the logs bucket"
  value       = aws_s3_bucket.main["logs"].id
}

output "static_bucket_name" {
  description = "Name of the static assets bucket"
  value       = aws_s3_bucket.main["static"].id
}

# Bucket ARNs
output "bucket_arns" {
  description = "Map of bucket purposes to bucket ARNs"
  value       = { for k, v in local.buckets : k => aws_s3_bucket.main[k].arn }
}

output "uploads_bucket_arn" {
  description = "ARN of the uploads bucket"
  value       = aws_s3_bucket.main["uploads"].arn
}

output "backups_bucket_arn" {
  description = "ARN of the backups bucket"
  value       = aws_s3_bucket.main["backups"].arn
}

output "logs_bucket_arn" {
  description = "ARN of the logs bucket"
  value       = aws_s3_bucket.main["logs"].arn
}

output "static_bucket_arn" {
  description = "ARN of the static assets bucket"
  value       = aws_s3_bucket.main["static"].arn
}

# Bucket Domain Names
output "bucket_domain_names" {
  description = "Map of bucket purposes to bucket domain names"
  value       = { for k, v in local.buckets : k => aws_s3_bucket.main[k].bucket_domain_name }
}

output "static_bucket_domain_name" {
  description = "Domain name of the static assets bucket"
  value       = aws_s3_bucket.main["static"].bucket_domain_name
}

# Bucket Regional Domain Names
output "bucket_regional_domain_names" {
  description = "Map of bucket purposes to bucket regional domain names"
  value       = { for k, v in local.buckets : k => aws_s3_bucket.main[k].bucket_regional_domain_name }
}

output "static_bucket_regional_domain_name" {
  description = "Regional domain name of the static assets bucket"
  value       = aws_s3_bucket.main["static"].bucket_regional_domain_name
}

# Bucket IDs
output "bucket_ids" {
  description = "Map of bucket purposes to bucket IDs"
  value       = { for k, v in local.buckets : k => aws_s3_bucket.main[k].id }
}

# KMS Key
output "kms_key_id" {
  description = "KMS key ID used for S3 encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : try(aws_kms_key.s3[0].id, null)
}

output "kms_key_arn" {
  description = "KMS key ARN used for S3 encryption"
  value       = var.kms_key_id != null ? var.kms_key_id : try(aws_kms_key.s3[0].arn, null)
}

output "kms_alias_arn" {
  description = "KMS alias ARN"
  value       = try(aws_kms_alias.s3[0].arn, null)
}

# Versioning Status
output "versioning_status" {
  description = "Map of bucket purposes to versioning status"
  value       = { for k, v in local.buckets : k => aws_s3_bucket_versioning.main[k].versioning_configuration[0].status }
}

# Lifecycle Rules
output "lifecycle_rules" {
  description = "Map of bucket purposes to lifecycle rule IDs"
  value = {
    for k, v in local.buckets : k => [
      for rule in try(aws_s3_bucket_lifecycle_configuration.main[k].rule, []) : rule.id
    ] if v.lifecycle_enabled
  }
}

# Replication
output "replication_role_arn" {
  description = "IAM role ARN for S3 replication"
  value       = var.enable_cross_region_replication ? aws_iam_role.replication[0].arn : null
}

output "replication_configuration" {
  description = "Map of bucket purposes to replication configuration"
  value = {
    for k, v in local.buckets : k => try(aws_s3_bucket_replication_configuration.main[k].rule, null)
    if v.replication_enabled && var.enable_cross_region_replication
  }
}

# CloudWatch Alarms
output "cloudwatch_alarm_names" {
  description = "Map of bucket purposes to CloudWatch alarm names"
  value = {
    for k, v in local.buckets : k => aws_cloudwatch_metric_alarm.bucket_size_high[k].alarm_name
    if var.create_cloudwatch_alarms
  }
}

# Access Logging
output "access_logging_target_bucket" {
  description = "Target bucket for access logs"
  value       = var.enable_access_logging ? aws_s3_bucket.main["logs"].id : null
}

# Inventory
output "inventory_configurations" {
  description = "Map of bucket purposes to inventory configuration names"
  value = {
    for k, v in local.buckets : k => aws_s3_bucket_inventory.main[k].name
    if var.enable_inventory && k != "logs"
  }
}

# Public Access Block Settings
output "public_access_block_settings" {
  description = "Map of bucket purposes to public access block settings"
  value = {
    for k, v in local.buckets : k => {
      block_public_acls       = aws_s3_bucket_public_access_block.main[k].block_public_acls
      block_public_policy     = aws_s3_bucket_public_access_block.main[k].block_public_policy
      ignore_public_acls      = aws_s3_bucket_public_access_block.main[k].ignore_public_acls
      restrict_public_buckets = aws_s3_bucket_public_access_block.main[k].restrict_public_buckets
    }
  }
}

# CORS Configuration
output "cors_rules" {
  description = "Map of bucket purposes to CORS rules"
  value = {
    for k, v in local.buckets : k => try(aws_s3_bucket_cors_configuration.main[k].cors_rule, null)
    if v.cors_enabled
  }
}

# Region
output "region" {
  description = "AWS region where buckets are created"
  value       = data.aws_region.current.name
}

# Account ID
output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}