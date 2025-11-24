# ALB Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alb_name" {
  description = "Name of the Application Load Balancer"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ALB will be created"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the ALB (should be public subnets)"
  type        = list(string)
}

variable "internal" {
  description = "Whether the load balancer is internal or internet-facing"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection for the ALB"
  type        = bool
  default     = false
}

variable "idle_timeout" {
  description = "Time in seconds that the connection is allowed to be idle"
  type        = number
  default     = 60
}

# Security
variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# SSL/TLS
variable "certificate_arn" {
  description = "ARN of the default SSL certificate"
  type        = string
  default     = null
}

variable "additional_certificate_arns" {
  description = "Map of additional SSL certificate ARNs"
  type        = map(string)
  default     = {}
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listeners"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

# Access Logs
variable "enable_access_logs" {
  description = "Enable access logs for the ALB"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = null
}

variable "access_logs_prefix" {
  description = "S3 prefix for ALB access logs"
  type        = string
  default     = "alb"
}

# Target Groups
variable "target_groups" {
  description = "Map of target group configurations"
  type = map(object({
    port                 = number
    protocol             = string
    target_type          = string
    deregistration_delay = number
    stickiness_enabled   = bool
    stickiness_duration  = number
    health_check = object({
      healthy_threshold   = number
      unhealthy_threshold = number
      timeout             = number
      interval            = number
      path                = string
      matcher             = string
      protocol            = string
      port                = string
    })
  }))
  default = {}
}

# Listener Rules
variable "listener_rules" {
  description = "Map of listener rule configurations"
  type = map(object({
    priority         = number
    target_group_key = string
    host_headers     = list(string)
    path_patterns    = list(string)
    http_headers = object({
      name   = string
      values = list(string)
    })
    source_ips = list(string)
  }))
  default = {}
}

# WAF
variable "waf_acl_arn" {
  description = "ARN of WAF ACL to associate with the ALB"
  type        = string
  default     = null
}

# CloudWatch Alarms
variable "create_cloudwatch_alarms" {
  description = "Create CloudWatch alarms for the ALB"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

variable "response_time_threshold" {
  description = "Response time threshold for alarm (in seconds)"
  type        = number
  default     = 1
}

variable "error_4xx_threshold" {
  description = "4xx error count threshold for alarm"
  type        = number
  default     = 100
}

variable "error_5xx_threshold" {
  description = "5xx error count threshold for alarm"
  type        = number
  default     = 10
}

# Tags
variable "tags" {
  description = "Additional tags for ALB resources"
  type        = map(string)
  default     = {}
}