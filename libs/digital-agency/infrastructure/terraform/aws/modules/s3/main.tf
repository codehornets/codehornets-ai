# S3 Module - Production-Ready Multi-Bucket Configuration

locals {
  bucket_suffix = data.aws_caller_identity.current.account_id

  buckets = {
    uploads = {
      name                = "${var.bucket_prefix}-uploads-${var.environment}-${local.bucket_suffix}"
      versioning          = var.enable_versioning
      lifecycle_enabled   = true
      cors_enabled        = true
      public_access_block = true
      intelligent_tiering = true
      replication_enabled = var.enable_cross_region_replication
    }
    backups = {
      name                = "${var.bucket_prefix}-backups-${var.environment}-${local.bucket_suffix}"
      versioning          = true
      lifecycle_enabled   = true
      cors_enabled        = false
      public_access_block = true
      intelligent_tiering = false
      replication_enabled = var.enable_cross_region_replication
    }
    logs = {
      name                = "${var.bucket_prefix}-logs-${var.environment}-${local.bucket_suffix}"
      versioning          = false
      lifecycle_enabled   = true
      cors_enabled        = false
      public_access_block = true
      intelligent_tiering = false
      replication_enabled = false
    }
    static = {
      name                = "${var.bucket_prefix}-static-${var.environment}-${local.bucket_suffix}"
      versioning          = var.enable_versioning
      lifecycle_enabled   = true
      cors_enabled        = true
      public_access_block = false # Allow CloudFront access
      intelligent_tiering = true
      replication_enabled = false
    }
  }

  common_tags = {
    Module      = "s3"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3" {
  count = var.kms_key_id == null ? 1 : 0

  description             = "KMS key for S3 encryption ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.bucket_prefix}-s3-kms-${var.environment}"
    }
  )
}

resource "aws_kms_alias" "s3" {
  count = var.kms_key_id == null ? 1 : 0

  name          = "alias/${var.bucket_prefix}-s3-${var.environment}"
  target_key_id = aws_kms_key.s3[0].key_id
}

# S3 Buckets
resource "aws_s3_bucket" "main" {
  for_each = local.buckets

  bucket = each.value.name

  tags = merge(
    local.common_tags,
    var.tags,
    {
      Name    = each.value.name
      Purpose = each.key
    }
  )

  lifecycle {
    prevent_destroy = false # Set to true for production
  }
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  for_each = local.buckets

  bucket = aws_s3_bucket.main[each.key].id

  versioning_configuration {
    status = each.value.versioning ? "Enabled" : "Disabled"
  }
}

# Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = local.buckets

  bucket = aws_s3_bucket.main[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id != null ? var.kms_key_id : aws_kms_key.s3[0].arn
    }
    bucket_key_enabled = true
  }
}

# Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  for_each = local.buckets

  bucket = aws_s3_bucket.main[each.key].id

  block_public_acls       = each.value.public_access_block
  block_public_policy     = each.value.public_access_block
  ignore_public_acls      = each.value.public_access_block
  restrict_public_buckets = each.value.public_access_block
}

# CORS Configuration (for uploads and static buckets)
resource "aws_s3_bucket_cors_configuration" "main" {
  for_each = { for k, v in local.buckets : k => v if v.cors_enabled }

  bucket = aws_s3_bucket.main[each.key].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id"]
    max_age_seconds = 3600
  }
}

# Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = { for k, v in local.buckets : k => v if v.lifecycle_enabled }

  bucket = aws_s3_bucket.main[each.key].id

  # Intelligent-Tiering for uploads and static content
  dynamic "rule" {
    for_each = each.value.intelligent_tiering ? [1] : []
    content {
      id     = "intelligent-tiering"
      status = "Enabled"

      transition {
        days          = 0
        storage_class = "INTELLIGENT_TIERING"
      }
    }
  }

  # Archive old backups
  dynamic "rule" {
    for_each = each.key == "backups" ? [1] : []
    content {
      id     = "archive-old-backups"
      status = "Enabled"

      transition {
        days          = 30
        storage_class = "STANDARD_IA"
      }

      transition {
        days          = 90
        storage_class = "GLACIER_IR"
      }

      transition {
        days          = 180
        storage_class = "DEEP_ARCHIVE"
      }

      expiration {
        days = var.backup_retention_days
      }
    }
  }

  # Clean up old logs
  dynamic "rule" {
    for_each = each.key == "logs" ? [1] : []
    content {
      id     = "cleanup-old-logs"
      status = "Enabled"

      transition {
        days          = 7
        storage_class = "STANDARD_IA"
      }

      expiration {
        days = var.log_retention_days
      }
    }
  }

  # Clean up incomplete multipart uploads
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Clean up expired object delete markers
  dynamic "rule" {
    for_each = each.value.versioning ? [1] : []
    content {
      id     = "cleanup-expired-markers"
      status = "Enabled"

      expiration {
        expired_object_delete_marker = true
      }
    }
  }

  # Custom lifecycle rules
  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "transition" {
        for_each = rule.value.transition_days != null ? [1] : []
        content {
          days          = rule.value.transition_days
          storage_class = rule.value.transition_storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }
    }
  }
}

# Bucket Policies
resource "aws_s3_bucket_policy" "static" {
  count = var.enable_cloudfront_access ? 1 : 0

  bucket = aws_s3_bucket.main["static"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = var.cloudfront_oai_arn != null ? var.cloudfront_oai_arn : "*"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main["static"].arn}/*"
      }
    ]
  })
}

# Bucket Logging
resource "aws_s3_bucket_logging" "main" {
  for_each = var.enable_access_logging ? { for k, v in local.buckets : k => v if k != "logs" } : {}

  bucket = aws_s3_bucket.main[each.key].id

  target_bucket = aws_s3_bucket.main["logs"].id
  target_prefix = "${each.key}/"
}

# Bucket Metrics
resource "aws_s3_bucket_metric" "main" {
  for_each = var.enable_metrics ? local.buckets : {}

  bucket = aws_s3_bucket.main[each.key].id
  name   = "${each.key}-entire-bucket"
}

# Bucket Inventory
resource "aws_s3_bucket_inventory" "main" {
  for_each = var.enable_inventory ? { for k, v in local.buckets : k => v if k != "logs" } : {}

  bucket = aws_s3_bucket.main[each.key].id
  name   = "EntireBucketInventory"

  included_object_versions = "Current"

  schedule {
    frequency = "Weekly"
  }

  destination {
    bucket {
      bucket_arn = aws_s3_bucket.main["logs"].arn
      prefix     = "inventory/${each.key}"
      format     = "CSV"

      encryption {
        sse_s3 {
          # Uses S3-managed encryption for inventory files
        }
      }
    }
  }

  optional_fields = [
    "Size",
    "LastModifiedDate",
    "StorageClass",
    "ETag",
    "IsMultipartUploaded",
    "ReplicationStatus",
    "EncryptionStatus"
  ]
}

# Replication Configuration (for disaster recovery)
resource "aws_s3_bucket_replication_configuration" "main" {
  for_each = var.enable_cross_region_replication ? { for k, v in local.buckets : k => v if v.replication_enabled } : {}

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main[each.key].id

  rule {
    id     = "replicate-entire-bucket"
    status = "Enabled"

    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = var.replication_destination_bucket_arns[each.key]
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = var.replication_kms_key_id
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# IAM Role for Replication
resource "aws_iam_role" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  name = "${var.bucket_prefix}-s3-replication-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "replication" {
  count = var.enable_cross_region_replication ? 1 : 0

  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [for k, v in local.buckets : aws_s3_bucket.main[k].arn if v.replication_enabled]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [for k, v in local.buckets : "${aws_s3_bucket.main[k].arn}/*" if v.replication_enabled]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [for arn in values(var.replication_destination_bucket_arns) : "${arn}/*"]
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "bucket_size_high" {
  for_each = var.create_cloudwatch_alarms ? local.buckets : {}

  alarm_name          = "${each.value.name}-size-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = "86400" # Daily
  statistic           = "Average"
  threshold           = var.alarm_bucket_size_threshold
  alarm_description   = "This metric monitors S3 bucket size"
  alarm_actions       = var.alarm_actions

  dimensions = {
    BucketName  = aws_s3_bucket.main[each.key].id
    StorageType = "StandardStorage"
  }

  tags = local.common_tags
}

# Bucket Notification Configuration (optional)
resource "aws_s3_bucket_notification" "main" {
  for_each = var.enable_event_notifications ? { for k, v in local.buckets : k => v if k == "uploads" } : {}

  bucket = aws_s3_bucket.main[each.key].id

  dynamic "queue" {
    for_each = var.sqs_queue_arn != null ? [1] : []
    content {
      queue_arn = var.sqs_queue_arn
      events    = ["s3:ObjectCreated:*"]
    }
  }

  dynamic "topic" {
    for_each = var.sns_topic_arn != null ? [1] : []
    content {
      topic_arn = var.sns_topic_arn
      events    = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
    }
  }

  dynamic "lambda_function" {
    for_each = var.lambda_function_arn != null ? [1] : []
    content {
      lambda_function_arn = var.lambda_function_arn
      events              = ["s3:ObjectCreated:*"]
      filter_prefix       = "uploads/"
      filter_suffix       = ".jpg"
    }
  }
}