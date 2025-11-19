# S3 Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "painterflow"
}

variable "enable_versioning" {
  description = "Enable versioning for buckets"
  type        = bool
  default     = false
}

variable "kms_key_id" {
  description = "KMS key ID for S3 encryption (if not provided, a new one will be created)"
  type        = string
  default     = null
}

# Lifecycle Configuration
variable "lifecycle_rules" {
  description = "Additional lifecycle rules for S3 buckets"
  type = list(object({
    id                       = string
    enabled                  = bool
    transition_days          = number
    transition_storage_class = string
    expiration_days          = number
  }))
  default = []
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 365
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

# CORS Configuration
variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

# CloudFront Integration
variable "enable_cloudfront_access" {
  description = "Enable CloudFront access to static bucket"
  type        = bool
  default     = false
}

variable "cloudfront_oai_arn" {
  description = "CloudFront Origin Access Identity ARN"
  type        = string
  default     = null
}

# Logging and Monitoring
variable "enable_access_logging" {
  description = "Enable S3 access logging"
  type        = bool
  default     = true
}

variable "enable_metrics" {
  description = "Enable S3 metrics"
  type        = bool
  default     = true
}

variable "enable_inventory" {
  description = "Enable S3 inventory"
  type        = bool
  default     = false
}

# Replication
variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_destination_bucket_arns" {
  description = "Map of bucket names to destination bucket ARNs for replication"
  type        = map(string)
  default     = {}
}

variable "replication_kms_key_id" {
  description = "KMS key ID for replication encryption"
  type        = string
  default     = null
}

# Event Notifications
variable "enable_event_notifications" {
  description = "Enable S3 event notifications"
  type        = bool
  default     = false
}

variable "sqs_queue_arn" {
  description = "SQS queue ARN for S3 notifications"
  type        = string
  default     = null
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for S3 notifications"
  type        = string
  default     = null
}

variable "lambda_function_arn" {
  description = "Lambda function ARN for S3 notifications"
  type        = string
  default     = null
}

# CloudWatch Alarms
variable "create_cloudwatch_alarms" {
  description = "Create CloudWatch alarms for S3 buckets"
  type        = bool
  default     = true
}

variable "alarm_bucket_size_threshold" {
  description = "Bucket size threshold for alarm (in bytes)"
  type        = number
  default     = 107374182400 # 100GB
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

# Tags
variable "tags" {
  description = "Additional tags for S3 resources"
  type        = map(string)
  default     = {}
}