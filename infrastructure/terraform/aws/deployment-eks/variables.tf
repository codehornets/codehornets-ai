# AWS Region
variable "aws_region" {
  description = "AWS region for infrastructure"
  type        = string
  default     = "us-east-1"
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# EKS Configuration
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "krayin-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_groups" {
  description = "EKS node group configuration"
  type = map(object({
    desired_size   = number
    max_size       = number
    min_size       = number
    instance_types = list(string)
    capacity_type  = string
    disk_size      = number
  }))
  default = {
    general = {
      desired_size   = 3
      max_size       = 10
      min_size       = 2
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
      disk_size      = 50
    }
    spot = {
      desired_size   = 2
      max_size       = 20
      min_size       = 0
      instance_types = ["t3.large", "t3a.large"]
      capacity_type  = "SPOT"
      disk_size      = 50
    }
  }
}

# RDS Central Database
variable "central_db_instance_class" {
  description = "RDS instance class for central tenant registry"
  type        = string
  default     = "db.t3.medium"
}

variable "central_db_username" {
  description = "Master username for central database"
  type        = string
  default     = "krayin_admin"
  sensitive   = true
}

variable "central_db_password" {
  description = "Master password for central database"
  type        = string
  sensitive   = true
}

# ElastiCache Redis
variable "redis_node_type" {
  description = "Redis node instance type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 3
}

# S3 Configuration
variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules for cost optimization"
  type = list(object({
    id                       = string
    enabled                  = bool
    transition_days          = number
    transition_storage_class = string
    expiration_days          = number
  }))
  default = [
    {
      id                       = "archive-old-uploads"
      enabled                  = true
      transition_days          = 90
      transition_storage_class = "STANDARD_IA"
      expiration_days          = 365
    }
  ]
}

# Domain Configuration
variable "domain_name" {
  description = "Primary domain name for the CRM"
  type        = string
  default     = "yourcrm.com"
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
