# FunnelAgents AWS Infrastructure - Variables
# Multi-service deployment configuration for FunnelAgents platform

# ===========================================================================
# Global Variables
# ===========================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "funnelagents"
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

# ===========================================================================
# FunnelAgents Services Configuration
# ===========================================================================

variable "backend_services" {
  description = "List of NestJS backend microservices"
  type        = list(string)
  default = [
    "api-gateway",
    "auth-service",
    "crm-service",
    "campaigns-service",
    "content-service",
    "agents-service",
    "tasks-service",
    "automations-service",
    "reports-service",
    "worker-runner",
    "scheduler"
  ]
}

variable "service_ports" {
  description = "Port mapping for each service"
  type        = map(number)
  default = {
    "api-gateway"         = 3000
    "auth-service"        = 3001
    "crm-service"         = 3002
    "campaigns-service"   = 3003
    "content-service"     = 3004
    "agents-service"      = 3005
    "tasks-service"       = 3006
    "automations-service" = 3007
    "reports-service"     = 3008
    "worker-runner"       = 3009
    "scheduler"           = 3010
    "web-ui"              = 4200
    "n8n"                 = 5678
  }
}

variable "n8n_workers" {
  description = "List of n8n worker queues for agent orchestration"
  type        = list(string)
  default = [
    "crm",
    "campaigns",
    "content",
    "reports",
    "automations"
  ]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Application = "FunnelAgents"
    ManagedBy   = "Terraform"
  }
}

# ===========================================================================
# Network Configuration
# ===========================================================================

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

# ===========================================================================
# Database Configuration (PostgreSQL)
# ===========================================================================

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
  default     = "funnel_agents"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "funnel_agents_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password (auto-generated if empty)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.1"
}

# ===========================================================================
# Redis Configuration
# ===========================================================================

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

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

# ===========================================================================
# ECS Configuration
# ===========================================================================

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

# ===========================================================================
# Service-specific ECS overrides
# ===========================================================================

variable "service_configs" {
  description = "Per-service configuration overrides"
  type = map(object({
    cpu           = optional(number)
    memory        = optional(number)
    desired_count = optional(number)
    min_capacity  = optional(number)
    max_capacity  = optional(number)
  }))
  default = {
    "api-gateway" = {
      cpu    = 1024
      memory = 2048
    }
    "worker-runner" = {
      cpu    = 1024
      memory = 2048
    }
  }
}

# ===========================================================================
# Container Configuration
# ===========================================================================

variable "container_image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

# ===========================================================================
# Domain Configuration
# ===========================================================================

variable "domain_name" {
  description = "Base domain name for all services"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

# ===========================================================================
# n8n Configuration
# ===========================================================================

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

# ===========================================================================
# JWT Configuration
# ===========================================================================

variable "jwt_secret" {
  description = "JWT secret for authentication (auto-generated if empty)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_expiration" {
  description = "JWT token expiration"
  type        = string
  default     = "1d"
}

# ===========================================================================
# Frontend Configuration
# ===========================================================================

variable "enable_web_ui" {
  description = "Deploy web-ui frontend"
  type        = bool
  default     = true
}

variable "web_ui_cpu" {
  description = "CPU units for web-ui service"
  type        = number
  default     = 256
}

variable "web_ui_memory" {
  description = "Memory for web-ui service in MiB"
  type        = number
  default     = 512
}
