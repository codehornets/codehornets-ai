# HandyMate AWS ECS - Variables

# Global Variables
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "handymate"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "app_modules" {
  description = "List of CRM application modules"
  type        = list(string)
  default     = ["developer", "dancer", "painter", "driver", "influencer", "hunter", "seller", "trader"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB for autoscaling"
  type        = number
  default     = 500
}

variable "db_name" {
  description = "Main database name"
  type        = string
  default     = "handymate"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "handymate_admin"
  sensitive   = true
}

# Note: db_password is now auto-generated via random_password resource
# and stored in AWS Secrets Manager for security

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

# ECS Configuration
variable "ecs_cpu" {
  description = "Default CPU units for ECS tasks (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "ecs_memory" {
  description = "Default memory for ECS tasks in MiB"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks per service"
  type        = number
  default     = 1
}

variable "ecs_min_capacity" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 4
}

# Container Configuration
variable "container_image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

# Domain Configuration
variable "domain_name" {
  description = "Base domain name for all services"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

# n8n Configuration
variable "n8n_encryption_key" {
  description = "n8n encryption key (auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "n8n_cpu" {
  description = "CPU units for n8n main service"
  type        = number
  default     = 1024
}

variable "n8n_memory" {
  description = "Memory for n8n main service in MiB"
  type        = number
  default     = 2048
}

variable "n8n_worker_cpu" {
  description = "CPU units for n8n worker services"
  type        = number
  default     = 512
}

variable "n8n_worker_memory" {
  description = "Memory for n8n worker services in MiB"
  type        = number
  default     = 1024
}

# Module-specific overrides
variable "module_configs" {
  description = "Per-module configuration overrides"
  type = map(object({
    cpu           = optional(number)
    memory        = optional(number)
    desired_count = optional(number)
    min_capacity  = optional(number)
    max_capacity  = optional(number)
  }))
  default = {}
}
